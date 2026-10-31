#!/usr/bin/env python3
"""JoshRS cross-source *metadata* harvester; no game content or live changes.

Reuses the existing content factory's source registry and allowed-path gate.
Every external endpoint is fixed to a trusted host; no remote file bodies are fetched.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

import factory

ROOT = Path(__file__).resolve().parent
HOSTS = frozenset({'api.github.com', 'gitlab.com', 'huggingface.co', 'archive.openrs2.org'})
MAX_RESPONSE = 12_000_000
MAX_RECORDS = 300
MAX_STORED_PER_SOURCE = 12000
SHA = re.compile(r'^[0-9a-f]{40}$')


def fetch(url: str):
    """Read bounded public JSON from allowlisted APIs; never fetch source/assets."""
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or parts.hostname not in HOSTS or parts.username or parts.password or parts.port:
        raise ValueError('unapproved API host or protocol')
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': 'JoshRS-Metadata-Harvest/1.0'})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            raise ValueError('redirect not allowed')
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(request, timeout=20) as response:
        if urllib.parse.urlsplit(response.geturl()).hostname not in HOSTS:
            raise ValueError('redirect outside approved hosts')
        data = response.read(MAX_RESPONSE + 1)
        if len(data) > MAX_RESPONSE:
            raise ValueError('JSON response exceeded size limit')
        return json.loads(data), dict(response.headers)


def get(url: str, reader=fetch):
    result = reader(url)
    return result if isinstance(result, tuple) else (result, {})


def identity(kind, repo, revision, path, sha):
    return hashlib.sha256(f'{kind}:{repo}:{revision}:{path}:{sha}'.encode()).hexdigest()[:20]


def record(key, kind, repo, rev, path, blob=None, era='unknown', origin='public'):
    """Provenance only. File existence is never an implementation or licence grant."""
    return {'id': identity(kind, repo, rev, path, blob or ''), 'source': key, 'source_kind': kind,
            'repository': repo, 'source_revision': rev, 'path': path, 'blob_sha': blob,
            'source_era': era, 'origin': origin, 'classification': 'reference_unverified',
            'rights_cleared': False, 'compatible_377': False, 'missing_in_active_game': None,
            'prepared': False, 'installed': False, 'playable_verified': False}


def allowed_metadata_path(path):
    """A map *filename* may be indexed; map bodies and assets are always excluded."""
    if not isinstance(path, str) or len(path) > 240 or '\x00' in path:
        return False
    if factory.allowed_path(path):
        return True
    parts = path.split('/')
    return (len(parts) >= 2 and len(parts) <= 6 and parts[0] == 'maps'
            and path.endswith('.jm2') and all(x not in ('', '.', '..') and not x.startswith('.') for x in parts))


def github(source, state=None, reader=fetch, limit=MAX_RECORDS):
    repo = source['repo']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo):
        raise ValueError('bad GitHub repository')
    ref = urllib.parse.quote(source['ref'], safe='')
    api = f'https://api.github.com/repos/{repo}'
    commit, _ = get(f'{api}/commits/{ref}', reader)
    sha = commit.get('sha', '')
    tree_sha = (commit.get('commit') or {}).get('tree', {}).get('sha', '')
    if not SHA.fullmatch(sha) or not SHA.fullmatch(tree_sha):
        raise ValueError('missing exact GitHub revision')
    tree, _ = get(f'{api}/git/trees/{tree_sha}?recursive=1', reader)
    if tree.get('truncated') or not isinstance(tree.get('tree'), list):
        raise ValueError('incomplete GitHub tree; refusing misleading inventory')
    paths = sorted((r for r in tree['tree'] if r.get('type') == 'blob' and
                    allowed_metadata_path(r.get('path', '')) and SHA.fullmatch(r.get('sha', ''))),
                   key=lambda r: r['path'])
    offset = int(state.get('offset', 0)) if state and state.get('revision') == sha else 0
    if offset >= len(paths): offset = 0
    next_offset = offset + limit if offset + limit < len(paths) else 0
    return {'source': source['key'], 'revision': sha, 'complete_tree': True,
            'matching_paths': len(paths), 'records': [record(source['key'], 'github', repo, sha, x['path'], x['sha'], source['era']) for x in paths[offset:offset+limit]],
            'remaining': max(0, len(paths) - (offset+limit)), 'next_offset': next_offset}


def gitlab(source, state=None, reader=fetch, per_page=100, max_pages=2):
    """Bounded pageable GitLab tree; incomplete pages are explicitly flagged."""
    repo = source['repo']
    slug = urllib.parse.quote(repo, safe='')
    api = f'https://gitlab.com/api/v4/projects/{slug}/repository'
    ref = urllib.parse.quote(source.get('ref', 'master'), safe='')
    commit, _ = get(f'{api}/commits/{ref}', reader)
    sha = commit.get('id', '')
    if not SHA.fullmatch(sha):
        raise ValueError('GitLab revision is not pinned')
    start = state.get('page', 1) if state and state.get('revision') == sha else 1
    page = start
    records = []
    for _ in range(max_pages):
        rows, headers = get(f'{api}/tree?ref={sha}&recursive=true&per_page={per_page}&page={page}', reader)
        if not isinstance(rows, list):
            raise ValueError('invalid GitLab tree response')
        for x in rows:
            path, blob = x.get('path', ''), x.get('id', '')
            if x.get('type') == 'blob' and allowed_metadata_path(path) and SHA.fullmatch(blob):
                records.append(record(source['key'], 'gitlab', repo, sha, path, blob, source['era']))
        next_page = headers.get('X-Next-Page', headers.get('x-next-page', '')).strip()
        if next_page and (not next_page.isdigit() or int(next_page) <= page):
            raise ValueError('invalid GitLab pagination')
        if not next_page and len(rows) < per_page:
            return {'source': source['key'], 'revision': sha, 'complete_tree': start == 1,
                    'records': records, 'next_page': None}
        page = int(next_page) if next_page else page + 1
    return {'source': source['key'], 'revision': sha, 'complete_tree': False,
            'records': records, 'next_page': page}


def huggingface(source, reader=fetch):
    repo = source['repo']
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', repo):
        raise ValueError('bad dataset name')
    obj, _ = get(f'https://huggingface.co/api/datasets/{repo}', reader)
    sha = obj.get('sha', '')
    if not SHA.fullmatch(sha):
        raise ValueError('unversioned Hugging Face dataset')
    siblings = obj.get('siblings', [])
    if not isinstance(siblings, list):
        raise ValueError('invalid dataset index')
    # Dataset file *names* only; never fetch database contents or dialogue.
    rows = [record(source['key'], 'huggingface', repo, sha, x['rfilename'], None, source['era'])
            for x in siblings if isinstance(x.get('rfilename'), str) and allowed_metadata_path(x['rfilename'])]
    return {'source': source['key'], 'revision': sha, 'records': rows[:MAX_RECORDS],
            'remaining': max(0, len(rows)-MAX_RECORDS), 'downloaded_data': False}


def openrs2(source, reader=fetch):
    obj, _ = get('https://archive.openrs2.org/caches.json', reader)
    if not isinstance(obj, list):
        raise ValueError('invalid OpenRS2 cache list')
    matches = [r for r in obj if r.get('id') == 2696 and r.get('game') == 'runescape']
    if len(matches) != 1:
        raise ValueError('OpenRS2 target cache not found uniquely')
    cache = matches[0]
    if not any(x.get('major') == 377 for x in cache.get('builds', [])):
        raise ValueError('cache ID not identified with revision 377')
    # Only aggregate provenance; no XTEA keys, source identities or binary assets.
    return {'source': source['key'], 'revision': '377', 'records': [],
            'cache_metadata': {x: cache.get(x) for x in ('id','game','valid_indexes','indexes','valid_groups','groups','timestamp')},
            'downloaded_cache': False}


def drive_manifest(path):
    """Optional *private* sanitized Drive export: aggregate only, never return paths or IDs."""
    value = json.loads(Path(path).read_text(encoding='utf-8'))
    rows = value.get('files')
    if value.get('schema') != 1 or not isinstance(rows, list) or len(rows) > 10000:
        raise ValueError('invalid private manifest')
    types = {}
    for row in rows:
        kind = row.get('kind')
        if kind not in {'script','configuration','map-source','quest-reference'}:
            raise ValueError('unapproved private Drive resource kind')
        types[kind] = types.get(kind, 0) + 1
    return {'source': 'private-drive377', 'private_only': True, 'counts': types,
            'metadata_only': True, 'published_private_files': 0, 'records': []}


def write_json_atomic(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix='.harvest-', suffix='.tmp', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as out:
            json.dump(value, out, ensure_ascii=False, indent=2, sort_keys=True)
            out.write('\n')
        os.replace(temp, path)
    finally:
        if os.path.exists(temp): os.unlink(temp)


def run(sources, output: Path, wanted=None, reader=fetch, drive=None):
    output = Path(output)
    old = json.loads((output/'state.json').read_text()) if (output/'state.json').exists() else {}
    results, state, errors = [], dict(old), {}
    available = {s['key']: s for s in sources}
    available.update({
        '2009scape-gitlab': {'key':'2009scape-gitlab','repo':'2009scape/2009scape','ref':'master','era':'2009'},
        '2009scape-hf': {'key':'2009scape-hf','repo':'arsalan-anwari/2009scape-wiki-api-data','era':'2009'},
        'openrs2-377': {'key':'openrs2-377','era':'377'}})
    selection = wanted or list(available)
    for key in selection:
        source = available.get(key)
        if source is None:
            errors[key] = 'unknown source key'; continue
        try:
            if key == '2009scape-gitlab': result = gitlab(source, state.get(key), reader)
            elif key == '2009scape-hf': result = huggingface(source, reader)
            elif key == 'openrs2-377': result = openrs2(source, reader)
            else: result = github(source, state.get(key), reader)
            # Privacy and safety metadata kept explicit in every result.
            result.update({'auto_import': False, 'rights_cleared': False,
                           'gameplay_verified': False, 'private_data_published': False})
            results.append(result)
            state[key] = {'revision': result['revision'], 'page': result.get('next_page') or 1,
                          'offset': result.get('next_offset', 0), 'last_scan_complete': result.get('complete_tree', True)}
        except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            errors[key] = str(exc)[:240]
    if drive:
        try: results.append(drive_manifest(drive))
        except (OSError, ValueError, TypeError): errors['private-drive377'] = 'private manifest unavailable or invalid (details withheld)'
    if not results:
        raise RuntimeError('No source succeeded; existing outputs preserved. '+str(errors))
    # Merge the current bounded scan with previous records from the SAME revision;
    # keep prior sources when an API fails and never silently call a partial tree complete.
    previous = json.loads((output/'catalog.json').read_text()) if (output/'catalog.json').exists() else {}
    old_sources = {x['source']: x for x in previous.get('sources', [])}
    merged = dict(old_sources)
    for result in results:
        key = result['source']
        prior = old_sources.get(key, {})
        if prior.get('revision') == result.get('revision') and not result.get('private_only'):
            existing = {x['id']: x for x in prior.get('records', [])}
            existing.update({x['id']: x for x in result['records']})
            result['records'] = sorted(existing.values(), key=lambda x: (x['path'], x['id']))[:MAX_STORED_PER_SOURCE]
            result['complete_tree'] = bool(prior.get('complete_tree') or result.get('complete_tree'))
        merged[key] = result
    output.mkdir(parents=True, exist_ok=True)
    write_json_atomic(output/'catalog.json', {'schema': 1, 'target': 'JoshRS rev377',
        'sources': [merged[k] for k in sorted(merged)], 'errors': errors, 'gameplay_verified': False,
        'disclaimer': 'Public source metadata, not installable content or game rights.'})
    write_json_atomic(output/'state.json', state)
    return {'sources_succeeded': len(results), 'sources_failed': len(errors),
            'candidate_records': sum(len(x['records']) for x in results),
            'errors': errors, 'installed_content': 0}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output', type=Path, default=ROOT/'generated'/'multi-source')
    ap.add_argument('--source', action='append', help='repeatable source key; default all')
    ap.add_argument('--drive-manifest', type=Path, help='PRIVATE locally prepared schema-1 manifest; aggregate only')
    args = ap.parse_args(argv)
    sources = json.loads((ROOT/'sources.json').read_text(encoding='utf-8'))
    result = run(sources, args.output, args.source, drive=args.drive_manifest)
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    try: main()
    except (ValueError, RuntimeError, OSError) as exc:
        print('Harvest blocked: '+str(exc), file=sys.stderr)
        raise SystemExit(1)
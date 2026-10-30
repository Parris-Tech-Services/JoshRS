#!/usr/bin/env python3
"""Revision-377 provenance-first discovery and owned-content preparation.

Never downloads, vendors, executes or redistributes upstream source or Jagex assets.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent
MAX_BATCH = 100
MAX_RECORDED = 3000
EXTENSIONS = {'.rs2', '.ts', '.tsx', '.kt', '.java', '.py', '.json', '.yml', '.yaml', '.toml', '.npc', '.obj', '.loc', '.seq', '.pack'}
EXCLUDE = {'node_modules', 'vendor', 'dist', 'build', '.git', '.github', 'assets', 'sprites', 'textures', 'models', 'maps', 'cache', 'audio', 'music', 'songs', 'sound', 'images', 'media', 'fonts', 'generated', 'nonfree', 'third_party'}
SAFE_NAME = re.compile(r'^[a-z][a-z0-9_-]{1,63}$')
SAFE_DESC = re.compile(r'^[\w ,.!?:;()\-/\']{1,200}$')


def put_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + '\n', encoding='utf-8')


def read_json(path: Path, fallback: object) -> object:
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else fallback


def gh(path: str) -> dict:
    req = urllib.request.Request('https://api.github.com/' + path, headers={
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'JoshRS-377-Content-Factory/1.0',
        **({'Authorization': 'Bearer ' + os.environ['GH_TOKEN']} if os.environ.get('GH_TOKEN') else {})})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.load(resp)


def allowed_path(path: str) -> bool:
    p = Path(path)
    return len(p.parts) <= 12 and not any(s.lower() in EXCLUDE or s.startswith('.') for s in p.parts) and p.suffix.lower() in EXTENSIONS


def category(path: str, source: dict) -> str:
    p = path.lower()
    if source['policy'] == 'metadata_only':
        return 'blocked_reference_only'
    if p.endswith(('.npc', '.obj', '.loc', '.seq', '.pack')):
        return 'rights_review_required'
    if source['era'] != '377':
        return 'manual_port_required'
    return 'agent_review_required'


def candidate(repo: str, tree_sha: str, entry: dict, source: dict, commit_sha: str | None = None) -> dict:
    path = entry['path']
    key = hashlib.sha256(f"{repo}:{tree_sha}:{path}:{entry['sha']}".encode()).hexdigest()[:20]
    return {'id': key, 'source': source['key'], 'repo': repo,
            'path': path, 'blob_sha': entry['sha'], 'source_tree_sha': tree_sha,
            'url': f"https://github.com/{repo}/blob/{commit_sha or source.get('ref', tree_sha)}/{urllib.parse.quote(path, safe='/')}",
            'source_commit_sha': commit_sha,
            'status': category(path, source), 'target': 'JoshRS 377-wip',
            'native_runtime_verified': False, 'rights_cleared_for_redistribution': False}


def select_batch(entries: list, offset: int, size: int = MAX_BATCH) -> tuple[list, int]:
    valid = sorted((e for e in entries if e.get('type') == 'blob' and isinstance(e.get('sha'), str) and allowed_path(e.get('path', ''))), key=lambda e: e['path'])
    if not valid:
        return [], 0
    i = offset if offset < len(valid) else 0
    chunk = valid[i:i + size]
    return chunk, (i + len(chunk)) % len(valid)


def normalize_owned(entry: dict) -> dict:
    if not isinstance(entry, dict) or entry.get('kind') not in ('npc', 'item', 'quest', 'location'):
        raise ValueError('kind must be npc, item, quest, or location')
    if not isinstance(entry.get('key'), str) or not SAFE_NAME.fullmatch(entry['key']):
        raise ValueError('invalid key')
    if not isinstance(entry.get('name'), str) or not 1 <= len(entry['name']) <= 80 or any(c in entry['name'] for c in '\r\n<>'):
        raise ValueError('invalid name')
    if not isinstance(entry.get('description'), str) or not SAFE_DESC.fullmatch(entry['description']):
        raise ValueError('invalid description')
    if entry.get('origin') != 'original_user_authored':
        raise ValueError('only original user-authored content may be converted automatically')
    # No borrowed RuneScape objects, dialogue, graphics, maps, music or other assets.
    permitted = {'kind', 'key', 'name', 'description', 'origin'}
    if set(entry) - permitted:
        raise ValueError('unsupported fields: refusing to copy unreviewed data')
    return {k: entry[k] for k in ('kind', 'key', 'name', 'description')}


def convert_owned(intake: Path, out: Path) -> int:
    prepared = []
    for path in sorted(intake.glob('*.json')):
        document = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(document, dict) or document.get('schema') != 1 or not isinstance(document.get('entries'), list):
            raise ValueError(f'{path.name}: invalid document schema')
        if len(document['entries']) > 200:
            raise ValueError(f'{path.name}: too many entries')
        for entry in document['entries']:
            content = normalize_owned(entry)
            content['id'] = hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()[:20]
            content['source_file'] = path.name
            content['stage'] = 'portable_spec_only_not_compiled'
            prepared.append(content)
    ids = [e['key'] for e in prepared]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate original content keys')
    put_json(out, {'format': 'joshrs-377-original-content-spec-v1', 'requires_runtime_adapter': True,
                   'compiled_in_377': False, 'entries': prepared})
    return len(prepared)


def scan(registry: list, dest: Path, batch_size: int, discover: bool) -> dict:
    state_path = dest / 'state.json'
    state = read_json(state_path, {})
    packs = {}
    errors = {}
    checked = 0
    for source in registry:
        repo, ref = source['repo'], source['ref']
        try:
            revision = gh('repos/' + repo + '/commits/' + urllib.parse.quote(ref, safe=''))
            if not revision.get('sha'):
                raise ValueError('source revision could not be resolved')
            tree = gh('repos/' + repo + '/git/trees/' + revision['sha'] + '?recursive=1')
            if tree.get('truncated'):
                raise ValueError('GitHub tree truncated; cannot guarantee systematic inventory')
            if not isinstance(tree.get('tree'), list) or not tree.get('sha'):
                raise ValueError('missing source tree data')
            old = state.get(source['key'], {})
            cursor = old.get('cursor', 0) if old.get('tree_sha') == tree['sha'] else 0
            batch, next_cursor = select_batch(tree['tree'], cursor, batch_size)
            existing = read_json(dest / 'packs' / (source['key'] + '.json'), {'candidates': []})
            records = {r['id']: r for r in existing.get('candidates', [])} if old.get('tree_sha') == tree['sha'] else {}
            for entry in batch:
                r = candidate(repo, tree['sha'], entry, source, revision['sha'])
                records[r['id']] = r
            records = dict(sorted(records.items(), key=lambda kv: (kv[1]['path'], kv[0])))
            if len(records) > MAX_RECORDED:
                # Rolling bounded staging: advance the cursor even for huge repositories.
                # Older entries can be rediscovered on the next completed inventory pass.
                records = dict(list(records.items())[-MAX_RECORDED:])
            packs[source['key']] = {'source': source, 'tree_sha': tree['sha'], 'commit_sha': revision['sha'], 'candidate_total': len(records),
                                    'cursor': next_cursor, 'candidates': list(records.values())}
            state[source['key']] = {'cursor': next_cursor, 'tree_sha': tree['sha'], 'complete_pass': next_cursor == 0}
            checked += 1
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
            errors[source['key']] = str(exc)[:300]
    if checked == 0:
        raise RuntimeError('All upstream discovery sources failed. Existing results left unchanged.')
    for name, value in packs.items():
        put_json(dest / 'packs' / (name + '.json'), value)
    put_json(state_path, state)
    index = [{'key': s['key'], 'repo': s['repo'], 'era': s['era'], 'policy': s['policy'],
              'total_catalogued': packs[s['key']]['candidate_total'] if s['key'] in packs else None,
              'error': errors.get(s['key'])} for s in registry]
    extra = discover_public_repos() if discover else []
    put_json(dest / 'catalog.json', {'format': 1, 'target': 'JoshRS 377', 'sources': index,
                                    'discovered_untrusted_repositories': extra, 'errors': errors,
                                    'notice': 'Inventory and provenance only; not imported, licensed or runtime-tested.'})
    return {'checked': checked, 'errors': errors, 'discovered': len(extra)}


def discover_public_repos() -> list:
    found = {}
    queries = ['runescape 377 server in:description,readme', 'runescape 2006 content in:description,readme']
    for q in queries:
        try:
            data = gh('search/repositories?q=' + urllib.parse.quote(q) + '&per_page=8')
            for row in data.get('items', []):
                name = row.get('full_name', '')
                if '/' not in name or row.get('archived') or row.get('fork'):
                    continue
                found[name] = {'repo': name, 'url': row.get('html_url'), 'license_spdx': (row.get('license') or {}).get('spdx_id'),
                               'status': 'untrusted_discovery_metadata_only', 'note': 'Explicit rights and code review needed before use'}
        except (urllib.error.URLError, TimeoutError, ValueError):
            continue
    return [found[k] for k in sorted(found)]


def prepare_agent_queue(dest: Path, max_tasks: int = 100) -> dict:
    """Produce safe work orders, never executable patches or automatic imports."""
    records = []
    for path in sorted((dest / 'packs').glob('*.json')):
        pack = read_json(path, {'candidates': []})
        records.extend(pack.get('candidates', []))
    rank = {'agent_review_required': 0, 'manual_port_required': 1,
            'rights_review_required': 2, 'blocked_reference_only': 3}
    records.sort(key=lambda row: (rank.get(row['status'], 9),
                                  0 if row['source'] == 'lostcity-content-377' else 1,
                                  row['repo'], row['path']))
    tasks = []
    for row in records[:max_tasks]:
        blocked = row['status'] in ('rights_review_required', 'blocked_reference_only')
        tasks.append({'work_id': '377-' + row['id'], 'candidate_id': row['id'],
                      'source': row['repo'], 'path': row['path'], 'reference_url': row['url'],
                      'status': 'blocked_rights_review' if blocked else 'awaiting_agent_review',
                      'source_commit_sha': row.get('source_commit_sha'),
                      'implementation_instructions': [
                          'Verify licence and provenance; do not import Jagex-owned assets',
                          'Compare pinned 377 engine/content/client and local user customisations',
                          'Create or port only rights-cleared 377-compatible source scripts and configs',
                          'Repack and compile; test gameplay and save safety in the local client',
                          'Record verified proof or mark blocked; never claim untested work as ready'],
                      'playable_in_377': False, 'automatically_installed': False})
    queue = {'schema': 1, 'target': 'JoshRS local 377-wip',
             'note': 'Work orders only. Agents must implement and test; zero third-party assets copied.',
             'tasks': tasks}
    put_json(dest / 'agent-work-orders.json', queue)
    return queue


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--live', action='store_true', help='inventory pinned/approved public sources via API')
    parser.add_argument('--discover', action='store_true', help='identify additional untrusted repos; metadata only')
    parser.add_argument('--batch-size', type=int, default=MAX_BATCH)
    parser.add_argument('--output', type=Path, default=ROOT / 'generated')
    args = parser.parse_args()
    if not 1 <= args.batch_size <= 100:
        parser.error('batch-size must be 1..100')
    n = convert_owned(ROOT / 'intake', args.output / 'original-content-specs.json')
    print(f'Converted {n} original user-authored records to integration specifications (NOT native 377 packs).')
    if args.live:
        sources = json.loads((ROOT / 'sources.json').read_text(encoding='utf-8'))
        result = scan(sources, args.output, args.batch_size, args.discover)
        print(json.dumps(result, sort_keys=True))
    else:
        print('Offline mode: upstream discovery skipped.')
    tasks = prepare_agent_queue(args.output)
    print(f'Prepared {len(tasks["tasks"])} non-executable agent work orders.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, json.JSONDecodeError) as e:
        print('Factory failed closed: ' + str(e), file=sys.stderr)
        raise SystemExit(1)

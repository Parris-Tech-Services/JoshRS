#!/usr/bin/env python3
"""Fail-closed metadata-only evidence gate for JoshRS revision-377 candidates.

This tool never fetches sources, reads private runtime data, compiles or installs content.
Run: python content-factory/harvest_evidence.py path/to/ledger.json
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

SCHEMA = 'joshrs-rev377-candidate-v1'
STAGES = ('discovered', 'source_traced', 'gap_confirmed', 'original_pack_prepared',
          'static_validated', 'compiled_disposable', 'Agy_handoff',
          'client_verified', 'persistent_playable')
CLASSES = {'existing_working', 'existing_unverified', 'dispatcher_or_pack_regression',
           'missing_confirmed', 'modern_optional', 'rights_blocked', 'unknown'}
CHECKS = {'rights', 'static', 'compiler', 'client', 'persistence'}
FORBIDDEN = ('drive.google.com', 'docs.google.com', 'db.sqlite', '.sav',
             'elrothiro', 'authorization:', 'ghp_', 'github_pat_')
SHA = re.compile(r'^[0-9a-f]{40}$')


def validate(doc: object) -> list[str]:
    """Return actionable errors; a green result is NOT proof of gameplay."""
    errors: list[str] = []
    if not isinstance(doc, dict) or doc.get('schema') != SCHEMA or doc.get('target_revision') != 377:
        return ['Ledger must declare exact rev377 schema and target_revision=377']
    records = doc.get('candidates')
    if not isinstance(records, list) or not records:
        return ['Expected a nonempty candidates list']
    keys: set[str] = set()
    ids: set[tuple[str, int]] = set()
    for i, r in enumerate(records):
        tag = f'candidate[{i}]'
        if not isinstance(r, dict):
            errors.append(f'{tag}: expected object')
            continue
        key = r.get('key')
        if not isinstance(key, str) or not key or key in keys:
            errors.append(f'{tag}: key missing or duplicated')
        else:
            keys.add(key)
        stage, classification = r.get('stage'), r.get('classification')
        if stage not in STAGES or classification not in CLASSES:
            errors.append(f'{tag}: invalid stage or classification')
            continue
        source, target, evidence = (r.get(k) for k in ('source', 'target', 'evidence'))
        checks, handoff = r.get('checks'), r.get('handoff')
        if not all(isinstance(v, dict) for v in (source, target, evidence, checks, handoff)):
            errors.append(f'{tag}: missing source/target/evidence/checks/handoff object')
            continue
        public_url, path, commit, blob = (source.get(k) for k in ('url','path','commit','blob_sha'))
        parsed = urlparse(public_url) if isinstance(public_url, str) else None
        if not parsed or parsed.scheme != 'https' or parsed.netloc not in {'github.com', 'gitlab.com'}:
            errors.append(f'{tag}: source URL must be a recognised public HTTPS repository')
        if not isinstance(path, str) or path.startswith('/') or '..' in Path(path).parts:
            errors.append(f'{tag}: source path must be repository-relative')
        if not isinstance(commit, str) or not SHA.fullmatch(commit):
            errors.append(f'{tag}: exact 40-character source commit required')
        if not isinstance(blob, str) or not SHA.fullmatch(blob):
            errors.append(f'{tag}: exact pinned blob SHA required')
        if source.get('licence_review') not in {'unresolved', 'cleared', 'blocked'}:
            errors.append(f'{tag}: licence review must be explicit')
        if target.get('revision') != 377 or target.get('entity_type') not in {'npc','quest','loc','map','shop'}:
            errors.append(f'{tag}: invalid revision/entity type')
        nid = target.get('id377')
        if nid is not None:
            if not isinstance(nid, int) or isinstance(nid, bool) or nid < 0:
                errors.append(f'{tag}: id377 must be null or verified nonnegative integer')
            else:
                identity = (target['entity_type'], nid)
                if identity in ids:
                    errors.append(f'{tag}: duplicated 377 entity ID {nid}')
                ids.add(identity)
        if evidence.get('runtime') is None or not isinstance(evidence.get('issue'), int):
            errors.append(f'{tag}: runtime status and issue number required')
        if set(checks) != CHECKS or checks.get('rights') not in {'blocked','cleared'} or any(checks.get(c) not in {'not_run','pass','fail'} for c in CHECKS - {'rights'}):
            errors.append(f'{tag}: incomplete/invalid checks')
            continue
        if handoff.get('owner') not in {'Agy 1','Agy 3','Agy 4','ChatGPT'} or not handoff.get('task'):
            errors.append(f'{tag}: named owner and concrete handoff task required')
        if r.get('original_addition') is not False and r.get('original_addition') is not True:
            errors.append(f'{tag}: explicit boolean original_addition required')
        if any(secret in json.dumps(r).lower() for secret in FORBIDDEN):
            errors.append(f'{tag}: potentially private data in public ledger')
        level = STAGES.index(stage)
        if level >= 2:
            if (classification != 'missing_confirmed' or checks['rights'] != 'cleared'
                    or source['licence_review'] != 'cleared' or nid is None
                    or not target.get('handler') or not str(evidence.get('runtime','')).startswith('verified:')):
                errors.append(f'{tag}: gap promotion needs verified runtime, ID, handler, rights and missing_confirmed')
        if level >= 3 and r.get('original_addition') is not True:
            errors.append(f'{tag}: authored pack must be explicit original addition')
        if level >= 4 and checks['static'] != 'pass':
            errors.append(f'{tag}: static validation not passed')
        if level >= 5 and checks['compiler'] != 'pass':
            errors.append(f'{tag}: pinned disposable compile not passed')
        if level >= 7 and checks['client'] != 'pass':
            errors.append(f'{tag}: Java client evidence not passed')
        if level >= 8 and checks['persistence'] != 'pass':
            errors.append(f'{tag}: logout/relog persistence not passed')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ledger', type=Path)
    args = parser.parse_args()
    try:
        doc = json.loads(args.ledger.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        print(f'INVALID: {exc}', file=sys.stderr)
        return 2
    problems = validate(doc)
    for problem in problems:
        print('INVALID:', problem, file=sys.stderr)
    if problems:
        return 1
    print(f'VALID: {len(doc["candidates"])} source candidates; no runtime or gameplay certification')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

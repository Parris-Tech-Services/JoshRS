#!/usr/bin/env python3
"""Read-only RuneScript NPC trigger collision inventory for pinned JoshRS 377.

Reports *only* relative source paths, handler symbols and aggregate counts.
No dialogue, cache assets, player data, or runtime files are exported.
This static source scan cannot establish compiled script order or live routing.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import json
from pathlib import Path
import re

# Source-traced names at pinned LostCity Content 377 commit
# 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50. No NPC IDs inferred.
EXPECTED = {
    "reldo": ("opnpc1,reldo", "scripts/areas/area_varrock/scripts/reldo.rs2"),
    "juliet": ("opnpc1,juliet_multi_visible", "scripts/areas/area_varrock/scripts/juliet.rs2"),
    "romeo": ("opnpc1,romeo", "scripts/areas/area_varrock/scripts/romeo.rs2"),
}
HEADER = re.compile(r"^\s*\[\s*(opnpc[1-5])\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*\]\s*(?://[^\r\n]*)?$", re.I)
MAX_BYTES = 300_000
MAX_FILES = 20_000


def scan(content_root: Path) -> dict:
    if not content_root.is_dir() or content_root.is_symlink():
        raise ValueError("content root must be an existing, non-symlink directory")
    scripts = content_root / "scripts"
    if not scripts.is_dir() or scripts.is_symlink():
        raise ValueError("content root must contain a non-symlink scripts directory")
    matches = defaultdict(list)
    failures = []
    count = 0
    for path in sorted(scripts.rglob("*.rs2")):
        count += 1
        rel = path.relative_to(content_root).as_posix()
        if count > MAX_FILES:
            failures.append({"path": rel, "reason": "file_limit_exceeded"})
            break
        if path.is_symlink() or not path.is_file():
            failures.append({"path": rel, "reason": "nonregular_or_symlink"})
            continue
        try:
            if path.stat().st_size > MAX_BYTES:
                failures.append({"path": rel, "reason": "file_too_large"})
                continue
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeError):
            failures.append({"path": rel, "reason": "unreadable_or_invalid_utf8"})
            continue
        for line_no, line in enumerate(lines, 1):
            m = HEADER.fullmatch(line)
            if m:
                key = f"{m.group(1).lower()},{m.group(2).lower()}"
                matches[key].append({"path": rel, "line": line_no})
    # Only source locations are reported; no scripts or player information.
    targets = []
    for npc, (trigger, expected_path) in EXPECTED.items():
        refs = matches.get(trigger, [])
        if failures:
            status = "incomplete_scan_cannot_prove_uniqueness"
        elif not refs:
            status = "trigger_missing_from_source_scan"
        elif len(refs) > 1:
            status = "duplicate_source_trigger_requires_agent1_review"
        elif refs[0]["path"] != expected_path:
            status = "trigger_in_unexpected_source_path"
        else:
            status = "unique_in_expected_source_path_not_runtime_verified"
        targets.append({"npc": npc, "expected_trigger": trigger,
                        "expected_source_path": expected_path,
                        "source_definitions": refs, "classification": status})
    collisions = [{"trigger": key, "source_definitions": refs}
                  for key, refs in sorted(matches.items()) if len(refs) > 1]
    return {
        "schema": "joshrs-377-npc-source-trigger-collision-v1",
        "pinned_content_commit": "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50",
        "source_commit_verified_by_this_scan": False,
        "scripts_scanned": count if count <= MAX_FILES else MAX_FILES,
        "trigger_headers_found": sum(len(v) for v in matches.values()),
        "distinct_trigger_keys": len(matches),
        "scan_complete": not failures,
        "scan_failures": failures[:50],
        "scan_failure_count": len(failures),
        "duplicate_trigger_count": len(collisions),
        "duplicate_triggers": collisions[:50],
        "targets": targets,
        "compiled_pack_verified": False,
        "live_server_verified": False,
        "client_test": "not_run",
        "next_action": "Agent 1 review ambiguous source handlers; Agent 3 verify actual loaded pack and Java-client click delivery",
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--content", required=True, type=Path, help="read-only disposable 377 content checkout")
    p.add_argument("--output", type=Path, help="new JSON file only; never overwrite")
    args = p.parse_args()
    report = scan(args.content)
    output = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.output:
        with args.output.open("x", encoding="utf-8") as f:
            f.write(output)
    else:
        print(output, end="")
    if not report["scan_complete"] or any(
        x["classification"] != "unique_in_expected_source_path_not_runtime_verified"
        for x in report["targets"]
    ):
        raise SystemExit(2)


if __name__ == "__main__":
    main()

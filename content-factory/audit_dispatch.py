#!/usr/bin/env python3
"""Read-only local pack and 377 NPC-trigger diagnostics for Agent 1 / Agent 3.

Run only on a protected disposable content checkout. Reports checksums and
booleans; does not export proprietary dialogue, private source, or player saves.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

# Source-traced exact pinned 377 spellings, NOT a claim that these NPC IDs
# or compiled handler bindings are present in the user's running world.
VARROCK = (
    ("reldo", "scripts/areas/area_varrock/scripts/reldo.rs2", "opnpc1,reldo"),
    ("juliet", "scripts/areas/area_varrock/scripts/juliet.rs2", "opnpc1,juliet_multi_visible"),
    ("romeo", "scripts/areas/area_varrock/scripts/romeo.rs2", "opnpc1,romeo"),
)
UNIVERSAL = re.compile(r"hello[ ,]+adventurer|greetings[ ,]+adventurer", re.I)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            data = f.read(65536)
            if not data: break
            h.update(data)
    return h.hexdigest()


def audit(content_root: Path, script_pack: Path | None = None,
          index_pack: Path | None = None) -> dict:
    cases = []
    for key, rel, trigger in VARROCK:
        source = content_root / rel
        result = {"npc": key, "expected_trigger": trigger,
                  "source_exists": False, "source_sha256": None,
                  "source_trigger_present": False,
                  "generic_literal_detected": False,
                  "live_routing_verified": False}
        if source.is_file() and source.stat().st_size <= 300_000:
            value = source.read_text(encoding="utf-8")
            result["source_exists"] = True
            result["source_sha256"] = digest(source)
            result["source_trigger_present"] = bool(
                re.search(r"^\[" + re.escape(trigger) + r"\]\s*$", value, re.M))
            result["generic_literal_detected"] = bool(UNIVERSAL.search(value))
        cases.append(result)
    packs = {}
    for key, file in (("script_dat", script_pack), ("script_idx", index_pack)):
        packs[key] = {"present": bool(file and file.is_file()),
                      "sha256": digest(file) if file and file.is_file() else None}
    # Hash equality is useful only against an independently verified expected
    # build. This audit cannot infer that the running process loaded either file.
    return {"schema": "joshrs-377-dispatch-diagnostic-v1", "cases": cases,
            "packs": packs, "live_process_fingerprinted": False,
            "java_client_test": "not_run", "persistent_gameplay": "not_run",
            "next_step": "Agent 1 trace OPNPC1/morph/multinpc/compiled script IDs; Agent 3 verify live pack and real clicks"}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--content", type=Path, required=True)
    p.add_argument("--script-dat", type=Path)
    p.add_argument("--script-idx", type=Path)
    args = p.parse_args()
    if not args.content.is_dir():
        p.error("content directory absent; do not substitute an unrelated version")
    report = audit(args.content, args.script_dat, args.script_idx)
    print(json.dumps(report, indent=2, sort_keys=True))
    if not all(c["source_trigger_present"] for c in report["cases"]):
        raise SystemExit(2)


if __name__ == "__main__":
    main()

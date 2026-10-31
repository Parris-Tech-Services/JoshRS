#!/usr/bin/env python3
"""Single read-only Varrock source/pack/OPNPC1 evidence handoff for Agents 1/3.

Composes existing JoshRS diagnostics; does not harvest, compile, inspect live
processes, infer numeric NPC IDs, or read character saves. Output is a
sanitised summary; raw source paths and private client observations stay local.
"""
from __future__ import annotations

import argparse
import importlib
import json
from pathlib import Path
import stat

NPCS = ("reldo", "juliet", "romeo")
EXPECTED = {
    "reldo": "scripts/areas/area_varrock/scripts/reldo.rs2",
    "juliet": "scripts/areas/area_varrock/scripts/juliet.rs2",
    "romeo": "scripts/areas/area_varrock/scripts/romeo.rs2",
}
MAX_PACK_BYTES = 200_000_000


def require_regular_file(path: Path, name: str) -> None:
    """Reject links, directories, special files and implausible pack sizes."""
    if path.is_symlink() or not path.is_file():
        raise ValueError(name + " must be a regular non-symlink file")
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_PACK_BYTES:
        raise ValueError(name + " must be a bounded regular file")


def check_inputs(content: Path, dat: Path, idx: Path) -> None:
    if content.is_symlink() or not content.is_dir():
        raise ValueError("content must be an existing non-symlink directory")
    if (content / "scripts").is_symlink() or not (content / "scripts").is_dir():
        raise ValueError("content/scripts must be an existing non-symlink directory")
    # Existing audit_dispatch reads these files; ensure no ancestor is a
    # symlink before handing the path to that diagnostic.
    for relative in EXPECTED.values():
        current = content
        for component in Path(relative).parts:
            current = current / component
            if current.is_symlink():
                raise ValueError("Varrock source tree contains a symlink")
    if dat.name != "script.dat" or idx.name != "script.idx":
        raise ValueError("expected exact script.dat and script.idx filenames")
    if dat.parent.is_symlink() or idx.parent.is_symlink():
        raise ValueError("pack directory must not be a symlink")
    if dat.parent != idx.parent:
        raise ValueError("script packs must be in the same directory")
    require_regular_file(dat, "script.dat")
    require_regular_file(idx, "script.idx")
    if dat.resolve() == idx.resolve():
        raise ValueError("script.dat and script.idx must be different files")


def collect(content: Path, dat: Path, idx: Path, observation: dict | None = None) -> dict:
    check_inputs(content, dat, idx)
    dispatch = importlib.import_module("audit_dispatch")
    collision = importlib.import_module("audit_npc_trigger_collisions")
    evidence = importlib.import_module("verify_varrock_dispatch_evidence")

    source = dispatch.audit(content, dat, idx)
    collisions = collision.scan(content)
    verdict = evidence.verify(source, observation)
    by_npc = {row["npc"]: row for row in source["cases"]}
    by_collision = {row["npc"]: row for row in collisions["targets"]}
    by_verdict = {row["npc"]: row for row in verdict["cases"]}
    if set(by_npc) != set(NPCS) or set(by_collision) != set(NPCS) or set(by_verdict) != set(NPCS):
        raise ValueError("incomplete or contradictory Varrock diagnostic inventory")
    rows = []
    for npc in NPCS:
        src, coll, ev = by_npc[npc], by_collision[npc], by_verdict[npc]
        rows.append({
            "npc": npc,
            "source_exists": src["source_exists"],
            "source_trigger_present": src["source_trigger_present"],
            "source_matches_public_pinned_blob": src.get("source_matches_pinned_377"),
            "generic_greeting_literal_detected_in_source": src["generic_literal_detected"],
            "trigger_collision_classification": coll["classification"],
            "evidence_classification": ev["classification"],
            "agent3_relog_reported": ev["agent3_relog_reported"],
        })
    static_ok = (
        collisions["scan_complete"] is True
        and all(r["source_exists"] and r["source_trigger_present"]
                and r["trigger_collision_classification"] == "unique_in_expected_source_path_not_runtime_verified"
                and not r["generic_greeting_literal_detected_in_source"]
                and r["source_matches_public_pinned_blob"] is True
                for r in rows)
    )
    pack_ok = all(source["packs"][k]["present"] for k in ("script_dat", "script_idx"))
    return {
        "schema": "joshrs-377-varrock-one-command-triage-v1",
        "target_revision": 377,
        "public_pinned_content_commit": "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50",
        "static_source_gate": "pass_source_only" if static_ok else "review_required",
        "pack_files_present": pack_ok,
        "audited_pack_sha256": {
            "script_dat": source["packs"]["script_dat"]["sha256"],
            "script_idx": source["packs"]["script_idx"]["sha256"],
        },
        "agent3_observations_supplied": verdict["agent3_observations_supplied"],
        "loaded_pack_matches_audited_pack_reported": verdict["loaded_pack_sha256_matches_audited_files"],
        "collision_scan_complete": collisions["scan_complete"],
        "collision_count_all_npc_triggers": collisions["duplicate_trigger_count"],
        "collision_scan_failure_count": collisions["scan_failure_count"],
        "cases": rows,
        "live_process_verified_by_this_tool": False,
        "java_client_verified_by_this_tool": False,
        "player_saves_read_or_modified": False,
        "next_action": "Agent 1 inspect source/dispatch if static gate fails; Agent 3 privately confirm loaded packs and OPNPC1 clicks/relog before gameplay claims",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", required=True, type=Path, help="protected disposable copy of selected 377 content")
    parser.add_argument("--script-dat", required=True, type=Path, help="audited script.dat, not proof it is loaded")
    parser.add_argument("--script-idx", required=True, type=Path, help="audited script.idx, not proof it is loaded")
    parser.add_argument("--agent3", type=Path, help="optional private Agent 3 observation JSON")
    parser.add_argument("--output", type=Path, help="new sanitised report file, never overwrite")
    args = parser.parse_args()
    try:
        if args.agent3:
            if args.agent3.suffix.lower() != ".json":
                raise ValueError("Agent 3 observation must be a JSON file")
            require_regular_file(args.agent3, "Agent 3 observation")
        if args.output and (args.output.resolve().is_relative_to(args.content.resolve())
                            or args.output.resolve().is_relative_to(args.script_dat.parent.resolve())):
            raise ValueError("output must be outside audited source and pack directories")
        observation = json.loads(args.agent3.read_text(encoding="utf-8")) if args.agent3 else None
        report = collect(args.content, args.script_dat, args.script_idx, observation)
        payload = json.dumps(report, sort_keys=True, indent=2) + "\n"
        if args.output:
            with args.output.open("x", encoding="utf-8") as out:
                out.write(payload)
        else:
            print(payload, end="")
        return 0 if report["static_source_gate"] == "pass_source_only" else 2
    except (OSError, ValueError, UnicodeError, json.JSONDecodeError, KeyError, TypeError):
        parser.exit(2, "Varrock triage failed closed: invalid/incomplete inputs; no private paths exported.\n")


if __name__ == "__main__":
    raise SystemExit(main())

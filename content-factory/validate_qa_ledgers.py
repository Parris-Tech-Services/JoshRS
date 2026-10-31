#!/usr/bin/env python3
"""Metadata-only quest and map evidence integrity; NEVER applies game content."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re

SHA = re.compile(r"^[a-f0-9]{40}$")
STATES = {"not_run", "pass", "fail"}
TRACES = {"source_traced", "unverified"}


def validate_quest(data: object) -> list[str]:
    if not isinstance(data, dict) or data.get("schema") != "joshrs-377-quest-stage-qa-v1":
        return ["unknown quest QA schema"]
    errors = []
    if data.get("revision") != 377 or not SHA.fullmatch(str(data.get("pinned_content_commit", ""))):
        errors.append("unsupported revision or missing exact commit")
    if data.get("completion_verified") is not False or data.get("client") != "not_run" or data.get("persistence") != "not_run":
        errors.append("source-only fixture may not claim client completion")
    if data.get("game_dialogue_copied") is not False or data.get("rights") != "reference_metadata_only":
        errors.append("rights or copied-dialogue gate invalid")
    stages = data.get("stages", [])
    keys = [s.get("symbol") for s in stages if isinstance(s, dict)]
    if not keys or len(keys) != len(stages) or len(keys) != len(set(keys)):
        errors.append("missing or duplicate quest stage symbols")
    values = [s.get("value") for s in stages if isinstance(s, dict) and s.get("value") is not None]
    if len(values) != len(set(values)):
        errors.append("duplicate numeric quest stage")
    paths = {v.get("path") for v in data.get("source_files", []) if isinstance(v, dict)}
    for source in data.get("source_files", []):
        if not SHA.fullmatch(str(source.get("blob", ""))):
            errors.append("unverified source blob SHA")
        if not isinstance(source.get("path"), str) or ".." in Path(source["path"]).parts:
            errors.append("unsafe source path")
    if not isinstance(data.get("transitions"), list) or not data["transitions"]:
        errors.append("no quest-state transitions")
    else:
        pairs = set()
        for row in data["transitions"]:
            edge = (row.get("from"), row.get("to"))
            if row.get("from") not in keys or row.get("to") not in keys or edge in pairs:
                errors.append("dangling or duplicate state transition")
            pairs.add(edge)
            if row.get("trace") not in TRACES or row.get("test_result") not in STATES:
                errors.append("invalid transition status")
            if row.get("test_result") != "not_run":
                errors.append("unverified source matrix cannot declare completed tests")
            if row.get("trace") == "source_traced" and not row.get("source_location"):
                errors.append("source-traced edge lacks source location")
            if row.get("trace") == "unverified" and row.get("actor") is not None:
                errors.append("unverified edge may not invent an NPC actor")
    return errors


def validate_maps(data: object) -> list[str]:
    if not isinstance(data, dict) or data.get("schema") != "joshrs-377-map-quarantine-v1":
        return ["unknown map audit schema"]
    errors = []
    if data.get("revision") != 377 or not isinstance(data.get("candidates"), list):
        errors.append("wrong map revision or candidates missing")
        return errors
    names = set()
    for row in data["candidates"]:
        name = row.get("area")
        if not isinstance(name, str) or name in names:
            errors.append("repeated/invalid map area")
        names.add(name)
        unsupported = row.get("unsupported_location_instances")
        trailing = row.get("trailing_bytes")
        if not isinstance(unsupported, int) or unsupported < 0 or not isinstance(trailing, int) or trailing < 0:
            errors.append("invalid map incompatibility count")
        if row.get("installable") is not False or row.get("live_world_modified") is not False:
            errors.append("unverified map candidate cannot be installed")
        if (unsupported or trailing or row.get("rights_review") != "cleared") and row.get("installable") is not False:
            errors.append("map compatibility/rights hard block")
        if row.get("matching_runtime_pack_verified") is not False:
            errors.append("active pack cannot be inferred from source metadata")
    if data.get("checks", {}).get("jagex_assets_copied") is not False:
        errors.append("asset copying not allowed")
    return errors


def main() -> None:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--quest",type=Path,required=True)
    p.add_argument("--maps",type=Path,required=True)
    a=p.parse_args()
    qs=validate_quest(json.loads(a.quest.read_text(encoding="utf-8")))
    ms=validate_maps(json.loads(a.maps.read_text(encoding="utf-8")))
    for e in qs+ms:
        print("INVALID:",e)
    if qs or ms: raise SystemExit(1)
    print("PASS: evidence-only quest/map QA; no gameplay or install certification")


if __name__=="__main__":
    main()

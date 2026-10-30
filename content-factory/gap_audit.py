#!/usr/bin/env python3
"""Fail-closed evidence gate for JoshRS content work.

This inspects the exact pinned Lost City 377 text source, not live current-branch
search hits. Source presence != working custom-world gameplay.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re

EXISTING_ITEM_IDS = {
    "law_runes": "lawrune",
    "nature_runes": "naturerune",
    "amulet_mould": "amulet_mould",
    "chisel": "chisel",
}
RETIRED_NPCS = frozenset({
    "joshrs_timber_buyer", "joshrs_ore_buyer", "joshrs_trail_provisioner",
    "joshrs_law_rune_vendor", "joshrs_nature_rune_vendor",
    "joshrs_crafting_supplier", "joshrs_tool_supplier"
})


def inspect_pinned_content(content: Path, manifest_file: Path) -> dict:
    obj_index = content / "pack/obj.pack"
    jewellery_file = content / "scripts/skill_crafting/scripts/jewellery/jewellery.rs2"
    if not obj_index.is_file() or not jewellery_file.is_file():
        raise ValueError("Pinned 377 object registry or jewellery feature source is missing")
    ids = {}
    for line in obj_index.read_text(encoding="utf-8").splitlines():
        m = re.fullmatch(r"([0-9]+)=([a-z0-9_]+)", line.strip())
        if m:
            ids[m.group(2)] = int(m.group(1))
    found = []
    for feature, identifier in EXISTING_ITEM_IDS.items():
        if identifier not in ids:
            raise ValueError(f"Cannot confirm existing 377 item: {identifier}")
        found.append({
            "feature": feature, "object_name": identifier, "object_id": ids[identifier],
            "evidence_path": "pack/obj.pack",
            "source_present": True, "actual_world_tested": False,
            "meaning": "Object exists; does not prove shops or obtaining it work."
        })
    jewellery = jewellery_file.read_text(encoding="utf-8")
    for fragment in ("[inv_button1,crafting_jewelry:amulets_inv]",
                     "inv_total(inv, amulet_mould)"):
        if fragment not in jewellery:
            raise ValueError("Expected pre-existing amulet crafting logic not found")
    found.append({
        "feature": "amulet_crafting",
        "evidence_path": "scripts/skill_crafting/scripts/jewellery/jewellery.rs2",
        "source_present": True, "actual_world_tested": False,
        "meaning": "Amulet crafting source exists; local playability not established."
    })
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    retired = manifest.get("retired_unrequested_merchant_keys", [])
    if set(retired) != RETIRED_NPCS:
        raise ValueError("Redundant JoshRS vendor registry not fully retired")
    if any(key in RETIRED_NPCS for key in manifest.get("npc_names", [])):
        raise ValueError("Existing-item merchants incorrectly reintroduced")
    if manifest.get("gameplay_mechanics") != []:
        raise ValueError("Unverified gameplay trades still marked as new")
    if manifest.get("includes_player_save_changes") is not False:
        raise ValueError("Save safety not asserted")
    return {
        "schema": 1,
        "basis": "Pinned revision 377 content source (not an in-game client playtest)",
        "already_present": found,
        "unrequested_merchants_retired": sorted(RETIRED_NPCS),
        "retired_count": len(RETIRED_NPCS),
        "new_feature_gap_verified": False,
        "custom_world_login_verified": False,
        "elrothiro_save_verified": False,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--content", type=Path, required=True)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    result = inspect_pinned_content(args.content, args.manifest)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Existing pinned mechanics verified: {len(result['already_present'])}; "
          f"unrequested custom merchants retired: {result['retired_count']}. "
          "Actual player gameplay remains unverified.")


if __name__ == "__main__":
    main()

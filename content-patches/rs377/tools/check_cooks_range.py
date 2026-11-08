#!/usr/bin/env python3
"""Read-only exact-source checks for JoshRS revision-377 Cook's Assistant fixes."""
from __future__ import annotations

from pathlib import Path
import argparse
import re

NPCS = {
    "millie_the_miller": ("m49_51.jm2", "0 32 43: 3806"),
    "gillie_the_milkmaid": ("m50_51.jm2", "0 54 10: 3807"),
}

def check(content: Path) -> None:
    def txt(path: str) -> str:
        p = content / path
        if not p.is_file():
            raise AssertionError("Missing: " + path)
        return p.read_text(encoding="utf-8")

    quest = txt("scripts/quests/quest_cook/scripts/quest_cook.rs2")
    section = quest.split("[oplocu,cooksquestrange]", 1)
    assert len(section) == 2, "Special range item-use handler absent"
    assert len(re.findall(r"(?m)^\s*@attempt_cook_item\(last_useitem\);$", section[1])) == 1, "Special range must call actual cooking code exactly once"
    assert "//@attempt_cook_item" not in section[1], "Stale TODO still present"
    assert "%cookquest < ^cook_complete" in section[1] and "return;" in section[1], "Pre-completion range gate missing"
    cooking = txt("scripts/skill_cooking/scripts/cooking.rs2")
    assert "[label,attempt_cook_item]" in cooking, "Generic cooking procedure missing"
    assert "loc_type = cooksquestrange" in cooking, "Cook-o-matic success chance missing"

    ids = txt("pack/npc.pack")
    for name, (map_name, spawn) in NPCS.items():
        key = {"millie_the_miller": "3806", "gillie_the_milkmaid": "3807"}[name]
        assert re.search(rf"(?m)^{key}={name}$", ids), "NPC ID missing: " + name
        maps = txt("maps/" + map_name)
        area = maps.split("==== NPC ====", 1)
        assert len(area) == 2, "NPC map section missing: " + map_name
        assert spawn in area[1].split("==== OBJ ====", 1)[0], "NPC not spawned: " + name

    found: dict[str, list[str]] = {k: [] for k in NPCS}
    for script in (content / "scripts").rglob("*.rs2"):
        source = script.read_text(encoding="utf-8")
        for npc in NPCS:
            if re.search(rf"(?m)^\[opnpc1,{re.escape(npc)}\]$", source):
                found[npc].append(str(script.relative_to(content)))
    for npc, paths in found.items():
        assert len(paths) == 1, f"{npc}: expected one Talk-to handler, got {paths}"
        print(f"NPC_DIALOGUE_SOURCE_PRESENT: {npc} -> {paths[0]}")
    print("COOKS_RANGE_SOURCE_CONTRACT_PASSED")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--content", type=Path, required=True)
    args = parser.parse_args()
    check(args.content)

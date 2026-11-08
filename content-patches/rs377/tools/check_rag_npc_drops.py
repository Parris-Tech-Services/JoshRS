#!/usr/bin/env python3
"""Read-only 377 drop-map proof: 35 indexed species, all real pinned NPC names."""
import argparse
from pathlib import Path
import re

def validate(root):
    content = (root/"scripts/quests/quest_rag/scripts/rag_npc_drops.rs2").read_text()
    death = (root/"scripts/skill_combat/scripts/npc/npc_death.rs2").read_text()
    catalogue = (root/"scripts/quests/quest_rag/bones.txt").read_text()
    defined = set()
    for file in (root/"scripts").rglob("*.npc"):
        defined.update(re.findall(r"(?m)^\[([^\]]+)\]$",file.read_text(errors="replace")))
    mapping = []
    names = set()
    for cond, index in re.findall(r"(?m)^if \((npc_type = [^\n]+)\) \{ return\((\d+)\); \}$",content):
        index=int(index)
        for key in re.findall(r"npc_type = ([a-zA-Z0-9_]+)",cond):
            assert key in defined, f"Missing pinned NPC: {key}"
            assert key not in names, f"Ambiguous NPC to two bones: {key}"
            names.add(key)
        mapping.append(index)
    assert len(mapping)==35, f"Expected 35 species rows, got {len(mapping)}"
    assert mapping == list(range(35)), f"Bone indices out of order: {mapping}"
    assert len(catalogue.strip().splitlines())==35, "35-bone catalogue drift"
    assert death.count("~rag_drop_quest_bone;")==1, "Missing/duplicated central NPC death hook"
    assert "if (npc_findhero = ^true)" in death
    assert "if (~rag_bone_delivered($index) = true)" in content
    assert "obj_add(npc_coord, $bone, 1, ^lootdrop_duration)" in content
    print("RAG_35_PINNED_NPC_DEATH_DROP_MAPPINGS_VERIFIED")

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--content",type=Path,required=True)
    validate(p.parse_args().content)

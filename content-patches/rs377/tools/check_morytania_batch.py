#!/usr/bin/env python3
"""Read-only contract for newly added 377 Morytania NPC interactions.

Runs on the pinned disposable Content tree after the overlays are applied.
Not an actual player quest playthrough or a replacement for client testing.
"""
import argparse
from pathlib import Path
import re

REGIONS = {
    "m57_54": """
ahoy_akharanu ahoy_disciple ahoy_ghost_banker ahoy_ghost_captain_1
ahoy_ghost_captain_2 ahoy_ghost_guard ahoy_ghost_innkeeper
ahoy_ghost_protestor ahoy_ghost_sailor ahoy_ghost_shopkeeper
ahoy_ghost_villager ahoy_necrovarus ahoy_robin ahoy_velorina
""",
    "m54_55": "ahoy_crone",
    "m56_55": "ahoy_ghost_farmer ahoy_oldman",
    "m54_51": """
mort_afflicted_man mort_afflicted_man2 mort_afflicted_woman
mort_afflicted_woman2
""",
}
def check(content: Path):
    names_by_region = {area: names.split() for area, names in REGIONS.items()}
    names = [name for row in names_by_region.values() for name in row]
    if len(names) != 21 or len(set(names)) != 21:
        raise RuntimeError("Expected 21 distinct audited 377 NPC names")
    registry = {}
    for line in (content/"pack/npc.pack").read_text().splitlines():
        m = re.fullmatch(r"([0-9]+)=([a-z0-9_]+)", line.strip())
        if m:
            registry[m.group(2)] = int(m.group(1))
    all_scripts = list((content/"scripts").rglob("*.rs2"))
    for area, region_names in names_by_region.items():
        lines = (content/"maps"/(area+".jm2")).read_text().split("==== NPC ====", 1)
        if len(lines) != 2:
            raise RuntimeError(f"Missing NPC block: {area}")
        npc_ids = {int(m.group(1)) for ln in lines[1].splitlines()
                   if (m := re.fullmatch(r"[0-3] [0-9]+ [0-9]+: ([0-9]+)", ln.strip()))}
        for name in region_names:
            nid = registry.get(name)
            if nid is None:
                raise RuntimeError(f"NPC definition missing from pinned pack: {name}")
            if nid not in npc_ids:
                # The pinned 377 map does not spawn Ak-Haranu even though
                # its NPC definition exists. His dialogue is future-ready,
                # NOT counted as a visible NPC or an established spawn.
                if name == "ahoy_akharanu":
                    continue
                raise RuntimeError(f"NPC not in pinned region {area}: {name} ({nid})")
    combined = "\n".join(p.read_text(errors="replace") for p in all_scripts)
    for name in names:
        hits = re.findall(r"(?m)^\[opnpc1,"+re.escape(name)+r"\]$",combined)
        if len(hits) != 1:
            raise RuntimeError(f"Expected exactly one Talk-to trigger for {name}: {len(hits)}")
    mort_file=(content/"scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2").read_text()
    if "~send_quest_complete(" in mort_file or "%morttonquest = ^mortton_quest_complete;" in mort_file:
        raise RuntimeError("Incomplete Mortton quest must never award completion")
    varps=list((content/"scripts").rglob("*.varp"))
    for varp in ("morttonquest","morttonmulti"):
        owner=[p for p in varps if re.search(r"(?m)^\["+varp+r"\]$",p.read_text())]
        if len(owner)!=1 or owner[0].name != "quest_mortton.varp":
            raise RuntimeError(f"Permanent quest varp missing/duplicate: {varp}")
        text=owner[0].read_text()
        if not re.search(r"(?m)^\["+varp+r"\]\s*scope=perm\s*transmit=yes",text):
            raise RuntimeError(f"Nonpersistent {varp}")
    brew=(content/"scripts/skill_herblore/scripts/brewing/brew_potion.rs2").read_text()
    if brew.count("[opheldu,tarrominvial]")!=1 or "~mortton_prepare_serum;" not in brew:
        raise RuntimeError("Mortton recipe not integrated in native Herblore handler")
    print("MORYTANIA_377_SOURCE_CONTRACT_OK: 21 Talk-to handlers, 20 verified spawns, one unspawned Ak-Haranu,"
          " persistent Mortton stages, native Herblore hook, no premature rewards")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--content",type=Path,required=True)
    check(parser.parse_args().content.resolve(strict=True))

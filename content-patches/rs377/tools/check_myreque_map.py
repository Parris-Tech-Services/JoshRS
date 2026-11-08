#!/usr/bin/env python3
"""Read-only location/NPC audit of the actual pinned 377 Myreque world maps.

Do not equate map presence, a native compile or a port response with actual playability.
Print real coordinates of quest objects for proper arrival/exit implementation.
"""
from pathlib import Path
import argparse
import re

LOCS = {
  5001:"route_boardedupdoor", 5002:"swamp_bridge1",
  5003:"spooky_tree_base_forbridge",5004:"spooky_tree_mid_forbridge",
  5045:"hollowtree_entrance",5046:"route_cavewalltunnel",
  5050:"route_stalagmite_cave_entrace",5051:"route_rowboat",
  5052:"thrttavernbasementfalsewall",5054:"thrttavernbasementladder",
  5055:"thrt_tavern_trap_door",6969:"route_rowboat_mortton",
  6970:"route_rowboat_hollows",
}
NPCS = {
  1567:"route_cyreg_paddlehorn",1568:"route_curpile_fyod",
  1569:"route_veliaf_hurtz",1570:"route_sani_piliu",
  1571:"route_harold_evans",1572:"route_radigad_ponfit",
  1573:"route_polmafi_ferdygris",1574:"route_ivan_strom",
  1575:"skeleton_hellhound",1576:"canafis_stranger",
  1577:"route_vanstrom_klause_sitting",1579:"route_vanstrom_klause_normal",
  2020:"multi_vanstrom_stranger_entity",
}
def scan(root:Path):
    foundloc={i:[] for i in LOCS}
    foundnpc={i:[] for i in NPCS}
    for path in (root/"maps").glob("m*_*.jm2"):
        m=re.fullmatch(r"m(\d+)_(\d+)\.jm2",path.name)
        if not m: continue
        rx,rz=map(int,m.groups())
        content=path.read_text(errors="replace")
        in_loc=False
        in_npc=False
        for line in content.splitlines():
            if line.startswith("===="):
                in_loc=line.strip()=="==== LOC ===="
                in_npc=line.strip()=="==== NPC ===="
                continue
            if not in_loc and not in_npc: continue
            mm=re.match(r"^(\d+) (\d+) (\d+): (\d+)(?:\s|$)",line)
            if not mm: continue
            p,x,z,num=map(int,mm.groups())
            at=f"{path.name} [{p},{rx*64+x},{rz*64+z}] (tile {x},{z})"
            if in_loc and num in foundloc:foundloc[num].append(at)
            if in_npc and num in foundnpc:foundnpc[num].append(at)
    for mapping,vals,title in ((LOCS,foundloc,"LOC"),(NPCS,foundnpc,"NPC")):
        for num,name in mapping.items():
            spots=vals[num]
            print(f"MYREQUE_MAP_{title} {num}={name} count={len(spots)}")
            for at in spots[:20]:print("  "+at)
    print("MYREQUE_PINNED_MAP_DISCOVERY_COMPLETE (evidence only, not gameplay)")
    return foundloc,foundnpc

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--content",type=Path,required=True)
    scan(p.parse_args().content.resolve(strict=True))

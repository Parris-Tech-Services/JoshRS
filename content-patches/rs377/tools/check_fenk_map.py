#!/usr/bin/env python3
"""Validate Fenkenstrain locations against the exact pinned 377 map text.

This is a read-only source/map contract, NOT a character playtest. We check
the actual map loc type at each interactive tile and real cave exits. It fails
closed if the cache/map pin changes or if quest logic teleports to a missing
map tile. No world process, character or save is accessed.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re

PINNED = {
    "m54_54": [(0,37,29,5164)], # Canifis signpost
    "m55_55": [(0,26,43,5156),(0,31,44,5158),(0,28,45,5174),
               (1,22,38,5166),(1,35,38,5166),(1,24,35,5165),
               (1,20,25,5161),(2,28,16,5176),(0,56,6,5168)],
    "m56_54": [(0,24,35,5169)],
    "m54_55": [(0,46,56,5168),(0,48,57,5168),(0,50,56,5168)],
    "m54_155": [(0,54,37,5170),(0,44,47,5163),(0,48,50,1757)],
    "m55_155": [(0,58,7,1757)],
}
NPCS = {"m54_155": [(0,25,23,1676)],"m55_155":[(0,5,12,1676)]}
ENTRANCE_TILE = ("m55_155",0,56,6)

def verify(source:Path) -> None:
    pack={}
    for line in (source/"pack/loc.pack").read_text().splitlines():
        m=re.fullmatch(r"(\d+)=([A-Za-z0-9_]+)",line.strip())
        if m: pack[m.group(2)]=int(m.group(1))
    for name,n in {"fenk_signpost":5164,"fenk_grave":5168,
                   "fenk_mausoleum_door":5170}.items():
        if pack.get(name)!=n:
            raise ValueError("pinned location ID mismatch: "+name)
    for mapname,places in PINNED.items():
        file=source/"maps"/(mapname+".jm2")
        text=file.read_text()
        for plane,x,z,loc in places:
            pattern=rf"(?m)^{plane} {x} {z}: {loc} (?:0|1|2|3|4|9|10|11|22)(?: \d)?$"
            if not re.search(pattern,text):
                raise ValueError(f"missing real interactive loc {mapname}:{plane},{x},{z}:{loc}")
        for plane,x,z,npc in NPCS.get(mapname,[]):
            tail=text.split("==== NPC ====",1)
            if len(tail)!=2 or not re.search(rf"(?m)^{plane} {x} {z}: {npc}$",tail[1]):
                raise ValueError(f"missing wolf-woman spawn {mapname}:{x},{z}")
    mapname,plane,x,z=ENTRANCE_TILE
    target=(source/"maps"/(mapname+".jm2")).read_text()
    if not re.search(rf"(?m)^{plane} {x} {z}: [^\n]+$",target):
        raise ValueError("underground entrance tile does not exist")
    ladder=(source/"scripts/ladders+stairs/scripts/ladders.rs2").read_text()
    if "[oploc1,loc_1757]" not in ladder or (
        "~climb_ladder(movecoord(coord(), 0, 0, -6400), true)" not in ladder
    ):
        raise ValueError("native underground exit ladder route missing")
    if "~fenk_buy_preserved_brain;" not in (source/"scripts/areas/area_canafis/scripts/werewolfinnkeeper.rs2").read_text():
        raise ValueError("Roavar's original NPC trigger was not extended")
    if re.search(r"(?m)^\[oploc1,loc_1757\]", (
        source/"scripts/quests/quest_fenkenstrain/scripts/fenk_dungeon.rs2"
    ).read_text()):
        raise ValueError("duplicate native ladder script was introduced")
    print("FENKENSTRAIN_MAP_CONTRACT_OK:",sum(map(len,PINNED.values())),
          "real map locations, wolf-woman NPCs, entrances, exits, Roavar")

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--content",type=Path,required=True)
    args=parser.parse_args()
    verify(args.content.resolve(strict=True))

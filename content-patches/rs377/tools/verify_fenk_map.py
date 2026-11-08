#!/usr/bin/env python3
"""Validate all custom Fenkenstrain target coordinates against pinned 377 .jm2.

This is read-only; it cannot prove walkability, player-facing animations or
the correctness of teleport targets without real client playtesting.
"""
import argparse
from pathlib import Path

LOCS={
 "maps/m54_54.jm2":[(0,37,29,5164)],
 "maps/m55_55.jm2":[(0,22,38,5166),(0,35,38,5166),
  (0,26,43,5156),(0,28,45,5174),(0,31,44,5158),
  (1,24,35,5165),(1,28,31,5172),(2,28,16,5176),
  (0,58,7,5167)],
 "maps/m56_54.jm2":[(0,24,35,5169)],
 "maps/m54_155.jm2":[(0,54,37,5170),(0,44,47,5163)],
 "maps/m54_55.jm2":[(0,49,51,5167),
  (0,46,56,5168),(0,48,57,5168),(0,50,56,5168)]
}
OBJS={5164:"fenk_signpost",5166:"fenk_bookcase",5156:"fenk_broomcupboard",
  5174:"fenk_shed_door",5158:"fenk_canepile",5165:"fenk_fireplace",
  5172:"fenk_tower_door",5176:"fenk_conductor_broken",
  5167:"fenk_coffin",5169:"fenk_grave_poor",
  5170:"fenk_mausoleum_door",5163:"fenk_chest_open",5168:"fenk_grave"}

def check(content,quest):
    ids={}
    for ln in (content/"pack/loc.pack").read_text().splitlines():
        if "=" in ln:
            number,name=ln.split("=",1)
            if number.isdigit():ids[int(number)]=name
    count=0
    for relative,needed in LOCS.items():
        text=(content/relative).read_text()
        try:lines=text.split("==== LOC ====",1)[1].split("==== NPC ====",1)[0].splitlines()
        except IndexError:raise ValueError(f"Missing native map LOC block: {relative}")
        found=set()
        for raw in lines:
            if ":" not in raw:continue
            before,after=raw.split(":",1)
            tile=before.strip().split()
            obj=after.strip().split()
            if len(tile)==3 and obj and all(x.isdigit() for x in tile+obj[:1]):
                found.add(tuple(map(int,tile+[obj[0]])))
        for p,x,z,item in needed:
            if ids.get(item)!=OBJS[item]:
                raise ValueError(f"Native ID changed: {item} expected {OBJS[item]}")
            if (p,x,z,item) not in found:
                raise ValueError(f"Missing exact pinned location {relative} {p}:{x}:{z}:{item}")
            count+=1
    castle=(quest/"scripts/fenk_castle.rs2").read_text()
    dungeon=(quest/"scripts/fenk_dungeon.rs2").read_text()
    npc=(quest/"scripts/fenk_npcs.rs2").read_text()
    for name in ("fenk_signpost","fenk_bookcase","fenk_conductor_broken",
                 "fenk_shed_door","fenk_tower_door"):
        if f"[oploc1,{name}]" not in castle and f"[oplocu,{name}]" not in castle:
            raise ValueError(f"Missing gameplay hook for {name}")
    for line in (
        "[ai_queue3,fenk_experiment_1]",
        "gosub(npc_death);",
        "npc_findhero = ^false",
        "[oplocu,fenk_coffin]",
        "[oploc1,fenk_mausoleum_door]",
        "[oploc1,fenk_chest_open]",
        "[oploc2,fenk_grave]",
        "%fenk_unlocked_cavern = 0",
        "fenk_mausoleum_key",
    ):
        if line not in dungeon:raise ValueError("Missing native combat/dungeon guard "+line)
    if "if (%prieststart < ^priest_started)" not in npc:
        raise ValueError("Quest requirement must not falsely require Restless Ghost completion")
    print(f"FENKENSTRAIN_MAP_SOURCE_VALIDATED {count} exact map objects and combat/gate stage guards")
    return 0
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--content",type=Path,required=True)
    parser.add_argument("--quest",type=Path,required=True)
    a=parser.parse_args()
    raise SystemExit(check(a.content.resolve(strict=True),a.quest.resolve(strict=True)))

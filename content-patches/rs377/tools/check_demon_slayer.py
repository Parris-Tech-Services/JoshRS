#!/usr/bin/env python3
"""Source and map acceptance checks for Demon Slayer in pinned RS revision 377.

Only documents static/source evidence. A real 377 login/playthrough is separate.
"""
from __future__ import annotations
import argparse
import re
from pathlib import Path


def inspect(content: Path, engine: Path) -> None:
    def read(root: Path, rel: str) -> str:
        f = root / rel
        if not f.is_file():
            raise AssertionError("missing required file: " + str(f))
        return f.read_text(encoding="utf-8")

    def ensure(condition: bool, reason: str) -> None:
        if not condition:
            raise AssertionError(reason)
        print("SOURCE_PASS:", reason)

    quest = read(content, "scripts/quests/quest_demon/scripts/demon_slayer.rs2")
    boss = read(content, "scripts/quests/quest_demon/scripts/delrith.rs2")
    journal = read(content, "scripts/quests/quest_demon/scripts/demon_journal.rs2")
    constants = read(content, "scripts/quests/quest_demon/configs/demon.constant")
    varp = read(content, "scripts/quests/quest_demon/configs/demon.varp")
    aris = read(content, "scripts/areas/area_varrock/scripts/gypsy.rs2")
    prysin = read(content, "scripts/areas/area_varrock/scripts/sir_prysin.rs2")
    rovin = read(content, "scripts/areas/area_varrock/scripts/captain_rovin.rs2")
    traiborn = read(content, "scripts/areas/area_draynor/scripts/traiborn.rs2")
    combat = read(content, "scripts/skill_combat/scripts/npc/npc_combat.rs2")
    manholes = read(content, "scripts/general_use/scripts/manholes.rs2")
    water = read(content, "scripts/general_use/scripts/water_sources.rs2")
    objops = read(engine, "src/engine/script/handlers/ObjOps.ts")
    registry = read(content, "pack/npc.pack")
    items = read(content, "pack/obj.pack")
    locs = read(content, "pack/loc.pack")
    qp = read(content, "scripts/general/configs/quest.constant")
    questlist = read(content, "scripts/general/scripts/quests.rs2")

    ensure("[demonstart]\nscope=perm" in varp, "quest state is permanent in source")
    ensure("^demon_key_hunt = 2" in constants and "^demon_find_bones = 3" in constants
           and "^demon_got_traiborn_key = 28" in constants and "^demon_silverlight = 29" in constants
           and "^demon_complete = 30" in qp, "all 25-bone stages and completed state declared")
    ensure("[opnpc1,aris]" in aris and "inv_del(inv, coins, 1)" in aris
           and "%demonstart = ^demon_talked_aris;" in aris, "one-coin Aris start and stage progress")
    ensure("[opnpc1,sir_prysin]" in prysin and
           all(f"inv_del(inv, silverlight_key_{x}, 1)" in prysin for x in (1, 2, 3))
           and "inv_add(inv, silverlight, 1)" in prysin and
           "%demonstart = ^demon_silverlight;" in prysin,
           "Prysin's three-key trade and Silverlight quest stage")
    ensure("[opnpc1,captain_rovin]" in rovin and
           "inv_total(inv, silverlight_key_2) > 0 | inv_total(bank, silverlight_key_2) > 0" in rovin
           and "inv_freespace(inv) < 1" in rovin, "Rovin cannot duplicate key or discard on full inventory")
    ensure("[opnpc1,traiborn]" in traiborn and "inv_del(inv, bones, 1)" in traiborn
           and "%demonstart = calc(%demonstart + 1);" in traiborn
           and "inv_add(inv, silverlight_key_1, 1)" in traiborn,
           "Traiborn takes 25 normal bones and gives his key")
    ensure("[oplocu,questdrain]" in quest and "last_useitem ! bucket_water" in quest
           and "if (%demonstart < ^demon_key_hunt)" in quest
           and "inv_del(inv, bucket_water, 1)" in quest
           and "inv_add(inv, bucket_empty, 1)" in quest
           and "obj_add(0_50_154_25_41, silverlight_key_3" in quest,
           "drain only dispenses after key hunt and consumes water")
    ensure("World.addObj(obj, state.activePlayer.hash64, duration)" in objops and
           "[ScriptOpcode.OBJ_ADD]" in objops and "[ScriptOpcode.OBJ_ADDALL]" in objops,
           "pinned engine scopes obj_add sewer key to initiating player (not obj_addall)")
    ensure("[oploc1,manholeclosed]" in manholes and "[oploc1,manholeopen]" in manholes
           and "6400" in manholes and "[oplocu,_watersource]" in water
           and "case bucket_empty" in water, "manhole and bucket-filling handlers exist")
    ensure("if (inv_freespace(inv) < 1)" in prysin and
           "inv_freespace(inv) < 1 & inv_total(inv, coins) > 500" in prysin and
           "inv_del(inv, coins, 500)" in prysin,
           "free pre-boss Silverlight reissue and paid post-quest reissue guard inventory")
    ensure(combat.count("if (%demonstart < ^demon_silverlight)") >= 2
           and combat.count("inv_getobj(worn, 3) ! silverlight") >= 2
           and combat.count("if (%demonstart >= ^demon_complete)") >= 2,
           "normal/optional Delrith combat needs quest stage and equipped Silverlight")
    ensure("[ai_queue3,delrith]" in boss and "npc_changetype(delrith_weakened" in boss
           and "demon_slayer_start_incantation" in boss
           and "demon_slayer_wrong_incantation" in boss
           and "demon_slayer_correct_incantation" in boss
           and "gosub(npc_death);" in boss, "boss transition, wrong and correct incantations coded")
    ensure("[queue,demon_slayer_complete]" in quest and
           "%demonstart = ^demon_complete;" in quest and
           "send_quest_complete(questlist:demon" in quest and
           "^demon_questpoints = 3" in qp and
           "if (%demonstart = ^demon_complete)" in questlist and
           "^demon_questpoints" in questlist and
           "[if_button,questlist:demon]" in journal,
           "completion, 3 quest points and journal in source")

    npc_ids = {"aris": 882, "sir_prysin": 883, "captain_rovin": 884,
               "traiborn": 881, "delrith": 879, "delrith_weakened": 880}
    for name, num in npc_ids.items():
        ensure(re.search(rf"(?m)^{num}={name}$", registry) is not None,
               f"npc registry {num} {name}")
    for name, num in {"bones": 526, "bucket_empty": 1925, "bucket_water": 1929,
                      "silverlight_key_1": 2399, "silverlight_key_2": 2400,
                      "silverlight_key_3": 2401, "silverlight": 2402}.items():
        ensure(re.search(rf"(?m)^{num}={name}$", items) is not None,
               f"item registry {num} {name}")
    ensure("2843=questdrain" in locs and "874=sink2" in locs and
           "881=manholeclosed" in locs and "882=manholeopen" in locs,
           "drain, kitchen sink and sewer entrance types registered")

    map_npcs = {
        "aris": ("m50_53.jm2", "0 3 32: 882"),
        "sir_prysin": ("m50_54.jm2", "0 4 17: 883"),
        "captain_rovin": ("m50_54.jm2", "2 4 40: 884"),
        "traiborn": ("m48_49.jm2", "1 40 26: 881"),
        "delrith": ("m50_52.jm2", "0 29 42: 879"),
    }
    for npc, (filename, row) in map_npcs.items():
        region = read(content, "maps/" + filename)
        section = region.split("==== NPC ====", 1)
        ensure(len(section) == 2 and row in section[1].split("==== ", 1)[0],
               f"map placement {npc} ({filename}: {row})")
    varrock = read(content, "maps/m50_54.jm2")
    loc_section = varrock.split("==== LOC ====", 1)[1].split("==== ", 1)[0]
    obj_section = varrock.split("==== OBJ ====", 1)[1].split("==== ", 1)[0]
    ensure("0 25 39: 2843" in loc_section and "0 24 38: 874" in loc_section,
           "Varrock kitchen drain and sink placed")
    ensure("1 21 41: 1925" in obj_section and "1 22 35: 1925" in obj_section,
           "two empty buckets placed upstairs in palace")

    print("DEMON_SLAYER_377_SOURCE_CONTRACT_PASSED")
    print("REAL_PLAYER_LOGIN_COMBAT_PICKUP_RELOG_NOT_TESTED")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--content", type=Path, required=True)
    p.add_argument("--engine", type=Path, required=True)
    args = p.parse_args()
    inspect(args.content, args.engine)

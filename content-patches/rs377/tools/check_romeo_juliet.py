#!/usr/bin/env python3
"""Read-only pinned-source acceptance for JoshRS revision-377 Romeo & Juliet.

A successful source check/pack/boot does NOT prove a real-player quest playthrough.
"""
from __future__ import annotations
import argparse
import re
from pathlib import Path


def check(root: Path) -> None:
    def read(rel: str) -> str:
        p = root / rel
        if not p.is_file():
            raise AssertionError(f"Missing 377 content file: {rel}")
        return p.read_text(encoding="utf-8")

    def require(ok: bool, label: str) -> None:
        if not ok:
            raise AssertionError(label)
        print("ROMEO_JULIET_SOURCE_PASS:", label)

    prefix = "scripts/quests/quest_romeojuliet/"
    romeo = read("scripts/areas/area_varrock/scripts/romeo.rs2")
    juliet = read("scripts/areas/area_varrock/scripts/juliet.rs2")
    father = read("scripts/areas/area_varrock/scripts/father_lawrence.rs2")
    apothecary = read("scripts/areas/area_varrock/scripts/apothecary.rs2")
    complete = read(prefix + "scripts/quest_romeojuliet.rs2")
    journal = read(prefix + "scripts/romeojuliet_journal.rs2")
    constants = read(prefix + "configs/quest_romeojuliet.constant")
    varp = read(prefix + "configs/quest_romeojuliet.varp")
    qregistry = read("scripts/general/configs/quest.constant")
    qpoints = read("scripts/general/scripts/quests.rs2")
    npcs = read("pack/npc.pack")
    objs = read("pack/obj.pack")

    stages = {
        "not_started": 0, "spoken_romeo": 10, "spoken_juliet": 20,
        "passed_message": 30, "spoken_father": 40,
        "spoken_apothecary": 50, "juliet_crypt": 60,
    }
    for key, value in stages.items():
        require(re.search(
            rf"(?m)^\^romeojuliet_{key}\s*=\s*{value}$", constants) is not None,
            f"stage constant {key}={value}")
    require("[rjquest]\nscope=perm" in varp, "persistent quest varp")
    require("^romeojuliet_complete = 100" in qregistry and
            "^romeojuliet_questpoints = 5" in qregistry,
            "quest complete stage 100 and 5 QP configured")
    require("[opnpc1,romeo]" in romeo and
            "[opnpc1,juliet_multi_visible]" in juliet and
            "[opnpc1,father_lawrence]" in father and
            "[opnpc1,apothecary]" in apothecary,
            "all four principal Talk-to entrypoints")
    require("%rjquest = ^romeojuliet_spoken_romeo;" in romeo and
            "%rjquest = ^romeojuliet_spoken_juliet;" in juliet and
            "%rjquest = ^romeojuliet_passed_message;" in romeo,
            "Romeo or Juliet quest start, message acquisition, and hand-in")
    require("%rjquest = ^romeojuliet_spoken_father;" in father and
            "case ^romeojuliet_passed_message : @father_lawrence_help;" in father,
            "30 to 40 transition is implemented by Father Lawrence, not missing")
    require("%rjquest = ^romeojuliet_spoken_apothecary;" in apothecary and
            "if(%rjquest = ^romeojuliet_spoken_father)" in apothecary,
            "40 to 50 transition is implemented by Apothecary, not missing")
    require("inv_del(inv, cadavaberries, 1);" in apothecary and
            "inv_add(inv, cadava, 1);" in apothecary and
            "inv_del(inv, cadava, 1);" in juliet and
            "%rjquest = ^romeojuliet_juliet_crypt;" in juliet,
            "one berry converted to one potion, delivered to Juliet")
    require("inv_total(inv, julietmessage) < 1" in romeo and
            "inv_total(bank, julietmessage) > 0" in romeo and
            "inv_del(inv, julietmessage, 1);" in romeo,
            "Romeo cannot accept an absent or banked message")
    require(re.search(r"\[label,juliet_agree_message\]\s*"
                      r"if \(inv_freespace\(inv\) < 1\)", juliet) is not None,
            "Juliet will not advance/lose the initial message on a full inventory")
    redelivery = juliet.split("[label,juliet_deliver_letter]", 1)[1].split("[label,", 1)[0]
    require("inv_total(bank, julietmessage) > 0" in redelivery and
            "inv_freespace(inv) < 1" in redelivery and
            "inv_add(inv, julietmessage, 1)" in redelivery,
            "Juliet reissues lost message once, with bank and space checks")
    require("inv_total(inv, cadava) = 0" in juliet and
            "inv_del(inv, cadava, 1)" in juliet,
            "Juliet potion hand-in cannot skip missing potion")
    require("[queue,romeo_and_juliet_complete]" in complete and
            "if (%rjquest ! ^romeojuliet_juliet_crypt)" in complete and
            "%rjquest = ^romeojuliet_complete;" in complete and
            "send_quest_complete(questlist:romeojuliet" in complete and
            "queue(romeo_and_juliet_complete, 0, 0)" in romeo,
            "only crypt stage triggers quest completion, once")
    require("[if_button,questlist:romeojuliet]" in journal and
            "%rjquest = ^romeojuliet_complete" in qpoints and
            "^romeojuliet_questpoints" in qpoints,
            "journal and persistent quest-points registration")

    for name, itemid in {"cadavaberries": 753, "julietmessage": 755, "cadava": 756}.items():
        require(re.search(rf"(?m)^{itemid}={name}$", objs) is not None,
                f"item {name} id {itemid}")
    for name, npcid in {"apothecary": 638, "romeo": 639,
                        "father_lawrence": 640, "juliet_multi_visible": 3323}.items():
        require(re.search(rf"(?m)^{npcid}={name}$", npcs) is not None,
                f"NPC {name} id {npcid}")

    spawns = {
        "Romeo": ("m50_53.jm2", "0 11 33: 639"),
        "Juliet (first floor)": ("m49_53.jm2", "1 22 33: 3323"),
        "Father Lawrence": ("m50_54.jm2", "0 54 28: 640"),
        "Apothecary": ("m49_53.jm2", "0 59 12: 638"),
    }
    for name, (region, placement) in spawns.items():
        data = read("maps/" + region)
        area = data.split("==== NPC ====", 1)
        require(len(area) == 2 and placement in area[1].split("==== ", 1)[0],
                f"NPC placed on pinned map: {name}")
    # Juliet is upstairs: a 377 staircase and its scripted floor travel are required.
    house_map = read("maps/m49_53.jm2")
    house_locs = house_map.split("==== LOC ====", 1)
    stairs = read("scripts/ladders+stairs/scripts/stairs.rs2")
    require(len(house_locs) == 2 and
            "0 20 43: 1722" in house_locs[1].split("==== ", 1)[0]
            and "[oploc1,stairs]" in stairs
            and "case 0_49_53_20_43 : p_telejump(1_49_53_19_43)" in stairs
            and "case 1_49_53_20_43 : p_telejump(0_49_53_23_43)" in stairs,
            "Juliet's first-floor house has a mapped, two-way scripted staircase")
    berries = read("maps/m51_52.jm2")
    berry_section = berries.split("==== OBJ ====", 1)
    require(len(berry_section) == 2 and
            all(f"0 {x} {z}: 753 1" in berry_section[1].split("==== ", 1)[0]
                for x, z in ((2, 33), (9, 47), (13, 42))),
            "three collectible berry ground spawns by south-east Varrock")

    # This check is intentionally only for source/map presence. No cutscene claims:
    # early 2004 guides describe cinematic sequences absent from these quest scripts.
    print("ROMEO_JULIET_377_SOURCE_CONTRACT_PASSED")
    print("REAL_PLAYER_LETTER_POTION_CUTSCENE_RELOG_NOT_TESTED")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--content", type=Path, required=True)
    args = p.parse_args()
    check(args.content)

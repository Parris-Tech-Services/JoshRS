#!/usr/bin/env python3
"""Pinned 377 Myreque cache/source contract. Evidence only, not full gameplay."""
import argparse
import re
from pathlib import Path

def block(raw, symbol):
    m = re.search(r"(?ms)^\[" + re.escape(symbol) + r"\]\s*\n(.*?)(?=^\[|\Z)", raw)
    if not m:
        raise AssertionError(f"Missing cache definition [{symbol}]")
    return m.group(1)

def hasloc(root, area, plane, localx, localz, number):
    s = (root / "maps" / (area + ".jm2")).read_text()
    locs = s.split("==== LOC ====", 1)[1].split("==== NPC ====", 1)[0]
    pat = rf"(?m)^{plane} {localx} {localz}: {number} \d+(?: \d+)?$"
    assert re.search(pat, locs), f"Missing {number} at {area}:{plane},{localx},{localz}"

def has_npc(root, area, plane, lx, lz, npc):
    s = (root / "maps" / (area + ".jm2")).read_text()
    npcs = s.split("==== NPC ====", 1)[1]
    assert re.search(rf"(?m)^{plane} {lx} {lz}: {npc}$", npcs), f"Missing NPC {npc} at {area}:{plane},{lx},{lz}"

def check(root):
    source=root/"scripts/quests/quest_myreque"
    q=(source/"scripts/quest_route.rs2").read_text()
    t=(source/"scripts/quest_route_travel.rs2").read_text()
    h=(source/"scripts/quest_route_hound.rs2").read_text()
    const=(source/"configs/quest_route.constant").read_text()
    loc=(root/"scripts/_unpack/377/all.loc").read_text()
    npc=(root/"scripts/_unpack/377/all.npc").read_text()
    varbit=(root/"scripts/_unpack/377/all.varbit").read_text()
    varp=(root/"scripts/_unpack/377/all.varp").read_text()

    # Real menu options, not guesses. Loc ID 5002's "Walk-here" is NOT "Repair".
    for name, action, num in (("swamp_bridge1","op5=Repair",5002),
                              ("harmless_dead_palm_mid","op1=Climb up",5005),
                              ("harmless_dead_palm_mid","op2=Climb down",5005),
                              ("route_stalagmite_cave_entrace","op2=Squeeze-past",5050),
                              ("thrttavernbasementfalsewall","op1=Search",5052),
                              ("thrttavernbasementladder","op1=Climb-up",5054),
                              ("route_rowboat_mortton","op1=Board",6969),
                              ("route_rowboat_hollows","op1=Board",6970),
                              ("freedomfighterundergroundentrancel","op1=Open",5060),
                              ("freedomfighterundergroundentrancer","op1=Open",5061)):
        assert action in block(loc,name), (name,action)
        assert f"{num}={name}" in (root/"pack/loc.pack").read_text()
    assert "[oploc5,swamp_bridge1]" in t
    assert "[oploc1,swamp_bridge1]" not in t
    assert "[oploc2,route_stalagmite_cave_entrace]" in t
    assert "[oploc1,hollowtree_entrance]" not in t, "un-clickable scenery cannot start quest"

    # Fixed interactive objects must be present on EXACT 377 map tiles.
    for x in (35,36,37,38):hasloc(root,"m54_53",1,46,x,5002)
    for x in (34,39):hasloc(root,"m54_53",0,46,x,5005)
    hasloc(root,"m54_53",0,52,49,5045)
    hasloc(root,"m54_53",0,53,55,5061)
    hasloc(root,"m54_53",0,54,55,5060)
    hasloc(root,"m55_51",0,3,20,6969)
    hasloc(root,"m54_52",0,42,49,6970)
    hasloc(root,"m54_153",0,36,32,5050)
    hasloc(root,"m54_153",0,24,45,5052)
    hasloc(root,"m54_153",0,21,54,5054)
    hasloc(root,"m54_54",0,38,8,5055)

    # Native companion NPCs must be available together in the plane-3 hideout.
    for lx,lz,id in ((50,46,1569),(52,45,1570),(48,45,1571),
                     (53,39,1572),(58,46,1573),(57,51,1574)):
        has_npc(root,"m54_153",3,lx,lz,id)
    has_npc(root,"m54_54",0,47,21,2020)
    assert "multinpc=0,route_vanstrom_klause_sitting" in block(npc,"multi_vanstrom_stranger_entity")
    assert "multinpc=1,canafis_stranger" in block(npc,"multi_vanstrom_stranger_entity")
    assert "[opnpc1,route_vanstrom_klause_sitting]" in q
    assert "[opnpc1,canafis_stranger]" in q
    assert "%thsfm_vanstrom_hide = 1;" in h

    # Real 377 varbits and existing varp IDs; no extra 377 cache IDs.
    for name,base,bit in (
        ("bridgerung1","routequestmulti",20),
        ("bridgerung2","routequestmulti",21),
        ("bridgerung3","routequestmulti",22),
        ("thsfm_vanstrom_hide","routequestmulti",25)):
        data=block(varbit,name)
        assert f"basevar={base}" in data and f"startbit={bit}" in data
    for name in ("routequest","routequestmulti","routequest_myreque_bits"):
        assert "scope=perm" in block(varp,name), f"Nonpersistent {name}"
    assert "transmit=yes" in block(varp,"routequestmulti"), "Vanstrom disguise must transmit to client"
    for name in ("routequest","routequestmulti","routequest_myreque_bits"):
        assert re.search(r"(?m)^\d+="+re.escape(name)+r"$",(root/"pack/varp.pack").read_text())
    for name in ("route_bridge_repairs","route_members_seen"):
        assert not re.search(r"(?m)^\["+name+r"\]$",varp), "unauthorised new client varp ID"

    # Exact resource expense, distinct bridge flags and no reward without boss.
    for stage,flag in (("route_hollows","bridgerung1"),
                       ("route_bridge_one","bridgerung2"),
                       ("route_bridge_two","bridgerung3")):
        assert f"if (%routequest = ^{stage}) %{flag} = 1;" in t
    assert "inv_del(inv, nails, ^route_steel_nails_per_span);" in t
    assert "^route_steel_nails_per_span = 75" in const
    assert "^route_bridge_spans = 3" in const
    assert "inv_del(inv, woodplank, ^route_woodplanks_to_boatman);" in t
    assert "^route_woodplanks_to_boatman = 3" in const
    assert "inv_del(inv, steel_sword, 2);" in q
    assert "testbit(%routequest_myreque_bits, $bit)" in q
    assert "[ai_queue3,skeleton_hellhound]" in h
    assert "queue(route_hound_defeated, 0, 0);" in h
    assert "%routequest = ^route_hound_dead;" in h
    assert "[queue,route_quest_complete]" in q
    assert "if (%routequest ! ^route_return) return;" in q
    assert q.count("stat_advance(") == 5
    assert "600 Attack XP|600 Defence XP|600 Strength XP|600 Hitpoints XP|600 Crafting XP" in q
    print("MYREQUE_2005_CACHE_AND_SOURCE_CONTRACT_OK")
    print("This does not prove client clicks, collision, genuine combat or save/relogin.")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--content",required=True,type=Path)
    check(p.parse_args().content.resolve(strict=True))

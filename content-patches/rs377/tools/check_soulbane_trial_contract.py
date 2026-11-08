#!/usr/bin/env python3
"""Source-only 2006 A Soul's Bane trial gate; NOT a real combat playthrough."""
from __future__ import annotations
import argparse
from pathlib import Path
import re

def verify(root: Path) -> None:
    q = root / "scripts/quests/quest_soulbane"
    code = (q / "scripts/quest_soulbane.rs2").read_text()
    const = (q / "configs/quest_soulbane.constant").read_text()
    varbits = (root / "scripts/_unpack/377/all.varbit").read_text()
    npc_pack = (root / "pack/npc.pack").read_text()
    loc_pack = (root / "pack/loc.pack").read_text()
    for target,value in (("soulbane_fear_needed",5),("soulbane_hope_needed",15)):
        assert f"^{target} = {value}" in const.splitlines(),target
    for target in ("soulbane_confu_creeper","soulbane_hope_monst1",
                   "soulbane_hope_monst2","soulbane_hope_monst3"):
        assert any(line.split("=",1)[-1] == target for line in npc_pack.splitlines()),target
    for index in range(1,6):
        flag=f"soulbane_confu_door{index}pres"
        assert f"[{flag}]" in varbits,flag
        assert f"if (%{flag} = 0)" in code,flag
        assert f"%{flag} = 1;" in code,flag
    assert "[soulbane_hope_bridgepres]" in varbits
    assert "%soulbane_hope_bridgepres = 1;" in code
    assert "%soulbane_confu_door6open = 1;" in code
    assert "if (%soulbane_prog ! ^soulbane_confusion)" in code
    assert "if (%soulbane_hope_killedtally >= ^soulbane_hope_needed)" in code
    assert re.search(r"(?m)^1390[7-9]=soulbane_door_multi[1-3]$",loc_pack)
    # Original story is mother Launa and her son Tolna, with father Brana.
    for wrong in ("my brother too","my sister, not me","Tolna and I are friends again"):
        assert wrong not in code,wrong
    assert "My son Tolna" in code
    assert "~send_quest_complete(questlist:soulbane" in code
    print("SOULBANE_2006_SOURCE_TRIAL_GATES_PASSED (not client combat or historical dialogue parity)")

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--content",type=Path,required=True)
    args=ap.parse_args()
    verify(args.content.resolve(strict=True))

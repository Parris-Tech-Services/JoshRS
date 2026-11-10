#!/usr/bin/env python3
"""Register NPCs that ported quests reference but the target revision lacks.

Every one of the 26 ported quests references NPC symbols the revision-274 registry has never heard
of. Their scripts therefore have handlers for NPCs that cannot exist, which is why Sigmund was
missing beside the Duke: not a spawn bug, a registration bug.

Design choice that matters: **ported NPCs keep their revision-377 numeric ids** where that range is
free in the target (274 tops out at 1358, 377 goes far higher). Map files carry numeric NPC ids, and
the 377 maps were already copied in to supply the missing regions - so preserving the 377 ids keeps
those maps coherent instead of spawning the wrong NPC on every tile. Re-allocating fresh ids would
silently desynchronise every spawn in every copied map.

A symbol whose 377 id collides with an existing target id is refused and reported, never remapped
silently, because remapping would require rewriting the maps that reference it.

Usage:
    port-quest-npcs.py <target-content> <377-content> [--dry-run]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

PORTED = {
    "quest_agrith", "quest_deal", "quest_dwarfrock", "quest_elid", "quest_fenkenstrain", "quest_feud",
    "quest_forget", "quest_garden", "quest_giantdwarf", "quest_golem", "quest_handsand", "quest_hauntedmine",
    "quest_ics", "quest_losttribe", "quest_makinghistory", "quest_mdaughter", "quest_myreque", "quest_osf",
    "quest_rag", "quest_soulbane", "quest_swansong", "quest_tog", "quest_troll_love", "quest_twocats",
    "quest_wanted", "quest_zogre",
}


def load_pack(path: Path) -> dict[str, int]:
    out = {}
    if not path.exists():
        return out
    for line in path.read_text(errors="ignore").splitlines():
        if "=" in line:
            i, n = line.split("=", 1)
            if i.strip().isdigit():
                out[n.strip()] = int(i)
    return out


def npc_block(all_npc: Path, name: str) -> str | None:
    lines = all_npc.read_text(errors="ignore").splitlines(True)
    try:
        start = next(i for i, l in enumerate(lines) if l.strip() == f"[{name}]")
    except StopIteration:
        return None
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("[")), len(lines))
    return "".join(lines[start:end])


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    target = Path(sys.argv[1]).expanduser()
    src = Path(sys.argv[2]).expanduser()
    dry = "--dry-run" in sys.argv

    tpack = target / "pack/npc.pack"
    ref_pack = load_pack(tpack)
    src_pack = load_pack(src / "pack/npc.pack")

    rev = "274"
    world_json = target.parent / "engine/data/config/world.json"
    if world_json.exists():
        import json
        rev = str(json.loads(world_json.read_text()).get("engine", {}).get("revision", rev)) or rev
    t_all_npc = target / f"scripts/_unpack/{rev}/all.npc"
    s_all_npc = src / "scripts/_unpack/377/all.npc"
    if not t_all_npc.exists() or not s_all_npc.exists():
        print(f"BLOCKED: need {t_all_npc} and {s_all_npc}")
        return 2

    known_defs = set(re.findall(r"(?m)^\[([a-z0-9_]+)\]", t_all_npc.read_text(errors="ignore")))

    # Collect symbols referenced by ported quests
    wanted: set[str] = set()
    qdir = target / "scripts/quests"
    for q in sorted(qdir.iterdir()):
        if not q.is_dir() or q.name not in PORTED:
            continue
        for f in (q / "scripts").glob("*.rs2"):
            text = f.read_text(errors="ignore")
            # NPC handlers only, including the "u" variants ([opnpcu,...]) used heavily by quests.
            wanted |= set(re.findall(r"\[opnpcu?\d*,\s*([a-z0-9_]+)\]", text, re.I))

    to_add, refused, no_def = [], [], []
    for name in sorted(wanted):
        if name in ref_pack:
            continue
        sid = src_pack.get(name)
        if sid is None:
            no_def.append(name)
            continue
        if sid in set(ref_pack.values()):
            refused.append((name, sid))
            continue
        block = npc_block(s_all_npc, name)
        if block is None:
            no_def.append(name)
            continue
        to_add.append((name, sid, block))

    print(f"referenced NPC symbols: {len(wanted)}")
    print(f"already registered: {len(wanted) - len(to_add) - len(refused) - len(no_def)}")
    print(f"to register (keeping 377 id): {len(to_add)}")
    print(f"refused (id already used in target): {len(refused)}  {refused[:5]}")
    print(f"no definition upstream: {len(no_def)}  {no_def[:5]}")

    if dry or not to_add:
        return 0

    with tpack.open("a") as fh:
        for name, sid, _ in to_add:
            fh.write(f"{sid}={name}\n")
    with t_all_npc.open("a") as fh:
        for name, _, block in to_add:
            fh.write("\n" + block)
    print(f"registered {len(to_add)} NPCs, appended definitions to {t_all_npc.name}")
    print("restart the world to repack")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

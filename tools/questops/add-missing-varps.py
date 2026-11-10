#!/usr/bin/env python3
"""Register stage variables that ported quests reference but the target content lacks.

Background. Quests keep their progress in varps. A quest ported from 377 references symbols such as
`main_feud_var`; if the target revision has no id for that symbol, the quest cannot persist its own
stage. Two files decide this:

  pack/varp.pack                     numeric id -> symbolic name   (ids are EXPLICIT, not positional)
  scripts/_unpack/<rev>/all.varp     per-symbol properties, notably `scope=perm` for persistence

Because ids are written explicitly, appending `next=max+1` cannot renumber anything. That is why this
is safe, and it corrects an earlier assumption in docs/quests/PORTED_CONTENT.md that ids were
positional - they are not, and appending is the correct fix rather than a hazard.

Persistence matters: without `scope=perm` a quest stage may be dropped on logout. Ported quests get
`scope=perm` deliberately, even where the 377 definition omits it, because quest stage is by nature
permanent progress.

Usage:
    add-missing-varps.py <world-dir> <377-content-dir> [--dry-run]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def vars_used(quest_dir: Path) -> set[str]:
    used: set[str] = set()
    for f in (quest_dir / "scripts").glob("*.rs2"):
        text = f.read_text(errors="ignore")
        for name in re.findall(r"%([a-z0-9_]+)", text):
            # Percent-encoded text and pure numbers (e.g. "%20") are not variable references.
            if name.isdigit() or len(name) < 2:
                continue
            used.add(name)
    return used


def registry_names(all_varp: Path) -> set[str]:
    return set(re.findall(r"^\[([a-z0-9_]+)\]", all_varp.read_text(errors="ignore"), re.M))


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    world = Path(sys.argv[1]).expanduser()
    src377 = Path(sys.argv[2]).expanduser()
    dry = "--dry-run" in sys.argv

    content = world / "content"
    pack = content / "pack/varp.pack"
    # Which revision's override file to use matters: _unpack contains 225/244/245/254/274, and
    # writing to the first match silently puts definitions in the wrong revision. The engine's
    # configured revision is authoritative.
    rev = None
    world_json = world / "engine/data/config/world.json"
    if world_json.exists():
        import json
        rev = str(json.loads(world_json.read_text()).get("engine", {}).get("revision", "")) or None
    if rev is None:
        rev = "274"
        print(f"NOTE: could not read revision from {world_json}; assuming {rev}")
    all_varp = content / "scripts/_unpack" / rev / "all.varp"
    if not all_varp.exists():
        print(f"BLOCKED: no such varp override: {all_varp}")
        return 2
    print(f"varp definitions -> {all_varp}")
    qdir = content / "scripts/quests"
    pack377 = src377 / "pack/varp.pack"

    if not pack.exists() or not all_varp.exists():
        print(f"BLOCKED: missing {pack} or {all_varp}")
        return 2

    known = registry_names(all_varp)
    entries = [l for l in pack.read_text().splitlines() if "=" in l]
    next_id = max(int(l.split("=", 1)[0]) for l in entries) + 1

    # Symbols available upstream, so a missing name can be explained rather than guessed.
    upstream = {}
    if pack377.exists():
        for line in pack377.read_text().splitlines():
            if "=" in line:
                i, n = line.split("=", 1)
                upstream[n.strip()] = int(i)

    added_pack: list[str] = []
    added_defs: list[str] = []
    unexplained: list[str] = []

    for quest in sorted(p for p in qdir.iterdir() if p.is_dir() and p.name.startswith("quest_")):
        missing = sorted(v for v in vars_used(quest) if v not in known and not v.startswith("varp_"))
        for name in missing:
            if name not in upstream:
                unexplained.append(f"{quest.name}:{name}")
                continue
            added_pack.append(f"{next_id}={name}")
            added_defs.append(f"[{name}]\nscope=perm\n")
            known.add(name)
            print(f"register  id={next_id:<4} {name:<24} (for {quest.name})")
            next_id += 1

    print()
    print(f"to register: {len(added_pack)}  unexplained: {len(unexplained)}")
    if unexplained:
        print("  not found upstream, left alone: " + ", ".join(unexplained[:10]))

    if dry or not added_pack:
        return 0

    with pack.open("a") as fh:
        fh.write("\n" + "\n".join(added_pack) + "\n")
    with all_varp.open("a") as fh:
        fh.write("\n" + "\n".join(added_defs))
    print(f"appended {len(added_pack)} varps; restart the world to repack")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

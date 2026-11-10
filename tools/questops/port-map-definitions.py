#!/usr/bin/env python3
"""Import the definitions that imported maps reference but the target revision lacks.

An imported 377 map refers to entities by numeric id. If the target's `pack/<kind>.pack` has no entry
for an id, the entity simply will not exist - the ground draws, the quest character does not. This
walks every map imported from a newer revision, finds ids that do not resolve, and registers them
**using the source revision's original numeric ids**, because map files are keyed numerically and a
re-allocated id would spawn the wrong entity.

Safety rules:
  - an id already used in the target for a *different* symbol is refused, never overwritten
  - the source definition must exist, otherwise the id is reported rather than half-registered
  - only definitions referenced by maps are imported, not whole packs

Usage:
    port-map-definitions.py <target-content> <source-content> [--dry-run] [--kinds npc,loc,obj]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

SECTIONS = {"npc": "NPC", "loc": "LOC", "obj": "OBJ"}


def load_pack(path: Path) -> dict[int, str]:
    out: dict[int, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(errors="ignore").splitlines():
        parts = line.split("=")
        if len(parts) >= 2 and parts[0].strip().isdigit():
            out[int(parts[0])] = parts[1].strip()
    return out


def parse_map(path: Path) -> dict[str, set[int]]:
    out = {k: set() for k in SECTIONS}
    cur = None
    for raw in path.read_text(errors="ignore").splitlines():
        line = raw.strip()
        if line.startswith("===="):
            cur = next((k for k, v in SECTIONS.items() if v in line), None)
            continue
        if not cur:
            continue
        m = re.match(r"^-?\d+\s+-?\d+\s+-?\d+:\s*(-?\d+)", line)
        if m:
            i = int(m.group(1))
            if i > 0:
                out[cur].add(i)
    return out


_INDEX: dict[tuple[str, str], str] = {}


def build_index(source: Path, kind: str) -> None:
    """Index every definition of this kind across the source tree.

    Definitions are NOT all in `all.<kind>`: many live in per-quest config files such as
    `scripts/quests/quest_mm/configs/mm.loc`. Indexing only the unpack files reported ~1000 locs as
    "no definition upstream" that did exist.
    """
    for f in (source / "scripts").rglob(f"*.{kind}"):
        try:
            lines = f.read_text(errors="ignore").splitlines(True)
        except OSError:
            continue
        for i, line in enumerate(lines):
            if line.startswith("[") and line.rstrip().endswith("]"):
                name = line.strip()[1:-1]
                if (kind, name) in _INDEX:
                    continue
                end = next((j for j in range(i + 1, len(lines)) if lines[j].startswith("[")), len(lines))
                _INDEX[(kind, name)] = "".join(lines[i:end])


def block_for(all_file: Path, name: str, kind: str = "") -> str | None:
    if kind and (kind, name) in _INDEX:
        return _INDEX[(kind, name)]
    if not all_file.exists():
        return None
    lines = all_file.read_text(errors="ignore").splitlines(True)
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
    source = Path(sys.argv[2]).expanduser()
    dry = "--dry-run" in sys.argv
    kinds = ["npc", "loc", "obj"]
    if "--kinds" in sys.argv:
        kinds = sys.argv[sys.argv.index("--kinds") + 1].split(",")

    tmaps, smaps = target / "maps", source / "maps"
    imported = [f for f in tmaps.glob("*.jm2") if (smaps / f.name).exists()]
    print(f"maps imported from source: {len(imported)}")

    rev = "274"
    wj = target.parent / "engine/data/config/world.json"
    if wj.exists():
        import json
        rev = str(json.loads(wj.read_text()).get("engine", {}).get("revision", rev)) or rev

    for kind in kinds:
        tpack = target / f"pack/{kind}.pack"
        spack = source / f"pack/{kind}.pack"
        t_pack, s_pack = load_pack(tpack), load_pack(spack)
        t_all = target / f"scripts/_unpack/{rev}/all.{kind}"
        build_index(source, kind)
        s_all = source / "scripts/_unpack" / "377" / f"all.{kind}"

        needed: set[int] = set()
        for f in imported:
            for i in parse_map(f)[kind]:
                if i not in t_pack:
                    needed.add(i)

        add, refused, no_def = [], [], []
        for i in sorted(needed):
            name = s_pack.get(i)
            if name is None:
                no_def.append(i)
                continue
            existing = t_pack.get(i)
            if existing is not None and existing != name:
                refused.append((i, existing, name))
                continue
            blk = block_for(s_all, name, kind)
            if blk is None:
                no_def.append(i)
                continue
            add.append((i, name, blk))

        print(f"\n{kind}: referenced-but-missing {len(needed)}  register {len(add)}  "
              f"id-conflict {len(refused)}  no-definition {len(no_def)}")
        if refused:
            print(f"  refused (id already means something else): {refused[:5]}")
        if no_def:
            print(f"  no definition upstream: {no_def[:8]}")

        if dry or not add:
            continue
        with tpack.open("a") as fh:
            for i, name, _ in add:
                fh.write(f"{i}={name}\n")
        with t_all.open("a") as fh:
            for _, _, blk in add:
                fh.write("\n" + blk)
        print(f"  registered {len(add)} {kind} definitions into {t_all.name}")

    if not dry:
        print("\nrestart the world to repack, then re-run check-map-integrity.mjs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

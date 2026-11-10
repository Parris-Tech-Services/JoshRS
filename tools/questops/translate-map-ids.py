#!/usr/bin/env python3
"""Translate colliding numeric ids in imported maps so they mean the right entity.

The problem. An imported revision-377 map refers to entities by number. Some of those numbers already
mean something *different* in the target revision: id 100 might be `man` in 274 and `npc_something` in
377. Registering nothing leaves the entity missing; registering the 377 symbol under the same id would
overwrite a 274 meaning and break existing saves. Spawning silently picks the 274 meaning and the
player meets the wrong character - the worst outcome, because nothing errors.

The fix. For each colliding id referenced by an imported map:

  1. allocate a **new** id in the target for the 377 symbol (above the target's current maximum)
  2. register the symbol and its definition at that new id
  3. rewrite the reference in the **imported maps only**, from the old id to the new one

Existing target ids are never reused, so 274 meanings and player-save compatibility are preserved.
Maps are not saved by players, so rewriting a map file does not affect saves - only position data.

Usage:
    translate-map-ids.py <target-content> <source-content> [--dry-run]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

SECTIONS = {"npc": "NPC", "loc": "LOC", "obj": "OBJ"}
RECORD = re.compile(r"^(-?\d+)\s+(-?\d+)\s+(-?\d+):\s*(-?\d+)(.*)$")


def load_pack(path: Path) -> dict[int, str]:
    out: dict[int, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(errors="ignore").splitlines():
        parts = line.split("=")
        if len(parts) >= 2 and parts[0].strip().isdigit():
            out[int(parts[0])] = parts[1].strip()
    return out


def index_definitions(source: Path, kind: str) -> dict[str, str]:
    """Index definitions from the whole source tree (they also live in per-quest configs)."""
    index: dict[str, str] = {}
    for f in (source / "scripts").rglob(f"*.{kind}"):
        try:
            lines = f.read_text(errors="ignore").splitlines(True)
        except OSError:
            continue
        for i, line in enumerate(lines):
            if line.startswith("[") and line.rstrip().endswith("]"):
                name = line.strip()[1:-1]
                if name in index:
                    continue
                end = next((j for j in range(i + 1, len(lines)) if lines[j].startswith("[")), len(lines))
                index[name] = "".join(lines[i:end])
    return index


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    target = Path(sys.argv[1]).expanduser()
    source = Path(sys.argv[2]).expanduser()
    dry = "--dry-run" in sys.argv

    tmaps_dir, smaps_dir = target / "maps", source / "maps"
    imported = sorted(f for f in tmaps_dir.glob("*.jm2") if (smaps_dir / f.name).exists())
    print(f"imported maps: {len(imported)}")

    rev = "274"
    wj = target.parent / "engine/data/config/world.json"
    if wj.exists():
        import json
        rev = str(json.loads(wj.read_text()).get("engine", {}).get("revision", rev)) or rev

    total_conflicts = 0
    for kind in ("npc", "loc", "obj"):
        t_pack = load_pack(target / f"pack/{kind}.pack")
        s_pack = load_pack(source / f"pack/{kind}.pack")
        if not t_pack or not s_pack:
            continue

        # Which ids do imported maps reference, and where do meanings differ?
        conflicts: dict[int, str] = {}
        for f in imported:
            cur = None
            for raw in f.read_text(errors="ignore").splitlines():
                line = raw.strip()
                if line.startswith("===="):
                    cur = next((k for k, v in SECTIONS.items() if v in line), None)
                    continue
                if cur != kind:
                    continue
                m = RECORD.match(line)
                if not m:
                    continue
                i = int(m.group(4))
                tsym, ssym = t_pack.get(i), s_pack.get(i)
                if tsym is not None and ssym is not None and tsym != ssym:
                    conflicts[i] = ssym
        if not conflicts:
            print(f"{kind}: no conflicts")
            continue

        defs = index_definitions(source, kind)
        next_id = max(t_pack) + 1
        # Reuse an existing target ID when the same symbol was already imported. Creating a
        # second ID/name pair would produce a duplicate registry symbol and fail packing.
        by_name = {name: id for id, name in t_pack.items()}
        remap: dict[int, int] = {}
        allocations: dict[int, tuple[int, str]] = {}
        missing = []
        for old, sym in sorted(conflicts.items()):
            if sym in by_name:
                remap[old] = by_name[sym]
                continue
            if sym not in defs:
                missing.append((old, sym))
                continue
            remap[old] = next_id
            allocations[old] = (next_id, sym)
            by_name[sym] = next_id
            next_id += 1

        print(f"{kind}: conflicts={len(conflicts)} translatable={len(remap)} "
              f"no-definition={len(missing)} new ids {min(remap.values()) if remap else '-'}..{next_id - 1}")
        if missing:
            print(f"  cannot translate (no definition): {missing[:5]}")
            # Do not make a partial rewrite that would leave this map kind unresolved.
            return 1
        total_conflicts += len(remap)
        if dry or not remap:
            continue

        # Only newly allocated symbols need new pack and definition entries. Reusing an
        # already registered symbol must never duplicate its definition.
        if allocations:
            with (target / f"pack/{kind}.pack").open("a") as fh:
                for _, (new, sym) in allocations.items():
                    fh.write(f"{new}={sym}\n")
            t_all = target / "scripts/_unpack" / rev / f"all.{kind}"
            with t_all.open("a") as fh:
                for _, (_, sym) in allocations.items():
                    fh.write("\n" + defs[sym])

        # Rewrite only the imported maps, only in this kind's section.
        rewritten = 0
        for f in imported:
            lines = f.read_text(errors="ignore").splitlines(True)
            cur, changed = None, False
            for idx, raw in enumerate(lines):
                line = raw.strip()
                if line.startswith("===="):
                    cur = next((k for k, v in SECTIONS.items() if v in line), None)
                    continue
                if cur != kind:
                    continue
                m = RECORD.match(line)
                if not m:
                    continue
                old = int(m.group(4))
                if old in remap:
                    lines[idx] = f"{m.group(1)} {m.group(2)} {m.group(3)}: {remap[old]}{m.group(5)}\n"
                    changed = True
            if changed:
                f.write_text("".join(lines))
                rewritten += 1
        print(f"  registered {len(allocations)} new symbols, reused {len(remap) - len(allocations)} existing, rewrote {rewritten} maps")

    print(f"\ntotal translated references: {total_conflicts}")
    if not dry:
        print("restart the world to repack, then re-run check-map-integrity.mjs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

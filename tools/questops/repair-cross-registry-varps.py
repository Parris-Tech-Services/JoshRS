#!/usr/bin/env python3
"""Remove varp registrations that collide with varbit/varn/vars names.

Why this exists. `Engine-TS` revision 274 rejects duplicate symbolic names across the four
config registries (`tools/pack/config/PackShared.ts`): VarpPack, VarbitPack, VarnPack and VarsPack
share one namespace. A name may be registered in exactly one of them.

`add-missing-varps.py` did not know that. It registered every `%name` a ported quest referenced as a
varp, including names that were already varbits, varns or vars. That produced colliding registrations
- 56 of them - and the engine refuses to pack while they exist. Checking only `varp.pack` for
duplicates misses this entirely, because each file is internally unique.

Repair rule: a pre-existing varbit/varn/vars registration wins. Those symbols are already usable from
scripts; the added varp is the redundant one. The varp is removed together with its `all.varp`
definition block, which is also invalid for a name owned by another registry.

Player-save safety: nothing that pre-dates the additions is touched. Only varp ids at or above
--min-id are considered, which are exactly the ids this project appended after the stock registry.

Usage:
    repair-cross-registry-varps.py <content-dir> [--min-id 359] [--dry-run]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

KINDS = ("varp", "varbit", "varn", "vars")


def load(pack_file: Path) -> dict[str, int]:
    out: dict[str, int] = {}
    if not pack_file.exists():
        return out
    for line in pack_file.read_text().splitlines():
        if "=" in line:
            i, n = line.split("=", 1)
            out[n.strip()] = int(i)
    return out


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    content = Path(sys.argv[1]).expanduser()
    dry = "--dry-run" in sys.argv
    min_id = 359
    if "--min-id" in sys.argv:
        min_id = int(sys.argv[sys.argv.index("--min-id") + 1])

    packdir = content / "pack"
    packs = {k: load(packdir / f"{k}.pack") for k in KINDS}

    owners: dict[str, list[str]] = {}
    for kind, names in packs.items():
        for n in names:
            owners.setdefault(n, []).append(kind)

    collisions = {n: ks for n, ks in owners.items() if len(ks) > 1}
    print(f"cross-registry collisions before: {len(collisions)}")

    # Only drop varp entries we appended, and only where another registry owns the name.
    drop: list[str] = []
    for name, kinds in collisions.items():
        if "varp" not in kinds:
            continue
        vid = packs["varp"][name]
        if vid < min_id:
            print(f"  KEEP  {name}: varp id {vid} predates our additions ({min_id}+)")
            continue
        drop.append(name)

    print(f"varp entries to remove: {len(drop)}")
    for n in drop[:10]:
        print(f"  remove varp {n} (id {packs['varp'][n]}) - owned by "
              f"{[k for k in collisions[n] if k != 'varp']}")

    if dry or not drop:
        return 0

    # Rewrite the varp pack without the dropped names.
    remaining = [f"{i}={n}" for n, i in sorted(packs["varp"].items(), key=lambda kv: kv[1])
                 if n not in set(drop)]
    (packdir / "varp.pack").write_text("\n".join(remaining) + "\n")

    # Remove their definition blocks from the revision override file.
    rev = None
    world_json = content.parent / "engine/data/config/world.json"
    if world_json.exists():
        import json
        rev = str(json.loads(world_json.read_text()).get("engine", {}).get("revision", "")) or None
    rev = rev or "274"
    all_varp = content / "scripts/_unpack" / rev / "all.varp"
    if all_varp.exists():
        blocks = re.split(r"(?m)^(?=\[)", all_varp.read_text())
        kept, removed = [], 0
        for b in blocks:
            m = re.match(r"\[([a-z0-9_]+)\]", b)
            if m and m.group(1) in set(drop):
                removed += 1
                continue
            kept.append(b)
        all_varp.write_text("".join(kept))
        print(f"removed {removed} definition blocks from {all_varp}")

    # Re-verify from disk.
    packs2 = {k: load(packdir / f"{k}.pack") for k in KINDS}
    owners2: dict[str, list[str]] = {}
    for kind, names in packs2.items():
        for n in names:
            owners2.setdefault(n, []).append(kind)
    left = {n: ks for n, ks in owners2.items() if len(ks) > 1}
    print(f"cross-registry collisions after: {len(left)}")
    if left:
        for n, ks in list(left.items())[:10]:
            print(f"  STILL COLLIDING {n}: {ks}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

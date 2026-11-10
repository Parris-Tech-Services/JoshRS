#!/usr/bin/env python3
"""Register config names that a failed content build reports as missing.

The Lost City packers resolve every config symbol by name. A quest ported from a
different revision references items/NPCs/objects/varps the target cache knows about
but the target `pack/*.pack` has no id for, so the build stops with
"Missing <kind> pack IDs for:". Ids in these packs are explicit (`id=name`), so
appending `next=max+1` never renumbers existing content.

Usage:
    register-missing-packs.py <content-dir> <build-log> [--dry-run]

Then re-run the build; repeat until it moves past pack-id registration.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

MISSING = re.compile(r"Missing (\w+) pack IDs? for:\n(.*?)(?=\n\d|\Z)", re.S)


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    content = Path(sys.argv[1]).expanduser().resolve()
    log = Path(sys.argv[2]).expanduser().read_text(errors="ignore")
    dry = "--dry-run" in sys.argv
    total = 0
    for match in MISSING.finditer(log):
        kind, body = match.group(1), match.group(2)
        names = re.findall(r"\[([a-z0-9_]+)\]", body, re.I)
        path = content / "pack" / f"{kind}.pack"
        lines = path.read_text().rstrip("\n").split("\n")
        top = max(int(line.split("=")[0]) for line in lines if "=" in line)
        known = {line.split("=", 1)[1] for line in lines if "=" in line}
        added = []
        for name in names:
            if name in known:
                continue
            top += 1
            added.append(f"{top}={name}")
            known.add(name)
        if added and not dry:
            path.write_text("\n".join(lines + added) + "\n")
        total += len(added)
        print(f"{kind}: +{len(added)} (max id now {top})")
    print(f"{'would register' if dry else 'registered'} {total} ids")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

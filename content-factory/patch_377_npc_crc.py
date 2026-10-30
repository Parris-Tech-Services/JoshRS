#!/usr/bin/env python3
"""Narrow checksum exception for intentional original JoshRS NPC definitions.

An untouched baseline NPC CRC cannot match when a new NPC is added.
Leaves other BUILD_VERIFY, pack and compiler checks enabled.
"""
import argparse
from pathlib import Path
import sys

STOCK = "if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {"
LOC = "if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !validate(client.dat, server.dat)) {"
NPC = "!(extension === '.npc' && process.env.JOSHRS_CUSTOM_NPCS === 'true')"
BOTH = "if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && " + NPC + " && !validate(client.dat, server.dat)) {"
ONLY_NPC = "if (Environment.BUILD_VERIFY && validate && " + NPC + " && !validate(client.dat, server.dat)) {"


def patch_engine(engine: Path) -> str:
    file = engine / "tools/pack/config/PackShared.ts"
    original = file.read_text(encoding="utf-8")
    if original.count(STOCK) == 1:
        modified = original.replace(STOCK, ONLY_NPC)
    elif original.count(LOC) == 1:
        modified = original.replace(LOC, BOTH)
    elif original.count(ONLY_NPC) == 1 or original.count(BOTH) == 1:
        return "already scoped"
    else:
        raise ValueError("Unsupported or ambiguous engine checksum logic: no changes made")
    if modified == original:
        raise ValueError("No checksum patch applied")
    backup = file.with_suffix(".ts.joshrs-original.bak")
    if backup.exists() and backup.read_text(encoding="utf-8") != original:
        raise ValueError("A different backup already exists")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
    file.write_text(modified, encoding="utf-8")
    return "Only the historic NPC checksum may be skipped; other verification remains on"


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--engine", type=Path, required=True)
    a = p.parse_args()
    try:
        print(patch_engine(a.engine))
    except (OSError, ValueError) as e:
        print("Scoped NPC CRC patch refused: " + str(e), file=sys.stderr)
        raise SystemExit(1)

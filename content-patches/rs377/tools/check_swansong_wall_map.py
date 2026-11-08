#!/usr/bin/env python3
"""Verify that the pinned Piscatoris map actually contains five DISTINCT repair walls.

Read-only on the disposable compiled content; refuses silent fallback to other maps.
"""
import argparse
from pathlib import Path
import re

WALLS = {(7, 19): 14945, (7, 25): 14946, (7, 31): 14947, (7, 43): 14945, (7, 45): 14946}
BASE = {(7, 19): 14943, (7, 25): 14941, (7, 31): 14943, (7, 43): 14943, (7, 45): 14942}

def validate_map(content: Path) -> None:
    data = (content / "maps/m36_57.jm2").read_text()
    locations = data.split("==== LOC ====", 1)[1].split("==== NPC ====", 1)[0]
    found = {}
    for p, x, z, item, shape, angle in re.findall(r"(?m)^(\d+) (\d+) (\d+): (\d+) (\d+)(?: (\d+))?$", locations):
        key = (int(x), int(z))
        if int(p) == 0 and key in WALLS:
            found.setdefault(key, []).append((int(item), int(shape), int(angle or 0)))
    for xy, expected in WALLS.items():
        values = found.get(xy, [])
        assert len(values) == 1, f"Missing/duplicated wall loc at {xy}: {values}"
        assert values[0][0] == expected and values[0][1] == 0, f"Unexpected loc at {xy}: {values}"
    for xy, original in BASE.items():
        assert original != WALLS[xy], f"Wall was not actually changed: {xy}"
    assert len(WALLS) == 5
    print("SWANSONG_FIVE_UNIQUE_WALL_LOCATIONS_VERIFIED")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--content", required=True, type=Path)
    validate_map(parser.parse_args().content)

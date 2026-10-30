#!/usr/bin/env python3
"""Repair a confirmed, pinned 377 Haunted Manor source TODO in a private checkout.

Code-only patch. No copyrighted cache/dialogue, player saves, account DB, map
or client files are distributed or modified. Do not claim local gameplay passed.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import re
import sys

SOURCE = Path("scripts/quests/quest_haunted/scripts/quest_haunted.rs2")
START = "// todo: This is borked for opening the doors now. Using the lever is fine."
END = "[oploc1,puzzle_ladder_top]"
SIGNATURE = "// JoshRS 377: find the two bookcases across adjacent 8x8 map zones."
# Replacement includes only original glue. LocTypes and all game content
# remain in the independently pinned upstream Content checkout.
REPLACEMENT = """// JoshRS 377: find the two bookcases across adjacent 8x8 map zones.
[label,manor_bookcase_door](coord $dest)
p_delay(0);
def_coord $left_coord = ~loc_within_distance(coord, hauntedbookcasel, 0);
def_coord $right_coord = ~loc_within_distance(coord, hauntedbookcaser, 0);
if ($left_coord = null | $right_coord = null) {
    mes("The hidden door is not responding.");
    return;
}
if (loc_find($left_coord, hauntedbookcasel) = true) {
    loc_change(inviswall, 3);
    loc_add(movecoord($left_coord, 0, 0, -1), hauntedbookcaseopen, loc_angle, loc_shape, 3);
}
if (loc_find($right_coord, hauntedbookcaser) = true) {
    loc_change(inviswall, 3);
    loc_add(movecoord($right_coord, 0, 0, 1), hauntedbookcaseopen, loc_angle, loc_shape, 3);
    sound_synth(coffin_open, 1, 0);
}
p_teleport($dest);
"""

def plan_patch(content: Path) -> tuple[Path, str, str]:
    root = content.resolve(strict=True)
    p = root / SOURCE
    if p.is_symlink() or not p.is_file() or not p.resolve(strict=True).is_relative_to(root):
        raise ValueError("Refusing missing, linked or outside source")
    original = p.read_text(encoding="utf-8")
    if SIGNATURE in original:
        if original.count(SIGNATURE) != 1 or REPLACEMENT not in original:
            raise ValueError("Previously patched quest script differs from approved version")
        return p, original, original
    if original.count(START) != 1 or original.count(END) != 1:
        raise ValueError("Unexpected pinned quest source; no automatic port")
    a = original.index(START)
    b = original.index(END)
    if a >= b:
        raise ValueError("Quest anchor order is unexpected")
    previous = original[a:b]
    required = (
        "[label,manor_bookcase_door](coord $dest)",
        "loc_findallzone(movecoord(coord, 0, 0, -1));",
        "if(loc_type = hauntedbookcasel)",
        "if(loc_type = hauntedbookcaser)",
        "p_teleport($dest);",
    )
    if any(x not in previous for x in required):
        raise ValueError("Original bookcase logic doesn't match expected pin")
    return p, original, original[:a] + REPLACEMENT + "\n" + original[b:]


def apply(content: Path, *, write: bool = False) -> str:
    path, original, revised = plan_patch(content)
    if revised == original:
        return "already_patched"
    if not write:
        return "eligible_pinned_source_not_modified"
    before = original.encode("utf-8")
    digest = hashlib.sha256(before).hexdigest()[:16]
    backup = path.with_name(path.name + ".joshrs-before-" + digest + ".bak")
    if backup.exists() and backup.read_bytes() != before:
        raise ValueError("Backup exists with different content; refusing changes")
    if not backup.exists():
        backup.write_bytes(before)
    path.write_text(revised, encoding="utf-8")
    if path.read_text(encoding="utf-8") != revised:
        raise ValueError("Patch verification failed")
    return "patched_with_backup"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--content", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        print("Haunted Manor guarded source patch:", apply(args.content, write=args.apply))
    except (OSError, ValueError, UnicodeDecodeError) as exc:
        print("Patch refused: " + str(exc), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()

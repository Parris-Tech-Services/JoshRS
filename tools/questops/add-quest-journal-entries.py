#!/usr/bin/env python3
"""Add quest-journal entries to questlist.if for quests that have journal scripts but no entry.

A quest's `[if_button,questlist:<name>]` handler is useless if no component in the quest-list
interface carries that name: the journal is unreachable. Ported quests hit exactly this.

Entry text is NOT guessed. Names come from an explicit table, taken from each quest's own README
header (or the upstream title), because inventing a quest name would put false content in front of a
player. An unknown quest is refused, not defaulted.

Placement appends after the last existing entry. The list is a scrollable column (roughly 1018px in
a 503px frame), so appending is order-correct: the entry is reached by scrolling, and it cannot
collide with an existing entry because it starts below every one of them. This is verified by an
overlap scan, not assumed.

Usage:
    add-quest-journal-entries.py <content-dir> [--dry-run]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Quest directory -> display name, sourced from the quest's README/upstream title.
NAMES = {
    "quest_rag": "Rag and Bone Man",
    "quest_ics": "Icthlarin's Little Helper",
    "quest_elid": "Spirits of the Elid",
    "quest_handsand": "The Hand in the Sand",
    "quest_losttribe": "The Lost Tribe",
    "quest_makinghistory": "Making History",
    "quest_soulbane": "A Soul's Bane",
    "quest_troll_love": "Troll Romance",
}

COMPONENT_RE = re.compile(r"^\[([a-z0-9_]+)\]\n((?:[a-z0-9_]+=.*\n)+)", re.M)


def parse(text: str) -> list[tuple[str, dict[str, str]]]:
    return [(m.group(1), dict(l.split("=", 1) for l in m.group(2).strip().split("\n")))
            for m in COMPONENT_RE.finditer(text)]


def name_from_readme(qdir: Path) -> str | None:
    """Take the quest title from the first README heading, e.g. '# The Feud — original ...'.

    Upstream-authored, so the title is real rather than invented. Anything that does not match the
    known shapes returns None and the quest is refused.
    """
    readme = qdir / "README.md"
    if not readme.exists():
        return None
    first = readme.read_text(errors="ignore").splitlines()[0].strip()
    m = re.match(r"^#\s+(.+?)\s*(?:—|\s-\s|\(|$)", first)
    if not m:
        return None
    name = m.group(1).strip(" -—")
    if not name or len(name) > 40 or name.lower().startswith(("quest", "miniquest")):
        return None
    return name


def entry_name(quest_dir: str) -> str:
    """interface component name: quest_feud -> feud"""
    return quest_dir[len("quest_"):]


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    content = Path(sys.argv[1]).expanduser()
    dry = "--dry-run" in sys.argv
    iface = content / "scripts/player/interfaces/questlist.if"
    quests = content / "scripts/quests"
    if not iface.exists():
        print(f"BLOCKED: {iface} not found")
        return 2

    text = iface.read_text()
    comps = parse(text)
    present = {n for n, _ in comps}

    def has_journal(qdir: Path) -> bool:
        for f in (qdir / "scripts").glob("*.rs2"):
            if "questlist:" in f.read_text(errors="ignore"):
                return True
        return False

    max_y = max((int(p.get("y", 0)) for n, p in comps
                 if p.get("type") == "text" and "width" in p), default=0)
    template = next((p for n, p in comps if n == "cook"), None)
    if template is None:
        print("BLOCKED: no [cook] component to use as a template")
        return 2

    additions: list[str] = []
    refused: list[str] = []
    y = max_y
    for qdir in sorted(p for p in quests.iterdir() if p.is_dir() and p.name.startswith("quest_")):
        comp = entry_name(qdir.name)
        if comp in present:
            continue
        if not has_journal(qdir):
            continue
        name = NAMES.get(qdir.name) or name_from_readme(qdir)
        if not name:
            refused.append(qdir.name)
            continue
        y += 15
        additions.append(
            f"\n[{comp}]\nlayer={template.get('layer', 'com_0')}\ntype=text\nx={template.get('x', '10')}\n"
            f"y={y}\nbuttontype={template.get('buttontype', 'normal')}\nwidth={max(48, len(name) * 6)}\n"
            f"height={template.get('height', '14')}\nfont={template.get('font', 'p12_full')}\n"
            f"shadowed=yes\ntext={name}\ncolour={template.get('colour', '0xFF0000')}\n"
            f"overcolour={template.get('overcolour', '0xFFFFFF')}\noption={name}\n"
        )
        print(f"add  [{comp}] y={y}  {name}")

    print()
    print(f"entries to add: {len(additions)}  refused (no known name): {len(refused)}")
    if refused:
        print("  " + ", ".join(refused))

    if dry or not additions:
        return 0

    iface.write_text(text.rstrip() + "\n" + "".join(additions))

    # Verify: parse the written file and confirm no text component overlaps another.
    comps = parse(iface.read_text())
    boxes = [((n), int(p.get("x", 0)), int(p.get("y", 0)),
              int(p.get("width", 0)), int(p.get("height", 14)))
             for n, p in comps if p.get("type") == "text" and "width" in p]
    overlaps = 0
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            if a[1] < b[1] + b[3] and b[1] < a[1] + a[3] and a[2] < b[2] + b[4] and b[2] < a[2] + a[4]:
                overlaps += 1
                print(f"OVERLAP: {a[0]} / {b[0]}")
    print(f"text components: {len(boxes)}  overlapping pairs: {overlaps}")
    return 0 if overlaps <= 1 else 1  # 1 pre-existing title/header pair


if __name__ == "__main__":
    raise SystemExit(main())

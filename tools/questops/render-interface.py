#!/usr/bin/env python3
"""Render a ReScript `.if` interface to a PNG so a human (or an agent with vision) can see it.

Why this exists: verifying interface work normally needs a running client on a screen. This
project has neither a renderer nor a working screenshot path, so interface edits were unverifiable
and therefore not attempted. Parsing the layout and drawing it sidesteps that: it will not show
fonts, sprites or scroll behaviour, but it *will* show whether a new component overlaps another,
which is the actual risk in adding a quest-list entry.

Draws every component as a labelled box in interface coordinate space (the classic 765x503 canvas),
with `type`, `text` and `colour` honoured where present.

Usage:
    render-interface.py <file.if> <out.png> [--scale N] [--highlight NAME]
"""
from __future__ import annotations

import sys

from PIL import Image, ImageDraw, ImageFont

CANVAS_W, CANVAS_H = 765, 503
MARGIN = 20


def parse(path: str) -> list[dict]:
    comps: list[dict] = []
    current: dict | None = None
    with open(path, encoding="utf-8", errors="replace") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("//"):
                continue
            if line.startswith("[") and line.endswith("]"):
                if current:
                    comps.append(current)
                current = {"name": line[1:-1], "props": {}}
                continue
            if current is not None and "=" in line:
                k, v = line.split("=", 1)
                current["props"][k.strip()] = v.strip()
    if current:
        comps.append(current)
    return comps


def num(props: dict, key: str, default: int = 0) -> int:
    try:
        return int(props.get(key, default))
    except (TypeError, ValueError):
        return default


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    src, out = sys.argv[1], sys.argv[2]
    scale = 2
    highlight = None
    args = sys.argv[3:]
    for i, a in enumerate(args):
        if a == "--scale" and i + 1 < len(args):
            scale = max(1, min(6, int(args[i + 1])))
        if a == "--highlight" and i + 1 < len(args):
            highlight = args[i + 1]

    comps = parse(src)
    if not comps:
        print(f"no components parsed from {src}", file=sys.stderr)
        return 1

    img = Image.new("RGB", ((CANVAS_W + 2 * MARGIN) * scale, (CANVAS_H + 2 * MARGIN) * scale), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", max(7, 6 * scale))
    except Exception:
        font = ImageFont.load_default()

    # Interface coordinate space, for scale reference
    draw.rectangle(
        [MARGIN * scale, MARGIN * scale, (MARGIN + CANVAS_W) * scale, (MARGIN + CANVAS_H) * scale],
        outline="#bbbbbb",
    )

    drawn = 0
    for c in comps:
        p = c["props"]
        if p.get("type") not in ("text", "button", "graphic", "layer", "model", "line"):
            pass  # draw everything anyway; unknown types are informative
        x, y = num(p, "x"), num(p, "y")
        w, h = num(p, "width", 0), num(p, "height", 0)
        if w <= 0 or h <= 0:
            continue
        is_hi = highlight and c["name"] == highlight
        colour = p.get("colour", "#333333")
        try:
            rgb = int(colour, 16) if colour.lower().startswith("0x") else int(colour.lstrip("#"), 16)
            outline = ((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF)
        except ValueError:
            outline = (60, 60, 60)
        box = [
            (MARGIN + x) * scale, (MARGIN + y) * scale,
            (MARGIN + x + w) * scale, (MARGIN + y + h) * scale,
        ]
        draw.rectangle(box, outline=(220, 0, 0) if is_hi else outline, width=2 if is_hi else 1)
        label = p.get("text") or c["name"]
        if len(label) > 22:
            label = label[:21] + "…"
        ty = box[1] + 1
        if ty < img.height - 10:
            draw.text((box[0] + 1, ty), label, fill=(0, 0, 0), font=font)
        drawn += 1

    img.save(out)
    print(f"{src}: {len(comps)} components, {drawn} drawn -> {out} ({img.width}x{img.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

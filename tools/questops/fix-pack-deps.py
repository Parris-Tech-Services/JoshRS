#!/usr/bin/env python3
"""Import whatever symbol the packer complains about, then let the caller retry.

Ported content references items, locations, animations and NPCs that revision 274 never had. The
packer reports one at a time, so this closes the loop: parse the error, find the symbol in the pinned
377 source, register it under its ORIGINAL id, and append its definition.

Ids are preserved because maps and configs are keyed numerically. A symbol whose source id is already
taken in the target is refused and reported, never remapped silently.

Usage: fix-pack-deps.py <target-content> <377-content> <packer-log-file>
Exit: 0 = something was imported, 3 = nothing importable, 2 = usage.
"""
import re
import sys
from pathlib import Path

# Only TEXT definitions may be imported. Registering an animation, model, seq frame or sound NAME
# adds no data: those live in the game cache, and a name in a 274 pack gives no frames. Importing them
# makes the build fail or the object animate wrongly, so they are refused and reported instead.
IMPORTABLE = ("obj", "loc", "npc", "inv", "varp", "varbit", "varn", "vars", "enum", "param", "struct", "mes", "idk")
CACHE_DATA = ("anim", "animset", "seq", "spotanim", "sound", "synth", "model")

def load_pack(p):
    out = {}
    if not p.exists():
        return out
    for line in p.read_text(errors="ignore").splitlines():
        if "=" in line:
            i, n = line.split("=", 1)
            if i.strip().isdigit():
                out[n.strip()] = int(i)
    return out

def index_defs(src, kind):
    idx = {}
    for f in (src / "scripts").rglob(f"*.{kind}"):
        try:
            lines = f.read_text(errors="ignore").splitlines(True)
        except OSError:
            continue
        for i, l in enumerate(lines):
            if l.startswith("[") and l.rstrip().endswith("]"):
                nm = l.strip()[1:-1]
                if nm not in idx:
                    end = next((j for j in range(i + 1, len(lines)) if lines[j].startswith("[")), len(lines))
                    idx[nm] = "".join(lines[i:end])
    return idx

def main():
    if len(sys.argv) < 4:
        print(__doc__); return 2
    target, src, log = Path(sys.argv[1]).expanduser(), Path(sys.argv[2]).expanduser(), Path(sys.argv[3])
    text = log.read_text(errors="ignore") if log.exists() else ""
    symbols = set()
    for m in re.finditer(r"(?i)(?:multivar|varbit|varp|param|stat|inv)=([a-z0-9_]+)", text):
        symbols.add(m.group(1))
    # "data=...,symbol" and "Invalid property value: anim=symbol"
    for m in re.finditer(r"data=[a-z0-9_]+,([a-z0-9_]+)", text):
        symbols.add(m.group(1))
    # Property names can contain digits (frame1=...), which an [a-z]+ class rejected.
    # Config keys reference registries by name: multivar=, varbit=, varp=, param=, anim= ...
    for m in re.finditer(r"(?i)(?:invalid property value|invalid property key|non-unique var name|unknown|missing)[^\n]*?([a-z0-9_]+)=([a-z0-9_]+)", text):
        symbols.add(m.group(2))
    if not symbols:
        print("no symbol found in packer output"); return 3

    src_packs = {k: load_pack(src / f"pack/{k}.pack") for k in IMPORTABLE}
    cache_packs = {k: load_pack(src / f"pack/{k}.pack") for k in CACHE_DATA}
    imported = []
    for sym in sorted(symbols):
        for kind in IMPORTABLE:
            if sym not in src_packs[kind]:
                continue
            sp = src_packs[kind]
            tp_path = target / f"pack/{kind}.pack"
            tp = load_pack(tp_path)
            if sym in tp:
                continue                      # already registered
            sid = sp[sym]
            if sid in set(tp.values()):
                print(f"REFUSED {kind} {sym}: id {sid} already used in target")
                continue
            defs = index_defs(src, kind)
            if sym not in defs:
                print(f"NO DEFINITION {kind} {sym}")
                continue
            with tp_path.open("a") as fh:
                fh.write(f"{sid}={sym}\n")
            allf = target / "scripts/_unpack/274" / f"all.{kind}"
            if allf.exists():
                with allf.open("a") as fh:
                    fh.write("\n" + defs[sym])
            imported.append((kind, sid, sym))
            break
    # Explain anything that only exists as cache data, rather than silently importing a bare name.
    for sym in sorted(symbols):
        for kind in CACHE_DATA:
            if sym in cache_packs.get(kind, {}):
                print(f"REFUSED {kind} {sym}: cache data, not text - substitute or drop the property")
                break
    for kind, sid, sym in imported:
        print(f"imported {kind} {sid}={sym}")
    return 0 if imported else 3

if __name__ == "__main__":
    raise SystemExit(main())

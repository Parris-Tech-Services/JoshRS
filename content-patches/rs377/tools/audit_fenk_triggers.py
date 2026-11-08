#!/usr/bin/env python3
"""Read-only duplicate quest triggers audit against the exact disposable content tree.

This must run AFTER adding the candidate Fenkenstrain scripts, and BEFORE
packing. It never changes a source, pack, live save, database or runtime.
"""
import argparse
from collections import defaultdict
from pathlib import Path
import re
import sys

TRIGGER = re.compile(r"^\[(opnpc[1-5u]|oploc[1-5u]|opobj[1-5u]|opheld[1-5u]|if_button),([a-zA-Z0-9_:]+)\]$")
def scan(root):
    buckets=defaultdict(list)
    for p in root.rglob("*.rs2"):
        for ln, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(),1):
            name=line.split("//",1)[0].strip()
            match=TRIGGER.match(name)
            if match:
                buckets[match.groups()].append((p,ln))
    return buckets

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--content",type=Path,required=True)
    arg=ap.parse_args()
    root=(arg.content/"scripts").resolve(strict=True)
    candidate=(root/"quests"/"quest_fenkenstrain"/"scripts").resolve(strict=True)
    if not candidate.is_relative_to(root) or not candidate.is_dir():
        raise SystemExit("Candidate quest not installed in disposable content tree")
    buckets=scan(root)
    failures=[]
    for key,locations in buckets.items():
        proposed=[x for x in locations if x[0].is_relative_to(candidate)]
        if proposed and len(locations)>1:
            failures.append((key,locations))
    if failures:
        for key,locations in failures:
            print("TRIGGER_COLLISION",key,"at","; ".join(
                f"{path.relative_to(root)}:{line}" for path,line in locations))
        return 1
    print("FENK_TRIGGER_AUDIT_PASS",sum(
        len([r for r in v if r[0].is_relative_to(candidate)]) for v in buckets.values()),
        "unique candidate op/if_button triggers; no upstream collisions")
    return 0
if __name__=="__main__":
    sys.exit(main())

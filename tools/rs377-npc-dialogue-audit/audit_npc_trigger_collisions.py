#!/usr/bin/env python3
"""Audit RuneScript (.rs2) files for duplicate [opnpc*/apnpc*,<target>] triggers."""
import argparse
import json
import pathlib
import re
import sys

TRIGGER_RE = re.compile(r"^\s*\[(opnpc[1-5u]|apnpc[1-5u]),([^\]]+)\]", re.M)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--content-scripts-dir",
        default=r"C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\usb-20261030-203927\content\scripts",
    )
    args = parser.parse_args()
    root = pathlib.Path(args.content_scripts_dir)
    seen: dict[tuple[str, str], list[str]] = {}
    for rs2 in sorted(root.rglob("*.rs2")):
        text = rs2.read_text(encoding="utf-8", errors="ignore")
        for m in TRIGGER_RE.finditer(text):
            key = (m.group(1).strip(), m.group(2).strip())
            seen.setdefault(key, []).append(str(rs2.relative_to(root)))
    dups = {f"[{k[0]},{k[1]}]": v for k, v in seen.items() if len(v) > 1}
    out = {
        "distinct_trigger_keys": len(seen),
        "duplicate_trigger_count": len(dups),
        "duplicates": dups,
    }
    print(json.dumps(out, indent=2))
    return 1 if dups else 0


if __name__ == "__main__":
    sys.exit(main())

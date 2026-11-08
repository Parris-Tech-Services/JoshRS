#!/usr/bin/env python3
"""Fail-closed loopback hardening of the *pinned* JoshRS 377 engine.

Used ONLY for a fresh isolated Android phone server or disposable CI clone.
Never run against an existing JParris Desktop world. No credentials or saves.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import sys

# File / exact upstream match / replacement / expected occurrences.
RULES = (
    ("src/server/tcp/TcpServer.ts", "'0.0.0.0'", "'127.0.0.1'", 1),
    ("src/web.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 2),
    ("src/server/login/LoginServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
    ("src/server/friend/FriendServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
    ("src/server/logger/LoggerServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
)

def apply(root: Path, verify: bool = False) -> None:
    root = root.resolve(strict=True)
    replacements = []
    for relative, old, new, expected in RULES:
        path = root / relative
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Missing/unsafe 377 server file: {relative}")
        body = path.read_text(encoding="utf-8")
        if verify:
            if body.count(new) != expected or body.count(old):
                raise ValueError(f"Unsafe or incompatible 377 listener: {relative}")
        else:
            if body.count(old) != expected or body.count(new):
                raise ValueError(f"Unexpected upstream binding (source drift): {relative}")
            replacements.append((path, body.replace(old, new)))
    # All five upstream source signatures checked before mutating any file.
    if not verify:
        for path, updated in replacements:
            path.write_text(updated, encoding="utf-8")
        apply(root, verify=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("engine", type=Path)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    try:
        apply(args.engine, verify=args.verify)
    except (OSError, ValueError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        sys.exit(2)
    print("LOOPBACK_377_VERIFIED: game, web, management, login, friends, logger")

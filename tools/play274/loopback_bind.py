#!/usr/bin/env python3
"""Fail-closed loopback hardening for the private revision-274 browser world.

The 274 engine always keeps the game TCP port, login/friend/logger sockets and the
management page on loopback. The *game web* port is the only listener allowed to bind
a private LAN address, and only through JOSHRS_BIND_HOST with a loopback default.

Idempotent: an engine that already carries the hardened bindings verifies clean and is
left untouched. Anything that matches neither the upstream form nor the hardened form is
refused as source drift rather than guessed at.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# file, upstream fragment, hardened fragment, expected hardened occurrences
RULES = (
    ("src/server/tcp/TcpServer.ts", "'0.0.0.0'", "'127.0.0.1'", 1),
    ("src/server/login/LoginServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
    ("src/server/friend/FriendServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
    ("src/server/logger/LoggerServer.ts", "host: '0.0.0.0'", "host: '127.0.0.1'", 1),
)

WEB = "src/web.ts"


def check_web(path: Path) -> None:
    body = path.read_text(encoding="utf-8")
    if "'0.0.0.0'" in body:
        raise ValueError(f"Unsafe 274 web listener: {WEB}")
    if body.count("JOSHRS_BIND_HOST") != 1 or body.count("process.env.JOSHRS_BIND_HOST ?? '127.0.0.1'") != 1:
        raise ValueError(f"Unexpected 274 web bind (source drift): {WEB}")
    if body.count("host: '127.0.0.1'") != 1:
        raise ValueError(f"Management listener is not loopback: {WEB}")


def apply(root: Path, verify: bool = False) -> None:
    root = root.resolve(strict=True)
    replacements = []
    for relative, old, new, expected in RULES:
        path = root / relative
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Missing/unsafe 274 server file: {relative}")
        body = path.read_text(encoding="utf-8")
        if body.count(new) == expected and body.count(old) == 0:
            continue
        if body.count(old) == expected and body.count(new) == 0:
            replacements.append((path, body.replace(old, new)))
            continue
        raise ValueError(f"Unexpected upstream binding (source drift): {relative}")

    web = root / WEB
    if not web.is_file() or web.is_symlink():
        raise ValueError(f"Missing/unsafe 274 server file: {WEB}")
    check_web(web)

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
        apply(args.engine, args.verify)
    except (OSError, ValueError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        sys.exit(2)
    print("LOOPBACK_274_VERIFIED: game, login, friends, logger, management on loopback; web via JOSHRS_BIND_HOST")

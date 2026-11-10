#!/usr/bin/env python3
"""Guarded, idempotent source-only installer for the JoshRS 274 family portals.

This patches ONLY a designated disposable revision-274 engine and never starts,
stops, builds, resets, or deploys a world. It does not access saves or databases.
Default is dry-run. Explicit --apply --disposable is required to write.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import sys

HERE = Path(__file__).resolve().parent
PORTAL_SOURCE = HERE / "PortalNetwork274.mjs"
HANDLER = Path("src/network/game/client/handler/ClientCheatHandler.ts")
MODULE = Path("src/engine/PortalNetwork274.mjs")
MARKER = "handlePortalCommand274"
IMPORT_ANCHOR = "import ClientGameMessageHandler from '#/network/game/client/ClientGameMessageHandler.js';"
COMMAND_ANCHOR = """        if (cmd === undefined || cmd.length <= 0) {
            return false;
        }
"""
IMPORT_LINE = "import { handlePortalCommand274 } from '#/engine/PortalNetwork274.mjs';\n"
HOOK = """        // JoshRS family-only, allowlisted 274 travel network (opt-in).
        if (handlePortalCommand274(player, cmd, args, {
            enabled: process.env.JOSHRS_PORTALS274_ENABLED === '1',
            users: process.env.JOSHRS_PORTALS274_USERS ?? ''
        })) {
            return true;
        }
"""


def fail(message: str) -> None:
    raise SystemExit("BLOCKED: " + message)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine", type=Path, required=True, help="Disposable 274 engine checkout")
    parser.add_argument("--disposable", action="store_true", help="Affirm this is not a live world")
    parser.add_argument("--apply", action="store_true", help="Write files; default is dry-run")
    args = parser.parse_args()

    root = args.engine.expanduser().resolve()
    live = (Path.home() / "lc274").resolve()
    if root == live or live in root.parents or root in live.parents:
        fail("refusing to modify the ~/lc274 live installation")
    if "dev274" not in str(root).lower() and "disposable" not in str(root).lower() and "test274" not in str(root).lower():
        fail("path must identify a disposable dev274/test274 checkout")
    if args.apply and not args.disposable:
        fail("--apply requires --disposable")
    handler_path = root / HANDLER
    module_path = root / MODULE
    if not handler_path.is_file():
        fail("revision-274 ClientCheatHandler not found at " + str(handler_path))

    existing = handler_path.read_text(encoding="utf-8")
    portal_content = PORTAL_SOURCE.read_text(encoding="utf-8")
    already_hooked = MARKER in existing
    if already_hooked:
        if IMPORT_LINE not in existing or HOOK not in existing:
            fail("partial/different portal hook detected; manual review required")
        if not module_path.is_file() or module_path.read_text(encoding="utf-8") != portal_content:
            fail("hook exists but module is missing or different; manual review required")
        print("VERIFIED: portal integration already installed; no changes")
        return

    if existing.count(IMPORT_ANCHOR) != 1 or existing.count(COMMAND_ANCHOR) != 1:
        fail("upstream handler anchors changed; no guesswork or partial writes")
    if module_path.exists():
        fail("destination module already exists and was not installed by this script")
    updated = existing.replace(IMPORT_ANCHOR, IMPORT_LINE + IMPORT_ANCHOR, 1)
    updated = updated.replace(COMMAND_ANCHOR, COMMAND_ANCHOR + "\n" + HOOK, 1)
    if not args.apply:
        print("DRY RUN: safe 274 handler anchors found; would add allowlisted travel commands.")
        print("Target: " + str(root))
        print("No files were modified. Supply --apply --disposable after verifying checkout.")
        return

    backup = handler_path.with_name(handler_path.name + ".before-joshrs-portals274.bak")
    if backup.exists():
        fail("existing portal backup present; refusing to overwrite")
    # Copy original before any change. The only touched files are source and this backup.
    shutil.copy2(handler_path, backup)
    try:
        module_path.write_text(portal_content, encoding="utf-8")
        handler_path.write_text(updated, encoding="utf-8")
    except BaseException:
        # Keep the original checkout intact on a partial write.
        shutil.copy2(backup, handler_path)
        if module_path.exists():
            module_path.unlink()
        raise
    print("SOURCE INSTALLED in disposable checkout only. Original handler: " + str(backup))
    print("NOT VERIFIED PLAYABLE: test isolated build/client, destination landings and relog.")
    print("Requires JOSHRS_PORTALS274_ENABLED=1 and explicit JOSHRS_PORTALS274_USERS allowlist.")


if __name__ == "__main__":
    main()

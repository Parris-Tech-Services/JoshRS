#!/usr/bin/env python3
"""Guarded injection of bot-scoped native observation trace.

Only a pinned GitHub Actions engine or an explicitly approved, private Fedora
disposable engine is eligible. Never touch the JParrisDesktop/USB family engine,
real accounts, saves, or production ports.
"""
from __future__ import annotations

import argparse
import os
import re
import stat
import subprocess
from pathlib import Path

PIN = "b5ac859b47915afb545e60e4c1208f25d43cb3fb"
IMPORT = "import { observeSdkTick } from '#/engine/observer/Native377Trace.js';\n"
PLAYER_IMPORT = "import { captureSdkOutgoing } from '#/engine/observer/Native377Trace.js';\n"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"{label}: exact upstream source anchor not found; refusing patch")
    return text.replace(old, new)


def is_fedora() -> bool:
    """Check the OS, not a user-supplied environment variable."""
    try:
        for line in Path("/etc/os-release").read_text().splitlines():
            key, sep, value = line.partition("=")
            if sep and key == "ID":
                return value.strip().strip('"') == "fedora"
    except OSError:
        pass
    return False


def verify_scope(engine: Path, fedora_disposable: bool) -> str:
    if not fedora_disposable:
        root_var = os.environ.get("RUNNER_TEMP", "")
        root = Path(root_var).resolve() if root_var else None
        if (os.environ.get("GITHUB_ACTIONS") != "true" or root is None
                or not root.is_dir()
                or engine != root / "joshrs-377-build" / "engine"):
            raise RuntimeError("only immutable disposable GitHub runner engine is permitted")
        return "CI"

    # Local testing is opt-in and confined to a new mktemp -d private sandbox.
    # This cannot be enabled through a GITHUB_ACTIONS environment spoof.
    if (os.environ.get("GITHUB_ACTIONS") == "true"
            or os.environ.get("JOSHRS_QUEST_CAMPAIGN_APPROVED") != "DISPOSABLE_ONLY"
            or os.geteuid() == 0 or not is_fedora()):
        raise RuntimeError("Fedora disposable tracing requires explicit local approval")
    base = Path.home() / ".cache" / "joshrs-disposable-quests"
    work = engine.parent
    if (base.is_symlink() or not base.is_dir() or
            work.parent != base.resolve() or
            not re.fullmatch(r"377-run-[A-Za-z0-9]{8}", work.name) or
            engine != work / "engine" or
            work.is_symlink() or engine.is_symlink() or
            (engine / ".git").is_symlink() or
            not (engine / ".git").is_dir()):
        raise RuntimeError("refusing non-disposable Fedora engine path")
    for directory in (base, work, engine):
        info = directory.stat()
        if (not stat.S_ISDIR(info.st_mode) or info.st_uid != os.geteuid()
                or (directory != engine and info.st_mode & 0o077)):
            raise RuntimeError("refusing unowned or shared Fedora disposable directory")
    return "FEDORA_DISPOSABLE"


def run(engine: Path, *, fedora_disposable: bool = False) -> None:
    scope = verify_scope(engine, fedora_disposable)
    head = subprocess.check_output(
        ["git", "-C", str(engine), "rev-parse", "HEAD"], text=True
    ).strip()
    if head != PIN:
        raise RuntimeError("pinned Engine-TS commit changed; refusing instrumentation")
    source = Path(__file__).resolve().parents[1] / (
        "tools/rs377-bot-bench/engine-patch/src/engine/observer/Native377Trace.ts"
    )
    target = engine / "src/engine/observer/Native377Trace.ts"
    player = engine / "src/engine/entity/Player.ts"
    world = engine / "src/engine/World.ts"
    if target.exists():
        raise RuntimeError("pre-existing trace module; refusing overwrite")
    before_player = player.read_text()
    before_world = world.read_text()
    after_player = replace_once(
        before_player,
        "        this.writeInner(message);",
        "        captureSdkOutgoing(this, message, World.currentTick);\n"
        "        this.writeInner(message);",
        "Player.write",
    )
    after_player = PLAYER_IMPORT + after_player
    after_world = replace_once(
        before_world,
        "                player.playtime++;",
        "                player.playtime++;\n"
        "                observeSdkTick(player, this.currentTick);",
        "World.processClientsIn",
    )
    after_world = IMPORT + after_world
    if not source.is_file() or "export function readSdkTrace" not in source.read_text():
        raise RuntimeError("tracked native observation module missing")
    # All checks passed; writes restricted to the selected disposable engine.
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())
    player.write_text(after_player)
    world.write_text(after_world)
    print(f"{scope}_TRACE_INSTALLED: pinned engine, bot-scoped passive output/tick observations")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", type=Path, required=True)
    parser.add_argument("--fedora-disposable", action="store_true",
                        help="allow only approved, private Fedora mktemp world")
    args = parser.parse_args()
    run(args.engine.resolve(), fedora_disposable=args.fedora_disposable)

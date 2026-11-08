#!/usr/bin/env python3
"""Guarded CI-only injection of bot-scoped native observation trace.

Never apply to the JParrisDesktop/USB family engine. Fails closed outside a
disposable GITHUB_ACTIONS runner with an exact pinned LostCity Engine-TS HEAD.
No credentials, accounts, private saves or production ports are accessed.
"""
from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path

PIN = "b5ac859b47915afb545e60e4c1208f25d43cb3fb"
IMPORT = "import { observeSdkTick } from '#/engine/observer/Native377Trace.js';\n"
PLAYER_IMPORT = "import { captureSdkOutgoing } from '#/engine/observer/Native377Trace.js';\n"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"{label}: exact upstream source anchor not found; refusing patch")
    return text.replace(old, new)


def run(engine: Path) -> None:
    root = Path(os.environ.get("RUNNER_TEMP", "")).resolve()
    if (os.environ.get("GITHUB_ACTIONS") != "true" or
            not root.is_dir() or engine != root / "joshrs-377-build" / "engine"):
        raise RuntimeError("only immutable disposable GitHub runner engine is permitted")
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
    # All checks passed; only writes in the CI temp engine. Atomic per file.
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())
    player.write_text(after_player)
    world.write_text(after_world)
    print("CI_ONLY_TRACE_INSTALLED: pinned engine, bot-scoped passive output/tick observations")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", type=Path, required=True)
    args = parser.parse_args()
    run(args.engine.resolve())

#!/usr/bin/env python3
"""Guarded injection of passive bot trace into EXACT pinned disposable game.

Accept CI temp build or explicitly marked new Fedora throwaway checkout only.
NEVER apply to a family engine, old private save, or ordinary game install.
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


def is_allowed_disposable_engine(engine: Path, fedora_root: Path | None = None) -> bool:
    """Evaluate exact allowed checkout, no database or account permissions."""
    ci_temp = os.environ.get("RUNNER_TEMP")
    if fedora_root is None:
        return bool(
            os.environ.get("GITHUB_ACTIONS") == "true" and ci_temp and
            engine == Path(ci_temp).resolve() / "joshrs-377-build" / "engine"
        )
    # This second mode is intentionally Linux/Fedora-only. No patching a live
    # ~/.cache or ~/dev engine by simply passing a matching --engine argument.
    import sys
    if not sys.platform.startswith("linux") or os.geteuid() == 0:
        return False
    os_release = Path("/etc/os-release")
    if not os_release.is_file() or not any(
        line.strip() == "ID=fedora" for line in os_release.read_text().splitlines()
    ):
        return False
    home = Path.home().resolve()
    canonical_parent = home / ".cache" / "joshrs-disposable-quests"
    if (fedora_root.is_symlink() or engine.is_symlink() or
            fedora_root != canonical_parent / fedora_root.name or
            not fedora_root.name.startswith("377-run-") or
            engine != fedora_root / "engine" or not fedora_root.is_dir()):
        return False
    if not (fedora_root / ".joshrs-disposable-only").is_file():
        return False
    stats = fedora_root.stat()
    if stats.st_uid != os.geteuid() or stats.st_mode & 0o077:
        return False
    return True


def run(engine: Path, fedora_root: Path | None = None) -> None:
    if not is_allowed_disposable_engine(engine, fedora_root):
        raise RuntimeError(
            "only exact pinned CI or explicitly marked throwaway Fedora engine is permitted"
        )
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
    # All checks passed; only writes in the explicitly scoped temp engine.
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())
    player.write_text(after_player)
    world.write_text(after_world)
    print("CI_ONLY_TRACE_INSTALLED: pinned engine, bot-scoped passive output/tick observations")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", type=Path, required=True)
    parser.add_argument("--fedora-disposable-root", type=Path)
    args = parser.parse_args()
    run(args.engine.resolve(),
        args.fedora_disposable_root.resolve() if args.fedora_disposable_root else None)

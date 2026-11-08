#!/usr/bin/env python3
"""Patch ONLY the immutable pinned CI engine copy to precondition a quest bot.

Test preconditioning is NOT game progress and NOT a cold Tutorial Island run.
Default players still spawn on Tutorial Island; family installs are never
written. No quest varps, inventory, skills, achievements or saves are set.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import subprocess

PIN = "b5ac859b47915afb545e60e4c1208f25d43cb3fb"
OLD = """    constructor(username: string, username37: bigint, hash64: bigint) {
        super(
            0,
            3094,
            3106, // tutorial island
"""
NEW = """    constructor(username: string, username37: bigint, hash64: bigint) {
        // ONLY this CI runner's own disposable HarnessProbe is preconditioned
        // near the original Cook's Assistant NPC for *quest* gameplay testing.
        // No quest items/vars are injected. Every other spawn is unchanged.
        const isolatedCookFixture = process.env.RS377_CI_QUEST_START === 'true' &&
            process.env.RS377_OBSERVER_ENABLED === 'true' &&
            process.env.RS377_OBSERVER_ISOLATED === 'true' &&
            process.env.RS377_OBSERVER_BOT === 'HarnessProbe' &&
            process.env.NODE_PROFILE === 'joshrs_ci_377' &&
            process.env.NODE_PORT === '15402' &&
            username.toLowerCase() === 'harnessprobe';
        super(
            0,
            isolatedCookFixture ? 3210 : 3094,
            isolatedCookFixture ? 3216 : 3106, // original tutorial remains default
"""

def patch(root: Path) -> None:
    if os.environ.get("GITHUB_ACTIONS") != "true":
        raise SystemExit("BLOCKED: CI-only preconditioner; never patch family runtime")
    tmp = Path(os.environ.get("RUNNER_TEMP", "/nonexistent")).resolve()
    root = root.resolve(strict=True)
    if root != tmp / "joshrs-377-build" / "engine" or not (root / ".git").is_dir():
        raise SystemExit("BLOCKED: expected only ephemeral pinned CI engine copy")
    sha = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"],
                                  text=True).strip()
    if sha != PIN:
        raise SystemExit("BLOCKED: pinned 377 engine SHA mismatch")
    target = root / "src/engine/entity/Player.ts"
    text = target.read_text(encoding="utf-8")
    if text.count(OLD) != 1 or NEW in text:
        raise SystemExit("BLOCKED: pinned original Player constructor changed")
    target.write_text(text.replace(OLD, NEW), encoding="utf-8")
    print("CI_ONLY_377_COOK_QUEST_PRECONDITIONER_INSTALLED")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", required=True, type=Path)
    args = ap.parse_args()
    patch(args.engine)

#!/usr/bin/env python3
"""Run as an unprivileged Fedora user inside a disposable CI container only."""
import importlib.util
from pathlib import Path

source = Path("/repo/content-factory/patch_377_sdk_trace.py")
spec = importlib.util.spec_from_file_location("joshrs_trace", source)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
root = Path.home() / ".cache/joshrs-disposable-quests/377-run-FakeSafe"
engine = root / "engine"
assert root.is_dir() and engine.is_dir()
assert module.is_allowed_disposable_engine(engine, root)
assert not module.is_allowed_disposable_engine(root / "other", root)
assert not module.is_allowed_disposable_engine(Path.home() / "lostcity377/engine", root)
assert not module.is_allowed_disposable_engine(engine, Path.home() / "live_game")
print("Fedora isolated-only trace gate passed; no actual game files changed")

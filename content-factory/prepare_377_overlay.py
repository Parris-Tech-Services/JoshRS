#!/usr/bin/env python3
"""Validate and copy text-only JoshRS additions into a separate 377 content checkout.

Never touches accounts, player saves, databases, engine code, or client binaries.
Refuses unrecognised paths, symlink traversal and destructive replacements.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys

ALLOWED_PREFIX = ("scripts", "areas", "joshrs_custom")
ALLOWED_EXT = {".rs2", ".npc"}


def verified_files(source: Path) -> list[tuple[str, bytes]]:
    root = source.resolve(strict=True)
    metadata = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if metadata.get("schema") != 1 or not isinstance(metadata.get("files"), list):
        raise ValueError("Unsupported 377 overlay manifest")
    if metadata.get("includes_player_save_changes") is not False:
        raise ValueError("Manifest must explicitly exclude player saves")
    entries = []
    seen = set()
    for record in metadata["files"]:
        name, sha = record["path"], record["sha256"]
        path = PurePosixPath(name)
        if (path.is_absolute() or ".." in path.parts or
            path.parts[:3] != ALLOWED_PREFIX or
            path.suffix not in ALLOWED_EXT or
            not path.name.startswith("joshrs_") or
            name in seen or len(path.parts) != 5):
            raise ValueError(f"Disallowed overlay path: {name}")
        seen.add(name)
        original = root.joinpath(*path.parts)
        if original.is_symlink() or not original.resolve(strict=True).is_relative_to(root):
            raise ValueError("Overlay source cannot contain symlinks or escape root")
        data = original.read_bytes()
        if len(data) > 50_000 or hashlib.sha256(data).hexdigest() != sha:
            raise ValueError(f"Overlay integrity check failed: {name}")
        data.decode("utf-8")
        entries.append((name, data))
    if len(entries) == 0 or len(entries) > 20:
        raise ValueError("Unexpected overlay size")
    return entries


def apply_overlay(source: Path, destination: Path) -> int:
    files = verified_files(source)
    target_root = destination.resolve()
    if not target_root.exists() or not target_root.is_dir():
        raise ValueError("Target content directory must exist")
    if not (target_root / "scripts").is_dir():
        raise ValueError("Target must be a Lost City content checkout (scripts/ missing)")
    # Preflight every file before mutating any files.
    for name, data in files:
        out = target_root.joinpath(*PurePosixPath(name).parts)
        if not out.parent.resolve().is_relative_to(target_root):
            raise ValueError("Target path contains a symlink or escapes content checkout")
        if out.is_symlink():
            raise ValueError("Refusing symlink target")
        if out.exists() and out.read_bytes() != data:
            raise ValueError(f"Refusing to overwrite existing custom content: {out}")
    for name, data in files:
        out = target_root.joinpath(*PurePosixPath(name).parts)
        out.parent.mkdir(parents=True, exist_ok=True)
        if not out.exists():
            out.write_bytes(data)
        if out.read_bytes() != data:
            raise ValueError(f"Write failed: {out}")
    return len(files)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--dest", type=Path, required=True)
    args = parser.parse_args()
    try:
        print(f"Installed {apply_overlay(args.source, args.dest)} original script/config files into isolated content checkout.")
    except (ValueError, OSError, KeyError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"377 overlay refused: {exc}", file=sys.stderr)
        raise SystemExit(1)

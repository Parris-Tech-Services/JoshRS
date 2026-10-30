#!/usr/bin/env python3
"""Validate and copy text-only JoshRS additions into a separate 377 content checkout.

Never touches accounts, player saves, databases, engine code, or client binaries.
Refuses unrecognised paths, symlink traversal and destructive replacements.
"""
import argparse
import hashlib
import json
import re
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


def registry_additions(source: Path, destination: Path) -> tuple[Path, list[str]]:
    manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    names = manifest.get("npc_names")
    if (not isinstance(names, list) or not names or len(names) > 20 or
        len(names) != len(set(names)) or
        any(not re.fullmatch(r"joshrs_[a-z0-9_]{1,60}", n) for n in names)):
        raise ValueError("Invalid NPC names in manifest")
    pack = destination / "pack/npc.pack"
    if pack.is_symlink() or not pack.is_file():
        raise ValueError("Missing or linked upstream NPC pack index")
    rows = pack.read_text(encoding="utf-8").splitlines()
    present, used, maximum = set(), set(), -1
    for row in rows:
        if not row.strip() or row.lstrip().startswith("//"):
            continue
        match = re.fullmatch(r"([0-9]+)=([A-Za-z0-9_]+)", row.strip())
        if not match:
            raise ValueError("Invalid NPC pack registry row")
        num, name = int(match.group(1)), match.group(2)
        if num in used or name in present:
            raise ValueError("Duplicate NPC registry value")
        used.add(num)
        present.add(name)
        maximum = max(maximum, num)
    additions = []
    for name in sorted(names):
        if name not in present:
            maximum += 1
            if maximum >= 65535:
                raise ValueError("No spare NPC identifier capacity")
            additions.append(f"{maximum}={name}")
    return pack, additions


def apply_overlay(source: Path, destination: Path) -> int:
    files = verified_files(source)
    target_root = destination.resolve()
    if not target_root.exists() or not target_root.is_dir():
        raise ValueError("Target content directory must exist")
    if not (target_root / "scripts").is_dir():
        raise ValueError("Target must be a Lost City content checkout (scripts/ missing)")
    pack, additions = registry_additions(source, target_root)
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
    if additions:
        old = pack.read_bytes()
        backup = pack.with_name("npc.pack.joshrs-original.bak")
        if backup.exists() and backup.read_bytes() != old:
            raise ValueError("NPC pack was modified after the JoshRS backup; manual review required")
        if not backup.exists():
            backup.write_bytes(old)
        with pack.open("a", encoding="utf-8") as handle:
            if old and not old.endswith(b"\n"):
                handle.write("\n")
            handle.write("\n".join(additions) + "\n")
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

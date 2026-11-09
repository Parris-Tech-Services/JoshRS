#!/usr/bin/env python3
"""Guard invalid #377 NPC/player facing indices in the existing Fedora Java client.

This is an opt-in, source-only patch. It does NOT start/stop game processes,
read/change player saves, modify server packets, or restart the world.
"""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

DEFAULT_SOURCE = (
    Path.home() / "dev/JoshRS/lostcity377/client-java/src/main/java/jagex2/client/Client.java"
)
METHOD = "public void updateFacingDirection(ClientEntity arg1)"
NPC_OLD = "ClientNpc var3 = this.npcs[arg1.field1156];"
NPC_NEW = (
    "ClientNpc var3 = arg1.field1156 >= 0 && arg1.field1156 < this.npcs.length"
    " ? this.npcs[arg1.field1156] : null;"
)
PLAYER_OLD = "ClientPlayer var7 = this.players[var6];"
PLAYER_NEW = (
    "ClientPlayer var7 = var6 >= 0 && var6 < this.players.length"
    " ? this.players[var6] : null;"
)


class UnexpectedSource(ValueError):
    """Refuse to guess how to modify a customised source tree."""


def patch_source(original: str) -> tuple[str, str]:
    """Return (patched text, PATCH_AVAILABLE|ALREADY_GUARDED), or fail closed."""
    if original.count(METHOD) != 1:
        raise UnexpectedSource("Could not uniquely identify updateFacingDirection method.")
    start = original.index(METHOD)
    end = original.find("@ObfuscatedName(", start + len(METHOD))
    if end < 0:
        raise UnexpectedSource("Could not locate method boundary; inspect local Client.java.")
    method = original[start:end]
    old_npc, old_player = method.count(NPC_OLD), method.count(PLAYER_OLD)
    new_npc, new_player = method.count(NPC_NEW), method.count(PLAYER_NEW)
    if new_npc == 1 and new_player == 1 and old_npc == 0 and old_player == 0:
        return original, "ALREADY_GUARDED"
    if (old_npc, old_player, new_npc, new_player) != (1, 1, 0, 0):
        raise UnexpectedSource(
            "Local facing logic differs or is partially patched; no file changed. "
            "Inspect the two NPC/player lookups in updateFacingDirection."
        )
    patched = original[:start] + method.replace(NPC_OLD, NPC_NEW, 1).replace(
        PLAYER_OLD, PLAYER_NEW, 1
    ) + original[end:]
    assert patched != original
    return patched, "PATCH_AVAILABLE"


def client_unit_running() -> bool:
    if not shutil.which("systemctl"):
        return False
    try:
        completed = subprocess.run(
            ["systemctl", "--user", "is-active", "--quiet", "joshrs-client.service"],
            capture_output=True, timeout=5, check=False
        )
        return completed.returncode == 0
    except (subprocess.SubprocessError, OSError):
        return False


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def apply_patch(source: Path) -> tuple[Path, str]:
    if client_unit_running():
        raise RuntimeError(
            "joshrs-client.service is active. Log out and close ONLY the Java client "
            "before --apply; keep the existing game server running."
        )
    old = source.read_bytes()
    replacement, status = patch_source(old.decode("utf-8"))
    if status == "ALREADY_GUARDED":
        return source, "ALREADY_GUARDED"
    if source.read_bytes() != old:
        raise RuntimeError("Client.java changed during inspection; refusing overwrite.")

    backups = source.parent / ".joshrs-facing-backups"
    backups.mkdir(mode=0o700, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = backups / f"Client.java.{stamp}.{os.getpid()}.bak"
    shutil.copy2(source, backup)
    if sha256(backup.read_bytes()) != sha256(old):
        raise RuntimeError("Backup verification failed; source unchanged.")

    fd, temp_path = tempfile.mkstemp(prefix=".Client.java.", dir=source.parent)
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(replacement.encode("utf-8"))
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temp_path, source.stat().st_mode & 0o777)
        os.replace(temp_path, source)
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
    check_text = source.read_text(encoding="utf-8")
    _, state = patch_source(check_text)
    if state != "ALREADY_GUARDED":
        raise RuntimeError(f"Post-patch verification failed. Backup: {backup}")
    return backup, "PATCH_APPLIED"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--apply", action="store_true", help="Backup and patch source; requires the client to be stopped.")
    args = parser.parse_args(argv)
    source = args.source.expanduser()
    if not source.is_file():
        print(f"BLOCKED: Client.java not found: {source}", file=sys.stderr)
        return 2
    try:
        if args.apply:
            backup, status = apply_patch(source)
            print(f"{status}: {source}")
            if status == "PATCH_APPLIED":
                print(f"BACKUP_VERIFIED: {backup}")
                print("NEXT: cd ~/dev/JoshRS/lostcity377/client-java && ./gradlew classes --no-daemon")
                print("THEN: use existing start-client.sh (client only), test real gameplay, check persistent log.")
        else:
            _, status = patch_source(source.read_text(encoding="utf-8"))
            print(f"{status}: {source}")
            print("READ_ONLY: no files, processes, saves or services changed.")
        return 0
    except (OSError, UnicodeError, UnexpectedSource, RuntimeError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

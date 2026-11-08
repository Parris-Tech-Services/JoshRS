#!/usr/bin/env python3
"""One-time, backed-up, bot-only Lumbridge test fixture. Does not test quests.

Matches pinned LostCityRS rev377 Player.save/PlayerLoading.load v7, plus
Content varp.pack: 281=tutorial; quest.constant: tutorial_complete=1000.
Never modify Elrothiro, Sylvie, the world process, or the server database.
"""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
import stat
import struct
import tempfile
import time
import zlib

MAGIC = 0x2004
VERSION = 7
TUTORIAL_ID = 281
TUTORIAL_COMPLETE = 1000
SPAWN = (3233, 3218, 0)
VARP_COUNT_OFFSET = 133
VARP_START = VARP_COUNT_OFFSET + 2


def decode_varint(data: bytes, start: int, end: int) -> tuple[int, int]:
    value = 0
    for i in range(start, min(start + 5, end)):
        b = data[i]
        value = (value << 7) | (b & 127)
        if value > 0xFFFFFFFF:
            raise ValueError("varint out of range")
        if not b & 128:
            return value, i + 1
    raise ValueError("truncated or oversized revision-377 varint")


def encode_varint(n: int) -> bytes:
    if not 0 <= n <= 0xFFFFFFFF:
        raise ValueError("out-of-range varint")
    chunks = [n & 127]
    n >>= 7
    while n:
        chunks.append((n & 127) | 128)
        n >>= 7
    return bytes(reversed(chunks))


def inspect_save(raw: bytes) -> dict:
    if len(raw) < 150 or len(raw) > 5_000_000:
        raise ValueError("unexpected character-save size")
    magic, version, x, z, level = struct.unpack_from(">HHHHB", raw)
    if magic != MAGIC or version != VERSION:
        raise ValueError("unsupported save magic or version (verified v7 only)")
    expected = struct.unpack_from(">I", raw, len(raw) - 4)[0]
    if zlib.crc32(raw[:-4]) != expected:
        raise ValueError("existing save CRC32 invalid; refusing changes")
    if level > 3 or not (0 <= x <= 16383 and 0 <= z <= 16383):
        raise ValueError("invalid player coordinates")
    count = struct.unpack_from(">H", raw, VARP_COUNT_OFFSET)[0]
    if count > 512:
        raise ValueError("unexpected permanent varp count")
    offset = VARP_START
    found = None
    previous = -1
    for _ in range(count):
        if offset + 2 > len(raw) - 4:
            raise ValueError("truncated varp")
        varp = struct.unpack_from(">H", raw, offset)[0]
        if varp <= previous:
            raise ValueError("varp IDs not strictly increasing")
        previous = varp
        offset += 2
        value_start = offset
        value, offset = decode_varint(raw, offset, len(raw) - 4)
        if varp == TUTORIAL_ID:
            found = (value, value_start, offset)
    if offset + 1 > len(raw) - 4:
        raise ValueError("save inventory tail missing")
    return {
        "x": x, "z": z, "level": level,
        "tutorial": found[0] if found else 0,
        "varp_count": count,
        "tutorial_span": found,
        "sha256": hashlib.sha256(raw).hexdigest(),
    }


def patched_save(raw: bytes) -> bytes:
    before = inspect_save(raw)
    if (before["x"], before["z"], before["level"], before["tutorial"]) == (*SPAWN, TUTORIAL_COMPLETE):
        return raw
    if (before["x"], before["z"], before["level"]) != (3094, 3106, 0):
        raise ValueError("bot is not at original Tutorial Island spawn; refuse unknown progress")
    if before["tutorial"] != 0:
        raise ValueError("bot has already started tutorial; refuse to override progress")
    data = bytearray(raw[:-4])
    struct.pack_into(">HHB", data, 4, *SPAWN)
    span = before["tutorial_span"]
    if span:
        _, i, j = span
        data[i:j] = encode_varint(TUTORIAL_COMPLETE)
    else:
        struct.pack_into(">H", data, VARP_COUNT_OFFSET, before["varp_count"] + 1)
        # Insertion preserves Player.save()'s ascending varp ID format.
        insert_at = VARP_START
        for _ in range(before["varp_count"]):
            varp = struct.unpack_from(">H", data, insert_at)[0]
            if varp > TUTORIAL_ID:
                break
            _, insert_at = decode_varint(data, insert_at + 2, len(data))
        data[insert_at:insert_at] = struct.pack(">H", TUTORIAL_ID) + encode_varint(TUTORIAL_COMPLETE)
    data += struct.pack(">I", zlib.crc32(data))
    after = inspect_save(bytes(data))
    if (after["x"], after["z"], after["level"], after["tutorial"]) != (*SPAWN, TUTORIAL_COMPLETE):
        raise ValueError("patched bot save failed independent parse/CRC verification")
    return bytes(data)


def bot_session_running() -> bool:
    """Best-effort /proc guard. An explicit user offline confirmation is also required."""
    proc = Path("/proc")
    if not proc.exists():
        return True
    for process in proc.iterdir():
        if not process.name.isdecimal() or int(process.name) == os.getpid():
            continue
        try:
            command = (process / "cmdline").read_bytes().replace(b"\x00", b" ").decode("utf8", "replace")
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
        if ("node " in command and "tools/rs377-family-visible/join.mjs" in command
                and "HarnessView1" in command):
            return True
    return False


def command(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Backed-up, one-time HarnessView1 Lumbridge test spawn")
    p.add_argument("--apply", action="store_true", help="explicitly authorise bot-only save edit")
    p.add_argument("--bot-offline", action="store_true", help="confirm bot is logged out")
    ns = p.parse_args(argv)
    if os.geteuid() == 0:
        raise SystemExit("BLOCKED: never run as root")
    target = Path.home() / "dev/JoshRS/lostcity377/engine/data/players/main/harnessview1.sav"
    if target.parent.is_symlink() or target.is_symlink() or not target.is_file():
        raise SystemExit("BLOCKED: bot-only normal save not found or unsafe symlink")
    if target.resolve() != target:
        raise SystemExit("BLOCKED: bot save path redirected")
    metadata = target.stat()
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.geteuid():
        raise SystemExit("BLOCKED: bot save must be regular and owned by current user")
    if bot_session_running():
        raise SystemExit("BLOCKED: bot session still running; stop it first")
    raw = target.read_bytes()
    try:
        before = inspect_save(raw)
        updated = patched_save(raw)
    except ValueError as err:
        raise SystemExit("BLOCKED: " + str(err))
    print("HarnessView1 bot save:", target)
    print(f"Current: ({before['x']},{before['z']},level {before['level']}), tutorial={before['tutorial']}, CRC valid")
    if updated == raw:
        print("ALREADY_PREPARED: bot at (3233,3218); no changes")
        return 0
    if not ns.apply:
        print("READ_ONLY: would set bot position (3233,3218) and tutorial=1000")
        print("After bot logs out: add --apply --bot-offline (only on this test account)")
        return 0
    if not ns.bot_offline:
        raise SystemExit("BLOCKED: explicit --bot-offline acknowledgment required")
    if time.time() - metadata.st_mtime < 15:
        raise SystemExit("BLOCKED: bot save too recent; ensure the bot finished logging out")
    backup_dir = Path.home() / "JoshRS-save-backups" / (
        "bot-harnessview1-" + time.strftime("%Y%m%d-%H%M%S")
    )
    backup_dir.mkdir(mode=0o700, parents=True, exist_ok=False)
    os.chmod(backup_dir, 0o700)
    backup = backup_dir / "harnessview1.sav"
    with backup.open("xb") as f:
        os.chmod(backup, 0o600)
        f.write(raw)
        f.flush()
        os.fsync(f.fileno())
    if target.read_bytes() != raw:
        raise SystemExit("BLOCKED: save changed; backup retained; no patch applied")
    fd, tmp = tempfile.mkstemp(prefix=".harnessview1-test-", suffix=".sav", dir=str(target.parent))
    try:
        with os.fdopen(fd, "wb") as f:
            os.fchmod(f.fileno(), stat.S_IMODE(metadata.st_mode) & 0o600 or 0o600)
            f.write(updated)
            f.flush()
            os.fsync(f.fileno())
        if target.read_bytes() != raw or bot_session_running():
            raise SystemExit("BLOCKED: save changed or bot reconnected; backup retained")
        os.replace(tmp, target)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    final = inspect_save(target.read_bytes())
    print(f"BOT_ONLY_TEST_FIXTURE_APPLIED: ({final['x']},{final['z']},level {final['level']}); tutorial={final['tutorial']}; CRC valid")
    print("Original bot save backed up at", backup)
    print("NOT a genuine tutorial or quest playthrough; actual in-game visibility still must be checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(command())

#!/usr/bin/env python3
"""Check which revision-377 cache jagfiles a server will hand to a client.

Engine-TS@377-wip serves the cache on demand over HTTP, so a native client does not
need a user-supplied `main_file_cache.*` for the files it exposes. Three wire details
were established by experiment and are easy to get wrong:

  1. `GET /crc` returns a 40-byte CrcBuffer: nine big-endian CRC-32 words plus a
     4-byte hash. Only the first 36 bytes go into the login block.
  2. The cache routes take the CRC **appended directly to the name, with no
     separator**: `/versionlist719958372`, not `/versionlist:719958372`.
  3. The CRC must be **decimal**, not hex. The route runs it through a decimal
     parse, so a hex value silently 404s and looks like a missing cache.

Route index mapping (from src/web.ts):

    1 title   2 config   3 interface   4 media
    5 versionlist   6 textures   7 wordenc   8 sounds

Usage:
    probe-ondemand-cache.py [--base http://127.0.0.1:8888]
"""
from __future__ import annotations

import argparse
import struct
import sys
import urllib.error
import urllib.request

ROUTES = {
    1: "title",
    2: "config",
    3: "interface",
    4: "media",
    5: "versionlist",
    6: "textures",
    7: "wordenc",
    8: "sounds",
}


def fetch(url: str, timeout: int = 30) -> tuple[int, bytes]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:  # noqa: BLE001 - report, do not crash the whole probe
        return -1, str(e).encode()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8888")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    status, crc = fetch(f"{base}/crc")
    if status != 200 or len(crc) != 40:
        print(f"BLOCKED: /crc returned {status}, {len(crc)} bytes (expected 200, 40)", file=sys.stderr)
        return 2

    words = struct.unpack(">9I", crc[:36])
    print(f"/crc ok: {len(crc)} bytes")
    print(f"  words: {' '.join(f'{w:08x}' for w in words)}")
    print()

    available = 0
    for idx, name in ROUTES.items():
        value = words[idx]
        st, body = fetch(f"{base}/{name}{value}")
        if st == 200 and body:
            available += 1
            print(f"  {name:<12} 200  {len(body):>9} bytes  (crc word {idx} = {value})")
        else:
            print(f"  {name:<12} {st:>3}  {'absent from this cache' if st == 404 else 'error'}")

    print()
    print(f"{available}/{len(ROUTES)} jagfiles downloadable from {base}")
    if available:
        print("A native client can bootstrap these without a user-supplied cache.")
    return 0 if available else 1


if __name__ == "__main__":
    raise SystemExit(main())

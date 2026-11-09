#!/usr/bin/env python3
"""Credentialed revision-377 login probe for a private, loopback-only test world.

This is a **test harness**, not a game client. It proves the wire format end to end:

  1. opcode 14 handshake            -> 8 zero bytes + login-server byte + 8-byte seed
  2. opcode 16 login block          -> [rev][info][36 CRC bytes][encLen][RSA block]
  3. server ISAAC-decrypts opcodes  -> client builds Isaac(seed + 50) to read packets

Findings encoded here (each cost a failing attempt):

  * the revision 377 does not fit in one byte: send 0xFF then a 16-bit 377,
    otherwise the server answers status 6 ("out of date");
  * the 36 CRC bytes must be the first 36 bytes of the engine's CrcBuffer,
    because the server verifies `crc32(those 36 bytes) == CrcBuffer32`;
  * the login *response* is `[status][2 unencrypted bytes][ISAAC frames]`;
    starting the packet loop at offset 1 desynchronises after 2 frames,
    offset 3 parses the whole stream cleanly;
  * `data/config/public.pem` in the pinned engine has its modulus and exponent
    **swapped**. A client that trusts it produces a block the server rejects.
    We detect the swap by length and correct it.

Usage:
  probe-login-377.py --public-pem ~/js377/engine/data/config/public.pem \\
      --crc-hex 000000009509ece5... --user test --pass test
"""
from __future__ import annotations

import argparse
import binascii
import socket
import struct
import sys
import time
import urllib.request


def der_integers(der: bytes) -> list[bytes]:
    """Return the two INTEGER bodies of an RSAPublicKey, in order."""
    out: list[bytes] = []
    i = 0
    # Walk the outer SEQUENCE, then the inner SEQUENCE of the BIT STRING payload.
    while i < len(der) - 1 and len(out) < 2:
        if der[i] == 0x02:  # INTEGER
            length = der[i + 1]
            body = der[i + 2 : i + 2 + length]
            if body[:1] == b"\x00":
                body = body[1:]
            out.append(body)
            i += 2 + length
        else:
            i += 1
    return out


def load_key(path: str) -> tuple[int, int]:
    text = open(path, encoding="utf-8").read()
    b64 = "".join(line for line in text.splitlines() if "-----" not in line)
    der = binascii.a2b_base64(b64)
    a, b = der_integers(der)
    modulus, exponent = (a, b) if len(a) > len(b) else (b, a)
    swapped = len(a) < len(b)
    if swapped:
        print("NOTE: public.pem has modulus/exponent swapped; corrected by length", file=sys.stderr)
    return int.from_bytes(modulus, "big"), int.from_bytes(exponent, "big")


def isaac(seed: list[int]) -> "IsaacState":
    return IsaacState(seed)


class IsaacState:
    """Minimal ISAAC port used only to decode opcodes for verification."""

    def __init__(self, seed: list[int]) -> None:
        self.count = 0
        self.rsl = [0] * 256
        self.mem = [0] * 256
        self.a = self.b = self.c = 0
        for i, v in enumerate(seed):
            self.rsl[i] = v & 0xFFFFFFFF
        self._init()

    def _mix(self, vals: list[int]) -> list[int]:
        a, b, c, d, e, f, g, h = vals
        a ^= (b << 11) & 0xFFFFFFFF
        d = (d + a) & 0xFFFFFFFF
        b = (b + c) & 0xFFFFFFFF
        b ^= c >> 2
        e = (e + b) & 0xFFFFFFFF
        c = (c + d) & 0xFFFFFFFF
        c ^= (d << 8) & 0xFFFFFFFF
        f = (f + c) & 0xFFFFFFFF
        d = (d + e) & 0xFFFFFFFF
        d ^= e >> 16
        g = (g + d) & 0xFFFFFFFF
        e = (e + f) & 0xFFFFFFFF
        e ^= (f << 10) & 0xFFFFFFFF
        h = (h + e) & 0xFFFFFFFF
        f = (f + g) & 0xFFFFFFFF
        f ^= g >> 4
        a = (a + f) & 0xFFFFFFFF
        g = (g + h) & 0xFFFFFFFF
        g ^= (h << 8) & 0xFFFFFFFF
        b = (b + g) & 0xFFFFFFFF
        h = (h + a) & 0xFFFFFFFF
        h ^= a >> 9
        c = (c + h) & 0xFFFFFFFF
        a = (a + b) & 0xFFFFFFFF
        return [a, b, c, d, e, f, g, h]

    def _init(self) -> None:
        g = 0x9E3779B9
        vals = [g] * 8
        for _ in range(4):
            vals = self._mix(vals)
        for i in range(0, 256, 8):
            vals = [(v + self.rsl[i + n]) & 0xFFFFFFFF for n, v in enumerate(vals)]
            vals = self._mix(vals)
            self.mem[i : i + 8] = vals
        for i in range(0, 256, 8):
            vals = [(v + self.mem[i + n]) & 0xFFFFFFFF for n, v in enumerate(vals)]
            vals = self._mix(vals)
            self.mem[i : i + 8] = vals
        self._isaac()
        self.count = 256

    def _isaac(self) -> None:
        self.c = (self.c + 1) & 0xFFFFFFFF
        self.b = (self.b + self.c) & 0xFFFFFFFF
        for i in range(256):
            x = self.mem[i]
            mode = i & 3
            if mode == 0:
                self.a ^= (self.a << 13) & 0xFFFFFFFF
            elif mode == 1:
                self.a ^= self.a >> 6
            elif mode == 2:
                self.a ^= (self.a << 2) & 0xFFFFFFFF
            else:
                self.a ^= self.a >> 16
            self.a = (self.a + self.mem[(i + 128) & 0xFF]) & 0xFFFFFFFF
            y = (self.mem[(x >> 2) & 0xFF] + self.a + self.b) & 0xFFFFFFFF
            self.mem[i] = y
            self.b = (self.mem[(y >> 10) & 0xFF] + x) & 0xFFFFFFFF
            self.rsl[i] = self.b
        self.count = 256

    def next_int(self) -> int:
        if self.count == 0:
            self._isaac()
            self.count = 255
        else:
            self.count -= 1
        return self.rsl[self.count]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=43594)
    ap.add_argument("--public-pem", required=True)
    ap.add_argument("--crc-hex", help="40-byte CrcBuffer hex; only first 36 are sent")
    ap.add_argument("--crc-url", default="http://127.0.0.1:8888/crc")
    ap.add_argument("--user", default="probeuser")
    ap.add_argument("--pass", dest="password", default="probepass")
    ap.add_argument("--uid", type=int, default=12345)
    args = ap.parse_args()

    modulus, exponent = load_key(args.public_pem)

    if args.crc_hex:
        crcs = bytes.fromhex(args.crc_hex)[:36]
    else:
        crcs = urllib.request.urlopen(args.crc_url, timeout=5).read()[:36]
    assert len(crcs) == 36, f"need 36 CRC bytes, got {len(crcs)}"

    seeds = [0x11223344, 0x55667788, 0x31415926, 0x27182818]
    plain = (
        bytes([10])
        + struct.pack(">iiii", *seeds)
        + struct.pack(">i", args.uid)
        + args.user.encode()
        + b"\x0a"
        + args.password.encode()
        + b"\x0a"
    )
    m = int.from_bytes(plain, "big")
    if m >= modulus:
        raise SystemExit("login block does not fit the RSA modulus")
    enc = pow(m, exponent, modulus).to_bytes((modulus.bit_length() + 7) // 8, "big")

    with socket.create_connection((args.host, args.port), timeout=8) as s:
        s.sendall(bytes([0x0E, 0x00]))
        hs = b""
        while len(hs) < 17:
            chunk = s.recv(32)
            if not chunk:
                break
            hs += chunk
        print("handshake bytes:", len(hs), binascii.hexlify(hs).decode())
        if len(hs) != 17:
            print("BLOCKED: handshake incomplete", file=sys.stderr)
            return 2

        # 0xFF escape because 377 does not fit in a single byte.
        block = b"\xff" + struct.pack(">H", 377) + bytes([0]) + crcs + bytes([len(enc)]) + enc
        s.sendall(bytes([16, len(block)]) + block)

        time.sleep(1.0)
        s.settimeout(6)
        data = b""
        try:
            while True:
                chunk = s.recv(4096)
                if not chunk:
                    break
                data += chunk
                if len(data) > 1_000_000:
                    break
        except socket.timeout:
            pass

    if not data:
        print("no response")
        return 1
    print("login status byte:", data[0], "(2 = authenticated)")

    if data[0] != 2:
        return 1

    dec = isaac([(v + 50) & 0xFFFFFFFF for v in seeds])
    # Verified: status(1) + 2 unencrypted bytes, then ISAAC frames.
    pos = 3
    while pos < len(data):
        opcode = (data[pos] - dec.next_int()) & 0xFF
        pos += 1
        print(f"opcode {opcode} at offset {pos - 1}")
        break
    print(f"session bytes: {len(data)} (frames begin at offset 3)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

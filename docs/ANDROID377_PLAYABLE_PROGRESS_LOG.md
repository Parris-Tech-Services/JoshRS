# JoshRS Android 377 — playable-client progress log

Owner: autonomous agent session, 2026-11-09 (Australia/Sydney).
Scope: turn the Kotlin `android-client` from a diagnostic/prototype into a genuinely playable revision-377 client.

Status vocabulary is strict:

- **VERIFIED COMPLETE** — reproduced with evidence on this device/CI, not merely compiled.
- **PARTIALLY COMPLETE** — some real capability exists, with a specific named gap.
- **BLOCKED** — cannot proceed without a named external condition.

A merged PR is not proof a feature works. Nothing below is marked verified without a reproducible command and captured output.

---

## 1. Environment facts (VERIFIED)

| Fact | Evidence |
|---|---|
| Host is the target phone | `getprop ro.product.model` → `SM-A556E` (Galaxy A55), SDK 36 |
| No local Android build chain | `java`, `gradle`, `adb`, `aapt2` all absent; `ANDROID_HOME` unset |
| APK builds happen in CI | `.github/workflows/android-foundation.yml`, runs 48–76 s, green on `main` (run 42603361499) |
| Server engine | `LostCityRS/Engine-TS` branch `377-wip`, **MIT**, pinned `b5ac859` by `install-phone-server.sh` |
| Content engine | `LostCityRS/Content` branch `377-wip`, pinned `44eab09`; code MIT, **assets are Jagex IP** |
| Node on phone | v26.3.1 (installer guards on `v24.*`) |

## 2. VERIFIED COMPLETE

### 2.1 Real rev-377 server runs on the phone itself
Cloned `Engine-TS@377-wip` + `Content@377-wip` as siblings, applied
`tools/android377-phone/loopback_bind.py` (fails closed, verified 6 bindings), then booted.

```
INFO  Packing cache, please wait until you see the world is ready.
INFO  Starting world
DEBUG Loading game map
DEBUG 11666/16383 static NPCs added
INFO  World ready
```

Listening on `127.0.0.1:43594` (game) and `127.0.0.1:8898` (web/setup). No non-loopback bind.

### 2.2 The app's own login probe is authentic against a live engine
The previously **untested** `Negotiation377` probe was replayed byte-for-byte against the
running engine:

```
send: 0E 00
recv: 17 bytes  00000000000000000000 47e1ba4e455948
first9_zero: True
```

This confirms the app's accept-condition matches a genuine 377 server response on this device.
It remains a **credential-free negotiation**, not a login.

## 3. PARTIALLY COMPLETE

| Capability | What is real | Named gap |
|---|---|---|
| Cache reading | authentic 520/512-byte sector store, idx chaining, Jagfile, BZip2/GZIP | only idx0/1/4 imported; idx2/3/5/6 never opened |
| Terrain | 4×64×64 planes, opcode 0/1 heights, overlay/underlay/shape/rot, flo RGB | plane 0 only; floor texture IDs decoded then discarded |
| Loc placement | authentic id/pos deltas, type/orientation | no `loc.dat` definitions, no collision map, rendered as dots |
| Models | authentic 18-byte footer, delta vertices, triangle strips, true 3D perspective + painter sort | face priorities/alpha/skins/textured-count block skipped; no z-buffer; 4000-face cap |
| Save files | read-only `0x2004` v2–7, CRC-32, 21 skills | never writes; no server-side character link |
| Networking | one-shot sockets, RFC1918/loopback allow-list | no packet loop, no reconnection, no session |

## 4. BLOCKED / ABSENT

**Absent for a playable client** — each is a required subsystem, not a polish item:

- Animation & sequences (`seq.dat`: frames, delays, skins, transforms) — **absent**
- Textures (cache idx6) and texture mapping — **absent** (index never opened)
- Loc definitions and collision — **absent**
- Lighting/shading — **absent**
- Game protocol: **0 inbound opcodes parsed, 1 outbound (14)**; no packet loop
- Varps/varbits, interfaces, chat, inventory, skills, combat, banking, trading, quests — **absent** (painted fakes)
- Audio (jingle/MIDI, sound effects, music) — **absent**
- Player/NPC entities and animation playback — **mocked visuals only**
- Minimap — **absent** (compass is decorative)

**Blocked by rights, not by effort:** there is no rev-377 client that is simultaneously
accurate, Android-ready and permissively licensed. See
`docs/ANDROID377_LICENSING_AND_REUSE_AUDIT_2026-11-09.md`.

## 5. Next milestone (ordered)

1. Transliterate the MIT `Engine-TS` network layer into Kotlin: `Packet`/`rsbuf` → `PacketBuffer.kt`,
   `Isaac.ts` → `IsaacCipher.kt`, 39 client-prots → `ClientProt.kt`, 74 server-prots → `ServerProt.kt`.
2. Implement the real login block (RSA + ISAAC seed + credential hashing) against the pinned engine, then hold a live session.
3. Loc definitions + collision + full-plane terrain, then a z-buffered rasteriser.
4. Sequences/animations, then textures, then audio.
5. Entities and interface system, then skills/inventory/chat from live varps.

## 6. Round 2 — Kotlin protocol layer (source-only until CI runs)

New package `au.com.parristech.joshrs.android.protocol`, all derived from the
**MIT** `Engine-TS@377-wip` sources, with the MIT notice retained in every file:

| File | Origin | Purpose |
|---|---|---|
| `IsaacCipher.kt` | `src/io/Isaac.ts` | opcode obfuscation, plus `copy()` so a partial frame can be peeked without consuming stream output |
| `PacketBuffer.kt` | `src/io/Packet.ts` | big-endian accessors, `gjstr`/`pjstr`, standard CRC-32 |
| `ClientProt.kt` / `ServerProt.kt` | `ClientGameProt.ts` / `ServerGameProt.ts` | 80 client-bound + 64 server-bound opcodes, generated |
| `GameFrameCodec.kt` | `NetworkPlayer.ts` `read`/`writeInner` | `opcode [len] payload` framing, `-1`/`-2` prefixes, 1600-byte cap |

Reproducible generator: `tools/android377-phone/generate-prot-tables.mjs`.

**Why `copy()` matters:** the ISAAC stream advances once per opcode. A naive
reader that peeks the opcode before the payload arrives desynchronises the whole
session. `FrameAccumulator` peeks on a clone and commits only on a complete frame.

**Status: PARTIALLY COMPLETE.** ISAAC is pinned to reference vectors generated by
running the server's own `Isaac.ts`. Kotlin has not yet been executed — no JDK,
Gradle or Android SDK exists on this host, so CI is the only compiler. Nothing in
this package has made a live connection yet.

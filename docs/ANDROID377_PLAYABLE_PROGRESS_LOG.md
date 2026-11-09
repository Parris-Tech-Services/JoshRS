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

**Status: PARTIALLY COMPLETE — compiler- and test-verified, not yet on the wire.**

No JDK, Gradle or Android SDK exists on this host, so CI is the only compiler.
Evidence (CI run 42608264846, branch `android377/protocol-layer`):

```
BUILD SUCCESSFUL in 25s
Verified isolated APK identity — existing JoshRS installation cannot be replaced.
```

`:app:testDebugUnitTest` fails the build on any failing test, so a successful
build means every protocol test passed. The three defect cycles that got here are
recorded in git history rather than hidden:

| CI run | Result | Cause |
|---|---|---|
| 42607618881 | compile error | `byteArrayOf` literals were `Int`, not `Byte` |
| 42607809847 | 7/61 failed | `psize1`/`psize2` wrote at `pos-1` instead of `pos-size-1` |
| 42608049762 | 1/61 failed | wrong expected value in my own buffering test |

ISAAC matches reference vectors produced by running the server's own `Isaac.ts`
(seeds `[0,0,0,0]`, `[1,2,3,4]`, `[-1,0,0,0]`, 16 outputs each) and survives the
256-output refill boundary.

**Still absent in this package:** RSA login-block encryption, the credential
payload, socket I/O, reconnection. No frame has yet been exchanged with the live
engine — the next gate is a real opcode-14 probe plus login from Kotlin.

## 7. Round 3 — private experimental build produced an APK (VERIFIED)

A separate **private** repository (`Parris-Tech-Services/JoshRS-Android-Experimental`) now
vendors `zeruth/meteor-mp` branch `377` — the only Android-ready 377 client in existence.
It is **not** part of this public repo and must never be merged into it: upstream ships no
LICENSE on any branch, so the code is all rights reserved, and its `rs/` module is a
decompiled Jagex client. The owner accepted that risk for private family-only use; it does
not extend to publication.

Evidence (private CI run 42609710370, `BUILD SUCCESSFUL in 3m 40s`):

```
client-android-debug.apk   31 MB
sha256 4476e20bdc1549e287e0b8eefbc6715a024040f12f046ff027c09f4363ac6cf6
```

- Built with JDK 21 / Android SDK 36 / Gradle 9.3.0 via `.github/workflows/android-build.yml`,
  which refuses to run unless the repository is private.
- Actions **artifact** storage is exhausted account-wide, so the APK is published as a
  **release asset** instead; the checksum verified locally with `sha256sum -c`.
- Published as `applicationId com.meteor.android`, so it installs side by side with
  `au.com.parristech.joshrs.android` and cannot touch its data.

**Still unverified:** the app has not launched, logged in, or rendered anything on the
Galaxy A55. A successful compile is not a playable client, and this log does not claim one.
The next gate is: launch, supply a user-owned 377 cache, and log in against the pinned
engine on `127.0.0.1:43594`.

**Not claimed:** gameplay, authentication, multiplayer, audio, persistence.

## 8. Round 4 — authenticated rev-377 login VERIFIED (server side)

A clean-room Python probe (`tools/android377-phone/probe-login-377.py`) completed a **real
credentialed login** against the pinned engine on the phone and received a live session.

```
NOTE: public.pem has modulus/exponent swapped; corrected by length
handshake bytes: 17 00000000000000000000bc8a601ebd0558
login status byte: 2 (2 = authenticated)
opcode 222 at offset 3
session bytes: 2939 (frames begin at offset 3)
```

Decoding the full response with the engine's own ISAAC yielded **536 frames, 0 errors**:

| Packet | Count | Meaning |
|---|---|---|
| `VARP_SMALL` | 222 | live variable state |
| `PLAYER_INFO` | 100 | players in the scene |
| `NPC_INFO` | 100 | NPCs in the scene |
| `UPDATE_ZONE_FULL_FOLLOWS` | 49 | map rebuilds |
| `UPDATE_STAT` | 21 | **all 21 skills** |
| `IF_SETTAB` | 14 | interface tabs |
| `IF_SETTEXT` | 7 | interface text |
| `MIDI_SONG` | 2 | music |
| `LOGOUT` | 1 | session end |

### Wire facts established by experiment (each cost a failed attempt)

1. **Revision 377 does not fit in a byte.** Sending `377 & 0xff` yields status `6`
   ("out of date"). The client must send `0xFF` then a 16-bit `377`.
2. **CRC bytes** must be the first 36 bytes of the engine's `CrcBuffer`; the server checks
   `crc32(those 36 bytes) == CrcBuffer32`, so a client needs the server's `/crc` data —
   not the cache itself — to pass this gate.
3. **The login response is `[status][2 unencrypted bytes][ISAAC frames]`.** Starting the
   packet loop at offset 1 desynchronises after 2 frames; offset 3 parses all 2877–2939
   bytes cleanly. This was found empirically by probing offsets 1–6.
4. **`data/config/public.pem` in the pinned engine has modulus and exponent swapped**
   (n is 32 bytes, e is 64; the private key is n=64, e=32). Any client trusting that file
   builds a block the server rejects. The probe detects the swap by length and corrects it.

**This verifies the server and the wire format, not the Android app.** The Kotlin client and
the vendored Android app have still not logged in. The meter for client progress is unchanged.

**Blocked:** APK installation on the A55 has not happened; `pm list packages` shows neither
`com.meteor.android` nor `au.com.parristech.joshrs.android`, and there are no install events
in logcat. Installing needs a human tap on the system package installer.


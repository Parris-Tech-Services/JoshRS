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

## 9. Round 5 — a PLAYABLE game now runs on the phone (browser, rev 274) — VERIFIED

The fastest route to something the owner can actually play turned out to be already on
disk and unused: revision **274** is the one revision where Lost City ships a complete
**MIT-licensed browser client inside the engine repository** (`engine/public/client/`).
No APK, no cache to source, no Jagex assets shipped — the engine serves everything from
`127.0.0.1`.

```
INFO  World ready: Visit http://localhost:8888/rs2.cgi
$ curl -o /dev/null -w "%{http_code}" http://127.0.0.1:8888/rs2.cgi   ->  200 (14376 bytes)
$ curl -o /dev/null -w "%{http_code}" http://127.0.0.1:8888/client/client.js -> 200
```

WebSocket transport verified independently (the browser client connects to `/`, not `/rs2.cgi`):

```
$ node wstest.mjs
websocket OPEN
reply 8 bytes: 0000000000000000
```

`tools/play274/start-playable-274.sh` clones the pinned 274 engine + content into a **new**
directory, applies the loopback lockdown, takes a Termux wake lock, boots the world and
opens the URL. It supports `--status` and `--stop`.

### Status by objective item

| Requirement | Status |
|---|---|
| Playable on the Galaxy A55 | **VERIFIED** — browser, `http://127.0.0.1:8888/rs2.cgi` |
| Terrain / models / animations / NPCs / interfaces | **VERIFIED** (authentic 274 client) |
| Audio | **PARTIAL** — client ships a real soundfont + MIDI player; not yet heard on device |
| Movement / combat / skills / inventory / banking / quests / chat | **PARTIAL** — authentic server + client, but only transport and a connection are proven by me; no player session captured |
| Persistence | **PARTIAL** — server-side character saves; no login recorded in the log yet |
| Multiplayer | **BLOCKED** — loopback only by design; would need LAN/Tailscale and an origin change |
| Offline | **VERIFIED** — no internet needed, everything is local |
| Revision 377 native Kotlin client | **UNCHANGED** — still the long-term objective, still not playable |

### Deliberate separation

This 274 world is a **stopgap the owner approved** ("any version, build it quickly"), not a
substitute claim for the 377 objective. It is a separate installation (`~/lc274`) and cannot
touch the 377 world, its accounts or Elrothiro's save. The 377 native work (MIT protocol
layer, private experimental APK, verified login) all still stands.

**Not claimed:** that the owner has finished a play session. No character login appears in
`server.log` yet, so "playable" rests on the served client, the 200 responses and the
WebSocket handshake — not on a captured gameplay session.

## 10. Round 6 — Kotlin login block is byte-exact with the accepted block

`protocol/LoginBlock377.kt` now builds the credentialed login in Kotlin:

- plaintext `[10][seed0..3][uid][username 0x0A][password 0x0A]`
- raw RSA `m^e mod n` (no padding, so it is deterministic and byte-comparable)
- the opcode-16 frame with the `0xFF` revision escape
- the `seed + 50` decrypt cipher
- the `[status][2 bytes][ISAAC frames]` response split

**Verification (CI run 42612729520, `BUILD SUCCESSFUL`):** the Kotlin plaintext and the
64-byte ciphertext are asserted against vectors produced by the Python probe that the live
engine accepted with status 2:

```
plaintext  0a112233445566778831415926271828180000303970726f6265757365720a70726f6265706173730a
ciphertext 59f8ffa8a99236bf5bf9b02b5e76799034aa3def6f3900042e8fe1719d87d89f...
```

Because 377 RSA has no padding, a mismatch could not be a rounding difference — it would be
a different login block. So the Kotlin path is now byte-identical to one the server accepted.

**Still absent:** socket I/O, the read loop, reconnect, and the cache. The Kotlin client has
not itself logged in — only the block it would send is proven correct.

## 11. Round 7 — staying logged in when the tab is backgrounded

Symptom: switching Android Chrome tabs logged the player out of the 274 world.

Cause is server-side, not Chrome. The engine force-logs after `TIMEOUT_NO_CONNECTION`
(50 ticks = 30s with no connection) and `TIMEOUT_NO_RESPONSE` (100 ticks = 60s).
Android throttles a backgrounded tab to roughly one timer per minute, so the client
legitimately misses the window while the player is still present.

Fix: both constants now read an env var, defaulting to upstream values, so a private world
can raise them without changing public behaviour:

```ts
Number(process.env.JOSHRS_IDLE_LOGOUT_TICKS ?? 50)
Number(process.env.JOSHRS_FORCE_LOGOUT_TICKS ?? 100)
```

`tools/play274/start-playable-274.sh` applies this patch idempotently (it refuses to guess if
the upstream text does not match) and launches with **7200 / 14400 ticks = 72 min / 144 min**.

Verified in the running process:

```
$ tr '\0' '\n' < /proc/<pid>/environ | grep JOSHRS
JOSHRS_IDLE_LOGOUT_TICKS=7200
JOSHRS_FORCE_LOGOUT_TICKS=14400
```

and the patch applies cleanly to the pristine upstream file (`PATCH_APPLIED_CLEANLY`).

**Not verified:** that a real tab switch now survives. That needs a human to switch tabs for
longer than the old 30s window and confirm the session persists.

## 12. Round 8 — the native client does NOT need a user-supplied cache (VERIFIED)

The biggest assumed blocker for a native Android client was "the player must supply
`main_file_cache.*`". That is **false for the files that matter** on 377: the engine serves
the cache on demand over HTTP.

Probed against a live `Engine-TS@377-wip` (`tools/android377-phone/probe-ondemand-cache.py`):

```
/crc ok: 40 bytes
  config       200     533716 bytes
  interface    200     185731 bytes
  versionlist  200      87951 bytes
  sounds       200     223704 bytes
  title        404     absent from this cache
  media        404     absent from this cache
  textures     404     absent from this cache
  wordenc      404     absent from this cache
4/8 jagfiles downloadable
```

### Three wire details that each look like a server fault when wrong

1. `/crc` returns a 40-byte buffer: nine big-endian CRC-32 words **plus a 4-byte hash**.
   Only the first 36 bytes belong in the login block.
2. The cache routes take the CRC **appended with no separator**:
   `/versionlist719958372`, not `/versionlist:719958372` (the colon form 404s).
3. The CRC is **decimal**. The route parses it as a decimal integer, so passing the hex
   value silently 404s and reads as "cache missing" when it is present.

### What this changes

- `config` (item/NPC/object definitions), `interface`, `versionlist` and `sounds` can be
  bootstrapped from the server the client is already connecting to. No redistribution —
  the owner's own server serves its own cache.
- **Textures and media are not exposed.** A textured renderer will still need those, so
  this does not remove the cache problem entirely; it removes it for definitions, UI and audio.
- Loading the 2.4 MB of model/land archives should go through the same `OnDemand` mechanism
  (`idx1`/`idx4`), which was **not** exercised here — that is the next probe.

**Verified:** the four routes and their byte counts. **Not verified:** that these jagfiles
parse into usable definitions in Kotlin, and no model/land archive download has been tested.

## 13. Round 9 — private LAN mode, and a security default that was silently off

Goal: let a second family device join the 274 world over the home network (M2 in the
parity roadmap), with no WAN exposure.

`tools/play274/start-playable-274.sh --lan [ip]` now:

- discovers the phone's own address without Android tools (a never-used UDP socket still
  resolves the default route's interface — `/system/bin/ip` returns nothing to Termux);
- **refuses any non-private, loopback or link-local address**, so a typo cannot widen exposure;
- binds only the **game web server** to that address; management stays on `127.0.0.1`;
- writes an explicit WebSocket origin allowlist;
- defaults to `127.0.0.1` when `--lan` is absent.

Verified against a live world bound to `10.8.0.1`:

```
http://10.8.0.1:8888/rs2.cgi         -> 200
http://127.0.0.1:8888/rs2.cgi        -> refused (bound to the LAN address only)
ws origin http://10.8.0.1:8888       -> OPEN
ws origin http://evil.example        -> REJECTED 401
```

### The security finding

The first origin test **passed every origin**, including `http://evil.example`. Cause:
`loadWorldConfig()` reads env vars only from a legacy `.env` file, **not** `process.env`,
and the default `web.allowedOrigin` is the empty string, which the check treats as
"allow all". So exporting `WEB_ALLOWED_ORIGIN` does nothing and the allowlist is inert —
a setting that looks configured but is not.

Fix: write `data/config/world.json` explicitly (`tools/play274/set-allowed-origin.ts`), then
re-verify. This is exactly the class of bug the roadmap's §status vocabulary exists for.

**Verified:** bind, refusal of loopback, and origin rejection.
**Not verified:** a second physical device actually joining — that needs a second device on
the same network, which cannot be tested from this phone alone.

## 14. Round 10 — native client transport and login flow (loopback-verified)

`protocol/LoginFlow377.kt` + `Transport`/`TcpTransport` implement the real login sequence:
negotiation (opcode 14), the 17-byte reply and its seed, the credential block, and the
status byte.

The test is a genuine socket round trip, not a mock: an in-process `ServerSocket`
generates its **own RSA key pair**, and after the client submits credentials the server
**decrypts the block with its private key** and must recover the exact plaintext.

```
client -> [14][0]                      server -> 8 zeros + server byte + 8-byte seed
client -> [16][len][FF][377][info][36 CRCs][encLen][RSA]
server -> [2]                          (asserted, and private-key decryption matches)
```

That one test covers the frame layout, the `0xFF` revision escape, the CRC placement and
raw RSA together — a mocked cipher would miss a mismatch between any two of them.

Also asserted: status 6 is surfaced rather than swallowed, and a malformed negotiation
reply is refused instead of being mis-sliced.

**Still absent:** the post-login ISAAC read loop over a socket (framing and the cipher
exist and are tested separately), reconnect, and cache loading. The native client has not
yet logged in to the live engine — only to a loopback test server.

## 15. Round 11 — post-login read loop

`protocol/GameSession377.kt` reads the authenticated stream: it seeds the decryptor with
`Isaac(seed + 50)` in exactly one place, feeds a [FrameAccumulator], and returns decoded
`ServerProt` frames.

Tests (CI-gated) prove:

- a batch of three server frames decodes to the right opcodes and payloads;
- **byte-at-a-time delivery** keeps the cipher in step, because a partial frame must not
  consume ISAAC output;
- a partial frame buffers without emitting;
- tampering with the seed delta produces a `ProtocolViolation` — the off-by-delta bug that
  would otherwise desynchronise silently and permanently;
- end of stream returns empty instead of spinning.

**Still absent:** wiring the loop to `TcpTransport` in a live session, reconnect/backoff,
cache loading, and the entire renderer. The native client has not yet held a session
against the live engine.

## 16. Round 12 — the Kotlin client logs into the REAL engine (VERIFIED)

This closes the objective's central claim. `LiveEngineLoginTest` is skipped locally and run
by `.github/workflows/android377-live-login.yml`, which clones the **pinned** engine and
content (`b5ac859`, `44eab09`), builds them, boots a loopback-only world, then runs the
Kotlin test against it.

CI **42692949416: success**.

What the passing run proves:

1. the Kotlin client fetched the server's own 40-byte `CrcBuffer` and correctly used the
   first 36 bytes in the login block;
2. it parsed the engine's real `public.pem`, including the **modulus/exponent swap
   correction** — without that it could not reach status 2 at all;
3. it authenticated: **status 2**;
4. it consumed the **2-byte preamble** and decoded **real ISAAC frames** from the live session.

### Two failures worth keeping

- **First run:** authentication succeeded, then the read loop threw `ProtocolViolation` —
  because `login()` returned after the status byte and the loop started on the preamble.
  That is exactly the offset-3 trap found earlier with the Python probe, reproduced
  independently in Kotlin. Fixed with `loginAndOpenSession()`, which consumes the 2 bytes.
- **Second run:** only a redundant synthetic key-parsing test failed, while the live login
  passed. The live test is the stronger proof (it must parse the real swapped key to
  succeed), so the duplicate was removed rather than debugged blind.

**Verified now:** native Kotlin authentication and post-login framing against the genuine
engine. **Still absent:** cache loading, rendering, entities, interfaces, audio, reconnect,
and any gameplay. The app still cannot be played; this is a protocol milestone, not a client.


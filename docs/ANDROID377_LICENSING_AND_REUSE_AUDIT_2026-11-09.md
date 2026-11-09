# Open-source components for a Kotlin/Android RuneScape rev-377 client

**Target:** native Kotlin Android client ↔ LostCityRS **Engine-TS** (`377-wip`)
**Method:** GitHub REST API `license` field + raw `LICENSE` fetch + shallow clone & inspection of each repo, 2026-11-09.
**Bottom line:** *nothing* that is simultaneously rev-377-accurate, Android-ready **and** permissively licensed exists. The 377 client code you want is real and it already runs on Android — but it ships with **no licence at all**.

---

## 1. Summary table

| # | Component | SPDX (evidence) | LICENSE file | Rev-377 accurate | Android-ready | Size | Vendorable? |
|---|---|---|---|---|---|---|---|
| 1 | `LostCityRS/Engine-TS` @`377-wip` | **MIT** (API + file) | ✅ `LICENSE` | ✅ authoritative | N/A (Node 24 server) | ~23 MB repo / 5.2 MB checkout | ✅ legally yes (TS, not Kotlin) |
| 2 | `LostCityRS/Content` @`377-wip` | **MIT** for code; **assets are Jagex IP** | ✅ `LICENSE` | ✅ (it *is* the 377 data) | ❌ 238 MB data | ~238 MB worktree | ⚠️ code yes, assets no |
| 3 | `Promises/refactored-client-377` | **none** (API `null`) | ❌ | ✅ (release #377) | ❌ Java AWT | 1.9 MB, 81 `.java` | ❌ no licence |
| 4 | `Rabrg/refactored-client` | **none** (API `null`) | ❌ | ❌ (317) | ❌ Java AWT | 1.7 MB, 73 `.java` | ❌ no licence, wrong rev |
| 5 | `zeruth/meteor-mp` @`377` | **none** (all 4 branches) | ❌ (none, ever) | ✅ byte-identical to Client-Java 377 | ✅ **Kotlin + Compose, real `client-android`** | 6.3 MB checkout, `rs` 1.4 MB | ❌ no licence (best tech fit) |
| 6 | `reinismu/runescape-web-client-377` | **none** (API `null`) | ❌ | ⚠️ 377 cache, ~317 protocol | ⚠️ TS/WASM, not native | 35 MB (18 MB is a **Jagex cache**) | ❌ no licence + redistributes cache |
| 7 | `2004scape/*` | Server **MIT**; Client/Client2 **none** | mixed | ❌ **rev 274**, not 377 | ⚠️ Java / TS | large | ⚠️ server yes, client no |
| 8 | `runelite/runelite` | **BSD-2-Clause** ✅ | ✅ | ❌ OSRS (rev ~200+) | ❌ Java/Swing | 126 MB | ✅ legally, ❌ technically |
| 9 | Others | see §9 | — | — | — | — | mostly unlicensed |

---

## 2. Component detail

### 1. `LostCityRS/Engine-TS`, branch `377-wip` — **MIT** ✅

- GitHub API: `"license": {"spdx_id": "MIT", "name": "MIT License"}`.
- `LICENSE` (raw, branch `377-wip`):

  > MIT License
  > Copyright (c) 2023-2026 Lost City
  > … Permission is hereby granted, free of charge, to any person obtaining a copy of this software … to deal in the Software without restriction …

- **Rev-377 accuracy: this is the reference implementation.** The 377 wire protocol is fully enumerated:
  - `src/network/game/client/ClientGameProtRepository.ts` — **39** inbound client-prot decoders (`OpLocDecoder`, `OpNpcUDecoder`, `MoveClickDecoder`, `IfButtonDecoder`, `MessagePublicDecoder`, `IdkSaveDesignDecoder`, `InvButtonDDecoder`, …).
  - `src/network/game/server/ServerGameProtRepository.ts` — **74** outbound server-prot encoders.
  - `src/network/game/{client,server}/codec/**` — per-opcode read/write logic, including rev-377 oddities (`OpHeldT`, `OpLocU`, `ResumePCountDialog`).
  - `src/cache/**` — 377 cache readers (`config`, `graphics`, `midi`, `wordenc`), `src/network/rsbuf/**` — the `rsbuf` buffer primitives.
  - `src/server/ws/WSClientSocket.ts` — a **WebSocket** transport sits alongside TCP (`src/server/tcp`), which matters if you want a fallback transport.
- **Android compatibility:** none directly (Node 24 + TypeScript). Its value is as an exact, MIT-licensed **specification** you re-implement or transliterate into Kotlin.
- **Vendoring:** legal (MIT). Practically you vendor *knowledge*, not code — but you may copy `rsbuf`/ISAAC/codec logic into Kotlin with attribution. Note `src/3rdparty/bzip2-wasm` carries its own **bzip2-1.0.8 BSD-style** licence (Julian Seward) — keep that notice if you port the decompressor.

### 2. `LostCityRS/Content`, branch `377-wip` — MIT code, **Jagex assets** ⚠️

- API: MIT. `LICENSE` identical to Engine-TS (`Copyright (c) 2023-2026 Lost City`).
- The `README.md` is explicit and is the single best citation for the asset question:

  > **License**
  > Source code is licensed under the [MIT License]…
  > **Assets within are the intellectual property of Jagex Ltd. These do not get covered by our software license.**
  > They were originally obtained from their official software distribution channels then extracted here, and are included for historical preservation.

- Contents: `models/` 69 MB, `maps/` 77 MB, `songs/` 17 MB, `synth/` 12 MB, `scripts/` 24 MB, `sprites/`, `textures/`, `wordenc/`, `pack/` → **~238 MB**. Far too large to embed in an APK anyway.
- **Verdict:** you may vendor the *script/packing tooling* (MIT), you may **not** treat the art/audio as MIT. Ship no cache; require the user to supply one (see §8).

### 3. `Promises/refactored-client-377` — **no licence** ❌

- API `"license": null`; **no `LICENSE`, `LICENSE.md`, `LICENSE.txt` or `COPYING`** anywhere in the tree (checked root + recursive `*licen*`).
- GitHub's own sidebar therefore shows **no licence** — i.e. *not* open source in the legal sense, despite being publicly readable.
- **Rev-377 accurate: yes.** `src/main/java/com/jagex/runescape/Game.java:552` → `System.out.println("RS2 user client - release #" + 377);`, and `:7173` requests `"crc…-377"` from JAGGRAB. 81 `.java` files, 1.5 MB of source, Gradle `application` plugin, `mainClass = com.jagex.runescape.Game`.
- **Java AWT/Swing**, single-threaded game loop with `java.awt.Graphics` painting — **will not compile against the Android SDK** (`java.awt` is absent). Would require exactly the `PixMap` abstraction that Meteor built.
- It is a *deobfuscated Jagex binary*, so the author cannot grant clean rights even if he wanted to; the underlying work is Jagex's.
- Extras over vanilla: resizable/HD, mouse-wheel zoom, 400+ text engine (`<col=…>`, `<shad=…>`, `<trans=…>`), galkon sound engine — useful as **reading material** for behaviour, not as a dependency.

### 4. `Rabrg/refactored-client` — **no licence** ❌, and wrong revision

- API `"license": null`, no LICENSE file. 73 `.java`, 1.7 MB, last push **2018-07-11**.
- Revision **317**, not 377 — cache format, opcode set and login block differ. Zero value for a 377 target except as a style reference for refactoring.
- Same AWT problem (5 files import `java.awt`).

### 5. Meteor MP — `zeruth/meteor-mp`, branch `377` — **no licence** ❌ (technically the best fit)

**Exact slug:** `github.com/zeruth/meteor-mp` (default branch is **`377`**; other branches `225`, `main`, `os1`). Do not confuse with `MeteorLite/meteor-mobile`, which is a *different*, older project: an Android port of the OSRS Meteor client (`app-android`, Java, last push 2023-04, also **no licence**) — not 377.

- README self-description:

  > Meteor is a modernized, and multi-platform rs2 client … Java-21 / Kotlin-2.3.0 / Compose-1.10.0 / Android-36
  > It has a similar api and tooling to RuneLite, but uses Kotlin/Compose rather than Java/Swing
  > `client-android (JVM 21)`, `client-common`, `client-desktop`, `rs (formerly runescape-client)`, `api`, `api-rs`, `common`, `injector`, `mixins`, `injected-client`

- **Licence: absent — on every branch.** `zeruth/meteor-mp/contents/?ref={225,main,os1,377}` returns **no** `LICENSE`/`COPYING`; GitHub API `license: null`; zero commits matching "license". The README has no licence section. **Default = all rights reserved.**
- **Aggravating detail:** `common/src/main/java/net/runelite/**` (e.g. `net/runelite/mapping/ObfuscatedName.java`) still carries the RuneLite **BSD-2** header (`Copyright (c) 2016-2017, Adam <Adam@sigterm.info>`), i.e. Meteor is itself redistributing BSD-2 code *without* a top-level LICENSE/notice file. That is a notice-retention defect in Meteor, and it also means parts of Meteor are BSD-2 while the rest is unlicensed.
- **What `client-android` actually contains** (964 KB, and it is *thin*):
  - `src/main/java/android/MainActivity.kt` — a single `ComponentActivity` using **Jetpack Compose**; a `Canvas` whose `drawIntoCanvas { it.nativeCanvas … }` blits the client's `PixMap`; `pointerInteropFilter`/`detectTapGestures` translate touch into synthetic mouse events; a single-thread `Executors.newSingleThreadExecutor()` dispatcher drives the game loop; `WindowInsetsControllerCompat` for immersive landscape.
  - `src/main/AndroidManifest.xml` — one activity, `screenOrientation="landscape"`, permissions `INTERNET` and `MIDI`, `networkSecurityConfig` allowing cleartext to `10.0.2.2`.
  - `build.gradle.kts` — `namespace com.meteor.android`, `compileSdk 36`, **`minSdk 30`**, Java 21, Compose enabled, and `implementation(files("../lib/injected-client.jar"))`.
  - `res/` — launcher icons, `strings.xml`, `themes.xml`, `network_security_config.xml`. **That's all. No rendering, no networking, no UI screens** — those live in `rs`, `api`, `client-common`.
- **The important discovery:** Meteor's `rs/src/main/java/jagex2/**` is **byte-for-byte the same file set** as `LostCityRS/Client-Java` branch `377` — 73 files, `diff` empty. So Meteor = *LostCity's official 377 client refactor* + Kotlin platform layer (`meteor/platform/{android,vanilla,headless}`) + RuneLite-style injector.
  - Only 9 files under `rs` touch `java.awt`/`javax.swing`, and they are confined to `meteor/platform/vanilla/**` and `jagex2/graphics/PixMap.java`. The core is abstracted behind `meteor/platform/Context.kt` (`getCacheDir()`, `createPixmap()`, `ViewBox`), with Android implementations in `rs/src/main/java/meteor/platform/android/{AndroidContext,AndroidPixMap,AndroidViewBox}.kt`.
  - Build chain: `:injected-client:injectMultiplatform` (ASM bytecode injection, JVM 21) runs `:api-rs:build`, `:mixins:build`, `:rs:build` and emits `lib/injected-client.jar`; every Android `compile*`/`merge*` task `dependsOn` it. So the APK build needs a **JDK 21 desktop toolchain**, not just Android Studio.
- **Cache:** user-supplied. `VanillaContext.kt:33` → `~/meteor-377/cache/`; `AndroidContext.kt:19-26` → app cache dir + `/meteor-377/cache`. Nothing is bundled.
- **Size:** 6.3 MB shallow checkout (API reports 326 MB of history). `rs` 1.4 MB, `injector` 1.5 MB, `client-android` 964 KB, `api` 45 KB, `common` 115 KB.
- **Verdict:** the *only* rev-377 client that is already Kotlin + Compose + Android and actually assembles. **Legally unusable as-is.**

> Note: the identical code is published by LostCity as **`LostCityRS/Client-Java`, branch `377`** — 76 `.java` files, Gradle `application`, `mainClass = jagex2.client.Client`, `sourceCompatibility 1.8`, ProGuard config, **and no LICENSE file** (API `license: null`; branches exist for `225, 244, 245.2, 254-teavm, 254, 274, 289, 377, 435, 468, 500`). LostCity's Engine README calls it "a research project to decompile and understand the original code".

### 6. `reinismu/runescape-web-client-377` — **no licence** ❌

- API `license: null`; no LICENSE file; last commit **2025-03-06**; 62 stars; 35 MB.
- TypeScript port of the 377 Java client (`osrs/Game.ts`, `osrs/cache/**`, `osrs/scene/**`) plus a **Rust/WASM** module (`wasm/`) for the hot rendering path (WebGL demo: `play.rsps.app`).
- **Not protocol-clean for your target:** `docker-compose.yml` mounts `./client_cache` into **`apollo`** at `game/data/fs/377` — i.e. it is a *377-cache* client talking a **317/Apollo** protocol (login sends `putShort(37745)` as the release marker, but packet handling is 317-shaped). Opcode coverage is partial: ~97 opcode comparisons, `PacketConstants.PACKET_SIZES` of 261 lines, no server-packet dispatch table comparable to Engine-TS's 74 encoders. Several comments admit it is behind on packages.
- **Legal landmine:** it commits `client_cache/main_file_cache.{dat,idx0..idx4}` — **18 MB of Jagex cache** — into the repo. That is exactly the redistribution LostCity warns against, and it has no licence to cover the code either.
- **Verdict:** useful as a *rendering reference* (how a 377 scene/cache is decoded in a modern language), not reusable.

### 7. 2004scape — **rev 274**, not 377 ❌

- The org `github.com/2004scape` has `Server` (**MIT**, 388★, now archived → moved to `LostCityRS/Server`), `Client` (Java, **no licence**), `Client2` (TypeScript, **no licence**), `rsmod-pathfinder` (ISC), `rsbuf` (MIT).
- `2004scape/Server/README.md`: **"Lost City - May 18, 2004"** → **revision 274**. It is *not* a 377 codebase.
- Web client: yes — "The server includes its own web client, so you don't have to download a client!" (`2004scape/Client2`, a TeaVM/TS port; `MeteorLite/2004scape-client` is a similar TeaVM webclient). But again rev 274.
- Assets: the old monorepo bundled its own cache; the modern split follows the LostCity policy (Engine MIT / Content MIT-with-Jagex-assets). You still cannot lift the media.

### 8. `runelite/runelite` — **BSD-2-Clause** ✅ but wrong game

- `LICENSE`: BSD 2-Clause, `Copyright (c) 2016-2017, Adam <Adam@sigterm.info>`; API confirms `BSD-2-Clause`; 5.5k★, pushed daily.
- **Why it is not usable for 377:** RuneLite targets **OSRS** (rev ~200+ of the *Old School* lineage). Its `runescape-client` is a current-OSRS deob; cache format (index 255 / XTEA / newer configs), opcode numbering, login block, ISAAC/RSA handshake, and the whole `net.runelite.rs.api` surface are OSRS-specific. None of it speaks rev-377.
- What *is* portable: the **architecture** — `injector` (ASM), `mixins`, `runelite-api` — which is precisely what Meteor re-used. And it is the licence model to copy: BSD-2 with per-file headers.
- ⚠️ Note for plugins: `runelite/runelite` core is BSD-2, but **many third-party plugin repos are AGPL-3.0** (e.g. `MeteorLite/RuneLitePlugins`). Don't conflate them.

### 9. Other rev-377 clients found

| Repo | Lang | Licence | Status | Notes |
|---|---|---|---|---|
| `luna-rs/luna-client` | Java + TeaVM browser | **none** | **active (pushed 2026-11-09)** | "Revision 377 Desktop and Browser Clients"; one source tree, two targets; Java 21; desktop cache at `~/luna/cache`. Closest living 377 client besides Meteor. |
| `AvernicHD/client-377` | C++17 (MSVC) | **none** | 2025-09 | "MSVC C++17 port of RuneScape 2 revision 377 for use with UnrealRS2"; 6 KB — a stub. |
| `me11yb3an/rs2vita244` | JS/C | **none** | 2026-11 | Offline 377 client for PS Vita; ships `src-tree.rar`, `SOURCE-MANIFEST.json`. Unlicensed. |
| `AIFanatic/runets` | TypeScript | **MIT** ✅ | stale 2023 | "Runescape 377 server and client" — `server/` + `web-client/`. **The only MIT 377 client-ish codebase**, but 1★, unmaintained, and a TS web client. |
| `LostCityRS/Client-TS` | TypeScript | **MIT** ✅ | active | Only branch **`274`** — no 377 branch. |
| `LostCityRS/RS742`, `RS910`, `OS1` | Java | **none** | — | Other revisions, same research-project, unlicensed. |

Searches run: `"377 client kotlin android"`, `"rev 377 client github"`, `"rs 377 client java"`, GitHub repo search `377+client+runescape`, `meteor-mp`, `2004scape`.

---

## 3. If a repo has NO LICENSE file

**Default is "all rights reserved".** GitHub Docs, *Licensing a repository*:

> "You're under no obligation to choose a license. **However, without a license, the default copyright laws apply, meaning that you retain all rights to your source code and no one may reproduce, distribute, or create derivative works from your work.**"

— <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository>

Practical consequences for public GitHub repos: you may **view** and **fork** (GitHub ToS grants that), but you have **no right to copy into your app, modify, or ship**. "Public" ≠ "open source" (OSI's definition requires an explicit licence permitting modification and redistribution). GitHub renders "no license" in the sidebar precisely so consumers can see this.

Affected here: `Promises/refactored-client-377`, `Rabrg/refactored-client`, `zeruth/meteor-mp` (all branches), `LostCityRS/Client-Java`, `reinismu/runescape-web-client-377`, `luna-rs/luna-client`, `2004scape/Client`, `2004scape/Client2`, `AvernicHD/client-377`, `me11yb3an/rs2vita244`, `MeteorLite/meteor-mobile`.

**The only lawful way to use any of them:** written permission from the copyright holder (and, because most are decompiled Jagex code, Jagex's own forbearance — a permission from the deob author does not cure the underlying IP).

## 4. Jagex asset licensing

**Short answer: no, cache/models/music cannot be redistributed by you.** Jagex retains copyright in all game art, models, animations, music, soundfonts and the cache itself; no open-source licence from a preservation project can grant you those rights because those projects do not own them.

How the community handles it — two different policies, both instructive:

1. **LostCity `Content` (transparent disclaimer + assets included).** The README says assets "are the intellectual property of Jagex Ltd. These do not get covered by our software license. They were originally obtained from their official software distribution channels then extracted here, and are included for historical preservation." So LostCity *does* host the data, under a preservation rationale, while carving it out of MIT. That is a tolerated-research stance, **not** a licence you can rely on for a Play Store app.
2. **The "bring your own cache" pattern (what working clients do).** `luna-client` reads `~/luna/cache`; Meteor reads `~/meteor-377/cache` on desktop and `<app cache dir>/meteor-377/cache` on Android; `reinismu` is the counter-example that *commits* an 18 MB cache — the thing to avoid.

**Recommended compliance posture for your APK:** ship zero cache bytes, no models/songs/sprites; on first run, either (a) point the user at a cache folder they obtained themselves (SAF folder picker, copy into `context.filesDir`), or (b) download the cache client-side from a user-configured URL. Do not embed `Content`'s `models/`, `songs/`, `synth/`, `sprites/` or a `main_file_cache.*`. Keep the app's own code MIT/Apache and state plainly that it contains no Jagex assets. Also note Jagex's ToS separately prohibits reverse-engineering and unauthorised clients — a licence question you cannot solve with OSS licences at all.

## 5. Does porting GPL code into an Android app make the whole app GPL?

**Generally yes.** Porting/translating GPL code creates a derivative work, and linking it into one app forms "a single combined program" — the whole combined work must be GPL and you must offer source to everyone you distribute to. The GNU GPL FAQ's plug-in/linking discussion states that where modules "make function calls to each other and share data structures, we believe they form a single combined program". Two gotchas: (a) **GPLv3** adds the Installation Information requirement, awkward for locked-down app stores; (b) **GPLv2-only is incompatible with Apache-2.0** (and with much of the AndroidX ecosystem), so a GPLv2-only port could not lawfully link modern AndroidX at all.
— <https://www.gnu.org/licenses/gpl-faq.html>

Only true separation survives: separate processes communicating at arm's length (fork/exec, sockets, CLI) are separate programs — not a realistic architecture for a game client.

**Good news:** none of the components you actually want are GPL. The relevant licences here are MIT (Engine-TS, Content code), BSD-2 (RuneLite), and "no licence" (everything 377-client). The GPL/AGPL risk appears only if you pull in **RuneLite plugins** — many are AGPL-3.0 — so keep plugin code out of the app.

---

## 6. Ranked recommendation

Ranking = authenticity × legality ÷ custom code.

### 🥇 #1 — `LostCityRS/Engine-TS` @`377-wip`: vendor the **network layer** (MIT)

This is the single component that gives you the most *authentic 377 behaviour* with a clean licence, because the protocol **is** the authenticity. Copy/transliterate into Kotlin, keeping the MIT notice + `Copyright (c) 2023-2026 Lost City`:

- `src/network/rsbuf/**` + `src/io/Packet.ts` → `PacketBuffer.kt` (byte/word/dword, smart, reverse, bit access).
- `src/io/Isaac.ts` → `IsaacCipher.kt` for the post-login stream.
- `src/network/game/client/ClientGameProt.ts` + `codec/*Decoder.ts` (39 opcodes) → `ClientProt.kt` enum + encoders.
- `src/network/game/server/ServerGameProt.ts` + `codec/*Encoder.ts` (74 opcodes) → `ServerProt.kt` enum + decoders.
- `src/network/game/client/ClientGameMessageDecoder.ts` / `server/ServerGameMessageEncoder.ts` → framing (var-byte length, opcode, payload) and the login block (`src/server/login/LoginThread.ts`, `src/network/game/client/codec/*`).
- Keep `src/3rdparty/bzip2-wasm/LICENSE` (bzip2 BSD-style, Julian Seward) if you port the decompressor for JAGGRAB/ondemand.

**Obligations:** retain copyright + permission notice in source and in an in-app licences screen; no copyleft; no asset rights. This is the "ship it on Play Store" path. **Cost:** you still write the renderer, cache decoder and UI — realistically the largest part of the work.

### 🥈 #2 — `zeruth/meteor-mp` @`377` (`rs` + `client-android`): most authentic, least code — **legally blocked**

Functionally this is exactly what you asked for: rev-377 `jagex2` client already abstracted behind `meteor/platform/Context.kt`, Android `PixMap`/`ViewBox` implementations, a Compose `MainActivity` that blits and routes touch, and a Gradle `injectMultiplatform` step. Vendoring `rs`, `api`, `api-rs`, `mixins`, `injector`, `common`, `client-common` and `client-android` would give you a playable 377 client in an afternoon — **if you had a licence.**

You don't. Required before you touch it:
1. **Written permission from `zeruth`** covering your use (and an explicit licence grant, not a "sure, go ahead" DM).
2. **Acknowledge the RuneLite BSD-2 files** in `common/src/main/java/net/runelite/**` (their headers are already there — keep them).
3. **Accept that the `jagex2` core is LostCity's decompile of Jagex code**, identical to `LostCityRS/Client-Java@377`; neither `zeruth` nor LostCity can grant you rights in Jagex's work, so this stays a private/research build, not a store release.

**Obligations if permitted:** MIT-style attribution to Lost City for the client core (they publish Engine and Content under MIT and would likely license the client similarly on request), BSD-2 notice for RuneLite-derived files, no cache redistribution. Also operational: build needs **JDK 21** + Android SDK 36, `minSdk 30`, and the ASM injector step.

### 🥉 #3 — `Promises/refactored-client-377`: best *behavioural reference*, no licence, AWT

Read it, don't link it: `Game.java` holds the full 377 client loop, the `37745`/`377` handshake constants, the scene renderer, and the extra 400+ text-engine/sound code. Porting its logic by hand into Kotlin (rather than translating the file) is the cleanest way to stay clear of both its missing licence and Jagex's IP — clean-room-ish, though "I read the source" weakens that defence.

### Deliberately not recommended
- `runelite/runelite` — BSD-2 but OSRS; only its **injector/mixins architecture** transfers (as Meteor proved). Copying its `runescape-client` is wasted effort for 377.
- `reinismu/runescape-web-client-377` — unlicensed *and* commits a Jagex cache *and* speaks 317 protocol.
- `2004scape`, `Client-TS`, `Rabrg` — wrong revision (274 / 317).
- `luna-client` — right revision (377), active, but unlicensed Java/TeaVM; another read-only reference.

### If you want one sentence
**Take Engine-TS's `src/network/game/**` (MIT) as your Kotlin protocol layer, and negotiate written permission for Meteor's `rs` + `client-android` if you want to skip writing a 377 renderer; otherwise port `Promises/refactored-client-377`'s `Game.java` behaviour by hand and ship no cache.**

---

## 7. Concrete integration sketch (legal path)

```
app/                         # your Kotlin Android app
 ├─ protocol/                # ported from Engine-TS (MIT, keep notice)
 │   ├─ PacketBuffer.kt      # ← src/network/rsbuf
 │   ├─ IsaacCipher.kt
 │   ├─ ClientProt.kt        # ← ClientGameProt.ts (39)
 │   ├─ ServerProt.kt        # ← ServerGameProt.ts (74)
 │   └─ LoginBlock.kt
 ├─ cache/                   # own decoder; read user-supplied cache only
 ├─ render/                  # GLSurfaceView or Compose Canvas + Bitmap
 └─ ui/                      # Compose screens, touch → synthetic mouse events
```

Build notes learned from Meteor: `minSdk 30`, `compileSdk 36`, JDK 21, `screenOrientation="landscape"`, `INTERNET` permission, cleartext exception only for `10.0.2.2` (emulator → host Engine-TS at `localhost:43594`).

---

## 8. Evidence index

| Claim | Source |
|---|---|
| Engine-TS MIT | `api.github.com/repos/LostCityRS/Engine-TS` → `license.spdx_id: MIT`; `raw.githubusercontent.com/LostCityRS/Engine-TS/377-wip/LICENSE` |
| Content MIT + Jagex asset carve-out | `raw.githubusercontent.com/LostCityRS/Content/377-wip/{LICENSE,README.md}` |
| refactored-client-377 unlicensed, rev 377 | API `license: null`; repo tree has no LICENSE; `src/main/java/com/jagex/runescape/Game.java:552` |
| Rabrg 317 unlicensed | API `license: null`; README "obfuscated v317" |
| Meteor unlicensed on all branches, Android module contents | `api.github.com/repos/zeruth/meteor-mp/contents/?ref={377,225,main,os1}`; `client-android/src/main/java/android/MainActivity.kt`; `client-android/build.gradle.kts` |
| Meteor `rs` == Client-Java 377 | file-list `diff` of `rs/src/main/java/jagex2` vs `Client-Java@377/src/main/java/jagex2` → 73/73 identical |
| RuneLite BSD-2 | `raw.githubusercontent.com/runelite/runelite/master/LICENSE`; API `spdx_id: BSD-2-Clause` |
| 2004scape = rev 274, MIT server, no-licence clients | `2004scape/Server/README.md` ("May 18, 2004"); org repo list |
| No licence ⇒ all rights reserved | <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository> |
| GPL + combined work / Android | <https://www.gnu.org/licenses/gpl-faq.html> |
| Client-Java 377 exists, unlicensed | `api.github.com/repos/LostCityRS/Client-Java` (`license: null`); branches include `377` |
| luna-client rev 377, unlicensed, active | `raw.githubusercontent.com/luna-rs/luna-client/master/README.md`; API `license: null`, `pushed_at 2026-11-09` |

# JoshRS Android — Kotlin foundation (stage 1)

## 9 November — real Galaxy A55 screenshot fixes

A phone playtest revealed two UX bugs on modern Android: the status icons overlapped
the screen title and the gesture/navigation bar obscured the last buttons and
the fictional preview panel. The Activity now wraps **every** screen in a
system-bars/display-cutout-aware container using Android window insets, including
the full-height canvas preview and real-cache inspectors. A new instrumentation
test checks the home and drawing screens against platform insets.

Diagnostic results now appear in an immediate modal dialog **and** remain
in the home status summary. The real Lumbridge button explains the exact
private files required and opens Android's multiple-file picker on confirmation
instead of silently failing and putting a message at the top of a long page.

**On a personal device**:
- A `127.0.0.1` test checks only the **phone** or `adb reverse`, never the PC. A
  private LAN address works only if the genuine 377 server already listens there.
- Import `main_file_cache.dat`, `main_file_cache.idx0`, and
  `main_file_cache.idx4` **as a set** to view read-only Lumbridge tile/loc
  geometry. These files are **not** bundled with the app.
- A Play Protect warning that the developer is unknown can occur for a
  side-loaded development-signed APK. This is not a safety verification;
  do not globally disable Play Protect. Install only if you trust the source
  and verify the build provenance. CI playtest APKs intentionally use unique
  package identities and debug signing keys, so installing a new build
  side-by-side does **not** migrate private cache or save copies.
- This remains a Kotlin diagnostic app and visual study. Authenticated
  revision-377 login, live inventory/quests/XP, exact 3D model/texture/animation
  rendering and playable cross-device movement are still not implemented.

## Actual Lumbridge vs fictional preview (phone report, 9 Nov 2026)

The user's Galaxy A55 screenshot showed **FICTIONAL OFFLINE DRAWING**, the
old isometric design exercise. That drawing is **not** Lumbridge, contains
no RuneScape terrain/collisions/NPCs and should not be confused with a
playable client.

The home screen now puts **Explore real Lumbridge (region 50,50)** immediately
under the title/status and the drawing demo at the end. The mock scene has
a visible **Switch to REAL 377 Lumbridge map** control. Both routes use
exactly `PrivateLumbridge377.loadFirst(filesDir)`. If the cache is missing,
the app returns to its home screen and displays a real error plus the
three required files. It never substitutes the fictional drawing for
missing historical game assets.

**Data requirement:** user-owned `main_file_cache.dat`,
`main_file_cache.idx0`, `main_file_cache.idx4`, imported together
via the Android file picker. On Fedora,
`bash tools/android377-phone/copy-private-lumbridge-cache.sh --check`
verifies the private cache, and `--copy` copies those three files to
a single authorised USB phone's Downloads/JoshRS377Cache without
touching player saves. The cache is not bundled in the APK.
This is still a read-only 377 terrain/loc viewer, **not** the full
3D game with an avatar, authentication, NPCs or quests.


## Side-by-side Android playtests (9 November 2026)

An operator's Galaxy A55 displayed **Google Play Protect: unknown developer**, then Android's **Update this app?**, then **Something went wrong. App not installed** for an earlier debug APK. Those are distinct events. The second is consistent with Android rejecting a different debug signing certificate or attempted version downgrade for the *same package*, not evidence that the 377 game itself failed.

**Fix:** every GitHub CI debug APK now uses a unique application ID `au.com.parristech.joshrs.android.playtest<GITHUB_RUN_ID>` and Android launcher label **JoshRS Kotlin Playtest**. Therefore it installs alongside any old `au.com.parristech.joshrs.android` preview and **cannot replace/delete its imported saves/cache**. CI checks the built APK package ID with `aapt` and uploads its SHA256SUMS alongside it. Locally built debug versions use `.playtestlocal`. Future CI builds have distinct IDs because GitHub generates independent debug signing certificates; these development builds may accumulate separate app icons, which can be individually uninstalled after confirming their *own* local data is not needed.

The Google Play Protect warning may still appear for an unknown independently signed build. Never disable Play Protect globally. Only proceed with the on-screen install override if you have independently confirmed the download came from this project's successful official GitHub Actions build and are comfortable running an unreviewed test build. Do not install an unexpected APK from a third-party source.

**This preserves existing app data but does not migrate it.** To inspect *real* Lumbridge on the side-by-side app, import your own `main_file_cache.dat`, `idx0` and `idx4` again; the old prototype's Android-private cache is deliberately inaccessible to the new app. No authentic avatar login/quests yet.


## Authentic Lumbridge map decoding (9 November 2026)

**Status: real private-cache terrain and object-position viewer, NOT yet a playable world.**

This stage independently implements the revision-377 layout described by the
original 377 Java client: Jagfile/OnDemand map_index, GZIP map land files,
World.method31 tile opcodes, packed loc-ID/position deltas, and the original flo.dat RGB/texture-ID definitions from config Jagfile #2.

- On Fedora, run a read-only cache check: bash tools/android377-phone/copy-private-lumbridge-cache.sh --check.
  Once your phone is connected over USB and adb is authorised, use --copy to
  put only these three cache files under Android Downloads/JoshRS377Cache.
  The export deliberately excludes uid.dat, player saves and account files.
  Downloads is a shared location until the app imports its own private copy.
- Select YOUR matching **main_file_cache.dat + idx0 + idx4** files together in
  Android's private cache importer. This produces an atomic private snapshot.
  It never downloads or ships a Jagex game cache or copied models.
- Tap **Explore REAL Lumbridge terrain (region 50,50)**. The app reads the
  actual 377 versionlist (#5 in idx0), resolves the two region 50,50 file IDs,
  decompresses the land and location archives in idx4, and decodes real
  four-plane 64x64 tile heights, overlay/underlay IDs, flags, location types,
  orientations and world coordinates. Where the original config cache exists,
  base floor RGB values also come from its real flo.dat definitions.
- Touch drag and pinch zoom inspect the decoded region. The coloured ground
  uses **original floor RGB** where cached, or a visibly labelled fallback
  tint otherwise. Texture images, lighting and shading remain incomplete. Dots mark actual object positions, not 3D models or
  collision. The orange 3233,3218 marker is a coordinate, **not an avatar**.
- Missing/corrupt cache data causes an explicit failure, never a silently
  invented Lumbridge. No account logs in or changes a server/saved character.
- Apache Commons Compress **1.28.0** (Apache-2.0 licensed) provides
  headerless classic BZip2 support, avoiding reimplementing a decompressor.
  Kotlin tests generate all map data themselves; no original game assets
  are committed.

**Next:** genuine floor texture/colour and 3D location model binding,
camera/occlusion, animations, NPCs/player, RSA/ISAAC authenticated game
session and gameplay/quest packets. The full one-APK offline game and
Galaxy A55 playthrough remain unverified.

### Existing open-source clients

Meteor MP's **377** branch has a Kotlin/Android frontend, but its checked
repository root does not provide a LICENSE and its GitHub licence is
unspecified. Do not vendor/copy it until its per-module source rights and
compatibility are verified. The LostCity 377 Java client is the correct
protocol and map reference, but is an AWT desktop client, not an Android
library. Modern BSD-2-Clause RuneLite targets a different OSRS revision;
it is not a rev377 drop-in replacement. The permissive LostCity server
engine licence does not automatically cover the client or Jagex artwork.

**Verification:** synthetic unit tests exercise idx0 versionlist Jagfile
(whole archive and individual entry BZip2 modes), map_index, four planes,
height/attributes, location ID/coordinate deltas and negative cases. The
Android build and emulator tests are CI-level acceptance only: NO real
private Lumbridge cache or live phone gameplay has yet been observed.



## 9 November 2026 — real model geometry and emulator integration

- `Model377Codec.kt` independently reads the authentic classic 18-byte model footer, signed-smart delta vertices, triangle strips (1..4), and on-demand GZIP model archives. Invalid sizes, offsets, indices and excessive decompression are rejected.
- A new privately imported `main_file_cache.idx1` pair can supply **real** model geometry. `Model377Viewer.kt` gives a perspective, draggable, untextured 3D mesh inspector (not the historical full renderer).
- Android instrumentation runs on a genuine Android emulator and negotiates with a **real pinned revision-377 server** over `adb reverse`. It tests the app's actual response instead of a fake success page.
- A separate genuine Windows GitHub runner compiles the same pinned 377 engine and tests the raw 17-byte login negotiation. These are two isolated runners, **not** an end-to-end direct Android-to-Windows network session.
- The emulator drawing test uses a tiny original synthetic triangle solely to verify the graphics code. No upstream game cache/model is included in the APK.
- Authenticated game login, full terrain/models/textures/animations, inventory/quests/combat visible in the client, one-APK embedded engine, and real phone play remain **OPEN**. Do not describe this as the finished JoshRS 377 Android app.


## 9 November — private LAN and tailnet diagnostic (no account login)

The **existing** Kotlin app can now send the real revision-377 **two-byte, credential-free negotiation** to a numeric, explicitly private IPv4 address. Open the app, find **Private LAN / Windows host**, enter the CURRENT Windows host IPv4 (for example `192.168.1.20`), then tap **Test private LAN revision-377 negotiation**.

- Supported: `127.0.0.1` for a phone-local Termux server or CI `adb reverse`, RFC1918 home LAN, and `100.64.0.0/10` tailnet addresses. Public IPs, hostnames, malformed and ambiguous addresses are rejected **before** opening a socket; there is no DNS lookup or credential transmission.
- This requires the existing server to be listening on the chosen private address and reachable over Wi-Fi/tailnet. **The app never changes server binding, Windows Firewall, router ports or account data.** If the existing server listens only on loopback, the LAN test will (correctly) fail. Do not modify the live family server merely to satisfy this diagnostic.
- The reply is a 17-byte revision-377 negotiation, not an authenticated login or a working game client. Successful negotiation gives no access to inventory, NPCs, quests, camera, saves or multiplayer.
- The prior `Test real 377 login negotiation` button still checks `127.0.0.1` on the phone, preserving the emulator/phone-local path. Unit tests cover numeric-address allow/deny rules and an actual disposable TCP handshake.
- **No change to JoshRS 377 production saves or server code.** Verify Wi-Fi reachability only against an explicitly approved, disposable listener or an already-authorised host.

The earlier RSBox + Meteor monorepo proposal is **reference research**, not the implementation here. RSBox targets a different server/revision and Meteor is desktop-oriented; neither gives us a plug-and-play Kotlin Android renderer for the existing personalised revision-377 world. The same applies to OpenOSRS-mobile, which requires a separate client APK and is not an independently licensed drop-in revision-377 renderer. Reuse third-party source only after checking its exact commit, licence, Android compatibility and packet/cache revision.

## Stage 2 foundation (8 November 2026) — REAL 377 data, still no playable client

The new phone-local integration work adds `Save377` (real save CRC, skills and private copy vault), `Negotiation377` (actual 377 login negotiation over loopback, no password), `LegacyStore377` (authentic read-only 520-byte legacy disk-cache sectors) and optional private import of your own `main_file_cache.dat` + `.idx0` files. It never commits or distributes a game cache. The `tools/android377-phone/install-phone-server.sh` script attempts a full pinned 377 engine build on a *new* isolated Termux Debian installation and restricts listener bindings to loopback.

**The 3D model/terrain decoder, real rendering, authenticated session, gameplay packets, and one-APK local engine are still missing.** A successful compile or archive import is not a game playthrough. See [Android phone-local engine status and acceptance gates](../tools/android377-phone/README.md).


This is a separate Android Studio project for a native Android client. It is an **original, offline-only game window prototype**; it is NOT connected to the JoshRS revision-377 server, does not use a RuneScape cache, and never reads, modifies or migrates Elrothiro/Sylvie saves.

## Stage 1b — visual revision (1 November 2026)

The first APK looked nothing like the classic reference because it was an abstract green-grid input harness. This revision replaces the grid with a new original isometric terrain scene, low-poly houses/trees/rocks, an NPC and a player figure. It adds a circular minimap, stone-and-parchment chat frame, functional inventory/skills/quests/map **preview tabs**, and an on-screen D-pad. World taps use the inverse isometric projection for movement.

**This is still NOT the real 377 game.** It is an original visual test scene, not Gielinor. The 377 game cache, 3D models, packet protocol, character data, quests, chat, inventory, authentication and server connection are not implemented. Never mistake mock panels for real game state. The next real technical milestone is adapting the compatible Java 377 client software renderer and cache on Android, then proving a disposable account connects safely to the correct server.

GitHub Actions generates a new development signing certificate for each build. If Android says the updated APK cannot install over the old preview, uninstall the previous **offline-only** JoshRS preview first and then install this APK. The preview has no persisted live data or account to lose.

## Built in this stage

- Native Kotlin Android Activity and a SurfaceView with a dedicated ~30 fps renderer.
- Original isometric visual scene, visible low-poly player, and tap-to-walk destination indicator.
- On-screen directional pad with held-button input and hardware WASD/arrow keys.
- Smooth movement, world bounds, frame-delta limits, touch pointer handling, rotation position restore and lifecycle-safe render thread.
- Deterministic pure Kotlin movement unit tests; no game credentials, networking or server ports.
- GitHub Actions debug APK build and test workflow.

## Open and build

1. Open the android-client directory as a project in Android Studio.
2. Use JDK 17, Android SDK 35 and Gradle 8.11.1. Let Android Studio sync the Gradle project.
3. Select the app run configuration and an Android emulator or your Galaxy A55 (Android 8+).
4. Build the debug APK with Gradle command: gradle :app:assembleDebug (from android-client).
5. Run unit tests with: gradle :app:testDebugUnitTest.
6. The CI workflow uploads app-debug.apk as a GitHub Actions build artifact.

No paid Android tooling or emulator is required to obtain the CI APK. This foundation uses native platform libraries and JUnit only. A Gradle wrapper will be added separately; Android Studio can use a configured local Gradle 8.11.1, and CI installs that pinned version.

## Deliberately not implemented

- Real 377 cache loading, models, maps or rendering.
- Server connection to JParrisDesktop, authentication or ISAAC game packets.
- Inventory, chat, combat, persistence, background gameplay or independent multiplayer.
- APK signing for release, public distribution or copying upstream Jagex assets.

## Architecture for stage 2

Keep game logic and game protocol out of the Android window: PreviewWorld currently has no Android imports, while GameSurfaceView handles frame drawing and input. Replace PreviewWorld with a validated 377 game state model and adapt a rights-cleared client renderer; only after protocol tests should a separately configured, private LAN socket be introduced.

Never hard-code a server address, expose raw TCP ports to the public internet, or use this prototype as evidence that a real account can log in.

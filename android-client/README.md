# JoshRS Android — Kotlin foundation (stage 1)

## 9 November 2026 — real model geometry and emulator integration

- `Model377Codec.kt` independently reads the authentic classic 18-byte model footer, signed-smart delta vertices, triangle strips (1..4), and on-demand GZIP model archives. Invalid sizes, offsets, indices and excessive decompression are rejected.
- A new privately imported `main_file_cache.idx1` pair can supply **real** model geometry. `Model377Viewer.kt` gives a perspective, draggable, untextured 3D mesh inspector (not the historical full renderer).
- Android instrumentation runs on a genuine Android emulator and negotiates with a **real pinned revision-377 server** over `adb reverse`. It tests the app's actual response instead of a fake success page.
- A separate genuine Windows GitHub runner compiles the same pinned 377 engine and tests the raw 17-byte login negotiation. These are two isolated runners, **not** an end-to-end direct Android-to-Windows network session.
- The emulator drawing test uses a tiny original synthetic triangle solely to verify the graphics code. No upstream game cache/model is included in the APK.
- Authenticated game login, full terrain/models/textures/animations, inventory/quests/combat visible in the client, one-APK embedded engine, and real phone play remain **OPEN**. Do not describe this as the finished JoshRS 377 Android app.


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

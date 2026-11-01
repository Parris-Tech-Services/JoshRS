# JoshRS Android — Kotlin foundation (stage 1)

This is a separate Android Studio project for a native Android client. It is an **original, offline-only game window prototype**; it is NOT connected to the JoshRS revision-377 server, does not use a RuneScape cache, and never reads, modifies or migrates Elrothiro/Sylvie saves.

## Built in this stage

- Native Kotlin Android Activity and a SurfaceView with a dedicated ~30 fps renderer.
- Original tiled preview, visible player, and tap-to-walk destination indicator.
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

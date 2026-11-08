# JoshRS 377 on Android: phone-local server foundation (8 Nov 2026)

## Status: PARTIALLY COMPLETE — not a playable native 377 app yet

The existing `android-client/` Kotlin project now has:

- A real, **credential-free** revision-377 login negotiation probe for localhost TCP 52402 (opcode 14 + server index, 17-byte response). It does **not** send usernames/passwords or log in.
- A private 377 `.sav` verifier and copy vault using the pinned engine's magic `0x2004`, version `2..7`, 21 skill values, trailing CRC-32 and SHA-256. This does **not** load the save into the world or create a login account.
- An optional original visual preview, now clearly separated from the actual 377 engine diagnostics.
- An isolated script to **attempt** an actual pinned revision-377 server build on Android in Termux Debian. It does not change the JParris Desktop installation.

The phone-local 377 engine is the *actual Engine-TS* and the 32-patch overlay with 24 bundles. Once built it contains the real server-side combat/inventory/quests from those source trees. This is not proof every quest is complete or that an Android client can render/play any of it.

## Phone setup: experimental isolated engine install

Needs a current 64-bit Android device, sufficient available storage, Termux from F-Droid, and an initial Internet connection for packages and source clones. Free disk/RAM requirements have **not** been measured on the Galaxy A55. Full build on ARM64 and user login are **not yet device-verified**.

1. Open Termux. Run `pkg update && pkg upgrade`, then `pkg install proot-distro`. Run `proot-distro install debian` once.
2. Enter Debian: `proot-distro login debian`. From this point on, stay at the Debian shell.
3. Install `git`, `python3`, `ca-certificates`, `curl`, `build-essential` and Node.js **24** (not Node 22), following trusted Debian/NodeSource instructions. Check `node --version` starts with `v24.`.
4. Clone your public JoshRS source into a **separate** new folder:
   ```sh
   git clone https://github.com/Parris-Tech-Services/JoshRS.git ~/JoshRS-phone-source
   cd ~/JoshRS-phone-source
   ```
5. Select the merged version of the Android integration branch when available. Until merged, use `git fetch origin feat/android377-phone-local-20261108 && git switch feat/android377-phone-local-20261108`.
6. Run `bash tools/android377-phone/install-phone-server.sh` **once**. It refuses to overwrite an existing installation. This fetches pinned Engine-TS and Content into a fresh private directory, applies 32 patches and 24 quest bundles, runs source checks, builds the RuneScript pack, and prepares a fresh SQLite database.
7. If it prints `INSTALLED_ENGINE_ONLY`, run `bash ~/joshrs377-phone/start-local.sh`. Stop with Ctrl+C after logging out. Do not copy or replace family saves or an existing server database.
8. The Kotlin app's `Check actual phone-local server` and `Test real 377 login negotiation` buttons check `127.0.0.1:52402`, with a separate `8888` port probe. A green negotiation check **does not** prove account authentication or render the world.

The installer patches **six listener configurations** to bind exclusively to 127.0.0.1: game, web, management, login, friend and logger. It checks the exact pinned source patterns and refuses any drift. Never open or forward the game's raw ports to the Internet.

### Why this does not give a one-tap playable APK yet

**No licensed and protocol-compatible 377 Android renderer** is integrated. Existing Java 377 clients use desktop Java/AWT and game caches that are not portable by merely changing the Activity. The Kotlin prototype does not yet decode the original `.dat`/index model, terrain, texture, NPC, animation or UI data. It cannot yet decode the authenticated ISAAC/RSA game packets or display real inventory, combat or quests.

The `zeruth/meteor-mp` repository has a `377` branch with an Android module, but the checked root does **not** contain an explicit licence file. Do not paste or vendor its client source/cache into public JoshRS until rights are independently established. Likewise, do not publish upstream Jagex-owned cache, art, music, or scripts in an APK without permission.

### Exact next acceptance gates

1. **Phone engine**: `npm ci` and strict revision-377 content compile pass on an actual Galaxy A55. Confirm six loopback-only listeners and nonempty compiled `script.dat`/`script.idx`; shut down and restart without data loss.
2. **Renderer**: rights-approved cache loader and performant OpenGL ES/software 3D adaptation showing *the actual* 377 Lumbridge map, player and NPC IDs with animations. No substituted visual mock.
3. **Protocol**: end-to-end verified rev-377 client login using a disposable account: version, CRCs, RSA, ISAAC, packet opcodes, map loading, movement, chat and logout. Account DB and real saves remain server-owned.
4. **Gameplay**: actual 377 inventory, equipment, NPC dialogue, skills, combat and 12 selected quests tested with server-owned game state and actual stages, rewards and relogin persistence.
5. **Storage**: import a backed-up existing character into a separate test server only after associated account DB/credentials and save compatibility are verified; never auto-overwrite Elrothiro or Sylvie.
6. **One-APK release**: package a licensed engine/cache/renderer, provide proper Android lifecycle and background-process management, save backups, battery/network handling and one-tap offline launch. Verify performance, thermal behaviour, phone rotations, reconnects and full quest playthroughs.

No phone build, end-to-end authenticated session or in-game quest completion has been independently observed in this task. The first true success milestone remains **a local engine running on Android plus an authenticated player in a compatible client**.

## Build/test the native foundation

From the `android-client` directory with JDK 17, Android SDK 35, Gradle 8.11.1:

```sh
gradle --no-daemon :app:testDebugUnitTest :app:assembleDebug
```

The workflow `.github/workflows/android-foundation.yml` runs the same tests and uploads a debug APK. The app's private save copies are Android-app data, not the phone server's `data/players`; uninstalling the APK may remove them. Keep original offline backups separately.

**Source pins used for the new phone-local install:**
- [LostCityRS/Engine-TS revision-377](https://github.com/LostCityRS/Engine-TS/tree/b5ac859b47915afb545e60e4c1208f25d43cb3fb)
- [LostCityRS/Content revision-377](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50)
- [Current JoshRS patch chain](../../content-patches/rs377/) (32 patches; check main for subsequent changes)

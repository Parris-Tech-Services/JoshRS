# Play the real JoshRS 377 on Android now

This method streams your **existing Windows Java client** to Android using free [Sunshine](https://github.com/LizardByte/Sunshine/releases) and [Moonlight](https://play.google.com/store/apps/details?id=com.limelight). You play the same revision-377 world, with your existing accounts and saved progress on your Windows computer. **It does not make the unfinished Kotlin preview a game client.**

## Windows PC — one-time setup

1. Open your already-installed JoshRS launcher folder (e.g. `C:\JoshRS-Launcher\JoshRS-main`). Do **not** install a fresh JoshRS world or restore a new snapshot.
2. Double-click `jparris-play.cmd` and confirm your *normal* character and world work on this PC. Leave JoshRS running.
3. Double-click `JoshRS-Play-Android.cmd` from the **same** launcher folder. It runs a read-only check of your configured 377 world, saved Elrothiro character and login database. If this fails, stop: streaming a different installation would not give you your expected progress. The script does not delete or replace your save.
4. Answer **Y** to install free Sunshine using Windows Package Manager if needed. Confirm the Windows installer permission request. If installation fails, download the official Windows MSI from [Sunshine releases](https://github.com/LizardByte/Sunshine/releases).
5. On the **Windows PC**, open [https://localhost:47990](https://localhost:47990), create a Sunshine username and a strong, unique password. A browser warning for Sunshine's *local self-signed HTTPS certificate* is expected; check the URL before proceeding.
6. Leave the PC signed in with JoshRS running. Sunshine normally exposes **Desktop** in Moonlight. If absent, use Sunshine's **Applications** configuration to add the Desktop stream.

## Android — pair and play

1. Connect your phone to the same private Wi-Fi/network as your Windows PC. Prefer 5 GHz Wi-Fi.
2. Install [Moonlight Game Streaming from Google Play](https://play.google.com/store/apps/details?id=com.limelight).
3. Open Moonlight, select your Windows PC. If it is missing, add the computer using its **local IPv4 address** shown by `ipconfig` on the PC. **Do not use** 127.0.0.1 or the public internet IP.
4. Moonlight displays a pairing PIN. On your **Windows PC**, visit Sunshine's **PIN** page at [https://localhost:47990](https://localhost:47990), enter the Moonlight PIN and confirm.
5. Back on your phone, choose **Desktop** and open the running JoshRS Java client. Rotate to landscape.

## Controls and troubleshooting

- One-finger tap: left-click. Swipe: move mouse. Hold one finger and tap with a second: right-click. Tap-and-hold then drag: mouse drag. Use Moonlight's keyboard control for chat/passwords; a Bluetooth mouse is useful for classic menus.
- Start at 720p, 30 fps and raise quality once the connection is stable. A wired PC and phone on 5 GHz Wi-Fi are recommended.
- If Moonlight cannot see the PC, ensure Sunshine is running, Windows firewall allows private LAN access, and the devices aren't on isolated guest Wi-Fi. Use the local IPv4 address.
- If the stream is black, ensure Windows remains signed in with a working display and try updating GPU drivers. Sunshine needs a capturable desktop.
- If clicks miss, use Moonlight's touchpad/pointer mode or pair a Bluetooth mouse.
- If the game login fails on mobile, test *the same login locally on Windows*. Streaming only conveys screen and input; it cannot repair the game's login server.
- To preserve your character session, log out within JoshRS before ending the stream. Ending Moonlight alone does **not** necessarily log out the character.
- **No port forwarding:** do not expose Sunshine's web UI or streaming ports publicly. Remote play away from home requires a separately configured private VPN (e.g. Tailscale).

## Native Kotlin Android status

The repository's `android-client/` project is a Kotlin **offline visual prototype**, not a 377 client; the renderer, cache, gameplay packets, auth and real player state aren't integrated. The [Meteor MP 377 branch](https://github.com/zeruth/meteor-mp/tree/377) has Kotlin Android client architecture, but the inspected repository lacks an explicit root licence; do not copy its code or embedded game assets without establishing rights. Modern RuneLite Android targets a different game revision.

**Verification boundary:** GitHub checks only verify the source changes. Neither the Windows host installation nor a paired Android real-player test can be verified without accessing the user's physical devices. Do not report gameplay as fully verified until JoshRS is played through Moonlight on the phone.

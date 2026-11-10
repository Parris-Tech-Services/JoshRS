# Android-only RS-SDK — isolated Termux/Debian experiment

**Status: source installer prepared and offline safety-tested. NOT phone-installed or game-verified.**

This uses **only the phone**, with 64-bit Android, Termux (F-Droid), Debian PRoot, initial internet, RAM and free storage. It installs official Bun Linux ARM64 and a **separate** [RS-SDK](https://github.com/MaxBittker/rs-sdk) checkout.

**Important:** RS-SDK's upstream game currently defaults to revision 289 with custom mechanics. It is not your native Termux rev274 game, rev377 experiment or Kotlin client. It does not import your characters, patches, quests or bots automatically.

Your existing phone environments:

- ~/lc274 — **live rev274 world** (historically port 8888); must remain intact.
- ~/dev274 — quest-development sandbox; must not change.
- ~/js377 — experimental rev377; contains valuable saves.

This experiment lives at **Debian's separate** ~/rs-sdk-android-only. It uses alternate ports **18988** (HTTP), **14594** (game), **17780** (gateway), **18998** (management), **18889** (hiscores), and patches enabled listeners to 127.0.0.1 only. It refuses unexpected directories, occupied ports and upstream listener changes, and never kills another server or migrates saves. See [START_HERE.md](../../START_HERE.md).

## Install on Android

Open native Termux. If Debian is **not** installed:

~~~sh
pkg update && pkg install proot-distro curl -y
proot-distro install debian
~~~

If Debian already exists, skip installation. Enter it:

~~~sh
proot-distro login debian
~~~

Inside Debian, fetch and inspect the reviewed script:

~~~sh
curl -fsSLo ~/rs-sdk-phone.sh https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/tools/android-rs-sdk/phone.sh
less ~/rs-sdk-phone.sh
bash ~/rs-sdk-phone.sh install
bash ~/rs-sdk-phone.sh doctor
bash ~/rs-sdk-phone.sh build
~~~

The installer records an exact upstream commit SHA and uses checked-in Bun lockfiles. Installation/build **do not start another game server**. See all commands with bash ~/rs-sdk-phone.sh help.

## Start the independent game and bot

Create 3 separate Termux sessions, enter Debian using proot-distro login debian in each, then:

~~~sh
bash ~/rs-sdk-phone.sh engine   # session 1
bash ~/rs-sdk-phone.sh web      # session 2
bash ~/rs-sdk-phone.sh gateway  # session 3
~~~

Once the game server reports ready, open **http://127.0.0.1:18988/rs2.cgi** in Chrome. Do not confuse this with your live game on 8888.

In a separate Debian session:

~~~sh
bash ~/rs-sdk-phone.sh create-bot phonebot
~~~

The bot gets separate local credentials, SERVER=localhost:18988, GATEWAY_URL=ws://127.0.0.1:17780, and SHOW_CHAT=false. Start two more Debian sessions:

~~~sh
bash ~/rs-sdk-phone.sh client phonebot
bash ~/rs-sdk-phone.sh bot phonebot
~~~

The headless client must attach to the gateway for the script to work. Verify actual game login, actions, resulting inventory/position changes and logout/relogin. Successful download/build/HTTP response **does not** prove game or bot playability.

Five processes are resource-intensive on a phone. Android can suspend Termux; keep it active and stop foreground components individually with Ctrl+C. A Termux wake-lock may help but does not guarantee uninterrupted sessions.

## Troubleshooting and boundaries

- BLOCKED: Debian — enter Debian, not native Termux.
- Bun cannot run — Linux ARM64 Bun may fail under Android PRoot; stop safely.
- Port occupied — the script refuses to stop another world. Never force-kill it.
- Upstream changed listener — its source changed and the security patch refuses to guess.
- No game client is attached — ensure the headless client logged in and registered with the local gateway.
- Build, database or account registration failure — read the actual on-phone logs. Do not import a production database as a workaround.

**Not yet completed:** authenticated gameplay on a Galaxy A55, Android Kotlin 377, integration with the existing 274/377 worlds, bot quest tests or family save compatibility.

## Offline safety tests

~~~sh
bash -n tools/android-rs-sdk/phone.sh
python3 -m unittest discover -s tools/android-rs-sdk -p 'test_*.py' -v
~~~

Tests cover loopback patching, idempotence, upstream drift failure, symlink refusal and destructive-command guards. They **cannot** prove real Android runtime functionality.

References: [RS-SDK](https://github.com/MaxBittker/rs-sdk/blob/main/README.md), [Bun](https://bun.com/docs/installation), [Termux PRoot-Distro](https://github.com/termux/proot-distro), [Android Lost City guide, 30 Sep 2026](https://lostcity.rs/t/how-to-setup-local-server-on-android-mobile-device/19205).

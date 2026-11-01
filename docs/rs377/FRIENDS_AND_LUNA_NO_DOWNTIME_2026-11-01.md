# JoshRS friends + Luna — no-disconnect repair gate (1 November 2026)

**State: diagnosis / review-only; NOT live-fixed.** Player A and Player B are both logged in. This work must not restart their server, stop either client, open saves/SQLite or change the live engine environment.

## Pinned source findings

Source baseline: LostCityRS/Engine-TS at b5ac859b47915afb545e60e4c1208f25d43cb3fb.

- src/util/Environment.ts: FRIEND_SERVER=false, EASY_STARTUP=false by default; FRIEND_PORT=45099.
- src/server/friend/FriendThread.ts: when FRIEND_SERVER is false, it discards player registration, friends-list changes, privacy updates, and outgoing private messages.
- src/app.ts starts the separate FriendsServer worker only with EASY_STARTUP=true; src/friend.ts supplies an alternate separately managed entrypoint. Do not launch duplicates.
- src/engine/entity/Player.ts sends a Friends List loaded packet even if Friends service is disabled, so client UI can display entries without live presence.
- src/server/friend/FriendServerRepository.ts decides visibility using logged-in world, private chat ON/FRIENDS/OFF, reciprocal friends lists and ignored users.
- src/server/friend/FriendServer.ts and src/engine/World.ts implement real player friend status and private-message routing when enabled.
- JParris setup.ps1 sets FRIEND_SERVER=true and EASY_STARTUP=true in a new config but preserves an existing customised game environment.
- Luna is a server-side bot rather than a verified connected login. The normal friends server cannot be assumed to know her presence or route PMs to her companion controller.

These source facts establish *likely failure branches*, not which one is active on JParris Desktop. Seeing Player B physically in-game while her name is Offline proves the social status is wrong from Player A's perspective, not a specific root cause.

## Safe action during today's live session

1. Set **Private chat → On** in both Java clients. With Private chat → Friends, each character must add the other; check Ignore as well. Try normal add/remove/re-add for Player B. Do not run admin/console or SQL commands.
2. On JParris Desktop, use the new **read-only** checker from an up-to-date, extracted JoshRS checkout, without replacing runtime files:

    node "C:\JoshRS-Launcher\JoshRS-main\tools\rs377-social\check-social-readiness.mjs" "C:\JoshRS-Launcher\JoshRS-main"

   The checker reads active.json to locate the selected engine, then whitelists only FRIEND_SERVER, EASY_STARTUP and TCP ports from the engine's .env. It probes 127.0.0.1. **It never reads DB_PASS, saves, account rows, chat contents, or any other environment keys; it writes nothing.**
3. Interpret results cautiously:
   - friend-server-disabled-in-env-file: configuration likely prevents social backend; changing .env cannot automatically affect the current process. Defer a repair to a coordinated later session.
   - friend-listener-missing: FRIEND_SERVER=true, EASY_STARTUP=true in saved config but Friends listener absent; Agent 3 investigate worker startup and errors privately.
   - friend-service-requires-separate-startup: FRIEND_SERVER=true but no listener and EASY_STARTUP=false; confirm which managed service is authoritative before starting anything.
   - friend-listener-present-presence-not-yet-verified: Agent 1 check player registration, profile matching, chat privacy, reciprocal friendship and update packets; the TCP listener alone proves nothing.
   
**Important:** This only reads the saved .env, not the environment already loaded into the running Node process. Never treat a result as proof of live startup flags.

## Work to finish later, with an approved safe deployment window

**Agent 1 — genuine player social:** Trace world-to-Friends worker registration and FriendServer repository visibility. Prove Player B/Player A show Online both directions, Private Chat ON/FRIENDS/OFF, ignore, add/remove, PM send/receive, logout/relogin and persistence against the correct NODE_PROFILE and database. Do not fake client-side Online by injecting one packet.

**Agent 2 — Luna social bot:** Provide synthetic or virtual presence for the existing companion without introducing a second game login, and route messages addressed to Luna through the companion controller. Return authentic private-message packets to the calling authorised player. Add visibility, consent, privacy and rate limits; never impersonate a human player or leak chat to third-party services. Coordinate shared changes to World.ts/Player.ts/FriendServer.ts with Agent 1.

**Agent 3 — runtime and persistence:** Only after players voluntarily finish, back up saves and matching SQLite, verify active engine .env and Friends service startup model, perform safe staged server integration with a rollback, and test both real Java clients. A code merge does not prove runtime success. No unauthorised server restart.

No 377 client, map, save or game server has been modified by this contribution. Tests: node --test tools/rs377-social/check-social-readiness.test.mjs; the checker itself has no runtime write operation.

## Confirmed JParris Desktop diagnosis — 1 November 2026

Elrothiro supplied real diagnostic JSON:

- `friend_server_configured=false`, `easy_startup_configured=false`
- `game_listener=true`, `web_listener=true`, `friend_listener=false`
- Expected friend port 45099
- RuneScape private chat was visibly On, but the entire friends list was blank.

**This confirms saved startup configuration is disabling the Friends service and its listener is not running.** It does not yet prove which process environment the live Node server inherited, or that former friendships persist in the database. With disabled FriendThread, add/remove friend events may not have been persisted. The source-level Friends implementation uses the account database `friendlist` table scoped to `NODE_PROFILE`. Restarting alone cannot restore relationships which were never saved.

A no-disconnect, fail-closed **offline repair installer** is now supplied:

- `JoshRS-Fix-Friends.cmd` + `deploy/jparris-windows/fix-disabled-friends.ps1`
- Do **not run -Apply while any game, login, logger or friend listener is active**. The installer refuses to write and never disconnects anyone.
- It verifies the selected personalised USB engine, expected embedded `friend.ts` startup, `LOGIN_SERVER=true`, `LOGGER_SERVER=true`, SQLite if specified, unique startup flags and correctly formatted ports.
- It creates a byte-exact private copy of the original `.env` inside `runtime/jparris-377/friends-config-backups/`, then changes **only** `FRIEND_SERVER=false` and `EASY_STARTUP=false` to `true`. It never prints passwords, overwrites `active.json`, SQLite, player saves, Java client or gameplay scripts; it never stops or starts the server.
- Existing separately managed login/logger/custom startup arrangements are a **blocker for manual Agy review**, not a reason to force multiple services to bind the same ports.
- After both players voluntarily finish, stop the server gracefully and apply. Start JoshRS normally; run the same read-only checker again. Expect saved flags `true` and the friend listener present. That still doesn't prove social updates: check Sylvie's friend entry, add her again normally if needed, logout/login, and test both-way PM. Never reset or recreate characters.
- Luna needs virtual companion friend presence and PM routing. Fred and George are not verified active accounts and are covered by #55. Do not confuse these with normal persisted real-player friendships.

For read-only preflight, use `powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy\jparris-windows\fix-disabled-friends.ps1` (omit `-Apply`). Windows CI regression exercises safe offline replacement, backup, duplicate prevention and active-listener refusal; no CI workflow can prove a fix is live on the JParris Desktop.

### Installation into the existing launcher

From the updated GitHub main ZIP, copy **only** `JoshRS-Fix-Friends.cmd`, `deploy/jparris-windows/fix-disabled-friends.ps1` into `C:\JoshRS-Launcher\JoshRS-main` with existing subfolders preserved. Do not replace the runtime, client files or personalised `play.ps1`. Run after finishing playing, then verify before using normal friends again.


## Missing or non-literal Friends flags — follow-up repair (1 Nov 2026)

The first offline installer safely refused a real JParris Desktop configuration with
`Missing or unsupported FRIEND_SERVER value`. Its original parser required
an explicit literal `true` or `false`, but imported Fedora `.env` copies can
omit the optional key entirely; the native pinned Engine-TS defaults omitted
`FRIEND_SERVER` and `EASY_STARTUP` to false. It also did not handle quoted
Boolean values and comments. This is an **installer compatibility bug**, not
evidence of corrupted player accounts.

The updated `fix-disabled-friends.ps1` recognises safe missing, quoted and
alternative disabled Friends values, then writes native lowercase `true`.
It also handles *absent* LOGIN_SERVER and LOGGER_SERVER as true when using the
self-contained EASY_STARTUP server; **explicitly false login/logger still
blocks automatically**, because the user may have an external service manager.
It still requires a private runtime, expected source, no active game/service
listeners, secure backup, and no changes to saves or database. Copy the
**newest version** of the script from main before retrying the shortcut
installer. Do not bypass a refused active-server or external-topology guard.

PowerShell 5.1 tests now cover real-world missing, quoted and commented flags,
failure on duplicate values, external managers, untouched saves, and guarded
offline startup. Even when the installer prints success, verify the next
real-world game startup via the original read-only social checker and in-game
Sylvie friend/PM tests. Luna and Fred/George online statuses still require
separate companion/agent integration.

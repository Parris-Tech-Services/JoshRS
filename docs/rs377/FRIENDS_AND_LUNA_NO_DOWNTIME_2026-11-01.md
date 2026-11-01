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

# RS-SDK fleet continuity checkpoint — 2026-11-02

**Purpose:** record the on-machine operator's latest observed state before leaving Fedora. **This is not a snapshot of local uncommitted Agy code.**

## Observed by user 16:58 AEDT

- Working game on Fedora: RS-SDK 2004Scape at `127.0.0.1:8888`, gateway at `127.0.0.1:7780`.
- User ran a local read-only fleet dashboard. **34 registered sessions, all 34 reported active**, including Jimmy, Bob and 32 `qb...` players; **4 SDK controller connections** and no observers.
- Controllers: Jimmy, Bob, `qb154433`, `qb162829`. Do not assume other `qb` clients have currently active SDK controllers. No assignment metadata loaded yet (`0 Jobs labelled`).
- Screenshot evidence supplied by Josh shows named `qb...` bots moving and some receiving in-game quest-complete messages, XP and item rewards. Do not promote screenshots alone to authoritative all-quest completion proof.
- Earlier snapshot had 24 active and 10 dead; most recent snapshot reported **34 active**. Values are point-in-time, not guaranteed after leaving.
- The local tracker [`fleet_dashboard.py`](../../tools/rs-sdk-fleet-dashboard/fleet_dashboard.py) and supporting files were generated in this chat and tested in a simulated Python environment. It has been demonstrated live by the user at `localhost:8790`.
- **Safety:** browser URLs in shared screenshots contain bot passwords, requiring future rotation. The repository is **public**, so no `bot.env`, private saves, credentials, service dumps, raw logs or full browser URLs should be committed.

## Uncommitted Fedora work cannot be saved by this GitHub connector

Agy's local `~/dev/JoshRS-source/rs-sdk` and `~/dev/JoshRS-publish` working trees are not available from the ChatGPT GitHub connection. Before shutdown, ask the local Agy session to preserve source with a new private backup branch or reviewed allowlisted commits, confirm a remote push and write down the commit SHA. Do not kill the live gateway or game.

Recommended safe sequence on Fedora:

1. Inspect `git -C ~/dev/JoshRS-source/rs-sdk status --short`, `git -C ~/dev/JoshRS-source/rs-sdk remote -v`, and the same for the JoshRS local worktree.
2. Create a timestamped **local backup archive** excluding all `bot.env`, secrets, cookies, saves, SQLite databases, log/output dumps, node_modules and `.git` directories.
3. Push **reviewed source-only files** to a new JoshRS feature branch. Do not push directly to upstream `MaxBittker/rs-sdk` or assume the local checkout's origin is JoshRS. Obtain and verify the pushed commit URL.
4. Verify remote has expected content; keep original working trees, running bot sessions and user/account data untouched.

## Next work

- Upload/commit the fleet dashboard source to a tracked source directory.
- Publish `bots/logs/fleet/assignments.json` with actual bot job ownership (without credentials or player chats).
- Record per-bot live state, action/quest proof and Agy runner/controller identity separately.
- Harden gateway loopback/auth and rotate bot credentials before unattended external access.

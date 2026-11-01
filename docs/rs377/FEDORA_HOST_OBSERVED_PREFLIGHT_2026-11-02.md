# Fedora host evidence — 2 November 2026 (AEDT)

**Origin:** Terminal transcript provided by the user from AVANCE-WS7, not remotely executed by ChatGPT/GitHub. The exact command timestamp was not captured; statuses are a snapshot rather than ongoing monitoring.

## Direct observations

| Gate | Fedora output | Interpretation |
|---|---|---|
| Host and OS | AVANCE-WS7, Fedora 44 KDE, linux | Real machine preflight captured |
| Tool versions | Node 26.5.0; npm 11.17.0; Git 2.56.0; Java 25.0.4.1; Gradle wrapper 9.2.0; Agy available | Tools installed |
| Source tools checkout | /home/josh/dev/JoshRS-tools; main; b665681e5917727eb0d903777cb5a063c37b3b95; tracked changes none | Repository readable, clean tracked state |
| Agy worktree | /home/josh/dev/JoshRS-rssdk-harness; agy/rs377-rssdk-fedora; 4d87f95f97fdc733907be944df0558dedc7622d5; tracked changes none | Worktree present; not execution |
| Game source root | /home/josh/dev/JoshRS is a directory, not a Git repository; /home/josh/lostcity377 is a symlink into it | Original failed Git command explained |
| Fedora top-level engine SHA | 1d25566cb53e7af1b1cb18ade8af996316c19614 | Source revision observed |
| Fedora top-level content SHA | 65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe | Source revision observed |
| Installed lostcity377 engine | short Git SHA 8901ddaa | Separate nested engine revision observed |
| Server processes | no node/java/gradle processes matched ps at observation time | No active game process observed |
| Game and test listeners | no listener on ports 52402, 8888, 8898, 45099, 43500, 43501, 53402, 8988 | No local running 377 world observed |
| Network | default interface eno1; no Tailscale interface detected | External host connectivity not tested |
| Local install files | lostcity377/start-server.sh, status-joshrs.sh, engine/package.json exist | Presence only; scripts not executed |
| Disposable manifest | isolated_manifest_verified_no_game_started; world isolated-e4ae1c84bf29; account HarnessTest; game 53402; web 8988; login 53500; friends 55099; logger 53501 | Manifest valid, **no engine or bot started** |

Source hashes for the allowlisted Fedora repository and game entrypoints were recorded in the user's transcript. No credentials, saves or player data are reproduced here.

## Pinned source mismatch to investigate

The Windows deployment manifest at deploy/jparris-windows/upstreams.json pins engine b5ac859b47915afb545e60e4c1208f25d43cb3fb and content 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50. These differ from observed Fedora top-level engine/content SHAs and the nested installed engine short SHA. This is **not evidence of a runtime incompatibility** because no Fedora server was running. Identify exact source paths and compatibility before any integration; do not reset or overwrite existing working trees.

## Evidence boundaries and next step

**VERIFIED:** user-supplied actual Fedora read-only preflight, source paths, worktree SHAs, local port/process snapshot, disposable manifest verification.

**NOT VERIFIED:** running Fedora game server; actual SDK adapter, authoritative world identity, genuine isolated bot login, live tick/state/action effects, player visibility, Friends, dialogue, item/XP changes or save/relogin; Windows JParris Desktop runtime (host currently inaccessible).

The game/test startup scripts have not been inspected for side effects. Inspect them and isolate engine/content/database/cache/ports before deciding to start a disposable world. Never run production launcher or restart family accounts merely for evidence collection.

[GitHub-only task 38 CI report](CHATGPT_TASK_38_CROSS_PLATFORM_TEST_GATES_2026-11-02.md)

## Follow-up host evidence — attached terminal output

The user subsequently provided further commands from actual AVANCE-WS7. This extends the initial preflight and does not replace the snapshot:

- The installed **nested** Engine-TS checkout has full Git SHA `8901ddaa7e83f366383002f4b7a7e8ef2af0a0f2`, is on `377-wip`, and reports **32 local commits ahead** of `origin/377-wip`; `--untracked-files=no` showed no tracked working-tree modifications.
- The nested installed Content checkout has Git SHA `9d636cf42280fb324c53f54e9fd79c3763a07b35`, is on `377-wip`, and reports **2 local commits ahead**; no tracked modifications were shown.
- Existing local `status-joshrs.sh` printed game 52402, web 8888 and management 8898 **not listening**, and no JoshRS server/client PID files. The script was run as a status probe, not a start request.
- A second disposable manifest at `/tmp/joshrs-377-disposable-1TOMTT/manifest.json` passed `--verify`, status `isolated_manifest_verified_no_game_started`, account HarnessTest, world `isolated-23c1a2cc1e0f`, with game 53402, web 8988, login 53500, Friends 55099, logger 53501. **No server started.** Two verified manifests are not two functioning worlds.
- The exact adapter path `tools/rs377-companion-contract/adapters/real377.mjs` was **absent** in the three tested worktrees (`JoshRS-tools`, `JoshRS-rssdk-harness` and the temporary `joshrs-test-L5aVBQ/JoshRS`). It was also reported absent in the separately checked `JoshRS-source` checkout. Thus the native bridge run remains BLOCKED in those locations; do not equate the existing SDK research checkout with a working adapter.
- `bash -n` passed for `start-server.sh` and `status-joshrs.sh`. **Syntax alone is not a safety or isolation audit.**
- Engine environment source exposes `NODE_PROFILE` as a separate save-folder profile, and defaults `DB_BACKEND` to sqlite, `NODE_PORT` to 43594, `WEB_PORT` to 8888 and `WEB_MANAGEMENT_PORT` to 8898. The installed singleworld Prisma schema contains a **fixed relative sqlite file** `file:../../db.sqlite` (relative to its Prisma schema location). **Ports plus profile do not independently isolate that database**; use physically separate engine/database copies before any test startup.
- The installed source includes `src/app.ts` binding and cache-packing logic and setup scripts. Startup side effects have not been reviewed from their complete bodies; no approval to start the existing instance or modify its saved profiles is implied.

**Updated verdict:** actual Fedora preflight and read-only source/storage reconnaissance are evidenced. Runtime startup, authenticated disposable bot, action-to-observed-effects, shared Elrothiro world and JParris Desktop Windows remain UNVERIFIED.

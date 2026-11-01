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

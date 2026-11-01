# Agy Fedora — numbered checklist to play alongside Elrothiro

**Date:** 2 November 2026 (AEDT). **Owner now:** Agy on AVANCE-WS7 Fedora; Claude Code/Codex can continue later. **Definition of done:** one fully controllable, persistent, no-cheat JoshRS player in the exact same authoritative world as Elrothiro, visible in the Java client, moving and interacting normally.

**Start:** [Fedora bootstrap](FEDORA44_AGY_RSSDK_SETUP_2026-11-02.md) · [RS-SDK Agy handoff](AGY_RS_SDK_LLM_HARNESS_2026-11-02.md) · [current harness and tests](../../tools/rs377-agent-harness/README.md) · [draft PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62) · [quest PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) · [issue #55](https://github.com/Parris-Tech-Services/JoshRS/issues/55).

**Critical:** Windows JParrisDesktop and Fedora AVANCE-WS7 may run different #377 worlds. Matching port 52402 does not prove a shared world. Confirm where Elrothiro actually plays. No unapproved production restart, firewall change, account data migration, password access or save edit.

**Evidence:** These are intentionally unchecked future tasks. The existing 10-test scaffold and GitHub Linux bootstrap already pass CI, but the physical Fedora machine and real RS-SDK-to-377 connection are not verified.

## P0 — Determine the real world and protect existing players
1. [ ] Confirm whether Elrothiro currently plays on JParrisDesktop Windows, AVANCE-WS7 Fedora, or another host. Record the actual authoritative world and configuration, not a guess from port 52402.
2. [ ] Prove the target world lets Elrothiro log in, walk, interact, save and relog; World ready and listening ports alone are not sufficient.
3. [ ] Identify the active gameplay, web/cache, login and Friends listeners, source SHAs and profile on the server where Elrothiro plays.
4. [ ] Record a redacted world fingerprint that both Elrothiro and the new bot will verify (world ID, source generation and current tick).
5. [ ] Check whether Sylvie, Luna, Fred, George or another AI worker is active; avoid duplicate logins and disconnections.
6. [ ] Inspect uncommitted changes and assigned Agy workers before editing shared Player or BotPlayer files.
7. [ ] Establish an authorised backup plus testable rollback for the target world account database and player saves, without uploading private data.
8. [ ] Determine if an additional normal bot can connect without restarting the world; require explicit approval for maintenance, firewall changes or account migrations.
9. [ ] Create one disposable independent bot account through normal registration; never reuse Elrothiro, Sylvie or Luna credentials or saves.

## P0 — Prepare Agy on Fedora with no game disruption
10. [ ] Run the already committed Fedora bootstrap from the existing JoshRS Git checkout, using a separate development worktree.
11. [ ] Confirm Fedora 44, available Agy CLI, Node, npm, Java and existing Gradle wrapper using the read-only doctor command.
12. [ ] Run all 10 harness offline regression tests on actual AVANCE-WS7 and record output; prior Ubuntu CI is not Fedora verification.
13. [ ] Verify the pinned upstream RS-SDK source checkout at commit db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb.
14. [ ] Verify the exact active 377 engine, content, Java client and local customisations; do not replace the working installation with upstream clean copies.
15. [ ] Assign separate unused ports and separate save/DB folders for a disposable isolated 377 integration world.
16. [ ] Confirm existing Fedora helper scripts and exact installed game directory without copying secrets or assuming Windows paths.
17. [ ] Write a simple repeatable bot-doctor/status entrypoint, with no sudo, service restart, package removal or production database access.
18. [ ] Record build/test command, source SHA and Agy next-step notes in a safe handoff ledger for later Claude Code.

## P0 — Bridge Fedora to Elrothiro's actual server securely
19. [ ] Draw the real deployment topology for Fedora controller, private network, authoritative game process, bot TCP session and SDK gateway.
20. [ ] Test private Tailscale/LAN connectivity to the right world host when it is not Fedora; do not publicly expose game or management endpoints.
21. [ ] Verify game TCP, HTTP cache CRC, login and Friends services separately; a TCP connection is not successful authentication.
22. [ ] Refactor the existing Fred/George family client to remove hardcoded 127.0.0.1, fixed production ports and assumption that engine files are local.
23. [ ] Replace the client reliance on local private.pem with a safe public RSA key source; never copy or expose the server private key.
24. [ ] Prove the normal rev377 ISAAC/RSA handshake using a disposable bot password stored outside Git and redacted from logs.
25. [ ] Implement explicit results for bad password, wrong world, stale CRC/cache, protocol mismatch, invalid save, duplicate login and timeout.
26. [ ] Implement bounded reconnect/backoff and a stop command; do not create duplicate bot sessions or an endless retry storm.
27. [ ] Use exact 377 client packet encoding/decoding, not unverified SDK/other-revision opcode assumptions.
28. [ ] Confirm bot and Elrothiro see the same authoritative world generation and character presence; a second isolated Fedora world does not count.

## P1 — Deliver a visible player before sophisticated AI
29. [ ] Create a fresh test character in an isolated rev377 world and prove ordinary login, character save and relog.
30. [ ] Build one real controlled player TCP client (or normal authoritative Player wrapper), not an in-memory fixture or a stationary NPC.
31. [ ] Read the bot's real world coordinates, plane, game tick and nearby entities from native observations.
32. [ ] Make the character visible to a second genuine Java client with correct name and animation.
33. [ ] Send a legitimate movement action and verify the server accepted it and the destination actually changed.
34. [ ] Verify the second client can see the bot walk and can follow it without a teleport shortcut.
35. [ ] Verify the bot is genuinely online/offline in the Friends List rather than a hardcoded World 1 status.
36. [ ] Add safe logout and relog restoring the same bot position, inventory and character identity.
37. [ ] After isolated proof and explicit permission, join Elrothiro's actual world without disconnecting existing players.
38. [ ] Capture timestamped in-client proof of both characters standing, moving and visible together; label this VISIBLE, not FULL AI.

## P1 — Turn the existing scaffold into a real RS-SDK bridge
39. [ ] Map pinned RS-SDK BotWorldState and BotAction to 377 player state and client packet handlers; document unsupported fields.
40. [ ] Implement read-only bot-only observations of 21 skills, raw XP, inventory, equipment, location, nearby NPCs/objects and dialogue.
41. [ ] Implement genuine permitted walk, NPC, object, item, ground-item and dialogue actions using the native 377 protocol.
42. [ ] Connect actual upstream RS-SDK BotSDK to the shim/gateway and show it consumes real 377 state, not the fixture transport.
43. [ ] Bind the gateway to loopback by default; require private authenticated access when it needs a remote connection.
44. [ ] Implement a single revocable controller lease per bot, preventing human-account takeover and concurrent AI control.
45. [ ] Never enable upstream unrestricted MCP execute_code on an unsandboxed work machine; expose only bounded observation and legal actions.
46. [ ] Distinguish dispatched from observed effect and completed objective; confirm position, inventory, XP or quest stage after real ticks.
47. [ ] Reject wrong world or account, stale state, nonstandard XP/tick, unapproved actions, action floods and uncertain duplicate item transfers.
48. [ ] Record redacted evidence with action ID, before/after tick, result category, timeout and exact game source version.

## P1 — Make the bot enjoyable to play alongside
49. [ ] Implement in-game follow, assist, solo and stop modes with safe switching and no forced world restart.
50. [ ] Let Elrothiro see and message the bot in public chat or PM, with a bounded reply and real Friends List status.
51. [ ] Treat in-game chat as untrusted, with no access to shell commands, credentials, admin controls or direct game-state mutation.
52. [ ] Give the bot one ordinary autonomous goal such as gather logs or buy a cake, rather than fixed four-point patrols.
53. [ ] Select genuine NPC dialogue options based on current visible interface state, then verify the result.
54. [ ] Acquire a tool legitimately, chop a tree, collect logs, earn actual 1x XP and bank resources without any item grant.
55. [ ] Detect blocked routes, missing tools, full inventory, level-up dialogue, NPC busy, reconnect and world restart.
56. [ ] Add safe combat later using normal equipment, eating, death and single/multicombat rules; no invulnerability or free teleport.
57. [ ] Test trading and two-step confirmation on disposable accounts; never silently offer or accept a player's valuables.
58. [ ] Persist goal, step, failure and last successful action separately from human accounts, and allow safe stop/recovery.
59. [ ] Keep the model at strategic decision boundaries and deterministic gameplay on the 600 ms server tick, not one paid API call every tick.

## P1 — Tests, evidence and handoff
60. [ ] Add real packet encoder/decoder, login error, account identity, world fingerprint and cancel/retry unit tests.
61. [ ] Run a disposable real-world integration suite covering walking, dialogue, gathering, inventory/XP changes and save/relog.
62. [ ] Verify the dedicated Fedora setup and SDK checkout physically on AVANCE-WS7, not just Ubuntu GitHub Actions.
63. [ ] Add safe bot-specific start, stop, status and doctor scripts that refuse unknown or unapproved production targets.
64. [ ] Measure CPU, memory and game tick stability with one bot active; a worker must never freeze the family world.
65. [ ] Prove Elrothiro and one bot simultaneously walking, chatting and gathering in the SAME actual server with two clients.
66. [ ] Verify logout/relog persistence and a test-world rollback, then confirm authorised production backup/recovery.
67. [ ] After the basic bot works, implement full no-grant Cook's Assistant and verify real quest state, normal 300 Cooking XP and relog.
68. [ ] Keep PR #62 in draft until genuine RS-SDK integration passes; record test outputs, current blockers and evidence in issue #55.
69. [ ] Provide Claude Code and Codex with exact Fedora worktree, source commit, startup commands, tested behaviour and next unfinished step.
70. [ ] Extend the proven system to Fred, George, Barry, Larry, Gary and Rory only once one companion is truly playable.
71. [ ] Mark VERIFIED COMPLETE only with real in-game and save evidence; otherwise PARTIALLY COMPLETE or BLOCKED.

## Milestone gates

1. M0 PROTECTED — real shared server identified, saves protected, existing players unaffected.
2. M1 FEDORA READY — local worktree, pinned SDK, tests and isolated 377 runtime working.
3. M2 VISIBLE — one genuine bot logs into Elrothiro's world, moves and appears in Friends List.
4. M3 PLAYABLE — follow, chat, NPC/object interactions, gathering, banking and 1x XP.
5. M4 INTELLIGENT — actual RS-SDK observes live game state and legally executes model-selected verified actions.
6. M5 PERSISTENT — stops, logs out, relogs, recovers, saves progression and runs a full no-cheat quest.

## Existing verified preparations — do not redo

1. [x] PR #62, pinned RS-SDK source research and an isolated Action377/Observation377 scaffold.
2. [x] Ten Node guard and mapping unit tests passed in GitHub Actions.
3. [x] Fedora bootstrap, read-only doctor, safe worktree test and handoff documents passed Linux CI.
4. [ ] Agy's actual Fedora execution, real 377 adapter and shared-world gameplay remain unverified.

**Total: 71 numbered unfinished tasks.** This is a detailed execution path overlapping the earlier AI backlog, not 71 unique new bugs. Each checked task needs reproducible source/test/observed-client evidence. Authorised maintenance and family-account changes require explicit consent.

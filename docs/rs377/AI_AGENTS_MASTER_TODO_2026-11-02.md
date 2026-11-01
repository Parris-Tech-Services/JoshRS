# JoshRS — AI agents master task list

> **Scope note (2 Nov 2026): This is the AI-agents domain checklist, NOT the entire JoshRS backlog.** The [project-wide consolidated backlog](../JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md) integrates open issues, 377 gameplay, native/Android clients, original Woodlands and the original classic MMO checklist. Keep this domain checklist linked, not mistaken for the whole project.

**Date:** 2026-11-02 (Australia/Sydney)  
**Repository:** [Parris-Tech-Services/JoshRS](https://github.com/Parris-Tech-Services/JoshRS)  
**Tracking:** [issue #55](https://github.com/Parris-Tech-Services/JoshRS/issues/55), [no-cheat test PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59)  
**Objective:** Create genuine, independent, persistent and rule-abiding revision-377 players **Luna, Fred, George, Barry, Larry, Gary and Rory** in the existing family world alongside Elrothiro and Sylvie.

## How to read this checklist

- `[x]` = research or source review already performed; **not** proof a live feature works.
- `[ ]` = incomplete or unverified. Never convert to `[x]` without linked evidence.
- `[G]` = executable from connected GitHub tools/repository work (research, source inspection, code/tests/docs, CI review, PR, merge after tests).
- `[D]` = needs live desktop/runtime access, authorised execution by Agy or an explicitly connected runner; ChatGPT GitHub access **does not** provide an interactive PowerShell session.
- `[G+D]` = repository work possible now, final proof needs live JoshRS 377 runtime/client.
- `[H]` = a human player must approve maintenance timing, check in-client behaviour, or confirm personal progress.
- **Do not use green GitHub checks on reporter scripts as proof the customised 377 engine or quests passed.**

## 1. Restore and protect the existing RuneScape server — HIGH PRIORITY

1. [ ] **[G+D]** Diagnose the absent game listener on TCP 52402 from the 1 Nov failure; trace cause and repair without overwriting account data.
2. [ ] **[G+D]** Restore Elrothiro login against the correct account database, without resetting the existing account.
3. [ ] **[D+H]** Verify Elrothiro's and Sylvie's character saves, inventories, banks and earned progress against dated backups.
4. [ ] **[G+D]** Investigate `Luna Invalid save file` with forensic copies before changing the save schema.
5. [ ] **[D]** Demonstrate simultaneous stable game 52402, web 8888 and Friends 45099 listeners, plus genuine client login.
6. [ ] **[G+D]** Isolate experimental bot/script reloads from the family server; prevent tick stalls and crashes.
7. [ ] **[G+D+H]** Establish tested pre-deployment backup, read-back and rollback procedures for saves, database and customised source.
8. [ ] **[G+D]** Keep all bot development on disposable or versioned isolated worlds until production readiness passes.

## 2. Research and review RuneScape agent implementations

1. [x] **[G]** Identify [BornParanoid's F2P questing AI video](https://youtu.be/M7-bEi2facI) and the claimed full-quest/cooperation outcome; **controller source/transcript not yet independently verified**.
2. [x] **[G]** Review [Max Bittker's RuneScape Bench video](https://youtu.be/cNm4zyUtWj0) and public [RS-SDK](https://github.com/MaxBittker/rs-sdk) architecture.
3. [x] **[G]** Review the [Jev gameplay video](https://youtu.be/TzC0k_WJNnU) and [JevScape](https://github.com/Skyvern-AI/jevscape) bounded-action concept.
4. [x] **[G]** Review [SirPugger's AI-agent video](https://youtu.be/pXZLI7Lradw) and its structured-interface versus screenshot-control comparison.
5. [x] **[G]** Inspect [rs2b0t](https://github.com/rs2b2t/rs2b0t) for revision-289 quest planners, pathfinding, door handling and task trees.
6. [x] **[G]** Inspect RS-SDK for typed game state, actions and observed-success verification.
7. [x] **[G]** Inspect [2004SP Progressive](https://github.com/2004sp/2004sp-progressive) for server-side goals/skills and identify direct-teleport/item/XP helpers that must not be copied.
8. [x] **[G]** Identify [Luna RS](https://github.com/luna-rs/luna) as a different-language revision-377 reference.
9. [x] **[G]** Identify [Lumbridge AI](https://github.com/samheutmaker/lumbridge-ai) for multi-agent supervision, dashboards and state.
10. [ ] **[G]** Build a file-by-file source/licence/version compatibility matrix for JoshRS 377; record unsupported or proprietary pieces.
11. [ ] **[G]** Select individual legally reusable quest/state-machine implementations and cite source licences/attribution.
12. [ ] **[G+D]** Port selected components into a disposable 377 build and run true compatibility tests.
13. [ ] **[G]** Obtain further trustworthy technical detail for videos where source/transcripts are unavailable; do not attribute guessed methods to creators.

## 3. Implement one reusable, strict no-cheat JoshRS-377 action engine

1. [ ] **[G+D]** Implement `Observation377`: current player, world, quests, skills, inventory, equipment, NPCs, objects, other players and reachable interactions.
2. [ ] **[G+D]** Implement `Action377`: walk, interact NPC/location/ground item, use item on target, dialogue, banking, trading and combat.
3. [ ] **[G+D]** Adapt period-compatible A* navigation, doors, gates, ladders, transports and obstacle recovery with **legitimate** movement.
4. [ ] **[G+D]** Return verified outcomes (`observed_success`, `blocked`, `timed_out`) by comparing world state before and after real interactions.
5. [ ] **[G+D]** Implement genuine backpack/equipment management, tools, inventory capacity and bank access.
6. [ ] **[G+D]** Add quest dialogue choice and state-transition handling based on actual revision-377 RuneScripts/varps.
7. [ ] **[G+D]** Add combat, food, death/respawn and recovery without making bots invulnerable.
8. [ ] **[G]** Design persistent goal/task/prerequisite planning with recoverable failure states.
9. [ ] **[G+D]** Persist bot goals and progress safely across logout/relogin/restarts.
10. [ ] **[G+D]** Detect and resolve stalled paths, NPCs, missing resources and unexpected dialogue.
11. [ ] **[G+D]** Operate at the ordinary **600 ms world tick and 1x XP**, not accelerated benchmark rules.
12. [ ] **[G]** Add tests/guards prohibiting bot-controller `invAdd`, XP granting, quest-variable writes, unauthorised teleports and admin cheats.
13. [ ] **[G+D]** Measure and bound planner latency so reasoning cannot block the game world tick.

## 4. End-to-end full quest proof without scripted item grants

1. [ ] **[D]** Create a genuinely fresh **disposable bot-only** account/save; archive older experimental bot saves without changing family accounts.
2. [ ] **[G+D]** Complete Tutorial Island through game interactions (not a free starter skip).
3. [ ] **[G+D]** Begin Cook's Assistant by physically visiting and talking to the Cook.
4. [ ] **[G+D]** Obtain a bucket legitimately.
5. [ ] **[G+D]** Walk to the dairy cow and milk it.
6. [ ] **[G+D]** Walk to the chicken area and pick up a real egg.
7. [ ] **[G+D]** Obtain wheat and a pot legitimately.
8. [ ] **[G+D]** Travel to the windmill, use its hopper and machinery, and collect real flour.
9. [ ] **[G+D]** Navigate ordinary Lumbridge Castle doors and return to the Cook.
10. [ ] **[G+D]** Hand in genuinely obtained items through the real quest dialogue/action handlers.
11. [ ] **[G+D]** Verify quest stage, journal and normal **300 Cooking XP** reward.
12. [ ] **[G+D]** Logout/relogin and verify quest completion plus inventory/XP persistence.
13. [ ] **[G+D]** Run/fix the no-grants acceptance gate from [draft PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59); do not weaken assertions.
14. [ ] **[G+D]** Complete **The Restless Ghost** fully with normal items/steps.
15. [ ] **[G+D]** Complete **Sheep Shearer** fully with normal items/steps.
16. [ ] **[G+D]** Expand quest-by-quest to every **actually supported** revision-377 historical quest with prerequisites/rewards.
17. [ ] **[G+D]** Repair missing or broken engine/world content as a separate, tested change rather than bypassing quests.
18. [ ] **[D+H]** Prove at least one full unassisted quest in the genuine shared-family-world engine at 600 ms ticks, witnessed in the actual Java client.
19. [ ] **[G+D]** Collect item provenance, movement trace, quest flag chronology, XP monotonicity and save/relog proof.

## 5. Integrate seven independent characters in one shared world

1. [ ] **[G+D]** Preserve Luna's companion functions, identity and saved progress; investigate save warning.
2. [ ] **[G+D]** Replace Fred's four-point family-client patrol with full autonomous progression.
3. [ ] **[G+D]** Replace George's four-point family-client patrol with full autonomous questing.
4. [ ] **[G+D]** **Barry** — rs2b0t-inspired questing, navigation and prerequisites.
5. [ ] **[G+D]** **Larry** — RS-SDK-inspired gathering, skilling, crafting and banking.
6. [ ] **[G+D]** **Gary** — 2004SP-inspired long-term goals, economics and equipment upgrades, without cheats.
7. [ ] **[G+D]** **Rory** — Luna RS-inspired period-correct adventuring/combat.
8. [ ] **[D]** Establish fresh bot-only save/account identity for new characters; keep family save namespaces separate.
9. [ ] **[G]** Define per-character personality/goal weights without forking seven incompatible engines.
10. [ ] **[G+D]** Enforce one authoritative player/control loop per bot and no double-login/duplicate network sessions.
11. [ ] **[D]** Verify each character visible as a genuine player and online in the actual family Friends List.
12. [ ] **[G+D]** Support follow/trade/chat/private messages and accurate location in the shared world.
13. [ ] **[D]** Verify autonomous play persists while real users are logged out and after normal saves/restarts.
14. [ ] **[D+H]** Introduce new bots only with a safe maintenance window; do not disconnect Elrothiro/Sylvie.

## 6. Smarter and affordable AI decisions

1. [ ] **[G]** Define a finite legal-action catalogue, inspired by JevScape.
2. [ ] **[G+D]** Choose goals/actions from live world observation and prerequisites, not a fixed patrol.
3. [ ] **[G+D]** Handle cheap/timing-sensitive actions with deterministic rules first.
4. [ ] **[G]** Add model-assisted planning/recovery only at meaningful decision points, not every 600 ms tick.
5. [ ] **[G+D]** Benchmark local models and actual available hardware versus paid API calls before use.
6. [ ] **[G]** Apply safety validators to refuse synthetic items, XP, quest skips and blocked paths.
7. [ ] **[G+D]** Implement verified bot cooperation, trading and shared objectives.
8. [ ] **[G+D]** Adapt a Lumbridge AI/Watchtower-style supervisor for multiple independent players.
9. [ ] **[G+D]** Persist goals, action history and error context over disconnections/restarts.
10. [ ] **[G+D]** Evaluate whether policies lead to measurable differences in real gameplay without misleading comparisons.

## 7. Build honest telemetry and monitoring

1. [ ] **[G+D]** Implement a source-backed multi-bot dashboard (Watchtower concept).
2. [ ] **[G+D]** Display real online status, last-seen time, coordinates, goals and action outcome.
3. [ ] **[G+D]** Track XP/skills with continuous account and save identity checks.
4. [ ] **[G+D]** Track quest stages, completed quests and prerequisites.
5. [ ] **[G+D]** Track legitimate resource/item provenance, shops/banks/trades.
6. [ ] **[G+D]** Track deaths, stuck loops, failed actions and recovery.
7. [ ] **[G+D]** Log actual social/team events, not assumptions based on nearby coordinates.
8. [ ] **[G+D]** Detect the observed Fred XP-reset/rollback discontinuity; invalidate corrupted A/B windows.
9. [ ] **[G]** Tag `isolated` versus `family` datasets and refuse mixed-world attribution.
10. [ ] **[G+D]** Repair snapshot producer/dropouts; if 0/12 records, mark **unknown/offline**, not 0 earned XP.
11. [ ] **[G]** Render hourly reports and visualisations using validated samples only.
12. [ ] **[G+D]** Add alerts for repeated stalls, prolonged inactivity or resource overload.

## 8. End-to-end test, version control and deployment

1. [ ] **[G+D]** Build/type-check the actual customised 377 engine and run native unit/integration tests.
2. [ ] **[G]** Build deterministic RuneBench-like tests for legal action sequences, observation and outcome validation.
3. [ ] **[G+D]** Test pathing, inventory, dialogue, banking, combat and quest mechanics individually.
4. [ ] **[D]** Test all bots together in a disposable, shared runtime.
5. [ ] **[G+D]** Verify no-cheat XP/quest gains and reliable save/relog.
6. [ ] **[D]** Measure server tick time, CPU, memory and event-loop health under load.
7. [ ] **[D+H]** Verify Elrothiro and Sylvie can play normally with bots active.
8. [ ] **[G]** Commit scope-limited changes to development branches.
9. [ ] **[G+D]** Run real 377 engine tests, not only offline report/CI scripts.
10. [ ] **[G]** Review PRs and merge **only after the claimed tests and regressions pass**.
11. [ ] **[D+H]** Back up production, coordinate restart and deploy using the actual desktop runtime.
12. [ ] **[D+H]** Verify actual resulting behaviour in the Java client and no character loss.
13. [ ] **[G]** Document commits, failed/passing evidence, outstanding limitations and next steps in issue #55.
14. [ ] **[G]** Keep source licence attribution and secrets scanning part of merge criteria.

## 9. Final acceptance criteria — none are presumed complete

1. [ ] Elrothiro and Sylvie can reliably log in and play without crashes, regression or lost progress.
2. [ ] Luna, Fred, George, Barry, Larry, Gary and Rory appear together with one real account each.
3. [ ] All AI characters can roam, gather, skill and interact through actual game mechanics.
4. [ ] Each bot can eventually complete supported full quests from genuine starting conditions with no injected items/XP.
5. [ ] AI players can trade, chat and cooperate through ordinary server systems.
6. [ ] Every character's true progression persists over logout/restart.
7. [ ] Dashboard reports genuine actions, continuity and blockers (no fake completion claims).
8. [ ] Repo includes inspectable source, tests, correct licences, reproducible evidence and a tested rollback route.

## Delivery order / stop gates

1. **Gate A — recover family world**: user login, reliable world ticks/listeners, protected saves; no new live bots before this passes.
2. **Gate B — one genuine quest**: do the entire Cook's Assistant in a disposable 377 runtime with provenance, 1x XP and no grants; save/relog.
3. **Gate C — live integration**: one authoritative autonomous player in the real world and real client, after agreed maintenance and backup.
4. **Gate D — multi-bot expansion**: add Barry/Larry/Gary/Rory plus improve Fred/George on the verified shared controller.
5. **Gate E — improve reasoning and monitoring**: Jev-style bounded decision layer, supervisor and reliable analytics.

## Existing findings / caveats

- `main`'s `FredGeorgeBot.test.ts` still injects milk/egg/flour for the test quest hand-in. Draft [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) removes that but is **not verified** as passing against the customised 377 engine.
- The [family bot client](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-bot-bench/fred-george-family-client.mjs) is a fixed-waypoint network patroller, **not** a complete adventurer.
- A previous audit observed Fred XP discontinuity; selected reports are unreliable as continuous player progression.
- A recent [Fred/George hourly report](https://github.com/Parris-Tech-Services/JoshRS/blob/main/reports/fred-george/hourly/2026-11-01T16Z/report.md) recorded 0/12 observations. This is a reporting gap, **not proof of genuine 0 XP**.
- Public rs2b0t targets revision **289**, not our revision **377**; RS-SDK, JevScape, Lumbridge AI, 2004SP and Luna RS are **references, not ready-to-install 377 replacements**.
- Do not expose login passwords, RSA private keys, raw account databases or family saves in commits, telemetry or issue comments.

## Useful sources

1. [BornParanoid AI full F2P quest video](https://youtu.be/M7-bEi2facI)
2. [Max Bittker RuneScape Bench video](https://youtu.be/cNm4zyUtWj0), [RS-SDK](https://github.com/MaxBittker/rs-sdk), [RuneBench](https://maxbittker.github.io/runebench/)
3. [Jev playing RuneScape video](https://youtu.be/TzC0k_WJNnU), [JevScape](https://github.com/Skyvern-AI/jevscape)
4. [SirPugger AI RuneScape video](https://youtu.be/pXZLI7Lradw)
5. [rs2b0t](https://github.com/rs2b2t/rs2b0t), [2004SP Progressive](https://github.com/2004sp/2004sp-progressive), [Luna RS](https://github.com/luna-rs/luna), [Lumbridge AI](https://github.com/samheutmaker/lumbridge-ai)

**Success means visible, real, no-cheat RuneScape gameplay, not reported source edits, test-only grants, empty telemetry or preset patrols.**

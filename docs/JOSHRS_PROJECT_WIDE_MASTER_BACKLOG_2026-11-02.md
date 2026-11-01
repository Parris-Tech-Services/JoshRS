# JoshRS — Project-wide outstanding work register (cross-referenced, evidence-first)

**Reviewed:** 2 November 2026 (AEDT). **Scope:** current available GitHub source, 12 open issues, 1 open pull request, existing 31 October register, AI-agents checklist, 114-task original-MMO checklist, related source audits and retrievable ChatGPT project context.

**Important limit:** This is the widest consolidated *known* backlog available in this review, **not a guarantee that every past ChatGPT conversation or unpushed change on JParris Desktop was examined**. Older conversations can be retrieved selectively, not exhaustively enumerated here. GitHub cannot prove Windows-game behaviour without desktop observations. Treat any unresolved/no-proof item as open even if code or a CI job exists.

**Canonical scope split:** (A) **JoshRS 377** customised private Windows game, (B) **Original Woodlands** independent web MMO, (C) **Android, browser, streaming/VM clients**, (D) **AI agents**, (E) **historical-source content**, (F) **hosting/rights**. Do not conflate original Woodlands with the historically sourced rev377 game.

**Cross-references:** [AI-agent detailed tasks](rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md) · [AI-agent research and execution scope](rs377/AI_AGENT_RESEARCH_AND_EXECUTION_SCOPE_2026-11-02.md) · [original-game checklist](FULL_CLASSIC_MMO_CHECKLIST.md) · [31-Oct unfinished register](../research/rs377/UNFINISHED_WORK_REGISTER_2026-10-31.md) · [GitHub issues](https://github.com/Parris-Tech-Services/JoshRS/issues) · [open no-cheat PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59)

## 1. P0 recovery and safeguards (do before feature expansion)

1. [ ] Recover and verify normal gameplay listener, stable game ticks and Elrothiro login on JParris Desktop; preserve passwords, account records and character saves. [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30)
2. [ ] Check character inventory, bank, quest progress, NPC interactions and save/relog without resets; verify separate Sylvie client/session and backups. [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30)
3. [ ] Investigate Party Drop Chest unexpected emptying, account for any missing specific items from backups, and disable unrequested destructive reset behaviour after isolated tests. [#52](https://github.com/Parris-Tech-Services/JoshRS/issues/52)
4. [ ] Preserve and review live script changes and experimental bots before authorising future restart, source reload or deployment; avoid forced player disconnection. [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29)
5. [ ] Audit `Luna Invalid save file` and Fred/George starter save continuity; never overwrite live databases to recover bot experiments. [#34](https://github.com/Parris-Tech-Services/JoshRS/issues/34) · [#55](https://github.com/Parris-Tech-Services/JoshRS/issues/55)
6. [ ] Distinguish current local engine, packed scripts, source SHA and actual client version using `active.json`; establish reproducible private backups including SQLite WAL and player saves. [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29)
7. [ ] Require live-server safety gate: normal tick performance, stable ports 52402/8888/45099, real two-client sign-in, no unsaved item loss. [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30)

## 2. Existing GitHub issues — outstanding acceptance and work items

Every issue below is OPEN as of the review. Only **unchecked** source issue checkboxes are counted as outstanding. Some manual acceptance rows supplement prose issues (which do not use Markdown checkboxes). Duplicates shared with AI/Worldlands are cross-references, not extra unique promises.

### 2.3 — [#3: Release gate: independent world hosting, asset rights and real character-play acceptance](https://github.com/Parris-Tech-Services/JoshRS/issues/3)

1. [ ] Resolve rights to Jagex-owned game assets. Their Fan Content Policy §6.1.3 excludes private servers; a software MIT licence does not license those assets. Do not publish an independent replica or copy assets to a public host without appropriate rights.
2. [ ] Identify a personally controlled existing host (or eligible genuinely free cloud instance) with sufficient memory, persistent disk and uptime. Do not start paid services or use third-party/school/client machines without authorisation.
3. [ ] Provision private HTTPS/Tailscale Serve and verify game WebSockets and normal non-admin login. Keep ports other than web unexposed.
4. [ ] Real desktop + Android browser test: new registration, wrong password rejection, tutorial, inventory, equipment, quests, XP and combat.
5. [ ] Record specific item/XP/quest/bank/player state, then verify logout/relogin, reconnect, process restart and host reboot without corruption.
6. [ ] Restore an actual advanced character into a **new** isolated volume and demonstrate complete gameplay/state recovery. The existing checksum/boot test is not enough.
7. [ ] Encrypt and schedule off-host backups; test restoration monthly; monitor storage/RAM/CPU/uptime.
8. [ ] Only after permissions and full device/browser acceptance, switch the primary JoshRS Play target.
9. [ ] Block public redistribution of historical Jagex assets pending actual rights clearance

### 2.5 — [#5: Build legally independent persistent multiplayer JoshRS world on zero-subscription infrastructure](https://github.com/Parris-Tech-Services/JoshRS/issues/5)

1. [ ] Implement server-authoritative movement, combat, XP, inventory, quests and trading; no trusting client-provided rewards.
2. [ ] Anonymous account provisioning with strong authentication tokens, rate limits, origin validation and appropriate access controls; no password or player token in query URLs.
3. [ ] SQLite-backed per-character persistence; multiplayer presence and interaction between two independently signed-in clients.
4. [ ] Server crash/restart/hibernation: prove neither item nor quest progress disappears or duplicates; backup and restore drill, deterministic test vectors.
5. [ ] Mobile/desktop touch/keyboard gameplay and real multi-player browser test against **our** deployed domain.
6. [ ] Asset provenance audit and preserved third-party licences/credits for any reused art/code.
7. [ ] Verify account plan and free quotas before deployment; enforce fail-closed usage limits. No paid hosting.
8. [ ] Extend world content (multiple regions, NPCs, repeatable + unique quests, professions, shops, progression, cooperative activities). Explicitly define a full-game quality bar rather than calling an empty MMO scaffold complete.

### 2.28 — [#28: P0: Establish reproducible quest-by-quest gameplay completeness across open-source RuneScape projects](https://github.com/Parris-Tech-Services/JoshRS/issues/28)

1. [ ] Produce *per-project* historical content catalogues with unique quest IDs, release dates, and sources (Classic, 377, 435, 530/562, 634/2011, modern OSRS).
2. [ ] Map Lost City's six config-only 377 quest roots `quest_100`, `quest_fever`, `quest_mm`, `quest_mortton`, `quest_mourning2`, `quest_rd` to historical quests; search OTHER source paths for start, progress, ending and reward triggers. Confirm whether absent, partial, elsewhere, or working before assigning a gap.
3. [ ] Trace each of the 50 OpenRSC quest start and completion paths, dependencies, quest points, inventory effects and persistence; current 50/50 is **source-entry coverage only**.
4. [ ] Trace 2006Scape quest *stage changes*, completion handlers and persistent state outside journal classes; count unique quests with actual runnable state machines.
5. [ ] Map Void's Kotlin quest entrypoints to its quest data; distinguish partial dialogue and multi-quest support helpers from completable quests.
6. [ ] Retrieve and pin 2009Scape's current canonical GitLab commit and complete code-level quest inventory; inspect Darkan and 2011Scape's actual independent deltas.
7. [ ] Audit Luna 377 quests, skills, Barrows and Castle Wars mechanics (join, encounter state, rewards and reset); distinguish code existence from test evidence.
8. [ ] Re-check OpenRune boss/minigame tracker using actual encounter state machines, not simple symbol references; track 0/4 raids separately.
9. [ ] Deduplicate forks and mirrors; expand discovery across GitHub/GitLab and earlier RS2 variants; report coverage limits instead of claiming completeness.
10. [ ] Produce comparable quest/source and quest/playable percentages **only if the full denominator is independently enumerated and accepted**. Unknown otherwise.

### 2.29 — [#29: P0: Audit and repair actual broken JoshRS 377 world interactions before importing new content](https://github.com/Parris-Tech-Services/JoshRS/issues/29)

1. [ ] Inspect the current JParris Desktop `runtime/jparris-377/active.json` pinned engine/content/client plus local overrides; compare with GitHub source baseline, without writing changes.
2. [ ] Take consistent protected backup of SQLite (including WAL), player saves, active packs, client and any IDs before attempting a fix.
3. [ ] Export observed broken actions (entity type/id, location, quest stage, option, handler, actual/expected result) from the *real* world.
4. [ ] Quest doors and ladders: isolate incorrect destination, state or collision; write focused regression before modifying shared code.
5. [ ] Shops: test stock/price/quantity, full inventory, buy-back and persistence. Prevent duplicates rather than adding a second NPC.
6. [ ] Banks: test all quantity modes, full inventory, withdrawals, reconnect and persistence.
7. [ ] Resource skills / furnace / jewellery: verify IDs, level gates, inventory conservation and existing gameplay; fix only a demonstrable defect.
8. [ ] Haunted Manor bookcase/secret door: reproduce and inspect trigger, region, destination and quest stage.
9. [ ] Troll Romance sled and boss: reproduce, trace the actual branch, test after a minimally scoped fix.
10. [ ] For every repaired interaction: compile, disposable-world tests, non-admin local client play, logout/relogin persistence, restore drill and regression log.

### 2.30 — [#30: P1: Real client gameplay, multi-player and Elrothiro restore evidence for JoshRS 377](https://github.com/Parris-Tech-Services/JoshRS/issues/30)

1. [ ] Confirm JParris Desktop access to active runtime and source revision from `runtime/jparris-377/active.json`.
2. [ ] Use read-only diagnostics first; back up and checksum all private player/account files using existing JoshRS save-integrity tools.
3. [ ] Restore a **copy** in an isolated test environment, not over the live Elrothiro save.
4. [ ] Create two distinct fresh test accounts with correct 377 client/server protocol, leaving existing credentials untouched.
5. [ ] Local real login, camera, movement, chat, NPC interaction, inventory and bank; record build/version/client.
6. [ ] Single sample quest (Cook's Assistant): quest begin, items, state transitions, quest reward, logout/relogin, no duplication.
7. [ ] Lost City 377 quest named Monkey Madness: confirm missing vs implemented elsewhere; do not claim absent based only on config-only directory.
8. [ ] Real boss/Barrows encounter where present: start, damage, loot, reset, persistence; record missing mechanics.
9. [ ] Castle Wars or another available minigame: join, two-player occupancy, objective, reward, exit/reset; do not infer complete from files.
10. [ ] Windows host + Windows 11 VM: two concurrent players, distinct accounts, visibility/chat and independent save.
11. [ ] Mobile/browser client only after handshake, cache and transport compatibility verified and no private credentials leak.
12. [ ] Restart, log back in, compare actual quest points, bank, inventory, gold, stats and equipment.
13. [ ] Isolated backup/restore with before-after hashes and successful game login.

### 2.34 — [#34: P0: Fix silent Challenge Luna duel and implement safe autonomous bot interactions](https://github.com/Parris-Tech-Services/JoshRS/issues/34)

1. [ ] No silent Challenge click in real Java client; visible acceptance or refusal
2. [ ] Luna's reciprocal consent is server-side, validated and logged without credentials
3. [ ] Safe no-stakes session, no PvP globally, no direct item/XP/HP hacks; canonical Duel Arena still works
4. [ ] Countdown, combat, victory, forfeit, timeout, logout, re-entry, overlapping requests, stale slots tested
5. [ ] Follow and Trade unaffected; no client duplicate Luna; collision respected
6. [ ] Save backup before changes, zero player-data lost, Elrothiro and Luna both recover correctly
7. [ ] Agy builds both actual modified engine and scripts, conducts visual in-game test and commits compatible changes
8. [ ] Intelligent follow-on: reflex (health/duel), planner (skilling/bank/needs), personality/memory and outcome verification, with repeatable tests

### 2.35 — [#35: Agent 4 — Read-only cross-agent progress reports (sanitised; 10-minute intervals)](https://github.com/Parris-Tech-Services/JoshRS/issues/35)

1. [ ] Prove 10-minute Agent 4 audit reports reflect observed active sessions; no fabricated progress or private data exposure

### 2.36 — [#36: Content handoff queue — distinctive NPC dialogue, map context and quest-ready packs](https://github.com/Parris-Tech-Services/JoshRS/issues/36)

1. [ ] Investigate generic 'Hello adventurer' NPC response in the real loaded script pack; verify distinct quest/shop/background NPC dialogues
2. [ ] Deliver source-verified unique NPC dialogue, map/quest packs and isolated tests, then actual client verification

### 2.49 — [#49: Rev377 live friends presence and companion PMs (no active-session interruption)](https://github.com/Parris-Tech-Services/JoshRS/issues/49)

1. [ ] Review open issue's prose acceptance conditions and obtain actual gameplay verification before closure

### 2.50 — [#50: JoshRS 377: safe 28+28 portable inventory expansion without item loss](https://github.com/Parris-Tech-Services/JoshRS/issues/50)

1. [ ] Review open issue's prose acceptance conditions and obtain actual gameplay verification before closure

### 2.52 — [#52: P0: Party Drop Chest unexpectedly clears deposited items — preserve and recover](https://github.com/Parris-Tech-Services/JoshRS/issues/52)

1. [ ] Remove destructive Party Chest Accept/drag/threshold reset hooks and verify deposited shared items persist without grants
2. [ ] Account for missing items using read-only historical evidence and player-approved recovery

### 2.55 — [#55: Fred & George: fresh no-cheat A/B bots, cooperative play, friend/location and hourly evidence](https://github.com/Parris-Tech-Services/JoshRS/issues/55)

1. [ ] Agy inspects local active.json and existing modifications; isolated runtime, backup proof and no active player disruption
2. [ ] Fred and George normal account registration with exact fresh starter gear/location/XP/quest baseline fingerprint, distinct saves and logout/relogin
3. [ ] Fred gather-first and George quest-first, ordinary mechanics with no direct grants/teleports/tick cheats
4. [ ] Both autonomous agents able to navigate, bank, fight, train and pursue quests with real in-game consequences; attempt all 21 skills and historically applicable quests, report blockers instead of cheating
5. [ ] Solo A/B runs + separately tagged coop/mixed intervals; real shared combat only where normal game rules permit, normal trades/quest help
6. [ ] Elrothiro friend list online/offline reflects both bot presences; bidirectional PM; authenticated in-game ::wherebots or equivalent reports current authoritative world region and tile, not fabricated positions
7. [ ] Agy supervised 10-minute local telemetry runs independently of chat window and safely pushes six paired intervals per hour to GitHub (12 records), including success/failure/XP/quest/route/team events
8. [ ] GitHub automatic hourly JSON/Markdown plus four SVG charts from actual data, preserving incomplete/missed reports
9. [ ] ChatGPT hourly task reads validated data and writes/publishes appropriately sanitised findings, without inventing observations
10. [ ] All offline tests and real client gameplay, persistence, recovery and family multiplayer regression checks pass before any opted-in deployment
11. [ ] Prove full no-grant questing in the family world; remove fixed four-point patrolling
12. [ ] Repair telemetry missing snapshots and XP rollback verification

## 3. Additional tasks recovered from previous JoshRS discussions and source history

1. [ ] Investigate real 377 NPC generic greeting and dialogue-loop regressions for Reldo, Juliet, Edmond, Elena and Sinister Stranger; verify genuine options instead of blanket default greeting.
2. [ ] Verify previously source-implemented 21 Skill Guide buttons and 45 Quest Journal buttons through the actual modified #377 Java client and persistent account.
3. [ ] Verify modern source/region expansion requests against rev377 timeline and source licences; keep original Woodlands geographical expansions separate.
4. [ ] Finish source harvesting and content production: confirm scheduled metadata workflows actually produce current pinned, rights-cleared artifacts; hand off integrated and tested source packs rather than raw discovery.
5. [ ] Verify native Haunted Manor quest bookcase/levers/secret doors patch on the actual client and persist state, after source-only disposable CI.
6. [ ] Investigate Troll Romance second sled/boss interactions through actual quest triggers before adding patches.
7. [ ] Verify original RuneScape client feature parity for second Windows VM player, including zoom, scaling, worldmap, controls, Tailscale connection and dual-client save isolation.
8. [ ] Finish Android Kotlin JoshRS prototype: replace green-grid/placeholder scene with authentic supported rev377 3D rendering, caches, character/terrain/animation and client/server login before calling it playable.
9. [ ] Prove browser/mobile rev377 transport bridge with safe authenticated protocol, correct cache and no credential exposure; decide whether stream existing desktop versus build a native client.
10. [ ] Verify Windows launcher remains stable across Java/Gradle versions, browser asset server, friend service, game listener and offline repair; document tested launch path and recovery.
11. [ ] Verify original Woodlands website actually deploys the commits that passed browser/item conservation tests, without triggering paid Vercel limits.
12. [ ] Extend original Woodlands from single-player to authenticated authoritative multiplayer, shared economy/trading, multiple regions and persistent quest/gameplay state; preserve original assets and licences.
13. [ ] Review outstanding historical RuneScape skills/minigames/quests: Barrows, Castle Wars, Monkey Madness and six config-only roots against actual 377 state machines, not folder counts.
14. [ ] Audit Agent 1/2/3/4 coordination and GitHub reports: real work ownership, no parallel edits to live Player.ts, scripts or databases; no false completion from research artifacts.
15. [ ] Add save-persistence, rollback and item-duplication tests for item movement including portable 28+28 storage, bank, trading, death, logout/relog and Party Room.
16. [ ] Review source/research from prior ChatGPT JoshRS discussions not yet represented in GitHub issues; reconcile new findings into this register without incorrectly marking tasks complete.


## 4. AI agents — embedded original 111-item numbered checklist (cross-referenced)

> This section preserves the earlier AI domain scope without replacing its canonical [source checklist](rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md). Checked items remain marked as previously researched only; live gameplay must still be verified.

1. [ ] **[G+D]** Diagnose the absent game listener on TCP 52402 from the 1 Nov failure; trace cause and repair without overwriting account data.
2. [ ] **[G+D]** Restore Elrothiro login against the correct account database, without resetting the existing account.
3. [ ] **[D+H]** Verify Elrothiro's and Sylvie's character saves, inventories, banks and earned progress against dated backups.
4. [ ] **[G+D]** Investigate `Luna Invalid save file` with forensic copies before changing the save schema.
5. [ ] **[D]** Demonstrate simultaneous stable game 52402, web 8888 and Friends 45099 listeners, plus genuine client login.
6. [ ] **[G+D]** Isolate experimental bot/script reloads from the family server; prevent tick stalls and crashes.
7. [ ] **[G+D+H]** Establish tested pre-deployment backup, read-back and rollback procedures for saves, database and customised source.
8. [ ] **[G+D]** Keep all bot development on disposable or versioned isolated worlds until production readiness passes.
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
1. [ ] Elrothiro and Sylvie can reliably log in and play without crashes, regression or lost progress.
2. [ ] Luna, Fred, George, Barry, Larry, Gary and Rory appear together with one real account each.
3. [ ] All AI characters can roam, gather, skill and interact through actual game mechanics.
4. [ ] Each bot can eventually complete supported full quests from genuine starting conditions with no injected items/XP.
5. [ ] AI players can trade, chat and cooperate through ordinary server systems.
6. [ ] Every character's true progression persists over logout/restart.
7. [ ] Dashboard reports genuine actions, continuity and blockers (no fake completion claims).
8. [ ] Repo includes inspectable source, tests, correct licences, reproducible evidence and a tested rollback route.

## 5. Original Woodlands full-MMO checklist — embedded source task checklist

> Derived from the existing [full classic MMO checklist](FULL_CLASSIC_MMO_CHECKLIST.md). All originally unchecked tasks stay open here; **originally checked** items are reproduced as source-claimed progress requiring their own evidence and not treated as live acceptance.

- [x] **BASE-01** Identify the established technical research target: Lost City / 2004Scape **revision 274, November 23, 2004**. The local research-only pinned engine and content builds are separate from the published JoshRS game. Evidence: deploy/server/README.md, docs/SELF_HOST.md.
- [x] **BASE-02** **LOCKED: Option A — RuneScape 2, 23 November 2004, revision 274.** The project-adopted visual/gameplay reference is [the rev-274 design brief](REFERENCE_VERSION_274.md), backed by [the machine-readable lock](REFERENCE_VERSION_LOCK.json) and CI checks. This does not mean 2004Scape content is publicly licensed or that a full game is implemented. The 2007-derived OSRS snapshot, current OSRS and post-November-2004 features are explicitly **not** the baseline.
- [ ] **BASE-03** Record 30–50 reference interactions and annotated screenshots: first login, spawn, walking, camera, minimap, bank, shop, inventory, skills, dialogues, combat, prayer, magic, quest, login/logout, mobile navigation. Use screenshots strictly for **comparison and analysis**, not as reusable game assets.
- [ ] **BASE-04** Produce a feature-by-feature reference matrix (reference / JoshRS / test / status / gap) and assign each feature an issue. Specify exact historical skill roster for the chosen snapshot—no invented “all OSRS skills” count.
- [ ] **BASE-05** Define the release target: independent **original** game inspired by classic play, or *licensed* historically exact recreation. The latter cannot be assumed to be licensed by an MIT engine repository.
- [ ] **BASE-06** Freeze a measurable definition of “full game”, “early-access MMO” and “historical parity” before marketing. The “full” label requires all release gates in section 13, not just a visible login screen.
- [x] **RIGHTS-01** Verify code versus asset licensing: LostCityRS Engine-TS and Client-TS code are MIT; LostCityRS Content explicitly says Jagex-owned assets **are not** covered by MIT. Jagex Fan Content Policy §6.1.3 excludes private servers using Jagex property. Evidence: https://github.com/LostCityRS/Content/blob/main/README.md and https://legal.jagex.com/docs/policies/fan-content-policy.
- [ ] **RIGHTS-02** If pursuing exact RuneScape sprites, models, textures, terrain, quest scripts, icons, audio, map, characters, trademarks or names, **obtain written permission** covering the precise intended hosting/distribution. Until then, these remain blocked for public JoshRS.
- [ ] **RIGHTS-03** Otherwise create/license **original** low-polygon meshes, UI textures, sounds, environments, maps, names, quests and items with documented provenance. “Looks classic” is a target; reproducing Jagex assets pixel-for-pixel without permission is not.
- [ ] **RIGHTS-04** Maintain an asset manifest (source URL, author, actual licence, modification, attribution, redistributed path, review) and automated check blocking unknown assets in production.
- [ ] **RIGHTS-05** Audit all dependencies for code licences and attribution obligations; preserve MIT notices and any additional requirements (e.g., copyleft code if adopted). Separate engine licence from historical game content.
- [ ] **RIGHTS-06** Confirm site wording, title, logos and advertisements do not imply affiliation or official endorsement.
- [ ] **VIS-01** Create an original low-poly WebGL 3D world scene with tilting/rotating camera, terrain heights, water, shading, buildings and animated characters (historical reference, not copied models).
- [ ] **VIS-02** Implement the familiar *composition*: 3D gameplay viewport, circular minimap in upper right, icon-tab panel at right, parchment-like chat strip below the viewport, classic action menus and modal overlays; original art.
- [ ] **VIS-03** Design a fixed-aspect desktop frame and a properly reflowed mobile layout rather than shrinking desktop hit targets; handle portrait, landscape and notched screens.
- [ ] **VIS-04** Implement original hand-crafted stone/wood/parchment-style interface borders, panel art, backgrounds, readable bitmap-like typography and textured button states with rights-cleared assets.
- [ ] **VIS-05** Implement classic item-grid slots with stack counts, hover/tap descriptions, drag-select and equipment icons.
- [ ] **VIS-06** Add main tabs for inventory, stats, quests, equipment, combat style, prayer, magic, friends, settings, emotes and logout, limited by chosen historical version.
- [ ] **VIS-07** Build minimap with compass, landmarks, NPC/player markers, destination flag and click/tap navigation.
- [ ] **VIS-08** Create context menus with click/hold/right-click support and historically familiar ordering (“Walk”, “Talk”, “Use”, “Examine”, etc.), while preserving accessible alternatives.
- [ ] **VIS-09** Add chat system with channel selectors, history scrollback, timestamps/options as historically appropriate, name colouring, filtering and moderation.
- [ ] **VIS-10** Include 3D character customisation and appearance preview with original hair, body, clothing, equipment and animations.
- [ ] **VIS-11** Add interface animations: opening bank/shop/dialogue/quest windows, XP drops/level notifications, health bars, damage splats, item-ground labels and progress feedback.
- [ ] **VIS-12** Create an annotated side-by-side **reference/own implementation** screenshot-review suite (desktop 1280x720, phone portrait/landscape, varied zoom) with manual visual sign-off; never reuse screenshots as assets.
- [ ] **WORLD-01** Implement server-authoritative coordinates, collision and map boundaries on a streamed/chunked original world (not an extracted Gielinor map).
- [ ] **WORLD-02** Click/tap-to-walk with actual shortest-path routing, interrupted actions, movement queues and precise destination feedback.
- [ ] **WORLD-03** Diagonal movement/turning, run energy and stamina rules matched to approved design, not browser-button shortcuts.
- [ ] **WORLD-04** Camera rotation/zoom/occlusion, indoor rendering, stairs/ladders, floors, doors, gateways and portals.
- [ ] **WORLD-05** Build multiple connected regions: starter village, towns, forests, mine, river/coast, farms, dungeons and dangerous wilderness-like region with **original** names/geography.
- [ ] **WORLD-06** Populate static and moving NPCs, roaming enemies, resource nodes, interactable doors/chests, shops, banks and transport.
- [ ] **WORLD-07** Add multi-level interiors, day/night only if approved for the chosen design, weather/ambient variation and footstep/environment ambience.
- [ ] **WORLD-08** Real map and minimap coordinate consistency; no clicks through obstructing walls; 30-minute traversal without getting stuck.
- [ ] **WORLD-09** Resource spawns/despawns and timers stored in authoritative world state; avoid client-side duplications.
- [ ] **WORLD-10** Measure map rendering and camera performance on an actual midrange Android device, including thermal and battery use.
- [x] **CHAR-01** Original Woodlands has local character state, limited HP/coins, six skills, XP, inventory, local save, banker and merchant. Evidence: core.mjs, tests/core.test.mjs; PR #4.
- [ ] **CHAR-02** Implement permanent authenticated character identities stored on **our** service and protected session tokens; do not reuse Lost City/OSRS credentials.
- [ ] **CHAR-03** Implement historical character appearance, equipment slots, worn item visuals, equipment bonuses and clothing/armour variation using original assets.
- [ ] **CHAR-04** Implement finite slot-based inventory, item metadata, stackability, weight, examine text, splitting/combining, wield/use/drop and grounded items.
- [ ] **CHAR-05** Preserve item transaction invariants (no item minting via sell/deposit/transfer/reconnect), with deterministic tests and transaction logs.
- [ ] **CHAR-06** Full historical-style bank: tabs/notes only if present in chosen version, deposit/withdraw quantities, scroll, item search where appropriate, reliable persistence, capacity and permissions.
- [ ] **CHAR-07** Skill progression with chosen version's XP curve, level thresholds, skill-specific unlocks and milestone feedback. Target the historical **level 1–99** experience where appropriate.
- [ ] **CHAR-08** Persistent player stats, equipment, inventory, bank, appearance, location, quest variables, membership-like feature flags if used, settings and friend preferences.
- [ ] **CHAR-09** Character death and recovery/respawn rules with lost/retrievable items, gravestones only if historically appropriate; repeatable and abuse-tested.
- [ ] **CHAR-10** Profile export/delete, recoverable backups, privacy statement and account reset/recovery mechanism.
- [x] **SKILL-01** Woodlands supports basic woodcutting, firemaking, mining, fishing, cooking and combat with deterministic tests. These are **not** complete historical mechanics.
- [ ] **SKILL-02** Record the exact chosen-revision skill roster; implement each skill's interface, equipment, resource/recipe loops, XP, success probabilities, timing and dependencies.
- [ ] **SKILL-03** Woodcutting/log varieties, axes, tree depletion/regrowth and firemaking fuel/ignition.
- [ ] **SKILL-04** Mining ore tiers, pickaxes, mine respawn, smelting and smithing item production.
- [ ] **SKILL-05** Fishing spots, equipment/bait, fish tiers; cooking fires/ranges, burn rules and food healing.
- [ ] **SKILL-06** Crafting, runecrafting and other relevant production/processing chains with actual item requirements and outputs.
- [ ] **SKILL-07** Agility/thieving/farming/slayer and other era-appropriate skill content **only if available in the chosen historical version**; never indiscriminately splice later OSRS systems into 2004.
- [ ] **SKILL-08** In-world merchants: prices, stock, buy/sell limits, currency sinks and transaction integrity.
- [ ] **SKILL-09** Player-to-player trade with two-sided lock/confirm, same-item revision checks, disconnect rollback and prevention of dupes/scams.
- [ ] **SKILL-10** Balancing: no infinite money from starter shops, no duplicate XP from clicks, no negative inventory, no market exploit under concurrent requests.
- [ ] **SKILL-11** Add at least one compelling **30-minute self-sustaining gameplay loop** using several interconnected skills, including meaningful rewards and progression.
- [ ] **COMBAT-01** Server-authoritative tick/turn timing, target range, line of sight, attack speed, hit accuracy, armour and combat levels.
- [ ] **COMBAT-02** Melee styles and equipment stats; ranged weapons/ammo; magic spellbooks, mana/runes and spell requirements, as appropriate to target version.
- [ ] **COMBAT-03** NPC threat/aggro/leashing, wandering, patrols, attack animations, drops, recovery and boss phases.
- [ ] **COMBAT-04** Prayer resource/activation/drain and altar recovery; consistent stacking effects.
- [ ] **COMBAT-05** Food, potions, protection and poison/status effects where era appropriate.
- [ ] **COMBAT-06** Loot generation, ownership timers, rare-drop odds, abuse-resistant drop tables and inventory capacity rules.
- [ ] **COMBAT-07** PvP areas/duels if included; safe-zone boundaries, death risk disclosure, anti-griefing and disconnect handling.
- [ ] **COMBAT-08** Multi-user encounters and damage/reward attribution with server logs and deterministic replay tests.
- [x] **QUEST-01** Woodlands has a small original “Forest Apprentice” quest and repeatable supply orders, saved locally. Evidence: core.mjs and tests/core.test.mjs; PR #4.
- [ ] **QUEST-02** NPC conversations with branching choices, conditions, inventories, quest variables and ability to return after interruption.
- [ ] **QUEST-03** At least 10 genuinely different, start-to-finish original quests with objectives, story, branching progression, XP/reward outcomes and completion journal.
- [ ] **QUEST-04** A coherent starter tutorial with optional skip, camera, movement, combat, inventory, bank, quest, map, chat and logout/reconnect.
- [ ] **QUEST-05** Three dungeons/activities with unique mechanics, traversal puzzles and rewarding objectives.
- [ ] **QUEST-06** Narratively original villages, landmarks, factions and lore; do not publish recreated copyrighted quests or copyrighted location assets without clearance.
- [ ] **QUEST-07** NPC/shop/dialogue/world changes persist and remain consistent after reboot.
- [ ] **QUEST-08** Quest acceptance suite records completion, failure, wrong-order actions, repeated rewards and safe recovery after disconnect.
- [ ] **NET-01** Build an authoritative game server independent of Lost City's online service. State-changing commands are validated on the server.
- [ ] **NET-02** Multiple separately authenticated accounts can join the same world concurrently and *see each other move*, with names/appearance correctly attached.
- [ ] **NET-03** Public/local chat, private messages, player status, block/mute/report and anti-spam rules.
- [ ] **NET-04** Bank and shop operations, quests and combat are isolated per account; no cross-account item/XP bleed.
- [ ] **NET-05** Real two-player trade handshake, cancellation, network loss rollback, atomic save.
- [ ] **NET-06** Co-op combat, parties and shared activities with correct credit/loot distribution.
- [ ] **NET-07** Reconnection after Wi-Fi/mobile handoff, mobile screen lock, page refresh and server sleep without duplicates or lost state.
- [ ] **NET-08** WebSocket authentication, rate limits, message validation, origin enforcement, sanitised text and audit logs.
- [ ] **NET-09** Scalable interest management: send only nearby actors/events; no runaway per-player CPU/memory.
- [ ] **NET-10** Two-player *real device* end-to-end session on desktop and Android covering trading, chat, movement, quests and saved relogin.
- [x] **SAVE-01** Woodlands supports local autosave and a manually exportable/importable JSON save with confirmation and invalid-file rejection. Verified desktop/mobile CI. This is not shared online persistence.
- [ ] **SAVE-02** Design versioned canonical server-side character schema and migration procedure from the current Woodlands save.
- [ ] **SAVE-03** Separate client UI data from trusted server state; never trust an arbitrary uploaded JSON file to award live XP/gold/items.
- [ ] **SAVE-04** Implement secure server account registration, login and one-time, validated old-save migration with replay prevention and safe rollback.
- [ ] **SAVE-05** Persist and reload character appearance, location, inventory, bank, levels/XP, equipment and quest flags; all fields tested.
- [ ] **SAVE-06** Atomic state changes under crashes/concurrent requests; optimistic transactions, uniqueness constraints and idempotent reward/payment operations.
- [ ] **SAVE-07** Daily encrypted off-host backups, retention/restore and owner-controlled recovery. No credentials/character databases committed to GitHub.
- [ ] **SAVE-08** Prove complete state recovery on fresh server, after sudden process termination, hibernation, deployed-code upgrade and mobile disconnect.
- [x] **HOST-01** JoshRS's static launcher and original Woodlands demo are live on Vercel; historical-game Play links to Lost City. Evidence: production deploy + browser tests in GitHub Actions.
- [x] **HOST-02** A pinned *research* Docker build of the historical engine can start, back up and pass an isolated restore/HTTP/client rendering CI check. This is **not a licensed public deployment or full gameplay acceptance**. Evidence: deploy/server/README.md, PR #2.
- [ ] **HOST-03** Identify the concrete chosen server runtime: an existing owner-controlled computer + private Tailscale Serve; eligible Oracle Always Free for a persistent Node game; **or** a separately implemented game state architecture on Cloudflare Workers Free + SQLite-backed Durable Objects. These are alternatives, not drop-in equivalents.
- [ ] **HOST-04** Verify *the actual connected account* is on a non-billable/free tier and that limits hard-fail rather than generate charges; billing-read permissions may need owner action. No payment, upgrade, card, or billable resources authorised.
- [ ] **HOST-05** Container/worker build, durable database, HTTPS and WebSocket gameplay accessible on mobile outside home Wi-Fi.
- [ ] **HOST-06** Persistence across deploy, process crash and host restart, with off-host backup and independent restore.
- [ ] **HOST-07** Measure per-player CPU, RAM, storage, WebSocket message counts and quota budget; enforce limits and visible warnings before exhaustion.
- [ ] **HOST-08** 24-hour uptime/reconnection test and a several-player stress test on the actual free environment.
- [ ] **HOST-09** Establish documented, safe rollback and disaster recovery. Never replace the working live Woodlands site until the new game passes all gates.
- [x] **UX-01** Existing single-player Woodlands has keyboard, click/tap movement, touch D-pad and responsive layout, with live desktop/mobile browser checks. This is **not** a complete classic RuneScape control system.
- [ ] **UX-02** Implement mobile-friendly tap/hold context menus, accessible inventory drag/drop alternatives, pinch/rotate or buttons for camera, onscreen keyboard handling.
- [ ] **UX-03** Test Android portrait/landscape, low-end device, desktop Firefox/Chrome/Safari equivalents where possible, browser zoom and reduced motion.
- [ ] **UX-04** Ensure no unreadable text, overlapping controls, clipped minimap, accidental scroll, keyboard traps or unreachable buttons.
- [ ] **UX-05** Support colour contrast, labels, focus order, screen reader fallback status and adjustable UI scale/font size.
- [ ] **UX-06** Make login, reconnect, export/restore, updates and error states understandable without technical knowledge.
- [ ] **UX-07** Build realistic moderation/privacy policy for shared chat and player reports; prevent exposing private details.
- [x] **TEST-01** Current unit tests cover starter gameplay, basic economy and save import/export; live site has desktop/mobile DOM/rendering checks.
- [ ] **TEST-02** Each major gameplay feature needs an automated *interactive* browser test, not only a button-present assertion.
- [ ] **TEST-03** Reference behaviour matrix for every approved classic feature: expected inputs, state transitions, failure modes, XP/item changes.
- [ ] **TEST-04** Two independent browser contexts for real trade, chat, co-op, invalid command, concurrent save and disconnect.
- [ ] **TEST-05** Property-based economy and quest tests: no duplicate rewards, negative stock, teleporting, item creation or bypass of prerequisites.
- [ ] **TEST-06** Load and performance tests on selected free backend with measured peak and sustained usage.
- [ ] **TEST-07** Browser screenshots/video traces on desktop/mobile and human acceptance of actual UI matching the signed-off *original-art* reference.
- [ ] **TEST-08** Automated production smoke tests run after each deploy and verify account/login, movement, inventory, persistence and a genuinely working game loop.
- [ ] **TEST-09** No serious security, data loss, inaccessible interface, or licensing issues open at launch.

## 6. Current cross-cutting release and verification gates

1. [ ] Publish a traceable source map linking every work item to an issue/PR/test/live evidence; do not infer resolution from an old closed PR.
2. [ ] Run an accurate independent review of all open/closed issues and PRs relevant to unfinished work, including closed 'fixed in code, not in game' cases.
3. [ ] Compare actual local uncommitted scripts and accounts with GitHub only via a trusted, non-destructive desktop-access route.
4. [ ] Gather remaining prior ChatGPT conversations through available historical context when specific gaps emerge; **a guarantee of having read every conversation is not supported by current retrieval tools**.
5. [ ] Keep owner permissions and licence boundaries for Jagex assets, external code, original Woodlands and private account data.
6. [ ] For each claimed completion: show relevant source diff, tests on actual pinned engine, in-game interaction (if applicable), persistence after relog, and failure-free restore.
7. [ ] Avoid paid infrastructure and unauthorised email; no unsolicited account resets or live game changes.
8. [ ] Update this register and relevant issue only after the observable outcomes, and label VERIFIED COMPLETE / PARTIALLY COMPLETE / BLOCKED precisely.

## Review coverage and count caveats

- Reviewed: all **12 currently open issues**, open PR #59, AI-agent GitHub source list, original 114-task Woodlands checklist, previous unfinished-work register, README and linked source audits, plus relevant retrievable ChatGPT history.
- Extracted: **77** unchecked issue body tasks and manual prose follow-ups, **16** cross-source tasks, **111** prior numbered AI tasks, and **114** original-MMO checkbox lines, with overlap. They are **not a count of distinct unfinished obligations**.
- Not fully examined: every historical/closed issue and PR, every unpushed desktop edit, every past ChatGPT transcript, every nested document/file in the repository, or every runtime test. This is a significantly broader **cross-referenced inventory**, not a false exhaustive claim.
- Live status: cannot be declared fixed solely from GitHub. The user's last on-host diagnostics showed gameplay-listener and authentication trouble; treat this as **unverified current state** until a fresh desktop check.

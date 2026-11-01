# JoshRS #377 AI agents — source research, implementation plan and ChatGPT execution scope

**Date:** 2026-11-02 AEDT  
**Companion checklist:** [111 numbered tasks](AI_AGENTS_MASTER_TODO_2026-11-02.md)  
**Active tracking:** [issue #55](https://github.com/Parris-Tech-Services/JoshRS/issues/55), [no-grants acceptance PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59)

## 1. What the four supplied videos and their projects actually establish

1. [BornParanoid, *I Taught AI to Play RuneScape (Then It Beat Every F2P Quest)*](https://youtu.be/M7-bEi2facI): creator-reported long-running agent training and free-to-play quest completion. A related clip mentions collaboration in chat for a quest needing a second player. **Exact implementation, source repo, video transcript and independent verification of all quest achievements were not available**. Treat as a complete-quest / social-cooperation benchmark, not a verified reusable codebase.
2. [Max Bittker, *RuneScape Bench: MMOs for Agents*](https://youtu.be/cNm4zyUtWj0): the public [RS-SDK](https://github.com/MaxBittker/rs-sdk) exposes state queries and action helpers in TypeScript, and [RuneBench](https://maxbittker.github.io/runebench/) describes repeatable objectives/verification. This gives an inspectable approach: `observe state -> choose tool -> execute normal action -> confirm actual effect -> retry/plan`. Its customised research engine is **not identical to JoshRS 377**, and benchmark acceleration is not acceptable for family-world progression.
3. [Jev video, *NEW AI Model "JEV" Plays Runescape For Only $.03*](https://youtu.be/TzC0k_WJNnU): [JevScape](https://github.com/Skyvern-AI/jevscape) illustrates constrained action selection, separating a small model's scoring from a deterministic executor. The displayed price is a *video claim*, not a guaranteed cost or proof Jev runs locally. First implement a local deterministic legal-action selector; optionally evaluate hosted cost/latency later.
4. [SirPugger, *Can An AI Agent Play RuneScape?*](https://youtu.be/pXZLI7Lradw): relevant contrast between screenshot/visual mouse-control agents and structured game-state SDK control. The actionable lesson for our **owned private server** is to prefer typed state and legal native interactions over OCR/click heuristics. Do not infer missing technical specifics from inaccessible transcripts.

**Research caveat:** We verified related public source material and the video's public descriptions/search metadata; we did not fully transcribe or frame-by-frame inspect every video. Video-specific engineering claims must be distinguished from actual repository code.

## 2. Open-source candidates and what may be adapted

| Candidate | Useful module/design | Compatibility | No-cheat and licence caveats |
|---|---|---|---|
| [rs2b0t](https://github.com/rs2b2t/rs2b0t) | TypeScript bot API, A*, doors, quest state machines, outcome checking | Revision 289 / rs2b2t fork, **not** a drop-in 377 client | MIT repo licence noted; validate every imported file and item/quest IDs |
| [RS-SDK](https://github.com/MaxBittker/rs-sdk) | Observation/action interface and task result checking | Custom LostCity-derived environment, **not** JoshRS 377 protocol | Do **not** port speed boosts, infinite stamina or scripted rewards |
| [2004SP Progressive](https://github.com/2004sp/2004sp-progressive) | Native Player wrapper, goals, skill task planner, per-bot activities | Requires engine-specific port | Source contains direct teleport, `addXp`, `addItem` helpers; forbid in autonomous progression |
| [Luna RS](https://github.com/luna-rs/luna) | Historical revision-377 game/server reference | Kotlin/Java engine, not native TypeScript module | Architectural reference; inspect licences before any literal copying |
| [JevScape](https://github.com/Skyvern-AI/jevscape) | Bounded typed action choices, low-frequency next-step selection | Adapter needed | Hosted service/cost/privacy evaluation required for model use |
| [Lumbridge AI](https://github.com/samheutmaker/lumbridge-ai) | Agent supervisor, shared world, per-agent roles, Watchtower monitoring | Separate world/client and API | Do not import its starter skips or altered rules |
| [RuneBench](https://maxbittker.github.io/runebench/) | Task definitions and state-based success proofs | Not a native #377 acceptance suite | Require real-time 600ms tick and real saved account continuity |

No candidate was verified as a direct installer for the currently customised family world.

## 3. Concrete JoshRS #377 target architecture

1. `Observation377`: collect read-only snapshots (identity, location, collision/path options, stats, inv/bank, equipment, quest flags/journal, live NPC/loc/obj, legal next actions). Record source tick and save generation.
2. `Action377`: single typed dispatcher for genuine native player interactions. Include path/doors/transport, `APNPC*`, `APLOC*`, ground items, `OPHELDU`, item-on-target, dialogue response, trade/bank, attack, eating and normal logout. Verify each by observing game-state differences. No outcome may be called successful merely because the event was sent.
3. `QuestPlanner377`: source- and revision-correct prerequisite graph; explicit quest-state transitions; item sourcing and travel tasks; timeouts and rollback-safe recovery. Start with **Cook's Assistant** from entirely unseeded inventory, then **The Restless Ghost**, **Sheep Shearer**, and others as engine content allows.
4. `BotPolicy`: one deterministic legality/filter layer and per-character strategy (Fred gather, George quest, Barry quest/explore, Larry skill, Gary long-term/economy, Rory combat, preserve Luna). Optional Jev-style model returns a *choice among permissible actions*; never writes XP/quests/items.
5. `BotSupervisor`: one authoritative `Player` and save per character in the **same** family `World`; no duplicate TCP puppet/client and engine bot controlling the same name. Persist task state and recovery information.
6. `Evidence`: per-action before/after state, source of items, XP monotonicity, quest completion, legitimate game tick and social interactions. Reports must distinguish isolated and family world, never merge them into one progress claim.
7. `Stability`: bounded work per tick, no synchronous model request on the game loop, isolation of experimental actions, predeploy backups and rollback.

### Anti-cheat / anti-regression invariants

- All advancement derives from native game interactions, not the bot's own direct `invAdd`, `addXp`, `setVar`, admin commands or teleports past obstacles.
- Genuine mechanics awarding rewards from RuneScript are permitted only after the real prerequisites.
- Do not create starter progress by bypassing Tutorial Island for no-cheat test accounts.
- No switch to a clean/replacement database or save folder for Elrothiro and Sylvie.
- No fixed four-waypoint patrol can satisfy the autonomous-play acceptance test.
- Validate one real quest with item provenance, log-out and reload before scaling to all characters.
- Test the engine at **600 ms** tick, **1x XP**. Short accelerated unit tests are supplementary only.

## 4. Exact ChatGPT action scope in this connected session

**A. Directly executable right now through GitHub tools:**

1. Read and compare committed JoshRS sources, commits, issues, branches and PRs.
2. Read and inspect publicly available source repos and their licence declarations; document accurate compatibility and provenance.
3. Create/update Markdown plans, research docs, compatibility tables and work orders on `main` or a scoped branch.
4. Write source code and TypeScript tests in a development branch through GitHub's file APIs.
5. Design/implement `Observation377`, `Action377`, planners, rule guards and no-cheat acceptance tests **as repository source changes** (subject to exact available engine interfaces).
6. Repair or extend the existing no-cheat test/CI scripts, regression assertions and A/B telemetry continuity validation.
7. Create CI configurations, inspect workflow logs/checks where exposed, inspect failures, update source and retry.
8. Open/update PRs, comment detailed findings, link issue #55 and merge when the available checks and required criteria truly pass.
9. Write reviewed desktop recovery / deployment scripts for Agy to run, provided they are non-destructive and explicitly guard backups and users.

**B. Code can be authored here, but final completion requires external runtime evidence:**

1. Compile and execute the **actual customised** 377 engine with its local content and dependencies.
2. Test pathing, door/quest scripts, skill triggers, dialogue and online bot interactions against a live/disposable world.
3. Validate save schema, accounts, avatar appearance, social packets and dynamic location in the Java client.
4. Benchmark event loop and CPU with all seven bots online.
5. Run genuine live real-time full quest flows and check persistence/provenance.
6. Use a self-hosted GitHub runner **only if explicitly configured and authorised** for isolated jobs, with proven no-touch boundaries to the occupied production game; its availability is not assumed.

**C. Not executable from GitHub alone:**

1. Read arbitrary files, passwords, logs, registry/process memory or ports on JParris Desktop that haven't been uploaded or made accessible through an approved connector.
2. Directly control the open Windows PowerShell or Java game GUI, start/stop the live server, or restore accounts/saves.
3. Know whether a specific user is logged in *right now* without a live observation.
4. Prove what Elrothiro/Sylvie see in-client or independently validate their possessions from GitHub reports alone.
5. Coordinate a restart while real users are playing without explicit approval or a trusted runtime control channel.
6. Promise existing integration works merely because a branch exists or reporter/CI jobs show green.
7. Send email or create mail drafts without explicit user permission. (Never send mail as the user without explicit permission.)

## 5. Current baseline and stop gates

1. Last verified bad family-world behaviour: client/server freezes, absent game listeners and Elrothiro invalid login; **current desktop state has not been independently checked this session**.
2. Existing [family client](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-bot-bench/fred-george-family-client.mjs) dispatches four-point walks, not full native quest decisions.
3. Existing `main` [FredGeorgeBot.test.ts](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.test.ts) gives Cook's Assistant ingredients directly using `george.invAdd`. This **cannot** establish unassisted quest completion. Draft [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) corrects the acceptance expectation, not the full gameplay implementation.
4. The [16Z hourly report](https://github.com/Parris-Tech-Services/JoshRS/blob/main/reports/fred-george/hourly/2026-11-01T16Z/report.md) has **0/12 snapshots**, not proof either bot did anything during that period.
5. The proper sequence is **restore family server -> safe adapter -> legitimate disposable Cook's Assistant -> live one-bot proof -> seven-bot rollout -> AI policy/supervisor and dashboard**.

## 6. Evidence required to close each stage

- **GITHUB-DONE:** Source committed and read back, diff inspected, compatible licence/attribution, relevant CI green (with commands that truly test changed code).
- **RUNTIME-TESTED:** Custom #377 engine successfully booted and ran the actual native tests with fully logged outputs and normal game mechanics.
- **FAMILY-WORLD-VERIFIED:** Actual player/client observed, legitimate items/XP/quest journal and save/relog confirmed, no production save damage, stable game listener and no forced user disconnection.
- **BLOCKED:** Name the specific missing tool, failing test, user permission or source content and preserve progress for the next worker.

**Do not collapse GITHUB-DONE into FAMILY-WORLD-VERIFIED.**

# Best no-cheat RuneScape 377 bot and autonomous QA benchmark

Research date: **1 November 2026**. Status: **research and offline reporter prepared; no live skill/quest runs yet**.

## Deduplication: what the repo had already done

- [Luna intelligent bot and duel research (31 Oct)](LUNA_DUEL_AND_SMART_BOTS_2026-10-31.md) evaluated 2004SP Progressive, Luna-RS, RS-SDK, Microbot and PvP-SDK. It proposed behaviour/reflex/skill systems but provided no real JoshRS XP-per-hour data or comprehensive quest-solving evidence.
- [One native 377 woodcutter](../377_ONE_BOT_WOODCUTTER.md) used an ephemeral player, native APLOC script, obtained a log and internal XP in a disposable world. It is **not** an all-skill bot and supplied a bronze axe to the ephemeral player. That would disqualify its initial conditions from a strict fresh-account, no-free-item benchmark.
- [Historical quest completeness audit](../377_OPEN_SOURCE_GAMEPLAY_COMPLETENESS_AUDIT_2026-10-31.md) and [issue #28](https://github.com/Parris-Tech-Services/JoshRS/issues/28) found **104 era quests**, but NOT 104 verified playable quests. Quest source-root counts are not completion counts.
- [Parallel-agent ownership](PARALLEL_AGENT_HANDOFF_2026-10-31.md), [broken interaction backlog #29](https://github.com/Parris-Tech-Services/JoshRS/issues/29), [live-test evidence #30](https://github.com/Parris-Tech-Services/JoshRS/issues/30), [Luna #34](https://github.com/Parris-Tech-Services/JoshRS/issues/34) and [Party Chest data-loss issue #52](https://github.com/Parris-Tech-Services/JoshRS/issues/52) prohibit uncoordinated modification of local players and active server state.

**New scope here:** rigorous no-cheat suitability assessment; a fair time-based benchmark of all **21** period skills; an end-to-end historical quest target; an executable offline scorer that compiles received gameplay observations into rates, completion evidence and bug candidates. Avoid adding a duplicate bot system to the existing local Windows runtime.

## Verdict: strongest references, not a drop-in "best bot"

**No candidate is currently independently verified to train all 21 skills and finish all 104 quests on the user's personalised 377-wip Lost City server without cheats.** Evaluate parts, not marketing claims.

| Candidate | Strongest verified architectural point | Critical gap for JoshRS / no cheats |
|---|---|---|
| [2004SP Progressive](https://github.com/2004sp/2004sp-progressive) | **Best Lost City/TypeScript planning reference**: inspected [BotGoalPlanner](https://github.com/2004sp/2004sp-progressive/blob/dev/bundled/progressive/engine/src/engine/bot/BotGoalPlanner.ts), [task modules](https://github.com/2004sp/2004sp-progressive/blob/dev/bundled/progressive/engine/src/engine/bot/tasks/Index.ts), [BotAction](https://github.com/2004sp/2004sp-progressive/blob/dev/bundled/progressive/engine/src/engine/bot/BotAction.ts), and [BotDebugService](https://github.com/2004sp/2004sp-progressive/blob/dev/bundled/progressive/engine/src/engine/bot/debug/BotDebugService.ts). Has native walk/interact calls and failure-event tracking. | 2004/254-era **19 skills**, not 377's 21. Exposes **addXp, addItem, removeItem, clearBackpack** helper actions and emergency **teleportToSafety / teleportNear**. They must be excluded or fully audited so a direct effect is never treated as a legitimate training action. Published "questing" claim does not establish 104 end-to-end quest solvers. |
| [Luna-RS](https://github.com/luna-rs/luna) | **Best matching revision-377 bot-brain reference**; [BotBrain](https://github.com/luna-rs/luna/blob/master/src/main/java/io/luna/game/model/mob/bot/brain/BotBrain.java) selects activities/coordinators and reflexes. | Independent Java/Kotlin server, not a compatible plug-in for Lost City's TypeScript engine. Its README warns of instability. Different from the locally named Luna companion. |
| [RS-SDK](https://github.com/MaxBittker/rs-sdk) | **Best outcome-observation/agent-control API**; distinguishes command dispatched from effect observed. | Runs its own fork/client and explicitly changes XP curve, run energy and potentially game ticks. Cannot use its raw performance statistics as JoshRS rates. |
| [RuneBench](https://github.com/MaxBittker/runebench), [published study](https://maxbittker.github.io/runebench/) | **Best skill-rate benchmark methodology**: tracked/verified XP, repeatable agent tasks. | Tests **16 skills**, at **8x speed/25x XP** in its tasks; rewards the **best 15-second XP window**, not ordinary sustained 1x XP/hour. Transfer the measurement principles, NOT results. |
| [Microbot](https://github.com/chsami/Microbot) | Broad modern RuneLite scripting and quest-helper ecosystem. | OSRS-specific client/runtime, modern scripts/opcodes; a quest-helper is not automatic quest completion and is not a 377 client. |
| Existing [JoshRS native woodcutter](../377_ONE_BOT_WOODCUTTER.md) | Closest actually compiled disposable 377 proof of an engine-driven legitimate tree interaction. | Single skill; no automated axe acquisition, banking, persistent account or quests. |

**Recommendation:** retain exact JoshRS 377 engine/content; build a new **isolated test-account agent** which learns from 2004SP planner/debugger and RuneBench measurement, uses a normal 377 client/ordinary player actions, and validates outcomes against read-only server observations. An LLM is optional for planning only, and must never get privileged world mutation tools. Do not install another bot bundle or overwrite the existing Luna/Player code.

### Strict no-cheat contract

1. Test only in a separate disposable clone with **fresh account made through normal registration**. Preserve Elrothiro and Sylvie, their inventories, accounts and saves, production runtime, and ongoing player sessions. No automated server stop or restart.
2. **Legal actions only**: normal walk/collision, NPC/object/item interaction, banking, buying, gathering, crafting, fighting, dialogue, ordinary spells and paid transport. Every resource and prerequisite must be acquired naturally, not injected.
3. **Prohibit direct XP/stat/item/quest grants, direct teleport/position writes, save edits, console cheat commands, boosted XP, shortened ticks, infinite energy, preseeded gear/coins, silent death protection, changing normal quest flags or generating loot.** In-source original script consequences of normal inputs are allowed; planner-initiated direct mutation is not.
4. Server-side quest/XP observations are permitted as **read-only independent proof**, not instructions that set a state. A queued action alone is never success: confirm actual item, XP, movement or quest-stage changes.
5. Exact source commit SHAs and real native tick, state + resource movement, physical elapsed time, and normal mechanics must be independently checked. A self-reported bot header cannot prove the bot didn't secretly cheat.
6. Never run this against official Jagex servers.

## How quickly could bots level each skill?

**UNKNOWN until measured on JoshRS at 1x speed.** Historic/OSRS websites, 2004SP, RuneBench and RS-SDK do **not** supply valid rates for this particular incomplete 377 game. Standard level 99 is **13,034,431 XP**, with individual starting XP (especially Hitpoints) read from a genuine new character, not assumed. Sources: [XP table](https://oldschool.runescape.wiki/w/Experience) and [skill release chronology](https://oldschool.runescape.wiki/w/Skill).

On **2 May 2006**, the historical revision-377 snapshot has **21 skills**. Slayer and Farming had been released; Construction (31 May 2006), Hunter (21 Nov 2006) and modern Sailing were not yet released. Do not count additional skills without proof of later-era additions to this private world.

Test each skill's *normal* progression, including resources and bank trips:

| Skill | Normal initial objective / first measurable proof |
|---|---|
| Attack | Acquire weapon normally, accurate combat; observed Attack XP |
| Strength | Aggressive combat style, valid kill/damage and Strength XP |
| Defence | Defensive style, valid target and Defence XP |
| Hitpoints | Earn natural HP XP from other combat; verify starting baseline |
| Ranged | Buy/craft bow and ammo, consume it in ordinary attacks |
| Prayer | Obtain dropped bones and bury them; bones disappear as XP rises |
| Magic | Acquire real runes and cast valid spell; rune cost, effect and XP |
| Cooking | Fish/buy raw food, use fire/range; success/burn handling |
| Woodcutting | Obtain axe via normal shop/spawn, chop and bank logs |
| Fletching | Obtain knife/log and fletch via normal item interactions |
| Fishing | Obtain fishing tool/bait; spots, catch, full inventory |
| Firemaking | Obtain tinderbox/logs; valid tile, fire creation and XP |
| Crafting | Legitimately acquire supplies, craft hide/pottery/jewellery |
| Smithing | Mine/buy ore, smelt bar, forge item; item costs and XP |
| Mining | Obtain pickaxe, mine rock; depletion and respawn |
| Herblore | Meet real quest unlock/level requirements, clean/mix herbs |
| Agility | Use course obstacles in correct order; failure and course bonus |
| Thieving | Pickpocket or stalls, stun/failure/damage, acquired item |
| Slayer | Get genuine Slayer master task, kill eligible monsters, task advances |
| Farming | Obtain seeds/tools, grow, protect/harvest on natural *wall-clock* cycle |
| Runecrafting | Obtain talisman/essence, reach altar and craft native runes |

**Benchmark protocol:** start with 15-minute functionality checks and a 60-minute sustained session per skill; three runs each, same fresh-character profile and world rules. Record fresh start inventory/stats/quest journal; true server XP snapshots, game inputs and resulting inventory/bank/quest states, death/wait times and interruptions. Record levels 10, 20, 40, 60, 80 and 99 (once actually attained). Report median XP/hour and between-run spread, not imagined averages. The comparison metric:

**Wall-clock XP/hour = ((XP_after_tenths − XP_before_tenths) / 10) × 3600 / elapsed_real_seconds.**

Native 377 internally records XP in tenths. Include walking, banking, buying, skill requirements, downtime and failures in denominator; Farming needs wall-clock growth time, not misleading "active-only XP/hour". RuneBench's peak 15s rate is auxiliary and **not** sustained XP/hour. Time to 99 can only be estimated with caveats after real rates across multiple level brackets; no static extrapolation from a single low-level session should be called "normal level 99 time".

## Goal: attempt every historical quest and report anything broken

**Historical denominator: 104** May-2006 quests from prior [quest audit](../377_OPEN_SOURCE_GAMEPLAY_COMPLETENESS_AUDIT_2026-10-31.md), not 104 proved present in the installed emulator. Build the explicit quest catalogue from *historical title/ID, actual game journal, content source and genuine start/end/award scripts*. Classify each as NOT PRESENT, NOT TESTED, PREREQUISITES BLOCKED, IN PROGRESS, UNIMPLEMENTED, REPORTED COMPLETE (UNVERIFIED), or VERIFIED COMPLETE. Do not divide quest-folder count by 104 to claim implementation success.

For each quest the agent must obtain required items, meet normal levels and prerequisite quests, traverse the world, talk to NPCs, follow genuine dialogue and solve interactions. A quest requiring a second player must use a second **normal** test account. A successful quest requires completed in-game journal **and** persisted state observed after normal logout/relogin, plus expected rewards or quest points when applicable. Do not mark a quest finished on a direct varp edit or a screenshot of its journal alone.

Potential **research-only** missing logic roots previously found: quest_100, quest_fever, quest_mm, quest_mortton, quest_mourning2, quest_rd. Scripts might be elsewhere; don't label missing without cross-tree search and test.

Use a dependency graph and stop on genuine blockers; do not skip required items, fight requirements, travel rules or cheat past broken quest stages. Record actual starting stage, NPC/loc ID, opcode, expected vs observed response and exact content/build SHA. Mark blocked quest as a reproducible issue, **not** a successful completion.

## Automated bug/error reporting and current working code

The new [offline benchmark reporter](../../tools/rs377-bot-bench/report.py) is a **real runnable script**, not a live bot. It accepts per-run **private JSONL** facts emitted by a future local normal-action agent and writes both a Markdown scoreboard and machine-readable JSON. The 21 skills are displayed even without observations, explicitly marked **NOT MEASURED**. Quests are VERIFIED COMPLETE only after independent journal and persistence flags; action errors and **three repeated matching failures** become SUSPECTED BUG candidates; individual failures remain REVIEW.

Header must declare: a unique non-personal run_id; exact engine_sha and content_sha; normal tick_ms; xp_multiplier=1; cheats_enabled=false; admin_changes=false; seeded_items=false; accelerated_time=false; disposable_test_account=true; isolated_test_world=true. The reporter rejects explicit privileged action names, mixed runs, malformed timestamps and unknown skills. These attestations are **not** tamperproof, so source review and observational spot checks remain necessary.

Minimal private JSONL **format example only — these are NOT real measurements** (one JSON object per line):

    {"type":"run","run_id":"benchmark_001","engine_sha":"b5ac859b47915afb545e60e4c1208f25d43cb3fb","content_sha":"44eab09081ef0f6c5f3eaabd1897a588ad7d9e50","tick_ms":600,"xp_multiplier":1,"cheats_enabled":false,"admin_changes":false,"seeded_items":false,"accelerated_time":false,"disposable_test_account":true,"isolated_test_world":true}
    {"type":"xp","run_id":"benchmark_001","ts":"2026-11-01T05:00:00Z","skill":"Woodcutting","xp_tenths":0}
    {"type":"xp","run_id":"benchmark_001","ts":"2026-11-01T05:15:00Z","skill":"Woodcutting","xp_tenths":0}
    {"type":"action","run_id":"benchmark_001","ts":"2026-11-01T05:15:01Z","task":"Woodcutting","method":"oploc1","target":"Tree","status":"timeout","reason":"No progress"}
    {"type":"quest","run_id":"benchmark_001","ts":"2026-11-01T05:16:00Z","quest":"Cook's Assistant","state":"started","journal_complete":false,"persisted":false,"stage":"started"}

Run with Python 3.10+ from repo root:

    python tools/rs377-bot-bench/report.py --events PRIVATE_EVENTS.jsonl --out PRIVATE_REPORT_DIRECTORY
    python -m unittest discover -s tools/rs377-bot-bench/tests -v

The reporter produces report.md and report.json locally. For future quest coverage, pass an independently verified JSON array of historical titles via --quest-catalog: absent observations remain NOT_TESTED, never "failed" or "complete". No live secrets or player data should go to GitHub. Do **not automatically file public GitHub issues** from raw local events. A local agent should send a redacted repro to a human-approved issue workflow. The future bot driver should emit explicit error events for 120s+ action stalls, repeated path loops, missing action handlers, item mismatch, unexpected quest state and fatal engine exceptions; ordinary task gates and waiting for crops are not bugs. Cap retries, stop affected quest, proceed to independent tasks.

### Controlled integration order — no surprise production changes

1. Read the current active Windows 377 runtime via active.json **without modifying it**. Coordinate Agent 2 (Luna/bots), Agent 3 (backups/QA), and avoid overlapping changes in Player.ts, BotPlayer.ts or NPC/quest scripts. Respect Party Chest loss investigation.
2. Use an isolated, backed-up world plus freshly registered account. Start by replacing the old synthetic pre-equipped woodcutter with genuine tool/shop acquisition and tree interaction. Validate 15-minute play + exact report.
3. Add banking, safe navigation, combat, crafting and quest UI support *through native player actions only*. Instrument per-action outcome verification and emit private JSONL event records, then benchmark each of 21 skills.
4. Extract and validate historical quest catalogue, tackle Cook's Assistant from start to persistence, then dependency-tracked quests. File precise bugs with repro; do not invent missing quest content or set quest flags.
5. After real QA, review effect on existing saves and multiplayer and schedule a deliberate optional install; never interrupt the live world. Report percentages only with actual verified denominators.

**Delivery gates as of this commit:** Research/new measurement specification and offline scorer + tests present. No authenticated all-skill or all-quest 377 agent installed; no measured XP/hour values; no quest completion proven here. Only claim VERIFIED PLAYABLE after real client actions and persistent state confirmation.

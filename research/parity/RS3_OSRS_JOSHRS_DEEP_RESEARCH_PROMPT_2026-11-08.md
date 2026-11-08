# Deep research prompt — exhaustive RS3 vs OSRS vs JoshRS feature and content gap analysis

**Prepared:** 8 November 2026 (Australia/Sydney)  
**Repository:** https://github.com/Parris-Tech-Services/JoshRS  
**Purpose:** A reusable research assignment, **not** a completed audit or a claim that every identified feature should be ported.  
**Central question:** **What exists in RuneScape 3 and modern Old School RuneScape that is absent, incomplete, inaccessible, broken, unverified, or deliberately excluded from each separate JoshRS experience?** Report this at the level of *individual* quests, NPCs, items, skills, abilities, places, interactions and mechanics, not just broad feature headings.

> **COPY/PASTE RESEARCH PROMPT — BEGIN**
>
> You are a multidisciplinary MMORPG historian, reverse-engineering researcher, content auditor, gameplay QA specialist, systems designer and software engineer. Conduct the deepest practical, source-backed comparison of **current RuneScape 3 (RS3)**, **current official Old School RuneScape (OSRS)**, and **JoshRS**. Work systematically and independently; do not stop at a generic comparison or a list of popular features. Create a reproducible, granular and continuously extendable catalogue of *everything relevant* in both reference games and reconcile every entry against the actual JoshRS code, pinned upstream source and player-visible behaviour. Enumerate individual entities and subfeatures. Research current game content through the date of execution, record that cutoff and revision/date for each source, and preserve historical distinctions. Do not assert that a feature works merely because a name, config, test fixture, PR or script exists.
>
> ## 1. Establish the true scope before comparing anything
>
> JoshRS is **not a single game/revision**. Track these targets in separate columns and reports:
>
> 1. **JoshRS historical/reference design:** adopted BASE-02 reference **23 November 2004 / revision 274**, locked in docs/REFERENCE_VERSION_LOCK.json. Modern features are *comparators and optional roadmap candidates*, not automatically missing requirements. The 274 reference and the MIT project's independently licensable visual/gameplay goals must remain distinct.
> 2. **JoshRS customised, private, locally playable revision-377 world:** approximate **May 2006**, based on the explicitly pinned LostCityRS 377 source plus local Windows/Fedora changes. This is the priority target for an evidence-backed 2006 completeness audit. Do not confuse it with the 274 baseline, the public web launcher or any public RS3/OSRS server.
> 3. **JoshRS independently authored Woodlands browser RPG/MMO:** assess against current design and implementation; it is a separate original game, not proof the 377 server contains anything.
> 4. **JoshRS public launcher/hosted site and experimental browser/Android/streaming integrations:** evaluate independently as launchers/clients/transport, not as deployed versions of the full revision-377 world.
> 5. **RS-SDK experiments:** distinguish the **revision-225** RS-SDK server used in some quest-bot experiments from the **377** private world and its SDK adapter. Do not transfer counts, live proofs, account states or achievements between versions.
>
> Establish the precise branch, commit SHA, pins, deployment, date, client, content pack, active server and save location for every target. If the host runtime or private desktop files are inaccessible, clearly mark **LIVE NOT INSPECTED**, never quietly infer them from GitHub.
>
> Read first: README.md; AGENTS.md; docs/REFERENCE_VERSION_LOCK.json; docs/REFERENCE_VERSION_274.md; deploy/jparris-windows/upstreams.json; docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md; docs/377_CONTENT_FACTORY.md; research/rs377/QUEST_QUEUE_2026-11-08.md and companion JSON; research/rs377/NPC_DIALOGUE_AUDIT_2026-11-08.md and companion JSON; research/rs377/UNFINISHED_WORK_REGISTER_2026-10-31.md; docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md; docs/rs377/NO_CHEAT_AUTONOMOUS_BOT_BENCHMARK_2026-11-01.md; tools/rs377-npc-dialogue-audit/; tools/rs377-chatgpt-bridge/; tools/rs-sdk-quests/; current PRs/issues/CI and pinned LostCity content/engine/client source.
>
> **Existing 8 November leads to verify, not facts to extrapolate:** the source-derived 377 quest queue reports **104** historical quest-list entries, **77 COMPLETE-VERIFIED at its documented audit level**, **4 stubs** and **23 not started**; its labels do not by themselves establish real fresh-account quest completion. The NPC audit lists **3,850 NPC definitions**, **1,799 Talk-to definitions** and **673 without the particular expected direct/ancestor Talk-to handler**; this is a useful candidate set, **not proof 673 NPCs are broken in-game**, because categories, alternate handlers, morphs, scripts and actual reachability matter. Reconcile more recent commits and work in progress before using any number.
>
> ## 2. Establish authoritative, up-to-date reference inventories
>
> Use official Jagex game/patch notes, OSRS Wiki, RuneScape Wiki and historical version sources, plus named, licensed GitHub upstreams and actual JoshRS source. Start with:
>
> - https://oldschool.runescape.wiki/ and https://oldschool.runescape.wiki/w/Quests/List
> - https://runescape.wiki/ and https://runescape.wiki/w/List_of_quests
> - https://oldschool.runescape.wiki/w/Skills and https://runescape.wiki/w/Skills
> - https://oldschool.runescape.wiki/w/Collection_log
> - https://www.runescape.com/ and https://oldschool.runescape.com/
> - https://github.com/LostCityRS/Content and https://github.com/LostCityRS/Engine-TS (exact pinned revisions, not unpinned latest)
>
> Verify every aggregate count against its dated source. At document creation, public wiki snapshots included **184 OSRS quests (8 September 2026)** and **277 RS3 quests (28 September 2026)**, but these are **dated examples, not permanent denominators**. Both games continued receiving 2026 updates. Check all updates up to research execution, including OSRS Sailing and later content, and RS3 modern quest/story/world updates. Track retired, seasonal, limited-time, event-only, reworked and unreleased content separately. Include all historical eras needed to judge revision 274 and revision 377 legitimately.
>
> Where an official/wiki category or permitted API supports enumeration, paginate *all* results and reconcile category members, redirects, aliases, duplicates, variant IDs and missing pages. Record source URL, source date, extraction method, last page/cursor, raw count, unique count and exclusions. Never claim global exhaustiveness from a limited search result or a handful of wiki pages. Respect website/API usage rules, licensing and rate limits. Use a second corroborating source for surprising or critical assertions. Do not copy protected game text or assets into this repository.
>
> ## 3. Inventory EVERYTHING, down to specific IDs and behaviours
>
> Build a comprehensive **per-game, per-version master catalogue** across the following categories. Every numbered category below is a minimum, **not a ceiling**. Add newly discovered categories, mechanics and content without waiting for approval.
>
> ### A. Every skill, XP system and training method
>
> Record each named skill separately for RS3, OSRS, 2004/274, 2006/377 and JoshRS Woodlands; track original introduction date, caps (99/110/120/virtual), XP curves, prerequisites, boosts, skillcapes/master capes, training methods, interactable nodes, skilling objects, processing recipes, timers, failure rates, products, level unlocks, minigames, quests, guilds, tool tiers and progression loops.
>
> Explicitly include melee combat skills; Ranged; Magic; Prayer; Hitpoints/Constitution; Woodcutting; Firemaking; Mining; Smithing; Fishing; Cooking; Crafting; Fletching; Runecrafting/Runecraft; Agility; Thieving; Herblore; Farming; Construction/player-owned house; Hunter; Slayer; and the version-specific systems **Summoning, Dungeoneering, Divination, Invention, Archaeology, Necromancy and OSRS Sailing**. Enumerate RS3 elite/artisan systems, rituals, relics, perks, augmentations, familiar mechanics, portables, skilling outfits and alternative methods; OSRS Sailing voyages/boats/activities, contracts and unlocks where current sources support them. Distinguish source-game-only mechanics from historically appropriate 377 requirements.
>
> ### B. Every quest, subquest, miniquest and storyline
>
> Catalogue **every** RS3 and OSRS quest separately with stable wiki/page reference, canonical title, release/rework dates, series, difficulty, membership, requirements, prerequisite graph, start NPC, start tile/area, numbered stages, dialogue *function* (not transcript), choices, items, puzzles, enemies, cutscenes, branching outcomes, triggers, varps/varbits, completion reward, post-quest changes, persistent state and replay/repeatability. Include 2004/274 and 2006/377 original versions when quests differ. Include RS3 lore continuations, OSRS-only storylines, holiday/seasonal content, miniquests, Recipe for Disaster subquests, quest journals, skill/combat/transport unlocks, and all quest points.
>
> For **all 104 revision-377 quest-list entries**, test eligibility to start, every stage transition, alternate branch, combat/puzzle, completion, QP/XP rewards, post-completion effects and logout/relogin persistence. Do not equate file existence or the quest-list button with functional completion. Audit all 4 stubs, 23 not-started entries and any later updates to those counts. Cross-reference real NPCs, map objects, item IDs, doors/teleports, instances and quest scripts. Find missing pieces *inside* partially functioning quests, not just whole missing quests.
>
> ### C. Every NPC, monster and creature variant
>
> Enumerate **all NPC IDs and distinct variants**, including human characters, quest NPCs, bosses, guardians, shopkeepers, bankers, guards, followers, pets, familiars, summonables, tutorial characters, random events, ambient residents, cutscene-only entities, spawned/morphed forms, attackable creatures and invisible/service NPCs. Capture display names, debug symbols, version-specific IDs, levels, combat style, stats, equipment, inventory/shop stock, drops, spawn map/tile/plane, conditions, patrol/AI, schedules, hostility, dialogues/options, death/respawn and quest stages.
>
> Audit each interaction **Talk-to, Trade, Bank, Attack, Pickpocket, Follow, Inspect/Examine, Challenge, Pick-up, service, option 1–5**, etc. For source-only gaps, follow category inheritance, alternate triggers and reachable morphs. For every allegedly missing Talk-to handler, determine whether the NPC is spawned, whether a user can select the action, whether a legitimate alternate handler handles it, and what actually happens on a client. Track *conversation trees and functional choices* without committing proprietary dialogue text.
>
> ### D. Every item, equipment, container, resource and recipe
>
> Enumerate **all** item IDs and variations in RS3, OSRS and baseline 377: quantities, stackability, tradeability, destruction, noted/certified forms, weight, examine semantics, ownership/binding, alchemy/disassembly, equipment slots, attack/defence/strength/magic/ranged/necromancy stats, ammo, runes, potions, prayers, food, herbs, seeds, ores, bars, logs, fish, bones, clues, keys, tools, coins, currencies, dyes, pets, quest items, minigame rewards, boss loot, skilling resources, cosmetics and holiday items. Include degradable/chargeable/repairable equipment, upgrades, set effects, recipes, production chains, use-on interactions, fires/forges/anvils/workstations, farming crops and correct death/drop/gravestone behaviour.
>
> Do **not** equate similarly named IDs across revisions. Map item identity by source version and behaviour. Include unobtainable, deprecated and test-only entries as separate classifications. Measure whether an item is in configs, obtainable through normal play, usable, correctly consumed, bankable, equippable, tradeable and persistent.
>
> ### E. Combat, abilities, PvM and PvP
>
> Compare historical turn/tick mechanics, attack speed, hit chance, damage, combat triangle, melee/ranged/magic weapon classes, special attacks, prayer, potions, poison/venom, burn/bleed, freezing, stuns, protection, resistances, safe spots, pathfinding, LOS, projectiles, multi-combat, aggro, boss phases, death, loot, gravestones, safe/unsafe deaths, duelling, minigame PvP, Wilderness, skulls, clans, bounty/revenants, PvP worlds, PvP Arena/Last Man Standing, RS3 EoC action bars and thresholds, adrenaline/revolution/manual input, legacy combat and abilities, Necromancy incantations/conjures, Summoning familiars and OSRS spellbooks/runes/special attacks.
>
> List every named OSRS/RS3 boss, raid and major encounter, quest boss, slayer monster and combat activity; then test mechanics, prerequisites, entry/exit, loot tables, reward tracking, repeated kills and persistence. Include Theatre of Blood, Chambers of Xeric, Tombs of Amascut, new raids released by the audit date, TzHaar/Inferno, Barrows, God Wars, Nex/Corporeal Beast, Wilderness bosses, RS3 boss hubs, elite dungeons, skilling bosses, solo/group scaling and encounter-specific puzzles. Many of these are **deliberately post-377**.
>
> ### F. World, map, housing, objects and transport
>
> Catalogue every continent, kingdom, province, settlement, dungeon, mine, guild, building, quest instance, house/POH, ship/sea zone, island, layer/plane, underground area, minigame lobby, teleporter, Fairy ring, spirit tree, gnome glider, canoe, minecart, railway, portal, obelisk, spell teleport, charter ship, agility shortcut, door, gate, ladder and staircase. Audit map square, loc ID, collision flags, doors, interior/exterior visibility, scenery interaction, world objects, ground items, spawn logic, instancing, cutscene transitions and travel costs. Track accessibility at player skill/quest stages and all pathfinding failures, not only map art presence. Account for RS3/OSRS geography diverging from 2006.
>
> ### G. Economy and progression
>
> Compare shops and stock regeneration, merchant dialogue, buy/sell formulas, player trading, price checking, bank interfaces, deposits/withdrawals, noted forms, placeholders, tabs, presets, shared-storage restrictions, money pouch/currency pouch, Grand Exchange and offers, auctions where applicable, ironman restrictions, loot chests, collection log, kill log, trade locks, taxes and sinks, item/value balancing, drop rates, high/low alchemy, skill efficiency, profit/hour, wealth progression and anti-duplication protections.
>
> ### H. Minigames, distractions, diversions and repeatable content
>
> Enumerate every named and retired minigame and every entry/exit/reward flow, including historical 377-valid activities and later Castle Wars, Pest Control, Barrows, Barbarian Assault, Trouble Brewing, Fishing Trawler, Tithe Farm, Tempoross, Guardians of the Rift, Wintertodt, Pyramid Plunder, Mage Training Arena, clue scrolls/treasure trails, shooting stars, Wilderness activities, RS3 D&Ds, player-owned ports, farms, Archaeology mysteries, Dungeoneering floors, seasonal bosses, timed events and any modern additions. Separate recurring dailies/weeklies/monthlies, reset conditions, reward points and account unlocks.
>
> ### I. Achievements, diaries, collections and account goals
>
> Quests/QP capes, OSRS achievement diaries, combat achievements, collection log slots, clue logs, boss logs, music/quest unlocks, RS3 achievements/titles, pets, trims, mastery, XP milestones, challenges, hiscores, leaderboards, completionist systems, skills/max cape, long-term progression, login streaks, time-gated collections and event achievements. Determine whether JoshRS has UI, event triggers, storage, rewards and anti-cheat evidence for each—not just a mock achievement panel.
>
> ### J. Social, multiplayer and player accounts
>
> Registration/authentication, account recovery, multiple characters, membership entitlements, friend/ignore lists, presence, private/public/friends/clan/group chat, chat filters and reporting, trading, cooperative quests, groups/parties, clans, guilds, shared houses, player interactions, emotes, pets, group PvM, world hopping, instancing, cross-world communication, channels, privacy, parental safety, moderation, anti-spam, server population, group ironman, UIM/HCIM/ironman modes, RS3-specific account modes, OSRS Leagues and seasonal temporary modes. Test two independently authenticated clients in the **same** server and verify observed actions from both sides.
>
> ### K. AI agents and automation (JoshRS-specific)
>
> Distinguish real autonomous player characters from scripted NPCs and fake/mock bot fixtures. Audit RS-SDK observer **nearby players, NPCs, objects, ground items, inventory, equipment, stats, quest journal, dialogue choices, bank/shop screens, combat targets/states, path, map, actions and errors**. Cover genuine normal revision-377 login, separate bot accounts, permission boundaries, no privileged rewards, action-result verification, reconnect, checkpoint persistence, multi-agent coexistence with Elrothiro/Sylvie, anti-stuck logic, goal planning, bank/shop/quest/skill automation, Windows Agent Manager lifecycle, logging and safe pause/stop. Flag every field still unobserved and every action without authoritative postcondition; no synthetic success claims.
>
> ### L. User experience, engine and operations
>
> Compare desktop/mobile input, camera/zoom, minimap/world map, menus/option priority, accessibility, keybinds, combat HUD, skill/quest interfaces, bank/shop/dialogue UI, settings, music player, soundscape, animations, combat effects, weather/day-night where applicable, rendering/culling, pop-in, performance/FPS and latency, loading, crash recovery, download/update/launcher, server tick reliability, database safety, reconnection, authentication, security, telemetry/metrics, bugs/exploits, backups/restore, hosting scalability and lawful publishing/licensing. Distinguish official-client features from third-party client extensions (e.g. RuneLite plugins) and never count community plugins as native OSRS features.
>
> ### M. Visuals, audio, narrative and monetisation comparisons
>
> World aesthetic, character customisation, animation rigs, emotes, graphics settings, UI themes, sound effects, voice/audio, music tracks, ambience, story exposition, cinematics and player immersion. Separately compare RS3 cosmetic unlocks, bonds, monetisation, shops, battle passes/event mechanics or other commercial services, **without assuming JoshRS should copy them**. Assess which ideas are desirable, which would compromise the historical reference, and which demand legal/licensing decisions.
>
> ### N. Hidden interactions and edge cases
>
> Input validation, item-on-object, item-on-item, object-on-NPC, NPC-on-item, multi-step crafting, bank capacity, full inventory, cancellation, race conditions, lag, disconnect mid-quest, death during minigame, door closing during path, quest prerequisite changes, multi-user simultaneous interactions, unusual skill boosts, inventory overflow, duplicate dialogs, map holes, improper NPC blocking, negative funds, persistence of temporary and permanent vars, and repeatable abuse. Test negative paths and rewards once-only.
>
> ### O. Historical, versioned, removed and cross-game-exclusive content
>
> Record exactly when an entity or feature entered/leaves RuneScape, whether RS3 and OSRS evolved different implementations from a shared RS2 ancestor, and whether it existed by 23 November 2004 or the May 2006 revision-377 cutoff. Classify as **274-appropriate**, **377-appropriate**, **OSRS-only later**, **RS3-only later**, **shared later**, **deprecated/seasonal**, **original JoshRS idea**, or **unknown**. Never recommend bulk importing a modern game into an older server without an explicit scope and rights decision.
>
> ## 4. Required machine-readable row schema
>
> Create a reusable and documented schema (CSV/JSON/Parquet or SQLite, plus readable Markdown views), with **one row per distinct game-version entity/behaviour**. At minimum:
>
> - **Identity:** category, subcategory, canonical display name, exact source-game-specific IDs, alternate IDs/names, parent entity, variant, source game, release/rework/retirement date, member/F2P/seasonal flag, revision range, source URL, checked date, source content hash if available.
> - **Function:** verb/interaction, preconditions, level/quest/area requirements, inputs, outputs, rewards, player-visible expected behaviour, persistent variables, dependencies, affected NPC/item/map/quest IDs, fidelity test and edge cases.
> - **JoshRS targets separately:** 274/design, 377/pinned upstream, 377/local custom overlay, 377/live runtime, Woodlands and public/browser clients; exact file paths/line ranges/commit SHA, relevant tests, local binary or pack hashes, screenshots/log evidence where authorised.
> - **Status for each target:** PRESENT_LIVE_VERIFIED; IMPLEMENTED_TESTED_NOT_LIVE; SOURCE_PRESENT_UNVERIFIED; PRESENT_BUT_BROKEN; PARTIAL; STUB_ONLY; ABSENT_CONFIRMED; UNKNOWN_NOT_AUDITED; NOT_APPLICABLE_HISTORICAL; DELIBERATELY_EXCLUDED; RIGHTS_BLOCKED. Add a separate **content-completeness percentage** only where a denominator and measurement protocol genuinely exist.
> - **Delivery:** category of gap (content, functional, UI, persistence, historical mismatch, rights, performance, multiplayer, client, bot-only), impact/severity, player-facing benefit, historical fit, priority P0–P4, effort estimate with uncertainty, recommended implementation approach, test recipe, blocker/owner, existing issue/PR, new task ID, last verified date and confidence (high/medium/low).
>
> Deduplicate stable entities across wiki aliases/variants and overlapping JoshRS trackers **without dropping independently testable variations**. Never add overlapping project checklists together as if they were unique missing features. Explain precisely which denominator each reported number measures.
>
> **Proposed comparison display:** Name | category | 2004/274 | 2006/377 | OSRS current | RS3 current | pinned 377 source | desktop 377 observed | Woodlands | true gap | priority | evidence | rights.
>
> ## 5. Evidence and verification — mandatory
>
> - A source name/ID is **not proof of implementation**; a script/config is **not proof of player-visible functionality**; a passing unit test is **not proof of live gameplay**; a PR merge is **not proof a version reached the host**.
> - For each high-value claim, trace config + handler + acquisition/location + server/client support + legitimate state changes + save/relog. Record negative evidence only after a scoped, reproducible search. Mark uninspected assets or sessions UNKNOWN rather than ABSENT.
> - Every quest must be independently checked with a fresh disposable account at suitable prerequisites, including stages, objectives, rewards and persistence. Retain existing custom player accounts and saves untouched.
> - Every shop requires a real Trade UI, valid stock, buy/sell, prices, inventory deltas, restart persistence where expected and protected edge cases. Every combat feature requires real target state, damage/death/XP/drop observations. Every NPC must be reachable for its claimed interaction.
> - Build reproducible read-only audits for enumerating pinned NPC/obj/loc/item/quest/skill/recipe definitions, handlers and spawn coverage. Source scans should cite files and SHA. Follow with isolated disposable runtime tests and authorised real-world acceptance.
> - Take immutable, verified backups before any live-world modification; do not read or publish passwords, keys, personal data, tokens, proprietary cache binaries, private player saves, database records or copyrighted game dialogue/music/assets. Do not destroy, reset, migrate or expose Elrothiro/Sylvie saves. The initial task is **research**, not permission for code deploys, restarts or private-server publication.
> - Respect existing AGENTS.md handoff, host-ownership and rights rules. Original independently authored content and licensed ideas can be planned; Jagex proprietary IP, private-server restrictions and third-party code licences are hard gates. Public JoshRS is a public GitHub repository: **no secrets or private account details in reports**.
>
> ## 6. Work in exhaustive, resumable passes
>
> **Pass 0 — freeze scope:** Get latest main SHA and open PRs; list access limits; confirm baseline pins/targets, source dates and legal constraints. Write a research checkpoint file.
>
> **Pass 1 — enumerate source reference universes:** independently list all RS3 and OSRS skills, quests, NPCs, items, abilities, map regions, boss encounters, activities, collections, UI/gameplay systems and other categories; paginate completely, store IDs/source references, and report category coverage. Don't start estimating JoshRS parity before the reference inventory is measurable.
>
> **Pass 2 — inventory JoshRS reality:** extract full index from pinned 274 and 377 content/engine, local overlays, Woodlands and published launcher; reconcile code, configs, tests, docs, CI and known field reports. Where the machine isn't accessible, keep a specific verification queue.
>
> **Pass 3 — semantic crosswalk:** match based on name, date, role/behaviour and prerequisites, never by coincidental item/NPC ID. Resolve shared historical quests versus RS3 reworks versus OSRS diverged content.
>
> **Pass 4 — classify every delta:** Present/partial/broken/stub/absent/unknown/deliberately excluded/legally blocked for *each* JoshRS target; identify prerequisites and cascading blockers (e.g. missing dialogue, quest state, map object, bank UI). Produce a true missing-content queue and a separate attractive future-feature catalogue.
>
> **Pass 5 — test sample then expand:** validate coverage with reproducible scripts and actual game observations, starting P0 save/login/quest/XP/NPC integrity and high-dependency quests/shops. Correct false positives from code-only analysis.
>
> **Pass 6 — plan implementations:** produce historical-377 repair sequence, separate original-game feature inspiration roadmap, and optional modern OSRS/RS3 feature expansions subject to rights and deliberate design approval. Small independently verifiable tasks, dependency-order and explicit acceptance tests.
>
> **Pass 7 — repeat and maintain:** checkpoint source URLs, timestamps, hashes, progress and gaps; enumerate new patches and PRs; refresh stale status and evidence. Keep old report revisions so a new count cannot silently replace an earlier denominator.
>
> ## 7. Concrete deliverables — create all, not just a narrative
>
> 1. **Executive assessment:** two-page readable overview of actual evidence, baselines, limitations, the largest player-visible deficits, and a table of sourced counts with denominator/version/date.
> 2. **Exhaustive master catalogues:** separate RS3 and OSRS inventory files with every enumerated unique row, plus historical 274/377 reference catalogue. Shard giant NPC/item tables instead of truncating or pasting a small illustrative list.
> 3. **JoshRS status crosswalk:** one master machine-readable, queryable table with columns in Section 4 and full provenance. Provide totals **per category AND per JoshRS target** with UNKNOWN shown and never included in confirmed-missing counts.
> 4. **104-quest 377 stage-by-stage audit:** quest-by-quest current progress, absent/stub/partial states, NPC/object/item dependencies, proof level, completion/relog test status and exact remaining work. Keep miniquests separate.
> 5. **Complete NPC and interaction audit:** all 377 definitions and reachable NPCs, candidates from the 673-dialogue-trigger scan, confirmed true failures versus handled alternatives, spawn/morph variants, dialogue/service/shop/combat gaps and area-by-area repair queue.
> 6. **Items/skills/combat/bosses/locations/activity/UI/social/AI separate reports** with real source references and top missing interactions. Avoid a quest-only audit.
> 7. **Dependency graph and prioritised backlog:** P0 data safety and basic usability, P1 2006 correctness, P2 content completion, P3 modern optional features, P4 polish. For each, include specific proof, effort uncertainty, acceptance test and suggested issue/PR grouping.
> 8. **Change/rights/unknown register:** all legally blocked, historically inappropriate, deliberately omitted, unverified host-only and inaccessible items; avoid labelling them defects.
> 9. **Interactive or easily filtered summary:** an HTML/CSV/JSON/dashboard or documented queries that let a person filter by game, revision, category, region, NPC/quest ID, status, evidence quality, priority and rights. Ensure no private content is published.
> 10. **Continuation checkpoint:** current SHA, searches completed, category source counts, remaining pages/categories, live-verification blockers, exact next commands/tasks, and a reproducible "how to update this" guide.
>
> Suggested report directory: **research/parity/**, with dated machine-readable inventories under **research/parity/data/**, a concise **SUMMARY.md**, category reports and an **EVIDENCE_AND_LIMITATIONS.md**. Do not overwrite or misrepresent existing 377 findings; cross-link rather than clone their full tables.
>
> ## 8. Priority questions to answer early
>
> - How many of the **104 historical 377 quests** are *truly completable in the installed revision-377 world*, and precisely which and why are not? How many are source-only versus live-tested?
> - From the **673 Talk-to trigger candidates**, how many unique, spawned, reachable NPC interactions *actually fail*, after inheritance, alternate handlers, morphs and recent patches are accounted for? Which essential quest/shop/service NPCs rank first?
> - Which skills are correctly trainable **from level 1 through the intended historical cap**, with tools, products, shops, equipment, level checks and persistence, not just XP increments?
> - What fraction of historical 377 item IDs are obtainable/usable/equippable/tradeable through intended play? Which critical resources and craft chains are impossible?
> - Which 2006 map regions, ladders, buildings, dungeons, shortcuts, boats and quest instances cannot actually be accessed? Which dead ends block quests or skills?
> - Which combat styles, prayers, spellbooks, bosses, drops, death cases, minigames and PvP systems are simulated rather than functional?
> - Is the SDK observing authoritative dialogue/bank/shop/combat/player/ground-item data, and can two independently authenticated agents actually perform and persist tasks beside the user's characters?
> - In which areas should JoshRS **stay deliberately faithful to 2004/2006**, and which modern quality-of-life ideas could be built as **original, legally independent enhancements**?
>
> ## 9. Final answer quality bar
>
> Deliver **specific names, IDs, numbers, citations, precise gaps and evidence links**, not an unranked wish list. Include representative examples in the prose but keep all thousands of individual entities in complete, searchable inventories. Say clearly **what has been checked, what hasn't, and how to check the rest**. If some data sources or the actual desktop are inaccessible, still complete the available source/API research and produce a resumable queue rather than declaring success or stopping to request information. No made-up coverage percentage, missing count, verified quest or implemented bot. **Research must be useful even if no live server is available.**
>
> **Conclude with:** (a) actual confirmed revision-377 deficiencies; (b) separate OSRS-only additions; (c) separate RS3-only additions; (d) shared later improvements; (e) Woodlands/original-game opportunities; (f) evidence gaps and rights blockers; (g) the next 20 smallest actionable, testable, high-value tasks.
>
> **COPY/PASTE RESEARCH PROMPT — END**

## How to use this document

Assign the quoted prompt to a deep research agent with access to the repository and current reference sources. The **first deliverable should be dated inventories and evidence**, not a speculative multi-year implementation commitment. Keep the 274 and 377 tracks separate and do not treat this document as a request to reproduce copyrighted RuneScape art, audio, caches or complete dialogue. Use a fresh dated research run for newer versions of OSRS and RS3.

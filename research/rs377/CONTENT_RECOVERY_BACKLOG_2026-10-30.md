# JoshRS revision 377 — historical content recovery backlog
**Prepared:** 30 October 2026 · **Audience:** Agy / JoshRS maintainers · **Status:** researched backlog, not implemented in running world.

## Critical scope and accuracy
- Revision 377 is **not** the same thing as the entirety of modern OSRS. Pin the actual game's supported scripts and cache first. Treat pre-cutoff content as *eligible for audit*, not automatically missing.
- Agy reported a compiled category ID mismatch, missing triggers, morph resolution defects, and broad temporary fallbacks in the personalised Windows runtime (not committed in this repository). These are **unverified reports** until audited against actual source and live log.
- Do not copy wiki dialogue transcripts, game assets, maps, music or other proprietary text into this MIT repository. Sources below are research pointers; write independently designed descriptions / functional state machines, obtain rights for exact replication if needed.
- Wiki pages reflect later edits; use release-date history and older revisions for precise 2006 behavior. **Never treat modern GE, diaries, 2026 dialogue rewrites or later mechanics as 2006 evidence.**
- Save compatibility, legitimate item consumption, quest locks, movement/collision, and multiplayer concurrency are acceptance gates for every implementation.

## Release-date gate (documented)
| Release | Feature | Classification for 377 | Research |
|---|---|---|---|
| 15 Mar 2006 | Recipe for Disaster | pre-existing candidate | https://runescape.wiki/w/2006 |
| 22 Mar 2006 | In Aid of the Myreque / Burgh de Rott | pre-existing candidate | https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date |
| 28 Mar 2006 | Temple Trekking | pre-existing candidate | https://runescape.wiki/w/2006 |
| 3 Apr 2006 | A Soul's Bane | pre-existing candidate | https://runescape.wiki/w/2006 |
| 10 Apr 2006 | Rag and Bone Man | pre-existing candidate | https://runescape.wiki/w/2006 |
| 18 Apr 2006 | Pest Control / Void Knights' Outpost | pre-existing candidate, check precise revision cut | https://runescape.wiki/w/Pest_Control |
| 2 May 2006 | Swan Song / Piscatoris Fishing Colony | pre-existing candidate; verify revision chronology | https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date |
| 16 May 2006 | Engine upgrade and Pest Control rule changes | future milestone (unless snapshot proven newer) | https://runescape.wiki/w/Update%3AChanges_to_Pest_Control |
| 22 May 2006 | Royal Trouble | future milestone | https://runescape.wiki/w/2006 |
| 31 May 2006 | Construction / POH | future milestone | https://runescape.wiki/w/2006 |
| 13 Jun 2006 | Warriors' Guild | future milestone | https://runescape.wiki/w/2006 |
| 21 Jun 2006 | Death to the Dorgeshuun | future milestone | https://runescape.wiki/w/2006 |
| 4 Jul 2006 | Stronghold of Security | future milestone | https://runescape.wiki/w/2006 |
| 11 Jul 2006 | Fairytale II | future milestone | https://runescape.wiki/w/2006 |
| 24 Jul 2006 | Lunar Diplomacy | future milestone | https://runescape.wiki/w/2006 |
| 31 Jul 2006 | Crossbow changes | future milestone | https://runescape.wiki/w/2006 |
| 21 Nov 2006 | Hunter | future milestone | https://runescape.wiki/w/2006 |

## P0 — eliminate *real* missing interactions safely
Run the existing trigger audit and export **observed** rows with `entity_type, name, definition_id, option, location, trigger, category, script_id, quest_state, current_result, desired_result, reference_url`. Preserve categories and source revision. Do not invent IDs or assume every deliberate default response is broken.

| ID | Candidate | Expected functional contract / test | Priority | Reference |
|---|---|---|---|---|
| INT-01 | bank booths and bankers | Bank option opens native bank only where authorized, account items persist across logout; no global broad bank-open fallback | P0 | https://oldschool.runescape.wiki/w/Bank |
| INT-02 | general stores | Trade option opens owned stock, buy/sell price/stock rules apply and gold/items conserved | P0 | https://oldschool.runescape.wiki/w/General_store |
| INT-03 | specialist shops | Each shopkeeper maps to correct store & stock; unavailable stores should not silently become general stores | P0 | https://oldschool.runescape.wiki/w/Shops |
| INT-04 | doors and gates | State toggles exact loc pair; collision updates; locked doors check key, quest state and relevant conditions; no generic removeLoc bypass | P0 | https://oldschool.runescape.wiki/w/Door |
| INT-05 | staircases/ladders | Destination is explicitly mapped (x,z,plane), respecting region transitions; never infer z ± 6400 or floor ± 1 generically | P0 | https://oldschool.runescape.wiki/w/Stairs |
| INT-06 | food and drinks | Consume only documented edible items; use correct heal, delay, animation & container; no generic heals for arbitrary items | P0 | https://oldschool.runescape.wiki/w/Food |
| INT-07 | item-on-item | Validate both item IDs, quantities, skill levels, inventory space; only consume ingredients after successful completion | P0 | https://oldschool.runescape.wiki/w/Crafting |
| INT-08 | furnaces and anvils | Recipes, smelting/smithing level gates, XP, bars/ores, interfaces and inventory changes consistent | P0 | https://oldschool.runescape.wiki/w/Smithing |
| INT-09 | trees and mining rocks | Native resource actions with level/tool/resource depletion/regrowth, deterministic XP and no duplicated items | P0 | https://oldschool.runescape.wiki/w/Woodcutting |
| INT-10 | fishing spots | Correct spot/options, equipment/bait, levels, catch table and animations | P0 | https://oldschool.runescape.wiki/w/Fishing |
| INT-11 | altars | Restore prayer through correct altar script with appropriate restrictions; no global default on all altar-like objects | P0 | https://oldschool.runescape.wiki/w/Prayer |
| INT-12 | NPC conversations | Per-NPC decision tree; once-off quest flags; backtracking/exit, talk-to/trade/pickpocket use distinct handlers | P0 | https://oldschool.runescape.wiki/w/Quests |
| INT-13 | quest pickups/containers | Search/open respects prior collection, quest stage, cooldown, full inventory and multiplayer ownership | P0 | https://oldschool.runescape.wiki/w/Quests |
| INT-14 | transport NPCs | Check fares, location, quest/skill requirements; move to exact destination; show sensible refusal dialogue | P1 | https://oldschool.runescape.wiki/w/Transportation |
| INT-15 | equipment & wearables | Equip slots, requirements, stat recalculation, restrictions, safe unequip on full inventory | P0 | https://oldschool.runescape.wiki/w/Equipment |

## P1 — quest-specific discovery matrix
These are *audit candidates*, **not claims of missing quests**. Capture quest-state machine from an appropriately historical source or local game and compare against current scripts before coding. No copyrighted dialogue transcripts are included.

| ID | Quest / major story | NPCs / interaction checkpoints to inspect | Acceptance gates / main source |
|---|---|---|---|
| Q-01 | Cook's Assistant | Cook at Lumbridge Castle; flour, milk, egg; ingredient hand-in, 1-time reward and journal persistence | https://oldschool.runescape.wiki/w/Cook%27s_Assistant |
| Q-02 | Sheep Shearer | Fred the Farmer; shears, sheep, wool-to-ball processing, hand-in | https://oldschool.runescape.wiki/w/Sheep_Shearer |
| Q-03 | Rune Mysteries | Duke Horacio, Sedridor, Aubury; talisman/notes hand-off, essence access; no later quest changes | https://oldschool.runescape.wiki/w/Rune_Mysteries |
| Q-04 | Prince Ali Rescue | Hassan, Osman, Leela, Lady Keli, Joe, Prince Ali; disguise/keys/guard conditions, Al Kharid gate access reward | https://oldschool.runescape.wiki/w/Prince_Ali_Rescue |
| Q-05 | Demon Slayer | Gypsy Aris, Sir Prysin, Delrith; sword/key chain, ritual and combat gate | https://oldschool.runescape.wiki/w/Demon_Slayer |
| Q-06 | Romeo & Juliet | Romeo, Juliet, Father Lawrence, Apothecary; correct quest-stage branching & potion hand-in | https://oldschool.runescape.wiki/w/Romeo_%26_Juliet |
| Q-07 | Ernest the Chicken | Veronica, Professor Oddenstein, levers and Manor puzzle objects; item-state transitions | https://oldschool.runescape.wiki/w/Ernest_the_Chicken |
| Q-08 | Goblin Diplomacy | Generals Bentnoze / Wartface; goblin mail dye and dialogue branch outcomes | https://oldschool.runescape.wiki/w/Goblin_Diplomacy |
| Q-09 | Doric's Quest | Doric; ore quantities and hand-in, access to anvil if appropriate | https://oldschool.runescape.wiki/w/Doric%27s_Quest |
| Q-10 | Witch's Potion | Hetty; ingredient collection, cauldron use, correct finalisation | https://oldschool.runescape.wiki/w/Witch%27s_Potion |
| Q-11 | Lost City | Warrior adventurers, Entrana rules, Dramen tree, staff crafting, Zanaris transport gate | https://oldschool.runescape.wiki/w/Lost_City |
| Q-12 | Dragon Slayer I | Guildmaster, Oziach, Klarense, Ned, Elvarg; map pieces, shield checks, boat repair and battle | https://oldschool.runescape.wiki/w/Dragon_Slayer_I |
| Q-13 | Druidic Ritual | Kaqemeex, Sanfew; enchanted meat preparation, Herblore unlock state | https://oldschool.runescape.wiki/w/Druidic_Ritual |
| Q-14 | Plague City | Edmond, Elena, Jethick, Mourner; Ardougne path / plague-gated interaction chain | https://oldschool.runescape.wiki/w/Plague_City |
| Q-15 | Biohazard | Elena, Jerico, chemist/guard checkpoints; correct sample handover and restrictions | https://oldschool.runescape.wiki/w/Biohazard |
| Q-16 | The Restless Ghost | Father Aereck, Father Urhney, ghost; amulet-of-ghostspeak gating and skull | https://oldschool.runescape.wiki/w/The_Restless_Ghost |
| Q-17 | Priest in Peril | King Roald, Drezel, temple and barrier; unlock Morytania and persistent passage | https://oldschool.runescape.wiki/w/Priest_in_Peril |
| Q-18 | Fishing Contest | Dwarven tunnel entrance, competition NPCs, fishing event and shortcut unlock | https://oldschool.runescape.wiki/w/Fishing_Contest |
| Q-19 | Waterfall Quest | Almera, Hudon, Golrie; inventory checks and dungeon gates; no quest-skip generic doors | https://oldschool.runescape.wiki/w/Waterfall_Quest |
| Q-20 | Tree Gnome Village | King Bolren, gnome defenders, Khazard general; orb stages and transport unlock | https://oldschool.runescape.wiki/w/Tree_Gnome_Village |
| Q-21 | Recipe for Disaster | Lumbridge dining room, subquests, frozen dinner guests, ingredient/quest conditions | https://oldschool.runescape.wiki/w/Recipe_for_Disaster |
| Q-22 | In Aid of the Myreque | Burgh de Rott regional NPCs, rebuilding supplies and gate/transport stages | https://oldschool.runescape.wiki/w/In_Aid_of_the_Myreque |
| Q-23 | A Soul's Bane | Tolna, dungeon emotion stages, battle/dialogue/exit gating | https://oldschool.runescape.wiki/w/A_Soul%27s_Bane |
| Q-24 | Rag and Bone Man | Odd Old Man, bones and cleaning processor, rewards/journal stages | https://oldschool.runescape.wiki/w/Rag_and_Bone_Man_I |
| Q-25 | Swan Song | Wise Old Man, Piscatoris colony and cave, combat & fishing unlocks; verify snapshot timing | https://oldschool.runescape.wiki/w/Swan_Song |

**Quality note:** OSRS wiki is useful for gameplay discovery but several pages have been altered (Prince Ali Rescue dialogue and key mechanics changed in 2022/2026). Confirm *2006* details with historical revisions before using exact requirements.

## P2 — 2006 expansion, consciously gated behind baseline repair
1. **16 May engine/Pest Control changes:** combat level/damage eligibility, cap on commendation points, enemies and portal interaction; differentiate 18 Apr launch behavior from 16 May update. https://runescape.wiki/w/Update%3AChanges_to_Pest_Control
2. **Royal Trouble, 22 May:** quest stage / Miscellania favour and resource systems. https://runescape.wiki/w/Royal_Trouble
3. **Construction, 31 May:** house ownership, hotspot building, materials, furniture state and instance isolation; no cross-player leakage. https://runescape.wiki/w/2006
4. **Warriors' Guild, 13 Jun:** admission thresholds, tokens, animators and Cyclops. https://runescape.wiki/w/2006
5. **Stronghold of Security, 4 Jul:** four-floor progression, gated rewards and authentication-history differences. https://runescape.wiki/w/2006
6. **Lunar Diplomacy, 24 Jul:** Lunar Isle NPCs, quest and spellbook switch, runes, cooldowns/targeting. https://runescape.wiki/w/2006
7. **Crossbows, 31 Jul:** equipment/ammunition compatibility and combat requirements. https://runescape.wiki/w/2006
8. **Hunter, 21 Nov:** separate late-2006 expansion, not a 377 restoration task. https://runescape.wiki/w/2006

## Agy implementation contract
1. Read `runtime/jparris-377/active.json` **on JParris Desktop**, inspect the recorded *actual* engine/content/client directories; runtime is gitignored. Do not accidentally patch clean source or an obsolete Fedora path.
2. **No touching live world before snapshot:** back up SQLite including WAL/SHM and all player saves. Never copy running SQLite files as a substitute for consistent backup without checking transaction state.
3. Inventory existing definitions (all.npc/all.loc/all.obj), scripts, compiled packs and `No trigger for` log. Report **which IDs are genuinely absent** and whether each candidate exists already. Cross-check source cache timestamp/revision.
4. For each candidate, implement one coherent script with explicit item IDs/quantities, spatial checks, prerequisite quest state, animation, delays, exact destination or NPC shop association, and **no arbitrary global fallback**.
5. Add deterministic tests for success, insufficient inventory, wrong quest state, multiple players, restart/save roundtrip and duplicate reward prevention.
6. Distinguish `VERIFIED LOCAL TEST`, `VERIFIED LIVE`, `RESEARCH ONLY`, `NOT PRESENT IN REVISION`, `BLOCKED BY ASSETS`. Do not report a quest complete merely because a fallback message disappeared.
7. For any adaptation requiring historical dialogue, retain links and behavior metadata rather than transcribing copyrighted dialogue verbatim into GitHub.
8. Land implementation patches separately from research, review changes against Agy's concurrent runtime edits, and never overwrite work in progress.

## Research references
- https://runescape.wiki/w/2006 — chronological release dates (primary historical index).
- https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date — quest release chronology.
- https://runescape.wiki/w/Update%3AChanges_to_Pest_Control — historical official update text.
- https://github.com/LostCityRS/Engine-TS/tree/377-wip — applicable game engine source.
- https://github.com/LostCityRS/Content/tree/377-wip — matching content script reference.
- https://github.com/Parris-Tech-Services/JoshRS/blob/main/deploy/jparris-windows/README.md — local imported 377 runtime & save safeguards.

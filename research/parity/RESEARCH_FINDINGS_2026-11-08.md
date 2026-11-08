# RS3 + OSRS vs JoshRS — first evidence-backed deep research findings

**Date:** 8 November 2026 (Australia/Sydney)  
**State:** **RESEARCH PARTIALLY COMPLETE — complete available 377 quest/NPC source inventory crosswalk; modern game global item/NPC enumeration and live private game verification remain open.**  
**Scope:** `Parris-Tech-Services/JoshRS` public repository, JoshRS desktop 377 (source only), historical 274 reference, independent Woodlands and external current OSRS/RS3 references.

## Why we're doing this

The product goal is a **private, offline-first, family cooperative fantasy RPG** for a parent and child: big worlds to explore, quests, useful NPCs, skills, monsters, surprises, boats, houses and long-term progression **without exposure to public chat, strangers, paid monetisation, bullying/griefing or remote accounts**. Multiplayer is limited to explicitly authorised family devices and characters; a solo game should work with no internet. The aim is **functional depth and joyful exploration**, not a public clone of Jagex's games.

## 1. Verified baseline and source quality

| Population | Reference | Date/status | Count | Important interpretation |
| --- | --- | --- | ---: | --- |
| OSRS playable skill types | [OSRS membership/skills](https://oldschool.runescape.wiki/w/Membership) | source checked 8 Nov 2026 | **24** | Sailing released 19 Nov 2025, including 1 OSRS-exclusive skill concept |
| RS3 playable skill types | [RS3 skills](https://runescape.wiki/w/Skills) | source checked 8 Nov 2026 | **29** | Additional skill concepts include Necromancy, Archaeology, Invention, Divination, Dungeoneering and Summoning |
| Union of RS3/OSRS skill concepts | [local exact list](data/skill_systems_union_2026-11-08.csv) | derived 8 Nov 2026 | **30** | 21 historical 377 skills + Construction/Hunter + 6 RS3-only + Sailing |
| OSRS quests | [OSRS Quests](https://oldschool.runescape.wiki/w/Quests) | **as of 8 Sep 2026** | **184** | Dated wiki count, **superseded by verified 3 Nov 2026 additions**: two new quests and Daddy's Home upgraded from miniquest; see update note below |
| RS3 quests | [RS3 Quests](https://runescape.wiki/w/Quests) | **as of 28 Sep 2026** | **277** | Dated wiki count with **476 quest points**, does not include separate miniquests as normal quests |
| 377 historical quests | [JoshRS quest queue](../rs377/QUEST_QUEUE_2026-11-08.md) | source audit dated 8 Nov 2026 | **104** | Historical quest-list interface total, not live-completable count |
| 377 source quest implementations rated COMPLETE-VERIFIED | [JoshRS quest queue](../rs377/QUEST_QUEUE_2026-11-08.json) | source audit only | **77** | Evidence is source-path/script-level. Do not equate to completing all 77 on real accounts |
| 377 quest STUB | same | source audit only | **4** | Config/journal roots without full scripted completion |
| 377 quest NOT STARTED | same | source audit only | **23** | No full quest scripts located by existing source audit; possible outside-path or recent local changes |
| 377 NPC definitions | [JoshRS NPC audit](../rs377/NPC_DIALOGUE_AUDIT_2026-11-08.md) | source audit dated 8 Nov 2026 | **3,850** | Includes morph/cutscene/unspawned variations |
| 377 Talk-to NPC definitions | same | source audit | **1,799** | Those with configured Talk-to option |
| 377 dialogue-handler candidates | same | source audit | **673** | No expected direct/ancestor dialogue trigger in audit; **not 673 verified in-game bugs** |
| Of dialogue candidates, spawned on static maps | same | source audit | **487** | Higher testing priority, but inherited/alternate handlers must be checked |
| Other dialogue candidates | same | source audit | **186** | Dynamic, morph, cutscene, or unspawned; do not automatically create spawns |
| OSRS raids | [OSRS Raids](https://oldschool.runescape.wiki/w/Raids) | The Fractured Archive launched **20 Oct 2026** | **4** | All later-era, independent mechanics and content; not historical 377 omissions |

**November 3 OSRS correction (important):** The [official OSRS 3 November 2026 news feed](https://www.oldschool.runescape.com/) confirms **two new playable quests**, and [the contemporaneous patch report](https://whatsnew.fyi/product/old-school-runescape/releases/2026-11-03-quest-month-kick-off-tfa-tweaks-more) confirms that **Daddy's Home was converted from a miniquest to a full quest**. The independently reported new titles are **Mudfoot's Big Adventure** and **The Writing's on the Wall** ([Questhaze 4 Nov](https://questhaze.com/osrs-quest-month-2026/)); the official teaser intentionally withheld the names. Applying those three changes to the published 8 September wiki baseline of 184 gives **187 quests on 3 November 2026 under the same counting convention**, but **187 remains an explicitly derived working estimate until verified against an updated authoritative quest-list total**, with any other interim revisions accounted for. The [OSRS news page](https://www.oldschool.runescape.com/) was checked 8 November 2026 and shows no newer game-content update after 3 November, though that does not prove every quest-list entry was enumerated. This corrects the older 184 snapshot rather than silently repeating it as today's total.

**Reconciliation rule:** These denominators describe *different* populations, eras and proof levels. Do **not** add 673 NPC candidates to 27 quest gaps, subtract 104 from 184/277 as an exact "missing quest" number, or claim source COMPLETE-VERIFIED means live-completable.

**Pin source:** [desktop upstream manifest](../../deploy/jparris-windows/upstreams.json) specifies revision `377`, port `52402` and independently pinned source repos; always read exact checkout commit and active build before changing runtime. BASE-02's adopted 274 reference is [separately locked](../../docs/REFERENCE_VERSION_LOCK.json). The current Vercel launcher is not the desktop 377 world.

## 2. All 27 known historical quest source-gap candidates — enumerated

The following are **all** current STUB and NOT STARTED entries from the 8 November source queue, not an illustrative subset. "Linked NPC" means overlap with *candidate* missing Talk-to handlers. It measures possible dependencies, **not confirmed blockers**.

| Quest | Source status | Linked NPC candidates | Historical source root |
| --- | --- | ---: | --- |
| In Search of the Myreque | NOT STARTED | 0 | `none` |
| One Small Favour | NOT STARTED | 0 | `none` |
| Zogre Flesh Eaters | NOT STARTED | 9 | `none` |
| The Lost Tribe | NOT STARTED | 5 | `none` |
| The Giant Dwarf | NOT STARTED | 0 | `none` |
| Recruitment Drive | STUB | 8 | `quests/quest_rd` |
| Mourning's Ends Part 1 | NOT STARTED | 15 | `none` |
| Forgettable Tale... | NOT STARTED | 1 | `none` |
| Garden of Tranquillity | NOT STARTED | 3 | `none` |
| A Tail of Two Cats | NOT STARTED | 17 | `none` |
| Wanted! | NOT STARTED | 4 | `none` |
| Mourning's Ends Part 2 | STUB | 0 | `quests/quest_mourning2` |
| Rum Deal | NOT STARTED | 26 | `none` |
| Shadow of the Storm | NOT STARTED | 20 | `none` |
| Making History | NOT STARTED | 5 | `none` |
| Rat Catchers | NOT STARTED | 21 | `none` |
| Spirits of the Elid | NOT STARTED | 18 | `none` |
| Devious Minds | NOT STARTED | 1 | `none` |
| The Hand in the Sand | NOT STARTED | 6 | `none` |
| Enakhra's Lament | NOT STARTED | 8 | `none` |
| Cabin Fever | STUB | 43 | `quests/quest_fever` |
| A Fairy Tale Pt. 1 | NOT STARTED | 13 | `none` |
| Recipe for Disaster | STUB | 20 | `quests/quest_100` |
| In Aid of the Myreque | NOT STARTED | 0 | `none` |
| A Soul's Bane | NOT STARTED | 2 | `none` |
| Rag and Bone Man | NOT STARTED | 0 | `none` |
| Swan Song | NOT STARTED | 0 | `none` |

**Next required verification for each:** inspect source outside named quest directory, compile in disposable environment, fresh-account start/steps/completion, correct quest points and rewards, player state and save/relog. Preserve original user accounts and their save history. A 2006 quest with many possible dependencies may require a bigger repair than a quest with none.

## 3. NPC interaction gap candidate distribution — all 673 classified

| Audit grouping | Candidate definitions |
| --- | ---: |
| Members Surface & Underground Regions (Other) | 191 |
| Unspawned / Dynamic / Cutscene / Morph Variants | 107 |
| Keldagrim & The Giant Dwarf | 101 |
| Morytania, Canifis & Burgh de Rott | 50 |
| Al Kharid & Kharidian Desert | 49 |
| Random Events & Macro Guardians | 27 |
| Port Sarim, Rimmington & Void Knights' Outpost | 21 |
| Ratcatchers & Sewer/Tavern NPCs | 21 |
| Recipe for Disaster (100th Quest) | 20 |
| The Lost Tribe & Dorgeshuun Mines | 19 |
| Tirannwn, Lletya & Mourning's End | 17 |
| F2P Surface & Underground Regions (Other) | 13 |
| Mage Training Arena | 12 |
| Farming Gardeners, Shops & Leprechauns | 11 |
| Draynor Village & Market | 7 |
| TzHaar City & Fight Caves | 7 |
| **TOTAL** | **673** |

The [full 673-row triage sheet](data/rev377_673_npc_talkto_candidates_2026-11-08.csv) includes each exact numeric NPC ID, symbol, name, region, spawn state/count, position, expected Talk-to action, area/quest and source link. The [104-quest crosswalk](data/rev377_104_quest_source_crosswalk_2026-11-08.csv) includes source status, stage hints, start NPC, journal var, linked dialogue candidates and required live proof. The old audit separately lists 142 locally implemented NPC dialogue batch records; **do not subtract 142 from 673**, as that audit's snapshot and installed runtime may differ.

**Highest-leverage investigation groups:** Keldagrim + The Giant Dwarf (101 candidate definitions), Morytania (50), Al Kharid/desert (49), Recipe for Disaster (20), The Lost Tribe (19), Ratcatchers (21), and Farming service NPCs (11). A smaller town's bank/shop/quest NPC is potentially more valuable to a family player than dozens of inaccessible cutscene variants.

## 4. What modern games contain beyond the historical 377 design

### Skill systems (the full 30-concept union is committed)

**21 historical common skills:** Attack, Strength, Defence, Ranged, Magic, Prayer, Hitpoints/Constitution, Mining, Smithing, Fishing, Cooking, Woodcutting, Firemaking, Crafting, Runecrafting, Agility, Thieving, Herblore, Fletching, Slayer and Farming.

**Both modern games, later than 377:** Construction (custom home, furnishings and upgrades) and Hunter (tracking, traps and wildlife).

**OSRS-specific later addition:** Sailing, including hull/crew/boat movement, sea navigation, ports, maritime exploration, ship upgrades and quest/activity integrations. [OSRS Sailing](https://oldschool.runescape.wiki/w/Sailing) records its 19 November 2025 release.

**RS3-specific additions:** Summoning (companions), Dungeoneering (cooperative dungeon floors), Divination (energy), Invention (modular item enhancement), Archaeology (excavation and restoration) and Necromancy (rituals and distinct combat). [RS3 Necromancy](https://runescape.wiki/w/Necromancy) released 7 August 2023; this is not a 377-native combat interface.

Do **not** claim any particular historical skill is currently broken without source+runtime evidence. A skill is "complete" only after level-up, unlock, input→output, experience, equipment, UI, failure and relog are tested.

### Current quest/story world growth

- **OSRS:** multiple independent stories and newer locations (Zeah/Kourend, Varlamore, Sailing seas), quests from 2007 onward, clue collection, diaries, construction, hunter, Sailing, bosses and raids. The September 2026 wiki confirms [Crab Quest and A Ruff Situation](https://oldschool.runescape.wiki/w/Quests/Release_dates) released **8 September 2026**. The 3 November 2026 update **already released two additional quests and promoted Daddy's Home to a quest**; its [2026 update roadmap](https://oldschool.runescape.wiki/w/Upcoming_updates) also lists *future* November releases, which must not be counted as already live.
- **RS3:** more than two decades of continuing independent storylines (e.g. Elder Gods, Fort Forinthry, Necromancy's City of Um, Havenhythe), modern abilities, newer skill cap/achievement systems, higher-level encounters, boss hubs, elite dungeons, player-owned activities. The [quest release table](https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date) confirms **Heralds of Crimson, 28 September 2026**, as quest 277.
- **OSRS late 2026 combat:** [The Fractured Archive](https://oldschool.runescape.wiki/w/The_Fractured_Archive) became the fourth raid on **20 October 2026**; it is an 1–8-player instance with selectable middle encounters. A family alternative can learn from selectable difficulty and no-stranger co-op rather than copying proprietary encounters.
- **Quest counts are dated and dynamic.** There is no verified complete 8 November 2026 current global OSRS/RS3 quest inventory in this research yet; never silently treat older wiki counts as today's total.

### Deep-system inventory still to enumerate by ID

| Category | Current RS3/OSRS reference | Historical 377 comparison | Family-world candidate |
| --- | --- | --- | --- |
| Skills and crafting | 30 unique skill concepts; thousands of unlocks/methods | 21 historical; training chains need functional audit | Friendly progressive workstations, discovery book |
| Items, recipes and equipment | Every versioned item, variant, charge, stack, tool and craft recipe | Pinned 377 item configs/shops/drop tables still require complete enumeration | Collecting, building, enchanting and a safe shared bank |
| Quests | 184 OSRS and 277 RS3 **dated** snapshot quests; miniquests separate | 104 historical; 27 source candidates | Original co-op adventures with opt-in gentle storytelling |
| NPCs and monsters | Both games add huge generations of creatures and behaviours | 3,850 definitions, 673 Talk-to candidates | Helpful townsfolk, friendly companions, harmless wildlife |
| World, transport and housing | New land/sea areas, ships, portals, homes | 377 map paths must be checked | Explore by foot, boat, portals and family house |
| Combat and PvM | OSRS specials/raids; RS3 abilities/Necromancy | Combat/ticks/boss scripting audit required | Co-op battles with adjustable threat and no forced PvP |
| Activities | Minigames, bosses, clue trails, achievements, farming, skilling bosses | 377 Castle Wars/Barrows/etc require end-to-end tests | Short, replayable fun tasks and family challenges |
| Economy | Banks, shops, trading, Grand Exchange, sinks, player markets | Must prove actual merchant/bank interfaces and persistence | Offline NPC merchants only; no external trading |
| Social and safety | Public chat, PvP, clans, worlds, groups, moderation | Private 377 login and LAN sessions require actual verification | Default-deny strangers, no public chat, family-only accounts |
| Client and operations | Modern UIs, mobile, accessibility, reconnection | Revision-377 client/protocol cannot natively host all modern screens | New optional independent UI with offline save stability |
| AI companions | Distinct from the live games' NPCs | 377 RS-SDK observer/controller still incomplete by live proof | Kind, predictable, parent-configured helper NPCs |

### Major architecture reality: why direct "port everything" isn't a single merge

- The revision-377 **network protocol, item/NPC/loc definitions, client UI, model formats, Varps/Varbits, combat tick rules and world engine** predate RS3's EoC/Necromancy and OSRS Sailing. Adding a modern-skill source name is *not* enough: it needs a new original skill schema, server rules, UI, activities, saving and actual in-game tests.
- **Historical repairs and modern original expansions must be isolated.** Keep a stable 377-compatible profile, and a separate family expansion profile with feature flags or independent engine/client modules. Never upgrade the historical save schema in place.
- Some modern activities **require more than two players, specific world population or public economies**; adapt to solo/two-player plus friendly NPCs rather than reproducing dependencies on strangers.
- Prefer **offline/local** storage over cloud auth. A two-device LAN session is still a *local* server and must be secured; the browser's local demo `localStorage` alone is not proof of shared multiplayer or durable backups.

## 5. The legal boundary is real even for offline family use

Jagex's [Fan Content Policy §6.1.3](https://legal.jagex.com/docs/policies/fan-content-policy) specifically prohibits using its intellectual property to create video-game software or private game servers, absent a separate applicable agreement. **Not charging money and not publishing do not create an automatic exemption.** MIT-licensed open-source engine code does not confer rights to Jagex-owned quest text, character designs, maps, models, animations, music, branded assets or copied game content. The policy also restricts competing products and unauthorised game access. This is a project safety/rights gate, not a statement that original generic gameplay mechanics are forbidden.

**Practical route:** research exact games as references; create **new original quests, towns, NPC names, dialogue, art and music** with independently implemented progression, skilling, adventuring, trading and family co-op systems. For historical private content already present, perform read-only auditing and discuss any proposed use/expansion in view of licensing; do not automatically upload Jagex assets or copyrighted quest scripts. Obtain appropriate rights if an exact reproduction is ever desired.

## 6. Family-first product requirements (acceptance tests, not aspirations)

1. **Private by construction:** default `127.0.0.1` binding, no cloud dependency. Optional LAN binding only to explicitly authorised interface, Windows firewall restricted to trusted local network, no router port forwarding or UPnP, no public discovery, no outsider sign-up.
2. **Two independent local profiles:** parent and child can log in, see each other's position/actions in the same running world, save progress separately, recover after reconnect and remain usable with WAN disconnected.
3. **Parental modes:** combat on/off or gentle; scary content warning/filter; no forced PvP; no unsolicited player contact; no gambling or paid microtransactions; child-readable text and scalable UI.
4. **Joyful co-op:** shared gathering trips, building, fishing, easy quest hints, visible crafting results, optional companion NPCs, adjustable difficulty and the option to play without combat.
5. **No grief mechanics:** disable stealing/attacking other family accounts, dangerous drop parties and destructive housing changes by default. Allow parent-approved opt-ins if desired.
6. **Recoverability:** automatic snapshots and manual export/import, integrity checks, clean shutdown, migration rollback and isolated backups of existing private character state. No silent inventory or quest reset.
7. **Privacy:** no telemetry or advertising requirement, no remote voice/chat, no strangers, no credentials or player data in GitHub, and a clearly visible offline/only-family status in the client.

Full [family-world specification](FAMILY_OFFLINE_WORLD_ARCHITECTURE_2026-11-08.md) is a companion to this research.

## 7. A concrete dependency-first build plan (initial 20 work orders)

| Order | Work order | Proof of acceptance |
| ---: | --- | --- |
| 1 | Verify actual 377 desktop engine/content/client and backup manifest | Read-only version IDs; verified safe snapshot without inspecting private credentials |
| 2 | Test offline single-player with network disabled | Existing parent account logs in, plays, logs out and relogs preserving bank/inventory/quest state |
| 3 | Test family-only second character and simultaneous LAN | Two separately authenticated profiles see each other without WAN/public exposure |
| 4 | Secure network defaults | Listener/firewall/registration tests reject an unauthorised client and internet-side access |
| 5 | Test save resilience | Crash/restart/checksum and restore drill with disposable character; production unchanged |
| 6 | Define family-mode policy and preferences | Parent-lock proof; PvP/public chat/payments off; child preferences persist |
| 7 | Verify dialogue UI + nearby NPCs | Choose genuine branches for a reachable NPC; authoritative state and no soft lock |
| 8 | Verify shops and banking | In/out item and money deltas; full inventory; relog persistence |
| 9 | Verify object and ground-item interactions | Legitimate pick-up, use-on, respawn and anti-dupe tests |
| 10 | Verify all 21 historical skill loops | Source inventory + at least one verified skill action and level-up per skill; full-level audits to follow |
| 11 | Triaging top 487 spawned missing-talk candidates | Classify inherited/alternate handlers, then verify individual failure in a client |
| 12 | Work through all 27 377 quest source gaps | Per-quest true stage/reward/relog result, preserve existing saves; do not mark finished on source merge |
| 13 | Improve NPC behaviour in peaceful towns | AI movement, schedule, approachability and activity instead of static creepy NPC queues |
| 14 | Add original family story/quests system | Parent+child can start/solve/finish separate original quest and retain rewards |
| 15 | Add original home building | Independent housing state; co-op permission rules and no grief |
| 16 | Add original wildlife/capture and habitat skills | Peaceful trapping/photography and creature handling; persistent collections |
| 17 | Add original boat/sailing system | One/two-player voyage, ship navigation, port docking, persistence |
| 18 | Add original procedural co-op dungeons | Difficulty slider, no strangers, solo fallback, deterministic save and rewards |
| 19 | Add safe original companion/ritual/mystery systems | No frightening default content; resources/XP obey server-authoritative rules |
| 20 | Comprehensive content dashboards and refreshed research | Count source rows separately from verified gameplay, publish reproducible tests and no private data |

**Status:** All twenty above are *work orders*, not implemented changes or evidence that the private world has passed an offline/LAN test.

## 8. Research still open, explicitly

- **Not yet done:** complete pagination of OSRS/RS3 **all** item, NPC, quest, map, equipment, boss, activity, ability, unlock, dialogue *metadata* into one versioned catalogue; 377 item/loc/recipe/drop table exhaustive audit; true semantic crosswalk per modern entity; independently verified live 8 November quest totals after the 3 November content update (working derived OSRS estimate: 187; not full enumeration); actual Windows host, code overlays, client/pack and saves; test running real 377 local gameplay; exact 274 code audit; independent Woodlands full object list.
- **Done:** validated key modern reference dimensions, extracted exact existing 104-quest and 673-NPC *source-audit* populations into new independent CSV crosswalks, constructed the exact 30 skill union, inspected repo scope/right-hand rules and derived a family-specific implementation sequence.
- **For comprehensive continuation:** use the [detailed research specification](RS3_OSRS_JOSHRS_DEEP_RESEARCH_PROMPT_2026-11-08.md) and inventory exports; record every fetch cursor/category and stop on truncation. A crawler that has only inspected category members must label results *category membership*, not confirmed playable items.

## References

- https://oldschool.runescape.wiki/w/Quests ; https://oldschool.runescape.wiki/w/Quests/Release_dates ; https://runescape.wiki/w/Quests ; https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date
- https://oldschool.runescape.wiki/w/Sailing ; https://oldschool.runescape.wiki/w/Raids ; https://runescape.wiki/w/Skills ; https://runescape.wiki/w/Necromancy
- https://legal.jagex.com/docs/policies/fan-content-policy ; https://github.com/LostCityRS/Content
- JoshRS internal: [8 November source quest inventory](../rs377/QUEST_QUEUE_2026-11-08.json), [NPC inventory](../rs377/npc_dialogue_audit_2026-11-08.json), [AGENTS.md](../../AGENTS.md), [version lock](../../docs/REFERENCE_VERSION_LOCK.json).


# JoshRS: historical RuneScape game-content completeness benchmark

**Evidence snapshot:** 31 October 2026 (Australia/Sydney)  
**Status:** SOURCE COVERAGE VERIFIED IN PART; LIVE GAMEPLAY COMPLETION NOT VERIFIED.  
**Purpose:** Compare the amount of *actual source-implemented gameplay* in independent RuneScape recreation projects without pretending a file/quest journal/data definition is a completed quest.

## 1. Historically matched quest denominators

| Period | Historical quests available | Historical evidence |
|---|---:|---|
| RuneScape Classic, final content | 50 (17 free, 33 members) | [RuneScape Classic historical summary](https://runescape.wiki/w/RuneScape_Classic) |
| RS2 revision 377, May 2 2006 | 104 (Swan Song released May 2) | [Quest release timeline](https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date), [OpenRS2 revision-377 archive](https://archive.openrs2.org/caches/runescape/2696) |
| RS2 revision 530, January 1 2009 | 148 (Myths of the White Lands Dec 16 2008; In Pyre Need Jan 6 2009) | [Quest release timeline](https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date) |
| RS2 revision 634, December 14 2010 | 169 (Do No Evil Dec 1 2010; King of the Dwarves Jan 4 2011) | [Quest release timeline](https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date) |

**Critical distinction:** These are denominators for an era, not proof any emulator has that many quests implemented. Some projects mix content eras; do not assign a denominator to them without a pinned target date.

## 2. Source evidence quantified

| Project | Target and pinned source | Directly observed source evidence | Valid percentage | Player-completable % |
|---|---|---|---|---|
| **OpenRSC** | Classic 50; [Core-Framework@273e630b](https://github.com/Open-RSC/Core-Framework/tree/273e630b6ab0e875878038ea4cf60d5c7c89a839) | 17 free quest classes + 26 members quest classes + 7 multi-class quest directories = **50 distinct historical quest code entries**. 41 of 43 primary classes contain completion calls; Shield of Arrav completes in King's NPC handler, making **at least 42 quest-ending code paths traced**. | **100% (50/50) quest *source entry* coverage**, NOT gameplay completion | **UNKNOWN** |
| **Lost City 377** | May 2006, 104; [Content@44eab090](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50) | 66 `quest_*` directory roots, of which **60 contain .rs2 code**. Six roots have config-only content: `quest_100`, `quest_fever`, `quest_mm`, `quest_mortton`, `quest_mourning2`, `quest_rd`. | **60/66 = 90.9% of quest-labelled directories contain script**, NOT 60/104 completed historical quests. Quest-root to unique quest mapping still required. | **UNKNOWN** |
| **2006Scape** | Hybrid 2006/#317; [master@7f1dc47c](https://github.com/2006-Scape/2006Scape/tree/7f1dc47c982fcb20aace35e23d37c238422460ab) | All **15** named Java classes under `content/quests/impl` are **journal display** implementations; none has an obvious end-state method inside that file. **15** named reward handlers reside separately in `QuestRewards.java`, and dialogue/NPC logic exists elsewhere. | **Not yet measurable**: 15 journal classes ≠ 15 playable quests | **UNKNOWN** |
| **Void** | Dec 2010, 169; [main@133f930c](https://github.com/GregHib/void/tree/133f930c30f19b47deb78dc8a29e853f69e45196) | **11** free quest-code groups and **23** members quest-code groups, with 69 Kotlin code files under the quest subtree. Some directories are shared systems (e.g. `mahjarrat`), not individual quest completions. Its quest DATA tree covers far more than actual quest CODE. | **Not yet measurable**: 34 code groups ≠ 34 unique completable quests | **UNKNOWN** |
| **2009Scape** | Jan 2009, 148; [2009Scape](https://gitlab.com/2009scape/2009scape) | Official releases document several quests and major game mechanics. A complete code-level quest inventory was not retrieved. | Not established | **UNKNOWN** |
| **2011Scape** | Dec 2010, 169; [game-server](https://github.com/2011Scape/game-server) | GitHub identifies the game server as a fork of Void. Its independent gameplay delta is not deduplicated. | Not established | **UNKNOWN** |
| **Luna 377** | May 2006, 104; [master@546d1e58](https://github.com/luna-rs/luna/tree/546d1e5808eb4916f044fc60d1c37f67f6460845) | Substantial Barrows code (~30 files), Castle Wars (~9), multiple skills and minigame systems; comprehensive quest count not established. | Not established | **UNKNOWN** |
| **RuneJS** | RS2 #435; [develop@3c1e6a75](https://github.com/runejs/server/tree/3c1e6a757e73c7e26b27bbddcf6404c7b2aa25e6) | `FEATURES.md` marks Cook's Assistant complete; other quests or skills absent or partial. Other quest-labelled plugin files alone do not prove completion. | Not established | **UNKNOWN** |
| **OpenRune** | Modern OSRS; [main@e47cbfb2](https://github.com/OpenRune/OpenRune-Server/tree/e47cbfb23a1118b53a561c4f721cd31b4a8b8bef) | `PROGRESS.md`: 20/23 skills, 25/179 bosses, 0/4 raids, 2/52 minigames **by module/symbol presence**; the project's own file explicitly cautions these are not necessarily implemented encounters. | **Code-symbol coverage only:** skills 87.0%, bosses 14.0%, raids 0%, minigames 3.8%. **Not gameplay-completion percentages.** | **UNKNOWN** |

### Special handling for 377

The Lost City author explains the 377 branch was created as a work-in-progress branch without porting all earlier scripts over. It is *not* a branch recommended for a complete RS experience: [developer explanation](https://lostcity.rs/t/question-for-devs-about-versioning-and-personal-custom-work/12822). Therefore cached NPC, quest and map definitions cannot count as real gameplay.

### Source inspection details and reproducibility

- OpenRSC: [free quest implementations](https://github.com/Open-RSC/Core-Framework/tree/develop/server/plugins/com/openrsc/server/plugins/authentic/quests/free), [members quest implementations](https://github.com/Open-RSC/Core-Framework/tree/develop/server/plugins/com/openrsc/server/plugins/authentic/quests/members), [Shield of Arrav completion in King's NPC handler](https://github.com/Open-RSC/Core-Framework/blob/develop/server/plugins/com/openrsc/server/plugins/authentic/npcs/varrock/King.java). Of the 43 direct quest classes, all 43 expose a reward handler, 41 contain a direct `sendQuestComplete` or `completeQuest` invocation, and the other two are Shield of Arrav and The Holy Grail. Shield's ending is external; Holy Grail's ending has not yet been traced.
- Lost City: recursively inspected the pinned [`scripts/quests`](https://github.com/LostCityRS/Content/tree/377-wip/scripts/quests) Git tree. **580 files**, 66 `quest_*` roots, 60 roots with at least one `.rs2`. Quest directories can contain a mix of quest, miniquest, partial and support systems, so **do not divide 60 by 104 and label the result 'completion'**.
- 2006Scape: read all [15 named journal classes](https://github.com/2006-Scape/2006Scape/tree/master/2006Scape%20Server/src/main/java/com/rs2/game/content/quests/impl) and [QuestRewards.java](https://github.com/2006-Scape/2006Scape/blob/master/2006Scape%20Server/src/main/java/com/rs2/game/content/quests/QuestRewards.java). Checked `NpcActions.java` and `DialogueHandler.java` search results for Cook's Assistant progression. Its executable quest code is spread across different subsystems; a journal-class count is misleading.
- Void: recursively inspected the pinned [quest gameplay-code tree](https://github.com/GregHib/void/tree/main/game/src/main/kotlin/content/quest). It contains **69 Kotlin source files**, including a journal handler for Cook's Assistant and NPC interaction code elsewhere; quest data directories alone are not completions.
- Lua / Java / Kotlin / RuneScript trees are *not directly interchangeable*. Code licensing does not grant rights to game artwork, caches or dialogue.

## 3. Actual executed tests: what passed, and what was blocked

### Public CI evidence at source commits

| Source | Workflow at audited branch | Result | What it proves |
|---|---|---|---|
| Lost City 377 | [Verify Content, SHA 44eab090](https://github.com/LostCityRS/Content/actions/runs/39118666147) | Successful | Content verification, **not** login/quest completion |
| Void main | [Run Tests, SHA 133f930c](https://github.com/GregHib/void/actions/runs/41068948431) | Successful | Automated project tests, **not** a demonstrated end-to-end quest |
| Luna master | [Build, SHA 546d1e58](https://github.com/luna-rs/luna/actions/runs/41121182229) | Successful | Build workflow, **not** a gameplay completion |
| 2006Scape master | [Java CI with Maven, SHA 7f1dc47c](https://github.com/2006-Scape/2006Scape/actions/runs/39066075865) | Failure at **Set up job** | Cannot attribute failure to game source; no verified successful build in this sampled run |
| OpenRune main | [CI, SHA 3d7b50d6](https://github.com/OpenRune/OpenRune-Server/actions/runs/40943938354) | Failed | CI failure; no in-game inference |

**Local execution in this research environment:** Java 21, Node 22 and Python 3 are present, but public DNS/network access to GitHub fails; no server source checkout, game cache, user-character saves or clients are available here. Consequently **no player login, quest completion, boss kill, minigame completion or save/restore was actually carried out.** A GitHub Actions test run is not a playtest. No game-wide *playable completion percentage* is certified by this report.

### Local automated validation

The snapshot exporter was run with five unit tests, all passing, checking denominator consistency, snapshot SHA formatting, deduplicated rows, percentage-category guarding, and the absence of fabricated player-playtest results. These tests check research integrity, not RuneScape gameplay.

## 4. How to establish actual playable percentages

For each game, derive a **quest-by-quest historical catalogue** with a unique historical quest ID/name and release date. Require a mapping from that exact quest to source entrypoints and an end-state/quest point award. Mark each: absent, metadata only, partial mechanic, complete-state code found, or player-playtested.

Use *fresh, isolated characters* and a throwaway database/snapshot. For every quest claimed complete:

1. Start the quest normally via NPC.
2. Perform every required interaction, required item acquisition and stage transition **without admin bypass**.
3. Complete the actual final step; assert quest journal, points and reward changes.
4. Log out and back in; assert saved end-state, inventory and access gates.
5. Capture server logs and run/commit/environment IDs; repeat on the audited SHA.
6. Reject an allegedly completed quest if the code merely shows a completion screen or fills a journal.

For minigames require join, objectives, score/rewards, exit/reset and persistence; for bosses require fight phases, death/rewards and relog. A **sample** can support a confidence estimate, not an exact all-quest percentage. Claim a numeric verified-playable ratio only for an exhaustively tested catalogue or a fully enumerated test ledger.

**Minimum playtest matrix for the first pass:** OpenRSC Cook's Assistant, Shield of Arrav and Dragon Slayer; Lost City 377 Cook's Assistant, Monkey Madness (expected config-only in the pinned quest subtree; look for implementation elsewhere), and Castle Wars; Void Cook's Assistant, Ghosts Ahoy and Barrows; Luna Barrows and Castle Wars; 2006Scape Cook's Assistant and the quest reward/state persistence. Record failure as failure, not absence, and investigate prerequisites.

## 5. Practical implications for JoshRS

1. Audit the exact pinned [Lost City 377 Content@44eab090](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50) plus the installed private world before calling anything missing. The existing law and nature runes, amulet mould, jewellery crafting and other vanilla or user-created content must not be duplicated.
2. **Quest completion gaps first:** map the six configuration-only 377 quest roots to historical quests, look for scripts elsewhere, and trace actual gameplay endings.
3. Compare one confirmed missing 377 mechanic at a time with source implementations: OpenRSC's clear completion handlers, Luna's Barrows/Castle Wars, Void's quest NPCs and minigames. Port only rights-cleared original compatible logic; never copy proprietary assets.
4. To move beyond the **UNKNOWN** gameplay percentage, obtain a safe build/test environment with test characters and game clients. Do not modify Elrothiro's production saves or replace the active JoshRS server.

**Bottom line:** we now have evidence-backed *source-code coverage* for several games and historical quest denominators. OpenRSC has 50/50 quest source entries, but it is **not justified** to call it 100% playable; all projects' independently verified whole-game completion percentages remain unknown pending real player testing.

**Evidence caveat:** Search results, published commits and GitHub workflows were verified 31 October 2026. Repository branches can change after this snapshot; the full commit SHA above pins the exact inspected source.

# JoshRS Revision 377 — Pre-Shutdown Checkpoint & Resume Map (2026-11-14)

## 1. Completed & Pushed Before Shutdown

### A. Live Fred & George Snapshot Backup (`origin/save/joshrs-repo-local-20261113`)
- Backed up and pushed the untracked `reports/fred-george/snapshots/2026-11-14/` 10-minute benchmark snapshots after verifying zero secrets, credentials, or private family save data.

### B. Fred & George Multi-Floor Staircase & Basement Recovery (`tools/rs377-bot-bench/engine-patch`)
- **Root cause diagnosed:** When Fred or George ended up on an upper floor (such as Wizards' Tower `plane 2` at `(3113, 3160)` behind closed `fai_wiztower_poor_door` at `(3107, 3162)`, Manhattan distance `8`) or in an underground basement (`z >= 9500`), two gaps existed on `origin/main`:
  1. `descendTowardGroundFloor` had not been synced into `tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.ts`, and `walkToward`'s fallback door radius (`6`) was shorter than the 8-tile room span on Wizards' Tower `plane 2`.
  2. When on `plane > 0`, falling through to surface gathering overwrote `current_task` with `"Woodcutting: chop_tree"` on `plane 2` where no surface path exists, and Windmill middle-floor ladders (`Climb` / `Climb-up` / `Climb-down`) needed explicit option-index matching (`APLOC1 + opIndex`).
- **Fix landed & verified (`DISPOSABLE GAME VERIFIED`):**
  - Added `descendTowardGroundFloor` and `ascendFromUndergroundToSurface` to `FredGeorgeBot.ts`, widened interior closed-door fallback discovery to 12 tiles, fixed multi-option ladder index selection, and preserved all `origin/main` `relogAttempts`, lower-case logout account key (`fredGeorgeLogoutAccountKey`), and `.sav` CRC protections.
  - Added Test #5 in `FredGeorgeBot.test.ts` placing Fred at Wizards' Tower `(3113, 3160, plane 2)` behind the closed interior door and proving he opens the door, climbs down `plane 2 -> plane 1 -> plane 0` via real `APLOC` spiral-stair interactions (no teleport), and climbs up the Wizards' Tower basement ladder from `(3104, 9576)` to surface `z < 9500`.

### C. Luna Companion & Friendly Sparring Source Sync (`tools/rs377-bot-bench/engine-patch/src/engine/entity`)
- Synced `LunaBrain.ts`, `LunaSparSession.ts`, and `LunaCompanion.test.ts` alongside `BotPlayer.ts` (retaining `this.playtime = saved.playtime` anti-rollback preservation).
- **Evidence tier:**
  - `COMPILES / STATIC TESTS PASS`: `tools/luna377/audit-duel.mjs` reports `0` problems.
  - `DISPOSABLE GAME VERIFIED`: `LunaCompanion.test.ts` passes all assertions in an isolated disposable 377 runtime (`Challenge` `OPPLAYER1` outside Duel Arena -> 3-tick countdown -> 1-HP non-lethal clamp -> full stat/special recovery -> zero XP/drops -> `PlayerLoading` binary `.sav` CRC round-trip).
  - `ACTUAL TARGET WORLD VERIFIED`: Live human Java-client visual duel click-through remains scheduled for an approved maintenance window (live family server on `TCP 52402` was intentionally not restarted).

---

## 2. Exact Resume Map After Reboot

Worktree ready on disk: `C:\JoshRS-Worktrees\agy-377-complete-20261114` (`feat/rs377-complete-quests-npcs-bots-20261114`).

1. **Revision 377 Quest Queue (`#1`–`#104`, 0 quests missing source — needs unified wiring, compile & disposable playthroughs):**
   - **84 quests (`#1`–`#84`)** are active in `runtime/jparris-377/usb-20261030-203927/content/scripts/quests`.
   - **12 of `#85`–`#104`** are already on `origin/main` in `content-patches/rs377/`: `quest_forget` (`#85`), `quest_garden` (`#86`), `quest_twocats` (`#87`), `quest_wanted` (`#88`), `quest_deal` (`#90`), `quest_agrith` (`#91`), `quest_makinghistory` (`#92`), `quest_elid` (`#94`), `quest_handsand` (`#96`), `quest_soulbane` (`#102`, plus `origin/fix/rs377-soulbane-original-mechanics-20261109`), `quest_rag` (`#103`), and `quest_swansong` (`#104`).
   - **5 more** are in `origin/quests/377-batch5-oldest-notstarted-20261108` (PR `#162`): `quest_ratcatch` (`#93`), `quest_devious` (`#95`), `quest_enakh` (`#97`), `quest_fairytale` (`#99`), and `quest_myreque2` (`#101`) — renumber patches `0025`/`0026` to `0034+`.
   - **Final 3** are in `origin/quests/377-six-quests-wip-20261108` (PR `#148`) / `origin/quests/377-questbundle2-wip-20261108` (PR `#161`): `quest_mourning2` (`#89`), `quest_fever` (`#98`), and `quest_100` (`#100`, Recipe for Disaster).
   - **Next action on resume:** Wire the 18 unwired ported quest start triggers + `[if_button,questlist:...]` journals + `quests.rs2` progress/QP entries, compile the full 104-quest tree via `Build.ts` (`0` errors), run disposable-world playthrough + `.sav` reload verification for `#68, #72, #80–#104`, and regenerate `QUEST_QUEUE`.
2. **Missing `Talk-to` NPC Dialogue Batches:**
   - Re-run `tools/rs377-npc-dialogue-audit` against the unified 104-quest tree and land clean `[opnpc1]` batches for remaining map-spawned groups (TzHaar City, Mage Training Arena, Random Events, Kharidian Desert, Keldagrim) with zero duplicate triggers.
3. **Open `#29` / `#30` World Interaction Checks:**
   - Verify Draynor Manor secret bookcase, Troll Romance sled/boss, and `multinpc`/`multiloc` dispatch in the disposable 377 sandbox.

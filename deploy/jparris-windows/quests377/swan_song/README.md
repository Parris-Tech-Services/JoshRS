# Swan Song (2 May 2006) - JoshRS original-dialogue bundle
Uncompiled. Copy to `<content>/scripts/quests/quest_swansong/`. Dialogue/stages/rewards are original JoshRS content.
From the 377 cache: `swan_*` NPCs, items `swan_raw_monkfish`/`swan_monkfish`/`swan_army`/`swan_book`, varp `swansong_quest`, varbit `swansong`.

## Must do
- **Persistence:** the cache varp `swansong_quest` (like `soulbane`) has no `scope=perm`; add it in your local config or progress will not save.
- Add `^swansong_complete`/QP to `quests.rs2` (`count_questpoints`, `update_questlist`).
- Not implemented: 100 QP and other requirements, harpooning `swan_fishingspot` into `swan_raw_monkfish`, cooking to `swan_monkfish`,
  the Wise Old Man/Draynor scenes, the skeleton battle and the Kalphite Queen cameo.
- Check for collisions: Antigravity's `draynor_npcs_377.rs2` may already handle `wom_*`, not `swan_*`; run the collision audit.

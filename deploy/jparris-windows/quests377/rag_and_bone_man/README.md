# Rag and Bone Man (10 April 2006) - 377 bundle

Source-only, **not compiled or tested** (no 377 engine in this environment). Copy `configs/` and `scripts/` into
`<content>/scripts/quests/quest_rag/`, then run the normal pack/build and fix any compile errors.

## What is real (taken from the pinned 377 cache, `LostCityRS/Content` @ 44eab09)
- NPCs `rag_odd_old_man`, `rag_wine_merchant`, `talking_sack`, `rag_vulture`; varp `rag_quest`; varp `rag_bone_2` and its varbits.
- 35 bone chains (raw, `rag_pot_*`, `rag_polished_*`), `rag_vinegar`, `rag_pot_vinegar`, `rag_ram_helm`, `rag_bonesack`.
- Pot-boiler multiloc driven by varbit `rag_boiler` (states 0-4) and the wish-list loc.
- Release date 10 April 2006 (runescape.wiki quest release list).

## Still to wire in (small edits to existing files, not overwritten here)
1. `scripts/general/configs/quest.constant`: add `^rag_complete`/`^rag_questpoints` (or keep this bundle's constants).
2. `scripts/general/scripts/quests.rs2`: add `if (%rag_quest = ^rag_complete)` to `count_questpoints`, and
   `~send_quest_progress_colour(questlist:rag, %rag_quest, ^rag_complete);` to `update_questlist`.
3. `areas/area_draynor/scripts/fortunato.rs2`: swap to a vinegar shop once the quest is started (existing TODO there).
   A `wine_vinegar_merchant` shop is NOT in the pinned content and must be added.

## UNVERIFIED (nothing below was confirmed against a 2006 source)
- All NPC dialogue (placeholder wording only; `UNVERIFIED` comments in the scripts).
- Stage numbers, the bone delivery order/list, how many bones were required (this bundle uses all 35 in the cache).
- Rewards and quest points (cache has a ram skull helm and bonesack; which are rewards is unknown).
- Boil duration, vinegar price, talking-sack and vulture behaviour, wine-stealing branch (`rag_wine`, `rag_helmet`,
  `rag_bonesack` varbits) - **not implemented**.
- Sources tried: runescape.wiki Rag and Bone Man page (covers only the modern rework; 2006 entry says "Added to game").

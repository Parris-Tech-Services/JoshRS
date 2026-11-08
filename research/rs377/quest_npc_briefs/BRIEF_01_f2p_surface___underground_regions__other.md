# Brief 1: F2P Surface & Underground Regions (Other)

**Anchor:** Classic F2P leftovers  
**Anchor date:** 2001-2004 (classic quests; confirm per quest) (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 18

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 200 | `lord_daquarius` | Lord Daquarius | npc_conversation_or_quest_branch | (0, 2892, 9680, m45_151) | [wiki](https://oldschool.runescape.wiki/w/Lord_Daquarius) |
| 201 | `jailer` | Jailer | interactive_citizen_or_guard_dialogue | (0, 2933, 9693, m45_151) | [wiki](https://oldschool.runescape.wiki/w/Jailer) |
| 2675 | `man4_for_musa_point` | Man | interactive_citizen_or_guard_dialogue | (0, 2889, 3173, m45_49) | [wiki](https://oldschool.runescape.wiki/w/Man) |
| 1091 | `death_growncat_black` | Bob | npc_conversation_or_quest_branch | (0, 2924, 3565, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Bob) |
| 2580 | `bernald` | Bernald | npc_conversation_or_quest_branch | (0, 2918, 3534, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Bernald) |
| 2653 | `ics_little_cat_visible` | Neite | quest_or_varbit_morph_stage_dialogue | (0, 2923, 3566, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Neite) |
| 2655 | `twocats_unferth_bald` | Unferth | quest_or_varbit_morph_stage_dialogue | (0, 2918, 3558, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Unferth) |
| 2656 | `twocats_unferth_shorthair` | Unferth | quest_or_varbit_morph_stage_dialogue | (0, 2918, 3558, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Unferth) |
| 2657 | `twocats_unferth_mediumhair` | Unferth | quest_or_varbit_morph_stage_dialogue | (0, 2918, 3558, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Unferth) |
| 2658 | `twocats_unferth_spikeyhair` | Unferth | quest_or_varbit_morph_stage_dialogue | (0, 2918, 3558, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Unferth) |
| 2659 | `twocats_unferth_longhair` | Unferth | quest_or_varbit_morph_stage_dialogue | (0, 2918, 3558, m45_55) | [wiki](https://oldschool.runescape.wiki/w/Unferth) |
| 3413 | `goblin_cook` | Goblin Cook | npc_conversation_or_quest_branch | (0, 2982, 9909, m46_154) | [wiki](https://oldschool.runescape.wiki/w/Goblin_Cook) |
| 3414 | `goblin_cook_charred` | Goblin Cook | npc_conversation_or_quest_branch | (0, 2980, 9871, m46_154) | [wiki](https://oldschool.runescape.wiki/w/Goblin_Cook) |
| 2400 | `secret_ghost_messenger` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (0, 2950, 3820, m46_59) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |
| 610 | `grillknight` | Black Knight | npc_conversation_or_quest_branch | (0, 3028, 3508, m47_54) | [wiki](https://oldschool.runescape.wiki/w/Black_Knight) |
| 2397 | `secret_ghost_thief` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (0, 3022, 3946, m47_61) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |
| 2398 | `secret_ghost_mage` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (0, 3112, 3158, m48_49) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |
| 2402 | `secret_ghost_swordsman` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (1, 3294, 3934, m51_61) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |

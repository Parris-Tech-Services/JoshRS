# Brief 18: Recipe for Disaster (100th Quest)

**Anchor:** Recipe for Disaster  
**Anchor date:** 2006-03-15 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 20

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 3385 | `hundred_aris_base` | Gypsy | quest_or_varbit_morph_stage_dialogue | (0, 1866, 5327, m29_83) | [wiki](https://oldschool.runescape.wiki/w/Gypsy) |
| 3466 | `100_rantz` | Rantz | quest_or_varbit_morph_stage_dialogue | (0, 2651, 2962, m41_46) | [wiki](https://oldschool.runescape.wiki/w/Rantz) |
| 3481 | `hundred_ilm_mizaru` | Mizaru | npc_conversation_or_quest_branch | (0, 2787, 2795, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Mizaru) |
| 3482 | `hundred_ilm_kikazaru` | Kikazaru | npc_conversation_or_quest_branch | (0, 2788, 2795, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Kikazaru) |
| 3483 | `hundred_ilm_iwazaru` | Iwazaru | npc_conversation_or_quest_branch | (0, 2789, 2795, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Iwazaru) |
| 3402 | `hundred_dwarf_dad` | An old Dwarf | quest_or_varbit_morph_stage_dialogue | (0, 2865, 9876, m44_154) | [wiki](https://oldschool.runescape.wiki/w/An_old_Dwarf) |
| 3403 | `hundred_dwarf_dad_rohak` | Rohak | quest_or_varbit_morph_stage_dialogue | (0, 2865, 9876, m44_154) | [wiki](https://oldschool.runescape.wiki/w/Rohak) |
| 3405 | `hundred_dwarf_dad_drunk` | Rohak | quest_or_varbit_morph_stage_dialogue | (0, 2865, 9877, m44_154) | [wiki](https://oldschool.runescape.wiki/w/Rohak) |
| 3419 | `100_pirate_mogre_guard` | Mogre Guard | npc_conversation_or_quest_branch | (1, 2968, 9523, m46_148) | [wiki](https://oldschool.runescape.wiki/w/Mogre_Guard) |
| 3420 | `100_pirate_mogre_nung` | Nung | npc_conversation_or_quest_branch | (1, 2975, 9512, m46_148) | [wiki](https://oldschool.runescape.wiki/w/Nung) |
| 3372 | `hundred_varze` | Sir Amik Varze | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sir_Amik_Varze) |
| 3386 | `hundred_aris_cutscene` | Gypsy | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gypsy) |
| 3407 | `hundred_goblin_1` | General Wartface | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/General_Wartface) |
| 3408 | `hundred_goblin_2` | General Bentnoze | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/General_Bentnoze) |
| 3416 | `hundred_pirate` | Pirate Pete | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Pirate_Pete) |
| 3449 | `hundred_guide` | Lumbridge Guide | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Lumbridge_Guide) |
| 3464 | `hundred_ogre` | Skrach Uglogwee | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Skrach_Uglogwee) |
| 3467 | `100_rantz1` | Rantz | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rantz) |
| 3468 | `100_rantz2` | Rantz | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rantz) |
| 3478 | `hundred_monkey` | King Awowogei | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/King_Awowogei) |

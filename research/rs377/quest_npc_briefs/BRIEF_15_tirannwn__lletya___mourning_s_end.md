# Brief 15: Tirannwn, Lletya & Mourning's End

**Anchor:** Regicide/Underground Pass, Mourning's End Part I (2005-07-19) and II (2005-10-17)  
**Anchor date:** 2004 -> 2005-10-17 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 31

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2789 | `mourning_deathalter_dwarf_vis` | Thorgel | quest_or_varbit_morph_stage_dialogue | (0, 1860, 4641, m29_72) | [wiki](https://oldschool.runescape.wiki/w/Thorgel) |
| 1203 | `regicide_tyras_camp_guard` | Tyras guard | interactive_citizen_or_guard_dialogue | (0, 2188, 3171, m34_49) | [wiki](https://oldschool.runescape.wiki/w/Tyras_guard) |
| 1204 | `regicide_tyras_guard` | Tyras guard | interactive_citizen_or_guard_dialogue | (0, 2182, 3147, m34_49) | [wiki](https://oldschool.runescape.wiki/w/Tyras_guard) |
| 1205 | `regicide_tyras_lazy_guard` | Tyras guard | npc_conversation_or_quest_branch | (0, 2181, 3184, m34_49) | [wiki](https://oldschool.runescape.wiki/w/Tyras_guard) |
| 1206 | `regicide_tyras_camp_tent_guard` | Tyras guard | npc_conversation_or_quest_branch | (0, 2185, 3144, m34_49) | [wiki](https://oldschool.runescape.wiki/w/Tyras_guard) |
| 1207 | `regicide_general_hining` | General Hining | npc_conversation_or_quest_branch | (0, 2187, 3149, m34_49) | [wiki](https://oldschool.runescape.wiki/w/General_Hining) |
| 1199 | `regicide_old_camp_tracker` | Elf Tracker | npc_conversation_or_quest_branch | (0, 2257, 3149, m35_49) | [wiki](https://oldschool.runescape.wiki/w/Elf_Tracker) |
| 1679 | `roving_female_woodelf` | Eluned | npc_conversation_or_quest_branch | (0, 2289, 3145, m35_49) | [wiki](https://oldschool.runescape.wiki/w/Eluned) |
| 1680 | `roving_islwyn` | Islwyn | npc_conversation_or_quest_branch | (0, 2291, 3147, m35_49) | [wiki](https://oldschool.runescape.wiki/w/Islwyn) |
| 1777 | `roving_update_female_woodelf` | Ilfeen | npc_conversation_or_quest_branch | (0, 2260, 3213, m35_50) | [wiki](https://oldschool.runescape.wiki/w/Ilfeen) |
| 2352 | `mourning_stores_man` | Eudav | shopkeeper_greeting_and_openshop | (0, 2334, 3182, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Eudav) |
| 2353 | `mourning_seamstress` | Oronwen | shopkeeper_greeting_and_openshop | (0, 2324, 3179, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Oronwen) |
| 2354 | `mourning_elf_bankerm` | Banker | npc_conversation_or_quest_branch | (0, 2352, 3166, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2355 | `mourning_elf_bankerf` | Banker | npc_conversation_or_quest_branch | (0, 2354, 3166, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2356 | `mourning_bow_seller` | Dalldav | shopkeeper_greeting_and_openshop | (0, 2324, 3164, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Dalldav) |
| 2357 | `mourning_elven_cook` | Gethin | shopkeeper_greeting_and_openshop | (1, 2341, 3158, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Gethin) |
| 2358 | `mourning_arianwyn` | Arianwyn | npc_conversation_or_quest_branch | (0, 2352, 3172, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Arianwyn) |
| 2363 | `mourning_town_elf_1` | Goreu | interactive_citizen_or_guard_dialogue | (0, 2337, 3159, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Goreu) |
| 2364 | `mourning_town_elf_2` | Ysgawyn | interactive_citizen_or_guard_dialogue | (1, 2337, 3166, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Ysgawyn) |
| 2365 | `mourning_town_elf_3` | Arvel | interactive_citizen_or_guard_dialogue | (0, 2335, 3177, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Arvel) |
| 2366 | `mourning_town_elf_4` | Mawrth | interactive_citizen_or_guard_dialogue | (0, 2331, 3165, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Mawrth) |
| 2367 | `mourning_town_elf_5` | Kelyn | interactive_citizen_or_guard_dialogue | (1, 2344, 3172, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Kelyn) |
| 2368 | `mourning_elf_kid_1` | Eoin | npc_conversation_or_quest_branch | (0, 2340, 3173, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Eoin) |
| 2369 | `mourning_elf_kid_2` | Iona | npc_conversation_or_quest_branch | (0, 2335, 3169, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Iona) |
| 2376 | `roving_female_woodelf_temp_1` | Eluned | quest_or_varbit_morph_stage_dialogue | (0, 2352, 3171, m36_49) | [wiki](https://oldschool.runescape.wiki/w/Eluned) |
| 1682 | `roving_golrie` | Golrie | npc_conversation_or_quest_branch | (0, 2579, 4451, m40_69) | [wiki](https://oldschool.runescape.wiki/w/Golrie) |
| 1186 | `regicide_good_elf1` | Idris | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Idris) |
| 1187 | `regicide_evil_elf1` | Essyllt | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Essyllt) |
| 1188 | `regicide_evil_elf2` | Morvran | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Morvran) |
| 1202 | `regicide_good_elf3` | Arianwyn | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Arianwyn) |
| 1210 | `regicide_kings_messenger` | Kings messenger | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Kings_messenger) |

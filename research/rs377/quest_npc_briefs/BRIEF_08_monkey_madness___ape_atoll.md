# Brief 8: Monkey Madness & Ape Atoll

**Anchor:** Monkey Madness / Ape Atoll  
**Anchor date:** 2003-2005; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 44

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 1407 | `mm_daero` | Daero | npc_conversation_or_quest_branch | (0, 2392, 9890, m37_154) | [wiki](https://oldschool.runescape.wiki/w/Daero) |
| 1408 | `mm_waydar` | Waydar | npc_conversation_or_quest_branch | (0, 2392, 9895, m37_154) | [wiki](https://oldschool.runescape.wiki/w/Waydar) |
| 1468 | `mm_bonzara` | Bonzara | npc_conversation_or_quest_branch | (0, 2415, 9910, m37_154) | [wiki](https://oldschool.runescape.wiki/w/Bonzara) |
| 1463 | `mm_zoo_monkey` | Monkey | npc_conversation_or_quest_branch | (0, 2601, 3276, m40_51) | [wiki](https://oldschool.runescape.wiki/w/Monkey) |
| 1469 | `mm_monkey_minder` | Monkey Minder | npc_conversation_or_quest_branch | (0, 2595, 3277, m40_51) | [wiki](https://oldschool.runescape.wiki/w/Monkey_Minder) |
| 1428 | `mm_caranock_cutscene` | G.L.O. Caranock | npc_conversation_or_quest_branch | (0, 2603, 4580, m40_71) | [wiki](https://oldschool.runescape.wiki/w/G.L.O._Caranock) |
| 1409 | `mm_waydar_cutscene` | Waydar | npc_conversation_or_quest_branch | (0, 2670, 4559, m41_71) | [wiki](https://oldschool.runescape.wiki/w/Waydar) |
| 1448 | `mm_awowogei_cutscene` | Awowogei | npc_conversation_or_quest_branch | (1, 2678, 4579, m41_71) | [wiki](https://oldschool.runescape.wiki/w/Awowogei) |
| 1441 | `mm_kruk` | Kruk | npc_conversation_or_quest_branch | (0, 2726, 2765, m42_43) | [wiki](https://oldschool.runescape.wiki/w/Kruk) |
| 1452 | `mm_monkey_child` | Monkey Child | npc_conversation_or_quest_branch | (0, 2743, 2795, m42_43) | [wiki](https://oldschool.runescape.wiki/w/Monkey_Child) |
| 1453 | `mm_monkeys_uncle` | The Monkey's Uncle | npc_conversation_or_quest_branch | (1, 2737, 2793, m42_43) | [wiki](https://oldschool.runescape.wiki/w/The_Monkey%27s_Uncle) |
| 1454 | `mm_monkeys_aunt` | The Monkey's Aunt | npc_conversation_or_quest_branch | (0, 2738, 2794, m42_43) | [wiki](https://oldschool.runescape.wiki/w/The_Monkey%27s_Aunt) |
| 1423 | `mm_bunkwicket` | Bunkwicket | npc_conversation_or_quest_branch | (0, 2803, 9148, m43_142) | [wiki](https://oldschool.runescape.wiki/w/Bunkwicket) |
| 1424 | `mm_waymottin` | Waymottin | npc_conversation_or_quest_branch | (0, 2805, 9147, m43_142) | [wiki](https://oldschool.runescape.wiki/w/Waymottin) |
| 1425 | `mm_zooknock` | Zooknock | npc_conversation_or_quest_branch | (0, 2804, 9145, m43_142) | [wiki](https://oldschool.runescape.wiki/w/Zooknock) |
| 1419 | `mm_lumdo` | Lumdo | npc_conversation_or_quest_branch | (0, 2803, 2707, m43_42) | [wiki](https://oldschool.runescape.wiki/w/Lumdo) |
| 1429 | `mm_dugopul` | Dugopul | npc_conversation_or_quest_branch | (0, 2802, 2746, m43_42) | [wiki](https://oldschool.runescape.wiki/w/Dugopul) |
| 1411 | `mm_garkor` | Garkor | npc_conversation_or_quest_branch | (0, 2805, 2762, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Garkor) |
| 1413 | `mm_lumo` | Lumo | npc_conversation_or_quest_branch | (0, 2775, 2796, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Lumo) |
| 1415 | `mm_bunkdo` | Bunkdo | npc_conversation_or_quest_branch | (0, 2775, 2798, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Bunkdo) |
| 1417 | `mm_carado` | Carado | npc_conversation_or_quest_branch | (0, 2775, 2801, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Carado) |
| 1420 | `mm_karam` | Karam | npc_conversation_or_quest_branch | (0, 2758, 2789, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Karam) |
| 1422 | `mm_karam_talker` | Karam | npc_conversation_or_quest_branch | (0, 2781, 2799, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Karam) |
| 1431 | `mm_trefaji` | Trefaji | npc_conversation_or_quest_branch | (0, 2768, 2803, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Trefaji) |
| 1432 | `mm_aberab` | Aberab | npc_conversation_or_quest_branch | (0, 2764, 2803, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Aberab) |
| 1433 | `mm_solihib` | Solihib | shopkeeper_greeting_and_openshop | (0, 2769, 2789, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Solihib) |
| 1434 | `mm_daga` | Daga | shopkeeper_greeting_and_openshop | (0, 2759, 2775, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Daga) |
| 1435 | `mm_tutab` | Tutab | shopkeeper_greeting_and_openshop | (0, 2757, 2770, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Tutab) |
| 1436 | `mm_ifaba` | Ifaba | shopkeeper_greeting_and_openshop | (0, 2754, 2775, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Ifaba) |
| 1437 | `mm_hamab` | Hamab | shopkeeper_greeting_and_openshop | (0, 2781, 2793, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Hamab) |
| 1438 | `mm_hafuba` | Hafuba | npc_conversation_or_quest_branch | (1, 2797, 2798, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Hafuba) |
| 1439 | `mm_denadu` | Denadu | npc_conversation_or_quest_branch | (1, 2805, 2788, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Denadu) |
| 1440 | `mm_lofu` | Lofu | npc_conversation_or_quest_branch | (1, 2805, 2782, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Lofu) |
| 1447 | `mm_padulah` | Padulah | interactive_citizen_or_guard_dialogue | (0, 2757, 2788, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Padulah) |
| 1449 | `mm_uwogo` | Uwogo | npc_conversation_or_quest_branch | (0, 2801, 2764, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Uwogo) |
| 1450 | `mm_murowoi` | Muruwoi | npc_conversation_or_quest_branch | (0, 2804, 2764, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Muruwoi) |
| 1451 | `mm_sleeping_monkey_guard` | Sleeping Monkey | npc_conversation_or_quest_branch | (0, 2760, 2771, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Sleeping_Monkey) |
| 1461 | `mm_elder_guard_1` | Elder Guard | npc_conversation_or_quest_branch | (0, 2798, 2760, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Elder_Guard) |
| 1462 | `mm_elder_guard_2` | Elder Guard | npc_conversation_or_quest_branch | (0, 2801, 2757, m43_43) | [wiki](https://oldschool.runescape.wiki/w/Elder_Guard) |
| 1427 | `mm_caranock` | G.L.O. Caranock | npc_conversation_or_quest_branch | (0, 2956, 3025, m46_47) | [wiki](https://oldschool.runescape.wiki/w/G.L.O._Caranock) |
| 1412 | `mm_garkor_final_battle` | Garkor | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Garkor) |
| 1426 | `mm_zooknock_final_battle` | Zooknock | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zooknock) |
| 1430 | `mm_salenab` | Salenab | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Salenab) |
| 1464 | `mm_freed_zoo_monkey` | Monkey | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Monkey) |

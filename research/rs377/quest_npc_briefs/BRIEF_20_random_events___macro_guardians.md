# Brief 20: Random Events & Macro Guardians

**Anchor:** Random events (not quests)  
**Anchor date:** 2004-2005; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 27

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 3508 | `macro_gravedigger` | Leo | npc_conversation_or_quest_branch | (0, 1928, 5002, m30_78) | [wiki](https://oldschool.runescape.wiki/w/Leo) |
| 2470 | `macro_frog_sulking` | Frog | npc_conversation_or_quest_branch | (0, 2463, 4782, m38_74) | [wiki](https://oldschool.runescape.wiki/w/Frog) |
| 2471 | `macro_frog_noncombat` | Frog | npc_conversation_or_quest_branch | (0, 2455, 4784, m38_74) | [wiki](https://oldschool.runescape.wiki/w/Frog) |
| 2479 | `macro_evil_bob_island` | Evil Bob | npc_conversation_or_quest_branch | (0, 2524, 4777, m39_74) | [wiki](https://oldschool.runescape.wiki/w/Evil_Bob) |
| 2480 | `macro_evil_bob_male_servant` | Servant | npc_conversation_or_quest_branch | (0, 2526, 4778, m39_74) | [wiki](https://oldschool.runescape.wiki/w/Servant) |
| 2481 | `macro_evil_bob_female_servant` | Servant | npc_conversation_or_quest_branch | (0, 2527, 4777, m39_74) | [wiki](https://oldschool.runescape.wiki/w/Servant) |
| 2458 | `macro_forester_m` | Freaky Forester | npc_conversation_or_quest_branch | (0, 2599, 4775, m40_74) | [wiki](https://oldschool.runescape.wiki/w/Freaky_Forester) |
| 2790 | `macro_drilldemon` | Sergeant Damien | npc_conversation_or_quest_branch | (0, 3163, 4818, m49_75) | [wiki](https://oldschool.runescape.wiki/w/Sergeant_Damien) |
| 2308 | `macro_combilock_pirate` | Capt' Arnav | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Capt%27_Arnav) |
| 2469 | `macro_frog_royal` | Frog | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Frog) |
| 2472 | `macro_frog_crier` | Frog | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Frog) |
| 2476 | `macro_highwayman` | Rick Turpentine | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rick_Turpentine) |
| 2536 | `macro_niles` | Niles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Niles) |
| 2537 | `macro_miles` | Miles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Miles) |
| 2538 | `macro_giles` | Giles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Giles) |
| 2539 | `macro_pirate` | Cap'n Hand | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Cap%27n_Hand) |
| 2540 | `macro_jekyll` | Dr Jekyll | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dr_Jekyll) |
| 2547 | `macro_doctor` | Dr Ford | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dr_Ford) |
| 3117 | `macro_sandwich_lady_npc` | Sandwich lady | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sandwich_lady) |
| 3351 | `macro_geni_underwater` | Genie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Genie) |
| 3352 | `macro_mysterious_old_man_underwater` | Mysterious Old Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Mysterious_Old_Man) |
| 3354 | `macro_pirate_underwater` | Cap'n Hand | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Cap%27n_Hand) |
| 3355 | `macro_highwayman_underwater` | Rick Turpentine | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rick_Turpentine) |
| 3356 | `macro_niles_underwater` | Niles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Niles) |
| 3357 | `macro_miles_underwater` | Miles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Miles) |
| 3358 | `macro_giles_underwater` | Giles | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Giles) |
| 3359 | `macro_jekyll_underwater` | Dr Jekyll | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dr_Jekyll) |

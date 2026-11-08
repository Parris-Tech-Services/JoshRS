# Brief 14: The Lost Tribe & Dorgeshuun Mines

**Anchor:** The Lost Tribe (2005-05-31); Death to the Dorgeshuun is 2006-06-21 (likely post-377: verify)  
**Anchor date:** 2005-05-31 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 19

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2083 | `lost_tribe_sigmund_ham_there` | Sigmund | quest_or_varbit_morph_stage_dialogue | (0, 3169, 9627, m49_150) | [wiki](https://oldschool.runescape.wiki/w/Sigmund) |
| 1822 | `cave_goblin` | Cave goblin | interactive_citizen_or_guard_dialogue | (0, 3256, 9572, m50_149) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin) |
| 1823 | `cave_goblin2` | Cave goblin | interactive_citizen_or_guard_dialogue | (0, 3247, 9558, m50_149) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin) |
| 1824 | `cave_goblin3` | Cave goblin | interactive_citizen_or_guard_dialogue | (0, 3253, 9565, m50_149) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin) |
| 1825 | `cave_goblin4` | Cave goblin | interactive_citizen_or_guard_dialogue | (0, 3246, 9581, m50_149) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin) |
| 2086 | `lost_tribe_guide_1op` | Kazgar | quest_or_varbit_morph_stage_dialogue | (0, 3231, 9610, m50_150) | [wiki](https://oldschool.runescape.wiki/w/Kazgar) |
| 2082 | `lost_tribe_sigmund_there` | Sigmund | quest_or_varbit_morph_stage_dialogue | (1, 3209, 3219, m50_50) | [wiki](https://oldschool.runescape.wiki/w/Sigmund) |
| 2069 | `cave_goblin_miner` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3312, 9652, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2070 | `cave_goblin_miner2` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3312, 9646, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2071 | `cave_goblin_miner3` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3315, 9620, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2072 | `cave_goblin_miner4` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3314, 9630, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2073 | `cave_goblin_guard1` | Cave goblin guard | interactive_citizen_or_guard_dialogue | (0, 3318, 9602, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_guard) |
| 2074 | `cave_goblin_guard2` | Cave goblin guard | interactive_citizen_or_guard_dialogue | (0, 3320, 9632, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_guard) |
| 2076 | `cave_goblin_miner2_mining` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3312, 9646, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2078 | `cave_goblin_miner4_mining` | Cave goblin miner | interactive_citizen_or_guard_dialogue | (0, 3321, 9646, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2084 | `lost_tribe_mistag` | Mistag | npc_conversation_or_quest_branch | (0, 3319, 9615, m51_150) | [wiki](https://oldschool.runescape.wiki/w/Mistag) |
| 2075 | `cave_goblin_miner_mining` | Cave goblin miner | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2077 | `cave_goblin_miner3_mining` | Cave goblin miner | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Cave_goblin_miner) |
| 2087 | `lost_tribe_cutscene_urtag` | Ur-tag | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ur-tag) |

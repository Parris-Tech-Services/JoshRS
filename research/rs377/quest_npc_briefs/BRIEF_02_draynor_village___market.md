# Brief 2: Draynor Village & Market

**Anchor:** Classic F2P leftovers  
**Anchor date:** 2001-2004 (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 7

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2567 | `wom_cutscene_2` | Wise Old Man | quest_or_varbit_morph_stage_dialogue | (0, 2345, 3651, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Wise_Old_Man) |
| 2566 | `wom_cutscene_1` | Wise Old Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Wise_Old_Man) |
| 2568 | `wom_banker1` | Banker | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2569 | `wom_banker2` | Banker | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2570 | `wom_banker3` | Banker | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2572 | `wom_olivia` | Olivia | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Olivia) |
| 2633 | `wom_original` | Wise Old Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Wise_Old_Man) |

# Brief 4: Port Sarim, Rimmington & Void Knights' Outpost

**Anchor:** Classic F2P + Pest Control outpost  
**Anchor date:** 2001-2005; confirm per NPC (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 21

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 3786 | `pest_voidknight_1` | Void Knight | npc_conversation_or_quest_branch | (0, 2654, 2663, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Void_Knight) |
| 3787 | `pest_voidknight_2` | Void Knight | npc_conversation_or_quest_branch | (0, 2659, 2665, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Void_Knight) |
| 3788 | `pest_voidknight_3` | Void Knight | npc_conversation_or_quest_branch | (0, 2662, 2649, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Void_Knight) |
| 3789 | `pest_voidknight_4` | Void Knight | npc_conversation_or_quest_branch | (0, 2662, 2653, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Void_Knight) |
| 3790 | `pest_squire_1` | Squire | npc_conversation_or_quest_branch | (0, 2658, 2668, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3791 | `pest_squire_2` | Squire | npc_conversation_or_quest_branch | (0, 2656, 2658, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3792 | `pest_squire_3` | Squire | npc_conversation_or_quest_branch | (0, 2667, 2654, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3793 | `pest_squire_4` | Squire | npc_conversation_or_quest_branch | (0, 2662, 2661, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3796 | `pest_squire_rangeshop` | Squire | shopkeeper_greeting_and_openshop | (0, 2667, 2660, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3797 | `pest_squire_blacksmith` | Squire | npc_conversation_or_quest_branch | (0, 2649, 2659, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3798 | `pest_squire_runeshop` | Squire | shopkeeper_greeting_and_openshop | (0, 2658, 2652, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3799 | `pest_squire_storemaster` | Squire | shopkeeper_greeting_and_openshop | (0, 2648, 2665, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3800 | `pest_squire_ship_island` | Squire | npc_conversation_or_quest_branch | (0, 2659, 2676, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 3802 | `pest_squire_lander` | Squire | npc_conversation_or_quest_branch | (0, 2658, 2647, m41_41) | [wiki](https://oldschool.runescape.wiki/w/Squire) |
| 2730 | `shipmonk2_b` | Monk of Entrana | npc_conversation_or_quest_branch | (0, 2835, 3336, m44_52) | [wiki](https://oldschool.runescape.wiki/w/Monk_of_Entrana) |
| 2731 | `shipmonk2_c` | Monk of Entrana | npc_conversation_or_quest_branch | (0, 2839, 3335, m44_52) | [wiki](https://oldschool.runescape.wiki/w/Monk_of_Entrana) |
| 2718 | `sarim_betty` | Betty | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Betty) |
| 2719 | `sarim_grum` | Grum | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Grum) |
| 2720 | `sarim_gerrant` | Gerrant | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gerrant) |
| 2721 | `sarim_wydin` | Wydin | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Wydin) |
| 3781 | `pest_squire_instance` | Squire | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Squire) |

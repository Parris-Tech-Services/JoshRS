# Brief 10: Mage Training Arena

**Anchor:** Mage Training Arena minigame  
**Anchor date:** 2005-2006; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 12

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 3099 | `magictraining_guard_alchem` | Alchemy Guardian | npc_conversation_or_quest_branch | (2, 3364, 9626, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Alchemy_Guardian) |
| 3100 | `magictraining_guard_encha` | Enchantment Guardian | npc_conversation_or_quest_branch | (0, 3364, 9647, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Enchantment_Guardian) |
| 3101 | `magictraining_guard_grave` | Graveyard Guardian | npc_conversation_or_quest_branch | (1, 3362, 9644, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Graveyard_Guardian) |
| 3104 | `magictraining_ghost_shoes` | Charmed Warrior | npc_conversation_or_quest_branch | (0, 3382, 9631, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Charmed_Warrior) |
| 3105 | `magictraining_ghost_shoes2` | Charmed Warrior | npc_conversation_or_quest_branch | (0, 3382, 9655, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Charmed_Warrior) |
| 3106 | `magictraining_ghost_shoes3` | Charmed Warrior | npc_conversation_or_quest_branch | (0, 3350, 9652, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Charmed_Warrior) |
| 3107 | `magictraining_ghost_shoes4` | Charmed Warrior | npc_conversation_or_quest_branch | (0, 3347, 9623, m52_150) | [wiki](https://oldschool.runescape.wiki/w/Charmed_Warrior) |
| 3098 | `magictraining_guard_tele` | Telekinetic Guardian | npc_conversation_or_quest_branch | (0, 3333, 9719, m52_151) | [wiki](https://oldschool.runescape.wiki/w/Telekinetic_Guardian) |
| 3102 | `magictraining_guard_maze` | Maze Guardian | npc_conversation_or_quest_branch | (2, 3354, 9679, m52_151) | [wiki](https://oldschool.runescape.wiki/w/Maze_Guardian) |
| 3097 | `magictraining_guard_entrance` | Entrance Guardian | npc_conversation_or_quest_branch | (0, 3363, 3304, m52_51) | [wiki](https://oldschool.runescape.wiki/w/Entrance_Guardian) |
| 3103 | `magictraining_guard_rewards` | Rewards Guardian | npc_conversation_or_quest_branch | (1, 3362, 3318, m52_51) | [wiki](https://oldschool.runescape.wiki/w/Rewards_Guardian) |
| 3096 | `magictraining_pizazz_hat` | Pizzaz Hat | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Pizzaz_Hat) |

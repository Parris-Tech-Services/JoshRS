# Brief 6: TzHaar City & Fight Caves

**Anchor:** TzHaar City / Fight Caves  
**Anchor date:** 2003-2004; confirm (wiki-confirmed: no, confirm before starting)  
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
| 2618 | `tzhaar_fightpit_master` | TzHaar-Mej-Kah | npc_conversation_or_quest_branch | (0, 2399, 5178, m37_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Mej-Kah) |
| 2617 | `tzhaar_fightcave_master` | TzHaar-Mej-Jal | npc_conversation_or_quest_branch | (0, 2438, 5169, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Mej-Jal) |
| 2620 | `tzhaar_merchant_equipment` | TzHaar-Hur-Tel | shopkeeper_greeting_and_openshop | (0, 2478, 5146, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Hur-Tel) |
| 2622 | `tzhaar_merchant_oreandgem` | TzHaar-Hur-Lek | shopkeeper_greeting_and_openshop | (0, 2464, 5149, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Hur-Lek) |
| 2623 | `tzhaar_merchant_rune` | TzHaar-Mej-Roh | shopkeeper_greeting_and_openshop | (0, 2462, 5125, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Mej-Roh) |
| 2624 | `tzhaar_guard_spawningpool` | TzHaar-Ket | npc_conversation_or_quest_branch | (0, 2472, 5139, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Ket) |
| 2625 | `tzhaar_guard_border` | TzHaar-Ket | npc_conversation_or_quest_branch | (0, 2436, 5122, m38_80) | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Ket) |

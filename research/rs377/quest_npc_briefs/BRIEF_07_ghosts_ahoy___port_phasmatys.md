# Brief 7: Ghosts Ahoy & Port Phasmatys

**Anchor:** Ghosts Ahoy / Port Phasmatys  
**Anchor date:** 2004; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 17

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 1695 | `ahoy_crone` | Old crone | npc_conversation_or_quest_branch | (0, 3461, 3558, m54_55) | [wiki](https://oldschool.runescape.wiki/w/Old_crone) |
| 1696 | `ahoy_oldman` | Old man | npc_conversation_or_quest_branch | (1, 3617, 3544, m56_55) | [wiki](https://oldschool.runescape.wiki/w/Old_man) |
| 1701 | `ahoy_ghost_farmer` | Ghost Farmer | npc_conversation_or_quest_branch | (0, 3617, 3528, m56_55) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Farmer) |
| 1683 | `ahoy_velorina` | Velorina | npc_conversation_or_quest_branch | (0, 3678, 3510, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Velorina) |
| 1684 | `ahoy_necrovarus` | Necrovarus | npc_conversation_or_quest_branch | (0, 3660, 3516, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Necrovarus) |
| 1685 | `ahoy_ghost_protestor` | Gravingas | npc_conversation_or_quest_branch | (0, 3660, 3499, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Gravingas) |
| 1686 | `ahoy_disciple` | Ghost Disciple | npc_conversation_or_quest_branch | (0, 3655, 3516, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Disciple) |
| 1688 | `ahoy_akharanu` | Ak-Haranu | shopkeeper_greeting_and_openshop | (0, 3689, 3495, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ak-Haranu) |
| 1694 | `ahoy_robin` | Robin | npc_conversation_or_quest_branch | (0, 3672, 3491, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Robin) |
| 1697 | `ahoy_ghost_villager` | Ghost Villager | npc_conversation_or_quest_branch | (0, 3658, 3465, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Villager) |
| 1699 | `ahoy_ghost_shopkeeper` | Ghost Shopkeeper | shopkeeper_greeting_and_openshop | (0, 3658, 3477, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Shopkeeper) |
| 1700 | `ahoy_ghost_innkeeper` | Ghost Innkeeper | npc_conversation_or_quest_branch | (0, 3681, 3496, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Innkeeper) |
| 1702 | `ahoy_ghost_banker` | Ghost Banker | npc_conversation_or_quest_branch | (0, 3687, 3464, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Banker) |
| 1703 | `ahoy_ghost_sailor` | Ghost Sailor | npc_conversation_or_quest_branch | (0, 3686, 3503, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Sailor) |
| 1704 | `ahoy_ghost_captain_1` | Ghost Captain | npc_conversation_or_quest_branch | (0, 3703, 3487, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Captain) |
| 1705 | `ahoy_ghost_captain_2` | Ghost Captain | npc_conversation_or_quest_branch | (0, 3691, 3513, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Captain) |
| 1706 | `ahoy_ghost_guard` | Ghost Guard | npc_conversation_or_quest_branch | (0, 3652, 3484, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Ghost_Guard) |

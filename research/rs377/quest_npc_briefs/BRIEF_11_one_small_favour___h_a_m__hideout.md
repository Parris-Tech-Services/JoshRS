# Brief 11: One Small Favour & H.A.M. Hideout

**Anchor:** One Small Favour  
**Anchor date:** 2005-02-28 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 15

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 1798 | `favour_phantuwti_farsight` | Phantuwti Fanstuwi Farsight | npc_conversation_or_quest_branch | (0, 2705, 3474, m42_54) | [wiki](https://oldschool.runescape.wiki/w/Phantuwti_Fanstuwi_Farsight) |
| 1794 | `favour_hammerspike_stoutbeard` | Hammerspike Stoutbeard | npc_conversation_or_quest_branch | (0, 2965, 9811, m46_153) | [wiki](https://oldschool.runescape.wiki/w/Hammerspike_Stoutbeard) |
| 1795 | `favour_gangster_dwarf` | Dwarf gang member | interactive_citizen_or_guard_dialogue | (0, 2966, 9813, m46_153) | [wiki](https://oldschool.runescape.wiki/w/Dwarf_gang_member) |
| 1796 | `favour_gangster_dwarf_2` | Dwarf gang member | interactive_citizen_or_guard_dialogue | (0, 2967, 9813, m46_153) | [wiki](https://oldschool.runescape.wiki/w/Dwarf_gang_member) |
| 1797 | `favour_gangster_dwarf_3` | Dwarf gang member | interactive_citizen_or_guard_dialogue | (0, 2968, 9813, m46_153) | [wiki](https://oldschool.runescape.wiki/w/Dwarf_gang_member) |
| 1709 | `favour_johanhus_ulsbrecht` | Johanhus Ulsbrecht | npc_conversation_or_quest_branch | (0, 3171, 9620, m49_150) | [wiki](https://oldschool.runescape.wiki/w/Johanhus_Ulsbrecht) |
| 1710 | `favour_guard_male_no_beard` | H.A.M. Guard | interactive_citizen_or_guard_dialogue | (0, 3159, 9613, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Guard) |
| 1711 | `favour_guard_male_bearded` | H.A.M. Guard | interactive_citizen_or_guard_dialogue | (0, 3147, 9620, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Guard) |
| 1712 | `favour_guard_long_beard` | H.A.M. Guard | interactive_citizen_or_guard_dialogue | (0, 3150, 9650, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Guard) |
| 1714 | `favour_male_ham_civilian` | H.A.M. Member | interactive_citizen_or_guard_dialogue | (0, 3144, 9619, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Member) |
| 1715 | `favour_female_ham_civilian` | H.A.M. Member | interactive_citizen_or_guard_dialogue | (0, 3150, 9624, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Member) |
| 1716 | `favour_npc_floor` | H.A.M. Member | npc_conversation_or_quest_branch | (0, 3151, 9625, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Member) |
| 1717 | `favour_npc_chair` | H.A.M. Member | npc_conversation_or_quest_branch | (0, 3162, 9633, m49_150) | [wiki](https://oldschool.runescape.wiki/w/H.A.M._Member) |
| 1718 | `favour_jimmy` | Jimmy the Chisel | npc_conversation_or_quest_branch | (0, 3184, 9610, m49_150) | [wiki](https://oldschool.runescape.wiki/w/Jimmy_the_Chisel) |
| 1801 | `favour_petra` | Petra Fiyed | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Petra_Fiyed) |

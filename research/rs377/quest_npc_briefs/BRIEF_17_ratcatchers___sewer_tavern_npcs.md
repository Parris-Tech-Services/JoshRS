# Brief 17: Ratcatchers & Sewer/Tavern NPCs

**Anchor:** Rat Catchers  
**Anchor date:** 2005-11-28 (wiki-confirmed: yes)  
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
| 2991 | `vc_dwarf_rich1` | Rauborn | npc_conversation_or_quest_branch | (0, 1938, 4689, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Rauborn) |
| 2992 | `vc_dwarf_rich2` | Vaeringk | npc_conversation_or_quest_branch | (0, 1937, 4690, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Vaeringk) |
| 2993 | `vc_dwarf_poor1` | Oxi | npc_conversation_or_quest_branch | (0, 1932, 4699, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Oxi) |
| 2994 | `vc_dwarf_poor2` | Fior | npc_conversation_or_quest_branch | (0, 1932, 4701, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Fior) |
| 2995 | `vc_dwarf_poor3` | Sagira | npc_conversation_or_quest_branch | (0, 1946, 4709, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Sagira) |
| 2996 | `vc_dwarf_poor4` | Anleif | npc_conversation_or_quest_branch | (0, 1948, 4712, m30_73) | [wiki](https://oldschool.runescape.wiki/w/Anleif) |
| 2945 | `vc_bones` | Bones | npc_conversation_or_quest_branch | (0, 2562, 3319, m40_51) | [wiki](https://oldschool.runescape.wiki/w/Bones) |
| 2949 | `vc_jimmy_dazzler` | Jimmy Dazzler | npc_conversation_or_quest_branch | (0, 2562, 3320, m40_51) | [wiki](https://oldschool.runescape.wiki/w/Jimmy_Dazzler) |
| 2998 | `vc_gambler_rich1` | Gambler | npc_conversation_or_quest_branch | (0, 2660, 9622, m41_150) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 3001 | `vc_gambler_rich4` | Gambler | npc_conversation_or_quest_branch | (0, 2647, 9635, m41_150) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 3002 | `vc_gambler_woman1` | Gambler | npc_conversation_or_quest_branch | (0, 2664, 9628, m41_150) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 3003 | `vc_gambler_woman2` | Gambler | npc_conversation_or_quest_branch | (0, 2653, 9632, m41_150) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 3006 | `vc_gambler_poor2` | Gambler | npc_conversation_or_quest_branch | (0, 2656, 9643, m41_150) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 2941 | `vc_the_beast` | The Beast | npc_conversation_or_quest_branch | (0, 2913, 10189, m45_159) | [wiki](https://oldschool.runescape.wiki/w/The_Beast) |
| 2952 | `vc_smokin_joe` | Smokin' Joe | npc_conversation_or_quest_branch | (0, 2930, 10213, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Smokin%27_Joe) |
| 2997 | `vc_gertrudescat` | Gertrude's cat | npc_conversation_or_quest_branch | (0, 2910, 5100, m45_79) | [wiki](https://oldschool.runescape.wiki/w/Gertrude%27s_cat) |
| 3000 | `vc_gambler_rich3` | Barman | npc_conversation_or_quest_branch | (0, 2909, 5076, m45_79) | [wiki](https://oldschool.runescape.wiki/w/Barman) |
| 3004 | `vc_gambler_woman3` | Gambler | npc_conversation_or_quest_branch | (0, 2905, 5094, m45_79) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 3005 | `vc_gambler_poor1` | Gambler | npc_conversation_or_quest_branch | (0, 2908, 5078, m45_79) | [wiki](https://oldschool.runescape.wiki/w/Gambler) |
| 2951 | `vc_felkrash_the_bard` | Felkrash | npc_conversation_or_quest_branch | (0, 2977, 9639, m46_150) | [wiki](https://oldschool.runescape.wiki/w/Felkrash) |
| 2999 | `vc_gambler_rich2` | Gambler | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gambler) |

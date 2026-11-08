# Brief 5: Karamja, Shilo Village & Tai Bwo Wannai

**Anchor:** Shilo Village / Jungle Potion / Tai Bwo Wannai  
**Anchor date:** 2002-2004; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 8

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 1163 | `tbwt_tiadeche` | Tiadeche | quest_or_varbit_morph_stage_dialogue | (0, 2528, 4589, m39_71) | [wiki](https://oldschool.runescape.wiki/w/Tiadeche) |
| 1165 | `tbwt_tinsay` | Tinsay | quest_or_varbit_morph_stage_dialogue | (0, 2765, 2976, m43_46) | [wiki](https://oldschool.runescape.wiki/w/Tinsay) |
| 1164 | `tbwt_tiadeche_final` | Tiadeche | shopkeeper_greeting_and_openshop | (0, 2781, 3057, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Tiadeche) |
| 1166 | `tbwt_tinsay_final` | Tinsay | quest_or_varbit_morph_stage_dialogue | (0, 2790, 3054, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Tinsay) |
| 1162 | `tbwt_timfraku` | Timfraku | npc_conversation_or_quest_branch | (1, 2780, 3087, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Timfraku) |
| 1171 | `tbwt_lubufu` | Lubufu | npc_conversation_or_quest_branch | (0, 2770, 3169, m43_49) | [wiki](https://oldschool.runescape.wiki/w/Lubufu) |
| 1167 | `tbwt_tamayu` | Tamayu | quest_or_varbit_morph_stage_dialogue | (0, 2844, 3042, m44_47) | [wiki](https://oldschool.runescape.wiki/w/Tamayu) |
| 1168 | `tbwt_tamayu_final` | Tamayu | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/Tamayu) |

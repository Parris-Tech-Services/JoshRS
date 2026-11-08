# Brief 16: Morytania, Canifis & Burgh de Rott

**Anchor:** Nature Spirit, Rum Deal (2005-10-31), Wanted! (2005-10-17), In Aid of the Myreque (2006-03-22), Cabin Fever (2006-02-07)  
**Anchor date:** 2003 -> 2006-03-22 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 50

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 3539 | `burgh_rescue_veliaf_hurtz_talk` | Veliaf Hurtz | quest_or_varbit_morph_stage_dialogue | (0, 3494, 9628, m54_150) | [wiki](https://oldschool.runescape.wiki/w/Veliaf_Hurtz) |
| 3511 | `burgh_villager_blood_tithe` | Wiskit | quest_or_varbit_morph_stage_dialogue | (0, 3515, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Wiskit) |
| 3514 | `burgh_vampire_juve1_blood_tithe` | Vampyre Juvinate | quest_or_varbit_morph_stage_dialogue | (0, 3513, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Vampyre_Juvinate) |
| 3515 | `burgh_vampire_juve2_blood_tithe` | Vampyre Juvinate | quest_or_varbit_morph_stage_dialogue | (0, 3513, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Vampyre_Juvinate) |
| 3517 | `burgh_gadderanks` | Gadderanks | quest_or_varbit_morph_stage_dialogue | (0, 3514, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Gadderanks) |
| 3540 | `burgh_vilager_leader` | Elisabeta | npc_conversation_or_quest_branch | (0, 3490, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Elisabeta) |
| 3541 | `burgh_general_store_owner` | Aurel | shopkeeper_greeting_and_openshop | (0, 3517, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Aurel) |
| 3542 | `burgh_villager_0` | Sorin | npc_conversation_or_quest_branch | (0, 3513, 3234, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Sorin) |
| 3543 | `burgh_vilager_1` | Luscion | npc_conversation_or_quest_branch | (0, 3491, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Luscion) |
| 3544 | `burgh_vilager_2` | Sergiu | npc_conversation_or_quest_branch | (0, 3503, 3231, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Sergiu) |
| 3545 | `burgh_vilager_3` | Radu | npc_conversation_or_quest_branch | (0, 3511, 3224, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Radu) |
| 3546 | `burgh_vilager_4` | Grigore | npc_conversation_or_quest_branch | (0, 3489, 3222, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Grigore) |
| 3547 | `burgh_vilager_5` | Ileana | npc_conversation_or_quest_branch | (0, 3514, 3228, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Ileana) |
| 3548 | `burgh_vilager_6` | Valeria | npc_conversation_or_quest_branch | (0, 3509, 3209, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Valeria) |
| 3549 | `burgh_vilager_7` | Emilia | npc_conversation_or_quest_branch | (0, 3482, 3210, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Emilia) |
| 3550 | `burgh_vilager_8` | Florin | npc_conversation_or_quest_branch | (0, 3483, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Florin) |
| 3551 | `burgh_villager_child1` | Catalina | npc_conversation_or_quest_branch | (0, 3489, 3221, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Catalina) |
| 3552 | `burgh_villager_child2` | Ivan | npc_conversation_or_quest_branch | (0, 3508, 3208, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Ivan) |
| 3553 | `burgh_villager_child3` | Victor | npc_conversation_or_quest_branch | (0, 3482, 3208, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Victor) |
| 3554 | `burgh_villager_child4` | Helena | npc_conversation_or_quest_branch | (0, 3484, 3207, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Helena) |
| 3555 | `burgh_farmer` | Teodor | npc_conversation_or_quest_branch | (0, 3504, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Teodor) |
| 3557 | `burgh_bed_man_wife` | Gabriela | npc_conversation_or_quest_branch | (0, 3514, 3209, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Gabriela) |
| 3559 | `burgh_vilager_sit1` | Calin | npc_conversation_or_quest_branch | (0, 3498, 3242, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Calin) |
| 3560 | `burgh_vilager_sit2` | Mihail | npc_conversation_or_quest_branch | (0, 3480, 3222, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Mihail) |
| 3561 | `burgh_vilager_sit3` | Nicoleta | npc_conversation_or_quest_branch | (0, 3479, 3223, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Nicoleta) |
| 3562 | `burgh_vilager_sit4` | Simona | npc_conversation_or_quest_branch | (0, 3499, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Simona) |
| 3563 | `burgh_vilager_rat_1` | Vasile | npc_conversation_or_quest_branch | (0, 3485, 3237, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Vasile) |
| 3564 | `burgh_vilager_rat_2` | Razvan | npc_conversation_or_quest_branch | (0, 3492, 3235, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Razvan) |
| 3565 | `burgh_vilager_rat_3` | Luminata | npc_conversation_or_quest_branch | (0, 3504, 3235, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Luminata) |
| 3568 | `burgh_potential_bank_teller` | Cornelius | quest_or_varbit_morph_stage_dialogue | (0, 3496, 3212, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Cornelius) |
| 3569 | `burgh_bank_teller` | Cornelius | quest_or_varbit_morph_stage_dialogue | (0, 3493, 3211, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Cornelius) |
| 1257 | `mort_afflicted_man` | Afflicted | interactive_citizen_or_guard_dialogue | (0, 3466, 3306, m54_51) | [wiki](https://oldschool.runescape.wiki/w/Afflicted) |
| 1258 | `mort_afflicted_woman` | Afflicted | interactive_citizen_or_guard_dialogue | (0, 3466, 3309, m54_51) | [wiki](https://oldschool.runescape.wiki/w/Afflicted) |
| 1261 | `mort_afflicted_man2` | Afflicted | interactive_citizen_or_guard_dialogue | (0, 3469, 3308, m54_51) | [wiki](https://oldschool.runescape.wiki/w/Afflicted) |
| 1262 | `mort_afflicted_woman2` | Afflicted | interactive_citizen_or_guard_dialogue | (0, 3472, 3304, m54_51) | [wiki](https://oldschool.runescape.wiki/w/Afflicted) |
| 1576 | `canafis_stranger` | Stranger | quest_or_varbit_morph_stage_dialogue | (0, 3503, 3477, m54_54) | [wiki](https://oldschool.runescape.wiki/w/Stranger) |
| 1660 | `werewolf_skullballboss` | Skullball Boss | npc_conversation_or_quest_branch | (0, 3549, 9867, m55_154) | [wiki](https://oldschool.runescape.wiki/w/Skullball_Boss) |
| 1661 | `werewolf_trainer_start` | Agility Boss | npc_conversation_or_quest_branch | (0, 3540, 9873, m55_154) | [wiki](https://oldschool.runescape.wiki/w/Agility_Boss) |
| 1662 | `werewolf_trainer_1` | Skullball Trainer | npc_conversation_or_quest_branch | (0, 3554, 9886, m55_154) | [wiki](https://oldschool.runescape.wiki/w/Skullball_Trainer) |
| 3509 | `burgh_villager_0_blood_tithe` | Sorin | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sorin) |
| 3518 | `burgh_gadderanks_attackable` | Gadderanks | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gadderanks) |
| 3519 | `burgh_gadderanks_wounded` | Gadderanks | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gadderanks) |
| 3535 | `burgh_ivan_strom_temple_ambush` | Ivan Strom | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ivan_Strom) |
| 3536 | `burgh_ivan_strom_temple_ambush_sickle` | Ivan Strom | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ivan_Strom) |
| 3556 | `burgh_bed_man` | Marius | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Marius) |
| 3558 | `burgh_donor_man` | Vladimir | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Vladimir) |
| 3570 | `burgh_turned_vampyre_male_ben` | Benjamin | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Benjamin) |
| 3571 | `burgh_turned_vampyre_male_liam` | Liam | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Liam) |
| 3572 | `burgh_turned_vampyre_male_miala` | Miala | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Miala) |
| 3573 | `burgh_turned_vampyre_male_verak` | Verak | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Verak) |

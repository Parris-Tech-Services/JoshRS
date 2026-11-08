# Brief 21: Unspawned / Dynamic / Cutscene / Morph Variants

**Anchor:** Cutscene / quest-stage / seasonal variants: attach each to its parent quest or seasonal event  
**Anchor date:** mixed (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 112

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 248 | `morgan_le_faye` | Morgan Le Faye | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Morgan_Le_Faye) |
| 484 | `localgnome` | Local Gnome | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Local_Gnome) |
| 501 | `zadimus_ghost` | Spirit of Zadimus | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Spirit_of_Zadimus) |
| 681 | `ranging_guild_poison_salesman` | Weapon poison salesman | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Weapon_poison_salesman) |
| 726 | `w_ardougnecitizen1` | Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Man) |
| 727 | `w_ardougnecitizen2` | Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Man) |
| 730 | `w_ardougnecitizen5` | Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Man) |
| 791 | `seth` | Seth | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Seth) |
| 823 | `anabarrel` | Ana | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ana) |
| 857 | `ogre_guard` | Ogre guard | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ogre_guard) |
| 869 | `skavidtalker5` | Skavid | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Skavid) |
| 892 | `hazeel` | Hazeel | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Hazeel) |
| 930 | `ungadulu_bad` | Ungadulu | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ungadulu) |
| 1410 | `npc_1410` | Waydar | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Waydar) |
| 1552 | `santa_claus` | Santa | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Santa) |
| 1557 | `trollromance_eat_test` | Ug | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ug) |
| 1579 | `route_vanstrom_klause_normal` | Vanstrom Klause | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Vanstrom_Klause) |
| 1580 | `route_vanstrom_klause_vamp_wingsgrow` | Vanstrom Klause | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Vanstrom_Klause) |
| 1581 | `route_vanstrom_klause_vamp` | Vanstrom Klause | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Vanstrom_Klause) |
| 1835 | `easter05_bunny` | Easter Bunny | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Easter_Bunny) |
| 2005 | `ics_little_redheadlady_normeyes` | Wanderer | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Wanderer) |
| 2058 | `zogre_human_brentle_vahn` | Zombie | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zombie) |
| 2285 | `rd_combat_npc_room_3` | Sir Leye | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sir_Leye) |
| 2328 | `npc_2328` | Gardener | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gardener) |
| 2329 | `iago` | Iago | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Iago) |
| 2431 | `forget_cutscene_sitting` | Ulifed | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ulifed) |
| 2432 | `dwarf_red_axe_henchman` | Red Axe Henchman | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Red_Axe_Henchman) |
| 2433 | `dwarf_red_axe_henchman2` | Red Axe Henchman | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Red_Axe_Henchman) |
| 2434 | `ogre_red_axe_shaman` | Ogre shaman | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Ogre_shaman) |
| 2551 | `npc_2551` | Dwarven Miner | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Miner) |
| 2621 | `npc_2621` | TzHaar-Hur-Koz | shopkeeper_greeting_and_openshop | unspawned | [wiki](https://oldschool.runescape.wiki/w/TzHaar-Hur-Koz) |
| 2635 | `twocats_bob_cutscene` | Bob | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Bob) |
| 2636 | `twocats_bob_cutscene2` | Bob | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Bob) |
| 2637 | `twocats_sphinx_cutscene` | Sphinx | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sphinx) |
| 2638 | `twocats_niete_cutscene` | Neite | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Neite) |
| 2639 | `twocats_robert_cutscene` | Robert the Strong | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Robert_the_Strong) |
| 2640 | `twocats_odysseus_cutscene` | Odysseus | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Odysseus) |
| 2646 | `twocats_niete_veil` | Neite | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Neite) |
| 2647 | `twocats_bob_bow_tie` | Bob | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Bob) |
| 2648 | `twocats_special_kitten` | Beite | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Beite) |
| 2649 | `twocats_gnome_woman` | Gnome | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gnome) |
| 2650 | `twocats_gnome_man` | Gnome | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Gnome) |
| 2651 | `twocats_odysseus_ghost` | Odysseus | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Odysseus) |
| 2676 | `makeover_mage_female` | Make-over mage | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Make-over_mage) |
| 2747 | `wanted_solus` | Solus Dellagar | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Solus_Dellagar) |
| 2748 | `wanted_savant` | Savant | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Savant) |
| 2776 | `wanted_solus_fake_woman_base_config` | Woman | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Woman) |
| 2863 | `break_zomb_waist` | Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zombie) |
| 2864 | `break_zomb_legs` | Most of a Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Most_of_a_Zombie) |
| 2865 | `break_zomb_torso` | Most of a Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Most_of_a_Zombie) |
| 2866 | `break_zomb_neck` | Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zombie) |
| 2867 | `break_zomb_headless` | Most of a Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Most_of_a_Zombie) |
| 2869 | `break_zombie_middle` | Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zombie) |
| 2870 | `break_zombie_half` | Half-Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Half-Zombie) |
| 2871 | `break_zombie_half_2` | Other Half-Zombie | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Other_Half-Zombie) |
| 2872 | `trickortreater_1` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 2873 | `trickortreater_2` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 2874 | `trickortreater_3` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 2875 | `trickortreater_4` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 2876 | `trickortreater_5` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 2877 | `trickortreater_6` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3092 | `win05_hooded_stranger` | Hooded Stranger | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Hooded_Stranger) |
| 3131 | `enakh_desert_spirit` | Desert Spirit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Desert_Spirit) |
| 3156 | `fever_cutscene_teach` | Bill Teach | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |
| 3187 | `fever_pirate_enemy_01` | Pirate | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3210 | `alrena_gasmask_mask` | Alrena | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Alrena) |
| 3211 | `alrena_gasmask_mix` | Alrena | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Alrena) |
| 3212 | `bravek_hangover_cure_anim` | Bravek | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Bravek) |
| 3300 | `fairy_frog` | Frog | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Frog) |
| 3311 | `fairy_sheepsheered` | Sheep | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Sheep) |
| 3312 | `fairy_greek_choir` | Zanaris Choir | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Zanaris_Choir) |
| 3635 | `templetrek_good_samaritan` | Abidor Crank | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Abidor_Crank) |
| 3636 | `treevillage_small_spirittree` | Spirit tree | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Spirit_tree) |
| 3637 | `treevillage_spirittree` | Spirit tree | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Spirit_tree) |
| 3640 | `soulbane_launa_young` | Launa | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Launa) |
| 3641 | `soulbane_brana` | Brana | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Brana) |
| 3682 | `easter06_npc_3682` | Easter Bunny | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Easter_Bunny) |
| 3683 | `easter06_npc_3683` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3684 | `easter06_npc_3684` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3685 | `easter06_npc_3685` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3686 | `easter06_npc_3686` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3687 | `easter06_npc_3687` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3688 | `easter06_npc_3688` | Child | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Child) |
| 3695 | `easter06_npc_3695` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3703 | `easter06_npc_3703` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3704 | `easter06_npc_3704` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3705 | `easter06_npc_3705` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3706 | `easter06_npc_3706` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3707 | `easter06_npc_3707` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3708 | `easter06_npc_3708` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3709 | `easter06_npc_3709` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3710 | `easter06_npc_3710` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3711 | `easter06_npc_3711` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3712 | `easter06_npc_3712` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3713 | `easter06_npc_3713` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3714 | `easter06_npc_3714` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3715 | `easter06_npc_3715` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3716 | `easter06_npc_3716` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3717 | `easter06_npc_3717` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3718 | `easter06_npc_3718` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3719 | `easter06_npc_3719` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3720 | `easter06_npc_3720` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3721 | `easter06_npc_3721` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3722 | `easter06_npc_3722` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3723 | `easter06_npc_3723` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3724 | `easter06_npc_3724` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3725 | `easter06_npc_3725` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3726 | `easter06_npc_3726` | Rabbit | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Rabbit) |
| 3805 | `postie_pete` | Postie Pete | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Postie_Pete) |
| 3813 | `npc_3813` | Captain Wimto | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Captain_Wimto) |
| 3837 | `swan_drunkendwarf` | Drunken Dwarf | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Drunken_Dwarf) |
| 3838 | `swan_wom_ambush` | Wise Old Man | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Wise_Old_Man) |

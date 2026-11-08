# Brief 19: Members Surface & Underground Regions (Other)

**Anchor:** UNCLASSIFIED members NPCs: triage by region cluster, assign each to a quest/feature, then place in release order  
**Anchor date:** mixed (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 266

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2879 | `jb_viking_dude` | Bardur | interactive_citizen_or_guard_dialogue | (1, 1850, 4392, m28_68) | [wiki](https://oldschool.runescape.wiki/w/Bardur) |
| 3158 | `fever_quest_ship_teach` | Bill Teach | npc_conversation_or_quest_branch | (1, 1814, 4836, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |
| 3188 | `fever_pirate_enemy_02` | Pirate | interactive_citizen_or_guard_dialogue | (0, 1823, 4831, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3189 | `fever_pirate_enemy_03` | Pirate | interactive_citizen_or_guard_dialogue | (0, 1824, 4834, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3190 | `fever_pirate_enemy_04` | Pirate | interactive_citizen_or_guard_dialogue | (0, 1825, 4836, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3191 | `fever_pirate_enemy_05` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1823, 4833, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3192 | `fever_pirate_enemy_06` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1825, 4830, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3193 | `fever_pirate_enemy_07` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1823, 4827, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3194 | `fever_pirate_enemy_08` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1825, 4827, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3195 | `fever_pirate_enemy_09` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1822, 4835, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3196 | `fever_pirate_enemy_10` | Pirate | interactive_citizen_or_guard_dialogue | (1, 1825, 4836, m28_75) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 466 | `murphy_sunk` | Murphy | npc_conversation_or_quest_branch | (0, 1947, 4827, m30_75) | [wiki](https://oldschool.runescape.wiki/w/Murphy) |
| 2553 | `blast_furnace_instructor` | Blast Furnace Foreman | npc_conversation_or_quest_branch | (0, 1944, 4958, m30_77) | [wiki](https://oldschool.runescape.wiki/w/Blast_Furnace_Foreman) |
| 2564 | `smithing_guild_ore_seller` | Ordan | shopkeeper_greeting_and_openshop | (0, 1936, 4966, m30_77) | [wiki](https://oldschool.runescape.wiki/w/Ordan) |
| 2565 | `smithing_guild_buyer` | Jorzik | shopkeeper_greeting_and_openshop | (0, 1939, 4968, m30_77) | [wiki](https://oldschool.runescape.wiki/w/Jorzik) |
| 3082 | `win05_pixie_rosie` | Rosie | npc_conversation_or_quest_branch | (1, 2007, 4427, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Rosie) |
| 3083 | `win05_pixie_sorcha` | Sorcha | npc_conversation_or_quest_branch | (1, 1993, 4442, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Sorcha) |
| 3084 | `win05_pixie_cait` | Cait | npc_conversation_or_quest_branch | (1, 2022, 4435, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Cait) |
| 3085 | `win05_pixie_cormac` | Cormac | npc_conversation_or_quest_branch | (0, 2012, 4443, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Cormac) |
| 3086 | `win05_pixie_fionn` | Fionn | npc_conversation_or_quest_branch | (0, 2005, 4435, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Fionn) |
| 3087 | `win05_pixie_donnacha` | Donnacha | npc_conversation_or_quest_branch | (1, 1996, 4439, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Donnacha) |
| 3088 | `win05_pixie_ronan` | Ronan | npc_conversation_or_quest_branch | (0, 2003, 4445, m31_69) | [wiki](https://oldschool.runescape.wiki/w/Ronan) |
| 2371 | `mourner_hideout_gnome_head` | Gnome | quest_or_varbit_morph_stage_dialogue | (0, 2036, 4630, m31_72) | [wiki](https://oldschool.runescape.wiki/w/Gnome) |
| 2372 | `mourner_hideout_head_mourner` | Head mourner | npc_conversation_or_quest_branch | (0, 2044, 4628, m31_72) | [wiki](https://oldschool.runescape.wiki/w/Head_mourner) |
| 1209 | `caveguide6` | Koftik | npc_conversation_or_quest_branch | (1, 2012, 4713, m31_73) | [wiki](https://oldschool.runescape.wiki/w/Koftik) |
| 3118 | `prisonpete_pete` | Prison Pete | npc_conversation_or_quest_branch | (0, 2089, 4428, m32_69) | [wiki](https://oldschool.runescape.wiki/w/Prison_Pete) |
| 2826 | `deal_island_pete` | Pirate Pete | npc_conversation_or_quest_branch | (1, 2162, 5115, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Pirate_Pete) |
| 2827 | `deal_captian_braindeath` | Captain Braindeath | npc_conversation_or_quest_branch | (1, 2144, 5109, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Captain_Braindeath) |
| 2828 | `deal_50luke` | 50% Luke | npc_conversation_or_quest_branch | (0, 2120, 5096, m33_79) | [wiki](https://oldschool.runescape.wiki/w/50%25_Luke) |
| 2829 | `deal_davey` | Davey | npc_conversation_or_quest_branch | (1, 2132, 5100, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Davey) |
| 2830 | `deal_captian_donnie` | Captain Donnie | npc_conversation_or_quest_branch | (0, 2150, 5078, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Captain_Donnie) |
| 2831 | `deal_zombie_protester_1` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2145, 5087, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2832 | `deal_zombie_protester_2` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2147, 5085, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2833 | `deal_zombie_protester_3` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2150, 5086, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2834 | `deal_zombie_protester_4` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2150, 5085, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2835 | `deal_zombie_protester_5` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2148, 5087, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2836 | `deal_zombie_protester_6` | Zombie Protester | npc_conversation_or_quest_branch | (0, 2145, 5086, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Protester) |
| 2843 | `deal_pirate_a` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2152, 5073, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2844 | `deal_pirate_b` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2147, 5071, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2845 | `deal_pirate_c` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2153, 5071, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2846 | `deal_pirate_d` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2158, 5071, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2847 | `deal_pirate_e` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2144, 5071, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2848 | `deal_pirate_f` | Zombie Swab | interactive_citizen_or_guard_dialogue | (0, 2161, 5071, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Zombie_Swab) |
| 2851 | `deal_brewer_1` | Brewer | npc_conversation_or_quest_branch | (1, 2149, 5093, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2852 | `deal_brewer_2` | Brewer | npc_conversation_or_quest_branch | (1, 2151, 5094, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2853 | `deal_brewer_3` | Brewer | npc_conversation_or_quest_branch | (1, 2154, 5094, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2854 | `deal_brewer_4` | Brewer | npc_conversation_or_quest_branch | (1, 2158, 5094, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2855 | `deal_brewer_5` | Brewer | npc_conversation_or_quest_branch | (1, 2158, 5096, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2856 | `deal_brewer_6` | Brewer | npc_conversation_or_quest_branch | (1, 2160, 5094, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2857 | `deal_brewer_7` | Brewer | npc_conversation_or_quest_branch | (1, 2152, 5096, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 2858 | `deal_brewer_8` | Brewer | npc_conversation_or_quest_branch | (1, 2148, 5096, m33_79) | [wiki](https://oldschool.runescape.wiki/w/Brewer) |
| 1208 | `regicidegeneralshopkeeper` | Quartermaster | npc_conversation_or_quest_branch | (0, 2194, 3140, m34_49) | [wiki](https://oldschool.runescape.wiki/w/Quartermaster) |
| 1182 | `lord_iorwerth` | Lord Iorwerth | npc_conversation_or_quest_branch | (0, 2205, 3252, m34_50) | [wiki](https://oldschool.runescape.wiki/w/Lord_Iorwerth) |
| 1185 | `elf_city_guard` | Elven city guard | npc_conversation_or_quest_branch | (0, 2242, 3272, m35_51) | [wiki](https://oldschool.runescape.wiki/w/Elven_city_guard) |
| 2065 | `ogre_hunter3` | Gruh | npc_conversation_or_quest_branch | (0, 2349, 3064, m36_47) | [wiki](https://oldschool.runescape.wiki/w/Gruh) |
| 3831 | `swan_boatwoman_2` | Kathy Corkat | quest_or_varbit_morph_stage_dialogue | (0, 2357, 3640, m36_56) | [wiki](https://oldschool.runescape.wiki/w/Kathy_Corkat) |
| 3822 | `swan_herman` | Herman Caranos | quest_or_varbit_morph_stage_dialogue | (0, 2354, 3683, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Herman_Caranos) |
| 3823 | `swan_franklin` | Franklin Caranos | npc_conversation_or_quest_branch | (0, 2344, 3667, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Franklin_Caranos) |
| 3824 | `swan_arnold` | Arnold Lydspor | shopkeeper_greeting_and_openshop | (0, 2330, 3691, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Arnold_Lydspor) |
| 3825 | `swan_colonist_1` | Devin Mendelberg | quest_or_varbit_morph_stage_dialogue | (0, 2313, 3686, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Devin_Mendelberg) |
| 3826 | `swan_colonist_2` | George Laxmeister | npc_conversation_or_quest_branch | (0, 2323, 3684, m36_57) | [wiki](https://oldschool.runescape.wiki/w/George_Laxmeister) |
| 3827 | `swan_colonist_3` | Ramara du Croissant | npc_conversation_or_quest_branch | (0, 2344, 3678, m36_57) | [wiki](https://oldschool.runescape.wiki/w/Ramara_du_Croissant) |
| 1859 | `dwarf_rock_actual_demon` | Arzinian Being of Bordanzan | npc_conversation_or_quest_branch | (3, 2367, 4960, m36_77) | [wiki](https://oldschool.runescape.wiki/w/Arzinian_Being_of_Bordanzan) |
| 2063 | `ogre_hunter1` | Gargh | npc_conversation_or_quest_branch | (0, 2413, 3053, m37_47) | [wiki](https://oldschool.runescape.wiki/w/Gargh) |
| 2064 | `ogre_hunter2` | Scarg | npc_conversation_or_quest_branch | (0, 2380, 3043, m37_47) | [wiki](https://oldschool.runescape.wiki/w/Scarg) |
| 1201 | `elf_overpass_guard` | Elf warrior | npc_conversation_or_quest_branch | (0, 2382, 3334, m37_52) | [wiki](https://oldschool.runescape.wiki/w/Elf_warrior) |
| 636 | `gnomecheerleader` | Cheerleader | npc_conversation_or_quest_branch | (0, 2395, 3495, m37_54) | [wiki](https://oldschool.runescape.wiki/w/Cheerleader) |
| 2802 | `gnome_ball_coach` | Gnome Coach | npc_conversation_or_quest_branch | (0, 2406, 3498, m37_54) | [wiki](https://oldschool.runescape.wiki/w/Gnome_Coach) |
| 3830 | `swan_boatwoman_1` | Kathy Corkat | quest_or_varbit_morph_stage_dialogue | (0, 2368, 3486, m37_54) | [wiki](https://oldschool.runescape.wiki/w/Kathy_Corkat) |
| 3818 | `gnome_tortoise_trainer` | Trainer Nacklepen | npc_conversation_or_quest_branch | (0, 2421, 3525, m37_55) | [wiki](https://oldschool.runescape.wiki/w/Trainer_Nacklepen) |
| 3321 | `fairy_mindslayer_guard` | Gate Keeper | quest_or_varbit_morph_stage_dialogue | (0, 2401, 4378, m37_68) | [wiki](https://oldschool.runescape.wiki/w/Gate_Keeper) |
| 57 | `fairy` | Fairy | npc_conversation_or_quest_branch | (0, 2373, 4447, m37_69) | [wiki](https://oldschool.runescape.wiki/w/Fairy) |
| 3303 | `fairy_nuff` | Fairy Nuff | npc_conversation_or_quest_branch | (0, 2391, 4468, m37_69) | [wiki](https://oldschool.runescape.wiki/w/Fairy_Nuff) |
| 3310 | `fairy_sheep` | Sheep | npc_conversation_or_quest_branch | (0, 2410, 4456, m37_69) | [wiki](https://oldschool.runescape.wiki/w/Sheep) |
| 3322 | `fairy_chef` | Fairy Chef | npc_conversation_or_quest_branch | (0, 2386, 4439, m37_69) | [wiki](https://oldschool.runescape.wiki/w/Fairy_Chef) |
| 2038 | `zogre_ogre_shaman` | Grish | npc_conversation_or_quest_branch | (0, 2443, 3051, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Grish) |
| 2039 | `zogre_uglug_nar` | Uglug Nar | shopkeeper_greeting_and_openshop | (0, 2442, 3049, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Uglug_Nar) |
| 2040 | `zogre_dying1` | Pilg | npc_conversation_or_quest_branch | (0, 2443, 3046, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Pilg) |
| 2041 | `zogre_dying2` | Grug | npc_conversation_or_quest_branch | (0, 2446, 3049, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Grug) |
| 2042 | `zogre_ogre_guard` | Ogre guard | npc_conversation_or_quest_branch | (0, 2454, 3047, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Ogre_guard) |
| 2043 | `zogre_ogre_coffin_guard` | Ogre guard | npc_conversation_or_quest_branch | (0, 2443, 3038, m38_47) | [wiki](https://oldschool.runescape.wiki/w/Ogre_guard) |
| 2932 | `makinghistory_jorral` | Jorral | npc_conversation_or_quest_branch | (0, 2437, 3347, m38_52) | [wiki](https://oldschool.runescape.wiki/w/Jorral) |
| 3115 | `handsand_blaec` | Blaec | npc_conversation_or_quest_branch | (0, 2438, 4442, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Blaec) |
| 3302 | `fairy_coordinator` | Co-ordinator | npc_conversation_or_quest_branch | (0, 2452, 4451, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Co-ordinator) |
| 3304 | `fairy_godfather` | Fairy Godfather | quest_or_varbit_morph_stage_dialogue | (0, 2446, 4427, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Fairy_Godfather) |
| 3305 | `fairy_henchman1` | Slim Louie | quest_or_varbit_morph_stage_dialogue | (0, 2448, 4428, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Slim_Louie) |
| 3306 | `fairy_henchman2` | Fat Rocco | quest_or_varbit_morph_stage_dialogue | (0, 2445, 4430, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Fat_Rocco) |
| 3307 | `fairy_mindslayer` | Gate Keeper | npc_conversation_or_quest_branch | (0, 2464, 4436, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Gate_Keeper) |
| 3309 | `fairy_cow` | Cow | interactive_citizen_or_guard_dialogue | (0, 2435, 4442, m38_69) | [wiki](https://oldschool.runescape.wiki/w/Cow) |
| 1337 | `horror_girlfriend_postquest` | Larrissa | npc_conversation_or_quest_branch | (0, 2445, 4599, m38_71) | [wiki](https://oldschool.runescape.wiki/w/Larrissa) |
| 2282 | `rd_observer_room_1` | Sir Spishyus | npc_conversation_or_quest_branch | (0, 2488, 4973, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Sir_Spishyus) |
| 2283 | `rd_observer_room_2` | Lady Table | npc_conversation_or_quest_branch | (0, 2458, 4981, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Lady_Table) |
| 2284 | `rd_observer_room_3` | Sir Kuam Ferentse | npc_conversation_or_quest_branch | (0, 2457, 4966, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Sir_Kuam_Ferentse) |
| 2286 | `rd_observer_room_4` | Sir Tinley | npc_conversation_or_quest_branch | (0, 2476, 4958, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Sir_Tinley) |
| 2287 | `rd_observer_room_5` | Sir Ren Itchood | npc_conversation_or_quest_branch | (0, 2443, 4956, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Sir_Ren_Itchood) |
| 2288 | `rd_observer_room_6` | Miss Cheevers | npc_conversation_or_quest_branch | (0, 2469, 4941, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Miss_Cheevers) |
| 2289 | `rd_observer_room_7` | Ms. Hynn Terprett | npc_conversation_or_quest_branch | (0, 2451, 4939, m38_77) | [wiki](https://oldschool.runescape.wiki/w/Ms._Hynn_Terprett) |
| 1800 | `gnormadium_avlafrim` | Gnormadium Avlafrim | npc_conversation_or_quest_branch | (0, 2544, 2973, m39_46) | [wiki](https://oldschool.runescape.wiki/w/Gnormadium_Avlafrim) |
| 3108 | `handsand_bert` | Bert | npc_conversation_or_quest_branch | (0, 2550, 3100, m39_48) | [wiki](https://oldschool.runescape.wiki/w/Bert) |
| 3109 | `handsand_guard_captain` | Guard Captain | npc_conversation_or_quest_branch | (0, 2551, 3078, m39_48) | [wiki](https://oldschool.runescape.wiki/w/Guard_Captain) |
| 3817 | `gnome_tortoise_commander` | Lieutenant Schepbur | npc_conversation_or_quest_branch | (0, 2515, 3205, m39_50) | [wiki](https://oldschool.runescape.wiki/w/Lieutenant_Schepbur) |
| 372 | `mournerwatchtower` | Mourner | npc_conversation_or_quest_branch | (0, 2559, 3303, m39_51) | [wiki](https://oldschool.runescape.wiki/w/Mourner) |
| 3216 | `mourner_elena_guard` | Mourner | npc_conversation_or_quest_branch | (0, 2534, 3273, m39_51) | [wiki](https://oldschool.runescape.wiki/w/Mourner) |
| 1972 | `shadow_warrior_rasool` | Rasolo | shopkeeper_greeting_and_openshop | (0, 2535, 3432, m39_53) | [wiki](https://oldschool.runescape.wiki/w/Rasolo) |
| 2399 | `secret_ghost_explorer` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (0, 2555, 3444, m39_53) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |
| 1334 | `horror_lighthousekeeeper_well` | Jossik | shopkeeper_greeting_and_openshop | (1, 2509, 3639, m39_56) | [wiki](https://oldschool.runescape.wiki/w/Jossik) |
| 1336 | `horror_girlfriend_prequest` | Larrissa | npc_conversation_or_quest_branch | (0, 2508, 3635, m39_56) | [wiki](https://oldschool.runescape.wiki/w/Larrissa) |
| 1335 | `horror_lighthousekeeeper_injured` | Jossik | npc_conversation_or_quest_branch | (0, 2518, 4633, m39_72) | [wiki](https://oldschool.runescape.wiki/w/Jossik) |
| 1658 | `magic_store_owner2` | Robe Store owner | shopkeeper_greeting_and_openshop | (1, 2595, 3088, m40_48) | [wiki](https://oldschool.runescape.wiki/w/Robe_Store_owner) |
| 2059 | `zogre_human_zavistic_rarve` | Zavistic Rarve | npc_conversation_or_quest_branch | (0, 2588, 3087, m40_48) | [wiki](https://oldschool.runescape.wiki/w/Zavistic_Rarve) |
| 1367 | `etc_guard1` | Skraeling | interactive_citizen_or_guard_dialogue | (0, 2605, 3877, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Skraeling) |
| 1368 | `etc_guard2` | Skraeling | interactive_citizen_or_guard_dialogue | (0, 2603, 3877, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Skraeling) |
| 1369 | `etc_fish_monger` | Fishmonger | shopkeeper_greeting_and_openshop | (0, 2605, 3876, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Fishmonger) |
| 1370 | `etc_veg_monger` | Greengrocer | shopkeeper_greeting_and_openshop | (0, 2602, 3876, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Greengrocer) |
| 1799 | `tindel_marchant` | Tindel Marchant | npc_conversation_or_quest_branch | (0, 2678, 3153, m41_49) | [wiki](https://oldschool.runescape.wiki/w/Tindel_Marchant) |
| 2066 | `zogre_necromancers_assistant` | Irwin Feaselbaum | npc_conversation_or_quest_branch | (0, 2666, 3246, m41_50) | [wiki](https://oldschool.runescape.wiki/w/Irwin_Feaselbaum) |
| 2325 | `kragen` | Kragen | npc_conversation_or_quest_branch | (0, 2668, 3374, m41_52) | [wiki](https://oldschool.runescape.wiki/w/Kragen) |
| 1287 | `vt_council_workmen` | Council workman | npc_conversation_or_quest_branch | (0, 2655, 3592, m41_56) | [wiki](https://oldschool.runescape.wiki/w/Council_workman) |
| 2939 | `makinghistory_dron` | Dron | npc_conversation_or_quest_branch | (0, 2658, 3700, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Dron) |
| 2940 | `makinghistory_blanin` | Blanin | npc_conversation_or_quest_branch | (0, 2675, 3671, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Blanin) |
| 3116 | `handsand_reeso` | Reeso | npc_conversation_or_quest_branch | (0, 2666, 3705, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Reeso) |
| 1595 | `tribesman_doorman` | Saniboch | npc_conversation_or_quest_branch | (0, 2745, 3152, m42_49) | [wiki](https://oldschool.runescape.wiki/w/Saniboch) |
| 1809 | `mdaughter_svidi` | Svidi | npc_conversation_or_quest_branch | (0, 2714, 3672, m42_57) | [wiki](https://oldschool.runescape.wiki/w/Svidi) |
| 1811 | `mdaughter_multi_bear` | mdaughter_multi_bear | quest_or_varbit_morph_stage_dialogue | (0, 2786, 10081, m43_157) | [wiki](https://oldschool.runescape.wiki/w/Mdaughter_Multi_Bear) |
| 1812 | `mdaughter_bearman` | The Kendal | quest_or_varbit_morph_stage_dialogue | (0, 2786, 10081, m43_157) | [wiki](https://oldschool.runescape.wiki/w/The_Kendal) |
| 2520 | `tbwcu_gabooty` | Gabooty | quest_or_varbit_morph_stage_dialogue | (0, 2794, 3065, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Gabooty) |
| 2521 | `tbwcu_gabooty_nosticks` | Gabooty | quest_or_varbit_morph_stage_dialogue | (0, 2794, 3065, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Gabooty) |
| 2526 | `tbwcu_jagbakoba` | Jagbakoba | quest_or_varbit_morph_stage_dialogue | (0, 2799, 3047, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Jagbakoba) |
| 2527 | `tbwcu_jagbakoba_nosticks` | Jagbakoba | quest_or_varbit_morph_stage_dialogue | (0, 2799, 3047, m43_47) | [wiki](https://oldschool.runescape.wiki/w/Jagbakoba) |
| 2505 | `tbwcu_sharimika` | Sharimika | quest_or_varbit_morph_stage_dialogue | (1, 2794, 3076, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Sharimika) |
| 2506 | `tbwcu_sharimika_nosticks` | Sharimika | quest_or_varbit_morph_stage_dialogue | (1, 2794, 3076, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Sharimika) |
| 2508 | `tbwcu_mamma_bufetta` | Mamma Bufetta | quest_or_varbit_morph_stage_dialogue | (0, 2794, 3076, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Mamma_Bufetta) |
| 2509 | `tbwcu_mamma_bufetta_nosticks` | Mamma Bufetta | quest_or_varbit_morph_stage_dialogue | (0, 2794, 3076, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Mamma_Bufetta) |
| 2511 | `tbwcu_layleen` | Layleen | quest_or_varbit_morph_stage_dialogue | (1, 2786, 3074, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Layleen) |
| 2512 | `tbwcu_layleen_nosticks` | Layleen | quest_or_varbit_morph_stage_dialogue | (1, 2786, 3074, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Layleen) |
| 2514 | `tbwcu_karaday` | Karaday | quest_or_varbit_morph_stage_dialogue | (0, 2799, 3084, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Karaday) |
| 2515 | `tbwcu_karaday_nosticks` | Karaday | quest_or_varbit_morph_stage_dialogue | (0, 2799, 3084, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Karaday) |
| 2517 | `tbwcu_safta_doc` | Safta Doc | quest_or_varbit_morph_stage_dialogue | (0, 2790, 3100, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Safta_Doc) |
| 2518 | `tbwcu_safta_doc_nosticks` | Safta Doc | quest_or_varbit_morph_stage_dialogue | (0, 2790, 3100, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Safta_Doc) |
| 2523 | `tbwcu_fanellaman` | Fanellaman | quest_or_varbit_morph_stage_dialogue | (0, 2759, 3096, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Fanellaman) |
| 2524 | `tbwcu_fanellaman_nosticks` | Fanellaman | quest_or_varbit_morph_stage_dialogue | (0, 2759, 3096, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Fanellaman) |
| 2532 | `tbwcu_rionasta` | Rionasta | quest_or_varbit_morph_stage_dialogue | (0, 2782, 3094, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Rionasta) |
| 2533 | `tbwcu_rionasta_nosticks` | Rionasta | quest_or_varbit_morph_stage_dialogue | (0, 2782, 3094, m43_48) | [wiki](https://oldschool.runescape.wiki/w/Rionasta) |
| 3112 | `handsand_sandy0` | Sandy | quest_or_varbit_morph_stage_dialogue | (0, 2788, 3176, m43_49) | [wiki](https://oldschool.runescape.wiki/w/Sandy) |
| 697 | `kennith` | Kennith | npc_conversation_or_quest_branch | (1, 2764, 3288, m43_51) | [wiki](https://oldschool.runescape.wiki/w/Kennith) |
| 2327 | `francis` | Francis | npc_conversation_or_quest_branch | (0, 2814, 3337, m43_52) | [wiki](https://oldschool.runescape.wiki/w/Francis) |
| 2324 | `dantaera` | Dantaera | npc_conversation_or_quest_branch | (0, 2808, 3464, m43_54) | [wiki](https://oldschool.runescape.wiki/w/Dantaera) |
| 1805 | `mdaughter_rockslide_guard` | Guard | npc_conversation_or_quest_branch | (0, 2760, 3660, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Guard) |
| 1806 | `mdaughter_ancientrock_guard` | Guard | npc_conversation_or_quest_branch | (0, 2798, 3667, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Guard) |
| 1807 | `mdaughter_hamal` | Hamal the Chieftain | npc_conversation_or_quest_branch | (0, 2811, 3673, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Hamal_the_Chieftain) |
| 1808 | `mdaughter_ragnar` | Ragnar | npc_conversation_or_quest_branch | (0, 2765, 3676, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Ragnar) |
| 1810 | `mdaughter_jokul` | Jokul | npc_conversation_or_quest_branch | (0, 2811, 3681, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Jokul) |
| 1814 | `mdaughter_camp_male1` | Camp dweller | interactive_citizen_or_guard_dialogue | (0, 2794, 3668, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Camp_dweller) |
| 1815 | `mdaughter_camp_male2` | Camp dweller | interactive_citizen_or_guard_dialogue | (0, 2801, 3669, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Camp_dweller) |
| 1816 | `mdaughter_camp_female1` | Camp dweller | interactive_citizen_or_guard_dialogue | (0, 2803, 3668, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Camp_dweller) |
| 1817 | `mdaughter_camp_female2` | Camp dweller | interactive_citizen_or_guard_dialogue | (0, 2797, 3672, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Camp_dweller) |
| 1818 | `mdaughter_camp_female3` | Camp dweller | interactive_citizen_or_guard_dialogue | (0, 2802, 3674, m43_57) | [wiki](https://oldschool.runescape.wiki/w/Camp_dweller) |
| 2529 | `tbwcu_murcaily` | Murcaily | quest_or_varbit_morph_stage_dialogue | (0, 2816, 3083, m44_48) | [wiki](https://oldschool.runescape.wiki/w/Murcaily) |
| 2530 | `tbwcu_murcaily_nosticks` | Murcaily | quest_or_varbit_morph_stage_dialogue | (0, 2816, 3083, m44_48) | [wiki](https://oldschool.runescape.wiki/w/Murcaily) |
| 2401 | `secret_ghost_spy` | Mysterious ghost | quest_or_varbit_morph_stage_dialogue | (0, 2850, 3348, m44_52) | [wiki](https://oldschool.runescape.wiki/w/Mysterious_ghost) |
| 3114 | `handsand_naziom` | Mazion | npc_conversation_or_quest_branch | (0, 2818, 3342, m44_52) | [wiki](https://oldschool.runescape.wiki/w/Mazion) |
| 1933 | `fourdiamonds_troll_child_okay` | Troll child | quest_or_varbit_morph_stage_dialogue | (0, 2836, 3740, m44_58) | [wiki](https://oldschool.runescape.wiki/w/Troll_child) |
| 1934 | `fourdiamonds_troll_child_crying` | Troll child | quest_or_varbit_morph_stage_dialogue | (0, 2836, 3740, m44_58) | [wiki](https://oldschool.runescape.wiki/w/Troll_child) |
| 1935 | `i_troll_guard` | Ice troll | npc_conversation_or_quest_branch | (0, 2841, 3738, m44_58) | [wiki](https://oldschool.runescape.wiki/w/Ice_troll) |
| 1944 | `fd_trollblock1` | Ice block | quest_or_varbit_morph_stage_dialogue | (2, 2825, 3807, m44_59) | [wiki](https://oldschool.runescape.wiki/w/Ice_block) |
| 1946 | `fd_trollblock2` | Ice block | quest_or_varbit_morph_stage_dialogue | (2, 2825, 3811, m44_59) | [wiki](https://oldschool.runescape.wiki/w/Ice_block) |
| 1948 | `fd_troll_dad` | Troll father | quest_or_varbit_morph_stage_dialogue | (2, 2825, 3807, m44_59) | [wiki](https://oldschool.runescape.wiki/w/Troll_father) |
| 1950 | `fd_troll_mum` | Troll mother | quest_or_varbit_morph_stage_dialogue | (2, 2825, 3811, m44_59) | [wiki](https://oldschool.runescape.wiki/w/Troll_mother) |
| 2266 | `roguesden_mazemaster` | Brian O'Richard | npc_conversation_or_quest_branch | (1, 3049, 4977, m47_77) | [wiki](https://oldschool.runescape.wiki/w/Brian_O%27Richard) |
| 2270 | `roguesden_trader` | Martin Thwait | shopkeeper_greeting_and_openshop | (1, 3048, 4975, m47_77) | [wiki](https://oldschool.runescape.wiki/w/Martin_Thwait) |
| 3126 | `enakh_pentyn` | Pentyn | npc_conversation_or_quest_branch | (1, 3091, 9324, m48_145) | [wiki](https://oldschool.runescape.wiki/w/Pentyn) |
| 3137 | `enakh_enakhra_hooded` | Enakhra | quest_or_varbit_morph_stage_dialogue | (1, 3104, 9286, m48_145) | [wiki](https://oldschool.runescape.wiki/w/Enakhra) |
| 3140 | `enakh_akthanakos_boneguard` | Boneguard | quest_or_varbit_morph_stage_dialogue | (1, 3105, 9297, m48_145) | [wiki](https://oldschool.runescape.wiki/w/Boneguard) |
| 3141 | `enakh_akthanakos_freed` | Akthanakos | quest_or_varbit_morph_stage_dialogue | (1, 3105, 9297, m48_145) | [wiki](https://oldschool.runescape.wiki/w/Akthanakos) |
| 3142 | `enakh_akthanakos_mahjarrat` | Akthanakos | quest_or_varbit_morph_stage_dialogue | (1, 3105, 9297, m48_145) | [wiki](https://oldschool.runescape.wiki/w/Akthanakos) |
| 3147 | `enakh_lazim` | Lazim | quest_or_varbit_morph_stage_dialogue | (0, 3191, 2926, m49_45) | [wiki](https://oldschool.runescape.wiki/w/Lazim) |
| 1917 | `dt_bandit_shopkeeper` | Bandit shopkeeper | shopkeeper_greeting_and_openshop | (0, 3175, 2988, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit_shopkeeper) |
| 1921 | `fourdiamonds_bartender` | Bartender | shopkeeper_greeting_and_openshop | (0, 3159, 2981, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bartender) |
| 1923 | `fd_elder_village` | Eblis | quest_or_varbit_morph_stage_dialogue | (0, 3185, 2983, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Eblis) |
| 1926 | `fourdiamonds_sword_bandit_1` | Bandit | interactive_citizen_or_guard_dialogue | (0, 3158, 2977, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1927 | `fourdiamonds_sword_bandit_sitsouth` | Bandit | npc_conversation_or_quest_branch | (0, 3157, 2989, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1928 | `fourdiamonds_sword_bandit_sitnorth` | Bandit | npc_conversation_or_quest_branch | (0, 3157, 2986, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1929 | `fourdiamonds_sword_bandit_siteast` | Bandit | npc_conversation_or_quest_branch | (0, 3159, 2977, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1930 | `fourdiamonds_sword_bandit_sitwest` | Bandit | npc_conversation_or_quest_branch | (0, 3161, 2977, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1931 | `fourdiamonds_sword_bandit_free` | Bandit | interactive_citizen_or_guard_dialogue | (0, 3165, 2960, m49_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1239 | `bedabin_fighter` | Bedabin Nomad Fighter | interactive_citizen_or_guard_dialogue | (0, 3160, 3031, m49_47) | [wiki](https://oldschool.runescape.wiki/w/Bedabin_Nomad_Fighter) |
| 1918 | `fourdiamonds_indiana` | Archaeologist | npc_conversation_or_quest_branch | (0, 3178, 3043, m49_47) | [wiki](https://oldschool.runescape.wiki/w/Archaeologist) |
| 1971 | `azzanadra_real` | Azzanadra | quest_or_varbit_morph_stage_dialogue | (0, 3233, 9317, m50_145) | [wiki](https://oldschool.runescape.wiki/w/Azzanadra) |
| 1925 | `fd_elder_by_mirrors` | Eblis | quest_or_varbit_morph_stage_dialogue | (0, 3213, 2956, m50_46) | [wiki](https://oldschool.runescape.wiki/w/Eblis) |
| 1986 | `ics_little_hipriest_vis` | High Priest | quest_or_varbit_morph_stage_dialogue | (0, 3307, 9196, m51_143) | [wiki](https://oldschool.runescape.wiki/w/High_Priest) |
| 1988 | `ics_little_priest` | Priest | quest_or_varbit_morph_stage_dialogue | (0, 3305, 9193, m51_143) | [wiki](https://oldschool.runescape.wiki/w/Priest) |
| 2012 | `ics_little_ic_vis` | Icthlarin | quest_or_varbit_morph_stage_dialogue | (0, 3277, 9170, m51_143) | [wiki](https://oldschool.runescape.wiki/w/Icthlarin) |
| 1978 | `ics_little_worker1` | Slave | npc_conversation_or_quest_branch | (0, 3290, 2763, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Slave) |
| 1979 | `ics_little_worker2` | Slave | npc_conversation_or_quest_branch | (0, 3292, 2762, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Slave) |
| 1980 | `ics_little_embalmer` | Embalmer | npc_conversation_or_quest_branch | (0, 3287, 2755, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Embalmer) |
| 1981 | `ics_little_carpenter` | Carpenter | npc_conversation_or_quest_branch | (0, 3313, 2771, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Carpenter) |
| 1982 | `ics_little_linen1` | Linen Worker | npc_conversation_or_quest_branch | (0, 3311, 2787, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Linen_Worker) |
| 1983 | `ics_little_linen2` | Siamun | npc_conversation_or_quest_branch | (0, 3315, 2786, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Siamun) |
| 1989 | `ics_little_priestdoorman` | Priest | npc_conversation_or_quest_branch | (0, 3283, 2810, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Priest) |
| 1990 | `ics_little_sphinx` | Sphinx | npc_conversation_or_quest_branch | (0, 3300, 2784, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Sphinx) |
| 1992 | `ics_little_cat` | Neite | npc_conversation_or_quest_branch | (0, 3298, 2757, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Neite) |
| 2014 | `ics_little_spectre_vis` | Klenter | quest_or_varbit_morph_stage_dialogue | (0, 3289, 2783, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Klenter) |
| 2815 | `neferti_the_camel` | Neferti the Camel | npc_conversation_or_quest_branch | (0, 3289, 2754, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Neferti_the_Camel) |
| 2006 | `ics_little_redheadlady` | Wanderer | quest_or_varbit_morph_stage_dialogue | (0, 3315, 2849, m51_44) | [wiki](https://oldschool.runescape.wiki/w/Wanderer) |
| 3123 | `agility_pyramid_simon` | Simon Templeton | npc_conversation_or_quest_branch | (0, 3363, 2829, m52_44) | [wiki](https://oldschool.runescape.wiki/w/Simon_Templeton) |
| 3127 | `enakh_aristarchus` | Aristarchus | npc_conversation_or_quest_branch | (0, 3338, 2961, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Aristarchus) |
| 1528 | `saradominist_zealot` | Zealot | interactive_citizen_or_guard_dialogue | (0, 3444, 3258, m53_50) | [wiki](https://oldschool.runescape.wiki/w/Zealot) |
| 3075 | `devious_monk_hooded_visable` | Monk | quest_or_varbit_morph_stage_dialogue | (0, 3406, 3492, m53_54) | [wiki](https://oldschool.runescape.wiki/w/Monk) |
| 1569 | `route_veliaf_hurtz` | Veliaf Hurtz | npc_conversation_or_quest_branch | (0, 3506, 9838, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Veliaf_Hurtz) |
| 1570 | `route_sani_piliu` | Sani Piliu | npc_conversation_or_quest_branch | (3, 3508, 9837, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Sani_Piliu) |
| 1571 | `route_harold_evans` | Harold Evans | npc_conversation_or_quest_branch | (3, 3504, 9837, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Harold_Evans) |
| 1572 | `route_radigad_ponfit` | Radigad Ponfit | npc_conversation_or_quest_branch | (0, 3509, 9831, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Radigad_Ponfit) |
| 1573 | `route_polmafi_ferdygris` | Polmafi Ferdygris | npc_conversation_or_quest_branch | (0, 3514, 9838, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Polmafi_Ferdygris) |
| 1574 | `route_ivan_strom` | Ivan Strom | npc_conversation_or_quest_branch | (0, 3513, 9843, m54_153) | [wiki](https://oldschool.runescape.wiki/w/Ivan_Strom) |
| 3624 | `templetrek_child_hard` | Smiddi Ryak | quest_or_varbit_morph_stage_dialogue | (0, 3475, 3235, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Smiddi_Ryak) |
| 3626 | `templetrek_oldman_hard` | Rolayne Twickit | quest_or_varbit_morph_stage_dialogue | (0, 3476, 3235, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Rolayne_Twickit) |
| 3628 | `templetrek_woman_med` | Jayene Kliyn | quest_or_varbit_morph_stage_dialogue | (0, 3479, 3237, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Jayene_Kliyn) |
| 3630 | `templetrek_man_med` | Valantay Eppel | quest_or_varbit_morph_stage_dialogue | (0, 3480, 3237, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Valantay_Eppel) |
| 3632 | `templetrek_retired_man_easy` | Dalcian Fang | quest_or_varbit_morph_stage_dialogue | (0, 3481, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Dalcian_Fang) |
| 3634 | `templetrek_retired_soldier_easy` | Fyiona Fray | quest_or_varbit_morph_stage_dialogue | (0, 3480, 3241, m54_50) | [wiki](https://oldschool.runescape.wiki/w/Fyiona_Fray) |
| 1568 | `route_curpile_fyod` | Curpile Fyod | npc_conversation_or_quest_branch | (0, 3508, 3440, m54_53) | [wiki](https://oldschool.runescape.wiki/w/Curpile_Fyod) |
| 1577 | `route_vanstrom_klause_sitting` | Vanstrom Klause | quest_or_varbit_morph_stage_dialogue | (0, 3503, 3477, m54_54) | [wiki](https://oldschool.runescape.wiki/w/Vanstrom_Klause) |
| 1920 | `fourdiamonds_vampire_lord` | Malak | npc_conversation_or_quest_branch | (0, 3497, 3478, m54_54) | [wiki](https://oldschool.runescape.wiki/w/Malak) |
| 1567 | `route_cyreg_paddlehorn` | Cyreg Paddlehorn | npc_conversation_or_quest_branch | (0, 3522, 3284, m55_51) | [wiki](https://oldschool.runescape.wiki/w/Cyreg_Paddlehorn) |
| 2024 | `barrows_oldman` | Strange Old Man | npc_conversation_or_quest_branch | (0, 3565, 3288, m55_51) | [wiki](https://oldschool.runescape.wiki/w/Strange_Old_Man) |
| 1665 | `waa_werewolf_guard` | Werewolf | npc_conversation_or_quest_branch | (0, 3544, 3462, m55_54) | [wiki](https://oldschool.runescape.wiki/w/Werewolf) |
| 1670 | `fenk_fenkenstrain_model` | Dr Fenkenstrain | quest_or_varbit_morph_stage_dialogue | (0, 3551, 3550, m55_55) | [wiki](https://oldschool.runescape.wiki/w/Dr_Fenkenstrain) |
| 1673 | `fenk_creature_model` | Fenkenstrain's Monster | quest_or_varbit_morph_stage_dialogue | (2, 3547, 3555, m55_55) | [wiki](https://oldschool.runescape.wiki/w/Fenkenstrain%27s_Monster) |
| 1674 | `fenk_creature_model_2` | Lord Rologarth | quest_or_varbit_morph_stage_dialogue | (0, 3552, 3550, m55_55) | [wiki](https://oldschool.runescape.wiki/w/Lord_Rologarth) |
| 1675 | `fenk_gardener` | Gardener Ghost | quest_or_varbit_morph_stage_dialogue | (0, 3551, 3561, m55_55) | [wiki](https://oldschool.runescape.wiki/w/Gardener_Ghost) |
| 2326 | `lyra` | Lyra | npc_conversation_or_quest_branch | (0, 3601, 3527, m56_55) | [wiki](https://oldschool.runescape.wiki/w/Lyra) |
| 2322 | `metarialus` | Metarialus | npc_conversation_or_quest_branch | (0, 3680, 9958, m57_155) | [wiki](https://oldschool.runescape.wiki/w/Metarialus) |
| 3159 | `fever_harmless_teach` | Bill Teach | npc_conversation_or_quest_branch | (0, 3667, 2981, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |
| 3160 | `fever_harmless_port_ship_teach` | Bill Teach | npc_conversation_or_quest_branch | (1, 3683, 2948, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |
| 3161 | `fever_pirate_two_feet_charley` | Charley | shopkeeper_greeting_and_openshop | (0, 3673, 2970, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Charley) |
| 3162 | `fever_smithing_smith` | Smith | shopkeeper_greeting_and_openshop | (0, 3689, 2954, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Smith) |
| 3163 | `fever_harpoon_joe` | Joe | shopkeeper_greeting_and_openshop | (0, 3666, 2990, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Joe) |
| 3164 | `fever_mama_la_fiette` | Mama | shopkeeper_greeting_and_openshop | (0, 3663, 2980, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Mama) |
| 3166 | `fever_dodgy_mike` | Mike | shopkeeper_greeting_and_openshop | (0, 3695, 2978, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Mike) |
| 3167 | `fever_pirate_island_01` | Pirate | npc_conversation_or_quest_branch | (0, 3658, 2952, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3168 | `fever_pirate_island_02` | Pirate | npc_conversation_or_quest_branch | (0, 3668, 2994, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3169 | `fever_pirate_island_03` | Pirate | npc_conversation_or_quest_branch | (0, 3666, 2983, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3170 | `fever_pirate_island_04` | Pirate | npc_conversation_or_quest_branch | (0, 3655, 2973, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3171 | `fever_pirate_island_05` | Pirate | npc_conversation_or_quest_branch | (0, 3667, 2993, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3172 | `fever_pirate_island_06` | Pirate | npc_conversation_or_quest_branch | (0, 3656, 2960, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3173 | `fever_pirate_island_07` | Pirate | npc_conversation_or_quest_branch | (1, 3665, 2995, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3174 | `fever_pirate_island_08` | Pirate | npc_conversation_or_quest_branch | (0, 3671, 2978, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3175 | `fever_pirate_island_09` | Pirate | npc_conversation_or_quest_branch | (0, 3678, 3003, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3176 | `fever_pirate_island_10` | Pirate | npc_conversation_or_quest_branch | (0, 3667, 2963, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3177 | `fever_pirate_millitia_01` | Pirate | npc_conversation_or_quest_branch | (0, 3649, 3004, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3178 | `fever_pirate_millitia_02` | Pirate | npc_conversation_or_quest_branch | (0, 3653, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3179 | `fever_pirate_millitia_03` | Pirate | npc_conversation_or_quest_branch | (0, 3660, 3005, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3180 | `fever_pirate_millitia_04` | Pirate | npc_conversation_or_quest_branch | (0, 3665, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3181 | `fever_pirate_millitia_05` | Pirate | npc_conversation_or_quest_branch | (0, 3673, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3182 | `fever_pirate_millitia_06` | Pirate | npc_conversation_or_quest_branch | (0, 3682, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3183 | `fever_pirate_millitia_07` | Pirate | npc_conversation_or_quest_branch | (0, 3688, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3184 | `fever_pirate_millitia_08` | Pirate | npc_conversation_or_quest_branch | (0, 3692, 3005, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3185 | `fever_pirate_millitia_09` | Pirate | npc_conversation_or_quest_branch | (0, 3701, 3006, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3186 | `fever_pirate_millitia_10` | Pirate | npc_conversation_or_quest_branch | (0, 3710, 3004, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Pirate) |
| 3198 | `fever_banker_01` | Banker | npc_conversation_or_quest_branch | (0, 3682, 2981, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 3199 | `fever_banker_02` | Banker | npc_conversation_or_quest_branch | (0, 3682, 2982, m57_46) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2935 | `makinghistory_melina` | Melina | quest_or_varbit_morph_stage_dialogue | (0, 3674, 3484, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Melina) |
| 2938 | `makinghistory_droalak` | Droalak | quest_or_varbit_morph_stage_dialogue | (0, 3657, 3469, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Droalak) |
| 3155 | `fever_teach` | Bill Teach | npc_conversation_or_quest_branch | (0, 3679, 3495, m57_54) | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |
| 2825 | `deal_pete` | Pirate Pete | npc_conversation_or_quest_branch | (0, 3680, 3537, m57_55) | [wiki](https://oldschool.runescape.wiki/w/Pirate_Pete) |
| 3157 | `fever_port_ship_teach` | Bill Teach | npc_conversation_or_quest_branch | (1, 3713, 3497, m58_54) | [wiki](https://oldschool.runescape.wiki/w/Bill_Teach) |

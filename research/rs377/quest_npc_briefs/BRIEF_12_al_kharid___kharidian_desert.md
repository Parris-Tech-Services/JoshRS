# Brief 12: Al Kharid & Kharidian Desert

**Anchor:** Prince Ali Rescue, The Feud (2005-04-04), Desert Treasure (2005-04-18), Icthlarin's Little Helper (2005-04-26), Spirits of the Elid (2005-12-05), The Hand in the Sand (2006-01-10)  
**Anchor date:** 2001 -> 2006-01-10 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 79

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2910 | `agrith_dave` | Evil Dave | quest_or_varbit_morph_stage_dialogue | (0, 2721, 4910, m42_76) | [wiki](https://oldschool.runescape.wiki/w/Evil_Dave) |
| 3031 | `elid_villager1` | Usi | npc_conversation_or_quest_branch | (0, 2950, 3379, m46_52) | [wiki](https://oldschool.runescape.wiki/w/Usi) |
| 3032 | `elid_villager2` | Nkuku | npc_conversation_or_quest_branch | (1, 3028, 3329, m47_52) | [wiki](https://oldschool.runescape.wiki/w/Nkuku) |
| 3033 | `elid_villager3` | Garai | npc_conversation_or_quest_branch | (1, 3031, 3389, m47_52) | [wiki](https://oldschool.runescape.wiki/w/Garai) |
| 2292 | `magic_carpet_seller2` | Rug Merchant | npc_conversation_or_quest_branch | (0, 3182, 3043, m49_47) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 2299 | `magic_carpet_seller7_multi` | magic_carpet_seller7_multi | quest_or_varbit_morph_stage_dialogue | (0, 3243, 2813, m50_43) | [wiki](https://oldschool.runescape.wiki/w/Magic_Carpet_Seller7_Multi) |
| 2300 | `magic_carpet_seller7` | Rug Station Attendant | quest_or_varbit_morph_stage_dialogue | (0, 3243, 2813, m50_43) | [wiki](https://oldschool.runescape.wiki/w/Rug_Station_Attendant) |
| 2297 | `magic_carpet_seller6_multi` | magic_carpet_seller6_multi | quest_or_varbit_morph_stage_dialogue | (0, 3287, 2813, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Magic_Carpet_Seller6_Multi) |
| 2298 | `magic_carpet_seller6` | Rug Merchant | quest_or_varbit_morph_stage_dialogue | (0, 3287, 2813, m51_43) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 2899 | `agrith_reen` | Father Reen | quest_or_varbit_morph_stage_dialogue | (0, 3271, 3158, m51_49) | [wiki](https://oldschool.runescape.wiki/w/Father_Reen) |
| 3022 | `elid_genie` | Genie | npc_conversation_or_quest_branch | (0, 3371, 9320, m52_145) | [wiki](https://oldschool.runescape.wiki/w/Genie) |
| 3023 | `elid_waterspirit` | Nirrie | npc_conversation_or_quest_branch | (0, 3367, 9586, m52_149) | [wiki](https://oldschool.runescape.wiki/w/Nirrie) |
| 3024 | `elid_waterspirit_sitting` | Tirrie | npc_conversation_or_quest_branch | (0, 3368, 9587, m52_149) | [wiki](https://oldschool.runescape.wiki/w/Tirrie) |
| 3025 | `elid_waterspirit_male` | Hallak | npc_conversation_or_quest_branch | (0, 3368, 9585, m52_149) | [wiki](https://oldschool.runescape.wiki/w/Hallak) |
| 2293 | `magic_carpet_seller3` | Rug Merchant | npc_conversation_or_quest_branch | (0, 3348, 2942, m52_45) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 1863 | `feud_drunken_ali` | Drunken Ali | npc_conversation_or_quest_branch | (0, 3360, 2957, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Drunken_Ali) |
| 1864 | `feud_ali_the_barman` | Ali The barman | npc_conversation_or_quest_branch | (0, 3361, 2955, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_The_barman) |
| 1865 | `feud_kebabman` | Ali the Kebab seller | npc_conversation_or_quest_branch | (0, 3352, 2974, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Kebab_seller) |
| 1866 | `feud_marketseller` | Market seller | shopkeeper_greeting_and_openshop | (0, 3359, 2987, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Market_seller) |
| 1867 | `feud_ali_the_discount_camel_seller` | Ali the Camel Man | shopkeeper_greeting_and_openshop | (0, 3350, 2967, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Camel_Man) |
| 1868 | `feud_street_urchin` | Street urchin | npc_conversation_or_quest_branch | (0, 3352, 2958, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Street_urchin) |
| 1870 | `feud_mayor_geom` | Ali the Mayor | quest_or_varbit_morph_stage_dialogue | (0, 3360, 2970, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Mayor) |
| 1871 | `feud_hag` | Ali the Hag | npc_conversation_or_quest_branch | (0, 3346, 2987, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Hag) |
| 1872 | `feud_snakecharmer` | Ali the Snake Charmer | npc_conversation_or_quest_branch | (0, 3354, 2953, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Snake_Charmer) |
| 1878 | `feud_bandit_boss_vis` | Bandit Leader | quest_or_varbit_morph_stage_dialogue | (0, 3353, 3002, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit_Leader) |
| 1880 | `feud_arabian_guard1_1` | Bandit | quest_or_varbit_morph_stage_dialogue | (0, 3354, 3000, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1881 | `feud_arabian_guard1_2` | Bandit | quest_or_varbit_morph_stage_dialogue | (0, 3354, 3000, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1883 | `feud_arabian_guard2_1` | Bandit | quest_or_varbit_morph_stage_dialogue | (0, 3356, 2994, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1884 | `feud_arabian_guard2_2` | Bandit | quest_or_varbit_morph_stage_dialogue | (0, 3356, 2994, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Bandit) |
| 1886 | `feud_arabian_guard_coward` | Cowardly Bandit | npc_conversation_or_quest_branch | (0, 3359, 3000, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Cowardly_Bandit) |
| 1888 | `feud_villager_1_1` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3355, 2949, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1889 | `feud_villager_1_2` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3355, 2949, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1890 | `feud_villager_1_3` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3355, 2949, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1892 | `feud_villager_2_1` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3342, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1893 | `feud_villager_2_2` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3342, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1894 | `feud_villager_2_3` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3342, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1896 | `feud_villager_3_1` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3349, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1897 | `feud_villager_3_2` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3349, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1898 | `feud_villager_3_3` | Villager | quest_or_varbit_morph_stage_dialogue | (0, 3349, 2954, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Villager) |
| 1901 | `feud_menap_boss_vis` | Menaphite Leader | quest_or_varbit_morph_stage_dialogue | (0, 3334, 2956, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Menaphite_Leader) |
| 1902 | `feud_egyptian_minder` | Ali the Operator | npc_conversation_or_quest_branch | (0, 3334, 2949, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Operator) |
| 1904 | `feud_egyptian_doorman_1` | Menaphite Thug | quest_or_varbit_morph_stage_dialogue | (0, 3333, 2952, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Menaphite_Thug) |
| 1905 | `feud_egyptian_doorman_2` | Menaphite Thug | quest_or_varbit_morph_stage_dialogue | (0, 3333, 2952, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Menaphite_Thug) |
| 2294 | `magic_carpet_seller4` | Rug Merchant | npc_conversation_or_quest_branch | (0, 3350, 3001, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 2548 | `feud_bjseller` | Blackjack seller | shopkeeper_greeting_and_openshop | (0, 3351, 2971, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Blackjack_seller) |
| 2549 | `feud_dye_lady` | Ali the dyer | npc_conversation_or_quest_branch | (0, 3364, 3001, m52_46) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_dyer) |
| 3020 | `magic_carpet_seller8` | Rug Merchant | npc_conversation_or_quest_branch | (0, 3401, 2918, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 3029 | `elid_ghaslor` | Ghaslor the Elder | npc_conversation_or_quest_branch | (0, 3441, 2933, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Ghaslor_the_Elder) |
| 3030 | `ali_the_carter` | Ali the Carter | npc_conversation_or_quest_branch | (0, 3421, 2914, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Ali_the_Carter) |
| 3034 | `elid_villager4` | Habibah | npc_conversation_or_quest_branch | (1, 3410, 2929, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Habibah) |
| 3035 | `elid_villager5` | Meskhenet | npc_conversation_or_quest_branch | (0, 3427, 2900, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Meskhenet) |
| 3036 | `elid_villager6` | Zahra | npc_conversation_or_quest_branch | (0, 3448, 2898, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Zahra) |
| 3037 | `elid_herbalist` | Zahur | npc_conversation_or_quest_branch | (0, 3424, 2906, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Zahur) |
| 3038 | `elid_shield_seller` | Seddu | shopkeeper_greeting_and_openshop | (0, 3407, 2925, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Seddu) |
| 3039 | `elid_general_seller` | Kazemde | shopkeeper_greeting_and_openshop | (0, 3414, 2906, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Kazemde) |
| 3040 | `elid_mayor` | Awusah the Mayor | npc_conversation_or_quest_branch | (0, 3442, 2912, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Awusah_the_Mayor) |
| 3044 | `elid_shiratti` | Shiratti the Custodian | npc_conversation_or_quest_branch | (0, 3424, 2929, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Shiratti_the_Custodian) |
| 3045 | `elid_choc_ice_seller` | Rokuh | shopkeeper_greeting_and_openshop | (0, 3430, 2914, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Rokuh) |
| 3046 | `elid_banker` | Nardah Banker | npc_conversation_or_quest_branch | (0, 3425, 2889, m53_45) | [wiki](https://oldschool.runescape.wiki/w/Nardah_Banker) |
| 2295 | `magic_carpet_seller5_multi` | magic_carpet_seller5_multi | quest_or_varbit_morph_stage_dialogue | (0, 3467, 3110, m54_48) | [wiki](https://oldschool.runescape.wiki/w/Magic_Carpet_Seller5_Multi) |
| 2296 | `magic_carpet_seller5` | Rug Merchant | quest_or_varbit_morph_stage_dialogue | (0, 3467, 3110, m54_48) | [wiki](https://oldschool.runescape.wiki/w/Rug_Merchant) |
| 2902 | `agrith_badden` | Father Badden | quest_or_varbit_morph_stage_dialogue | (0, 3483, 3090, m54_48) | [wiki](https://oldschool.runescape.wiki/w/Father_Badden) |
| 2900 | `agrith_reen_sigil` | Father Reen | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Father_Reen) |
| 2903 | `agrith_badden_sigil` | Father Badden | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Father_Badden) |
| 2904 | `agrith_denath` | Denath | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Denath) |
| 2905 | `agrith_denath_sigil` | Denath | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Denath) |
| 2906 | `agrith_eric` | Eric | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Eric) |
| 2907 | `agrith_eric_sigil` | Eric | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Eric) |
| 2909 | `agrith_dave_sigil` | Evil Dave | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Evil_Dave) |
| 2911 | `agrith_matthew` | Matthew | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Matthew) |
| 2912 | `agrith_matthew_sigil` | Matthew | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Matthew) |
| 2913 | `agrith_jennifer` | Jennifer | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Jennifer) |
| 2914 | `agrith_jennifer_sigil` | Jennifer | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Jennifer) |
| 2915 | `agrith_tanya` | Tanya | quest_or_varbit_morph_stage_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Tanya) |
| 2916 | `agrith_tanya_sigil` | Tanya | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Tanya) |
| 2917 | `agrith_patrick` | Patrick | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Patrick) |
| 2918 | `agrith_patrick_sigil` | Patrick | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Patrick) |
| 2927 | `agrith_golem_throneroom` | Clay golem | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Clay_golem) |
| 2928 | `agrith_golem_sigil` | Clay golem | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Clay_golem) |

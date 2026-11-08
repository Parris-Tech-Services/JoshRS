# Brief 13: Keldagrim & The Giant Dwarf

**Anchor:** Between a Rock... (2005-03-21), The Giant Dwarf (2005-05-31), Forgettable Tale of a Drunken Dwarf (2005-07-26)  
**Anchor date:** 2005-03-21 -> 2005-07-26 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 111

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 1842 | `dwarfrock_engineer2` | Khorvak, a dwarven engineer | npc_conversation_or_quest_branch | (0, 2864, 9876, m44_154) | [wiki](https://oldschool.runescape.wiki/w/Khorvak%2C_a_dwarven_engineer) |
| 2185 | `dwarf_city_train_conductor6` | Cart conductor | npc_conversation_or_quest_branch | (0, 2874, 9872, m44_154) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 1837 | `dwarfrock_dondakan` | Dondakan the Dwarf | quest_or_varbit_morph_stage_dialogue | (0, 2824, 10168, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dondakan_the_Dwarf) |
| 1838 | `dwarfrock_dondakan_noaxe` | Dondakan the Dwarf | quest_or_varbit_morph_stage_dialogue | (0, 2824, 10168, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dondakan_the_Dwarf) |
| 1843 | `dwarfrock_ferryman1` | Dwarven Ferryman | npc_conversation_or_quest_branch | (0, 2839, 10128, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Ferryman) |
| 1844 | `dwarfrock_ferryman2` | Dwarven Ferryman | npc_conversation_or_quest_branch | (0, 2855, 10144, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Ferryman) |
| 1846 | `dwarfrock_gold_boatman` | Dwarven Boatman | quest_or_varbit_morph_stage_dialogue | (0, 2873, 10166, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Boatman) |
| 1847 | `dwarfrock_boatman_bruv1` | Miodvetnir | npc_conversation_or_quest_branch | (0, 2870, 10140, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Miodvetnir) |
| 1848 | `dwarfrock_boatman_bruv2` | Dernu | npc_conversation_or_quest_branch | (0, 2870, 10139, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dernu) |
| 1849 | `dwarfrock_boatman_bruv3` | Derni | npc_conversation_or_quest_branch | (0, 2870, 10138, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Derni) |
| 2205 | `dwarf_city_boatman_mines_prequest` | Dwarven Boatman | npc_conversation_or_quest_branch | (0, 2842, 10129, m44_158) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Boatman) |
| 1840 | `dwarfrock_engineer1` | Dwarven Engineer | npc_conversation_or_quest_branch | (0, 2871, 10198, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Engineer) |
| 2092 | `dwarf_city_secretary_purple_pewter` | Purple Pewter Secretary | npc_conversation_or_quest_branch | (1, 2868, 10194, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Purple_Pewter_Secretary) |
| 2093 | `dwarf_city_secretary_yellow_fortune` | Yellow Fortune Secretary | npc_conversation_or_quest_branch | (1, 2870, 10209, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Yellow_Fortune_Secretary) |
| 2094 | `dwarf_city_secretary_blue_opal` | Blue Opal Secretary | npc_conversation_or_quest_branch | (1, 2869, 10205, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Blue_Opal_Secretary) |
| 2099 | `dwarf_city_secretary_red_axe` | Red Axe Secretary | quest_or_varbit_morph_stage_dialogue | (1, 2869, 10189, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Red_Axe_Secretary) |
| 2100 | `dwarf_city_director_purple_pewter` | Purple Pewter Director | npc_conversation_or_quest_branch | (1, 2870, 10196, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Purple_Pewter_Director) |
| 2101 | `dwarf_city_director_blue_opal` | Blue Opal Director | npc_conversation_or_quest_branch | (1, 2867, 10203, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Blue_Opal_Director) |
| 2102 | `dwarf_city_director_yellow_fortune` | Yellow Fortune Director | npc_conversation_or_quest_branch | (1, 2868, 10209, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Yellow_Fortune_Director) |
| 2107 | `dwarf_city_director_red_axe` | Red Axe Director | quest_or_varbit_morph_stage_dialogue | (1, 2872, 10189, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Red_Axe_Director) |
| 2108 | `dwarf_city_evil_cat` | Red Axe Cat | quest_or_varbit_morph_stage_dialogue | (1, 2870, 10190, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Red_Axe_Cat) |
| 2128 | `dwarf_city_black_guard_supreme_leader` | Supreme Commander | npc_conversation_or_quest_branch | (1, 2828, 10210, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Supreme_Commander) |
| 2129 | `dwarf_city_black_guard_leader` | Commander Veldaban | npc_conversation_or_quest_branch | (0, 2826, 10215, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Commander_Veldaban) |
| 2131 | `dwarf_city_black_guard2` | Black Guard | interactive_citizen_or_guard_dialogue | (0, 2822, 10212, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard) |
| 2132 | `dwarf_city_black_guard3` | Black Guard | interactive_citizen_or_guard_dialogue | (0, 2828, 10210, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard) |
| 2133 | `dwarf_city_black_guard4` | Black Guard | interactive_citizen_or_guard_dialogue | (0, 2847, 10190, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard) |
| 2134 | `dwarf_city_berserker1` | Black Guard Berserker | interactive_citizen_or_guard_dialogue | (0, 2823, 10220, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard_Berserker) |
| 2135 | `dwarf_city_berserker2` | Black Guard Berserker | interactive_citizen_or_guard_dialogue | (0, 2825, 10209, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard_Berserker) |
| 2136 | `dwarf_city_berserker3` | Black Guard Berserker | interactive_citizen_or_guard_dialogue | (1, 2827, 10212, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard_Berserker) |
| 2137 | `dwarf_city_gnome_emissary` | Gnome emissary | quest_or_varbit_morph_stage_dialogue | (1, 2872, 10190, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Gnome_emissary) |
| 2138 | `dwarf_city_gnome_female_emissary` | Gnome traveller | quest_or_varbit_morph_stage_dialogue | (1, 2836, 10192, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Gnome_traveller) |
| 2139 | `dwarf_city_gnome_male_emissary` | Gnome traveller | quest_or_varbit_morph_stage_dialogue | (1, 2835, 10193, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Gnome_traveller) |
| 2140 | `dwarf_city_guarding_cat` | Dromund's cat | npc_conversation_or_quest_branch | (0, 2835, 10226, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Dromund%27s_cat) |
| 2151 | `dwarf_city_shop_warhammer` | Vigr | shopkeeper_greeting_and_openshop | (0, 2873, 10209, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Vigr) |
| 2152 | `dwarf_city_shop_weapons` | Santiri | shopkeeper_greeting_and_openshop | (0, 2828, 10229, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Santiri) |
| 2153 | `dwarf_city_shop_armour` | Saro | shopkeeper_greeting_and_openshop | (0, 2827, 10199, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Saro) |
| 2154 | `dwarf_city_shop_general_store` | Gunslik | shopkeeper_greeting_and_openshop | (0, 2869, 10190, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Gunslik) |
| 2155 | `dwarf_city_shop_ship_mechanic` | Wemund | npc_conversation_or_quest_branch | (0, 2870, 10200, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Wemund) |
| 2161 | `dwarf_city_shop_cloth` | Agmundi | shopkeeper_greeting_and_openshop | (0, 2869, 10211, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Agmundi) |
| 2163 | `dwarf_city_banker1` | Banker | npc_conversation_or_quest_branch | (0, 2836, 10205, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 2165 | `dwarf_city_librarian` | Librarian | npc_conversation_or_quest_branch | (0, 2858, 10225, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Librarian) |
| 2166 | `dwarf_city_library_assistant` | Assistant | npc_conversation_or_quest_branch | (0, 2860, 10226, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Assistant) |
| 2167 | `dwarf_city_library_customer` | Customer | npc_conversation_or_quest_branch | (1, 2862, 10225, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Customer) |
| 2168 | `dwarf_city_library_customer_human` | Customer | npc_conversation_or_quest_branch | (0, 2864, 10227, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Customer) |
| 2169 | `dwarf_city_excentric_dwarf` | Dromund | npc_conversation_or_quest_branch | (0, 2835, 10225, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Dromund) |
| 2170 | `dwarf_city_gardener_dwarf` | Rind the gardener | npc_conversation_or_quest_branch | (0, 2854, 10195, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Rind_the_gardener) |
| 2177 | `dwarf_city_inn_keeper_rich` | Inn Keeper | npc_conversation_or_quest_branch | (1, 2839, 10195, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Inn_Keeper) |
| 2179 | `dwarf_city_barman_rich` | Barman | npc_conversation_or_quest_branch | (0, 2841, 10197, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Barman) |
| 2188 | `dwarf_city_old_dwarf1` | Hegir | npc_conversation_or_quest_branch | (0, 2851, 10225, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Hegir) |
| 2189 | `dwarf_city_old_dwarf2` | Haera | npc_conversation_or_quest_branch | (0, 2850, 10223, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Haera) |
| 2196 | `dwarf_city_dwarf_man6` | Gauss | npc_conversation_or_quest_branch | (0, 2838, 10195, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Gauss) |
| 2197 | `dwarf_city_dwarf_man7` | Myndill | npc_conversation_or_quest_branch | (0, 2855, 10224, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Myndill) |
| 2199 | `dwarf_city_dwarf_man9` | Tombar | npc_conversation_or_quest_branch | (0, 2854, 10199, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Tombar) |
| 2200 | `dwarf_city_dwarf_man10` | Odmar | npc_conversation_or_quest_branch | (0, 2865, 10194, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Odmar) |
| 2201 | `dwarf_city_dwarf_man11` | Audmann | npc_conversation_or_quest_branch | (0, 2866, 10206, m44_159) | [wiki](https://oldschool.runescape.wiki/w/Audmann) |
| 2183 | `dwarf_city_train_conductor4` | Cart conductor | npc_conversation_or_quest_branch | (0, 2906, 10171, m45_158) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2409 | `dwarf_city_train_conductor8` | Cart conductor | npc_conversation_or_quest_branch | (0, 2922, 10166, m45_158) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2095 | `dwarf_city_secretary_green_gemstone` | Green Gemstone Secretary | npc_conversation_or_quest_branch | (1, 2889, 10211, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Green_Gemstone_Secretary) |
| 2096 | `dwarf_city_secretary_white_chisel` | White Chisel Secretary | npc_conversation_or_quest_branch | (1, 2890, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/White_Chisel_Secretary) |
| 2097 | `dwarf_city_secretary_silver_cog` | Silver Cog Secretary | npc_conversation_or_quest_branch | (1, 2891, 10196, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Silver_Cog_Secretary) |
| 2098 | `dwarf_city_secretary_brown_engine` | Brown Engine Secretary | npc_conversation_or_quest_branch | (1, 2890, 10192, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Brown_Engine_Secretary) |
| 2103 | `dwarf_city_director_green_gemstone` | Green Gemstone Director | npc_conversation_or_quest_branch | (1, 2891, 10210, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Green_Gemstone_Director) |
| 2104 | `dwarf_city_director_white_chisel` | White Chisel Director | npc_conversation_or_quest_branch | (1, 2890, 10205, m45_159) | [wiki](https://oldschool.runescape.wiki/w/White_Chisel_Director) |
| 2105 | `dwarf_city_director_silver_cog` | Silver Cog Director | npc_conversation_or_quest_branch | (1, 2893, 10196, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Silver_Cog_Director) |
| 2106 | `dwarf_city_director_brown_engine` | Brown Engine Director | npc_conversation_or_quest_branch | (1, 2892, 10190, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Brown_Engine_Director) |
| 2127 | `dwarf_city_trader_referee` | Trade Referee | npc_conversation_or_quest_branch | (1, 2880, 10199, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Trade_Referee) |
| 2130 | `dwarf_city_black_guard1` | Black Guard | interactive_citizen_or_guard_dialogue | (0, 2889, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Black_Guard) |
| 2141 | `dwarf_city_shop_sculpture` | Blasidar the sculptor | npc_conversation_or_quest_branch | (0, 2906, 10205, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Blasidar_the_sculptor) |
| 2143 | `dwarf_city_shop_sculpture_model` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2144 | `dwarf_city_shop_sculpture_model_boots` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2145 | `dwarf_city_shop_sculpture_model_torso` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2146 | `dwarf_city_shop_sculpture_model_axe` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2147 | `dwarf_city_shop_sculpture_model_boots_and_torso` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2148 | `dwarf_city_shop_sculpture_model_boots_and_axe` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2149 | `dwarf_city_shop_sculpture_model_torso_and_axe` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2150 | `dwarf_city_shop_sculpture_model_finished` | Riki the sculptor's model | quest_or_varbit_morph_stage_dialogue | (0, 2904, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Riki_the_sculptor%27s_model) |
| 2156 | `dwarf_city_shop_bakery` | Randivor | shopkeeper_greeting_and_openshop | (0, 2892, 10212, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Randivor) |
| 2157 | `dwarf_city_shop_gems` | Hervi | shopkeeper_greeting_and_openshop | (0, 2888, 10212, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Hervi) |
| 2158 | `dwarf_city_shop_craft` | Nolar | shopkeeper_greeting_and_openshop | (0, 2885, 10207, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Nolar) |
| 2159 | `dwarf_city_shop_silver` | Gulldamar | shopkeeper_greeting_and_openshop | (0, 2885, 10197, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Gulldamar) |
| 2160 | `dwarf_city_shop_pickaxe` | Tati | shopkeeper_greeting_and_openshop | (0, 2925, 10210, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Tati) |
| 2162 | `dwarf_city_shop_cloth_poor` | Vermundi | shopkeeper_greeting_and_openshop | (0, 2887, 10189, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Vermundi) |
| 2171 | `dwarf_city_factory_guard` | Factory Manager | npc_conversation_or_quest_branch | (0, 2931, 10184, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Factory_Manager) |
| 2172 | `dwarf_city_factory_worker1` | Factory Worker | npc_conversation_or_quest_branch | (0, 2929, 10191, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Factory_Worker) |
| 2173 | `dwarf_city_factory_worker2` | Factory Worker | npc_conversation_or_quest_branch | (0, 2931, 10191, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Factory_Worker) |
| 2174 | `dwarf_city_factory_worker3` | Factory Worker | npc_conversation_or_quest_branch | (0, 2930, 10188, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Factory_Worker) |
| 2175 | `dwarf_city_factory_worker4` | Factory Worker | npc_conversation_or_quest_branch | (0, 2931, 10187, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Factory_Worker) |
| 2178 | `dwarf_city_barmaid_poor` | Barmaid | npc_conversation_or_quest_branch | (0, 2916, 10195, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Barmaid) |
| 2180 | `dwarf_city_train_conductor1` | Cart conductor | npc_conversation_or_quest_branch | (0, 2919, 10180, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2181 | `dwarf_city_train_conductor2` | Cart conductor | npc_conversation_or_quest_branch | (0, 2925, 10176, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2182 | `dwarf_city_train_conductor3` | Cart conductor | npc_conversation_or_quest_branch | (0, 2936, 10181, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2184 | `dwarf_city_train_conductor5` | Cart conductor | npc_conversation_or_quest_branch | (0, 2908, 10188, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2187 | `dwarf_city_rowdy_dwarf` | Rowdy dwarf | npc_conversation_or_quest_branch | (0, 2906, 10198, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Rowdy_dwarf) |
| 2190 | `dwarf_city_old_dwarf3` | Runvastr | npc_conversation_or_quest_branch | (0, 2923, 10203, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Runvastr) |
| 2191 | `dwarf_city_dwarf_man1` | Sune | npc_conversation_or_quest_branch | (0, 2924, 10213, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Sune) |
| 2192 | `dwarf_city_dwarf_man2` | Bentamir | npc_conversation_or_quest_branch | (0, 2933, 10219, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Bentamir) |
| 2193 | `dwarf_city_dwarf_man3` | Ulifed | npc_conversation_or_quest_branch | (0, 2899, 10218, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Ulifed) |
| 2194 | `dwarf_city_dwarf_man4` | Reinald | npc_conversation_or_quest_branch | (0, 2926, 10225, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Reinald) |
| 2195 | `dwarf_city_dwarf_man5` | Karl | npc_conversation_or_quest_branch | (0, 2900, 10227, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Karl) |
| 2198 | `dwarf_city_dwarf_man8` | Kjut | npc_conversation_or_quest_branch | (0, 2906, 10216, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Kjut) |
| 2203 | `dwarf_city_drunken_dwarf` | Drunken Dwarf | quest_or_varbit_morph_stage_dialogue | (0, 2912, 10222, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Drunken_Dwarf) |
| 2204 | `dwarf_city_drunken_kebab` | Drunken Dwarf | quest_or_varbit_morph_stage_dialogue | (0, 2912, 10222, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Drunken_Dwarf) |
| 2206 | `dwarf_city_boatman_city` | Dwarven Boatman | npc_conversation_or_quest_branch | (0, 2888, 10227, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Boatman) |
| 2321 | `blandebir` | Blandebir | npc_conversation_or_quest_branch | (1, 2915, 10194, m45_159) | [wiki](https://oldschool.runescape.wiki/w/Blandebir) |
| 2186 | `dwarf_city_train_conductor7` | Cart conductor | npc_conversation_or_quest_branch | (0, 2995, 9837, m46_153) | [wiki](https://oldschool.runescape.wiki/w/Cart_conductor) |
| 2091 | `dwarf_city_secretary` | Secretary | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Secretary) |
| 2176 | `dwarf_city_inn_keeper_poor` | Inn Keeper | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Inn_Keeper) |
| 2208 | `dwarf_city_dwarf_sack_in_cart_empty` | Dwarven Miner | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Miner) |
| 2212 | `dwarf_city_dwarf_sack_in_cart_empty2` | Dwarven Miner | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Miner) |
| 2213 | `dwarf_city_dwarf_sack_carrier_full2` | Dwarven Miner | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Miner) |
| 2216 | `dwarf_city_dwarf_sack_in_cart_empty3` | Dwarven Miner | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Dwarven_Miner) |

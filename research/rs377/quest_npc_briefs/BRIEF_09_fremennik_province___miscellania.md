# Brief 9: Fremennik Province & Miscellania

**Anchor:** The Fremennik Trials (+ Mountain Daughter 7 Mar 2005)  
**Anchor date:** 2004-11-02 (Trials, per OSRS wiki); Mountain Daughter 2005-03-07 (wiki-confirmed: yes)  
**NPCs missing a Talk-to trigger:** 73

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2438 | `viking_dagganoth_cave_waterbirth_island` | Jarvald | npc_conversation_or_quest_branch | (0, 2544, 3761, m39_58) | [wiki](https://oldschool.runescape.wiki/w/Jarvald) |
| 2439 | `viking_askelapen_dagganoth_mountain` | Askeladden | npc_conversation_or_quest_branch | (0, 2539, 3739, m39_58) | [wiki](https://oldschool.runescape.wiki/w/Askeladden) |
| 1371 | `misc_prince_brand` | Prince Brand | npc_conversation_or_quest_branch | (1, 2502, 3852, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Prince_Brand) |
| 1372 | `misc_princess_astrid` | Princess Astrid | npc_conversation_or_quest_branch | (1, 2502, 3868, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Princess_Astrid) |
| 1373 | `misc_king_vargas` | King Vargas | npc_conversation_or_quest_branch | (1, 2501, 3859, m39_60) | [wiki](https://oldschool.runescape.wiki/w/King_Vargas) |
| 1374 | `misc_ulby_doorguard` | Guard | npc_conversation_or_quest_branch | (1, 2505, 3856, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Guard) |
| 1375 | `misc_advisor_ghrim` | Advisor Ghrim | npc_conversation_or_quest_branch | (1, 2499, 3857, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Advisor_Ghrim) |
| 1376 | `misc_smithy` | Derrik | npc_conversation_or_quest_branch | (0, 2551, 3897, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Derrik) |
| 1378 | `misc_flowergirl` | Flower Girl | npc_conversation_or_quest_branch | (0, 2514, 3866, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Flower_Girl) |
| 1379 | `misc_man_1` | Ragnar | interactive_citizen_or_guard_dialogue | (0, 2518, 3859, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Ragnar) |
| 1380 | `misc_man_2` | Einar | interactive_citizen_or_guard_dialogue | (0, 2501, 3868, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Einar) |
| 1381 | `misc_man_3` | Alrik | interactive_citizen_or_guard_dialogue | (0, 2514, 3855, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Alrik) |
| 1382 | `misc_woman_1` | Thorhild | interactive_citizen_or_guard_dialogue | (0, 2502, 3852, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Thorhild) |
| 1383 | `misc_woman_2` | Halla | interactive_citizen_or_guard_dialogue | (0, 2541, 3896, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Halla) |
| 1386 | `misc_woman_4` | Rannveig | interactive_citizen_or_guard_dialogue | (0, 2513, 3865, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Rannveig) |
| 1387 | `misc_woman_5` | Thora | interactive_citizen_or_guard_dialogue | (0, 2511, 3871, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Thora) |
| 1388 | `misc_woman_6` | Valgerd | interactive_citizen_or_guard_dialogue | (0, 2511, 3854, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Valgerd) |
| 1389 | `misc_man_4` | Skraeling | interactive_citizen_or_guard_dialogue | (0, 2513, 3866, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Skraeling) |
| 1390 | `misc_man_5` | Broddi | interactive_citizen_or_guard_dialogue | (0, 2512, 3871, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Broddi) |
| 1391 | `misc_man_6` | Skraeling | interactive_citizen_or_guard_dialogue | (0, 2515, 3863, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Skraeling) |
| 1392 | `misc_man_7` | Ragnvald | interactive_citizen_or_guard_dialogue | (0, 2518, 3867, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Ragnvald) |
| 1393 | `misc_fish_monger` | Fishmonger | shopkeeper_greeting_and_openshop | (0, 2518, 3866, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Fishmonger) |
| 1394 | `misc_veg_monger` | Greengrocer | shopkeeper_greeting_and_openshop | (0, 2516, 3864, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Greengrocer) |
| 1395 | `misc_lumberjack` | Lumberjack Leif | npc_conversation_or_quest_branch | (0, 2550, 3869, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Lumberjack_Leif) |
| 1396 | `misc_miner` | Miner Magnus | npc_conversation_or_quest_branch | (0, 2526, 3893, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Miner_Magnus) |
| 1398 | `misc_gardener` | Gardener Gunnhild | npc_conversation_or_quest_branch | (0, 2525, 3850, m39_60) | [wiki](https://oldschool.runescape.wiki/w/Gardener_Gunnhild) |
| 2436 | `viking_dagganoth_cave_ferryman_1op` | Jarvald | quest_or_varbit_morph_stage_dialogue | (0, 2621, 3683, m40_57) | [wiki](https://oldschool.runescape.wiki/w/Jarvald) |
| 2437 | `viking_dagganoth_cave_ferryman_island` | Jarvald | quest_or_varbit_morph_stage_dialogue | (0, 2621, 3683, m40_57) | [wiki](https://oldschool.runescape.wiki/w/Jarvald) |
| 1359 | `misc_queen_sigrid` | Queen Sigrid | npc_conversation_or_quest_branch | (1, 2612, 3877, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Queen_Sigrid) |
| 1360 | `misc_banker` | Banker | npc_conversation_or_quest_branch | (0, 2620, 3895, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Banker) |
| 1361 | `misc_etc_man_1` | Arnor | interactive_citizen_or_guard_dialogue | (0, 2615, 3899, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Arnor) |
| 1362 | `misc_etc_man_2` | Haming | interactive_citizen_or_guard_dialogue | (0, 2604, 3881, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Haming) |
| 1364 | `misc_etc_woman_1` | Helga | interactive_citizen_or_guard_dialogue | (0, 2614, 3883, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Helga) |
| 1365 | `misc_etc_woman_2` | Matilda | interactive_citizen_or_guard_dialogue | (0, 2603, 3871, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Matilda) |
| 1366 | `misc_etc_woman_3` | Ashild | interactive_citizen_or_guard_dialogue | (0, 2603, 3858, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Ashild) |
| 1385 | `misc_sailor` | Sailor | npc_conversation_or_quest_branch | (0, 2581, 3847, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Sailor) |
| 1397 | `misc_fisherman` | Fisherman Frodi | npc_conversation_or_quest_branch | (0, 2576, 3852, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Fisherman_Frodi) |
| 1269 | `viking_olaf` | Olaf the Bard | npc_conversation_or_quest_branch | (0, 2673, 3683, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Olaf_the_Bard) |
| 1274 | `viking_heckler` | Ospak | npc_conversation_or_quest_branch | (0, 2660, 3680, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Ospak) |
| 1275 | `viking_heckler_2` | Styrmir | npc_conversation_or_quest_branch | (0, 2657, 3680, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Styrmir) |
| 1276 | `viking_heckler_3` | Torbrund | npc_conversation_or_quest_branch | (0, 2658, 3679, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Torbrund) |
| 1277 | `viking_heckler_4` | Fridgeir | npc_conversation_or_quest_branch | (0, 2659, 3678, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Fridgeir) |
| 1278 | `viking_longhall_bouncer` | Longhall Bouncer | npc_conversation_or_quest_branch | (0, 2667, 3684, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Longhall_Bouncer) |
| 1281 | `viking_sigli` | Sigli the Huntsman | npc_conversation_or_quest_branch | (0, 2660, 3653, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Sigli_the_Huntsman) |
| 1282 | `viking_sigmund` | Sigmund The Merchant | shopkeeper_greeting_and_openshop | (0, 2641, 3680, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Sigmund_The_Merchant) |
| 1283 | `viking_hallifred` | Swensen the Navigator | npc_conversation_or_quest_branch | (0, 2646, 3660, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Swensen_the_Navigator) |
| 1284 | `viking_reveller` | Bjorn | npc_conversation_or_quest_branch | (0, 2655, 3673, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Bjorn) |
| 1285 | `viking_reveller_2` | Eldgrim | npc_conversation_or_quest_branch | (0, 2658, 3674, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Eldgrim) |
| 1286 | `viking_reveller_3` | Manni the Reveller | npc_conversation_or_quest_branch | (0, 2660, 3673, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Manni_the_Reveller) |
| 1288 | `viking_peer` | Peer the Seer | npc_conversation_or_quest_branch | (0, 2634, 3668, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Peer_the_Seer) |
| 1289 | `viking_thorvald` | Thorvald the Warrior | npc_conversation_or_quest_branch | (0, 2666, 3693, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Thorvald_the_Warrior) |
| 1294 | `viking_brundt` | Brundt the Chieftain | npc_conversation_or_quest_branch | (0, 2659, 3669, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Brundt_the_Chieftain) |
| 1295 | `viking_askelapen` | Askeladden | npc_conversation_or_quest_branch | (0, 2658, 3660, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Askeladden) |
| 1301 | `viking_clothing_shopkeeper` | Yrsa | shopkeeper_greeting_and_openshop | (0, 2625, 3675, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Yrsa) |
| 1302 | `viking_fisherman1` | Fisherman | npc_conversation_or_quest_branch | (0, 2641, 3699, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Fisherman) |
| 1303 | `viking_weapons_salesman` | Skulgrimen | shopkeeper_greeting_and_openshop | (0, 2663, 3694, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Skulgrimen) |
| 1304 | `viking_sailor` | Sailor | npc_conversation_or_quest_branch | (0, 2629, 3693, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Sailor) |
| 1305 | `viking_man` | Agnar | interactive_citizen_or_guard_dialogue | (0, 2642, 3677, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Agnar) |
| 1306 | `viking_man2` | Freidir | interactive_citizen_or_guard_dialogue | (0, 2674, 3675, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Freidir) |
| 1307 | `viking_man3` | Borrokar | interactive_citizen_or_guard_dialogue | (0, 2679, 3690, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Borrokar) |
| 1308 | `viking_man4` | Lanzig | interactive_citizen_or_guard_dialogue | (0, 2676, 3665, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Lanzig) |
| 1309 | `viking_man5` | Pontak | interactive_citizen_or_guard_dialogue | (0, 2666, 3652, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Pontak) |
| 1310 | `viking_woman` | Freygerd | interactive_citizen_or_guard_dialogue | (0, 2667, 3702, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Freygerd) |
| 1311 | `viking_woman2` | Lensa | interactive_citizen_or_guard_dialogue | (0, 2655, 3652, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Lensa) |
| 1312 | `viking_woman3` | Jennella | interactive_citizen_or_guard_dialogue | (0, 2640, 3651, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Jennella) |
| 1313 | `viking_woman4` | Sassilik | interactive_citizen_or_guard_dialogue | (0, 2627, 3654, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Sassilik) |
| 1314 | `viking_woman_indoors` | Inga | interactive_citizen_or_guard_dialogue | (0, 2674, 3677, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Inga) |
| 1315 | `viking_fish_monger` | Fish monger | shopkeeper_greeting_and_openshop | (0, 2646, 3675, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Fish_monger) |
| 1316 | `viking_fur_monger` | Fur trader | shopkeeper_greeting_and_openshop | (0, 2640, 3675, m41_57) | [wiki](https://oldschool.runescape.wiki/w/Fur_trader) |
| 1270 | `viking_lalli_troll` | Lalli | npc_conversation_or_quest_branch | (0, 2770, 3622, m43_56) | [wiki](https://oldschool.runescape.wiki/w/Lalli) |
| 1273 | `viking_lake_spirit` | Fossegrimen | npc_conversation_or_quest_branch | unspawned | [wiki](https://oldschool.runescape.wiki/w/Fossegrimen) |
| 1363 | `misc_etc_man_3` | Moldof | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Moldof) |
| 1384 | `misc_woman_3` | Yrsa | interactive_citizen_or_guard_dialogue | unspawned | [wiki](https://oldschool.runescape.wiki/w/Yrsa) |

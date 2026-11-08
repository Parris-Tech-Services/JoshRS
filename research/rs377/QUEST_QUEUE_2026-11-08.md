# JoshRS Revision 377 Quest Queue & NPC Cross-Reference (2026-11-08)

## Revision 377 Cutoff Evidence
- **Target Revision:** `377`
- **Cutoff Date:** `2006-05-02` (*Swan Song*)
- **Evidence:** interfaces/questlist.if in the Revision 377 cache contains exactly 104 quest buttons ending with [swansong] (Swan Song, released 2 May 2006). Quests from 15 May 2006 onward (Royal Trouble, Death to the Dorgeshuun, Fairytale II, Lunar Diplomacy, Elemental Workshop II) do not exist in questlist.if or _unpack/377/all.varp.

## Summary Metrics
- **Total 377 Quests on `questlist.if`:** `104`
- **Total 377 Miniquests / Adjacent Flows:** `7`
- **COMPLETE-VERIFIED:** `69`
- **COMPLETE-UNVERIFIED:** `0`
- **PARTIAL:** `0`
- **STUB (config only):** `4`
- **NOT STARTED:** `31`
- **Unhandled `Talk-to` NPCs Cross-Referenced:** `817` (`364` quest-linked, `453` ambient)

## Chronological Quest Queue (Oldest to Newest, F2P First on Ties)

| # | Release Date | Quest Name | Component | Type | Batch | QP | Varp / Varbit | Start NPC & Location | Status | RS2 Lines | Linked Unhandled NPCs |
|---:|---|---|---|---|---|---:|---|---|---|---:|---:|
| 1 | `2001-01-04` | **Cook's Assistant** | `questlist:cook` | Free | Batch A | 1 | `cookquest` | `cook` (Lumbridge Castle kitchen) | `COMPLETE-VERIFIED` | 132 | 0 |
| 2 | `2001-01-04` | **Demon Slayer** | `questlist:demon` | Free | Batch A | 3 | `demonstart` | `gypsy` (Varrock Square tent) | `COMPLETE-VERIFIED` | 163 | 0 |
| 3 | `2001-01-04` | **The Restless Ghost** | `questlist:priest` | Free | Batch A | 1 | `prieststart` | `father_aereck` (Lumbridge Church) | `COMPLETE-VERIFIED` | 294 | 0 |
| 4 | `2001-01-04` | **Romeo & Juliet** | `questlist:romeojuliet` | Free | Batch A | 5 | `rjquest` | `romeo` (Varrock Square) | `COMPLETE-VERIFIED` | 82 | 0 |
| 5 | `2001-01-04` | **Sheep Shearer** | `questlist:sheep` | Free | Batch A | 1 | `sheep` | `fred_the_farmer` (North of Lumbridge) | `COMPLETE-VERIFIED` | 42 | 0 |
| 6 | `2001-01-04` | **Shield of Arrav** | `questlist:blackarmgang` | Free | Batch A | 1 | `blackarmgang / phoenixgang` | `reldo` (Varrock Palace Library) | `COMPLETE-VERIFIED` | 353 | 0 |
| 7 | `2001-01-21` | **Ernest the Chicken** | `questlist:haunted` | Free | Batch A | 4 | `haunted` | `veronica` (Outside Draynor Manor) | `COMPLETE-VERIFIED` | 384 | 0 |
| 8 | `2001-01-28` | **Vampire Slayer** | `questlist:vampire` | Free | Batch A | 3 | `vampire` | `morgan` (Draynor Village) | `COMPLETE-VERIFIED` | 192 | 0 |
| 9 | `2001-02-16` | **Imp Catcher** | `questlist:imp` | Free | Batch A | 1 | `imp` | `wizard_mizgog` (Wizards' Tower top floor) | `COMPLETE-VERIFIED` | 48 | 0 |
| 10 | `2001-02-28` | **Prince Ali Rescue** | `questlist:prince` | Free | Batch A | 3 | `princequest` | `hassan` (Al Kharid Palace) | `COMPLETE-VERIFIED` | 155 | 0 |
| 11 | `2001-05-06` | **Doric's Quest** | `questlist:doric` | Free | Batch A | 1 | `doricquest` | `doric` (North of Falador) | `COMPLETE-VERIFIED` | 154 | 0 |
| 12 | `2001-05-06` | **Black Knights' Fortress** | `questlist:fortress` | Free | Batch A | 3 | `spy` | `sir_amik_varze` (White Knights' Castle in Falador) | `COMPLETE-VERIFIED` | 234 | 0 |
| 13 | `2001-05-06` | **Witch's Potion** | `questlist:hetty` | Free | Batch A | 1 | `hetty` | `hetty` (Rimmington) | `COMPLETE-VERIFIED` | 61 | 0 |
| 14 | `2001-06-08` | **The Knight's Sword** | `questlist:squire` | Free | Batch A | 1 | `squire` | `squire` (White Knights' Castle courtyard in Falador) | `COMPLETE-VERIFIED` | 305 | 0 |
| 15 | `2001-07-02` | **Goblin Diplomacy** | `questlist:gobdip` | Free | Batch A | 5 | `goblinquest` | `general_wartface` (Goblin Village) | `COMPLETE-VERIFIED` | 200 | 0 |
| 16 | `2001-07-23` | **Pirate's Treasure** | `questlist:hunt` | Free | Batch A | 2 | `hunt` | `redbeard_frank` (Port Sarim docks) | `COMPLETE-VERIFIED` | 428 | 0 |
| 17 | `2001-09-23` | **Dragon Slayer** | `questlist:dragon` | Free | Batch A | 2 | `dragonquest` | `guildmaster` (Champions' Guild south of Varrock) | `COMPLETE-VERIFIED` | 1016 | 0 |
| 18 | `2002-02-27` | **Druidic Ritual** | `questlist:druid` | Members | Batch B | 4 | `druidquest` | `kaqemeex` (Druids' Circle north of Taverley) | `COMPLETE-VERIFIED` | 55 | 0 |
| 19 | `2002-02-27` | **Lost City** | `questlist:zanaris` | Members | Batch B | 3 | `zanaris` | `warrior_adventurer` (Camp west of Lumbridge Swamp) | `COMPLETE-VERIFIED` | 248 | 0 |
| 20 | `2002-02-27` | **Witch's House** | `questlist:ball` | Members | Batch B | 4 | `ballquest` | `boy` (East of Taverley) | `COMPLETE-VERIFIED` | 343 | 0 |
| 21 | `2002-02-27` | **Merlin's Crystal** | `questlist:arthur` | Members | Batch B | 6 | `arthur` | `king_arthur` (Camelot Castle) | `COMPLETE-VERIFIED` | 517 | 0 |
| 22 | `2002-02-27` | **Heroes Quest** | `questlist:hero` | Members | Batch B | 1 | `heroquest` | `achietties` (Heroes' Guild north of Taverley) | `COMPLETE-VERIFIED` | 618 | 0 |
| 23 | `2002-04-04` | **Scorpion Catcher** | `questlist:scorpcatcher` | Members | Batch B | 1 | `scorpcatcher` | `thormac` (Sorcerer's Tower south of Seers' Village) | `COMPLETE-VERIFIED` | 170 | 0 |
| 24 | `2002-04-09` | **Family Crest** | `questlist:crest` | Members | Batch B | 1 | `crestquest` | `dimintheis` (South-east Varrock) | `COMPLETE-VERIFIED` | 865 | 0 |
| 25 | `2002-04-29` | **Tribal Totem** | `questlist:totem` | Members | Batch B | 1 | `totemquest` | `kangai_mau` (Brimhaven) | `COMPLETE-VERIFIED` | 231 | 0 |
| 26 | `2002-05-24` | **Fishing Contest** | `questlist:fishingcompo` | Members | Batch B | 1 | `fishingcompo` | `mountain_dwarf` (White Wolf Mountain tunnel entrances) | `COMPLETE-VERIFIED` | 285 | 0 |
| 27 | `2002-06-17` | **Monk's Friend** | `questlist:drunkmonk` | Members | Batch B | 1 | `drunkmonkquest` | `brother_omad` (Monastery south of Ardougne) | `COMPLETE-VERIFIED` | 142 | 0 |
| 28 | `2002-06-17` | **Temple of Ikov** | `questlist:ikov` | Members | Batch B | 1 | `ikov` | `lucien` (Flying Horse Inn in Ardougne) | `COMPLETE-VERIFIED` | 760 | 0 |
| 29 | `2002-06-17` | **Clock Tower** | `questlist:cog` | Members | Batch B | 1 | `cog_bits` | `brother_kojo` (Clock Tower south of Ardougne) | `COMPLETE-VERIFIED` | 363 | 0 |
| 30 | `2002-07-23` | **Holy Grail** | `questlist:grail` | Members | Batch B | 2 | `grail` | `king_arthur` (Camelot Castle) | `COMPLETE-VERIFIED` | 462 | 0 |
| 31 | `2002-07-23` | **Tree Gnome Village** | `questlist:tree` | Members | Batch B | 2 | `treequest` | `king_bolren` (Tree Gnome Village) | `COMPLETE-VERIFIED` | 346 | 0 |
| 32 | `2002-07-23` | **Fight Arena** | `questlist:arena` | Members | Batch B | 2 | `arenaquest` | `lady_servil` (South-west of Tree Gnome Village) | `COMPLETE-VERIFIED` | 1208 | 0 |
| 33 | `2002-07-23` | **Hazeel Cult** | `questlist:hazeelcult` | Members | Batch B | 1 | `hazeelcultquest` | `ceril_carnillean` (Carnillean Mansion in East Ardougne) | `COMPLETE-VERIFIED` | 984 | 0 |
| 34 | `2002-08-06` | **Sheep Herder** | `questlist:sheepherder` | Members | Batch B | 4 | `sheepherderquest` | `councillor_halgrive` (East Ardougne south of church) | `COMPLETE-VERIFIED` | 568 | 0 |
| 35 | `2002-08-27` | **Plague City** | `questlist:elena` | Members | Batch B | 1 | `elenaquest` | `edmond` (East Ardougne garden) | `COMPLETE-VERIFIED` | 867 | 3 |
| 36 | `2002-09-16` | **Sea Slug Quest** | `questlist:seaslug` | Members | Batch B | 1 | `seaslugquest` | `caroline` (Witchaven east of Ardougne) | `COMPLETE-VERIFIED` | 239 | 0 |
| 37 | `2002-10-03` | **Waterfall Quest** | `questlist:waterfall` | Members | Batch B | 1 | `waterfall_quest` | `almera` (Baxtorian Falls) | `COMPLETE-VERIFIED` | 891 | 0 |
| 38 | `2002-11-13` | **Biohazard** | `questlist:biohazard` | Members | Batch B | 3 | `biohazard` | `elena` (East Ardougne) | `COMPLETE-VERIFIED` | 755 | 0 |
| 39 | `2002-12-04` | **Jungle Potion** | `questlist:junglepotion` | Members | Batch B | 1 | `junglepotion` | `trufitus` (Tai Bwo Wannai on Karamja) | `COMPLETE-VERIFIED` | 190 | 0 |
| 40 | `2002-12-12` | **The Grand Tree** | `questlist:grandtree` | Members | Batch B | 5 | `grandtree` | `king_narnode_shareen` (Grand Tree in Tree Gnome Stronghold) | `COMPLETE-VERIFIED` | 1569 | 0 |
| 41 | `2003-03-10` | **Underground Pass** | `questlist:upass` | Members | Batch C | 5 | `upass` | `king_lathas` (East Ardougne Castle) | `COMPLETE-VERIFIED` | 2450 | 0 |
| 42 | `2003-03-17` | **Observatory Quest** | `questlist:itgronigen` | Members | Batch C | 2 | `itgronigen` | `observatory_professor` (Observatory reception north of Castle Wars) | `COMPLETE-VERIFIED` | 832 | 0 |
| 43 | `2003-03-27` | **Shilo Village** | `questlist:zombiequeen` | Members | Batch C | 2 | `zombiequeen` | `mosol_rei` (Outside Shilo Village on Karamja) | `COMPLETE-VERIFIED` | 2170 | 0 |
| 44 | `2003-04-28` | **The Tourist Trap** | `questlist:desertrescue` | Members | Batch C | 2 | `desertrescue` | `irena` (South of Shantay Pass) | `COMPLETE-VERIFIED` | 3113 | 1 |
| 45 | `2003-05-06` | **Watch Tower** | `questlist:itwatchtower` | Members | Batch C | 4 | `itwatchtower` | `watchtower_wizard` (Watchtower north of Yanille) | `COMPLETE-VERIFIED` | 2107 | 5 |
| 46 | `2003-05-27` | **Dwarf Cannon** | `questlist:mcannon` | Members | Batch C | 1 | `mcannon` | `captain_lawgof` (Dwarf base north-west of Fishing Guild) | `COMPLETE-VERIFIED` | 1348 | 0 |
| 47 | `2003-06-16` | **Murder Mystery** | `questlist:murder` | Members | Batch C | 3 | `murderquest` | `sinclair_guard` (Sinclair Mansion north of Camelot) | `COMPLETE-VERIFIED` | 1247 | 0 |
| 48 | `2003-07-09` | **Digsite Quest** | `questlist:itexam` | Members | Batch C | 2 | `itexamlevel / itdigsitemulti` | `examiner` (Exam Centre at the Digsite) | `COMPLETE-VERIFIED` | 2627 | 0 |
| 49 | `2003-07-30` | **Gertrude's Cat** | `questlist:fluffs` | Members | Batch C | 1 | `fluffs` | `gertrude` (West of Varrock) | `COMPLETE-VERIFIED` | 623 | 0 |
| 50 | `2003-08-20` | **Legends Quest** | `questlist:legends` | Members | Batch C | 4 | `legendsquest` | `radimus_erkle` (Legends' Guild north-east of Ardougne) | `COMPLETE-VERIFIED` | 5825 | 1 |
| 51 | `2004-03-29` | **Rune Mysteries Quest** | `questlist:runemysteries` | Free | Batch A | 1 | `runemysteries` | `duke_of_lumbridge` (Lumbridge Castle 1st floor) | `COMPLETE-VERIFIED` | 58 | 0 |
| 52 | `2004-05-25` | **Big Chompy Bird Hunting** | `questlist:chompybird` | Members | Batch C | 2 | `chompybird` | `rantz` (Feldip Hills) | `COMPLETE-VERIFIED` | 1914 | 0 |
| 53 | `2004-06-02` | **Elemental Workshop** | `questlist:elemental_workshop` | Members | Batch C | 1 | `elemental_workshop_bits` | `bookcase (Battered book)` (Seers' Village) | `COMPLETE-VERIFIED` | 490 | 0 |
| 54 | `2004-06-29` | **Priest in Peril** | `questlist:priestperil` | Members | Batch C | 1 | `priestperil` | `king_roald` (Varrock Palace) | `COMPLETE-VERIFIED` | 382 | 0 |
| 55 | `2004-06-29` | **Nature Spirit** | `questlist:druidspirit` | Members | Batch C | 2 | `druidspirit` | `drezel` (Paterdomus Temple) | `COMPLETE-VERIFIED` | 1371 | 0 |
| 56 | `2004-07-12` | **Death Plateau** | `questlist:death` | Members | Batch C | 1 | `death_equiproom` | `denulth` (Burthorpe Imperial Guard camp) | `COMPLETE-VERIFIED` | 1524 | 0 |
| 57 | `2004-07-12` | **Troll Stronghold** | `questlist:troll` | Members | Batch C | 1 | `troll_quest` | `denulth` (Burthorpe Imperial Guard camp) | `COMPLETE-VERIFIED` | 845 | 0 |
| 58 | `2004-09-14` | **Tai Bwo Wannai Trio** | `questlist:tbwt` | Members | Batch C | 2 | `tbwt_main` | `tbwt_timfraku` (Tai Bwo Wannai Village) | `COMPLETE-VERIFIED` | 881 | 0 |
| 59 | `2004-09-20` | **Eadgar's Ruse** | `questlist:eadgar` | Members | Batch C | 1 | `eadgar_quest` | `sanfew` (Taverley) | `COMPLETE-VERIFIED` | 554 | 0 |
| 60 | `2004-09-20` | **Regicide** | `questlist:regicide` | Members | Batch C | 3 | `regicide_quest` | `king_lathas` (East Ardougne Castle (after Royal Messenger summons)) | `COMPLETE-VERIFIED` | 1112 | 0 |
| 61 | `2004-10-13` | **Shades of Mort'ton** | `questlist:mortton` | Members | Batch C | 3 | `morttonquest` | `Diary of Herbi Flax` (Mort'ton) | `COMPLETE-VERIFIED` | 650 | 0 |
| 62 | `2004-11-02` | **The Fremennik Trials** | `questlist:viking` | Members | Batch C | 3 | `viking` | `viking_brundt_child` (Rellekka Longhall) | `COMPLETE-VERIFIED` | 790 | 0 |
| 63 | `2004-11-17` | **Horror from the Deep** | `questlist:horror` | Members | Batch C | 2 | `deephorror / horrorquest` | `larrissa` (Lighthouse north of Barbarian Outpost) | `COMPLETE-VERIFIED` | 358 | 0 |
| 64 | `2004-11-17` | **Throne of Miscellania** | `questlist:misc` | Members | Batch C | 1 | `misc_quest` | `misc_king_vargas` (Miscellania Castle) | `COMPLETE-VERIFIED` | 467 | 0 |
| 65 | `2004-12-06` | **Monkey Madness** | `questlist:mm` | Members | Batch C | 3 | `mm_main` | `king_narnode_shareen` (Grand Tree) | `COMPLETE-VERIFIED` | 715 | 0 |
| 66 | `2004-12-20` | **Haunted Mine** | `questlist:hauntedmine` | Members | Batch C | 2 | `hauntedmine` | `zealot` (Outside the Abandoned Mine in southern Morytania) | `COMPLETE-VERIFIED` | 545 | 0 |
| 67 | `2005-01-11` | **Troll Romance** | `questlist:troll_love` | Members | Batch D | 2 | `troll_love` | `ug` (Troll Stronghold) | `COMPLETE-VERIFIED` | 555 | 0 |
| 68 | `2005-01-17` | **In Search of the Myreque** | `questlist:routequest` | Members | Batch D | 2 | `routequest` | `vanstrom_klause` (Hair of the Dog tavern in Canifis) | `NOT STARTED` | 0 | 0 |
| 69 | `2005-01-24` | **Creature of Fenkenstrain** | `questlist:creatureoffenkenstrain` | Members | Batch D | 2 | `fenk_quest` | `canifis_signpost / dr_fenkenstrain` (Canifis signpost / Fenkenstrain's Castle) | `NOT STARTED` | 0 | 4 |
| 70 | `2005-02-01` | **Roving Elves** | `questlist:roving_elves` | Members | Batch D | 1 | `roving_elves_quest` | `islwyn` (Isafdar) | `COMPLETE-VERIFIED` | 248 | 2 |
| 71 | `2005-02-15` | **Ghosts Ahoy** | `questlist:ahoy` | Members | Batch D | 2 | `ahoy_varbits_1` | `velorina` (Port Phasmatys) | `NOT STARTED` | 0 | 17 |
| 72 | `2005-02-21` | **One Small Favour** | `questlist:onesmallfavour` | Members | Batch D | 2 | `onesmallfavour` | `yanni_salika` (Shilo Village) | `NOT STARTED` | 0 | 15 |
| 73 | `2005-02-28` | **Mountain Daughter** | `questlist:mdaughter` | Members | Batch D | 2 | `mdaughter_var` | `hamal_the_chieftain` (Mountain Camp east of Rellekka) | `NOT STARTED` | 0 | 13 |
| 74 | `2005-03-14` | **Between a Rock...** | `questlist:dwarfrock` | Members | Batch D | 2 | `dwarfrock_main` | `dondakan_the_dwarf` (Keldagrim south-east mine) | `NOT STARTED` | 0 | 10 |
| 75 | `2005-04-04` | **The Feud** | `questlist:feud` | Members | Batch D | 1 | `main_feud_var` | `feud_ali_m` (Al Kharid north of the palace) | `NOT STARTED` | 0 | 30 |
| 76 | `2005-04-11` | **The Golem** | `questlist:golem` | Members | Batch D | 1 | `golem_a` | `golem_golem` (Ruins of Uzer) | `COMPLETE-VERIFIED` | 627 | 0 |
| 77 | `2005-04-18` | **Desert Treasure** | `questlist:deserttreasure` | Members | Batch D | 3 | `deserttreasuremain` | `dt_archaeologist` (Bedabin Camp) | `NOT STARTED` | 0 | 2 |
| 78 | `2005-04-25` | **Icthlarin's Little Helper** | `questlist:ics_little` | Members | Batch D | 2 | `main_ics_var` | `ics_wanderer` (Outside Sophanem gates) | `NOT STARTED` | 0 | 16 |
| 79 | `2005-05-09` | **Tears of Guthix** | `questlist:tog` | Members | Batch D | 1 | `tog_minigame` | `juna` (Lumbridge Swamp Caves) | `NOT STARTED` | 0 | 0 |
| 80 | `2005-05-16` | **Zogre Flesh Eaters** | `questlist:zogre` | Members | Batch D | 1 | `zombie_ogre` | `grish` (South of Castle Wars (Jiggig)) | `NOT STARTED` | 0 | 9 |
| 81 | `2005-05-23` | **The Lost Tribe** | `questlist:lost_tribe` | Members | Batch D | 1 | `lost_tribe` | `mistag` (Lumbridge Castle cellar) | `NOT STARTED` | 0 | 5 |
| 82 | `2005-05-31` | **The Giant Dwarf** | `questlist:giantdwarf` | Members | Batch D | 2 | `giantdwarf_main` | `dwarf_boatman_rfd` (Keldagrim entrance) | `NOT STARTED` | 0 | 0 |
| 83 | `2005-06-13` | **Recruitment Drive** | `questlist:rd` | Members | Batch D | 1 | `recruitmentdrive` | `sir_amik_varze` (White Knights' Castle in Falador) | `STUB` | 0 | 8 |
| 84 | `2005-06-27` | **Mourning's Ends Part 1** | `questlist:mourning` | Members | Batch D | 2 | `mourning_quest` | `eluned` (Isafdar) | `NOT STARTED` | 0 | 15 |
| 85 | `2005-07-04` | **Forgettable Tale...** | `questlist:forget` | Members | Batch D | 2 | `forget_main_var` | `veldaban` (Keldagrim Palace) | `NOT STARTED` | 0 | 1 |
| 86 | `2005-07-18` | **Garden of Tranquillity** | `questlist:garden` | Members | Batch D | 2 | `garden_varp_1` | `queen_ellamaria` (Varrock Palace garden) | `NOT STARTED` | 0 | 3 |
| 87 | `2005-07-25` | **A Tail of Two Cats** | `questlist:twocats` | Members | Batch D | 2 | `twocats_varbit` | `unferth` (Burthorpe) | `NOT STARTED` | 0 | 17 |
| 88 | `2005-08-08` | **Wanted!** | `questlist:wanted` | Members | Batch D | 1 | `quest_wanted` | `sir_tiffy_cashien` (Falador Park) | `NOT STARTED` | 0 | 4 |
| 89 | `2005-08-16` | **Mourning's Ends Part 2** | `questlist:mourning2` | Members | Batch D | 2 | `mourning_quest_part2` | `arianwyn` (Lletya) | `STUB` | 0 | 0 |
| 90 | `2005-08-30` | **Rum Deal** | `questlist:deal` | Members | Batch D | 2 | `deal_quest` | `pirate_pete` (Port Phasmatys dock) | `NOT STARTED` | 0 | 26 |
| 91 | `2005-09-05` | **Shadow of the Storm** | `questlist:agrith` | Members | Batch D | 1 | `agrith_quest_varp` | `father_reen` (Outside Al Kharid gates) | `NOT STARTED` | 0 | 20 |
| 92 | `2005-09-12` | **Making History** | `questlist:makinghistory` | Members | Batch D | 3 | `makinghistory` | `jorral` (Outpost north-west of West Ardougne) | `NOT STARTED` | 0 | 5 |
| 93 | `2005-10-10` | **Rat Catchers** | `questlist:ratcatch` | Members | Batch D | 2 | `main_ratcatch_var` | `gertrude` (West of Varrock) | `NOT STARTED` | 0 | 21 |
| 94 | `2005-10-17` | **Spirits of the Elid** | `questlist:elid` | Members | Batch D | 2 | `elid_main` | `awusah_the_mayor` (Nardah) | `NOT STARTED` | 0 | 18 |
| 95 | `2005-10-31` | **Devious Minds** | `questlist:devious` | Members | Batch D | 1 | `devious_base` | `monk_devious` (Paterdomus Temple) | `NOT STARTED` | 0 | 1 |
| 96 | `2005-11-07` | **The Hand in the Sand** | `questlist:handsand` | Members | Batch D | 1 | `handsand` | `bert` (Yanille north-west) | `NOT STARTED` | 0 | 6 |
| 97 | `2005-11-15` | **Enakhra's Lament** | `questlist:enakh` | Members | Batch D | 2 | `enakh_quest_expositbits` | `lazim` (Quarry south of Bandit Camp) | `NOT STARTED` | 0 | 8 |
| 98 | `2005-12-05` | **Cabin Fever** | `questlist:fever` | Members | Batch D | 2 | `fever_quest` | `bill_teach` (The Green Ghost Inn in Port Phasmatys) | `STUB` | 0 | 43 |
| 99 | `2006-02-27` | **A Fairy Tale Pt. 1** | `questlist:fairy_farmers` | Members | Batch D | 2 | `fairytale_multi` | `martin_the_master_farmer` (Draynor Village) | `NOT STARTED` | 0 | 13 |
| 100 | `2006-03-15` | **Recipe for Disaster** | `questlist:hundred_main` | Members | Batch D | 10 | `100intro / 100council / hundred_dave / hundred_dwarf / 100_pirate_quest / 100_ogre / hundred_ilm_var_1` | `cook` (Lumbridge Castle kitchen) | `STUB` | 0 | 20 |
| 101 | `2006-03-30` | **In Aid of the Myreque** | `questlist:myreque_2` | Members | Batch D | 2 | `myreque_2_main_var` | `veliaf_hurtz` (Myreque Hideout in the Hollows) | `NOT STARTED` | 0 | 0 |
| 102 | `2006-04-10` | **A Soul's Bane** | `questlist:soulbane` | Members | Batch D | 1 | `soulbane` | `soulbane_launa` (Rift east of Varrock) | `NOT STARTED` | 0 | 2 |
| 103 | `2006-04-18` | **Rag and Bone Man** | `questlist:rag` | Members | Batch D | 1 | `rag_quest` | `rag_odd_old_man` (Limestone mine east of Varrock) | `NOT STARTED` | 0 | 0 |
| 104 | `2006-05-02` | **Swan Song** | `questlist:swansong` | Members | Batch D | 2 | `swansong_quest` | `herman_caranos` (Outside the Piscatoris Fishing Colony) | `NOT STARTED` | 0 | 0 |

## Post-377 Quests Excluded by Cutoff (Released After 2 May 2006)

| Quest Name | Release Date | Exclusion Evidence |
|---|---|---|
| Royal Trouble | `2006-05-15` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |
| Death to the Dorgeshuun | `2006-06-06` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |
| Fairytale II - Cure a Queen | `2006-07-11` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |
| Lunar Diplomacy | `2006-07-24` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |
| The Eyes of Glouphrie | `2006-07-31` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |
| Elemental Workshop II | `2006-09-18` | Released after 2 May 2006 (#377 cutoff); absent from 377 questlist.if |

## 377 Miniquests & Adjacent Quest Systems

| ID | Name | Release Date | Membership | Varp / Varbit | Directory |
|---|---|---|---|---|---|
| `tutorial` | Tutorial Island | `2002-09-24` | Free | `tutorial` | `tutorial` |
| `barcrawl` | Alfred Grimhand's Barcrawl | `2002-02-27` | Members | `barcrawl` | `quest_barcrawl` |
| `magearena` | Mage Arena | `2003-09-22` | Members | `magearena` | `minigame_mage_arena` |
| `abyssal` | Enter the Abyss | `2005-06-13` | Members | `abyssal_miniquest` | `miniquest_abyssal` |
| `curse_of_zaros` | Curse of Zaros (Ghostly Robes) | `2005-04-18` | Members | `deserttreasurevarbit` | `quest_deserttreasure` |
| `enchanted_key` | Enchanted Key Miniquest | `2005-09-12` | Members | `makinghistory` | `quest_makinghistory` |
| `rag_wishlist` | Rag and Bone Man Wish List | `2006-04-18` | Members | `rag_bone_2` | `quest_rag` |

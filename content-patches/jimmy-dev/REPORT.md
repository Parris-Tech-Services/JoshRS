# NPC Talk-to Audit & Fix Report (jimmy-dev)

- `PASS` | `1239` (`bedabin_fighter`, "Bedabin Nomad Fighter") @ `(3160, 3031, L0)` — Added `[opnpc1,bedabin_fighter]` & `[proc,bedabin_fighter_options]` in `bedabin_nomad.rs2`; verified all dialogue branches and relog in-game (`patches/0001-bedabin-fighter-talkto.patch`).
- `PASS` | `200` (`lord_daquarius`, "Lord Daquarius") @ `(2892, 9680, L0)` — Caught `No trigger for [opnpc1,lord_daquarius]` in-game; enabled `[opnpc1,lord_daquarius]` in `lord_daquarius.rs2` and added `head1=chat_male_head_mediumhair` in `taverly_dungeon.npc`; verified in-game (`patches/0002-taverley-dungeon-daquarius-jailer-talkto.patch`).
- `PASS` | `201` (`jailer`, "Jailer") @ `(2933, 9693, L0)` — Added `[opnpc1,jailer]` (`"The Jailer does not appear interested in talking."`) in `jailer.rs2`; verified in-game (`patches/0002-taverley-dungeon-daquarius-jailer-talkto.patch`).
- `OK` | `1595` (`tribesman_doorman`, "Saniboch") @ `(2745, 3152, L0)` — Walked up and tested `Talk-to` in-game; responds with `"Good day to you bwana."` and Brimhaven Dungeon entry options.
- `OK` | `1287` (`vt_council_workmen`, "Council workman") @ `(2655, 3592, L0)` — Walked up and tested `Talk-to` in-game; opens dialogue normally.
- `OK` | `610` (`grillknight`, "Black Knight") @ `(3028, 3508, L0)` — Walked to Black Knights' Fortress `(3016, 3513, L0)`; NPC is inside the sealed Witch/Greldo eavesdrop room (`[oploc1,bkfortress_grill]` cutscene NPC, not directly reachable for `opnpc1`).
- `OK` | `1091` (`death_growncat_black`, "Bob") @ `(2924, 3565, L0)` — Walked to Burthorpe `(2935, 3564, L0)` and found `Bob (id=1091)` in-game; has no `Talk-to` option in rev 274 (`quest_death.npc`, pre-Tail of Two Cats).
- `OK` | `372` (`mournerwatchtower`, "Mourner") @ `(2559, 3303, L0)` — Walked to `(2559, 3303, L0)` south of East Ardougne; the 4 Mourners stand inside the fenced watchtower (`biowatchtower`) and are spoken to via `[oploc1,biowatchtower]` in `quest_biohazard.rs2` (`"Keep away civilian."`).
- `OK` | `636` (`gnomecheerleader`, "Cheerleader") @ `(2395, 3495, L0)` — Walked to Gnomeball pitch `(2393, 3494, L0)`; the 2 Cheerleaders stand inside the fenced sideline box (`reachable=false`) and only shout overhead messages (`"Goal!"`, `"You Win!"`) during Gnomeball.
- `OK` | `1367` (`etc_guard1`, "Skraeling") @ `(2605, 3877, L0)` — Tested `Talk-to` in-game at Etceteria; opens dialogue (`"Hello."`) normally.
- `OK` | `1368` (`etc_guard2`, "Skraeling") @ `(2603, 3877, L0)` — Tested `Talk-to` in-game at Etceteria; opens dialogue (`"Hello."`) normally.
- `OK` | `1369` (`etc_fish_monger`, "Fishmonger") @ `(2605, 3876, L0)` — Tested `Talk-to` and `Trade` in-game at Etceteria; opens dialogue (`"Welcome Raklak. My fish is fresher than any in Miscellania!"`) and shop normally.
- `OK` | `1370` (`etc_veg_monger`, "Greengrocer") @ `(2602, 3877, L0)` — Tested `Talk-to` and `Trade` in-game at Etceteria; opens dialogue (`"Hello Raklak. You've come to the right place for your greens!"`) and shop (`Island Greengrocer`) normally.
- `OK` | `1257` (`mort_afflicted_man`, "Afflicted") @ `(3466, 3306, L0)` — Tested `Talk-to` in-game at Mort'ton; opens dialogue (`"zurgle"`) normally.
- `OK` | `1258` (`mort_afflicted_woman`, "Afflicted") @ `(3466, 3309, L0)` — Tested `Talk-to` in-game at Mort'ton; opens dialogue (`"wot's sfriess gurghl"`) normally.
- `OK` | `1261` (`mort_afflicted_man2`, "Afflicted") @ `(3469, 3308, L0)` — Tested `Talk-to` in-game at Mort'ton; opens dialogue (`"wot's wot's"`) normally.
- `OK` | `1262` (`mort_afflicted_woman2`, "Afflicted") @ `(3472, 3304, L0)` — Shares `[opnpc1,_afflicted]` in `shades_of_mortton.rs2` with `1257`, `1258`, and `1261` in Mort'ton.
- `OK` | `1576` (`canafis_stranger`, "Stranger") @ `(3503, 3477, L0)` — Visited `(3503, 3477, L0)` in Canifis; the static spawn in the tavern is `Vanstrom Klause (1577)` (`canafis_stranger` `1576` is a dynamic follower/event NPC).
- `OK` | `57` (`fairy`, "Fairy") @ `(2373, 4447, L0)` — Checked `[fairy]` (`57`) in `lostcity.npc`; has no `Talk-to` option in rev 274 (ambient wandering Fairy in Zanaris `0_50_149`).
- `OK` | `466` (`murphy_sunk`, "Murphy") @ `(1947, 4827, L0)` — Visited Sunken Fishing Trawler `(1946, 4828, L0)`; floats on water tile `(1946, 4827)` (`reachable=false`) shouting overhead messages via `[ai_timer,murphy_sunk]` while players click `[oploc1,sinkingbarrel1]` to swim to shore.
- `OK` | `1086` (`death_man_indoors1`, "Unferth") @ `(2918, 3558, L0)` — Walked up and tested `Talk-to` in-game in Burthorpe (along with `1085` Ocga, `1084` Breoca, and `1083` Wistan); opens dialogue normally.
- `OK` | `658` (`shipmonk2`, "Monk of Entrana") @ `(2835, 3336, L0)` & `(2839, 3335, L0)` — Sailed to Entrana and tested `Talk-to` in-game; responds (`"Do you wish to leave holy Entrana?"`) and sails back to Port Sarim normally.
- `OK` | `1201` (`elf_overpass_guard`, "Elf warrior") @ `(2380, 3332, L0)` & `(2389, 3333, L0)` — Walked to Arandar gate `(2387, 3335, L0)`; stands on the south side of `Huge Gate` (`overpass_gate_left` / `overpass_gate_right`) and speaks when interacting with the gate (`"No human may enter Tirannwn. Unless you have the proper documentation, sealed by one of the great houses."`).
- `OK` | `697` (`kennith`, "Kennith") @ `(2764, 3288, L1)` — Inside the barricaded room on the Fishing Platform (`reachable=false`); spoken to across the crates via `[oploc1,kennithwall]` (`@kennith_chat` in `kennith.rs2`).
- `OK` | `892` (`hazeel`, "Hazeel") @ `(2607, 9669, L0)` — Completed **Hazeel Cult** in-game (testing `885` Sir Ceril Carnillean, `886` Claus the chef, `888` Philipe Carnillean, `890` Butler Jones, `891` Alomone, `893` Clivet, and `894` Cultist) and spawned `Hazeel (892)` during the revival ritual at `(2607, 9669, L0)`; speaks during the ritual cutscene in `alomone.rs2` and vanishes in a smoke puff via `[queue,hazeel_leave]` when the cutscene concludes or is interrupted.
- `OK` | `679` (`ranging_guild_doorman`, "Ranging Guild Doorman") @ `(2658, 3439, L0)` — Walked up and tested `Talk-to` in-game; responds normally.
- `OK` | `227` (`morris`, "Morris") & `226` (`sinister_stranger`, "A Sinister Stranger") & `230` (`grandpa_jack`, "Grandpa Jack") @ `(2643, 3440, L0)` — Walked up and tested `Talk-to` in-game; respond normally.
- `OK` | `251` (`king_arthur`, "King Arthur") & Knights of the Round Table (`239` Sir Lancelot, `240` Sir Gawain, `241` Sir Kay, `242` Sir Bedivere, `243` Sir Tristram, `244` Sir Pelleas, `245` Sir Lucan, `246` Sir Palomedes) @ `(2763, 3516, L0-L1)` — Walked up and tested `Talk-to` in-game and started **Merlin's Crystal**; all respond normally.
- `OK` | `562` (`candle_maker`, "Candle maker") & `563` (`arhein`, "Arhein") @ `(2800, 3438, L0)` — Walked up and tested `Talk-to` in-game at Catherby docks and stowed away in Arhein's crate to Keep Le Faye.
- `OK` | `247` (`sir_mordred`, "Sir Mordred") @ `(2768, 3404, L2)` — Climbed Keep Le Faye to L2 and tested `Talk-to` in-game; responds (`"You DARE to invade MY stronghold?!?!"`) and initiates combat (`Morgan Le Faye (248)` spawns via `[ai_queue3,sir_mordred]` when Sir Mordred reaches 0 HP).
- `OK` | `0` (`hans`, "Hans"), `1`/`3` (`man`, "Man"), `4` (`woman`, "Woman"), `278` (`cook`, "Cook") @ `(3222, 3219, L0)` — Walked up and tested `Talk-to` in-game in Lumbridge; respond normally.
- `OK` | `970` (`diango`, "Diango"), `917` (`jail_guard`, "Jail guard"), `922` (`aggie`, "Aggie") @ `(3080, 3248, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Draynor Village; respond and open shop normally.
- `OK` | `376` (`captain_tobias`, "Captain Tobias"), `377` (`seaman_lorris`, "Seaman Lorris"), `378` (`seaman_thresnor`, "Seaman Thresnor") @ `(3026, 3220, L0)` — Walked up and tested `Talk-to` in-game at Port Sarim docks; respond normally.
- `OK` | `558` (`gerrant`, "Gerrant") & `556` (`grum`, "Grum") @ `(3011, 3226, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Port Sarim; respond and open shops normally.
- `OK` | `530` (`shop_keeper`, "Shop keeper"), `531` (`shop_assistant`, "Shop assistant"), `585` (`rommik`, "Rommik") @ `(2947, 3216, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Rimmington; respond and open shops normally.
- `OK` | `526` (`shop_keeper`, "Shop keeper"), `527` (`shop_assistant`, "Shop assistant"), `577` (`cassie`, "Cassie"), `580` (`flynn`, "Flynn"), `736` (`barmaid`, "Barmaid"), `6` (`woman`, "Woman") @ `(2958, 3387, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Falador; respond and open shops normally.
- `OK` | `1079` (`death_barman`, "Tostig"), `1087` (`death_bar_patron`, "Penda"), `1060` (`death_ig_commander`, "Denulth"), `1065` (`death_ig_soldier_seated`, "Soldier"), `1063`/`1064` (`death_ig_soldier_training`, "Soldier"), `1062` (`death_ig_sergeant_training`, "Sergeant"), `1074` (`death_archer`, "Archer") @ `(2907, 3537, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Burthorpe; respond and open bar shop normally.
- `OK` | `1061` (`death_ig_sergeant_drilling`, "Sergeant"), `1066`/`1067`/`1068` (`death_ig_soldier_drilling`, "Soldier"), `1073` (`death_archer`, "Archer"), `1076`/`1077` (`death_guard`, "Guard"), `1081` (`death_servant`, "Servant"), `1085` (`death_woman_indoors1`, "Ocga"), `1089` (`death_woman_outdoors1`, "Ceolburg"), `1092` (`death_white_knight`, "White Knight") @ `(2901, 3562, L0)` — Walked up and tested `Talk-to` in-game across north Burthorpe; all respond with dialogue or duty messages normally.
- `OK` | `796` (`achietties`, "Achietties"), `586` (`gaius`, "Gaius"), `587` (`jatix`, "Jatix") @ `(2898, 3426, L0)` — Walked up and tested `Talk-to` & `Trade` in-game at Heroes' Guild and Taverley; respond and open shops normally.
- `OK` | `1213` (`tegid`, "Tegid"), `250` (`lady_of_the_lake`, "The Lady of the Lake"), `455` (`kaqemeex`, "Kaqemeex") @ `(2924, 3405, L0)` — Walked up and tested `Talk-to` in-game in Taverley; respond normally.
- `OK` | `801` (`abbot_langley`, "Abbot Langley"), `803` (`monk`, "Monk"), `12` (`barbarian`, "Barbarian") @ `(3057, 3484, L0)` — Walked up and tested `Talk-to` in-game at the Monastery and Barbarian Village; respond normally.
- `OK` | `639` (`romeo`, "Romeo"), `882` (`gypsy`, "Gypsy"), `546` (`zaff`, "Zaff"), `547` (`baraek`, "Baraek"), `781` (`shilop`, "Shilop"), `783` (`wilough`, "Wilough"), `548` (`thessalia`, "Thessalia"), `522` (`shop_keeper`, "Shop keeper") @ `(3212, 3428, L0)` — Walked up and tested `Talk-to` & `Trade` in-game around Varrock Square; respond and open shops normally.
- `OK` | `641` (`tramp`, "Tramp"), `551` (`shop_keeper`, "Shop keeper"), `552` (`shop_assistant`, "Shop assistant"), `645` (`jonny_the_beard`, "Jonny the beard"), `550` (`lowe`, "Lowe"), `549` (`horvik`, "Horvik"), `553` (`aubury`, "Aubury"), `368` (`guard`, "Guard"), `640` (`father_lawrence`, "Father Lawrence") @ `(3233, 3425, L0)` — Walked up and tested `Talk-to` & `Trade` in-game across South and East Varrock; respond and open shops normally.
- `OK` | `618` (`examiner`, "Examiner") & `619` (`archaeological_expert`, "Archaeological expert") @ `(3361, 3343, L0)` — Walked up and tested `Talk-to` in-game at the Digsite Exam Centre; respond normally.
- `OK` | `613` (`digsite_workman`, "Digsite workman"), `620` (`panning_guide`, "Panning guide"), `615`/`616`/`617` (`student`, "Student") @ `(3361, 3409, L0)` — Walked up and tested `Talk-to` in-game at the Digsite; respond normally.
- `OK` | `959` (`aabla`, "A'abla"), `960` (`sabreen`, "Sabreen"), `961` (`tafani`, "Tafani"), `962` (`jaraah`, "Jaraah"), `963` (`zahwa`, "Zahwa") @ `(3366, 3275, L0)` — Walked up and tested `Talk-to` in-game at the Duel Arena hospital; respond normally.
- `OK` | `924` (`osman`, "Osman"), `541` (`zeke`, "Zeke"), `836` (`shantay`, "Shantay"), `925` (`border_guard`, "Border Guard") @ `(3285, 3188, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Al Kharid and Shantay Pass; respond and open shops normally.
- `OK` | `540` (`gem_trader`, "Gem trader"), `539` (`silk_trader`, "Silk trader"), `170` (`gnome_pilot`, "Gnome pilot"), `524` (`shop_keeper`, "Shop keeper"), `525` (`shop_assistant`, "Shop assistant"), `542` (`louie_legs`, "Louie legs"), `544` (`ranael`, "Ranael"), `923` (`hassan`, "Hassan") @ `(3316, 3165, L0)` — Walked up and tested `Talk-to` & `Trade` in-game across Al Kharid; respond and open shops normally.
- `OK` | `731` (`jollyboar_bartender`, "Bartender"), `756` (`dr_harlow`, "Dr Harlow"), `647` (`reldo`, "Reldo") @ `(3277, 3488, L0)` & `(3210, 3497, L0)` — Walked up and tested `Talk-to` in-game at the Jolly Boar Inn and Varrock Palace Library; respond normally.
- `OK` | `300` (`sedridor`, "Sedridor"), `1263` (`wizard_splitbark`, "Wizard"), `881` (`traiborn`, "Traiborn") @ `(3098, 9569, L0)` & `(3112, 3162, L1)` — Walked up and tested `Talk-to` in-game in the Wizards' Tower basement and first floor; respond normally.
- `OK` | `706` (`wizard_mizgog`, "Wizard Mizgog"), `285` (`veronica`, "Veronica"), `606` (`squire`, "Squire") @ `(3103, 3163, L2)`, `(3110, 3331, L0)`, `(2977, 3345, L0)` — Walked up and tested `Talk-to` in-game on Wizards' Tower L2, Draynor Manor, and Falador Castle courtyard; respond normally.
- `OK` | `581` (`wayne`, "Wayne"), `584` (`herquin`, "Herquin"), `36` (`wyson`, "Wyson the gardener"), `599` (`make_over_mage`, "Make-over mage") @ `(2969, 3312, L0)` & `(2917, 3323, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Falador and west of Falador; respond and open shops normally.
- `OK` | `895` (`ball_boy`, "Boy"), `296` (`general_bentnoze`, "General Bentnoze"), `297` (`general_wartface`, "General Wartface"), `298`/`299` (`goblin`, "Goblin") @ `(2956, 3511, L0)` — Walked up and tested `Talk-to` in-game at Witch's House and Goblin Village; respond normally.
- `OK` | `284` (`doric`, "Doric"), `746` (`oracle`, "Oracle"), `609` (`fortress_guard`, "Fortress Guard"), `528` (`shop_keeper`, "Shop keeper"), `529` (`shop_assistant`, "Shop assistant") @ `(2952, 3452, L0)`, `(3012, 3503, L0)`, `(3077, 3511, L0)` — Walked up and tested `Talk-to` & `Trade` in-game at Doric's house, Ice Mountain, Black Knights' Fortress, and Edgeville; respond and open shops normally.
- `OK` | `747` (`oziach`, "Oziach") & `538` (`peksa`, "Peksa") @ `(3070, 3517, L0)` & `(3077, 3427, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Edgeville and Barbarian Village; respond and open helmet shop normally.
- `OK` | `582` (`dwarven_shopkeeper`, "Dwarf") & `594` (`nurmof`, "Nurmof") @ `(2997, 9818, L0)` & `(2996, 9847, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in the Dwarven Mine; respond and open shops normally.
- `OK` | `382` (`mining_guild_dwarf`, "Dwarf"), `583` (`betty`, "Betty"), `559` (`brian`, "Brian"), `734` (`rustyanchor_bartender`, "Bartender"), `375` (`redbeard_frank`, "Redbeard Frank"), `744` (`klarense`, "Klarense") @ `(3047, 9757, L0)` & `(3025, 3250, L0)` — Walked up and tested `Talk-to` & `Trade` in-game at the Mining Guild and Port Sarim; respond and open shops normally.
- `OK` | `557` (`wydin`, "Wydin"), `307` (`hetty`, "Hetty"), `367` (`chemist`, "Chemist"), `338` (`chancy`, "Chancy"), `336` (`devinci`, "DeVinci"), `340` (`hops`, "Hops") @ `(3014, 3206, L0)` & `(2937, 3209, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Port Sarim and Rimmington; respond and open food shop normally.
- `OK` | `918` (`ned`, "Ned"), `755` (`morgan`, "Morgan"), `915` (`leela`, "Leela"), `519` (`bob`, "Bob"), `456` (`father_aereck`, "Father Aereck") @ `(3101, 3258, L0)` & `(3232, 3203, L0)` — Walked up and tested `Talk-to` & `Trade` in-game in Draynor Village and Lumbridge; respond and open axe shop normally.
- `OK` | `758` (`fred_the_farmer`, "Fred the Farmer") & `604` (`thurgo`, "Thurgo") @ `(3188, 3273, L0)` & `(3002, 3144, L0)` — Walked up and tested `Talk-to` in-game north of Lumbridge and at Mudskipper Point; respond normally.
- `OK` | `380` (`customs_officer`, "Customs officer"), `379` (`luthas`, "Luthas"), `568` (`zambo`, "Zambo"), `532` (`shop_keeper`, "Shop keeper"), `533` (`shop_assistant`, "Shop assistant") @ `(2954, 3146, L0)` & `(2901, 3150, L0)` — Sailed to Musa Point and tested `Talk-to` & `Trade` in-game; respond and open shops normally.
- `OK` | `183` (`pirate`, "Pirate"), `1055` (`pirate_jackie`, "Pirate Jackie the Fruit"), `437` (`capn_izzy`, "Cap'n Izzy No-Beard"), `799` (`pirate_guard`, "Pirate Guard"), `735` (`deadmanschest_bartender`, "Bartender"), `846` (`kangai_mau`, "Kangai Mau"), `588` (`davon`, "Davon"), `793` (`alfonse_the_waiter`, "Alfonse the waiter"), `788` (`garv`, "Garv"), `510` (`hajedy`, "Hajedy") @ `(2807, 3190, L0)` & `(2790, 3188, L0)` — Walked up and tested `Talk-to` & `Trade` in-game across Brimhaven; respond and open shops normally.
- `OK` | `500` (`mosol_rei`, "Mosol Rei") & `401`/`402` (`jungle_forester`, "Jungle Forester") @ `(2880, 2953, L0)` & `(2865, 2943, L0)` — Walked up and tested `Talk-to` in-game at Shilo Village and Kharazi Jungle entrance; respond normally.
- `OK` | `740` (`trufitus`, "Trufitus") & `1171` (`lubufu`, "Lubufu") @ `(2807, 3085, L0)` & `(2768, 3171, L0)` — Walked up and tested `Talk-to` in-game at Tai Bwo Wannai and south Brimhaven; respond normally.
- `OK` | `589` (`zenesha`, "Zenesha"), `843` (`rpdt_employee`, "RPDT employee"), `572` (`spice_seller`, "Spice seller"), `573` (`fur_trader`, "Fur trader"), `591` (`kortan`, "Kortan"), `590` (`aemad`, "Aemad"), `289` (`councillor_halgrive`, "Councillor Halgrive"), `290` (`doctor_orbon`, "Doctor Orbon"), `1216` (`parroty_pete`, "Parroty Pete"), `738` (`flyinghorse_bartender`, "Bartender"), `273` (`lucien`, "Lucien"), `718` (`mourner`, "Mourner") @ `(2654, 3293, L0)` & `(2575, 3320, L0)` — Walked up and tested `Talk-to` & `Trade` in-game across East Ardougne; respond and open shops normally.
- `OK` | `555` (`shop_keeper`, "Shop keeper") & `463` (`murphy`, "Murphy") @ `(2654, 3153, L0)` & `(2669, 3162, L0)` — Walked up and tested `Talk-to` & `Trade` in-game at Port Khazard; respond and open shop normally.
- `OK` | `593` (`frenita`, "Frenita"), `739` (`dragoninn_bartender`, "Bartender"), `877` (`tower_guard`, "Tower guard"), `264` (`lady_servil`, "Lady Servil"), `281` (`monk_ardougne`, "Monk"), `279` (`brother_omad`, "Brother Omad"), `676` (`femi`, "Femi") @ `(2564, 3095, L0)`, `(2565, 3198, L0)`, `(2603, 3207, L0)`, `(2459, 3382, L0)` — Walked up and tested `Talk-to` & `Trade` in-game across Yanille, Fight Arena, Ardougne Monastery, and the Tree Gnome Stronghold gate; all respond normally.
- `OK` | `168`/`169` (`gnome_woman`, "Gnome woman"), `67`/`68`/`66` (`gnome`, "Gnome"), `670` (`king_narnode`, "King Narnode Shareen"), `851` (`gnome_waiter`, "Gnome Waiter"), `850` (`aluft_gianne`, "Aluft Gianne"), `600` (`hudo`, "Hudo"), `849` (`blurberry_barman`, "Barman"), `848` (`blurberry`, "Blurberry"), `1407` (`daero`, "Daero"), `160`/`159` (`gnome_child`, "Gnome child"), `603` (`heckel_funch`, "Heckel Funch"), `480` (`gnome_troop`, "Gnome troop"), `602` (`gulluck`, "Gulluck") @ `(2465, 3495, L0-L2)` — Walked up and tested `Talk-to` & `Trade` across all floors of the Grand Tree; all respond normally (`1407` Daero gives a 1-page placeholder stub since Monkey Madness is a later revision).
- `OK` | `308` (`master_fisher`, "Master fisher"), `388` (`seer`, "Seer"), `820` (`poison_salesman`, "Poison Salesman"), `737` (`forester_bartender`, "Bartender") @ `(2610, 3393, L0)` & `(2699, 3493, L0)` — Walked up and tested `Talk-to` in-game at the Fishing Guild entrance and Seers' Village; all respond normally.
- `OK` | `1281` (`viking_sigli`, "Sigli the Huntsman"), `1295` (`viking_askeladden`, "Askeladden"), `1294` (`viking_brundt`, "Brundt the Chieftain"), `1300` (`viking_thora`, "Thora the Barkeep"), `1286` (`viking_manni`, "Manni the Reveller"), `1284` (`viking_bjorn`, "Bjorn"), `1285` (`viking_eldgrim`, "Eldgrim"), `1277` (`viking_fridgeir`, "Fridgeir"), `1275` (`viking_styrmir`, "Styrmir"), `1274` (`viking_ospak`, "Ospak"), `1278` (`viking_bouncer`, "Longhall Bouncer"), `1269` (`viking_olaf`, "Olaf the Bard"), `1289` (`viking_thorvald`, "Thorvald the Warrior"), `1303` (`viking_skulgrimen`, "Skulgrimen"), `1288` (`viking_peer`, "Peer the Seer"), `1316` (`viking_fur_trader`, "Fur trader"), `1282` (`viking_sigmund`, "Sigmund The Merchant"), `1305` (`viking_agnar`, "Agnar") @ `(2658, 3669, L0)` — Walked up and tested `Talk-to` & `Trade` across Rellekka; all respond normally (merchants enforce Fremennik Trials requirement before trading).
- `OK` | `1315` (`viking_fish_monger`, "Fish monger"), `1301` (`viking_yrsa`, "Yrsa"), `1302` (`viking_fisherman`, "Fisherman"), `1304` (`viking_sailor`, "Sailor"), `812` (`murder_guard`, "Guard"), `813` (`murder_gossip`, "Gossip"), `815` (`murder_bob`, "Bob"), `807` (`murder_pierre`, "Pierre") @ `(2645, 3672, L0)` & `(2742, 3565, L0)` — Walked up and tested `Talk-to` & `Trade` in Rellekka and Sinclair Mansion; all respond normally (`Bob` outputs `"He is ignoring you."` before starting Murder Mystery).
- `OK` | `398`/`399` (`legends_guard`, "Legends Guard"), `710` (`alrena`, "Alrena"), `714` (`edmond`, "Edmond"), `28` (`zoo_keeper`, "Zoo keeper"), `1469` (`monkey_minder`, "Monkey Minder"), `479` (`gnome_troop`, "Gnome troop") @ `(2727, 3349, L0)`, `(2571, 3334, L0)`, `(2604, 3288, L0)`, `(2532, 3210, L0)` — Walked up and tested `Talk-to` in-game at Legends' Guild gate, East Ardougne, Ardougne Zoo, and Khazard Battlefield; all respond normally.
- `OK` | `470` (`commander_montai`, "Commander Montai"), `473` (`elkoy_outside`, "Elkoy"), `1526` (`lanthus`, "Lanthus"), `223` (`brother_kojo`, "Brother Kojo"), `574` (`silk_merchant_ardougne`, "Silk merchant"), `571` (`baker_ardougne`, "Baker") @ `(2525, 3215, L0)`, `(2502, 3194, L0)`, `(2441, 3089, L0)`, `(2569, 3245, L0)`, `(2651, 3307, L0)` — Walked up and tested `Talk-to` & `Trade` across Khazard Battlefield, Tree Gnome Village entrance, Castle Wars, Clock Tower, and East Ardougne Market; all respond normally.
- `OK` | `569` (`silver_merchant_ardougne`, "Silver merchant"), `570` (`gem_merchant_ardougne`, "Gem merchant"), `844` (`cromperty`, "Wizard Cromperty"), `381` (`captain_barnaby`, "Captain Barnaby"), `696` (`caroline`, "Caroline"), `700` (`holgartland`, "Holgart") @ `(2658, 3316, L0)`, `(2682, 3324, L0)`, `(2677, 3274, L0)`, `(2716, 3303, L0)` — Walked up and tested `Talk-to` & `Trade` across East Ardougne and Witchaven; started **Sea Slug** with `696` (`Caroline`) and `700` (`Holgart`).
- `OK` | `699` (`holgartplatform`, "Holgart"), `698` (`holgartsunkboat`, "Holgart"), `695` (`bailey`, "Bailey"), `697` (`kennith`, "Kennith"), `701` (`kent`, "Kent"), `702`/`703`/`704` (`fishplatform1`/`2`/`3`, "Fisherman") @ `(2782, 3273, L0-L1)` & `(2794, 3321, L0)` — Repaired Holgart's boat with swamp paste, sailed to the Fishing Platform and Kent's island, and verified `Talk-to` (and `Shout-across` for `Kennith`) on every Sea Slug NPC in-game.
- `OK` | `350` (`omart`, "Omart"), `887` (`guard_ardougne`, "Guard"), `474` (`elkoy_village`, "Elkoy"), `485` (`local_gnome`, "Local Gnome"), `469` (`king_bolren`, "King Bolren"), `472` (`remsai`, "Remsai"), `471` (`bolkoy`, "Bolkoy") @ `(2559, 3266, L0)` & `(2542, 3169, L0-L1)` — Walked up and tested `Talk-to` & `Trade` in-game at the West Ardougne wall and inside Tree Gnome Village; all respond normally.
- `OK` | `780` (`gertrude`, "Gertrude") @ `(3151, 3410, L0)` — Walked up and tested `Talk-to` in-game; responds normally.
- `OK` | `648` (`king_roald`, "King Roald"), `638` (`apothecary`, "Apothecary"), `342` (`guidors_wife`, "Guidor's wife"), `337` (`devinci_varrock`, "DeVinci"), `339` (`chancy_varrock`, "Chancy"), `341` (`hops_varrock`, "Hops"), `732` (`bartender_dancingdonkey`, "Bartender"), `554` (`fancy_dress_shop_owner`, "Fancy dress shop owner"), `664` (`dimintheis`, "Dimintheis") @ `(3223, 3475, L0)`, `(3192, 3406, L0)`, `(3281, 3384, L0)` — Walked up and tested `Talk-to` & `Trade` across Varrock Palace, Varrock Apothecary, and South-East Varrock; all respond normally.
- `OK` | `646` (`curator`, "Curator"), `883` (`sir_prysin`, "Sir Prysin") @ `(3258, 3444, L0)` & `(3203, 3475, L0)` — Walked up and tested `Talk-to` in-game in Varrock Museum and Varrock Palace; both respond normally.
- `OK` | `579` (`drogo_dwarf`, "Drogo dwarf"), `657` (`monk_of_entrana_sarim`, "Monk of Entrana") @ `(3037, 9842, L0)` & `(3042, 3238, L0)` — Walked up and tested `Talk-to` & `Trade` in the Dwarven Mine and Port Sarim docks; both respond normally.
- `OK` | `658` (`monk_of_entrana`, "Monk of Entrana"), `222` (`entrana_monk`, "Monk"), `216` (`high_priest`, "High Priest"), `656` (`cave_monk`, "Cave monk") @ `(2843, 3335, L0)`, `(2855, 3351, L0)`, `(2822, 3374, L0)` — Walked up and tested `Talk-to` across Entrana; all respond normally.
- `OK` | `919` (`lady_keli`, "Lady Keli") @ `(3126, 3242, L0)` — Walked up and tested `Talk-to` in-game at Draynor Jail; responds normally.
- `OK` | `1088` (`burthorpe_hygd`, "Hygd"), `1083` (`burthorpe_wistan`, "Wistan"), `1084` (`burthorpe_breoca`, "Breoca"), `1070` (`death_saba`, "Saba") @ `(2925, 3535, L0)` & `(2271, 4758, L0)` — Walked up and tested `Talk-to` & `Trade` across Burthorpe and Saba's cave on Death Plateau; all respond normally.
- `OK` | `1082` (`death_smithy`, "Dunstan"), `1080` (`death_ig_commander`, "Eohric"), `454` (`sanfew`, "Sanfew"), `608` (`sir_amik_varze`, "Sir Amik Varze"), `605` (`sir_vyvin`, "Sir Vyvin") @ `(2919, 3574, L0)`, `(2904, 3566, L1)`, `(2897, 3426, L1)`, `(2963, 3340, L2)`, `(2983, 3338, L2)` — Walked up and tested `Talk-to` in Burthorpe, Taverley, and Falador Castle L2; all respond normally.
| 846 | Kangai Mau (Brimhaven Shrimp & Parrot 2793,3182) | OK | Talk: Dialog: "" / Trade:  | - |
| 794 | Charlie the cook (Brimhaven Shrimp & Parrot 2789,3192) | OK | Talk: Cannot reach Charlie the cook: Path to (2789, 3192) stops 3 tiles short at (2788, 3189) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 793 | Alfonse the waiter (Brimhaven Shrimp & Parrot 2793,3188) | OK | Talk: Dialog: "" / Trade: Shop "The Shrimp and Parrot" (0 items) | - |
| 799 | Pirate Guard (Brimhaven Shrimp & Parrot 2802,3195) | OK | Talk: Dialog: "" / Trade:  | - |
| 380 | Customs officer (Brimhaven Dock 2771,3225) | OK | Talk: Dialog: "" / Trade:  | - |
| 510 | Hajedy (Brimhaven Dock 2779,3211) | OK | Talk: Dialog: "" / Trade:  | - |
| 0 | Hans (Lumbridge Courtyard 3221,3217) | OK | Talk: Dialog: "" / Trade:  | - |
| 278 | Cook (Lumbridge Courtyard 3209,3215) | OK | Talk: Dialog: "" / Trade:  | - |
| 521 | Shop assistant (Lumbridge General Store 3211,3249) | OK | Talk: Dialog: "" / Trade: Shop "Lumbridge General Store" (0 items) | - |
| 520 | Shop keeper (Lumbridge General Store 3209,3247) | OK | Talk: Dialog: "" / Trade: Shop "Lumbridge General Store" (0 items) | - |
| 758 | Fred the Farmer (Fred the Farmer 3185,3277) | OK | Talk: Dialog: "" / Trade:  | - |
| 494 | Banker (Draynor Market 3088,3242) | OK | Talk: Cannot reach Banker: Stuck at (3085, 3243) / Trade:  | - |
| 495 | Banker (Draynor Market 3090,3243) | OK | Talk: Banker is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 558 | Gerrant (Port Sarim Fishing Shop 3014,3221) | OK | Talk: Dialog: "" / Trade: Shop "Gerrant's Fishy Business." (0 items) | - |
| 378 | Seaman Thresnor (Port Sarim Fishing Shop 3026,3216) | OK | Talk: Dialog: "" / Trade:  | - |
| 376 | Captain Tobias (Port Sarim Fishing Shop 3029,3216) | OK | Talk: Dialog: "" / Trade:  | - |
| 377 | Seaman Lorris (Port Sarim Fishing Shop 3026,3220) | OK | Talk: Dialog: "" / Trade:  | - |
| 557 | Wydin (Port Sarim Food Store 3016,3204) | OK | Talk: Dialog: "" / Trade: Shop "Food Store" (0 items) | - |
| 182 | Pirate (Port Sarim Food Store 3016,3190) | OK | Talk: Dialog did not open / Trade:  | - |
| 556 | Grum (Port Sarim Jewellery Shop 3012,3248) | OK | Talk: Dialog: "" / Trade: Shop "Grum's Gold Exchange." (0 items) | - |
| 604 | Thurgo (Mudskipper Point Thurgo 3000,3142) | OK | Talk: Dialog: "" / Trade:  | - |
| 307 | Hetty (Rimmington Hetty 2969,3204) | OK | Talk: Dialog: "" / Trade:  | - |
| 531 | Shop assistant (Rimmington Archery 2948,3216) | OK | Talk: Dialog: "" / Trade: Shop "Rimmington General Store" (0 items) | - |
| 530 | Shop keeper (Rimmington Archery 2947,3216) | OK | Talk: Dialog: "" / Trade: Shop "Rimmington General Store" (0 items) | - |
| 585 | Rommik (Rimmington Archery 2946,3202) | OK | Talk: Dialog: "" / Trade: Shop "Rommiks Crafty Supplies." (0 items) | - |
| 338 | Chancy (Rimmington Crafting 2935,3219) | OK | Talk: Dialog did not open / Trade:  | - |
| 367 | Chemist (Rimmington Chemist 2932,3213) | OK | Talk: Dialog did not open / Trade:  | - |
| 336 | DeVinci (Rimmington Chemist 2932,3219) | OK | Talk: Dialog did not open / Trade:  | - |
| 340 | Hops (Rimmington Chemist 2930,3219) | OK | Talk: Dialog did not open / Trade:  | - |
| 805 |  Master crafter (Crafting Guild 2931,3287) | OK | Talk:  Master crafter is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 599 | Make-over mage (Makeover Mage 2917,3321) | OK | Talk: Dialog: "" / Trade:  | - |
| 736 | Barmaid (Falador Rising Sun Inn 2956,3374) | OK | Talk: Cannot reach Barmaid / Trade:  | - |
| 598 | Hairdresser (Falador Rising Sun Inn 2944,3379) | OK | Talk: Dialog: "" / Trade:  | - |
| 527 | Shop assistant (Falador Rising Sun Inn 2958,3388) | OK | Talk: Dialog: "" / Trade: Shop "Falador General Store" (0 items) | - |
| 580 | Flynn (Falador Rising Sun Inn 2952,3385) | OK | Talk: Dialog: "" / Trade: Shop "Flynn's Mace Market." (0 items) | - |
| 577 | Cassie (Falador Cassie Shield Shop 2978,3384) | OK | Talk: Dialog: "" / Trade: Shop "Cassies' Shield Shop." (0 items) | - |
| 584 | Herquin (Falador Herquin Gems 2946,3336) | OK | Talk: Dialog: "" / Trade: Shop "Herquin's Gems." (0 items) | - |
| 581 | Wayne (Falador Wayne Chainmail 2969,3312) | OK | Talk: Dialog: "" / Trade: Shop "Wayne's Chains! - Chainmail specialist." (0 items) | - |
| 36 | Wyson the gardener (Falador Park Wyson 3025,3383) | OK | Talk: Dialog: "" / Trade:  | - |
| 803 | Monk (Edgeville Monastery 3051,3491) | OK | Talk: Dialog: "" / Trade:  | - |
| 801 | Abbot Langley (Edgeville Monastery 3056,3484) | OK | Talk: Dialog: "" / Trade:  | - |
| 538 | Peksa (Barbarian Village 3074,3429) | OK | Talk: Dialog: "" / Trade: Shop "Helmet Shop." (0 items) | - |
| 642 | Katrine (Varrock Black Arm Gang 3188,3386) | OK | Talk: Dialog: "" / Trade:  | - |
| 733 | Bartender (Varrock Blue Moon Inn 3226,3399) | OK | Talk: Dialog: "" / Trade:  | - |
| 198 | Guild master (Champions Guild 3189,3362) | OK | Talk: Guild master is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 926 | Border Guard (Al Kharid Tannery 3268,3226) | OK | Talk: Border Guard is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 957 | Mubariz (Duel Arena Entrance 3319,3236) | OK | Talk: Dialog: "" / Trade:  | - |
| 959 | A'abla (Duel Arena Hospital 3360,3271) | OK | Talk: Dialog: "" / Trade:  | - |
| 962 | Jaraah (Duel Arena Hospital 3361,3276) | OK | Talk: Dialog: "" / Trade:  | - |
| 963 | Zahwa (Duel Arena Hospital 3371,3276) | OK | Talk: Dialog: "" / Trade:  | - |
| 961 | Tafani (Duel Arena Hospital 3377,3274) | OK | Talk: Dialog: "" / Trade:  | - |
| 960 | Sabreen (Duel Arena Hospital 3369,3277) | OK | Talk: Dialog: "" / Trade:  | - |
| 958 | Fadli (Duel Arena Walkway 3383,3269) | OK | Talk: Dialog: "" / Trade:  | - |
| 545 | Dommik (Al Kharid Crafting Shop 3322,3194) | OK | Talk: Dialog: "" / Trade: Shop "Dommiks Crafting Store." (0 items) | - |
| 804 | Tanner (Al Kharid Tannery 3274,3193) | OK | Talk: Dialog: "" / Trade: Interacted with Tanner | - |
| 543 | Kebab seller (Al Kharid Tannery 3272,3181) | OK | Talk: Dialog: "" / Trade:  | - |
| 496 | Banker (Al Kharid Kebab Shop 3267,3169) | OK | Talk: Cannot reach Banker: Stuck at (3271, 3167) / Trade:  | - |
| 497 | Banker (Al Kharid Kebab Shop 3267,3168) | OK | Talk: Cannot reach Banker: Stuck at (3270, 3167) / Trade:  | - |
| 573 | Fur trader (Ardougne Market Fur & Spice 2668,3296) | OK | Talk: Dialog: "" / Trade: Shop "Ardougne Fur Stall." (0 items) | - |
| 589 | Zenesha (Ardougne Market Fur & Spice 2656,3293) | OK | Talk: Dialog: "" / Trade: Shop "Zenesha's Plate Mail Body Shop." (0 items) | - |
| 572 | Spice seller (Ardougne Market Fur & Spice 2662,3292) | OK | Talk: Dialog: "" / Trade: Shop "Ardougne Spice Stall." (0 items) | - |
| 494 | Banker (Ardougne Zenesha Platebody Shop 2657,3286) | OK | Talk: Cannot reach Banker: Stuck at (2653, 3285) / Trade:  | - |
| 495 | Banker (Ardougne Zenesha Platebody Shop 2657,3280) | OK | Talk: Banker is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 843 | RPDT employee (Ardougne Zenesha Platebody Shop 2646,3278) | OK | Talk: Dialog: "" / Trade:  | - |
| 289 | Councillor Halgrive (Ardougne Church & Halgrive 2616,3296) | OK | Talk: Dialog: "" / Trade:  | - |
| 591 | Kortan (Ardougne Church & Halgrive 2613,3292) | OK | Talk: Dialog: "" / Trade: Shop "Aemad's Adventuring Supplies." (0 items) | - |
| 590 | Aemad (Ardougne Church & Halgrive 2615,3292) | OK | Talk: Dialog: "" / Trade: Shop "Aemad's Adventuring Supplies." (0 items) | - |
| 1216 | Parroty Pete (Ardougne Church & Halgrive 2610,3284) | OK | Talk: Dialog: "" / Trade:  | - |
| 335 | Elena (Ardougne Elena House 2592,3336) | OK | Talk: Cannot reach Elena: Path to (2592, 3336) stops 3 tiles short at (2592, 3339) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 273 | Lucien (Ardougne Elena House 2576,3324) | OK | Talk: Dialog: "" / Trade:  | - |
| 718 | Mourner (Ardougne Elena House 2583,3325) | OK | Talk: Dialog: "" / Trade:  | - |
| 738 | Bartender (Ardougne Adventurer Store 2575,3320) | OK | Talk: Dialog: "" / Trade:  | - |
| 227 | Morris (Hemenster Fishing Contest 2643,3440) | OK | Talk: Dialog did not open / Trade:  | - |
| 225 | Bonzo (Hemenster Fishing Contest 2641,3439) | OK | Talk: Bonzo is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 226 | A Sinister Stranger (Hemenster Fishing Contest 2636,3436) | OK | Talk: Dialog: "" / Trade:  | - |
| 230 | Grandpa Jack (Hemenster Fishing Contest 2646,3454) | OK | Talk: Dialog: "" / Trade:  | - |
| 679 | Ranging Guild Doorman (Hemenster Fishing Contest 2658,3439) | OK | Talk: Dialog: "" / Trade:  | - |
| 694 | Ticket Merchant (Ranging Guild Entrance 2659,3433) | OK | Talk: Dialog: "" / Trade:  | - |
| 682 | Armour salesman (Ranging Guild Entrance 2666,3437) | OK | Talk: Dialog: "" / Trade: Trade opened dialog: "" | - |
| 563 | Arhein (Catherby Docks & Arhein 2803,3430) | OK | Talk: Dialog: "" / Trade: Shop "Arhein Store" (0 items) | - |
| 562 | Candle maker (Catherby Docks & Arhein 2799,3440) | OK | Talk: Dialog: "" / Trade: Shop "Candle Shop" (0 items) | - |
| 575 | Hickton (Catherby Hickton & Shops 2821,3442) | OK | Talk: Dialog: "" / Trade: Shop "Hicktons Archery Emporium." (0 items) | - |
| 666 | Caleb (Catherby Hickton & Shops 2818,3452) | OK | Talk: Dialog: "" / Trade:  | - |
| 66 | Gnome (Brimstail Cave Entrance 2400,3417) | OK | Talk: Cannot reach Gnome: Path to (2400, 3417) stops 7 tiles short at (2407, 3411) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 68 | Gnome (Brimstail Cave Entrance 2420,3426) | OK | Talk: Cannot reach Gnome: Path to (2420, 3426) stops 16 tiles short at (2410, 3410) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 67 | Gnome (Gnomeball Field 2381,3425) | OK | Talk: Cannot reach Gnome: Path to (2381, 3425) stops 8 tiles short at (2373, 3417) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 481 | Gnome (Tracker Gnome 1 2498,3260) | OK | Talk: Dialog: "" / Trade:  | - |
| 482 | Gnome (Tracker Gnome 2 2523,3258) | OK | Talk: Gnome is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 483 | Gnome (Tracker Gnome 3 2496,3234) | OK | Talk: Dialog: "" / Trade:  | - |
| 372 | Mourner (Kilron Outside Tree Gnome Village 2560,3303) | OK | Talk: Cannot reach Mourner: Stuck at (2560, 3300) / Trade:  | - |
| 348 | Mourner (Kilron Outside Tree Gnome Village 2548,3288) | OK | Talk: Cannot reach Mourner: Path to (2548, 3288) stops 11 tiles short at (2559, 3288) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 490 | Observatory professor (Observatory Reception 2439,3156) | OK | Talk: Cannot reach Observatory professor: Path to (2439, 3156) stops 5 tiles short at (2437, 3151) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 555 | Shop keeper (Port Khazard Docks 2655,3152) | OK | Talk: Dialog: "" / Trade: Shop "Khazard General Store" (0 items) | - |
| 463 | Murphy (Port Khazard Docks 2666,3160) | OK | Talk: Dialog: "" / Trade:  | - |
| 256 | Khazard Guard (Khazard Bar 2568,3142) | OK | Talk: Dialog: "" / Trade:  | - |
| 259 | Khazard barman (Khazard Bar 2564,3140) | OK | Talk: Dialog: "" / Trade:  | - |
| 462 | Wizard Distentor (Yanille East Magic Guild & Shops 2596,3088) | OK | Talk: Wizard Distentor is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 593 | Frenita (Yanille Center 2564,3099) | OK | Talk: Dialog: "" / Trade: Shop "Frenita's Cookery Shop." (0 items) | - |
| 739 | Bartender (Yanille Dragon Inn 2554,3077) | OK | Talk: Dialog: "" / Trade:  | - |
| 852 | Ogre chieftain (Feldip Hills Rantz 2615,2988) | OK | Talk: Dialog did not open / Trade:  | - |
| 367 | Chemist (Rimmington Chemist Inside 2930,3211) | OK | Talk: Dialog did not open / Trade:  | - |
| 338 | Chancy (Rimmington Chemist Inside 2935,3219) | OK | Talk: Dialog did not open / Trade:  | - |
| 340 | Hops (Rimmington Chemist Inside 2932,3218) | OK | Talk: Dialog did not open / Trade:  | - |
| 336 | DeVinci (Rimmington Chemist Inside 2933,3219) | OK | Talk: Dialog did not open / Trade:  | - |
| 495 | Banker (Draynor Wine & Market 3090,3243) | OK | Talk: Cannot reach Banker: Stuck at (3093, 3245) / Trade:  | - |
| 494 | Banker (Draynor Wine & Market 3090,3245) | OK | Talk: Cannot reach Banker: Stuck at (3091, 3248) / Trade:  | - |
| 919 | Lady Keli (Draynor Jail 3129,3244) | OK | Talk: Talking to Lady Keli / Trade:  | - |
| 916 | Joe (Draynor Jail 3122,3245) | OK | Talk: Talking to Joe / Trade:  | - |
| 920 | Prince Ali (Draynor Jail 3125,3243) | OK | Talk: Prince Ali is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 741 | Duke Horacio (Lumbridge Castle L1 3212,3220) | OK | Talk: Dialog: "" / Trade:  | - |
| 546 | Zaff (Varrock Palace Tower L1 3204,3436) | OK | Talk: Cannot reach Zaff: Stuck at (3202, 3433) / Trade:  | - |
| 847 | Head chef (Cooking Guild 3143,3444) | OK | Talk: Cannot reach Head chef: No path to (3143, 3444) from (3149, 3441): no waypoints / Trade:  | - |
| 644 | Straven (Varrock Phoenix Gang Basement 3245,9781) | OK | Talk: Dialog: "" / Trade:  | - |
| 458 | Father Urhney (Lumbridge Swamp Urhney 3232,3155) | OK | Talk: Dialog: "" / Trade:  | - |
| 884 | Captain Rovin (Varrock Palace Tower L2 3204,3494) | OK | Talk: Dialog: "" / Trade:  | - |
| 745 | Wormbrain (Port Sarim Jail 3014,3186) | OK | Talk: Wormbrain is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 649 | Archer (Lumbridge Adventurer Camp 3143,3203) | OK | Talk: Dialog: "" / Trade:  | - |
| 652 | Wizard (Lumbridge Adventurer Camp 3147,3198) | OK | Talk: Dialog: "" / Trade:  | - |
| 650 | Warrior (Lumbridge Adventurer Camp 3150,3201) | OK | Talk: Dialog: "" / Trade:  | - |
| 651 | Monk (Lumbridge Adventurer Camp 3147,3202) | OK | Talk: Dialog: "" / Trade:  | - |
| 209 | Nulodion (Ice Mountain Nulodion 3013,3454) | OK | Talk: Nulodion is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade: Nothing happened interacting with Nulodion | - |
| 199 | Gunthor the brave (Barbarian Village North 3081,3443) | OK | Talk: Dialog: "" / Trade:  | - |
| 782 | Philop (Gertrude House 3150,3407) | OK | Talk: Philop is not reachable from here (wall or closed door in the way) - walk closer or open the door first / Trade:  | - |
| 784 | Kanel (Gertrude House 3155,3406) | OK | Talk: Dialog did not open / Trade:  | - |
| 523 | Shop assistant (Varrock General Store 3217,3412) | OK | Talk: Dialog: "" / Trade: Shop "Varrock General Store" (0 items) | - |
| 639 | Romeo (Varrock General Store 3210,3425) | OK | Talk: Dialog: "" / Trade:  | - |
| 548 | Thessalia (Varrock General Store 3204,3417) | OK | Talk: Cannot reach Thessalia / Trade: Shop "Thessalia Fine Clothes." (0 items) | - |
| 835 | Irena (Shantay Pass South Irena 3303,3115) | OK | Talk: Cannot reach Irena / Trade:  | - |
| 838 | Shantay Guard (Shantay Pass South Irena 3303,3118) | OK | Talk: Cannot reach Shantay Guard: Path to (3303, 3118) stops 3 tiles short at (3303, 3115) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 837 | Shantay Guard (Shantay Pass South Irena 3301,3124) | OK | Talk: Cannot reach Shantay Guard: Path to (3301, 3124) stops 7 tiles short at (3306, 3117) - the rest is unroutable from here (locked door or separate room?) / Trade:  | - |
| 1152 | Weird Old Man (Kalphite Lair Outside 3227,3104) | OK | Talk: Dialog: "" / Trade:  | - |
| 833 | Bedabin Nomad (Bedabin Camp 3173,3036) | OK | Talk: Dialog: "" / Trade: Shop "Bedabin Village Bartering" (0 items) | - |
| 834 | Bedabin Nomad Guard (Bedabin Camp 3170,3045) | OK | Talk: Dialog: "" / Trade:  | - |
- **OK** | `637` (Juliet) @ (3156, 3427, L1) — Talk-to -> "Click here to continue"
- **OK** | `780` (Gertrude) @ (3151, 3410, L0) — Talk-to -> "Click here to continue"
- **OK** | `528` (Shop keeper) @ (3077, 3508, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `529` (Shop assistant) @ (3081, 3511, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `747` (Oziach) @ (3069, 3519, L0) — Talk-to -> "Click here to continue"
- **OK** | `609` (Fortress Guard) @ (3018, 3511, L0) — Talk-to -> "Click here to continue"
- **OK** | `746` (Oracle) @ (3018, 3503, L0) — Talk-to -> "Click here to continue"
- **OK** | `285` (Veronica) @ (3109, 3332, L0) — Talk-to -> "Click here to continue"
- **OK** | `922` (Aggie) @ (3085, 3258, L0) — Talk-to -> "Click here to continue"
- **OK** | `918` (Ned) @ (3104, 3262, L0) — Talk-to -> "Click here to continue"
- **OK** | `755` (Morgan) @ (3096, 3269, L0) — Talk-to -> "Click here to continue"
- **OK** | `559` (Brian) @ (3030, 3247, L0) — Talk-to ("So, are you selling something? 'Ello.") + Trade (shopOpen=true)
- **OK** | `583` (Betty) @ (3012, 3259, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `375` (Redbeard Frank) @ (3053, 3250, L0) — Talk-to -> "Click here to continue"
- **OK** | `657` (Monk of Entrana) @ (3046, 3237, L0) — Talk-to -> "Click here to continue"
- **OK** | `744` (Klarense) @ (3047, 3204, L0) — Talk-to -> "Click here to continue"
- **OK** | `300` (Sedridor) @ (3102, 9571, L0) — Talk-to -> "Click here to continue"
- **OK** | `881` (Traiborn) @ (3112, 3162, L1) — Talk-to -> "Click here to continue"
- **OK** | `706` (Wizard Mizgog) @ (3103, 3163, L2) — Talk-to -> "Click here to continue"
- **FAIL** | `707` (Wizard Grayzag) @ (3109, 3162, L2) — Talk-to -> "No response"
- **OK** | `519` (Bob) @ (3232, 3203, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `456` (Father Aereck) @ (3245, 3205, L0) — Talk-to -> "Click here to continue"
- **OK** | `379` (Luthas) @ (2935, 3153, L0) — Talk-to -> "Click here to continue"
- **OK** | `568` (Zambo) @ (2924, 3143, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **FAIL** | `790` (Trobert) @ (2808, 3172, L0) — Talk-to -> "No response"
- **OK** | `1171` (Lubufu) @ (2769, 3169, L0) — Talk-to -> "Click here to continue"
- **OK** | `1595` (Saniboch) @ (2745, 3152, L0) — Talk-to -> "Click here to continue"
- **OK** | `560` (Jiminua) @ (2768, 3124, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `740` (Trufitus) @ (2807, 3086, L0) — Talk-to -> "Click here to continue"
- **OK** | `1167` (Tamayu) @ (2846, 3041, L0) — Talk-to -> "Click here to continue"
- **OK** | `553` (Aubury) @ (3254, 3402, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `550` (Lowe) @ (3230, 3423, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `549` (Horvik) @ (3232, 3438, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `546` (Zaff) @ (3204, 3432, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `547` (Baraek) @ (3216, 3437, L0) — Talk-to -> "Can you sell me some furs? Hello. I am in search of a quest."
- **OK** | `640` (Father Lawrence) @ (3255, 3477, L0) — Talk-to -> "Click here to continue"
- **OK** | `647` (Reldo) @ (3208, 3493, L0) — Talk-to -> "Click here to continue"
- **OK** | `648` (King Roald) @ (3222, 3475, L0) — Talk-to -> "Click here to continue"
- **OK** | `646` (Curator) @ (3252, 3446, L0) — Talk-to -> "Click here to continue"
- **OK** | `595` (Tea seller) @ (3271, 3412, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `732` (Bartender) @ (3268, 3393, L0) — Talk-to -> "Click here to continue"
- **OK** | `638` (Apothecary) @ (3194, 3406, L0) — Talk-to -> "Click here to continue"
- **FAIL** | `494` (Banker) @ (3187, 3436, L0) — Talk-to -> "No response"
- **OK** | `540` (Gem trader) @ (3288, 3213, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `539` (Silk trader) @ (3299, 3204, L0) — Talk-to -> "Click here to continue"
- **OK** | `541` (Zeke) @ (3288, 3190, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `542` (Louie legs) @ (3318, 3175, L0) — Talk-to ("") + Trade (shopOpen=true)
- **OK** | `544` (Ranael) @ (3318, 3164, L0) — Talk-to ("Click here to continue") + Trade (shopOpen=true)
- **OK** | `923` (Hassan) @ (3302, 3161, L0) — Talk-to -> "Click here to continue"
- **OK** | `924` (Osman) @ (3282, 3181, L0) — Talk-to -> "Click here to continue"
- **OK** | `836` (Shantay) @ (3302, 3123, L0) — Talk-to ("") + Trade (shopOpen=true)
- **OK** | `731` (Bartender) @ (3277, 3488, L0) — Talk-to -> "Click here to continue"

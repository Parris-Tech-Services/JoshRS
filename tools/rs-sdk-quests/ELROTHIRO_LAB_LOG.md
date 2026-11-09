# elrothiro Lab Log

## Session 1

### Goals
-

### Observations
-

### Next Steps

### Possible SDK Bugs or Improvements:
-
- 2026-11-09T04:17:40.014Z START Cook's Assistant (attempt 1)
- 2026-11-09T04:17:40.015Z STEP start
- 2026-11-09T04:17:40.015Z STEP egg
- 2026-11-09T04:17:40.015Z STEP milk
- 2026-11-09T04:17:40.015Z STEP grain
- 2026-11-09T04:17:42.826Z STEP mill
- 2026-11-09T04:17:42.827Z STEP hand-in
- 2026-11-09T04:18:24.461Z DONE Cook's Assistant

### Quest 1: Cook's Assistant (Completed)
- **Quest Points Gained**: +1 QP (Total: 1 QP)
- **Rewards**: +7,500 Cooking XP (Level 1 -> 30)
- **Notes**: Flour bin at the Lumbridge windmill requires `interactLoc(/flour bin/i, 'Empty')` rather than `useItemOnLoc(pot, bin)`. Added a check in `cooks-assistant.ts` so if grain was already milled into the bin on a prior attempt, the bot empties the bin directly without re-picking wheat.
- 2026-11-09T04:20:16.841Z START Sheep Shearer (attempt 1)
- 2026-11-09T04:20:16.842Z STEP bank
- 2026-11-09T04:21:01.641Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T04:21:12.199Z STEP start
- 2026-11-09T04:21:51.818Z STEP shears
- 2026-11-09T04:22:37.626Z STEP wool
- 2026-11-09T04:24:14.909Z STEP spin
- 2026-11-09T04:24:39.230Z lumbridgeStairs L0->L1 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:26:14.525Z STEP hand-in
- 2026-11-09T04:26:18.497Z lumbridgeStairs L1->L0 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:27:12.191Z DONE Sheep Shearer

### Quest 2: Sheep Shearer (Completed)
- **Quest Points Gained**: +1 QP (Total: 2 QP)
- **Rewards**: +5,000 Crafting XP (3,750 from Fred + 1,250 from spinning 20 balls of wool), 60 Coins
- **Notes**: Banked starter items at Draynor first to free 20+ inventory slots so all 20 wool could be sheared and spun in a single trip. Avoided the Level 2 Ram in the sheep pen (`combatLevel === 0`).
- 2026-11-09T04:28:38.033Z START The Restless Ghost (attempt 1)
- 2026-11-09T04:28:38.033Z STEP start
- 2026-11-09T04:29:10.862Z STEP urhney
- 2026-11-09T04:30:19.516Z STEP ghost
- 2026-11-09T04:31:32.334Z STEP skull
- 2026-11-09T04:32:28.390Z wizardsTower climb-down -> {"success":true,"message":"Interacted with Ladder"}
- 2026-11-09T04:32:55.311Z STEP hand-in
- 2026-11-09T04:33:48.180Z DONE The Restless Ghost

### Quest 3: The Restless Ghost (Completed)
- **Quest Points Gained**: +1 QP (Total: 3 QP)
- **Rewards**: +28,125 Prayer XP (Level 1 -> 37), Ghostspeak amulet (equipped)
- **Notes**: Obtained Ghostspeak amulet from Father Urhney in Lumbridge Swamp, spoke to the Restless Ghost in the graveyard coffin, retrieved the Skull from the Wizards' Tower basement altar (`3120, 9566`) while ignoring the spawned Level 13 Skeleton, and returned the skull to the coffin.
- 2026-11-09T04:34:06.831Z START Rune Mysteries (attempt 1)
- 2026-11-09T04:34:06.832Z STEP start
- 2026-11-09T04:34:37.656Z lumbridgeStairs L0->L1 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:34:51.069Z STEP package
- 2026-11-09T04:34:57.340Z lumbridgeStairs L1->L0 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:35:54.004Z wizardsTower climb-down -> {"success":true,"message":"Interacted with Ladder"}
- 2026-11-09T04:36:14.524Z STEP notes
- 2026-11-09T04:38:33.640Z STEP finish
- 2026-11-09T04:40:14.769Z wizardsTower climb-down -> {"success":true,"message":"Interacted with Ladder"}
- 2026-11-09T04:40:43.712Z DONE Rune Mysteries

### Quest 4: Rune Mysteries (Completed)
- **Quest Points Gained**: +1 QP (Total: 4 QP)
- **Rewards**: Air talisman, access to Runecrafting / Rune essence mine
- **Notes**: Spoke to Duke Horacio on Lumbridge Castle L1 for the Air talisman, delivered it to Wizard Sedridor in the Wizards' Tower basement, carried the Research package via the east Varrock route (`walkToVarrock` avoiding Dark Wizards) to Aubury in SE Varrock, and returned Aubury's Research notes to Sedridor.
- 2026-11-09T04:41:10.029Z START Romeo & Juliet (attempt 1)
- 2026-11-09T04:41:10.029Z STEP berries
- 2026-11-09T04:42:49.635Z STEP juliet-start
- 2026-11-09T04:44:30.720Z STEP romeo-message
- 2026-11-09T04:44:47.586Z STEP father-lawrence
- 2026-11-09T04:45:08.774Z STEP apothecary
- 2026-11-09T04:45:41.466Z STEP juliet-potion
- 2026-11-09T04:46:12.351Z STEP finish
- 2026-11-09T04:46:29.178Z DONE Romeo & Juliet

### Quest 5: Romeo & Juliet (Completed)
- **Quest Points Gained**: +5 QP (Total: 9 QP)
- **Rewards**: 5 Quest Points
- **Notes**: Picked Cadava berries SE of Varrock (`3268, 3369`) on the way up, started the quest with Juliet on her balcony (`3158, 3426` L1), delivered the message to Romeo in Varrock Square, spoke to Father Lawrence (`3255, 3481`), obtained the Cadava potion from the Apothecary (`3195, 3404`), gave it to Juliet, and completed the crypt cutscene with Romeo.
- 2026-11-09T04:47:57.291Z START Doric's Quest (attempt 1)
- 2026-11-09T04:47:57.293Z STEP prep
- 2026-11-09T04:49:40.029Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T04:49:44.368Z STEP mine-ores
- 2026-11-09T04:51:39.285Z STEP hand-in
- 2026-11-09T04:52:50.814Z DONE Doric's Quest

### Quest 6: Doric's Quest (Completed)
- **Quest Points Gained**: +1 QP (Total: 10 QP)
- **Rewards**: +36,750 Mining XP (Level 1 -> 40), 180 Coins, access to Doric's anvils
- **Notes**: Withdrew Bronze pickaxe from Draynor Bank, mined 6 Clay and 4 Copper ore at Rimmington Mine (`2986, 3239` and `2978, 3247`) to reach Mining Level 15+, mined 2 Iron ore (`2969, 3240`), and walked to Doric's hut (`2952, 3450`) to start and immediately hand in all ores in one dialogue sequence.
- 2026-11-09T04:54:00.828Z START Witch's Potion (attempt 1)
- 2026-11-09T04:54:00.829Z STEP start-and-rat
- 2026-11-09T04:55:06.447Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T04:56:23.635Z STEP ingredients
- 2026-11-09T04:57:35.525Z STEP hand-in
- 2026-11-09T04:57:49.892Z DONE Witch's Potion

### Quest 7: Witch's Potion (Completed)
- **Quest Points Gained**: +1 QP (Total: 11 QP)
- **Rewards**: +8,125 Magic XP (Level 1 -> 25)
- **Notes**: Started the quest with Hetty in Rimmington (`2968, 3205`), killed a Rat in the archery shop next door for a Rat's tail, bought an Eye of newt and Raw beef in Port Sarim (`3014, 3259`), picked an Onion behind Fred's farm (`3188, 3266`), cooked and deliberately burned the meat on the range in Rimmington (`2969, 3212`), handed all 4 ingredients to Hetty, and drank from the Cauldron (`oploc1`).
- 2026-11-09T04:58:08.027Z START Ernest the Chicken (attempt 1)
- 2026-11-09T04:58:08.028Z STEP start-veronica-and-oddenstein
- 2026-11-09T04:59:56.557Z STEP pressure-gauge
- 2026-11-09T05:01:11.917Z STEP rubber-tube
- 2026-11-09T05:02:11.308Z STEP oil-can
- 2026-11-09T05:04:00.534Z STEP hand-in
- 2026-11-09T05:04:32.299Z DONE Ernest the Chicken

### Quest 8: Ernest the Chicken (Completed)
- **Quest Points Gained**: +4 QP (Total: 15 QP)
- **Rewards**: 300 Coins (Total Coins: 536)
- **Notes**: Started with Veronica outside Draynor Manor (`3110, 3330`), spoke to Professor Oddenstein on L2 (`3116, 3364`), poisoned the Piranha fountain (`3088, 3335`) for the Pressure gauge, dug the Compost heap (`3085, 3361`) for the Closet key and took the Rubber tube from the Skeleton room (`3107, 3367`), solved the 9-step basement lever puzzle (`B, A, D, B, F, E, C, E, F`) for the Oil can, and handed all 3 parts to Oddenstein.
- 2026-11-09T05:05:52.438Z START The Knight's Sword (attempt 1)
- 2026-11-09T05:05:52.438Z STEP start-squire-and-reldo
- 2026-11-09T05:07:57.229Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T05:13:01.300Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:22:57.186Z STEP FAILED redberry-pie-and-iron-bars
- 2026-11-09T05:22:57.193Z START The Knight's Sword (attempt 2)
- 2026-11-09T05:22:57.193Z STEP start-squire-and-reldo
- 2026-11-09T05:23:24.436Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T05:28:17.398Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:32:17.737Z STEP FAILED redberry-pie-and-iron-bars
- 2026-11-09T05:34:15.641Z START The Knight's Sword (attempt 1)
- 2026-11-09T05:34:15.641Z STEP start-squire-and-reldo
- 2026-11-09T05:34:15.642Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:41:17.228Z START The Knight's Sword (attempt 1)
- 2026-11-09T05:41:17.229Z STEP start-squire-and-reldo
- 2026-11-09T05:41:17.230Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:43:01.038Z STEP FAILED redberry-pie-and-iron-bars
- 2026-11-09T05:43:01.045Z START The Knight's Sword (attempt 2)
- 2026-11-09T05:43:01.045Z STEP start-squire-and-reldo
- 2026-11-09T05:43:01.045Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:49:21.169Z STEP steal-portrait
- 2026-11-09T05:51:20.334Z STEP blurite-sword-and-finish
- 2026-11-09T05:53:36.038Z STEP FAILED blurite-sword-and-finish
- 2026-11-09T05:57:52.450Z START The Knight's Sword (attempt 1)
- 2026-11-09T05:57:52.451Z STEP start-squire-and-reldo
- 2026-11-09T05:57:52.452Z STEP redberry-pie-and-iron-bars
- 2026-11-09T05:57:52.454Z STEP steal-portrait
- 2026-11-09T05:57:52.455Z STEP blurite-sword-and-finish
- 2026-11-09T06:02:20.451Z DONE The Knight's Sword

### Quest 9: The Knight's Sword (Completed)
- **Quest Points Gained**: +1 QP (Total: 16 QP)
- **Rewards**: +318,125 Smithing XP (Level 18 -> 82!)
- **Notes**: Started with the Squire in Falador Castle courtyard (`2977, 3342`), spoke to Reldo in Varrock Palace library (`3211, 3494`), crafted `Uncooked berry pie` and cooked `Redberry pie` on the Rimmington range (`2968, 3212`), trained Smithing to Level 18 and smelted 2 `Iron bar`s at Falador Furnace (`2974, 3369`), distracted Sir Vyvin via a White Knight in the adjacent room on Falador Castle L2 (`2983, 3348`) to search the cupboard (`2984, 3336`) for the `Portrait`, handed the `Portrait` to Thurgo, activated **Protect from Melee** (`protect_from_melee`) before descending into the Asgarnian Ice Dungeon (`3008, 3150`) to safely mine `Blurite ore` at (`3049, 9566`) amidst Ice Warriors/Giants, obtained the `Blurite sword` from Thurgo, and returned it to the Squire.
- 2026-11-09T06:02:59.234Z START Vampyre Slayer (attempt 1)
- 2026-11-09T06:02:59.235Z STEP morgan-and-garlic
- 2026-11-09T06:04:18.847Z STEP prep
- 2026-11-09T06:08:58.320Z STEP stake
- 2026-11-09T06:10:56.522Z STEP slay
- 2026-11-09T06:13:48.892Z DONE Vampyre Slayer

### Quest 10: Vampyre Slayer (Completed)
- **Quest Points Gained**: +3 QP (Total: 19 QP)
- **Rewards**: +120,625 Attack XP (Level 13 -> 51! Combat Level -> 41)
- **Notes**: Started with Morgan in Draynor Village (`3098, 3268`), searched the upstairs cupboard (`3097, 3268` L1) for `Garlic`, bought a `Hammer` at Lumbridge General Store (`3212, 3247`), trained melee stats on Lumbridge chickens (`Attack 13`, `Strength 16`, `Defence 13`, `HP 18`), bought a `Beer` for Dr. Harlow at the Jolly Boar Inn (`3277, 3491`) to obtain the `Stake`, descended into Draynor Manor Crypt (`3078, 9774`), activated `protect_from_melee`, and defeated Count Draynor (Lvl 34) with 0 damage taken.
- 2026-11-09T06:13:48.892Z START Pirate's Treasure (attempt 1)
- 2026-11-09T06:13:48.893Z STEP start-and-smuggle
- 2026-11-09T06:16:20.831Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T06:28:15.844Z STEP FAILED start-and-smuggle
- 2026-11-09T06:28:15.850Z START Pirate's Treasure (attempt 2)
- 2026-11-09T06:28:15.850Z STEP start-and-smuggle
- 2026-11-09T06:33:42.019Z START Pirate's Treasure (attempt 1)
- 2026-11-09T06:33:42.020Z STEP start-and-smuggle
- 2026-11-09T06:37:14.734Z STEP FAILED start-and-smuggle
- 2026-11-09T06:37:14.736Z START Pirate's Treasure (attempt 2)
- 2026-11-09T06:37:14.736Z STEP start-and-smuggle
- 2026-11-09T06:38:06.433Z START Pirate's Treasure (attempt 1)
- 2026-11-09T06:38:06.433Z STEP start-and-smuggle
- 2026-11-09T06:38:38.662Z STEP FAILED start-and-smuggle
- 2026-11-09T06:38:38.668Z START Pirate's Treasure (attempt 2)
- 2026-11-09T06:38:38.668Z STEP start-and-smuggle
- 2026-11-09T06:40:11.632Z STEP retrieve-rum-and-key
- 2026-11-09T06:40:59.752Z STEP blue-moon-chest
- 2026-11-09T06:43:35.578Z STEP dig-falador-park
- 2026-11-09T06:46:55.465Z DONE Pirate's Treasure
- 2026-11-09T06:46:55.465Z START Goblin Diplomacy (attempt 1)
- 2026-11-09T06:46:55.466Z STEP start-port-sarim

### Quest 11: Pirate's Treasure (`hunt`) — COMPLETED
- **Quest Points Gained**: +2 QP (Total: **21 QP**)
- **Rewards**: 450 Coins (`Coins x466`), Gold ring, Emerald (One-Eyed Hector's Casket).
- **Notes / Lessons**:
  - Karamja `Banana Tree` locs (`id: 2073..2077`) have option `Search`, not `Pick` (`bananatreeempty` is `2078`). Fixed `pirates-treasure.ts` to filter for `l.id >= 2073 && l.id <= 2077` and interact with `/^pick|search$/i`.
  - Fixed Luthas house entry (`tol = 1` at `(2938, 3154)`) and dialogue options (`/no, the crate isn't full yet/i`) and prevented re-buying Karamjan rum if rum was already shipped to Wydin's store.
- 2026-11-09T06:47:42.028Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T06:48:06.359Z STEP dyes
- 2026-11-09T06:55:25.363Z STEP goblin-mails
- 2026-11-09T07:03:47.928Z STEP FAILED goblin-mails
- 2026-11-09T07:03:47.934Z START Goblin Diplomacy (attempt 2)
- 2026-11-09T07:03:47.934Z STEP start-port-sarim
- 2026-11-09T07:05:24.428Z STEP dyes
- 2026-11-09T07:05:24.429Z STEP goblin-mails
- 2026-11-09T07:07:44.252Z STEP hand-in
- 2026-11-09T07:08:11.069Z DONE Goblin Diplomacy

### Quest 12: Goblin Diplomacy (`gobdip`) — COMPLETED
- **Quest Points Gained**: +5 QP (Total: **26 QP**)
- **Rewards**: +5,000 Crafting XP (Level 25 -> 33), 1 Gold bar.
- **Notes / Lessons**:
  - Gathered 3 `Redberries` (`3267, 3371`), 2 `Onion`s (`3188, 3266`), and 2 `Woad leaf`s from Wyson (`3027, 3379`), made `Red dye`, `Yellow dye`, `Blue dye`, and combined `Red dye` + `Yellow dye` -> `Orange dye` at Aggie (`3086, 3259`).
  - Filtered Goblin Village target selection (`!n.inCombat`) so `Elrothiro` did not compete with `Bot3` for the same goblins; farmed 3 `Goblin mail`s (training Strength 39 -> 56 and HP 29 -> 42), dyed them Orange and Blue, and handed all 3 to General Wartface (`2957, 3511`).
- 2026-11-09T07:08:11.069Z START Prince Ali Rescue (attempt 1)
- 2026-11-09T07:08:11.070Z STEP start-hassan-osman
- 2026-11-09T07:09:38.023Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T07:11:14.435Z STEP varrock-items
- 2026-11-09T07:18:13.329Z STEP aggie-paste-and-dye
- 2026-11-09T07:20:38.024Z lit fire at (3163,3290)
- 2026-11-09T07:23:06.437Z STEP FAILED aggie-paste-and-dye
- 2026-11-09T07:23:06.437Z START Prince Ali Rescue (attempt 2)
- 2026-11-09T07:23:06.437Z STEP start-hassan-osman
- 2026-11-09T07:23:06.438Z STEP FAILED start-hassan-osman
- 2026-11-09T07:23:06.438Z START Imp Catcher (attempt 1)
- 2026-11-09T07:23:06.439Z STEP start-mizgog
- 2026-11-09T07:23:06.439Z STEP FAILED start-mizgog
- 2026-11-09T07:23:06.440Z START Imp Catcher (attempt 2)
- 2026-11-09T07:23:06.440Z STEP start-mizgog
- 2026-11-09T07:23:06.440Z STEP FAILED start-mizgog
- 2026-11-09T07:23:06.440Z START Demon Slayer (attempt 1)
- 2026-11-09T07:23:06.441Z STEP start-aris-and-prysin
- 2026-11-09T07:23:06.442Z STEP FAILED start-aris-and-prysin
- 2026-11-09T07:23:06.442Z START Demon Slayer (attempt 2)
- 2026-11-09T07:23:06.442Z STEP start-aris-and-prysin
- 2026-11-09T07:23:06.442Z STEP FAILED start-aris-and-prysin
- 2026-11-09T07:23:06.443Z START Black Knights' Fortress (attempt 1)
- 2026-11-09T07:23:06.443Z STEP prep-and-start
- 2026-11-09T07:23:06.445Z STEP FAILED prep-and-start
- 2026-11-09T07:23:06.445Z START Black Knights' Fortress (attempt 2)
- 2026-11-09T07:23:06.445Z STEP prep-and-start
- 2026-11-09T07:23:06.445Z STEP FAILED prep-and-start
- 2026-11-09T07:23:06.445Z START Druidic Ritual (attempt 1)
- 2026-11-09T07:23:06.446Z STEP gather-meats-and-start
- 2026-11-09T07:23:06.447Z STEP FAILED gather-meats-and-start
- 2026-11-09T07:23:06.447Z START Druidic Ritual (attempt 2)
- 2026-11-09T07:23:06.447Z STEP gather-meats-and-start
- 2026-11-09T07:23:06.447Z STEP FAILED gather-meats-and-start
- 2026-11-09T07:23:06.448Z START Gertrude's Cat (attempt 1)
- 2026-11-09T07:23:06.448Z STEP prep-items-and-start
- 2026-11-09T07:23:06.449Z STEP FAILED prep-items-and-start
- 2026-11-09T07:23:06.449Z START Gertrude's Cat (attempt 2)
- 2026-11-09T07:23:06.449Z STEP prep-items-and-start
- 2026-11-09T07:23:06.449Z STEP FAILED prep-items-and-start
- 2026-11-09T07:23:06.450Z START Monk's Friend (attempt 1)
- 2026-11-09T07:23:06.450Z STEP prep-and-start-omad
- 2026-11-09T07:23:06.451Z STEP FAILED prep-and-start-omad
- 2026-11-09T07:23:06.451Z START Monk's Friend (attempt 2)
- 2026-11-09T07:23:06.451Z STEP prep-and-start-omad
- 2026-11-09T07:23:06.452Z STEP FAILED prep-and-start-omad
- 2026-11-09T07:23:06.452Z START Hazeel Cult (attempt 1)
- 2026-11-09T07:23:06.452Z STEP start-ceril-and-clivet
- 2026-11-09T07:23:06.453Z STEP FAILED start-ceril-and-clivet
- 2026-11-09T07:23:06.453Z START Hazeel Cult (attempt 2)
- 2026-11-09T07:23:06.453Z STEP start-ceril-and-clivet
- 2026-11-09T07:23:06.453Z STEP FAILED start-ceril-and-clivet
- 2026-11-09T07:23:06.453Z START Sheep Herder (attempt 1)
- 2026-11-09T07:23:06.453Z STEP start-and-gear
- 2026-11-09T07:23:06.454Z STEP FAILED start-and-gear
- 2026-11-09T07:23:06.454Z START Sheep Herder (attempt 2)
- 2026-11-09T07:23:06.454Z STEP start-and-gear
- 2026-11-09T07:23:06.454Z STEP FAILED start-and-gear
- 2026-11-09T07:23:06.454Z START Dwarf Cannon (attempt 1)
- 2026-11-09T07:23:06.455Z STEP start-and-fix-railings
- 2026-11-09T07:23:06.456Z STEP FAILED start-and-fix-railings
- 2026-11-09T07:23:06.456Z START Dwarf Cannon (attempt 2)
- 2026-11-09T07:23:06.456Z STEP start-and-fix-railings
- 2026-11-09T07:23:06.456Z STEP FAILED start-and-fix-railings
- 2026-11-09T08:49:38.031Z START Prince Ali Rescue (attempt 1)
- 2026-11-09T08:49:38.031Z STEP start-hassan-osman
- 2026-11-09T08:49:38.032Z STEP varrock-items
- 2026-11-09T08:49:38.033Z STEP aggie-paste-and-dye
- 2026-11-09T08:50:10.428Z lit fire at (3163,3290)

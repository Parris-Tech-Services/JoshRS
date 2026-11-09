# bot4 Lab Log

## Session 1

### Goals
- Complete every quest supported by the local server autonomously on `bot4`.

### Observations
- Initial check: `bot4` at `(3222, 3222)` L0, Combat 3, all skills 1 (HP 10), 0 QP.
- **Quest 1: Cook's Assistant (`cooks`)** — Completed! Milked cow at `(3254, 3272)`, picked up egg at `(3231, 3297)`, picked wheat at `(3162, 3299)` and milled flour at `(3166, 3306)`, turned in to Cook at `(3208, 3214)`. Reward: +7,500 Cooking XP (Level 1 -> 30), 1 QP (Total: 1 QP).
- **Quest 2: Sheep Shearer (`sheep`)** — Completed! Bought Shears from Lumbridge General Store `(3212, 3246)`, sheared 20 wool from unshorn sheep (`id: 43`), spun 20 balls of wool on Lumbridge Castle L1 spinning wheel (and started **Rune Mysteries** with Duke Horacio on L1), delivered to Fred the Farmer at `(3190, 3273)`. Reward: +5,000 Crafting XP (Level 1 -> 25), +60 gp, 1 QP (Total: 2 QP).

### Next Steps

### Possible SDK Bugs or Improvements:
-

## Quest 3: The Restless Ghost (1 QP)
- Started with Father Aereck in Lumbridge Church `(3243, 3206)`.
- Spoke to Father Urhney in eastern Lumbridge Swamp `(3235, 3153)` to obtain and equip the `Ghostspeak amulet`.
- Opened the coffin at `(3249, 3192)` and spoke to the Restless Ghost.
- Entered the Wizards' Tower basement, spoke to Wizard Sedridor to exchange the `Air talisman` for the `Research package` (Rune Mysteries step 2), and retrieved the Ghost's `Skull` from `(3119, 9566)`.
- Returned the `Skull` to the coffin at `(3249, 3192)` (`> Congratulations! Quest complete!`).
- **Verified In-Game**: Prayer Level 1 -> 47 (`28,125` XP), Total QP: 3.
- 2026-11-09T05:20:29.647Z START Romeo & Juliet (attempt 1)
- 2026-11-09T05:20:29.648Z STEP juliet-start
- 2026-11-09T05:21:31.502Z STEP berries
- 2026-11-09T05:22:19.644Z STEP romeo-message
- 2026-11-09T05:22:48.308Z STEP father-lawrence
- 2026-11-09T05:23:30.711Z STEP apothecary
- 2026-11-09T05:24:05.491Z STEP juliet-potion
- 2026-11-09T05:25:08.694Z STEP finish
- 2026-11-09T05:25:25.588Z DONE Romeo & Juliet
- 2026-11-09T05:25:25.588Z START Rune Mysteries (attempt 1)
- 2026-11-09T05:25:25.588Z STEP finish
- 2026-11-09T05:27:13.938Z wizardsTower climb-down -> {"success":true,"message":"Interacted with Ladder"}
- 2026-11-09T05:27:42.927Z DONE Rune Mysteries

## Quest 4: Romeo & Juliet (5 QP)
- Spoke to Juliet on her L1 balcony `(3158, 3426)` to receive her `Message`.
- Picked `Cadava berries` SE of Varrock `(3266, 3361)`.
- Delivered the message to Romeo in Varrock Square `(3211, 3425)` and spoke to Father Lawrence `(3254, 3475)`.
- Exchanged `Cadava berries` with the Apothecary `(3195, 3404)` for the `Cadava potion`, delivered it to Juliet, and returned to Romeo (`> Congratulations! Quest complete!`).
- **Verified In-Game**: +5 QP, Total QP: 8.

## Quest 5: Rune Mysteries (1 QP)
- Delivered the `Research package` from Wizard Sedridor to Aubury in Varrock `(3253, 3401)` to receive `Notes`.
- Returned `Notes` to Wizard Sedridor in the Wizards' Tower basement (`> Congratulations! Quest complete!`).
- **Verified In-Game**: Received `Air talisman`, +1 QP, Total QP: 9.
- 2026-11-09T05:29:39.675Z START Witch's Potion (attempt 1)
- 2026-11-09T05:29:39.676Z STEP start-and-rat
- 2026-11-09T05:30:02.433Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T05:31:15.638Z STEP ingredients
- 2026-11-09T05:32:25.635Z STEP hand-in
- 2026-11-09T05:32:40.699Z DONE Witch's Potion
- 2026-11-09T05:32:40.699Z START Doric's Quest (attempt 1)
- 2026-11-09T05:32:40.699Z STEP prep
- 2026-11-09T05:32:40.699Z STEP mine-ores
- 2026-11-09T05:34:22.620Z STEP hand-in
- 2026-11-09T05:35:31.693Z DONE Doric's Quest


## Quest 6: Witch's Potion (1 QP)
- **Script**: `bots/bot4/dorics_and_witch.ts`
- **Steps Completed**:
  1. Equipped Bronze sword & Wooden shield from Draynor Bank, walked to Rimmington, and spoke to Hetty (`(2968, 3205)`).
  2. Killed a Rat at `(2956, 3203)` and picked up `Rat's tail`.
  3. Picked `Onion` at `(2952, 3251)`, bought `Eye of newt` from Betty (`(3014, 3259)`), bought `Raw beef` from Wydin (`(3014, 3204)`), and double-cooked it on the Rimmington range (`(2969, 3210)`) to produce `Burnt meat`.
  4. Handed the 4 ingredients to Hetty and drank from the Cauldron.
- **Verification**:
  - `DONE Witch's Potion`
  - Magic XP: `+8,125` (Level 1 -> 25)
  - Quest Points: `9 -> 10` (+1 QP)

## Quest 7: Doric's Quest (1 QP)
- **Script**: `bots/bot4/dorics_and_witch.ts`
- **Steps Completed**:
  1. Walked to Rimmington mine (`(2977, 3240)`) with Bronze pickaxe and mined `6 Clay`, `4 Copper ore`, and `2 Iron ore` (reaching Mining Level 15 from the clay + copper).
  2. Walked north past Falador to Doric's hut (`(2951, 3451)`) and delivered the ores to Doric.
- **Verification**:
  - Game message: `Congratulations! Quest complete!` (`Doric hands you 180 coins.`)
  - Mining XP: `+36,750` (Level 1 -> 40), Coins: `259`
  - Quest Points: `10 -> 11` (+1 QP)
- 2026-11-09T05:36:19.655Z START Ernest the Chicken (attempt 1)
- 2026-11-09T05:36:19.655Z STEP start-veronica-and-oddenstein
- 2026-11-09T05:37:29.236Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T05:38:58.075Z STEP pressure-gauge
- 2026-11-09T05:39:53.529Z STEP rubber-tube
- 2026-11-09T05:40:38.646Z STEP oil-can
- 2026-11-09T05:42:28.133Z STEP hand-in
- 2026-11-09T05:42:59.522Z DONE Ernest the Chicken
- 2026-11-09T05:42:59.522Z START Vampyre Slayer (attempt 1)
- 2026-11-09T05:42:59.523Z STEP morgan-and-garlic


## Quest 8: Ernest the Chicken (4 QP)
- **Script**: `bots/bot4/ernest_and_vampyre.ts`
- **Steps Completed**:
  1. Spoke to Veronica outside Draynor Manor (`(3110, 3330)`), picked up `Fish food` on L1 (`(3108, 3356)`), and spoke to Professor Oddenstein on L2 (`(3110, 3366)`).
  2. Picked up `Poison` (`(3097, 3366)`), combined with `Fish food` to make `Poisoned fish food`, poisoned the fountain (`(3088, 3335)`), and searched it to obtain `Pressure gauge`.
  3. Picked up `Spade` (`(3120, 3359)`), dug the `Compost heap` (`(3086, 3361)`) for `Key`, unlocked the skeleton room (`(3107, 3367)`), and picked up `Rubber tube`.
  4. Entered the secret bookcase passage (`(3098, 3358)`), solved the Draynor Manor basement lever puzzle (`A, B -> D -> B, A -> E, F -> C -> E`), picked up `Oil can`, and climbed back up.
  5. Handed `Pressure gauge`, `Rubber tube`, and `Oil can` to Professor Oddenstein on L2 to transform Ernest back into a human.
- **Verification**:
  - `DONE Ernest the Chicken`
  - Reward: `+300 Coins`, `+4 Quest Points` (Total QP: `15`)

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

## World Interaction Audit — Session 1
### Region Completed: Lumbridge Castle (m50_50 L0, L1, L2 & Cellar m50_150) — 2026-11-09T05:51:20.131Z
- **Total Interactions Audited**: 52 (30 verified working, 22 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3215, 3211, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3215, 3211). Actual: success=false (Can't reach Door), opRejectedDelta=2, messages="I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3215, 3225, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3215, 3225). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3212, 3220, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Large door` (id `1517`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Large door at (3212, 3220). Actual: success=false (Nothing happened interacting with Large door), opRejectedDelta=0, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3233, 3207, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Door` (id `1531`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Door at (3233, 3207). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3232, 3206, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Bookcase` (id `380`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (3232, 3206). Actual: success=false (Can't reach Bookcase), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3225, 3232, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Tree` (id `1278`) — action `Chop down`
  - **Expected vs Actual**: Expected: Interact "Chop down" with Tree at (3225, 3232). Actual: success=true (Interacted with Tree), opRejectedDelta=1, messages="You do not have an axe which you have the level to use.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3215, 3226, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Door` (id `1537`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Door at (3215, 3226). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3205, 3212, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Crate` (id `354`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3205, 3212). Actual: success=false (Can't reach Crate), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3207, 3226, L0)` — Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)
  - **Object & Action**: `Door` (id `1537`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Door at (3207, 3226). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3207, 3210, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door on Castle L1. Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3209, 3212, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Spinning wheel` (id `2644`) — action `Spin`
  - **Expected vs Actual**: Expected: Interact "Spin" with Spinning wheel on Castle L1. Actual: success=true (Interacted with Spinning wheel), opRejectedDelta=2, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3209, 3218, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest on Castle L1. Actual: success=true (Interacted with Closed chest), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3210, 3218, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Crate` (id `366`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate on Castle L1. Actual: success=false (Can't reach Crate), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3208, 3210, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Door` (id `1531`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Door on Castle L1. Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3207, 3222, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door on Castle L1. Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3208, 3227, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Door` (id `1531`) — action `Close`
  - **Expected vs Actual**: Expected: Interact "Close" with Door on Castle L1. Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3208, 3228, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Crate` (id `357`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate on Castle L1. Actual: success=false (Can't reach Crate), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3207, 3227, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door on Castle L1. Actual: success=false (Nothing happened interacting with Door), opRejectedDelta=0, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3204, 3229, L1)` — Lumbridge Castle - First Floor (m50_50 L1)
  - **Object & Action**: `Staircase` (id `1739`) — action `Climb-up`
  - **Expected vs Actual**: Expected: Climb north staircase from L1 to L2. Actual: success=true (Interacted with Staircase), opRejectedDelta=2, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3205, 3222, L2)` — Lumbridge Castle - Second Floor / Roof (m50_50 L2)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks on Castle L2. Actual: success=false (Nothing happened interacting with Sacks), opRejectedDelta=0, messages="There's nothing interesting in these sacks.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3205, 3218, L2)` — Lumbridge Castle - Second Floor / Roof (m50_50 L2)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks on Castle L2. Actual: success=true (Interacted with Sacks), opRejectedDelta=1, messages="There's nothing interesting in these sacks.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3205, 3208, L2)` — Lumbridge Castle - Second Floor / Roof (m50_50 L2)
  - **Object & Action**: `Staircase` (id `1740`) — action `Climb-down`
  - **Expected vs Actual**: Expected: Climb south staircase from L2 to L1. Actual: success=true (Interacted with Staircase), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3226, 3223, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3226, 3214, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3217, 3218, L0)` **Large door** (id `1516`) [`Open`] -> OK: Interacted with Large door
- `(3217, 3219, L0)` **Large door** (id `1519`) [`Open`] -> OK: Interacted with Large door
- `(3216, 3218, L0)` **Large door** (id `1517`) [`Close`] -> OK: Interacted with Large door
- `(3216, 3219, L0)` **Large door** (id `1520`) [`Close`] -> OK: Interacted with Large door
- `(3227, 3214, L0)` **Door** (id `1531`) [`Close`] -> OK: Interacted with Door
- `(3212, 3221, L0)` **Large door** (id `1520`) [`Close`] -> OK: Interacted with Large door
- `(3218, 3205, L0)` **Oak** (id `1281`) [`Chop down`] -> OK: Interacted with Oak | "You need a Woodcutting level of 15 to chop down this tree."
- `(3227, 3223, L0)` **Door** (id `1531`) [`Close`] -> OK: Interacted with Door
- `(3208, 3211, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3207, 3217, L0)` **Door** (id `1536`) [`Open`] -> OK: Interacted with Door
- `(3235, 3230, L0)` **Tree** (id `1278`) [`Chop down`] -> OK: Interacted with Tree | "You do not have an axe which you have the level to use."
- `(3230, 3235, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3217, 3231, L0)` **Tree** (id `1278`) [`Chop down`] -> OK: Interacted with Tree | "You do not have an axe which you have the level to use."
- `(3212, 3232, L0)` **Tree** (id `1278`) [`Chop down`] -> OK: Interacted with Tree | "You do not have an axe which you have the level to use."
- `(3208, 3212, L0)` **Door** (id `1531`) [`Close`] -> OK: Interacted with Door
- `(3215, 3212, L0)` **Door** (id `1537`) [`Close`] -> OK: Interacted with Door
- `(3207, 3218, L0)` **Door** (id `1537`) [`Close`] -> OK: Interacted with Door
- `(3207, 3225, L0)` **Door** (id `1536`) [`Open`] -> OK: Interacted with Door
- `(3206, 3212, L0)` **Crate** (id `366`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."
- `(3205, 3217, L0)` **Crate** (id `355`) [`Search`] -> OK: Interacted with Crate | "You search the crates but find nothing of value."
- `(3209, 3216, L0)` **Trapdoor** (id `1568`) [`Open`] -> OK: Interacted with Trapdoor | "The trapdoor opens..."
- `(3204, 3207, L0)` **Staircase** (id `1738`) [`Climb-up`] -> OK: Interacted with Staircase | moved to (3205, 3209, L1)
- `(3207, 3214, L1)` **Door** (id `1536`) [`Open`] -> OK: Interacted with Door
- `(3211, 3209, L1)` **Crate** (id `357`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."
- `(3213, 3216, L1)` **Drawers** (id `352`) [`Open`] -> OK: Interacted with Drawers
- `(3208, 3214, L1)` **Door** (id `1537`) [`Close`] -> OK: Interacted with Door
- `(3208, 3222, L1)` **Door** (id `1537`) [`Close`] -> OK: Interacted with Door
- `(3204, 3207, L1)` **Staircase** (id `1739`) [`Climb-down`] -> OK: Interacted with Staircase | moved to (3205, 3209, L0)


### Region Completed: Lumbridge Castle Cellar / Basement (m50_150) — 2026-11-09T05:56:24.576Z
- **Total Interactions Audited**: 3 (1 verified working, 2 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3216, 9618, L0)` — Lumbridge Castle Cellar / Basement (m50_150)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks at (3216, 9618). Actual: success=true (Interacted with Sacks), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3219, 9617, L0)` — Lumbridge Castle Cellar / Basement (m50_150)
  - **Object & Action**: `Crate` (id `357`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3219, 9617). Actual: success=true (Interacted with Crate), opRejectedDelta=1, messages="You search the crate but find nothing.", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3218, 9619, L0)` **Crate** (id `358`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."

### Region Completed: Lumbridge Town, Church, Graveyard & East River Lum (m50_50) — 2026-11-09T05:59:07.095Z
- **Total Interactions Audited**: 21 (10 verified working, 11 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3232, 3206, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Bookcase` (id `380`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (3232, 3206). Actual: success=true (Interacted with Bookcase), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3243, 3216, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Large door` (id `1519`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Large door at (3243, 3216). Actual: success=false (Nothing happened interacting with Large door), opRejectedDelta=2, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3244, 3216, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Large door` (id `1516`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Large door at (3244, 3216). Actual: success=true (Interacted with Large door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3249, 3201, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Yew` (id `1309`) — action `Chop down`
  - **Expected vs Actual**: Expected: Interact "Chop down" with Yew at (3249, 3201). Actual: success=true (Interacted with Yew), opRejectedDelta=1, messages="You need a Woodcutting level of 60 to chop down this tree.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3249, 3192, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Coffin` (id `2145`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Coffin at (3249, 3192). Actual: success=true (Interacted with Coffin), opRejectedDelta=1, messages="You open the coffin.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3249, 3192, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Coffin` (id `2145`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Coffin at (3249, 3192). Actual: success=true (Interacted with Coffin), opRejectedDelta=2, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3249, 3192, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Coffin` (id `2146`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Coffin at (3249, 3192). Actual: success=true (Interacted with Coffin), opRejectedDelta=2, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3213, 3243, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Crate` (id `366`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3213, 3243). Actual: success=true (Interacted with Crate), opRejectedDelta=2, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3213, 3261, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Gate` (id `1551`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Gate at (3213, 3261). Actual: success=true (Interacted with Gate), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3248, 3244, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Boxes` (id `359`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Boxes at (3248, 3244). Actual: success=true (Interacted with Boxes), opRejectedDelta=1, messages="There is nothing interesting in these boxes.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3268, 3228, L0)` — Lumbridge Town, Church, Graveyard & East River Lum (m50_50)
  - **Object & Action**: `Gate` (id `2883`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Gate at (3268, 3228). Actual: success=true (Interacted with Gate), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3234, 3207, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3238, 3210, L0)` **Door** (id `1533`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3235, 3198, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3243, 3205, L0)` **Altar** (id `409`) [`Pray-at`] -> OK: Interacted with Altar | "You already have full prayer points."
- `(3249, 3192, L0)` **Coffin** (id `2146`) [`Close`] -> OK: Interacted with Coffin | "You close the coffin."
- `(3226, 3255, L0)` **Furnace** (id `2781`) [`Smelt`] -> OK: Interacted with Furnace
- `(3233, 3244, L0)` **Willow** (id `1308`) [`Chop down`] -> OK: Interacted with Willow | "You need a Woodcutting level of 30 to chop down this tree."
- `(3213, 3262, L0)` **Gate** (id `1553`) [`Open`] -> OK: Nothing happened interacting with Gate (loc state changed)
- `(3252, 3237, L0)` **Oak** (id `1281`) [`Chop down`] -> OK: Interacted with Oak | "You need a Woodcutting level of 15 to chop down this tree."
- `(3268, 3227, L0)` **Gate** (id `2882`) [`Open`] -> OK: Interacted with Gate

### Region Completed: Lumbridge Swamp & Mining Site (m50_49 & m49_49) — 2026-11-09T06:01:27.537Z
- **Total Interactions Audited**: 18 (10 verified working, 8 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3231, 3153, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Bookcase` (id `381`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (3231, 3153). Actual: success=true (Interacted with Bookcase), opRejectedDelta=2, messages="You search the bookcase...", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3238, 3153, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Boxes` (id `361`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Boxes at (3238, 3153). Actual: success=true (Interacted with Boxes), opRejectedDelta=1, messages="You don't find anything that you'd ever want to read. | There is nothing interesting in these boxes.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3242, 3160, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Rocks mithril ore` (id `2103`) — action `Mine`
  - **Expected vs Actual**: Expected: Interact "Mine" with Rocks mithril ore at (3242, 3160). Actual: success=true (Interacted with Rocks mithril ore), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3243, 3164, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Rocks adamantite ore` (id `2105`) — action `Mine`
  - **Expected vs Actual**: Expected: Interact "Mine" with Rocks adamantite ore at (3243, 3164). Actual: success=true (Interacted with Rocks adamantite ore), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3242, 3165, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Rocks adamantite ore` (id `2104`) — action `Mine`
  - **Expected vs Actual**: Expected: Interact "Mine" with Rocks adamantite ore at (3242, 3165). Actual: success=true (Interacted with Rocks adamantite ore), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3233, 3167, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Rocks coal ore` (id `2097`) — action `Mine`
  - **Expected vs Actual**: Expected: Interact "Mine" with Rocks coal ore at (3233, 3167). Actual: success=true (Interacted with Rocks coal ore), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3200, 3145, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Waypoint: Swamp South Coast Edge` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Swamp South Coast Edge at (3200, 3145). Actual: walkTo failed: Stuck at (3202, 3169)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3147, 3175, L0)` — Lumbridge Swamp & Mining Site (m50_49 & m49_49)
  - **Object & Action**: `Waypoint: Swamp West Shack` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Swamp West Shack at (3147, 3175). Actual: walkTo failed: Stuck at (3152, 3175)
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3235, 3156, L0)` **Crate** (id `356`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."
- `(3236, 3155, L0)` **Crate** (id `357`) [`Search`] -> OK: Interacted with Crate | "You search the crate..."
- `(3242, 3160, L0)` **Rocks mithril ore** (id `2103`) [`Prospect`] -> OK: Nothing happened interacting with Rocks mithril ore | "You examine the rock for ores... | This rock contains mithril."
- `(3243, 3157, L0)` **Rocks mithril ore** (id `2102`) [`Mine`] -> OK: Interacted with Rocks mithril ore
- `(3243, 3157, L0)` **Rocks mithril ore** (id `2102`) [`Prospect`] -> OK: Nothing happened interacting with Rocks mithril ore | "You examine the rock for ores... | This rock contains mithril."
- `(3243, 3164, L0)` **Rocks adamantite ore** (id `2105`) [`Prospect`] -> OK: Nothing happened interacting with Rocks adamantite ore | "You examine the rock for ores... | This rock contains adamantite."
- `(3235, 3165, L0)` **Rocks coal ore** (id `2096`) [`Mine`] -> OK: Interacted with Rocks coal ore
- `(3235, 3165, L0)` **Rocks coal ore** (id `2096`) [`Prospect`] -> OK: Nothing happened interacting with Rocks coal ore | "You examine the rock for ores... | This rock contains coal."
- `(3242, 3165, L0)` **Rocks adamantite ore** (id `2104`) [`Prospect`] -> OK: Nothing happened interacting with Rocks adamantite ore | "You examine the rock for ores... | This rock contains adamantite."
- `(3233, 3167, L0)` **Rocks coal ore** (id `2097`) [`Prospect`] -> OK: Nothing happened interacting with Rocks coal ore | "You examine the rock for ores... | This rock contains coal."

### Region Completed: West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51) — 2026-11-09T06:04:17.746Z
- **Total Interactions Audited**: 26 (15 verified working, 11 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3188, 3275, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Crate` (id `366`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3188, 3275). Actual: success=true (Interacted with Crate), opRejectedDelta=1, messages="You search the crate but find nothing.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3185, 3274, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Open chest` (id `378`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Open chest at (3185, 3274). Actual: success=true (Interacted with Open chest), opRejectedDelta=1, messages="You find nothing.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3188, 3274, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Crate` (id `354`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3188, 3274). Actual: success=true (Interacted with Crate), opRejectedDelta=2, messages="You search the crate but find nothing.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3192, 3275, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks at (3192, 3275). Actual: success=true (Interacted with Sacks), opRejectedDelta=2, messages="There's nothing interesting in these sacks.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3192, 3273, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (3192, 3273). Actual: success=false (Nothing happened interacting with Closed chest), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3194, 3285, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `cabbage` (id `1161`) — action `Pick`
  - **Expected vs Actual**: Expected: Interact "Pick" with cabbage at (3194, 3285). Actual: success=true (Interacted with cabbage), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3187, 3270, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Crate` (id `355`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3187, 3270). Actual: success=true (Interacted with Crate), opRejectedDelta=3, messages="You pick a cabbage. | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3179, 3289, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Gate` (id `1553`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Gate at (3179, 3289). Actual: success=true (Interacted with Gate), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3166, 3307, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Flour bin` (id `1781`) — action `Empty`
  - **Expected vs Actual**: Expected: Interact "Empty" with Flour bin at (3166, 3307). Actual: success=true (Interacted with Flour bin), opRejectedDelta=1, messages="The flour bin is already empty.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3161, 3301, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Haystack` (id `300`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Haystack at (3161, 3301). Actual: success=true (Interacted with Haystack), opRejectedDelta=2, messages="You pick some grain.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3152, 3290, L0)` — West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)
  - **Object & Action**: `Potato` (id `312`) — action `Pick`
  - **Expected vs Actual**: Expected: Interact "Pick" with Potato at (3152, 3290). Actual: success=true (Interacted with Potato), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3189, 3275, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3185, 3274, L0)` **Open chest** (id `378`) [`Shut`] -> OK: Interacted with Open chest
- `(3188, 3272, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3186, 3269, L0)` **Gate** (id `1553`) [`Open`] -> OK: Interacted with Gate (loc state changed)
- `(3197, 3282, L0)` **Gate** (id `1553`) [`Open`] -> OK: Interacted with Gate (loc state changed)
- `(3178, 3270, L0)` **Willow** (id `1308`) [`Chop down`] -> OK: Interacted with Willow | "You need a Woodcutting level of 30 to chop down this tree."
- `(3186, 3268, L0)` **Gate** (id `1551`) [`Open`] -> OK: Interacted with Gate (loc state changed)
- `(3188, 3268, L0)` **Onion** (id `3366`) [`Pick`] -> OK: Interacted with Onion | "You pick an onion."
- `(3198, 3282, L0)` **Gate** (id `1551`) [`Open`] -> OK: Interacted with Gate (loc state changed)
- `(3180, 3289, L0)` **Gate** (id `1551`) [`Open`] -> OK: Nothing happened interacting with Gate (loc state changed)
- `(3186, 3266, L0)` **Boxes** (id `361`) [`Search`] -> OK: Interacted with Boxes
- `(3187, 3266, L0)` **Crate** (id `357`) [`Search`] -> OK: Interacted with Crate
- `(3192, 3273, L0)` **Open chest** (id `378`) [`Search`] -> OK: Interacted with Open chest | "You find nothing."
- `(3192, 3273, L0)` **Open chest** (id `378`) [`Shut`] -> OK: Interacted with Open chest
- `(3162, 3299, L0)` **Wheat** (id `313`) [`Pick`] -> OK: Interacted with Wheat

### Region Completed: Draynor Village, Bank, Market & Prison (m48_50 & m49_50) — 2026-11-09T06:08:33.247Z
- **Total Interactions Audited**: 28 (15 verified working, 13 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3123, 3243, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Prison Door` (id `2881`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Prison Door at (3123, 3243). Actual: success=true (Interacted with Prison Door), opRejectedDelta=1, messages="The door is locked. | The door is locked.", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3121, 3244, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Crate` (id `358`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3121, 3244). Actual: success=false (Can't reach Crate), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3124, 3254, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Oak` (id `1281`) — action `Chop down`
  - **Expected vs Actual**: Expected: Interact "Chop down" with Oak at (3124, 3254). Actual: success=false (Cannot reach Oak: Stuck at (3125, 3251)), opRejectedDelta=2, messages="The door is locked. | Oh dear you are dead!", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3096, 3266, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (3096, 3266). Actual: success=true (Interacted with Closed chest), opRejectedDelta=2, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3091, 3276, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Crate` (id `356`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3091, 3276). Actual: success=true (Interacted with Crate), opRejectedDelta=0, messages="I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3100, 3276, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3100, 3276). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3097, 3277, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Drawers` (id `350`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Drawers at (3097, 3277). Actual: success=false (Can't reach Drawers), opRejectedDelta=0, messages="I can't reach that! | I can't reach that! | I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3107, 3271, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Wheat` (id `313`) — action `Pick`
  - **Expected vs Actual**: Expected: Interact "Pick" with Wheat at (3107, 3271). Actual: success=true (Interacted with Wheat), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3107, 3273, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Gate` (id `1551`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Gate at (3107, 3273). Actual: success=true (Interacted with Gate), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3107, 3274, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Gate` (id `1553`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Gate at (3107, 3274). Actual: success=false (Nothing happened interacting with Gate), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3101, 3258, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3101, 3258). Actual: success=false (Nothing happened interacting with Door), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3102, 3281, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Bookcase` (id `381`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (3102, 3281). Actual: success=true (Interacted with Bookcase), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3096, 3266, L0)` — Draynor Village, Bank, Market & Prison (m48_50 & m49_50)
  - **Object & Action**: `Open chest` (id `378`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Open chest at (3096, 3266). Actual: success=true (Interacted with Open chest), opRejectedDelta=2, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3122, 3244, L0)` **Crate** (id `357`) [`Search`] -> OK: Nothing happened interacting with Crate | "You search the crate but find nothing."
- `(3096, 3267, L0)` **Closed chest** (id `375`) [`Open`] -> OK: Interacted with Closed chest
- `(3092, 3268, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3092, 3274, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3090, 3277, L0)` **Sacks** (id `365`) [`Search`] -> OK: Interacted with Sacks
- `(3088, 3258, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3096, 3267, L0)` **Open chest** (id `378`) [`Search`] -> OK: Interacted with Open chest | "You find nothing."
- `(3096, 3267, L0)` **Open chest** (id `378`) [`Shut`] -> OK: Interacted with Open chest
- `(3083, 3256, L0)` **Wardrobe** (id `388`) [`Open`] -> OK: Interacted with Wardrobe
- `(3096, 3266, L0)` **Open chest** (id `378`) [`Shut`] -> OK: Interacted with Open chest
- `(3091, 3243, L0)` **Bank booth** (id `2213`) [`Use`] -> OK: Interacted with Bank booth
- `(3091, 3243, L0)` **Bank booth** (id `2213`) [`Use-quickly`] -> OK: Interacted with Bank booth
- `(3085, 3235, L0)` **Willow** (id `1308`) [`Chop down`] -> OK: Interacted with Willow | "You need a Woodcutting level of 30 to chop down this tree."
- `(3083, 3256, L0)` **Wardrobe** (id `389`) [`Search`] -> OK: Interacted with Wardrobe
- `(3083, 3256, L0)` **Wardrobe** (id `389`) [`Close`] -> OK: Interacted with Wardrobe

### Region Completed: Wizards' Tower Island & Ground/Basement (m48_49) — 2026-11-09T06:09:32.053Z
- **Total Interactions Audited**: 6 (3 verified working, 3 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3111, 3163, L0)` — Wizards' Tower Island & Ground/Basement (m48_49)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3111, 3163). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3107, 3162, L0)` — Wizards' Tower Island & Ground/Basement (m48_49)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3107, 3162). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3104, 3150, L0)` — Wizards' Tower Island & Ground/Basement (m48_49)
  - **Object & Action**: `Oak` (id `1281`) — action `Chop down`
  - **Expected vs Actual**: Expected: Interact "Chop down" with Oak at (3104, 3150). Actual: success=true (Interacted with Oak), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3112, 3194, L0)` **Boxes** (id `359`) [`Search`] -> OK: Nothing happened interacting with Boxes | "There is nothing interesting in these boxes."
- `(3109, 3166, L0)` **Door** (id `1536`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3113, 3160, L0)` **Bookcase** (id `380`) [`Search`] -> OK: Interacted with Bookcase | "You search the bookcase..."

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

### Region Completed: Al Kharid Town, Palace, Bank, Furnace & Shantay Pass (m51_49 & m51_50) — 2026-11-09T06:17:56.549Z
- **Total Interactions Audited**: 11 (8 verified working, 3 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3293, 3174, L0)` — Al Kharid Town, Palace, Bank, Furnace & Shantay Pass (m51_49 & m51_50)
  - **Object & Action**: `Waypoint: Al Kharid Palace Courtyard` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Al Kharid Palace Courtyard at (3293, 3174). Actual: walkTo failed: Walk timed out after 120000ms: at (3267, 3228), destination (3293, 3174)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3269, 3167, L0)` — Al Kharid Town, Palace, Bank, Furnace & Shantay Pass (m51_49 & m51_50)
  - **Object & Action**: `Waypoint: Al Kharid Bank` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Al Kharid Bank at (3269, 3167). Actual: walkTo failed: Walk timed out after 120000ms: at (3252, 3254), destination (3269, 3167)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3275, 3186, L0)` — Al Kharid Town, Palace, Bank, Furnace & Shantay Pass (m51_49 & m51_50)
  - **Object & Action**: `Waypoint: Al Kharid Furnace & Tanning` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Al Kharid Furnace & Tanning at (3275, 3186). Actual: walkTo failed: Walk timed out after 120000ms: at (3267, 3228), destination (3275, 3186)
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3291, 3189, L0)` **Curtain** (id `1529`) [`Close`] -> OK: Interacted with Curtain
- `(3296, 3206, L0)` **Crate** (id `357`) [`Search`] -> OK: Interacted with Crate
- `(3308, 3206, L0)` **Boxes** (id `361`) [`Search`] -> OK: Interacted with Boxes | "There is nothing interesting in these boxes."
- `(3316, 3177, L0)` **Crate** (id `356`) [`Search`] -> OK: Interacted with Crate
- `(3317, 3179, L0)` **Crate** (id `358`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."
- `(3314, 3174, L0)` **Sacks** (id `365`) [`Search`] -> OK: Interacted with Sacks
- `(3309, 3120, L0)` **Shantay chest** (id `2693`) [`Open`] -> OK: Interacted with Shantay chest
- `(3297, 3124, L0)` **Prison door** (id `2692`) [`Open`] -> OK: Timed out after 4500ms (loc state changed)

### Region Completed: Region 7b: Al Kharid Palace, Bank, Furnace & North Mine (m51_49, m51_50, m51_51) (2026-11-09T06:20:00.431Z)
- **Objects/Interactions Audited**: 5 (5 working normally, 0 anomalies/findings)
- Audited Al Kharid Palace Courtyard, Bank, Furnace, North Scorpion Pit Mine, and exited north via (3282, 3318) bypassing the toll gate.
- **Findings**: No broken interactions found in this region.

### Region Completed: Region 11: South Varrock, Champions' Guild, Stone Circle & Mines (m49_51, m50_51, m50_52, m51_52) (2026-11-09T06:21:02.420Z)
- **Objects/Interactions Audited**: 5 (5 working normally, 0 anomalies/findings)
- Audited SE Varrock Mine, Varrock South Gate, Stone Circle, Champions' Guild entrance, and SW Varrock Mine.
- **Findings**: No broken interactions found in this region.

### Region Completed: Region 12: Varrock Town, Square, Palace, Churches & Banks (m49_52, m50_52, m50_53, m51_52) (2026-11-09T06:22:54.460Z)
- **Objects/Interactions Audited**: 9 (8 working normally, 1 anomalies/findings)
- Audited Varrock West Bank, West Anvils, Town Square, Blue Moon Inn, East Bank, Museum, Church, Palace Courtyard, and West Gate.

#### Findings in Region 12: Varrock Town, Square, Palace, Churches & Banks (m49_52, m50_52, m50_53, m51_52)
- **Coordinates & Region**: `(3153, 3433, L0) [player at (3154, 3426, L0)]` (Region 12: Varrock Town, Square, Palace, Churches & Banks (m49_52, m50_52, m50_53, m51_52))
  - **Object & Action**: `Waypoint: Varrock West Gate` -> `walkTo(3153, 3433)`
  - **Expected**: Reachable navigation to Varrock West Gate
  - **Actual**: walkTo failed: Path to (3153, 3433) stops 5 tiles short at (3148, 3433) - the rest is unroutable from here (locked door or separate room?)
  - **Severity**: **Blocks progress**

### Region Completed: Region 10: Draynor Manor Grounds & Ground Floor (m48_51 & m48_52) (2026-11-09T06:24:04.832Z)
- **Objects/Interactions Audited**: 4 (4 working normally, 0 anomalies/findings)
- Audited Draynor Manor gates, grounds, fountain, compost heap, and entrance doors.
- **Findings**: No broken interactions found in this region.

### Region Completed: Region 13: Barbarian Village & Edgeville (m48_53 & m48_54) (2026-11-09T06:25:39.626Z)
- **Objects/Interactions Audited**: 6 (6 working normally, 0 anomalies/findings)
- Audited Barbarian Village mine, longhall, pottery oven/wheel, Edgeville bank, ruined houses, and Monastery exterior.
- **Findings**: No broken interactions found in this region.

### Region Completed: Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50) — 2026-11-09T06:30:24.846Z
- **Total Interactions Audited**: 20 (10 verified working, 10 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3011, 3221, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Crate` (id `358`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3011, 3221). Actual: success=true (Interacted with Crate), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3012, 3204, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Door` (id `2069`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3012, 3204). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3015, 3203, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Crate` (id `354`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3015, 3203). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3016, 3203, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Crate` (id `355`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3016, 3203). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3011, 3203, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Crate` (id `366`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3011, 3203). Actual: success=true (Interacted with Crate), opRejectedDelta=1, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3009, 3205, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks at (3009, 3205). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3011, 3197, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3011, 3197). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3030, 3217, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Gangplank` (id `2083`) — action `Cross`
  - **Expected vs Actual**: Expected: Interact "Cross" with Gangplank at (3030, 3217). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2964, 3209, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (2964, 3209). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2956, 3205, L0)` — Port Sarim Docks, Shops & Rimmington (m46_50 & m47_50)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (2956, 3205). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3015, 3261, L0)` **Wardrobe** (id `388`) [`Open`] -> OK: Interacted with Wardrobe
- `(3023, 3259, L0)` **Drawers** (id `348`) [`Open`] -> OK: Interacted with Drawers
- `(3012, 3221, L0)` **Crate** (id `357`) [`Search`] -> OK: Interacted with Crate
- `(3012, 3222, L0)` **Crate** (id `356`) [`Search`] -> OK: Interacted with Crate | "You search the crate but find nothing."
- `(3016, 3207, L0)` **Closed chest** (id `375`) [`Open`] -> OK: Interacted with Closed chest
- `(3019, 3209, L0)` **Boxes** (id `360`) [`Search`] -> OK: Interacted with Boxes | "There is nothing interesting in these boxes."
- `(3009, 3207, L0)` **Crate** (id `2071`) [`Search`] -> OK: Timed out after 4500ms | "You search the crates..."
- `(2967, 3205, L0)` **Cauldron** (id `2024`) [`Drink From`] -> OK: Interacted with Cauldron
- `(2965, 3208, L0)` **Wardrobe** (id `389`) [`Search`] -> OK: Interacted with Wardrobe
- `(2965, 3208, L0)` **Wardrobe** (id `389`) [`Close`] -> OK: Interacted with Wardrobe

### Region Completed: South Falador Farm & Falador Town (m46_51 & m46_52) — 2026-11-09T06:32:07.843Z
- **Total Interactions Audited**: 5 (3 verified working, 2 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(2962, 3373, L0)` — South Falador Farm & Falador Town (m46_51 & m46_52)
  - **Object & Action**: `Bookcase` (id `381`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (2962, 3373). Actual: success=true (Interacted with Bookcase), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3011, 3354, L0)` — South Falador Farm & Falador Town (m46_51 & m46_52)
  - **Object & Action**: `Bank booth` (id `2213`) — action `Use`
  - **Expected vs Actual**: Expected: Interact "Use" with Bank booth at (3011, 3354). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(2962, 3350, L0)` **Boxes** (id `359`) [`Search`] -> OK: Timed out after 4500ms (loc state changed)
- `(2963, 3350, L0)` **Boxes** (id `361`) [`Search`] -> OK: Interacted with Boxes (loc state changed)
- `(3011, 3354, L0)` **Bank booth** (id `2213`) [`Use-quickly`] -> OK: Interacted with Bank booth

### Region Completed: North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54) — 2026-11-09T06:34:52.251Z
- **Total Interactions Audited**: 17 (8 verified working, 9 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(2949, 3450, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (2949, 3450). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2952, 3453, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (2952, 3453). Actual: success=false (Nothing happened interacting with Door), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(2957, 3509, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Large door` (id `1516`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Large door at (2957, 3509). Actual: success=true (Interacted with Large door), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(2952, 3501, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (2952, 3501). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2951, 3507, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Sacks` (id `365`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Sacks at (2951, 3507). Actual: success=true (Interacted with Sacks), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2956, 3512, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (2956, 3512). Actual: success=true (Interacted with Closed chest), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(2957, 3512, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (2957, 3512). Actual: success=true (Interacted with Closed chest), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3007, 3476, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Waypoint: Ice Mountain Summit & Oracle` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Ice Mountain Summit & Oracle at (3007, 3476). Actual: walkTo failed: Walk timed out after 45000ms to (3007, 3476)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3012, 3452, L0)` — North Falador, Doric's Hut, Goblin Village & Ice Mountain (m46_53, m46_54, m47_53, m47_54)
  - **Object & Action**: `Drawers` (id `350`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Drawers at (3012, 3452). Actual: success=true (Interacted with Drawers), opRejectedDelta=1, messages="The door is locked. | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(2960, 3507, L0)` **Sacks** (id `23`) [`Prod`] -> OK: Interacted with Sacks
- `(2960, 3507, L0)` **Sacks** (id `23`) [`Open`] -> OK: Interacted with Sacks | "I have no reason to do that."
- `(2954, 3505, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(2958, 3509, L0)` **Large door** (id `1519`) [`Open`] -> OK: Nothing happened interacting with Large door (loc state changed)
- `(2951, 3508, L0)` **Boxes** (id `359`) [`Search`] -> OK: Interacted with Boxes
- `(2955, 3512, L0)` **Closed chest** (id `375`) [`Open`] -> OK: Interacted with Closed chest
- `(3016, 3453, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door
- `(3015, 3453, L0)` **Door** (id `3`) [`Open`] -> OK: Interacted with Door | "The door is locked."

### Region Completed: Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54) — 2026-11-09T06:38:06.426Z
- **Total Interactions Audited**: 24 (12 verified working, 12 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3095, 3489, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Bank booth` (id `2213`) — action `Use`
  - **Expected vs Actual**: Expected: Interact "Use" with Bank booth at (3095, 3489). Actual: success=true (Interacted with Bank booth), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3081, 3490, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Drawers` (id `350`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Drawers at (3081, 3490). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3084, 3431, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Crate` (id `354`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Crate at (3084, 3431). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3073, 3430, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Boxes` (id `361`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Boxes at (3073, 3430). Actual: success=false (Timed out after 4500ms), opRejectedDelta=2, messages="You search the crate but find nothing.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3073, 3431, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Boxes` (id `360`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Boxes at (3073, 3431). Actual: success=false (Timed out after 4500ms), opRejectedDelta=3, messages="There is nothing interesting in these boxes.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3085, 3429, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (3085, 3429). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3076, 3427, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3076, 3427). Actual: success=true (Interacted with Door), opRejectedDelta=2, messages="This rock contains coal.", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3086, 3425, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Rocks tin ore` (id `2094`) — action `Mine`
  - **Expected vs Actual**: Expected: Interact "Mine" with Rocks tin ore at (3086, 3425). Actual: success=true (Interacted with Rocks tin ore), opRejectedDelta=3, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3105, 3355, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Wardrobe` (id `388`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Wardrobe at (3105, 3355). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="The doors won't open.", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3115, 3357, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Stairs` (id `2616`) — action `Walk-Down`
  - **Expected vs Actual**: Expected: Interact "Walk-Down" with Stairs at (3115, 3357). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="I can't reach that! | The doors won't open.", locUnchanged=true
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3109, 3358, L0)` — Edgeville, Barbarian Village & Draynor Manor Objects (m48_52, m48_53, m48_54)
  - **Object & Action**: `Door` (id `1530`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3109, 3358). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)
- `(3049, 3483, L0)` **Bookcase** (id `380`) [`Search`] -> OK: Interacted with Bookcase
- `(3095, 3489, L0)` **Bank booth** (id `2213`) [`Use-quickly`] -> OK: Interacted with Bank booth
- `(3081, 3430, L0)` **Spinning wheel** (id `2644`) [`Spin`] -> OK: Interacted with Spinning wheel
- `(3084, 3428, L0)` **Sacks** (id `365`) [`Search`] -> OK: Interacted with Sacks
- `(3087, 3431, L0)` **Rocks coal ore** (id `2096`) [`Mine`] -> OK: Interacted with Rocks coal ore
- `(3087, 3431, L0)` **Rocks coal ore** (id `2096`) [`Prospect`] -> OK: Interacted with Rocks coal ore | "You examine the rock for ores..."
- `(3082, 3427, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3085, 3429, L0)` **Open chest** (id `378`) [`Search`] -> OK: Interacted with Open chest
- `(3085, 3429, L0)` **Open chest** (id `378`) [`Shut`] -> OK: Interacted with Open chest
- `(3086, 3425, L0)` **Rocks tin ore** (id `2094`) [`Prospect`] -> OK: Interacted with Rocks tin ore | "You examine the rock for ores..."
- `(3108, 3353, L0)` **Large door** (id `134`) [`Open`] -> OK: Interacted with Large door
- `(3109, 3353, L0)` **Large door** (id `135`) [`Open`] -> OK: Interacted with Large door (loc state changed) | "The doors slam shut behind you."


### Region Completed: Draynor Manor Crypt & Back Conservatory Exit (m48_152 & m48_52) — 2026-11-09T06:40:54.658Z
- **Total Interactions Audited**: 1 (0 verified working, 1 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3077, 9775, L0)` — Draynor Manor Crypt & Back Conservatory Exit (m48_152 & m48_52)
  - **Object & Action**: `Coffin` (id `2614`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Coffin at (3077, 9775). Actual: success=true (Interacted with Coffin), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**

#### Verified Working Interactions (Summary)

### Region Completed: Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52) — 2026-11-09T06:45:42.057Z
- **Total Interactions Audited**: 20 (12 verified working, 8 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3185, 3436, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Waypoint: Varrock West Bank & Anvil House` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Varrock West Bank & Anvil House at (3185, 3436). Actual: walkTo failed: Walk timed out after 45000ms to (3185, 3436)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3212, 3472, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Waypoint: Varrock Palace Courtyard & Ground Floor` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Varrock Palace Courtyard & Ground Floor at (3212, 3472). Actual: walkTo failed: Stuck at (3212, 3438)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3258, 3484, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Door` (id `1536`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3258, 3484). Actual: success=true (Interacted with Door), opRejectedDelta=1, messages="none", locUnchanged=false
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3256, 3488, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Closed chest` (id `375`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Closed chest at (3256, 3488). Actual: success=true (Interacted with Closed chest), opRejectedDelta=1, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3229, 3395, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Bookcase` (id `381`) — action `Search`
  - **Expected vs Actual**: Expected: Interact "Search" with Bookcase at (3229, 3395). Actual: success=false (Timed out after 4500ms), opRejectedDelta=1, messages="I can't reach that! | I can't reach that!", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3237, 3394, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Drawers` (id `350`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Drawers at (3237, 3394). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="none", locUnchanged=true
  - **Impact**: **Cosmetic**
- **Coordinates & Region**: `(3286, 3365, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Waypoint: South-East Varrock Mine` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to South-East Varrock Mine at (3286, 3365). Actual: walkTo failed: Walk timed out after 45000ms to (3286, 3365)
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3192, 3354, L0)` — Varrock & South Varrock Object Interactions (m49_51, m49_52, m50_51, m50_52, m50_53, m51_52)
  - **Object & Action**: `Door` (id `1533`) — action `Open`
  - **Expected vs Actual**: Expected: Interact "Open" with Door at (3192, 3354). Actual: success=false (Timed out after 4500ms), opRejectedDelta=0, messages="I can't reach that!", locUnchanged=true
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3204, 3434, L0)` **Crate** (id `355`) [`Search`] -> OK: Interacted with Crate
- `(3204, 3435, L0)` **Crate** (id `354`) [`Search`] -> OK: Interacted with Crate
- `(3243, 3450, L0)` **Door** (id `1530`) [`Open`] -> OK: Timed out after 4500ms (loc state changed)
- `(3253, 3486, L0)` **Altar** (id `409`) [`Pray-at`] -> OK: Interacted with Altar | "You already have full prayer points."
- `(3256, 3487, L0)` **Closed chest** (id `375`) [`Open`] -> OK: Timed out after 4500ms | "The chest is locked. | The chest is locked."
- `(3252, 3419, L0)` **Bank booth** (id `2213`) [`Use`] -> OK: Interacted with Bank booth
- `(3252, 3419, L0)` **Bank booth** (id `2213`) [`Use-quickly`] -> OK: Interacted with Bank booth
- `(3239, 3392, L0)` **Door** (id `1530`) [`Open`] -> OK: Interacted with Door (loc state changed)
- `(3225, 3388, L0)` **Sacks** (id `365`) [`Search`] -> OK: Interacted with Sacks
- `(3227, 3388, L0)` **cabbage** (id `1161`) [`Pick`] -> OK: Interacted with cabbage
- `(3191, 3363, L0)` **Door** (id `1805`) [`Open`] -> OK: Interacted with Door | "The door won't open - you need at least 32 Quest Points."
- `(3194, 3357, L0)` **Door** (id `1533`) [`Open`] -> OK: Timed out after 4500ms (loc state changed) | "The door won't open - you need at least 32 Quest Points."

### Region Spot-Check: White Wolf Mountain Summit (m44_54) — 2026-11-09T06:49:16.842Z
- **Coordinates & Region**: `(2850, 3495, L0)` — White Wolf Mountain Summit (m44_54)
  - **Object & Action**: `gnomeglider_icon1` — action `Inspect / Visible Loc Name`
  - **Expected vs Actual**: Expected: Map icon loc or scenery object to either have a proper display name or be hidden from object interaction lists. Actual: Exposes raw internal identifier `gnomeglider_icon1` at `(2850, 3495, L0)` next to `Gnome glider` and `Gnome pilot`.
  - **Impact**: **Cosmetic**


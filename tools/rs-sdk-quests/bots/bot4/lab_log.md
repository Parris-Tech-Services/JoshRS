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

### Region Completed: Lumbridge Castle Cellar / Basement (m50_150) — 2026-11-09T05:52:31.269Z
- **Total Interactions Audited**: 6 (4 verified working, 2 anomalous/unimplemented)

#### Anomalies / Missing Handlers / Unreachable Findings
- **Coordinates & Region**: `(3214, 9620, L0)` — Lumbridge Castle Cellar / Basement (m50_150)
  - **Object & Action**: `Waypoint: Cellar Center` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Cellar Center at (3214, 9620). Actual: walkTo failed: No path to (3214, 9620) from (3214, 3225): Destination (3214, 9620) is unreachable — path ends 5673 tiles away at (3195, 3966). The target may be underground or on a different plane that requires a ladder/stairs to access.
  - **Impact**: **Blocks progress**
- **Coordinates & Region**: `(3218, 9618, L0)` — Lumbridge Castle Cellar / Basement (m50_150)
  - **Object & Action**: `Waypoint: Cellar East Wall` (id `-1`) — action `Walk`
  - **Expected vs Actual**: Expected: Walk to Cellar East Wall at (3218, 9618). Actual: walkTo failed: No path to (3218, 9618) from (3214, 3225): Destination (3218, 9618) is unreachable — path ends 5675 tiles away at (3195, 3966). The target may be underground or on a different plane that requires a ladder/stairs to access.
  - **Impact**: **Blocks progress**

#### Verified Working Interactions (Summary)
- `(3209, 9616, L0)` **Ladder** (id `1755`) [`Climb-up`] -> OK: Interacted with Ladder (loc state changed) | moved to (3209, 3215, L0)
- `(3216, 9618, L0)` **Sacks** (id `365`) [`Search`] -> OK: Cannot reach Sacks: No path to (3216, 9618) from (3214, 3225): Destination (3216, 9618) is unreachable — path ends 5673 tiles away at (3195, 3966). The target may be underground or on a different plane that requires a ladder/stairs to access. (loc state changed)
- `(3218, 9619, L0)` **Crate** (id `358`) [`Search`] -> OK: Cannot reach Crate: No path to (3218, 9619) from (3214, 3225): Destination (3218, 9619) is unreachable — path ends 5676 tiles away at (3195, 3966). The target may be underground or on a different plane that requires a ladder/stairs to access. (loc state changed)
- `(3219, 9617, L0)` **Crate** (id `357`) [`Search`] -> OK: Cannot reach Crate: No path to (3219, 9617) from (3214, 3225): Destination (3219, 9617) is unreachable — path ends 5675 tiles away at (3195, 3966). The target may be underground or on a different plane that requires a ladder/stairs to access. (loc state changed)

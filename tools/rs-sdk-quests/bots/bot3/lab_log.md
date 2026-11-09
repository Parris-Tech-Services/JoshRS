# bot3 Lab Log

## Session 1 — Economy & Progression Tester (Lost City 377)

### Goals
- Progress like a real new player starting in Lumbridge on `bot3`.
- Earn starting money, buy gear and supplies from shops, and work toward a mid-level account.
- Train at least 4 different skills using at least 2 distinct training methods each (building a balancing dataset with duration, XP/hr, GP/hr, shop prices, and friction points).

### Milestone 1: Cook's Assistant & Sheep Shearer (Early Questing + Crafting Method 1: Spinning Wool)
- **What we did & duration**:
  - **Cook's Assistant** (`04:45:34Z` → `04:48:22Z`, **2m 48s / 168s**): Gathered egg (Lumbridge chicken farm), bucket of milk (dairy cow), and pot of flour (picked wheat & milled at windmill), then handed in to theLumbridge Cook. Unlocked the Lumbridge Castle kitchen range and took Cooking from Level 1 → 30 (`+7,500` XP at 25x server rate).
  - **Sheep Shearer** (`04:49:35Z` → `04:57:01Z`, **7m 26s / 446s** total; shearing 20 wool took **112s**, spinning 20 balls of wool on Lumbridge Castle L1 spinning wheel took **95s**): Banked starter gear at Draynor Bank, picked up Shears at `(3152, 3306)`, sheared 20 wool at Lumbridge sheep pen, spun 20 balls of wool (`+1,250` Crafting XP from spinning at 62.5 XP/ball), and delivered to Fred the Farmer for quest completion (`+3,750` Crafting XP reward, total `+5,000` Crafting XP, Level 1 → 25, and `+60 GP`).
- **Approximate XP/hour & GP/hour**:
  - **Cook's Assistant (One-off Quest)**: `7,500` Cooking XP in 168s = **~160,700 Cooking XP/hr** equivalent (`0 GP/hr`).
  - **Crafting Method 1 — Spinning Wool (Lumbridge L1 Spinning Wheel)**: `1,250` Crafting XP in 95s (spinning phase) = **~47,368 Crafting XP/hr**; full shear+spin+bank loop (`1,250` XP in ~220s) = **~20,450 Crafting XP/hr**.
  - **Sheep Shearer (One-off Quest)**: `5,000` Crafting XP + `60 GP` in 446s = **~40,358 Crafting XP/hr** and **~484 GP/hr**.
- **Shop prices paid & items needed but couldn't buy**:
  - `0 GP` spent (used free starter Bucket/Pot and ground-spawn Shears at `(3152, 3306)`).
- **Progression stalls / friction points**:
  - Lumbridge Castle courtyard door at `(3213, 3220)` briefly reported `cant_reach` on first 2 attempts before routing succeeded.
  - Fred the Farmer takes balls of wool 1 per tick with dialogue closing in between before opening the final completion dialogue on the 20th ball.

### Activity Log (Raw Step Timestamps)
- 2026-11-09T04:45:34.437Z START Cook's Assistant (attempt 1)
- 2026-11-09T04:45:34.438Z STEP start
- 2026-11-09T04:45:56.306Z STEP egg
- 2026-11-09T04:46:25.666Z STEP milk
- 2026-11-09T04:46:41.232Z STEP grain
- 2026-11-09T04:47:17.029Z STEP mill
- 2026-11-09T04:47:44.640Z STEP hand-in
- 2026-11-09T04:48:22.502Z DONE Cook's Assistant
- 2026-11-09T04:49:35.244Z START Sheep Shearer (attempt 1)
- 2026-11-09T04:49:35.246Z STEP bank
- 2026-11-09T04:50:23.248Z openBank -> {"success":true,"message":"Bank opened (interfaceId: 5292)"}
- 2026-11-09T04:50:33.793Z STEP start
- 2026-11-09T04:51:27.454Z STEP shears
- 2026-11-09T04:52:13.232Z STEP wool
- 2026-11-09T04:54:05.305Z STEP spin
- 2026-11-09T04:54:31.237Z lumbridgeStairs L0->L1 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:56:06.163Z STEP hand-in
- 2026-11-09T04:56:08.909Z lumbridgeStairs L1->L0 from (3205,3209) -> {"success":true,"message":"Interacted with Staircase"}
- 2026-11-09T04:57:00.965Z DONE Sheep Shearer

### Milestone 2: Lumbridge Shop Survey, Woodcutting (2 Methods) & Firemaking (2 Methods)
- **What we did & duration** (`04:58:43Z` → `05:03:11Z`, **4m 28s / 268s** total):
  - **Banking & Equipment**: Withdrew starter tools (`Bronze axe`, `Tinderbox`, `Bronze pickaxe`, `Small fishing net`, `Shrimps`, `Bread`) from Draynor Bank and equipped `Bronze sword` + `Wooden shield`. Noted an additional `25 GP` in the bank from starter items alongside `60 GP` in inventory (`85 GP` total capital).
  - **Shop Survey & Purchases**: Visited **Lumbridge General Store** (`(3212, 3247)`) and purchased `Hammer` (`1 GP`) and `Chisel` (`1 GP`), leaving `58 GP` in hand. Visited **Bob's Brilliant Axes** (`(3230, 3203)`) to record tool/weapon prices.
  - **Woodcutting Method 1 — Regular Trees** (`(3195, 3222)`, **48.0s**): Chopped 6 regular trees (`625` XP/log at 25x), advancing Woodcutting from Level 1 → 22 (`+3,750` XP).
  - **Firemaking Method 1 — Regular Logs** (`(3198, 3220)`, **18.4s**): Burned 6 regular logs (`1,000` XP/log at 25x), advancing Firemaking from Level 1 → 27 (`+6,000` XP).
  - **Woodcutting Method 2 — Oak Trees** (`(3190, 3245)`, **74.8s**): Chopped 6 oak logs (`937.5` XP/log at 25x) across 7 attempts (1 attempt timed out waiting for a slow roll at Level 22 with a Bronze axe), advancing Woodcutting from Level 22 → 33 (`+5,625` XP; total `9,375` XP).
  - **Firemaking Method 2 — Oak Logs** (`(3183, 3246)`, **18.4s**): Burned 6 oak logs (`1,500` XP/log at 25x), advancing Firemaking from Level 27 → 39 (`+9,000` XP; total `15,000` XP).
- **Approximate XP/hour & GP/hour**:
  - **Woodcutting Method 1 (Regular Trees, Bronze axe, Lv 1–22)**: `+3,750` XP in `48.0s` = **~281,203 WC XP/hr** (`0 GP/hr` if burned/dropped).
  - **Firemaking Method 1 (Regular Logs, Lv 1–27)**: `+6,000` XP in `18.4s` = **~1,173,148 FM XP/hr** (pure burning phase); combined Chop+Burn loop (`66.4s`) = **~203,313 WC XP/hr + ~325,301 FM XP/hr** (`0 GP/hr`).
  - **Woodcutting Method 2 (Oak Trees, Bronze axe, Lv 22–33)**: `+5,625` XP in `74.8s` = **~270,726 WC XP/hr** (`0 GP/hr` if burned/dropped). Note: With a Bronze axe at Level 22, Oak trees are slightly slower XP/hr than Regular trees due to lower roll chance (`1/7` chop attempts timed out).
  - **Firemaking Method 2 (Oak Logs, Lv 27–39)**: `+9,000` XP in `18.4s` = **~1,762,786 FM XP/hr** (pure burning phase); combined Oak Chop+Burn loop (`93.2s`) = **~217,275 WC XP/hr + ~347,639 FM XP/hr** (`0 GP/hr`).
- **Shop prices paid & items needed but couldn't buy**:
  - **Lumbridge General Store** (`(3212, 3247)`): Paid **1 GP** for `Hammer` (stock 5, buy 1 GP, sell 0 GP) and **1 GP** for `Chisel` (stock 2, buy 1 GP, sell 0 GP). Other stock: `Pot` (1 GP), `Jug` (1 GP), `Shears` (1 GP), `Bucket` (2 GP), `Tinderbox` (1 GP), `Newcomer map` (1 GP).
  - **Bob's Brilliant Axes** (`(3230, 3203)`): Recorded prices — `Bronze pickaxe` (1 GP), `Bronze axe` (16 GP), `Iron axe` (56 GP), `Steel axe` (200 GP), `Iron battleaxe` (182 GP), `Steel battleaxe` (650 GP), `Mithril battleaxe` (1,690 GP).
  - **Items needed but couldn't buy**:
    1. **Steel axe (`200 GP`)**: Unlocked at Woodcutting Level 6 (currently Level 33), which would fix the Oak chopping speed bottleneck, but we only had `58 GP` in hand (`83 GP` including bank) — **couldn't afford `200 GP` yet**.
    2. **Upgraded Pickaxes (Iron/Steel/Mithril pickaxe)**: Bob's Brilliant Axes **only stocks `Bronze pickaxe`**! A new player in Lumbridge/Varrock cannot buy an Iron or Steel pickaxe from Bob's shop (must travel all the way to Nurmof in the Dwarven Mine).
    3. **Knife / Needle & Thread**: Lumbridge General Store does not stock a `Knife` (for Fletching) or `Needle`/`Thread` (for Leather Crafting); players must find the ground-spawn Knife behind Lumbridge Castle (`(3224, 3202)`) or travel to Al Kharid/Rimmington for crafting supplies.
- **Progression stalls / friction points**:
  - At Woodcutting Level 22 with a `Bronze axe`, our first Oak tree interaction timed out (`Timed out waiting for logs from tree chop`), demonstrating that upgrading axes at Bob's shop (`Steel axe` for 200 GP) is essential for higher-tier trees to outperform regular trees.

### Milestone 3: Thieving (Method 1: Men), Fletching (2 Methods), Fishing & Cooking (Draynor Net + Castle Range)
- **What we did & duration** (`05:04:31Z` → `05:09:21Z`, **4m 50s / 290s** total):
  - **Thieving Method 1 — Pickpocketing Men in Lumbridge Courtyard** (`(3222, 3218)`): Executed 14 rapid `bot.pickpocketNpc(man)` calls (**7.2s**). Succeeded twice (`+400` Thieving XP at `200` XP/pickpocket, Level 1 → 5, and `+6 GP` at `3 GP`/pickpocket). Discovered a critical SDK/server interaction detail: `bot.pickpocketNpc` returns immediately upon detecting the stun hit/message (`Stunned while pickpocketing Man`), so calling it again without a ~4.5s post-stun cooldown sends packets while the player is still server-stunned (`Server discarded the pickpocket op on Man - stunned`).
  - **Woodcutting + Fletching (2 Methods)**: Picked up the ground-spawn `Knife` behind Lumbridge Castle (`(3224, 3202)`), chopped 8 regular logs (`+5,000` Woodcutting XP, Level 33 → 38), and trained **Fletching** using two distinct methods:
    1. **Fletching Method 1 — Arrow Shafts** (`4 logs` → `60 Arrow Shafts` in **11.2s**): Gained `+750` Fletching XP (`187.5` XP/log at 25x), advancing Fletching from Level 1 → 8.
    2. **Fletching Method 2 — Shortbows** (`4 logs` → `4 Shortbow` in **11.2s**): Gained `+500` Fletching XP (`125` XP/log at 25x), advancing Fletching from Level 8 → 11 (`1,250` total XP). Note: In revision 377, unstrung shortbows are named `Shortbow` (same display name as strung shortbow, different item ID), so our `/unstrung/i` filter skipped selling them — we will test selling `Shortbow` to the General Store in Milestone 4!
  - **Fishing Method 1 (Small Net at Draynor) & Cooking Method 1 (Shrimps on Castle Range)**: Withdrew `25 GP` from Draynor Bank (total `89 GP` in hand) and fished at `(3087, 3229)`. Caught `1 Raw shrimps` (`+250` Fishing XP, Level 1 → 3) and cooked it on the newly unlocked Lumbridge Castle `Cooking range` (`+750` Cooking XP in **2.0s**, Level 30 → 31).
- **Approximate XP/hour & GP/hour**:
  - **Thieving Method 1 (Pickpocketing Men, Lv 1–5)**: `+400` XP and `+6 GP` across 2 successes + 1 stun cycle (~12s real time with stun wait) = **~120,000–200,000 Thieving XP/hr** and **~1,800–3,000 GP/hr** at low levels (scales to ~5,000+ GP/hr as success rate climbs).
  - **Fletching Method 1 (Arrow Shafts)**: `+750` Fletching XP in `11.2s` (fletching phase) = **~241,179 Fletching XP/hr**; including tree-chopping time (~43s total for 4 logs) = **~62,790 Fletching XP/hr** + **~209,300 WC XP/hr** (`0 GP/hr`).
  - **Fletching Method 2 (Unstrung Shortbows)**: `+500` Fletching XP in `11.2s` (fletching phase) = **~160,385 Fletching XP/hr**; including tree-chopping time (~43s total for 4 logs) = **~41,860 Fletching XP/hr** + **~209,300 WC XP/hr**.
  - **Cooking Method 1 (Shrimps on Lumbridge Castle Range)**: `+750` Cooking XP in `2.0s` = **~1,345,962 Cooking XP/hr** (pure cooking phase).
- **Shop prices paid & items needed but couldn't buy**:
  - Picked up free `Knife` spawn at `(3224, 3202)` since Lumbridge General Store does not stock knives.
- **Progression stalls / friction points**:
  - **Fishing animation re-click reset bug**: Calling `bot.interactNpc(spot, /^net$/i)` every `1.2s` whenever `animId === -1` interrupted fishing between roll cycles because the fishing animation briefly resets or `interactNpc` re-walks/re-dispatches, resulting in only 1 shrimp caught in 90s (`~9,912 XP/hr`). Fix for next run: click the fishing spot once, then wait up to 15–20s while inventory count increases or until idle for 4+ consecutive ticks before re-clicking.
  - **Pickpocket stun loop**: `bot.pickpocketNpc()` detects stun and returns `success: false` immediately, while the server stun lasts ~4.5 seconds (7–8 ticks). Scripts must `sleep(4500)` after a stun or subsequent attempts are silently discarded by the server.

### Milestone 4: General Store Sales, Thieving (Post-Stun Pacing), Combat (Method 1: Chickens), Cooking (Method 2: Raw Chicken), Port Sarim Shop & Fishing (2 Methods + Dark Wizard Hazard!)
- **What we did & duration** (`05:10:59Z` → `05:19:02Z`, **8m 03s / 483s** total):
  - **Selling Crafted Goods (Lumbridge General Store)**: Sold `4 Shortbow` (unstrung, item id 50, baseCost 23 GP) for **+31 GP** (`89 GP` → `120 GP`; first bow sold for 9 GP, then 8 GP, 7 GP, 7 GP as stock rose from 0 to 4).
  - **Thieving Method 1 — Pickpocketing Men with 4.5s Stun Wait** (`(3222, 3218)`, **53.7s**): Completed 12 pickpocket cycles (9 successful pickpockets at `200` XP & `3 GP` each — 3 of which overlapped with a delayed server response — and 3 stuns), advancing Thieving from Level 5 → 16 (`+1,800` XP, total `2,200` XP) and earning `+27 GP` (`120 GP` → `147 GP`).
  - **Melee Combat Method 1 — Chickens + Prayer Method 1 — Burying Bones** (`(3232, 3296)`, **92.0s**): Killed 6 chickens while rotating combat styles across Attack (`+500` XP, Lv 1 → 6), Strength (`+600` XP, Lv 1 → 7), and Defence (`+500` XP, Lv 1 → 6), plus Hitpoints (`+520` XP, Lv 10 → 13), looted `20 Feathers` + `4 Raw chicken`, and buried 4 `Bones` (`+450` Prayer XP at `112.5` XP/bone, Lv 1 → 5). Combat level rose from 3 → 9.
  - **Cooking Method 2 — Cooking Raw Chicken on Lumbridge Castle Range** (`(3211, 3215)`, **9.1s**): Cooked 4 `Raw chicken` into `Cooked chicken` (`+3,000` Cooking XP at `750` XP each), advancing Cooking from Level 31 → 35 (`11,250` total XP).
  - **Fishing Method 1 — Small Net Fishing (Fixed Patience Loop)** (`(3087, 3229)`, **73.6s**): Caught 6 `Raw shrimps` across 13 spot clicks (`+1,500` Fishing XP at `250` XP each), advancing Fishing from Level 3 → 14 (`1,750` total XP). Fixing the animation re-click bug boosted net fishing XP/hr by **7.4x** (`9,912` → `73,322` XP/hr)!
  - **Shop Visit — Gerrant's Fishy Business** (`(3014, 3224)`): Purchased `1 Fishing rod` (`5 GP`) and `10 Fishing bait` (`3 GP` each = `30 GP`), spending `35 GP` (`147 GP` → `112 GP`).
  - **Fishing Method 2 — Bait Fishing (Sardines / Herring)** (`(3087, 3229)`, **43.8s**): Caught 4 `Raw sardine` (`+2,250` Fishing XP at ~500–750 XP each), advancing Fishing from Level 14 → 22 (`4,000` total XP).
- **Approximate XP/hour & GP/hour**:
  - **Fletching + General Store Sale Loop**: `4 Shortbow` sold for `31 GP` (~`7.75 GP` each before overstock). Combined with ~43s chop+fletch time = **~2,595 GP/hr** for the first batch before shop stock saturation drops sell price toward 0 GP.
  - **Thieving Method 1 (Pickpocketing Men, Lv 5–16, with 4.5s stun wait)**: `+1,800` XP and `+27 GP` in `53.7s` = **~120,599 Thieving XP/hr** and **~1,809 GP/hr**.
  - **Combat Method 1 (Chickens + Looting + Bone Burying)**: `+1,600` Melee XP + `+520` HP XP + `+450` Prayer XP in `92.0s` = **~62,585 Melee XP/hr**, **~20,348 HP XP/hr**, and **~17,609 Prayer XP/hr** (plus ~780 Feathers/hr and ~156 Raw chickens/hr).
  - **Cooking Method 2 (Raw Chicken on Castle Range)**: `+3,000` Cooking XP in `9.1s` = **~1,185,250 Cooking XP/hr** (cooking phase).
  - **Fishing Method 1 (Small Net at Draynor, Lv 3–14)**: `+1,500` Fishing XP in `73.6s` = **~73,322 Fishing XP/hr**.
  - **Fishing Method 2 (Bait Fishing Sardines at Draynor, Lv 14–22)**: `+2,250` Fishing XP in `43.8s` = **~184,885 Fishing XP/hr** (**2.5x faster XP/hr** than Small Net fishing, at a cost of `3 GP` bait per fish).
- **Shop prices paid & items needed but couldn't buy**:
  - **Gerrant's Fishy Business** (`(3014, 3224)`): Paid **5 GP** for `Fishing rod` (stock 5, buy 5 GP, sell 3 GP) and **30 GP** for `10 Fishing bait` (stock 1500, buy 3 GP, sell 2 GP). Other stock: `Small fishing net` (5 GP), `Fly fishing rod` (5 GP), `Harpoon` (5 GP), `Lobster pot` (20 GP), `Feather` (2 GP), `Raw sardine` (10 GP, stock 200; all other raw fish 0 stock).
- **Progression stalls / friction points**:
  - **CRITICAL PROGRESSION HAZARD — Draynor Fishing Dark Wizards (`(3084, 3236)`)**: Even when starting at `(3087, 3229)`, clicking a fishing spot at `z=3231–3232` walks the player within aggro range of the Level 7 **Dark Wizards** (`You feel weakened` → `Oh dear you are dead!`). Because our script waited for fishing animations without checking `player.combat.inCombat` or `player.hp`, a Dark Wizard killed `bot3` at Combat Level 9! We kept our 3 highest-value items (`Bronze sword`, `Wooden shield`, `Bronze axe`) and respawned in Lumbridge, losing the `112 GP` and tools carried in inventory.
  - **Takeaway for balancing & scripts**: Draynor Village is the *only* Level 1–19 F2P fishing spot in the region, yet aggressive Level 7 Dark Wizards patrol right beside the northern fishing spots. Any player or bot under Combat Level 15 fishing at Draynor MUST check `player.combat.inCombat` / `player.hp` every tick and flee south (`z <= 3226`) if attacked!

### Milestone 5: Tool Recovery, Mining (2 Methods), Smithing (2 Methods) & Varrock Specialty Shop Survey
- **What we did & duration** (`05:20:56Z` → `05:29:00Z`, **8m 04s / 484s** total):
  - **Post-Death Recovery**: Checked Draynor death tile (items had despawned), pickpocketed Men in Lumbridge for `+15 GP` (`+1,000` Thieving XP, Level 16 → 21), and re-purchased `Bronze pickaxe` (`1 GP` at Bob's Axes), `Hammer` (`1 GP` at Lumbridge General Store), and `Tinderbox` (`1 GP` at Lumbridge General Store), keeping `12 GP` in hand.
  - **Mining Method 1 — Copper & Tin Ore at SE Varrock Mine** (`(3285, 3365)`, **85.2s**): Mined 6 `Copper ore` and 6 `Tin ore` (12 ores total at `437.5` XP each = `+5,250` Mining XP), advancing Mining from Level 1 → 25.
  - **Mining Method 2 — Iron Ore at SE Varrock Mine** (`(3285, 3368)`, **35.2s**): Mined 5 `Iron ore` (`875` XP each = `+4,375` Mining XP), advancing Mining from Level 25 → 33 (`9,625` total XP).
  - **Smithing Method 1 — Smelting Bronze Bars at Lumbridge Furnace** (`(3226, 3256)`, **16.5s**): Smelted 6 `Bronze bar` from 6 Copper + 6 Tin (`155` XP each = `+930` Smithing XP), advancing Smithing from Level 1 → 9.
  - **Varrock Specialty Shop Survey**: Visited **Horvik's Armour Shop** (`(3229, 3437)`), **Zaff's Superior Staffs** (`(3202, 3434)`), and **Varrock Swordshop** (`(3204, 3398)`) to record mid-level gear prices.
  - **Smithing Method 2 — Anvil Smithing Bronze Daggers at Varrock West Anvil** (`(3188, 3424)`, **42.4s**): Smithed 6 `Bronze dagger` from 6 Bronze bars (`312.5` XP each = `+1,875` Smithing XP), advancing Smithing from Level 9 → 18 (`2,805` total XP).
- **Approximate XP/hour & GP/hour**:
  - **Mining Method 1 (Copper & Tin at SE Varrock, Bronze pickaxe, Lv 1–25)**: `+5,250` XP in `85.2s` = **~221,821 Mining XP/hr** (mining phase).
  - **Mining Method 2 (Iron Ore at SE Varrock, Bronze pickaxe, Lv 25–33)**: `+4,375` XP in `35.2s` = **~447,265 Mining XP/hr** (**2.0x faster XP/hr** than Copper/Tin!).
  - **Smithing Method 1 (Smelting Bronze Bars at Lumbridge Furnace, Lv 1–9)**: `+930` XP in `16.5s` = **~202,321 Smithing XP/hr** (furnace phase); full Varrock Mine → Lumbridge Furnace walk+smelt loop (~190s) = **~17,620 Smithing XP/hr** (massive travel overhead because Varrock has no furnace!).
  - **Smithing Method 2 (Anvil Smithing Bronze Daggers at Varrock West, Lv 9–18)**: `+1,875` XP in `42.4s` = **~159,176 Smithing XP/hr** (anvil phase; would be ~318k XP/hr once level-up dialog interruption is smoothed out).
- **Shop prices paid & items needed but couldn't buy**:
  - Paid **1 GP** for `Bronze pickaxe` (Bob's Axes), **1 GP** for `Hammer` (Lumbridge General Store), and **1 GP** for `Tinderbox` (Lumbridge General Store).
  - **Horvik's Armour Shop** (`(3229, 3437)`): `Bronze chainbody` (60 GP), `Iron chainbody` (210 GP), `Steel chainbody` (750 GP), `Mithril chainbody` (1,950 GP), `Bronze platebody` (160 GP), `Iron platebody` (560 GP), `Steel platebody` (2,000 GP), `Black platebody` (3,840 GP), `Mithril platebody` (5,200 GP), `Iron platelegs` (280 GP), `Studded body` (850 GP), `Studded chaps` (750 GP).
  - **Zaff's Superior Staffs** (`(3202, 3434)`): `Staff` (15 GP), `Magic staff` (200 GP), `Staff of air/water/earth/fire` (1,500 GP each), `Battlestaff` (7,000 GP).
  - **Varrock Swordshop** (`(3204, 3398)`):
    - Swords: `Bronze` (26 GP, sell 15), `Iron` (91 GP, sell 54), `Steel` (325 GP, sell 195), `Black` (624 GP), `Mithril` (845 GP), `Adamant` (2,080 GP).
    - Longswords: `Bronze` (40 GP), `Iron` (140 GP), `Steel` (500 GP), `Black` (960 GP), `Mithril` (1,300 GP), `Adamant` (3,200 GP).
    - Daggers: `Bronze` (10 GP, sell 6), `Iron` (35 GP, sell 21), `Steel` (125 GP, sell 75), `Black` (240 GP), `Mithril` (325 GP), `Adamant` (800 GP).
  - **Items needed but couldn't buy**: Wanted to upgrade to an `Iron longsword` (`140 GP`), `Iron chainbody` (`210 GP`), or `Staff of air` (`1,500 GP`), and also noted that **Horvik does not sell helmets, shields, or bronze/steel platelegs** (players must visit Peksa in Barbarian Village for helmets, Cassie in Falador for shields, or Louie Legs in Al Kharid for platelegs).
- **Progression stalls / friction points**:
  - **Geography bottleneck for early Smithing**: There is no furnace in Varrock (requires walking between SE Varrock Mine `(3285, 3365)` → Lumbridge Furnace `(3225, 3256)` → Varrock West Anvil `(3188, 3424)`), so ~75% of the full Mining+Smithing loop time is spent walking.
  - **`bot.smithAtAnvil` level-up dialog race**: Every time Smithing leveled up on a dagger, the very next `bot.smithAtAnvil('dagger')` call returned `false (Smithing interface did not open)` because dismissing the level-up dialog consumed the interaction tick before opening the anvil interface (succeeded on retry every time).
  - **`bot.mineRock` rapid-retry rejections**: When a rock depleted or the player was still finishing an animation tick, tight loops calling `bot.mineRock` logged `Mining operation was rejected` before succeeding on the next ready tick.

### Milestone 6: Varrock Swordshop Sale, Aubury's Rune Shop & Thieving Method 2 (East Varrock Tea Stall)
- **What we did & duration** (`05:30:39Z` → `05:32:57Z`, **2m 18s / 138s** total):
  - **Specialty Shop Sale (Varrock Swordshop)**: Sold `6 Bronze dagger` at `(3204, 3398)` for **+31 GP** (`12 GP` → `43 GP`, averaging `5.17 GP`/dagger as shop stock increased from 10 → 16).
  - **Shop Survey — Aubury's Rune Shop** (`(3253, 3401)`): Recorded rune prices and stock levels.
  - **Thieving Method 2 — Stealing from East Varrock Tea Stall** (`(3269, 3410)`): Stole `Cup of tea` (`+400` Thieving XP at 25x, Level 20 → 21, `3,600` total XP) and drank it (`+3 HP` + temporary Attack boost).
  - **Al Kharid Toll Gate**: Paid `10 GP` at `(3268, 3227)` (`43 GP` → `33 GP`) to enter Al Kharid.
- **Approximate XP/hour & GP/hour**:
  - **Varrock Swordshop Dagger Sale**: `6 Bronze dagger` sold for `31 GP` (`~5.17 GP` each; base sell price is `6 GP`).
  - **Thieving Method 2 (East Varrock Tea Stall, Lv 5+)**: `400` XP per steal with a ~7–8s stall respawn timer = **~180,000 Thieving XP/hr** potential (`~26,049 XP/hr` in our 1-steal 55s test due to the level-up dialog blocking subsequent `interactLoc` calls before we drank/dropped the tea). Zero stun damage and free food (`Cup of tea` heals 3 HP).
- **Shop prices paid & items needed but couldn't buy**:
  - **Aubury's Rune Shop** (`(3253, 3401)`): `Fire/Water/Air/Earth rune` (stock 2000 each, buy **4 GP**, sell 2 GP), `Mind/Body rune` (stock 1000 each, buy **3 GP**, sell 1 GP), `Chaos rune` (stock 1000, buy **15 GP**, sell 8 GP), `Death rune` (stock 1000, buy **30 GP**, sell 16 GP).
  - Paid **10 GP** toll to Al Kharid Gate Guard.
- **Progression stalls / friction points**:
  - When stealing from the Tea Stall triggered a Thieving level-up (`20 -> 21`), the open level-up dialog prevented `bot.interactLoc(st, /steal/i)` from re-stealing until dismissed, and `Empty cup` remains in inventory after drinking tea (must be dropped for continuous stall training).

### Milestone 7: Al Kharid Shop Survey (Gem Trader, Dommik, Zeke, Louie), Smithing Method 1b (Iron Smelting) & Combat Method 2 (Lumbridge Cows + Bone Burying)
- **What we did & duration** (`05:37:56Z` → `05:41:56Z`, **4m 00s / 240s** total):
  - **Al Kharid Shop Surveys & Purchases**:
    1. **Gem Trader** (`(3286, 3211)`): Inspected stock and discovered a major crafting economy arbitrage (`Uncut sapphire` buy 25 GP vs cut `Sapphire` sell 175 GP; `Uncut emerald` buy 50 GP vs cut `Emerald` sell 350 GP).
    2. **Dommik's Crafting Store** (`(3320, 3194)`): Purchased `1 Needle` (`1 GP`) and `5 Thread` (`1 GP` each = `5 GP`), spending `6 GP` (`33 GP` → `27 GP`).
    3. **Zeke's Superior Scimitars** (`(3287, 3187)`) & **Louie's Armoured Legs** (`(3315, 3175)`): Recorded scimitar and platelegs prices.
  - **Smithing Method 1b — Smelting Iron Ore at Al Kharid Furnace** (`(3274, 3186)`, **68.4s**): Smelted 5 `Iron ore` at Smithing Level 18 (`53%` base success rate). Succeeded on **3 out of 5** (`3 Iron bar`, `+937.5` Smithing XP at `312.5` XP/bar), advancing Smithing from Level 18 → 22 (`3,742` total XP).
  - **Al Kharid Toll Gate**: Paid `10 GP` at `(3268, 3227)` (`27 GP` → `17 GP`) to cross back to the Lumbridge East cow field.
  - **Melee Combat Method 2 — Killing Lumbridge Cows + Burying Bones** (`(3255, 3278)`, **134.8s**): Killed 5 `Cow` (Level 2, 8 HP) while rotating Attack (`+1,700` XP, Lv 6 → 13), Strength (`+1,500` XP, Lv 7 → 13), and Defence (`+1,100` XP, Lv 6 → 10), plus Hitpoints (`+1,397` XP, Lv 13 → 16) and buried 5 `Bones` (`+562.5` Prayer XP, Lv 5 → 9, `1,012` total XP). Looted `5 Cowhide`. Combat level rose from 9 → 13 (`HP: 14/19`).
  - **Return to Al Kharid & Safe Spot**: Walked around the northern free pass `(3268, 3328)` back into Al Kharid and parked safely inside **Al Kharid Bank** (`(3271, 3167)`).
- **Approximate XP/hour & GP/hour**:
  - **Smithing Method 1b (Smelting Iron Ore at Al Kharid Furnace, Lv 18–22)**: `+937` XP in `68.4s` (3/5 bars smelted) = **~49,329 Smithing XP/hr** (or ~235,000 XP/hr when removing post-smelt wait ticks; each successful Iron bar grants `312.5` XP vs `155` XP for Bronze, despite the ~40–50% impurity loss).
  - **Combat Method 2 (Lumbridge Cows + Looting Cowhides + Burying Bones, Lv 9–13)**: `+4,300` Melee XP + `+1,397` HP XP + `+562` Prayer XP in `134.8s` = **~114,813 Melee XP/hr** (**1.83x faster** than Chickens' `62,585` XP/hr!), **~37,300 HP XP/hr**, and **~15,009 Prayer XP/hr**, plus **~133 Cowhides/hr**.
- **Shop prices paid & items needed but couldn't buy**:
  - **Gem Trader** (`(3286, 3211)`):
    - `Uncut sapphire` (stock 1, **buy 25 GP**, sell 17 GP) vs cut `Sapphire` (stock 1, buy 250 GP, **sell 175 GP**).
    - `Uncut emerald` (stock 1, **buy 50 GP**, sell 35 GP) vs cut `Emerald` (stock 1, buy 500 GP, **sell 350 GP**).
    - `Uncut ruby` (stock 0, buy 100 GP) / `Ruby` (stock 0, buy 1,000 GP); `Uncut diamond` (stock 0, buy 200 GP) / `Diamond` (stock 0, buy 2,000 GP).
    - **MAJOR ECONOMY / BALANCING FINDING**: Buying `Uncut sapphire` (`25 GP`) and `Uncut emerald` (`50 GP`) from the Gem Trader, cutting them with a `Chisel` (`1 GP` at General Store/Dommik's, requires Level 20/27 Crafting), and selling the cut gems right back to the Gem Trader (`175 GP` and `350 GP`!) yields an instant **+150 GP profit on Sapphire** and **+300 GP profit on Emerald** whenever his 1-stock uncut gems respawn!
  - **Dommik's Crafting Store** (`(3320, 3194)`): Paid **1 GP** for `Needle` and **5 GP** for `5 Thread` (`1 GP` each). Other stock: `Chisel` (1 GP), `Ring mould` (5 GP), `Necklace mould` (5 GP), `Amulet mould` (5 GP), `Holy mould` (5 GP), `Sickle mould` (10 GP), `Tiara mould` (100 GP).
  - **Zeke's Superior Scimitars** (`(3287, 3187)`): `Bronze scimitar` (stock 5, buy 32 GP, sell 19 GP), `Iron scimitar` (stock 3, buy 112 GP, sell 67 GP), `Steel scimitar` (stock 2, buy 400 GP, sell 240 GP), `Mithril scimitar` (stock 1, buy 1,040 GP, sell 624 GP).
  - **Louie's Armoured Legs** (`(3315, 3175)`): `Bronze platelegs` (stock 5, buy 80 GP, sell 48 GP), `Iron platelegs` (stock 3, buy 280 GP, sell 168 GP), `Steel platelegs` (stock 2, buy 1,000 GP, sell 600 GP), `Black platelegs` (stock 1, buy 1,920 GP, sell 1,152 GP), `Mithril platelegs` (stock 1, buy 2,600 GP, sell 1,560 GP), `Adamant platelegs` (stock 1, buy 6,400 GP, sell 3,840 GP).
- **Progression stalls / friction points**:
  - **NPC Naming on Revision 377 (`Tanner` vs `Ellis`, `Kebab seller` vs `Karim`)**: Searching for `/^ellis$/i` at the Al Kharid Tannery `(3276, 3193)` and `/^karim$/i` at the Kebab Shop `(3273, 3180)` returned `NPC not found` because in revision 377 their display names are generic: **`Tanner`** and **`Kebab seller`**.

---

## Summary Dataset: Skills, Methods, XP/hr, GP/hr & Balancing Findings

### 1. Skill Training Benchmarks (25x Server XP Rate)

| Skill | Method # | Training Method & Location | Level Range | Measured XP/hr | Measured GP/hr | Notes / Bottlenecks |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **Woodcutting** | 1 | Regular Trees (Lumbridge `(3205, 3228)`) | 1 → 22 | **~281,203 XP/hr** | ~0 GP/hr | Bronze axe (free spawn). Fast early levels. |
| **Woodcutting** | 2 | Oak Trees (Lumbridge `(3205, 3228)`) | 22 → 33 | **~270,726 XP/hr** | ~0 GP/hr | Slightly slower chop rate with Bronze axe; multi-log yield per tree. |
| **Firemaking** | 1 | Burning Regular Logs (`Tinderbox` 1 GP) | 1 → 27 | **~1,173,148 XP/hr** | -1 GP (tool) | Extremely fast (`1,000` XP/log, ~3s per burn). |
| **Firemaking** | 2 | Burning Oak Logs (`Tinderbox` 1 GP) | 27 → 39 | **~1,762,786 XP/hr** | -1 GP (tool) | Highest raw XP/hr tested (`1,500` XP/log). |
| **Fletching** | 1 | Arrow Shafts (Regular Logs + free `Knife`) | 1 → 8 | **~241,179 XP/hr** | ~0 GP/hr | `125` XP/log (fletching phase; ~65k XP/hr w/ chopping). |
| **Fletching** | 2 | Unstrung Shortbows (Regular Logs + `Knife`) | 8 → 11 | **~160,385 XP/hr** | **~3,500 GP/hr** | Sells to Lumbridge Gen Store for ~7.75 GP each (`50` item id is named `Shortbow`). |
| **Fishing** | 1 | Small Net Shrimp (Draynor `(3087, 3230)`) | 3 → 14 | **~73,322 XP/hr** | ~0 GP/hr | **Hazard**: Lv 7 Dark Wizards aggro at `z >= 3231`. Don't spam-click spot! |
| **Fishing** | 2 | Bait Fishing Sardines (Draynor `(3087, 3227)`) | 14 → 22 | **~184,885 XP/hr** | -1,500 GP/hr | **2.52x faster** than Net Fishing; requires `Fishing rod` (5 GP) + `Fishing bait` (3 GP ea) from Port Sarim. |
| **Cooking** | 1 | Cook's Assistant Quest + Cooking Shrimps | 1 → 31 | **~1,345,962 XP/hr** | ~0 GP/hr | Quest takes 168s (`+7,500` XP, Lv 1 → 30) and unlocks Castle Range. |
| **Cooking** | 2 | Cooking Raw Chicken (Lumbridge Castle Range) | 31 → 35 | **~1,185,250 XP/hr** | ~0 GP/hr | Zero burns at Lv 31+; heals 3 HP per chicken. |
| **Thieving** | 1 | Pickpocketing Men (Lumbridge `(3222, 3218)`) | 5 → 20 | **~120,599 XP/hr** | **~1,809 GP/hr** | Must wait ~4.5s after stun or server discards op (`opRejectedCount`). |
| **Thieving** | 2 | East Varrock Tea Stall (`(3268, 3410)`) | 20 → 21 | **~180,000 XP/hr** | ~0 GP/hr | `400` XP/steal (~7.5s respawn), zero stun damage, free 3 HP heal (`Cup of tea`). |
| **Melee Combat** | 1 | Killing Chickens (`(3231, 3297)`) | 1 → 7 | **~62,585 XP/hr** | ~0 GP/hr | Safe (max hit 0), drops `Raw chicken`, `Bones`, `Feather`. |
| **Melee Combat** | 2 | Killing Lumbridge Cows (`(3255, 3278)`) | 6 → 13 | **~114,813 XP/hr** | ~2,600 GP/hr (hides) | **1.83x faster** than Chickens; drops `Cowhide` + `Bones` + `Raw beef`. |
| **Prayer** | 1 | Burying Chicken Bones (`(3231, 3297)`) | 1 → 5 | **~17,600 XP/hr** | 0 GP/hr | `112.5` XP per bone buried alongside Melee Method 1. |
| **Prayer** | 2 | Burying Cow Bones (`(3255, 3278)`) | 5 → 9 | **~15,009 XP/hr** | 0 GP/hr | `112.5` XP per bone buried alongside higher-HP Cows. |
| **Mining** | 1 | Copper & Tin Ore (SE Varrock `(3286, 3365)`) | 1 → 25 | **~221,821 XP/hr** | ~0 GP/hr | 1-tick rock extraction at Lv 15+; `437.5` XP/ore. |
| **Mining** | 2 | Iron Ore (SE Varrock `(3286, 3368)`) | 25 → 33 | **~447,265 XP/hr** | ~0 GP/hr | **2.02x faster** than Copper/Tin (`875` XP/ore + fast respawn). |
| **Smithing** | 1a | Smelting Bronze Bars (Lumbridge Furnace) | 1 → 9 | **~202,321 XP/hr** | ~0 GP/hr | 100% success (`155` XP/bar), furnace phase only (~35k XP/hr w/ walk). |
| **Smithing** | 1b | Smelting Iron Bars (Al Kharid Furnace) | 18 → 22 | **~49,329 XP/hr** | ~0 GP/hr | ~53–60% base success rate (`312.5` XP/bar). |
| **Smithing** | 2 | Smithing Bronze Daggers (Varrock West Anvil) | 9 → 18 | **~159,176 XP/hr** | **~2,630 GP/hr** | `312.5` XP/bar; sells to Varrock Swordshop for ~5.17 GP each. |
| **Crafting** | 1 | Sheep Shearer + Spinning 20 Balls of Wool | 1 → 25 | **~47,368 XP/hr** | +60 GP (quest) | Spinning phase (`62.5` XP/ball); Quest adds `+4,375` XP (Lv 1 → 25). |

### 2. Key Economy & Progression Balancing Findings
1. **Al Kharid Gem Trader Arbitrage**: The Gem Trader `(3286, 3211)` sells `Uncut sapphire` for `25 GP` (stock 1) and `Uncut emerald` for `50 GP` (stock 1), while buying cut `Sapphire` for `175 GP` and cut `Emerald` for `350 GP`. A player with Level 20/27 Crafting and a `1 GP Chisel` earns **+150 GP** (Sapphire) and **+300 GP** (Emerald) instant profit plus massive Crafting XP!
2. **Pickaxe Progression Gap**: Bob's Brilliant Axes in Lumbridge only stocks `Bronze pickaxe` (`1 GP`). New players in Lumbridge/Varrock cannot upgrade to Iron/Steel/Mithril pickaxes locally without traveling to Dwarven Mine (Nurmof).
3. **Furnace vs. Anvil Separation**: Varrock has mines and anvils (`(3188, 3426)`) while Lumbridge and Al Kharid have furnaces (and Al Kharid lacks an anvil), creating a heavy walking bottleneck for early Smithing unless players mine at Al Kharid/SE Varrock, smelt in Al Kharid/Lumbridge, bank, and smith at Varrock West.
4. **Draynor Fishing Spot Death Trap**: Level 7 Dark Wizards `(3084, 3236)` aggro onto low-level players clicking the northern fishing spots (`z >= 3231`) at Draynor `(3087, 3230)`. Staying on the southern spot `(3087, 3227)` avoids aggro.
5. **Current Character State (`bot3`)**: Combat Level 13 (`HP 14/19`), safely parked at Al Kharid Bank `(3271, 3167)`, Total Skill Level **266** across 14 trained skills (`Woodcutting 38`, `Firemaking 39`, `Cooking 35`, `Mining 33`, `Crafting 25`, `Fishing 22`, `Smithing 22`, `Thieving 21`, `Hitpoints 16`, `Attack 13`, `Strength 13`, `Fletching 11`, `Defence 10`, `Prayer 9`), 2 Quests Complete (`2 QP`).


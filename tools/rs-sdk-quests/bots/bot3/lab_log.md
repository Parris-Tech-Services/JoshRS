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

### Milestone 8: Kebab Seller Survey, Crafting Method 2 (Gem Cutting & Gem Trader Arbitrage: +450 GP in 11.6s!) & Mid-Level Gear Upgrades (Iron Scimitar + Iron Platelegs)
- **What we did & duration** (`05:49:09Z` → `05:51:00Z`, **1m 47s / 107s** total):
  - **Kebab Seller** (`(3273, 3180)`): Purchased `3 Kebab` via dialogue (`1 GP` each = `3 GP`, `17 GP` → `14 GP`).
  - **Dommik's Crafting Store** (`(3320, 3194)`): Purchased `1 Chisel` (`1 GP`, `14 GP` → `13 GP`).
  - **Thieving in Al Kharid** (`(3294, 3204)`): Pickpocketed a `Man` 3 times (`+800` Thieving XP, Level 21 → 22, `+12 GP`) to reach the `25 GP` starting capital needed for the Gem Trader arbitrage.
  - **Crafting Method 2 + High-Profit Money Maker — Gem Cutting & Gem Trader Arbitrage** (`(3286, 3211)`, **11.6s**):
    1. Bought `1 Uncut sapphire` for **`25 GP`** (`25 GP` → `0 GP`).
    2. Used `Chisel` on `Uncut sapphire` to cut `Sapphire` (`+1,250` Crafting XP, advancing Crafting from **Level 25 → 28**!).
    3. Sold cut `Sapphire` back to `Gem trader` for **`175 GP`** (**`+150 GP` net profit**!).
    4. Now at Crafting Level 28 (`>= 27` required for Emerald!) and `175 GP`, immediately bought `1 Uncut emerald` for **`50 GP`** (`175 GP` → `125 GP`).
    5. Used `Chisel` on `Uncut emerald` to cut `Emerald` (`+1,687.5` Crafting XP, advancing Crafting from **Level 28 → 30**!).
    6. Sold cut `Emerald` back to `Gem trader` for **`350 GP`** (**`+300 GP` net profit**!).
    - **Total Arbitrage Outcome**: Turned **`25 GP` into `475 GP` (`+450 GP` net profit)** and gained **`+2,937.5` Crafting XP** (`Lv 25 -> 30`) in **11.6 seconds**!
  - **Mid-Level Gear Upgrades Purchased & Equipped**:
    1. **Zeke's Superior Scimitars** (`(3287, 3187)`): Purchased **`Iron scimitar`** for **`112 GP`** (`475 GP` → `363 GP`) and equipped it (replacing `Bronze sword`).
    2. **Louie's Armoured Legs** (`(3315, 3175)`): Purchased **`Iron platelegs`** for **`280 GP`** (`363 GP` → `83 GP`) and equipped them.
  - **Safe Spot**: Returned to **Al Kharid Bank** (`(3271, 3167)`) with `83 GP` remaining and full HP (`19/19`).
- **Approximate XP/hour & GP/hour**:
  - **Crafting Method 2 (Gem Cutting via Gem Trader Arbitrage, Lv 25–30)**: `+2,937.5` Crafting XP and `+450 GP` in `11.6s` = **~909,210 Crafting XP/hr** and **~139,307 GP/hr** during active cutting/trading (capped in sustained play by the Gem Trader's 1-stock uncut gem restock timer, which still makes checking the Gem Trader on every pass through Al Kharid an effortless `+450 GP` + `+2,937` XP windfall!).
- **Shop prices paid & items needed but couldn't buy**:
  - **Kebab seller** (`(3273, 3180)`): Paid **3 GP** for `3 Kebab` (`1 GP` each).
  - **Dommik's Crafting Store** (`(3320, 3194)`): Paid **1 GP** for `Chisel`.
  - **Gem Trader** (`(3286, 3211)`): Paid **25 GP** for `Uncut sapphire` (sold cut `Sapphire` for **175 GP**); paid **50 GP** for `Uncut emerald` (sold cut `Emerald` for **350 GP**).
  - **Zeke's Superior Scimitars** (`(3287, 3187)`): Paid **112 GP** for `Iron scimitar`.
  - **Louie's Armoured Legs** (`(3315, 3175)`): Paid **280 GP** for `Iron platelegs`.
- **Progression stalls / friction points**:
  - **Tanner Interface (`679`) Component IDs**: Opening `Trade` on `Tanner` opens interface `679` (`tanner`), where the Soft Leather buttons are component `8686` (`tanner:com_93`, Tan All), `8688` (`tanner:com_95`, Tan 5), and `8689` (`tanner:com_96`, Tan 1), rather than `14809`. We will use `8686` in Milestone 9 to tan our 5 `Cowhide` and benchmark Leather Crafting (`Crafting Method 3`).

### Milestone 9: Crafting Method 3 (Leather Cowl Crafting via Tanner Interface 679), Al Kharid Banking, Lowe's Archery Emporium Survey & Smithing Method 2b (Iron Dagger Smithing)
- **What we did & duration** (`05:53:57Z` → `05:58:34Z`, **3m 37s / 217s** total across `task-224` and `task-234`):
  - **Tanning 5 Cowhides at Tanner** (`(3276, 3193)`): Opened `Trade` (`interface 679`) on `Tanner` and clicked component `8686` (`tanner:com_93` = Tan All Soft Leather, `1 GP` each = `5 GP`, `83 GP` → `78 GP`), converting all `5 Cowhide` into `5 Leather` in 1 click!
  - **Crafting Method 3 — Leather Cowl Crafting** (`14.8s`): Stitched `5 Leather cowl` using `Needle` and `Thread` (`+2,313` Crafting XP, advancing Crafting from **Level 30 → 34**). Used up 1 reel of `Thread` (`5` → `4`).
  - **Gem Trader Restock Check** (`(3286, 3211)`): Checked stock ~4 minutes after Milestone 8; both `Uncut sapphire` (`0`) and `Uncut emerald` (`0`) were still at 0 stock, confirming a multi-minute restock timer that prevents infinite zero-cooldown arbitrage loops.
  - **Banking at Al Kharid Bank** (`(3269, 3167)`): Opened bank (`interface 5292`) and deposited `5 Leather cowl`, `Bronze sword`, `Needle`, `4 Thread`, `Tinderbox`, `Chisel`, `Bronze axe`, and `Bronze pickaxe`.
  - **Al Kharid Toll Gate & Aubury's Rune Shop** (`(3253, 3401)`): Paid `10 GP` gate toll (`78 GP` → `68 GP`) and purchased `17 Air rune` (`4 GP` each = `68 GP`, `68 GP` → `0 GP`).
  - **Lowe's Archery Emporium Survey** (`(3233, 3423)`): Surveyed full ranged weapon and ammunition stock and pricing.
  - **Smithing Method 2b — Smithing Iron Daggers at Varrock West Anvil** (`(3188, 3426)`, **8.2s**): Smithed `1 Iron bar` into `1 Iron dagger` (`+625` Smithing XP, advancing Smithing from **Level 22 → 23**).
  - **Safe Spot**: Parked at **Varrock West Bank** (`(3184, 3436)`).
- **Approximate XP/hour & GP/hour**:
  - **Crafting Method 3 (Leather Cowl Crafting, Lv 30–34)**: `+2,313` Crafting XP in `14.8s` (stitching phase) = **~562,660 Crafting XP/hr** (**11.9x faster** than Spinning Wool's `47,368` XP/hr!).
  - **Smithing Method 2b (Anvil Smithing Iron Daggers, Lv 22–23)**: `+625` Smithing XP in `8.2s` = **~273,490 Smithing XP/hr** (**1.72x faster** than Bronze daggers' `159,176` XP/hr; `625` XP per Iron bar vs `312.5` XP per Bronze bar!).
- **Shop prices paid & items needed but couldn't buy**:
  - **Tanner** (`(3276, 3193)`): Paid **5 GP** to tan `5 Cowhide` (`1 GP` each).
  - **Al Kharid Gate**: Paid **10 GP** toll.
  - **Aubury's Rune Shop** (`(3253, 3401)`): Paid **68 GP** for `17 Air rune` (`4 GP` each).
  - **Lowe's Archery Emporium** (`(3233, 3423)`):
    - `Bronze arrow` (stock 2000, buy **1 GP**, sell 0 GP), `Iron arrow` (stock 1500, buy **3 GP**, sell 1 GP), `Steel arrow` (stock 1000, buy **12 GP**, sell 6 GP), `Bolts` (stock 1500, buy **3 GP**, sell 1 GP).
    - `Shortbow` (stock 4, buy **50 GP**, sell 27 GP), `Longbow` (stock 4, buy **80 GP**, sell 44 GP), `Oak shortbow` (stock 2, buy **100 GP**, sell 55 GP), `Oak longbow` (stock 2, buy **160 GP**, sell 88 GP), `Crossbow` (stock 2, buy **70 GP**, sell 38 GP).
- **Progression stalls / friction points**:
  - `bot.depositItem(pat, 10)` returns `success: false` with message `"Deposited X of 10 requested"` when the player holds fewer than 10 of that item, even though the items were successfully deposited into the bank!
  - When smithing the first `Iron dagger` triggered a Smithing level-up (`22 -> 23`), the level-up dialog interrupted the second `smithAtAnvil('dagger')` call (`Smithing interface did not open`).

### Milestone 10: Iron Dagger Smithing & Sale, Quest #3 Completed (Romeo & Juliet, 5 QP) & Rune Mysteries Started (Research Package Obtained)
- **What we did & duration** (`06:01:13Z` → `06:10:48Z`, **9m 35s / 575s** total across `task-252` and `task-262`):
  - **Smithing Method 2b — Finishing 2 Iron Daggers at Varrock West Anvil** (`(3188, 3426)`, **6.6s**): Smithed the remaining `2 Iron bar` into `2 Iron dagger` (`+1,250` Smithing XP, advancing Smithing from **Level 23 → 26**).
  - **Varrock Swordshop Sale** (`(3206, 3398)`): Sold all `3 Iron dagger` for **`60 GP`** (`20 GP` each — **3.87x higher sell value** than `Bronze dagger`'s `5.17 GP` each!).
  - **Aubury's Rune Shop** (`(3253, 3401)`): Purchased `17 Mind rune` (`3 GP` each = `51 GP`, `60 GP` → `9 GP`) to pair with our `17 Air rune`.
  - **Quest #3 Completed — Romeo & Juliet** (**269s / 4m 29s**, **+5 Quest Points**, total **7 QP**):
    - Picked `Cadava berries` in SE Varrock `(3266, 3361)`, spoke to `Juliet` upstairs at `(3158, 3426)` to receive the `Message`, delivered it to `Romeo` in Varrock Square `(3213, 3428)`, spoke to `Father Lawrence` at NE Varrock Church `(3254, 3483)`, brought `Cadava berries` to the `Apothecary` `(3195, 3404)` to brew the `Cadava potion`, gave the potion to `Juliet`, and finished the quest with `Romeo`! Verified in-game (`> Congratulations! Quest complete!`).
  - **Quest #4 Started — Rune Mysteries** (`151s`): Spoke to `Duke Horacio` on Lumbridge Castle 2nd floor `(3210, 3220)` to obtain the `Air talisman`, then walked to the Wizards' Tower basement `(3100, 9570)` and gave the `Air talisman` to `Sedridor` to receive the `Research package` right as the 420s script timer concluded.
- **Approximate XP/hour & GP/hour**:
  - **Smithing Method 2b (Anvil Smithing Iron Daggers, Lv 23–26)**: `2 Iron dagger` in `6.6s` (`+1,250` XP) = **~681,818 Smithing XP/hr** (active anvil phase) and **`20 GP` per dagger** at Varrock Swordshop (**~21,800 GP/hr** gross anvil output).
- **Shop prices paid & items needed but couldn't buy**:
  - **Varrock Swordshop** (`(3206, 3398)`): Sold `3 Iron dagger` for **60 GP** (`20 GP` each).
  - **Aubury's Rune Shop** (`(3253, 3401)`): Paid **51 GP** for `17 Mind rune` (`3 GP` each).
- **Progression stalls / friction points**:
  - Combined `Romeo & Juliet` (`269s`) + `Rune Mysteries` (`~200s`) exceeded the single-script `420s` timeout right after receiving the `Research package` from `Sedridor`. Splitting quests or giving multi-quest runs a higher timeout avoids mid-dialogue cutoffs.

### Milestone 11: Magic Method 1 Started (Wind Strike), Quest #4 Completed (Rune Mysteries, 1 QP + Runecrafting Unlocked) & The Restless Ghost Started
- **What we did & duration** (`06:13:43Z` → `06:21:46Z`, **8m 00s / 480s** total):
  - **Magic Method 1 — Wind Strike (`Spells.WIND_STRIKE`)**: Cast `Wind Strike` on a `Chicken` in the Wizards' Tower basement (`+187` Magic XP + `+98` Hitpoints XP, advancing Magic from **Level 1 → 3** and killing the chicken in 1 hit).
  - **Quest #4 Completed — Rune Mysteries** (**283s / 4m 43s**, **+1 Quest Point**, total **8 QP** + **Runecrafting Skill Unlocked**):
    - Climbed out of the Wizards' Tower basement, walked to `Aubury` in SE Varrock `(3253, 3401)` to deliver the `Research package`, waited for Aubury to hand back his `Notes`, walked back to the Wizards' Tower basement `(3104, 9570)`, and delivered the `Notes` to `Sedridor` (`> Congratulations! Quest complete!`). Received the `Air talisman`.
  - **Quest #5 Started — The Restless Ghost** (`184s`): Spoke to `Father Aereck` in Lumbridge Church `(3243, 3206)`, walked to `Father Urhney` in Lumbridge Swamp `(3147, 3175)` to obtain and equip the `Ghostspeak amulet`, and walked to the Lumbridge graveyard mausoleum `(3246, 3193)` when the 480s script timer ended.
- **Approximate XP/hour & GP/hour**:
  - **Magic Method 1 (Wind Strike on Chickens, Lv 1–3)**: `+187` Magic XP on 1 hit (`137.5` base splash XP + `50` damage XP per damage dealt) = **~224,400 Magic XP/hr** during active combat casting (`3s` / 5-tick spell cooldown) at a cost of `1 Air rune` (`4 GP`) + `1 Mind rune` (`3 GP`) = `7 GP` per cast (~8,400 GP/hr rune cost without an Air staff, or `3 GP` per cast / ~3,600 GP/hr with a `Staff of air`).
- **Shop prices paid & items needed but couldn't buy**:
  - None in this milestone (used runes purchased in Milestone 9/10).
- **Progression stalls / friction points**:
  - In the Wizards' Tower basement `(3100, 9570)`, there is only 1 `Chicken` spawn inside the fenced room, so after killing it in 1 `Wind Strike` hit, the second cast returned `unreachable target` while waiting for respawn. Multi-spawn areas (Lumbridge Chicken Pen `(3231, 3297)` or Goblin Village/Lumbridge Goblins) are needed for continuous Magic casting.

### Milestone 12: Quest #5 Completed (The Restless Ghost, 1 QP + Prayer Lv 10 → 48!), Magic Method 1 Sustained Benchmark (Wind Strike, Lv 3 → 14) & Witch's Potion Started
- **What we did & duration** (`06:24:07Z` → `06:32:11Z`, **8m 00s / 480s** total):
  - **Quest #5 Completed — The Restless Ghost** (**248s / 4m 08s**, **+1 Quest Point**, total **9 QP** + **`+28,125` Prayer XP**):
    - Opened the `Coffin` at Lumbridge Graveyard `(3249, 3193)` and spoke to the `Restless ghost` with the `Ghostspeak amulet` equipped, walked to the Wizards' Tower basement `(3119, 9566)` to take the `Skull` from the altar (escaping the Level 13 `Skeleton`), returned to the graveyard `(3249, 3193)`, and placed the `Skull` into the open `Coffin`!
    - **Massive Progression Milestone**: The `+28,125` Prayer XP reward (`1,125 * 25`) rocketed Prayer from **Level 10 → 48** (`29,249` total XP), unlocking **Protect from Magic (Lv 37)**, **Protect from Missiles (Lv 40)**, and **Protect from Melee (Lv 43)**! Combat Level rose from **19 → 26**!
  - **Magic Method 1 — Sustained Wind Strike Benchmark at Lumbridge Chicken Pen** (`(3231, 3297)`, **61.6s**):
    - Unequipped `Iron platelegs` and cast `Wind Strike` (`Spells.WIND_STRIKE = 1152`) 9 times on `Chicken`s (`100%` hit rate: `+138`, `+237`, `+138`, `+137`, `+188`, `+137`, `+238`, `+187`, `+188` Magic XP = **`+1,588` Magic XP**), advancing Magic from **Level 3 → 14** (`1,775` total XP).
  - **Quest #6 Started — Witch's Potion** (`140s`): Banked extra items at Draynor Bank `(3092, 3243)`, spoke to `Hetty` in Rimmington `(2968, 3205)`, killed a `Rat` (`+1,200` Strength XP, Lv 13 → 17) to loot `Rat's tail`, and picked an `Onion` north of Rimmington `(2952, 3251)`.
- **Approximate XP/hour & GP/hour**:
  - **The Restless Ghost Quest (`1 QP`)**: `+28,125` Prayer XP in ~432s total (`184s` + `248s`) = **~234,375 Prayer XP/hr** (and instantly unlocks all three overheads at Level 43+!).
  - **Magic Method 1 (Sustained Wind Strike at Lumbridge Chicken Pen, Lv 3–14)**: `+1,588` Magic XP across 9 successful casts in `61.6s` = **~92,811 Magic XP/hr** (`~176.4` XP per cast) at a rune cost of `7 GP` per cast (`1 Air` + `1 Mind` = `-3,680 GP/hr`).
- **Shop prices paid & items needed but couldn't buy**:
  - None in this milestone.
- **Progression stalls / friction points**:
  - When a `Chicken` survived a 1-damage `Wind Strike` hit and attacked back in melee, subsequent `bot.castSpell(otherChicken, Spells.WIND_STRIKE)` calls on a different chicken failed with `"Cannot cast on Chicken: I'm already under attack!"` (single-way combat zone restriction). Re-casting on the *same* chicken that is attacking the player (or waiting until out of combat) avoids this rejection.

### Milestone 13: Port Sarim & Falador Shop Surveys (Betty, Wydin, Flynn, Wayne), Quest #6 Completed (Witch's Potion, 1 QP + Magic Lv 14 → 33) & Quest #7 Completed (Doric's Quest, 1 QP + Mining Lv 33 → 54)
- **What we did & duration** (`06:37:38Z` → `06:43:49Z`, **6m 09s / 369s** total):
  - **Port Sarim Shop Surveys**:
    1. **Betty's Magic Emporium** (`(3014, 3259)`): Inspected rune, `Eye of newt`, and `Wizards hat` prices and stock.
    2. **Wydin's Food Store** (`(3014, 3204)`): Inspected food and cooking ingredient prices and stock.
  - **Quest #6 Completed — Witch's Potion** (**65s**, **+1 Quest Point**, total **10 QP** + **`+8,125` Magic XP**):
    - Purchased `Eye of newt` (`3 GP`) from `Betty` and `Raw beef` (`1 GP`) from `Wydin`, cooked and intentionally burned the meat on the Rimmington range `(2969, 3210)` (`+750` Cooking XP) to obtain `Burnt meat`, handed all 4 ingredients (`Rat's tail`, `Onion`, `Eye of newt`, `Burnt meat`) to `Hetty` `(2968, 3205)`, and drank from the `Cauldron`!
    - **Progression Milestone**: The `+8,125` Magic XP reward (`325 * 25`) boosted Magic from **Level 14 → 33** (`9,900` total XP), unlocking **Varrock Teleport (Lv 25)**, **Lumbridge Teleport (Lv 31)**, and **Telekinetic Grab (Lv 33)**!
  - **Quest #7 Completed — Doric's Quest** (**213s / 3m 33s**, **+1 Quest Point**, total **11 QP** + **`+32,500` Mining XP** + **`180 GP`**):
    - Banked extra items at Draynor Bank `(3092, 3243)`, mined `6 Clay` (`(2986, 3239)`), `4 Copper ore` (`(2977, 3247)`), and `2 Iron ore` (`(2969, 3240)`) at Rimmington Mine (`+4,250` Mining XP), walked north past Falador to `Doric`'s anvil hut `(2951, 3451)`, and handed in all 12 ores (`> Doric hands you 180 coins. Congratulations! Quest complete!`).
    - **Progression Milestone**: Mining + quest reward (`+36,750` Mining XP total) propelled Mining from **Level 33 → 54** (`46,375` total XP) and added **`+180 GP`** (`5 GP` → `185 GP`)!
  - **Falador Shop Surveys & Safe Spot**:
    1. **Flynn's Mace Market** (`(2950, 3387)`): Recorded Bronze through Adamant mace prices.
    2. **Wayne's Chains** (`(2972, 3312)`): Recorded Bronze through Adamant chainbody prices.
    3. Parked safely at **Falador West Bank** (`(2945, 3370)`), Combat Level **30**.
- **Approximate XP/hour & GP/hour**:
  - **Witch's Potion Quest (`1 QP`)**: `+8,125` Magic XP in `205s` total (`140s` + `65s`) = **~142,682 Magic XP/hr**.
  - **Doric's Quest + Rimmington Mining (`1 QP`, Mining Method 3: Clay/Copper/Iron)**: `+36,750` Mining XP and `+180 GP` in `213s` = **~621,126 Mining XP/hr** and **~3,042 GP/hr** (plus permanent access to Doric's two anvils at `(2951, 3451)`!).
- **Shop prices paid & items needed but couldn't buy**:
  - **Betty's Magic Emporium** (`(3014, 3259)`): Paid **3 GP** for `Eye of newt`. Full stock: `Fire/Water/Air/Earth rune` x1000 (buy 4 GP, sell 2 GP), `Mind/Body rune` x1000 (buy 3 GP, sell 1 GP), `Chaos rune` x1000 (buy 15 GP, sell 9 GP), `Death rune` x1000 (buy 30 GP, sell 18 GP), `Eye of newt` x300 (buy **3 GP**, sell 1 GP), `Wizards hat` x1 (buy **2 GP**, sell 1 GP).
  - **Wydin's Food Store** (`(3014, 3204)`): Paid **1 GP** for `Raw beef`. Full stock: `Pot of flour` x3 (buy 10 GP), `Raw beef` x1 (buy 1 GP), `Raw chicken` x1 (buy 1 GP), `Cabbage` x3 (buy 1 GP), `Banana` x3 (buy 2 GP), `Redberries` x1 (buy 3 GP), `Bread` x0 (buy 12 GP), `Chocolate bar` x1 (buy 10 GP), `Cheese` x3 (buy 4 GP), `Tomato` x3 (buy 4 GP), `Potato` x1 (buy 1 GP).
  - **Flynn's Mace Market** (`(2950, 3387)`): `Bronze mace` x5 (buy 18 GP, sell 10 GP), `Iron mace` x4 (buy 63 GP, sell 37 GP), `Steel mace` x4 (buy 225 GP, sell 135 GP), `Mithril mace` x3 (buy 585 GP, sell 351 GP), `Adamant mace` x2 (buy 1,440 GP, sell 864 GP).
  - **Wayne's Chains** (`(2972, 3312)`): `Bronze chainbody` x3 (buy 60 GP, sell 39 GP), `Iron chainbody` x2 (buy 210 GP, sell 136 GP), `Steel chainbody` x1 (buy 750 GP, sell 487 GP), `Black chainbody` x1 (buy 1,440 GP, sell 936 GP), `Mithril chainbody` x1 (buy 1,950 GP, sell 1,267 GP), `Adamant chainbody` x1 (buy 4,800 GP, sell 3,120 GP).
- **Progression stalls / friction points**:
  - None! Both `Witch's Potion` and `Doric's Quest` completed on the first pass.

### Milestone 14a: Goblin Diplomacy Dyes Crafted (Aggie + Wyson) & Melee Combat Method 3 (Goblin Village Goblins: Strength Lv 17 → 39, HP Lv 17 → 30, Combat Lv 30 → 40!)
- **What we did & duration** (`06:46:47Z` → `07:04:52Z`, **17m 22s / 1,042s** across `task-328` and `task-344`):
  - **Goblin Diplomacy — Rumours & Dyes Crafted** (`540s`):
    - Spoke to the `Bartender` at the Rusty Anchor Inn in Port Sarim `(3045, 3257)` to start the quest dialogue.
    - Purchased `2 Woad leaf` (`20 GP`) from `Wyson the gardener` in Falador Park `(3027, 3379)`, picked `Onions` and gathered `Redberries`, and paid `Aggie` the witch in Draynor Village `(3086, 3259)` `5 GP` each (`15 GP` total) to make `Red dye`, `Yellow dye`, and `Blue dye`, then mixed `Red dye` + `Yellow dye` into `Orange dye`!
  - **Melee Combat Method 3 — Killing Level 5 Goblins in Goblin Village** (`(2956, 3500)`, **502s**):
    - Fought Level 5 `Goblin`s in Goblin Village to farm `Goblin mail` drops. Obtained `1 Goblin mail` so far while gaining **`+31,700` Strength XP** (advancing Strength from **Level 17 → 39**!) and **`+10,413` Hitpoints XP** (advancing Hitpoints from **Level 17 → 30**, `35/38` HP!), boosting Combat Level from **30 → 40**!
- **Approximate XP/hour & GP/hour**:
  - **Melee Combat Method 3 (Goblin Village Level 5 Goblins, Lv 30–40)**: `+31,700` Strength XP and `+10,413` Hitpoints XP in `502s` = **~227,330 Melee XP/hr** and **~74,674 Hitpoints XP/hr** (**1.98x faster** than Lumbridge Cows' `114,813` XP/hr and **3.63x faster** than Chickens' `62,585` XP/hr due to massive multi-spawn density in Goblin Village!).
- **Shop prices paid & items needed but couldn't buy**:
  - **Wyson the gardener** (`(3027, 3379)`): Paid **20 GP** for `2 Woad leaf` via dialogue (`"How about 20 coins?"`).
  - **Aggie the Witch** (`(3086, 3259)`): Paid **15 GP** (`5 GP` x 3) to craft `Red dye`, `Yellow dye`, and `Blue dye`.
- **Progression stalls / friction points**:
  - `Goblin mail` drop rate from Level 5 Goblins in Goblin Village has RNG variance (yielded 1 `Goblin mail` in ~60 kills over 502s). Switching combat style to Attack (`0`) for the remaining 2 `Goblin mail` drops balances melee stats while finishing the quest.

### Milestone 14b: Goblin Village Melee Attack Benchmark (Lv 13 → 53) & Drop Table Discovery (471s)
- **What we did & how long it took**:
  1. Switched combat style to **Accurate (`0`, Attack XP)** and trained on Level 5 Red and Green Goblins (`id 298`, `299`) at Goblin Village `(2956, 3500)` for **471 seconds (~7.85 minutes)** before starting **The Knight's Sword** at the Squire in Falador Castle `(2977, 3342)`.
  2. Raised **Attack from Level 13 (`2,300` XP) to Level 53 (`41,100` XP)** (`+38,800` Attack XP) and **Hitpoints from Level 30 (`14,355` XP) to Level 47 (`27,117` XP)** (`+12,762` HP XP), pushing **Combat Level from 40 to 54** and **Total Skill Level from 411 to 479**.
- **Approximate XP/hour and GP/hour**:
  - **Melee Combat (Attack Style on Level 5 Goblins, 471s)**:
    - **Attack XP**: `+38,800` XP in 471s = **`~296,560 Attack XP/hr`** (+ **`~97,544 Hitpoints XP/hr`** = **`~394,104 combined combat XP/hr`**!).
    - **GP/hour**: **`~900 GP/hr`** in coin drops (banked `Orange dye`, `Blue dye`, and `Goblin mail x1` at Falador West Bank before starting `The Knight's Sword`).
- **Shop prices paid & items needed**:
  - None (zero food consumed at Defence 12 + Iron Platelegs + HP 47).
- **Progression stalls / friction points (Critical Mechanic Discovery)**:
  - **Why Goblin Village Goblins Rarely Drop `Goblin mail`**: Inspecting `server/content/scripts/drop tables/scripts/goblin.rs2` revealed `if (npc_findhero = ^false) return;` on Goblin death. Because Red Goblins (`id 299`) and Green Goblins (`id 298`) constantly fight each other in Goblin Village, any Goblin that has already taken >50% damage from another Goblin has no player hero credit (`npc_findhero = ^false`) and drops **nothing** (not even `Bones`)!
  - **Solution**: Either filter Goblin Village targets to full-HP Goblins (`n.hp === n.maxHp` or `!n.inCombat`) OR farm the remaining 2 `Goblin mail` from **Lumbridge Level 2 Goblins `(3248, 3238)`**, which never fight each other, die in 1 hit at Strength 51, and roll the `5/128` (`~1/25.6`) `goblin_armour` drop table on 100% of kills!

### Milestone 15: The Knight's Sword Quest (`1 QP`, Smithing Lv 26 → 82, `+318,750` XP)
- **What we did & how long it took**:
  1. Completed **The Knight's Sword (`1 QP`)** end-to-end across `task-418` and `task-427` (**484s** completion run):
     - Spoke to the **Squire** in Falador Castle courtyard `(2977, 3342)` and **Reldo** in Varrock Palace Library `(3211, 3494)` about the Imcando dwarves.
     - Collected a `Pie dish` and `Bucket of water` in Varrock Palace Kitchen `(3222, 3494)`, picked `Redberries` at SE Varrock `(3267, 3371)`, and mined 5 `Iron ore` at SE Varrock `(3285, 3368)` (`+4,812` Mining XP, Mining Lv 54 → **55**).
     - Bought 2 `Pot of flour` from **Wydin's Food Store** `(3014, 3204)`, mixed `Pastry dough` → `Pie shell` → `Uncooked berry pie`, and baked `Redberry pie` on the Port Sarim Range `(3016, 3238)` (`+1,950` Cooking XP, Cooking Lv 36 → **37**).
     - Smelted 2 `Iron bar` at the Falador Furnace `(2974, 3369)` (`+625` Smithing XP) and gave the `Redberry pie` to **Thurgo** at Mudskipper Point `(3001, 3144)`.
     - Returned to the Squire, climbed to Level 2 of Falador Castle East Wing `(2984, 3338)`, waited for **Sir Vyvin** to step away from the cupboard `(2984, 3336)`, and searched it for the `Portrait`.
     - Delivered the `Portrait` to Thurgo, climbed down into the Asgarnian Ice Dungeon `(3008, 3150)` → `(3049, 9566)`, mined 1 `Blurite ore` past Level 53 Ice Warriors and Level 57 Ice Giants, had Thurgo forge the `Blurite sword`, and handed it to the Squire (`+318,125` Smithing XP quest reward!).
  2. Raised **Smithing from Level 26 (`5,617` XP) to Level 82 (`324,367` XP)** (`+56` Smithing levels in one quest!), unlocking **Bronze, Iron, Steel, Mithril, and Adamantite smelting & full-armour smithing**, and pushing **Total Skill Level from 479 to 537** and **Quest Points to `12 QP`** (unlocking **Black Knights' Fortress**!).
- **Approximate XP/hour and GP/hour**:
  - **The Knight's Sword (484s completion run)**:
    - **Smithing XP**: `+318,750` XP in 484s = **`~2,370,867 Smithing XP/hr`**!
    - **Mining XP**: `+4,812` XP (`5 Iron ore` + `1 Blurite ore`).
    - **Cooking XP**: `+1,950` XP (`Redberry pie` on Port Sarim range).
- **Shop prices paid & items needed**:
  - **Wydin's Food Store `(3014, 3204)`**: Bought `2x Pot of flour` (`20 GP`).
- **Progression stalls / friction points**:
  - **Item Naming Subtlety (`Uncooked berry pie`)**: Combining `Pie shell` (`2315`) + `Redberries` (`1951`) produces item ID `2321`, whose in-game display name in Lost City 377 is **`Uncooked berry pie`** (not `Uncooked redberry pie`), whereas cooking it produces **`Redberry pie`** (`2325`). Updated regex to `/^uncooked (red)?berry pie$/i`.

### Milestone 16: Goblin Diplomacy Quest (`5 QP`, `+5,000` Crafting XP, Defence Lv 12 → 27)
- **What we did & how long it took**:
  1. Completed **Goblin Diplomacy (`5 QP`)** in **310.1 seconds**:
     - Withdrew `Orange dye`, `Blue dye`, and `Goblin mail x1` from the bank and walked to the **Lumbridge Level 2 Goblin camp `(3248, 3238)`** (applying our Milestone 14b `npc_findhero` discovery).
     - Switched combat style to **Defensive (`3`, Defence XP)** and farmed the remaining `2x Goblin mail` drops in under 2 minutes while raising **Defence from Level 12 (`1,300` XP) to Level 27 (`5,800` XP)** (`+4,500` Defence XP)!
     - Combined `Orange dye` + `Goblin mail` → `Orange goblin mail` and `Blue dye` + `Goblin mail` → `Blue goblin mail`, walked to Goblin Village `(2957, 3511)`, and handed all three armours (`Orange goblin mail`, `Blue goblin mail`, and brown `Goblin mail`) to **General Wartface** (`+5,000` Crafting XP, Crafting Lv 34 → **38**, and **`1x Gold bar`** reward!).
- **Approximate XP/hour and GP/hour**:
  - **Lumbridge Level 2 Goblins (Defence Style `3`) + Goblin Diplomacy Hand-In (310.1s)**:
    - **Crafting XP**: `+5,000` XP (`~58,045 Crafting XP/hr`).
    - **Defence XP**: `+4,500` XP (`~52,241 Defence XP/hr` including walk to Goblin Village).
    - **Reward**: `1x Gold bar` (`5 QP`).
- **Shop prices paid & items needed**:
  - None (used previously crafted `Orange dye` and `Blue dye`).
- **Progression stalls / friction points**:
  - Farming `Goblin mail` at Lumbridge `(3248, 3238)` was ~5x faster than Goblin Village because Lumbridge Level 2 Goblins never fight each other (`npc_findhero` is always `true`).

### Milestone 17: Vampyre Slayer Quest (`3 QP`, Attack Lv 53 → 72, `+120,625` XP)
- **What we did & how long it took**:
  1. Completed **Vampyre Slayer (`3 QP`)** end-to-end in **471.0 seconds**:
     - Spoke to **Morgan** in Draynor Village `(3098, 3268)` to start the quest, climbed to Level 1 `(3097, 3268)`, and searched his cupboard for `Garlic`.
     - Walked to the **Blue Moon Inn** in Varrock `(3277, 3488)`, bought a `Beer` (`2 GP`) from the Bartender, and spoke to **Dr Harlow** twice to receive the `Stake`.
     - Entered the **Draynor Manor Crypt** `(3116, 3356)` → `(3078, 9775)` carrying `Stake`, `Hammer`, `Garlic`, and `Cabbage x14`, opened the Coffin, defeated **Count Draynor** (Level 34), and automatically hammered the `Stake` into his chest (`> You hammer the stake into the vampire's chest! > Congratulations! Quest complete!`).
  2. Raised **Attack from Level 53 (`41,100` XP) to Level 72 (`161,725` XP)** (`+120,625` Attack XP — unlocking **Dragon & Barrows/Whip-tier Attack requirements**!), **Hitpoints from Level 47 to Level 48** (`+1,548` HP XP), and **Defence from Level 27 to Level 28** (`+250` XP), pushing **Combat Level from 54 to 65**, **Total Skill Level from 537 to 578**, and **Quest Points to `20 QP` across 10 Completed Quests**!
- **Approximate XP/hour and GP/hour**:
  - **Vampyre Slayer (471.0s)**:
    - **Attack XP**: `+120,625` XP in 471.0s = **`~921,974 Attack XP/hr`**!
- **Shop prices paid & items needed**:
  - **Blue Moon Inn Bartender `(3277, 3488)`**: `1x Beer` (`2 GP`).
- **Progression stalls / friction points**:
  - With `Garlic` in inventory, `Iron scimitar`, and Level 53 Attack / 51 Strength, Count Draynor died in seconds without requiring a single food item (`HP 48/48`).

### Milestone 18: Ernest the Chicken Quest (`4 QP`, `+300 GP`, Basement Lever Puzzle)
- **What we did & how long it took**:
  1. Completed **Ernest the Chicken (`4 QP`)** end-to-end in **396.7 seconds (~6.6 minutes)**:
     - Spoke to **Veronica** outside Draynor Manor `(3110, 3330)`, climbed to Level 1 `(3108, 3356)` to pick up `Fish food`, and spoke to **Professor Oddenstein** on Level 2 `(3110, 3366)`.
     - Picked up `Poison` from the Witch's room on Level 0 `(3097, 3366)`, combined `Poison` + `Fish food` → `Poisoned fish food`, poisoned the piranhas in the SW Fountain `(3088, 3335)`, and searched the fountain for the **`Pressure gauge`**.
     - Picked up the `Spade` in the east room `(3120, 3359)`, dug the **Compost heap** `(3086, 3361)` for the small `Key`, unlocked the skeleton closet `(3107, 3367)`, and grabbed the **`Rubber tube`**.
     - Searched the secret bookcase `(3098, 3358)`, climbed down to the **Draynor Manor Basement Lever Puzzle** `(3116, 9754)`, executed the full 9-room lever sequence (`B` + `A` down → `D` down → `A` + `B` up → `E` + `F` down → `C` down → `E` up) to reach Room 9 `(3092, 9755)` and retrieve the **`Oil can`**.
     - Returned to Professor Oddenstein on Level 2 `(3110, 3366)` and handed in the `Pressure gauge`, `Rubber tube`, and `Oil can` to transform Ernest back into a human (`+300 GP` reward, `Coins: 127 → 427`, **11 Quests Complete / `24 QP`**!).
- **Approximate XP/hour and GP/hour**:
  - **Ernest the Chicken (396.7s)**:
    - **GP/hour**: `+300 GP` in 396.7s = **`~2,722 GP/hr`** (+ `4 QP`).
- **Shop prices paid & items needed**:
  - **Horvik's Armour Shop `(3229, 3437)`** (during Black Knights' Fortress prep immediately after): Bought `1x Iron chainbody` for **`210 GP`** (`Coins: 427 → 217`), plus picked up `1x Bronze med helm` (`0 GP` spawn in Draynor Manor `(3122, 3360)`) and `1x Cabbage` (`id 1965` at `(3054, 3285)`).
- **Progression stalls / friction points**:
  - None — the Draynor Manor basement lever puzzle completed cleanly on the first pass.

### Milestone 18b: Black Knights' Fortress Spying & Level 33 Black Knight Combat Benchmark
- **What we did & how long it took**:
  1. Started **Black Knights' Fortress (`3 QP`)** at **Sir Amik Varze** on Level 2 of the White Knights' Castle West Tower `(2961, 3337)`, equipped `Bronze med helm` and `Iron chainbody`, infiltrated the **Black Knights' Fortress** `(3016, 3514)`, navigated the L0→L1→L2→L1→L0 secret wall & ladder maze, and listened at the **Grill** `(3025, 3507)` (`listened = true`).
  2. While returning across Level 1 `(3025, 3511)`, engaged Level 33 Black Knights in Defensive combat style (`3`), gaining **`+5,800` Defence XP (Defence Lv 28 → 36)** and **`+5,997` Hitpoints XP (HP Lv 48 → 50)** before a multi-knight pile-on without food caused a respawn in Lumbridge (keeping `Iron scimitar`, `Iron platelegs`, and `Iron chainbody`).
  3. Immediately transitioned into **Pirate's Treasure** prep, banking equipment, withdrawing `Spade`, farming Goblins (`+12,500` Strength XP, Strength Lv 51 → **55**), and buying a **`White apron` (`2 GP`)** from **Thessalia's Fine Clothes** `(3206, 3416)` in Varrock.
- **Approximate XP/hour and GP/hour**:
  - **Combat XP Gained**: `+5,800` Defence XP (Lv 28 → **36**), `+12,500` Strength XP (Lv 51 → **55**), `+5,997` Hitpoints XP (Lv 48 → **50**), pushing **Combat Level from 65 to 68** and **Total Skill Level from 578 to 592**.
- **Shop prices paid & items needed**:
  - **Thessalia's Fine Clothes `(3206, 3416)`**: Bought `1x White apron` (`2 GP`).
- **Progression stalls / friction points**:
  - On Level 1 of the Black Knights' Fortress (`(3021, 3515)`), `bot.walkTo` can get blocked if the two adjacent doors at `(3019, 3515)` and `(3021, 3515)` are closed while a Level 33 Black Knight is in combat with the player. Replaced `bot.walkTo` on that corridor with direct `walkInRoom` + door open steps.

---

## Summary Dataset: Skills, Methods, XP/hr, GP/hr & Balancing Findings

### 1. Skill Training Benchmarks (25x Server XP Rate)

| Skill | Method # | Training Method & Location | Level Range | Measured XP/hr | Measured GP/hr | Notes / Bottlenecks |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **Woodcutting** | 1 | Regular Trees (Lumbridge `(3205, 3228)`) | 1 → 22 | **~281,203 XP/hr** | ~0 GP/hr | Bronze axe (free spawn). Fast early levels. |
| **Woodcutting** | 2 | Oak Trees (Lumbridge `(3205, 3228)`) | 22 → 38 | **~270,726 XP/hr** | ~0 GP/hr | Slightly slower chop rate with Bronze axe; multi-log yield per tree. |
| **Firemaking** | 1 | Burning Regular Logs (`Tinderbox` 1 GP) | 1 → 27 | **~1,173,148 XP/hr** | -1 GP (tool) | Extremely fast (`1,000` XP/log, ~3s per burn). |
| **Firemaking** | 2 | Burning Oak Logs (`Tinderbox` 1 GP) | 27 → 39 | **~1,762,786 XP/hr** | -1 GP (tool) | Highest raw XP/hr tested (`1,500` XP/log). |
| **Fletching** | 1 | Arrow Shafts (Regular Logs + free `Knife`) | 1 → 8 | **~241,179 XP/hr** | ~0 GP/hr | `125` XP/log (fletching phase; ~65k XP/hr w/ chopping). |
| **Fletching** | 2 | Unstrung Shortbows (Regular Logs + `Knife`) | 8 → 11 | **~160,385 XP/hr** | **~3,500 GP/hr** | Sells to Lumbridge Gen Store for ~7.75 GP each (`50` item id is named `Shortbow`). |
| **Fishing** | 1 | Small Net Shrimp (Draynor `(3087, 3230)`) | 3 → 14 | **~73,322 XP/hr** | ~0 GP/hr | **Hazard**: Lv 7 Dark Wizards aggro at `z >= 3231`. Don't spam-click spot! |
| **Fishing** | 2 | Bait Fishing Sardines (Draynor `(3087, 3227)`) | 14 → 22 | **~184,885 XP/hr** | -1,500 GP/hr | **2.52x faster** than Net Fishing; requires `Fishing rod` (5 GP) + `Fishing bait` (3 GP ea) from Port Sarim. |
| **Cooking** | 1 | Cook's Assistant Quest + Cooking Shrimps | 1 → 31 | **~1,345,962 XP/hr** | ~0 GP/hr | Quest takes 168s (`+7,500` XP, Lv 1 → 30) and unlocks Castle Range. |
| **Cooking** | 2 | Cooking Raw Chicken (Lumbridge Castle Range) | 31 → 37 | **~1,185,250 XP/hr** | ~0 GP/hr | Zero burns at Lv 31+; heals 3 HP per chicken. |
| **Thieving** | 1 | Pickpocketing Men (Lumbridge/Al Kharid) | 5 → 22 | **~120,599 XP/hr** | **~1,809 GP/hr** | Must wait ~4.5s after stun or server discards op (`opRejectedCount`). |
| **Thieving** | 2 | East Varrock Tea Stall (`(3268, 3410)`) | 20 → 23 | **~180,000 XP/hr** | ~0 GP/hr | `400` XP/steal (~7.5s respawn), zero stun damage, free 3 HP heal (`Cup of tea`). |
| **Melee Combat** | 1 | Killing Chickens (`(3231, 3297)`) | 1 → 7 | **~62,585 XP/hr** | ~0 GP/hr | Safe (max hit 0), drops `Raw chicken`, `Bones`, `Feather`. |
| **Melee Combat** | 2 | Killing Lumbridge Cows (`(3255, 3278)`) | 6 → 13 | **~114,813 XP/hr** | ~2,600 GP/hr (hides) | **1.83x faster** than Chickens; drops `Cowhide` + `Bones` + `Raw beef`. |
| **Melee Combat** | 3 | Killing Goblin Village Goblins (`(2956, 3500)`) | 13 → 53 | **~296,560 XP/hr** | ~1,200 GP/hr | **2.58x faster** than Cows (`+97,544` HP XP/hr); drops `Goblin mail` only if player is top damager (`npc_findhero`). |
| **Melee Combat** | 4 | Vampyre Slayer Quest (`3 QP`) | 53 → 72 | **~921,974 XP/hr** | -2 GP | `+120,625` Attack XP in 471s — jumps Attack from 53 to 72! |
| **Magic** | 1 | Wind Strike (`Spells.WIND_STRIKE` at Chickens) | 1 → 14 | **~92,811 XP/hr** | -3,680 GP/hr | `~176.4` XP/cast (`7 GP`/cast in runes; `3 GP`/cast with Staff of air). |
| **Magic** | 2 | Witch's Potion Quest (`1 QP`) | 14 → 33 | **~142,682 XP/hr** | -4 GP | `+8,125` XP in 205s — unlocks Varrock/Lumbridge Teleports & Telegrab! |
| **Prayer** | 1 | Burying Chicken Bones (`(3231, 3297)`) | 1 → 5 | **~17,600 XP/hr** | 0 GP/hr | `112.5` XP per bone buried alongside Melee Method 1. |
| **Prayer** | 2 | Burying Cow Bones (`(3255, 3278)`) | 5 → 10 | **~15,009 XP/hr** | 0 GP/hr | `112.5` XP per bone buried alongside higher-HP Cows. |
| **Prayer** | 3 | The Restless Ghost Quest (`1 QP`) | 10 → 48 | **~234,375 XP/hr** | 0 GP/hr | `+28,125` XP in 432s — unlocks Protect from Magic/Missiles/Melee! |
| **Mining** | 1 | Copper & Tin Ore (SE Varrock `(3286, 3365)`) | 1 → 25 | **~221,821 XP/hr** | ~0 GP/hr | 1-tick rock extraction at Lv 15+; `437.5` XP/ore. |
| **Mining** | 2 | Iron Ore (SE Varrock `(3286, 3368)`) | 25 → 33 | **~447,265 XP/hr** | ~0 GP/hr | **2.02x faster** than Copper/Tin (`875` XP/ore + fast respawn). |
| **Mining** | 3 | Doric's Quest + Rimmington Clay/Copper/Iron | 33 → 55 | **~621,126 XP/hr** | **~3,042 GP/hr** | `+36,750` XP & `+180 GP` in 213s; unlocks Doric's anvils. |
| **Smithing** | 1a | Smelting Bronze Bars (Lumbridge Furnace) | 1 → 9 | **~202,321 XP/hr** | ~0 GP/hr | 100% success (`155` XP/bar), furnace phase only (~35k XP/hr w/ walk). |
| **Smithing** | 1b | Smelting Iron Bars (Al Kharid Furnace) | 18 → 22 | **~49,329 XP/hr** | ~0 GP/hr | ~53–60% base success rate (`312.5` XP/bar). |
| **Smithing** | 2a | Smithing Bronze Daggers (Varrock West Anvil) | 9 → 18 | **~159,176 XP/hr** | **~2,630 GP/hr** | `312.5` XP/bar; sells to Varrock Swordshop for ~5.17 GP each. |
| **Smithing** | 2b | Smithing Iron Daggers (Varrock West Anvil) | 22 → 26 | **~681,818 XP/hr** | **~21,800 GP/hr** | `625` XP/bar; sells to Varrock Swordshop for **20 GP each** (`3.87x` Bronze!). |
| **Smithing** | 3 | The Knight's Sword Quest (`1 QP`) | 26 → 82 | **~2,370,867 XP/hr** | -20 GP | `+318,750` XP in 484s — jumps straight to Level 82 Smithing (Adamantite)! |
| **Crafting** | 1 | Sheep Shearer + Spinning 20 Balls of Wool | 1 → 25 | **~47,368 XP/hr** | +60 GP (quest) | Spinning phase (`62.5` XP/ball); Quest adds `+4,375` XP (Lv 1 → 25). |
| **Crafting** | 2 | Gem Cutting via Gem Trader Arbitrage | 25 → 30 | **~909,210 XP/hr** | **~139,307 GP/hr** | `+450 GP` & `+2,937.5` XP in 11.6s (`Uncut sapphire` 25→175 GP, `Uncut emerald` 50→350 GP). |
| **Crafting** | 3 | Leather Cowl Crafting (Al Kharid Tanner `679`) | 30 → 38 | **~562,660 XP/hr** | -1 GP/hide | **11.9x faster** than Spinning Wool (`462.5` XP/cowl) + Goblin Diplomacy (`+5,000` XP). |

### 2. Key Economy & Progression Balancing Findings
1. **Al Kharid Gem Trader Arbitrage (Verified Live: +450 GP in 11.6s, Multi-Minute Restock)**: The Gem Trader `(3286, 3211)` sells `Uncut sapphire` for `25 GP` (stock 1) and `Uncut emerald` for `50 GP` (stock 1), while buying cut `Sapphire` for `175 GP` and cut `Emerald` for `350 GP`. Starting with `25 GP` and a `1 GP Chisel` at Level 25 Crafting, cutting the Sapphire raised Crafting to Level 28 (`>= 27` needed for Emerald) and gave `175 GP`, which immediately funded buying & cutting the Emerald for `350 GP` (`475 GP` total = **+450 GP profit** in 11.6s), financing our `Iron scimitar` (`112 GP`) and `Iron platelegs` (`280 GP`). Re-checking 4 minutes later showed both uncut gems still at `0` stock, confirming a multi-minute restock timer.
2. **Pickaxe Progression Gap**: Bob's Brilliant Axes in Lumbridge only stocks `Bronze pickaxe` (`1 GP`). New players in Lumbridge/Varrock cannot upgrade to Iron/Steel/Mithril pickaxes locally without traveling to Dwarven Mine (Nurmof).
3. **Furnace vs. Anvil Separation**: Varrock has mines and anvils (`(3188, 3426)`) while Lumbridge and Al Kharid have furnaces (and Al Kharid lacks an anvil), creating a heavy walking bottleneck for early Smithing unless players mine at Al Kharid/SE Varrock, smelt in Al Kharid/Lumbridge, bank, and smith at Varrock West.
4. **Draynor Fishing Spot Death Trap**: Level 7 Dark Wizards `(3084, 3236)` aggro onto low-level players clicking the northern fishing spots (`z >= 3231`) at Draynor `(3087, 3230)`. Staying on the southern spot `(3087, 3227)` avoids aggro.
5. **Goblin Village `npc_findhero` Drop Table Mechanic**: Because Red and Green Goblins in Goblin Village `(2956, 3500)` fight each other, any Goblin that took >=50% of its damage from another Goblin fails `npc_findhero` on death and drops nothing. Farming `Goblin mail` for *Goblin Diplomacy* is far faster on Lumbridge Level 2 Goblins `(3248, 3238)` or full-HP Goblins.
6. **Current Character State (`bot3`)**: Combat Level 65 (`HP 48/48`), Falador `(2966, 3370)`, Total Skill Level **578** across 15 trained skills (`Smithing 82`, `Attack 72`, `Mining 55`, `Strength 51`, `Prayer 48`, `Hitpoints 48`, `Firemaking 39`, `Woodcutting 38`, `Crafting 38`, `Cooking 37`, `Magic 33`, `Defence 28`, `Thieving 23`, `Fishing 22`, `Fletching 11`), **11 Quests Complete (`24 QP`)**: `Cook's Assistant`, `Sheep Shearer`, `Romeo & Juliet`, `Rune Mysteries`, `The Restless Ghost`, `Witch's Potion`, `Doric's Quest`, `The Knight's Sword`, `Goblin Diplomacy`, `Vampyre Slayer`, `Ernest the Chicken`.


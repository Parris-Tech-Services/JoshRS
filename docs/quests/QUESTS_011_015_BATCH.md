# Quests 11–15 — verification batch

| # | Quest | QP wiki/content | XP wiki/content | Other | Verdict |
|---|---|---|---|---|---|
| 11 | Black Knights' Fortress | 3 / 3 | — | 2,500 coins / `inv_add(coins, 2500)` | ✅ |
| 12 | Doric's Quest | 1 / 1 | 1,300 Mining / `13000` | 180 coins / `inv_add(coins, 180)` | ✅ |
| 13 | The Knight's Sword | 1 / 1 | 12,725 Smithing / `127250` | — | ✅ |
| 14 | Witch's Potion | 1 / 1 | 325 Magic / `3250` | — | ✅ |
| 15 | Goblin Diplomacy | 5 / 5 | 200 Crafting / `2000` | **a gold bar** / `inv_add(gold_bar)` | ✅ |

Every value matches, including the gold bar for Goblin Diplomacy — which is easy to miss
because it is not XP and sits below the XP line in the wiki template.

## Modern-only rewards correctly absent again

Three more cases where following the OSRS page would have corrupted a working quest:

| Quest | OSRS-only reward | Content | Correct? |
|---|---|---|---|
| Black Knights' Fortress | 2 antique lamps, 1,000 XP each | none | ✅ for 274 |
| Doric's Quest | bronze pickaxe given at quest start | none | ✅ for 274 |
| Black Knights' Fortress | King's Ransom unlock | none | ✅ (2007 quest) |

That is five era-divergent rewards in two batches. The pattern is now unambiguous: **the OSRS
reward template accumulates every later addition, and the 274 content strips them.** Any
future quest check must read the reward list as "modern superset" and keep only what existed.

## Verified so far

Quests 1–15 have had rewards and quest points checked: **13 match exactly**, **1 gap found**
(Sheep Shearer's +50 spin bonus), and one design constraint documented (Shield of Arrav needs
two players).

| Quest | Result |
|---|---|
| 1 Cook's Assistant | verified |
| 2 Demon Slayer | verified |
| 3 Romeo & Juliet | verified |
| 4 Sheep Shearer | **gap — spin bonus missing** |
| 5 Shield of Arrav | verified, two-player by design |
| 6 The Restless Ghost | verified |
| 7 Ernest the Chicken | verified |
| 8 Vampyre Slayer | verified |
| 9 Imp Catcher | verified |
| 10 Prince Ali Rescue | verified |
| 11 Black Knights' Fortress | verified |
| 12 Doric's Quest | verified |
| 13 The Knight's Sword | verified |
| 14 Witch's Potion | verified |
| 15 Goblin Diplomacy | verified |

## Still unverified

Dialogue ordering, item reachability and NPC behaviour in the 274 world, for every quest
listed. Reward correctness is the narrowest possible slice of "fully working".

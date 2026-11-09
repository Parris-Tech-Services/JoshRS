# Quests 46–50 — verification batch

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 46 | Watchtower | 4 / 4 | Magic 15,250 wiki / **15,300** content; + 5,000 coins | ⚠️ 50 XP discrepancy |
| 47 | Dwarf Cannon | 1 / 1 | 750 Crafting / `7500` | ✅ exact |
| 48 | Murder Mystery | 3 / 3 | 1,406 Crafting + 2,000 coins / `14060`, `2000` | ✅ exact |
| 49 | The Dig Site | 2 / 2 | 15,300 Mining + 2,000 Herblore / `153000`, `20000` | ✅ exact |
| 50 | Gertrude's Cat | 1 / 1 | 1,525 Cooking / `15250` | ✅ exact |

## Watchtower: a 50 XP discrepancy I did not "fix"

```
wiki     15,250 Magic
content  stat_advance(magic, 153000)   // 15,300
```

**Both** the 274 and 377 revisions use 15,300, so this is not a porting slip between branches —
either upstream deliberately used 15,300, or both inherited the same error. The difference is
0.33%.

I left it alone. Changing a reward on the strength of a single wiki figure, against two
agreeing code branches, is the kind of "fix" that has a 50% chance of introducing an error
where none existed. Recorded as unresolved pending a second source.

Worth noting the same `153000` is **correct** for The Dig Site's Mining reward, which the wiki
confirms at 15,300 — so the constant is not globally suspicious, it is specifically
Watchtower's use of it that differs.

## Extracting rewards without picking up noise

These quests contain many small situational `stat_advance` calls that are not rewards — the
Dig Site has Mining +2, +5, +10 and Thieving +10 for individual actions, and Watchtower has
Agility +4/+5 for the trellis. Comparing *all* XP lines to the wiki would have produced a dozen
false gaps.

The actual reward is the large, once-only line at the completion queue. That distinction is now
part of the method rather than an afterthought.

## Running tally, quests 1–50

| Result | Count |
|---|---|
| Rewards verified against wiki | **44** |
| Confirmed gaps | **2** (Sheep Shearer +50; Sea Slug 7,175 — Sea Slug fixed) |
| Unresolved discrepancies | **1** (Watchtower 50 XP) |
| Resolved era questions | **4** |
| Defects found in 377 content | **2** (Priest in Peril, Sea Slug) |
| Genuinely absent in-era quests | **1** (Shilo Village) |
| Design constraint | **1** (Shield of Arrav) |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 50.

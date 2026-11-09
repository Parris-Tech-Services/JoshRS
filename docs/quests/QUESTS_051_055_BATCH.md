# Quests 51–55 — verification batch

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 51 | Legends' Quest | 4 / 4 | **30,000 XP × 4 chosen skills** / **none** | ❌ **probable gap** |
| 52 | Mage Arena I | — | not a quest | n/a (minigame) |
| 53 | Rune Mysteries | 1 / 1 | Air talisman; wiki adds 500 Runecraft | ✅ era-consistent |
| 54 | Big Chompy Bird Hunting | 2 / 2 | 262 Fletch + 1,470 Cook + 735 Ranged / identical | ✅ exact |
| 55 | Elemental Workshop I | 1 / 1 | 5,000 Craft + 5,000 Smith / `50000`, `50000` | ✅ exact |

## Legends' Quest awards no XP — in either revision

```rs
[queue,legends_quest_complete]
session_log(^log_adventure, "Quest complete: Legends Quest");
%legendsquest = ^legends_complete;
~send_quest_complete(questlist:legends, thtotempolegift, 250, ^legends_questpoints, "...");
```

4 quest points and an item, and **no `stat_advance` anywhere in the completion path**. The
377 revision is identical. The wiki describes **30,000 experience in each of four skills of your
choice** — up to 120,000 XP, the largest single reward in the free-game content.

This is not a one-line fix like Sea Slug. It needs:

1. a four-skill choice interface (the wiki restricts which skills qualify),
2. a once-only guard so it cannot be repeated,
3. a decision on whether 274-era Legends used the same four-skill structure as modern OSRS.

I have **not** attempted it. Inventing the interface without knowing the 2004 shape would be
fabrication, and the "once-only" guard is exactly the kind of thing that silently duplicates XP
if guessed.

Recorded as the largest known gap in the content.

## Rune Mysteries — consistent, probably correct

Content grants the Air talisman and 1 QP, no XP. The wiki's 500 Runecraft XP is almost certainly
modern (Runecraft was only introduced in March 2004 alongside this very quest, and the reward
was access, not training). Both revisions omit it, matching the pattern of every other resolved
era question. Not treated as a gap.

## Mage Arena I — correctly not a quest

The sheet lists it, but it has no quest points and no journal. The content implements it as an
area (`scripts/areas/area_mage_arena/`). Nothing missing.

## Extracting rewards from the completion block only

Earlier batches compared every `stat_advance` in a quest's files, which was vulnerable to
situational XP. This batch reads only the `[queue,*complete*]` block, which is where a reward
actually lives. Legends' Quest shows the difference: it has `stat_advance(thieving, 100)` and
`stat_advance(mining, 350)` for individual obstacles, and a whole-file scan would have suggested
it had rewards when its completion block has none.

## Running tally, quests 1–55

| Result | Count |
|---|---|
| Rewards verified against wiki | **47** |
| Confirmed gaps | **3** (Sheep Shearer +50; Sea Slug 7,175 — fixed; **Legends' Quest ~120,000 XP**) |
| Unresolved discrepancies | **1** (Watchtower 50 XP) |
| Resolved era questions | **5** |
| Defects found in 377 content | **2** (Priest in Peril, Sea Slug) |
| Genuinely absent in-era quests | **1** (Shilo Village) |
| Non-quests in the target list | **1** (Mage Arena I) |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 55.

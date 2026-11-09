# Quests 61–65 — verification batch

All five postdate this revision and all five are **complete and correct**. That is the
opposite of what the previous batch predicted, which is worth recording.

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 61 | Regicide | 3 / 3 | 13,750 Agility + 15,000 coins / `137500`, `15000` | ✅ exact |
| 62 | Eadgar's Ruse | 1 / 1 | 11,000 Herblore / `110000` | ✅ exact |
| 63 | Shades of Mort'ton | 3 / 3 | 2,000 Craft + 2,000 Herb / `20000`, `20000` | ✅ exact |
| 64 | The Fremennik Trials | 3 / 3 | 2,812.4 × 10 skills / `28124` × 10 | ✅ exact |
| 65 | Horror from the Deep | 2 / 2 | 4,662.5 Magic/Str/Range / `46620` × 3 | ✅ exact |

## Post-era does not mean incomplete

The previous batch concluded that backported quests are partial, based on Troll Stronghold and
Tai Bwo Wannai Trio. This batch shows the opposite for five later quests: every reward is
present and numerically exact, including the awkward decimal ones.

- **Fremennik Trials**: ten skills at 2,812.4 XP each — `28124` tenths, ten times, correct.
- **Horror from the Deep**: three skills at 4,662.5 — `46620` tenths, correct.
- **Regicide**: 13,750 Agility + 15,000 coins, exactly right.

So the honest conclusion is narrower than the last batch implied: **two specific backports are
incomplete, not backports in general.** I should not have generalised from a sample of two.

## Method failure: rewards are not always inside a `[queue]` block

Shades of Mort'ton grants its XP like this:

```rs
stat_advance(crafting, 20000);
stat_advance(herblore, 20000);
~send_quest_complete(questlist:mortton, shadekey_silver_purple, 250, ^mortton_questpoints, ...);
```

There is **no** `[queue,...complete]` block — the rewards sit immediately before the completion
call. My extractor, which since round 15 has read only the queue block, reported no rewards at
all for this quest.

The corrected rule is: a reward is any `stat_advance` in the queue block **or within the lines
immediately preceding `send_quest_complete`**. Reading either in isolation produces false gaps,
and this is the second time the extraction window has caused a wrong conclusion — the first was
`head -5` truncation in round 12.

## Running tally, quests 1–65

| Result | Count |
|---|---|
| Rewards verified against wiki | **55** |
| Confirmed gaps | **3** (Sheep Shearer; Sea Slug — fixed; Legends' ~120,000) |
| Unresolved discrepancies | **2** (Watchtower 50 XP; Troll Stronghold Agility) |
| Post-era but incomplete | **1** (Tai Bwo Wannai Trio) |
| Resolved era questions | **5** |
| Defects found in 377 content | **2** |
| Genuinely absent in-era quests | **1** (Shilo Village) |

Troll Stronghold moves from "post-era incomplete" to "unresolved Agility value", since its only
gap is the missing 2,000 Agility.

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 65.

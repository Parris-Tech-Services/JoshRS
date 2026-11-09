# Quests 36–40 — verification batch, and a second real defect

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 36 | Plague City | 1 / 1 | 2,425 Mining / `24250` | ✅ exact |
| 37 | Sea Slug | 1 / 1 | 7,175 Fishing / **was absent** | ❌ **defect, now fixed** |
| 38 | Waterfall Quest | 1 / 1 | 13,750 Str + 13,750 Atk / `137500`, `137500` | ✅ exact |
| 39 | Biohazard | 3 / 3 | 1,250 Thieving / `12500` | ✅ exact |
| 40 | Jungle Potion | 1 / 1 | 775 Herblore / `7750` | ✅ exact |

## Sea Slug granted no Fishing XP — in either revision

The wiki lists **7,175 Fishing XP**. Neither content branch granted it:

```
274  ~send_quest_complete(..., "You have completed the\nSea Slug Quest!");
377  ~send_quest_complete(..., "You have completed the\nSea Slug Quest!",
         "7,175 Fishing XP|Fishing Platform Access|Some Oyster Pearls");
```

The **377 build is worse**: its completion dialog explicitly tells the player *"7,175 Fishing
XP"* while no code awards any. A promise the engine does not keep is more damaging than a
silent omission, because the player trusts the reward screen.

Unlike the four resolved era questions, this reward is not a modern addition — Sea Slug was
released in September 2002, well before this revision, so 7,175 Fishing was intended.

### Fix applied to both revisions

```rs
[queue,seaslug_quest_complete]
stat_advance(fishing, 71750); // 7,175 Fishing XP, as the completion message already states
```

- **377**: [`content-patches/rs377/patches/quest_seaslug_fishing_xp.patch`](../../content-patches/rs377/patches/quest_seaslug_fishing_xp.patch),
  verified with `git apply --check --reverse`.
- **274**: applied to the running world and **verified by restart** — the engine packed all
  content and reached `World ready`, so the edit is syntactically and semantically valid.

**Note:** this does not retroactively award XP to characters who already completed Sea Slug.
If any account has, they would need a deliberate one-off correction.

## Two defects now found by diffing, not by reading

| Quest | Defect | Status |
|---|---|---|
| Priest in Peril | 377 pays 140 XP instead of 1,406 (missing a zero) | patch prepared |
| Sea Slug | neither revision paid 7,175 Fishing XP; 377 claimed it in the UI | **fixed in both** |

Both came from comparing the two content revisions against the wiki rather than trusting
either. That comparison is now the primary method.

## Running tally, quests 1–40

| Result | Count |
|---|---|
| Rewards verified against wiki | **36** |
| Confirmed gaps | **2** (Sheep Shearer +50; Sea Slug 7,175 — Sea Slug now fixed) |
| Resolved era questions | **4** (closed, not gaps) |
| Defects found in 377 content | **2** (Priest in Peril, Sea Slug) |
| Design constraint | **1** (Shield of Arrav, two players) |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 40. The Sea Slug fix proves the
reward line runs, not that the quest is playable end to end.

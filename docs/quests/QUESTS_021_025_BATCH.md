# Quests 21–25 — verification batch

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 21 | Merlin's Crystal | 6 / 6 | Excalibur / `inv_add(excalibur)` | ✅ (one era question) |
| 22 | Witch's House | 4 / 4 | 6,325 Hitpoints / `63250` | ✅ exact |
| 23 | Alfred Grimhand's Barcrawl | — / — | none, by design | ✅ miniquest |
| 24 | Scorpion Catcher | 1 / 1 | 6,625 Strength / `66250` | ✅ exact |
| 25 | Family Crest | 1 / 1 | steel gauntlets → one imbued | ✅ choice logic correct |

## Barcrawl is correctly rewardless

It is a **miniquest**: no quest points, no journal entry, no XP. It exists to unlock Scorpion
Catcher (its prerequisite gate). The earlier audit flagged it for "missing JOURNAL, REWARD" —
that flag was correct as a measurement and wrong as a defect, which is why the audit now says
so explicitly.

## Family Crest — the gauntlet choice is properly implemented

The wiki describes receiving **steel gauntlets**, then having **one** of three brothers imbue
them (Cooking, Goldsmithing or Chaos). A naive implementation would hand out all three; this
content does not:

```rs
// crest_dimintheis.rs2
if (~obj_gettotal(gauntlets_of_cooking) = 0)     { @crest_dimintheis_offer_gauntlets(gauntlets_of_cooking); }
if (~obj_gettotal(gauntlets_of_goldsmithing) = 0) { @crest_dimintheis_offer_gauntlets(gauntlets_of_goldsmithing); }
if (~obj_gettotal(gauntlets_of_chaos) = 0)        { @crest_dimintheis_offer_gauntlets(gauntlets_of_chaos); }
```

Each is gated on the player **not already owning it**, so the exchange is one-at-a-time, and
Dimintheis can swap the imbue later. That matches the original behaviour rather than
over-rewarding.

## One era question again

**Merlin's Crystal** — OSRS lists 1,000 Firemaking XP plus Kudos and an antique lamp; content
grants Excalibur only. The Kudos/lamp are certainly modern (2007+ museum content), and the
Firemaking XP is very likely added alongside them. Recorded as **unresolved**, not changed —
same reasoning as Pirate's Treasure and Lost City.

## Running tally, quests 1–25

| Result | Count |
|---|---|
| Rewards verified against wiki | **22** |
| Confirmed gap | **1** (Sheep Shearer +50 spin bonus) |
| Unresolved era question | **3** (Pirate's Treasure, Lost City, Merlin's Crystal) |
| Design constraint documented | **1** (Shield of Arrav, two players) |

Three quests in this batch alone had modern rewards that would have been wrong to add. The
era filter is doing real work, not ceremony.

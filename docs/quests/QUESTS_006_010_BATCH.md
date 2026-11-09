# Quests 6–10 — verification batch

Checked against the OSRS wiki **and** filtered for era, because the OSRS wiki lists modern
rewards. That distinction turned out to matter twice below.

---

## Reward comparison

| # | Quest | QP (wiki / content) | XP (wiki / content) | Items / coins | Verdict |
|---|---|---|---|---|---|
| 6 | The Restless Ghost | 1 / 1 | 1,125 Prayer / `stat_advance(prayer, 11250)` = 1,125 | Ghostspeak amulet | ✅ |
| 7 | Ernest the Chicken | 4 / 4 | — | 300 coins / `inv_add(coins, 300)` | ✅ |
| 8 | Vampyre Slayer | 3 / 3 | 4,825 Attack / `stat_advance(attack, 48250)` = 4,825 | — | ✅ |
| 9 | Imp Catcher | 1 / 1 | 875 Magic / `stat_advance(magic, 8750)` = 875 | Amulet of accuracy | ✅ |
| 10 | Prince Ali Rescue | 3 / 3 | — / none | 700 coins / `inv_add(coins, 700)` | ✅ |

The XP convention is consistent: `stat_advance` takes **tenths**, so `11250` is 1,125 XP.
That is the same convention that made Sheep Shearer's `1500` equal 150.

## Where the OSRS wiki would have misled me

Two rewards in this batch differ between modern OSRS and the 274 era, and **the content is
correct for 274 in both cases**:

- **Ernest the Chicken** — OSRS lists an *antique lamp giving 500 XP in a skill of the
  player's choice*. That is a modern addition. Content grants the 300 coins and no lamp,
  which is right for 2004.
- **Prince Ali Rescue** — OSRS lists *500 Smithing and 500 Crafting XP* on top of 700 coins.
  Content grants the 700 coins and no XP, which is again right for 2004.

Had I treated the OSRS page as the oracle, I would have "fixed" two quests by inventing
modern rewards and called it fidelity. **The OSRS wiki is a source for structure and
dialogue; it is not a source of truth for 274 reward values.**

## What to check on a playthrough

1. Restless Ghost: the skull must be retrievable from the Wizards' Tower basement, and the
   ghost must accept it.
2. Ernest: the four levers must match the wiki order, and the oil can must work on the door.
3. Vampyre Slayer: the stake, hammer and garlic sequence; Count Draynor must be defeatable.
4. Imp Catcher: bead drops from imps, and Mizgog accepting a full set.
5. Prince Ali: the disguise pieces (wig, beard, dye, skirt, rope) and the cell-door sequence.
   This is the first quest in the list with a genuinely long item chain, so it is the most
   likely of the five to break.

## Status

**STRUCTURALLY VERIFIED for rewards.** Dialogue ordering, item reachability and NPC
behaviour remain unverified in the 274 world.

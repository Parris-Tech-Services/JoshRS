# Quests 56–60 — verification batch

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 56 | Priest in Peril | 1 / 1 | 1,406 Prayer + Wolfbane dagger / `14060` | ✅ exact in 274 |
| 57 | Nature Spirit | 2 / 2 | 3,000 Craft + 2,000 Def + 2,000 HP / identical | ✅ exact |
| 58 | Death Plateau | 1 / 1 | 3,000 Attack + steel claws / `30000` | ✅ exact |
| 59 | Troll Stronghold | 1 / 1 | Law talisman + **2,000 Agility** / no Agility | ⚠️ unresolved |
| 60 | Tai Bwo Wannai Trio | 2 / 2 | see below | ⚠️ far off, post-era |

## Priest in Peril — the 377 bug is confirmed against a correct 274

The **274** content has `stat_advance(prayer, 14060)` = 1,406 XP, matching the wiki exactly.
Only the **377** branch had `1406`. That confirms the defect was introduced in the 377 port, not
inherited — and the patch prepared in round 12 is the correct fix.

## Troll Stronghold — 2,000 Agility missing, but it postdates this revision

Wiki lists 2,000 Agility. Neither 274 nor 377 grants it. Troll Stronghold was released
**24 August 2004**, after this revision's era, so its presence in the content is a backport.
Whether the Agility reward existed when it was backported is unknown. **Unresolved**, not patched.

## Tai Bwo Wannai Trio — rewards do not resemble the wiki

| Reward | Wiki | Content |
|---|---|---|
| Coins | 2,000 | none |
| Cooking | 5,000 | 25 (`250`) |
| Fishing | 5,000 | 1,500 (`15000`) |
| Attack / Strength | 2,500 each | none |
| Rune spear | yes | none |

This is not a rounding discrepancy — the values differ by two orders of magnitude and most
rewards are absent. Tai Bwo Wannai Trio shipped **14 September 2004**, also after this revision,
so this looks like a **partial backport**: the quest exists, its reward structure does not.

That distinction matters for the backlog. A quest can be "present" (has a directory, has a
journal, passes the structural audit) while being nowhere near complete. The structural audit
cannot see this; only reward comparison against the wiki can.

## Another alias correction

`quest_troll` is **Troll Stronghold**, not Troll Romance — its own completion message says
`"You have completed\nTroll Stronghold!"`. Troll Romance has **no directory at all** and is a
2005 quest, well outside this revision. Both aliases corrected in the status generator.

## Running tally, quests 1–60

| Result | Count |
|---|---|
| Rewards verified against wiki | **50** |
| Confirmed gaps | **4** (Sheep Shearer; Sea Slug — fixed; Legends' ~120,000; TBWT partial) |
| Unresolved discrepancies | **3** (Watchtower 50 XP; Troll Stronghold Agility; TBWT rewards) |
| Post-era content present but incomplete | **2** (Troll Stronghold, Tai Bwo Wannai Trio) |
| Resolved era questions | **5** |
| Defects found in 377 content | **2** |
| Genuinely absent in-era quests | **1** (Shilo Village) |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 60.

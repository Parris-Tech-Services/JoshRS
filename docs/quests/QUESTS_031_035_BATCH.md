# Quests 31–35 — verification batch, plus a real defect in the 377 content

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 31 | Fight Arena | 2 / 2 | 1,000 coins + 12,175 Attack + 2,175 Thieving / `121750`, `21750` | ✅ exact |
| 32 | Holy Grail | 2 / 2 | 15,300 Defence + 11,000 Prayer / `153000`, `110000` | ✅ exact |
| 33 | Tree Gnome Village | 2 / 2 | 11,450 Attack + Gnome amulet / `114500` | ✅ exact |
| 34 | Hazeel Cult | 1 / 1 | 1,500 Thieving + 2,000 (+5) coins / `15000` | ✅ exact |
| 35 | Sheep Herder | 4 / 4 | 3,100 coins / `3100` | ✅ correct for era |

**Sheep Herder** lists 1,000 Hunter XP on OSRS. Hunter was released in **2006**, two years after
this revision, so its absence here is required, not missing.

## A defect in the 377 content: Priest in Peril XP is 10× too low

Found by diffing the two content revisions rather than by reading the wiki:

```
274  stat_advance(prayer, 14060);   // 1,406 XP  ✅
377  stat_advance(prayer, 1406);    //   140 XP  ❌
```

`stat_advance` takes **tenths** in both branches — Cook's Assistant uses `3000` for 300 XP in
both. So the 377 value awards one tenth of the intended Prayer XP. The quest's own completion
message even prints `"1406 Prayer XP"`, and the wiki agrees on 1,406.

Patch prepared at [`content-patches/rs377/patches/quest_priestperil_prayer_xp.patch`](../../content-patches/rs377/patches/quest_priestperil_prayer_xp.patch)
and verified to correspond to the working tree with `git apply --check --reverse`.

This affects the world the bots play on: **Elrothiro has already completed Priest in Peril**,
so that account received 140 XP instead of 1,406. Correcting the script does not retroactively
grant the difference — that would need a deliberate one-off XP correction, which I have not
attempted.

## How this was nearly reported wrong

My first extraction piped through `head -5`, which sorts `inv_add` lines ahead of
`stat_advance` and silently truncated them. That made Fight Arena look like it had no XP
rewards, and I was one step from publishing it as a gap.

Fix: extract **all** reward lines before judging. Re-running the full extraction across quests
1–35 confirmed no published claim was affected — but the near-miss is recorded here because the
next person will run the same command.

## The four era questions are now resolved

Pirate's Treasure, Lost City, Merlin's Crystal and Clock Tower each listed XP on the OSRS wiki
that the content does not grant. Checking the 377 content **as well**:

| Quest | 274 XP | 377 XP |
|---|---|---|
| Pirate's Treasure | none | none |
| Lost City | none | none |
| Merlin's Crystal | none | none |
| Clock Tower | none | none |

Both revisions omit them, so the omission is deliberate and consistent — these were modern
additions, not gaps. All four are now closed.

## Running tally, quests 1–35

| Result | Count |
|---|---|
| Rewards verified against wiki | **32** |
| Confirmed gap | **1** (Sheep Shearer +50 spin bonus) |
| Resolved era questions | **4** (closed, not gaps) |
| Confirmed defect in 377 content | **1** (Priest in Peril XP) |
| Design constraint | **1** (Shield of Arrav, two players) |

## Still unverified

Dialogue order, item reachability and NPC behaviour, for all 35. Rewards are the narrowest
slice of correctness and the only slice checkable without playing.

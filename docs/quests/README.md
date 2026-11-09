# Quest campaign — index and current state

Quest work happens one batch at a time, each with its own evidence file. This page is the index
and the summary, so nobody has to read fourteen files to find out where things stand.

## Method, and the four times it was wrong

The rules below each exist because an earlier version produced a false result:

1. **Read only `stat_advance` / reward lines, never `head -N`.** Round 12: `head -5` sorted
   `inv_add` ahead of `stat_advance` and hid Fight Arena's XP, nearly producing a false gap.
2. **Rewards live in the queue block *or* immediately before `send_quest_complete`.** Round 15
   assumed queue blocks only; round 22 found Shades of Mort'ton grants XP outside one.
3. **Never trust a directory name.** `quest_itgronigen` = Observatory Quest,
   `quest_desertrescue` = The Tourist Trap, `quest_troll` = Troll Stronghold,
   `quest_prince` = Prince Ali Rescue. Four alias errors, each caught by checking the NPCs.
4. **Confirm absence by searching for signature NPCs,** not by listing directories. Used for
   all of batch 66–70.

`stat_advance` takes **tenths** (`3000` = 300 XP) in both revisions. That was established once
and has held for every quest since.

## Batches

| Quests | File |
|---|---|
| 1 | [Cook's Assistant](QUEST_001_COOKS_ASSISTANT.md) |
| 2–5 | [batch](QUESTS_002_005_BATCH.md) |
| 6–10 | [batch](QUESTS_006_010_BATCH.md) |
| 11–15 | [batch](QUESTS_011_015_BATCH.md) |
| 16–20 | [batch](QUESTS_016_020_BATCH.md) |
| 21–25 | [batch](QUESTS_021_025_BATCH.md) |
| 26–30 | [batch](QUESTS_026_030_BATCH.md) |
| 31–35 | [batch](QUESTS_031_035_BATCH.md) |
| 36–40 | [batch](QUESTS_036_040_BATCH.md) |
| 41–45 | [batch](QUESTS_041_045_BATCH.md) |
| 46–50 | [batch](QUESTS_046_050_BATCH.md) |
| 51–55 | [batch](QUESTS_051_055_BATCH.md) |
| 56–60 | [batch](QUESTS_056_060_BATCH.md) |
| 61–65 | [batch](QUESTS_061_065_BATCH.md) |
| 66–70 | [batch](QUESTS_066_070_BATCH.md) |

Supporting analysis:

- [QUEST_AUDIT.md](QUEST_AUDIT.md) — structural audit of all 64 quest directories
- [QUEST_TARGET_STATUS.md](QUEST_TARGET_STATUS.md) — the 88-quest target list against reality
- [QUEST_RECONCILIATION.md](QUEST_RECONCILIATION.md) — bot playtests vs structure vs targets
- [QUEST_COMPLETION_PATHS.md](QUEST_COMPLETION_PATHS.md) — every quest has a completion path
- [PORTED_CONTENT.md](PORTED_CONTENT.md) — the 26 quests ported from 377, with an exact upstream pin
- [LEGENDS_REWARD_SPEC.md](LEGENDS_REWARD_SPEC.md) — exact values and implementation plan for the
  Legends' Quest reward
- [../ANDROID377_PLAYABLE_PROGRESS_LOG.md](../ANDROID377_PLAYABLE_PROGRESS_LOG.md) — the wider
  native-client log

## Where things actually stand

| Measure | Value |
|---|---|
| Target quests in the sheet | 88 |
| Present in the 274 content | 62 |
| Rewards verified against the wiki | 55 |
| Bot-verified in-game (377 world, 25× XP) | 22 |

## Open items, in priority order

### 1. Legends' Quest grants no XP at all — BLOCKED on a decision

4 QP and an item; no `stat_advance` anywhere in the completion path, in **either** revision. The
wiki describes 7,650 XP in each of four chosen skills (30,600 total). **Earlier batches said
~120,000 — that used the modern 30,000 figure, which only exists since November 2022.**

Not implemented because the wiki's allowed-skill list is **truncated in the source I have**
("limited to Attack, Defence…"), and the existing lamp mechanism grants level × 10 XP rather
than a fixed amount. Implementing it means inventing either the skill restrictions or a new
lamp item — on the largest reward in the content. That is the one place guessing is least
acceptable.

**Needs:** the full list of allowed skills from a complete wiki page or the original interface,
then the reward can be built against the existing lamp pattern.

### 2. Sheep Shearer's +50 spin bonus — IMPLEMENTED, NOT PLAYTESTED

Wiki: *"an additional 50 experience if you make the balls of wool on a spinning wheel instead of
buying it yourself."*

Implemented: `%sheepspun` is set in the **wool** case of the spinning wheel (not flax or other
spinning), and `quest_sheep.rs2` adds `stat_advance(crafting, 500)` when it is set.

**Interpretation choice:** the wiki does not say whether the bonus needs *all* 20 balls spun or
just some. The quest only tracks balls delivered, not their origin, so this grants the bonus for
spinning **at least one**. That is the lenient reading; the strict one would need per-ball
tracking that the original content does not have.

Patch: `content-patches/rs274/patches/quest_sheep_spin_bonus.patch`.

### 3. Priest in Peril, 377 branch only — FIX WRITTEN, NOT APPLIED

`stat_advance(prayer, 1406)` should be `14060`. 274 is correct; the defect is specific to the
377 port. Patch committed at `content-patches/rs377/patches/quest_priestperil_prayer_xp.patch`.
**Elrothiro already completed this quest**, so that account received 140 XP instead of 1,406;
applying the patch does not retroactively correct it.

### 4. Sea Slug — FIXED IN BOTH, NOT PLAYTESTED

Both revisions paid no Fishing XP while the 377 UI promised 7,175. `stat_advance(fishing, 71750)`
added to both; 274 verified by a full engine restart reaching `World ready`. Nobody has completed
the quest since.

### 5. Unresolved values

- **Watchtower** — content 15,300 Magic, wiki 15,250. Both revisions agree on 15,300.
- **Troll Stronghold** — 2,000 Agility missing; quest postdates this revision, so the reward may
  not have existed in the backport.
- **Tai Bwo Wannai Trio** — rewards bear no relation to the wiki (25 vs 5,000 Cooking, no coins,
  no Attack/Strength, no rune spear). Looks like a partial backport.

### 6. Shilo Village — genuinely absent

A January 2003 quest with no directory, no varp entry, and no quest logic anywhere. The only
in-era content hole found.

## The honest boundary

Fifty-five quests have correct rewards. **None of them has been played.** Reward correctness
catches missing or wrong numbers; it cannot catch a broken stage, an unreachable NPC, a wrong
item id, or dialogue that fires out of order. Five batches of correct numbers is not five
batches of testing, and this document does not claim otherwise.

## 11. Porting 377 quests into the 274 world — 62 → 72 of 88 present

The 18 sheet quests from 71–88 were all absent from the 274 content (they are 2005 quests). Rather
than treat that as a dead end, the 377 content was ported across, because both revisions share the
same ReScript engine and symbol naming.

`tools/questops/port-377-quests.sh <377-content> <274-world>` copies quests across, refusing any
without a `send_quest_complete` call and never overwriting quests that already exist with local
fixes. It is idempotent — a second run copies nothing.

### Result, measured

| | before | after |
|---|---|---|
| quest directories in 274 | 64 | **90** |
| sheet targets present | 62 | **72** |
| sheet targets absent | 26 | **16** |
| completion-path failures | 0 | **0** |

The world repacked and reached `World ready` with all 26 ported quests present, and
`check-completion-paths` reports **0 failures across 90 quests**.

### Five quests were deliberately refused

`quest_100`, `quest_fever`, `quest_mm`, `quest_mourning2`, `quest_rd` pack cleanly but contain **no
completion call** — they cannot be finished. Shipping those would have been worse than leaving them
absent, so they are excluded and the exclusion is enforced in the script rather than remembered.

`quest_mortton` is also excluded: 274 already has a local version with fixes, and porting the 377
copy would silently overwrite them.

### The caveat that matters most

**Packing is not playing.** A ported quest may reference NPCs, items, objects or maps that exist in
377 but not in 274. Packing proves syntax and symbol syntax only. Every ported quest is
**UNPLAYED** and should be treated as suspect until someone completes it.

Structural completeness also dropped in relative terms: 66 of 90 quests pass the structural audit,
because many ported quests bring scripts but not journals or varps. That is a real gap, not a
bookkeeping artefact.


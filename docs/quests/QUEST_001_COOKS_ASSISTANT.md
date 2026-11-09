# Quest 1 — Cook's Assistant (verification record)

Revision-274 content checkout. Status vocabulary matches the parity roadmap:
**STRUCTURALLY VERIFIED** means the code paths and data exist and are wired; it does **not**
mean a player has completed it.

---

## Requirements (per the RuneScape wiki)

| Requirement | Expected |
|---|---|
| Start | Talk to the Cook in Lumbridge Castle kitchen |
| Items | Egg, bucket of milk, pot of flour |
| Milk | Use a bucket on a dairy cow |
| Egg | Pick up an egg spawn |
| Flour | Pick wheat, put grain in the hopper, pull the lever, fill a pot from the bin |
| Reward | 300 Cooking XP, 1 Quest Point, use of the Cook's range |
| Range before completion | Refused: "Hey! Who said you could use that?" |

## What exists in content

| Piece | Evidence |
|---|---|
| Quest logic + dialogue | `scripts/quests/quest_cook/scripts/quest_cook.rs2` (102 lines) |
| Journal | `scripts/quests/quest_cook/scripts/cook_journal.rs2` — `[if_button,questlist:cook]` |
| Stage variable | `configs/quest_cook.varp` → `[cookquest] scope=perm` |
| Cook's range | `configs/quest_cook.loc` → `[cooksquestrange]`, guarded by `%cookquest < ^cook_complete` |
| NPC dialogue routing | `scripts/areas/area_lumbridge/scripts/cook.rs2` — `opnpc1` branches on `%cookquest` = 0 / 1 / complete |
| Milking | `scripts/npc/scripts/cow_milking.rs2` — `bucket_empty` → `milk_cow` |
| Wheat → grain → flour | `scripts/general_use/scripts/windmills.rs2` — hopper, lever, bin, `%flour` and `%hopper_full` |
| Pickables (wheat/egg) | `scripts/general_use/scripts/pickables.rs2` |
| Completion constant | `scripts/general/configs/quest.constant`: `^cook_complete = 2`, `^cook_questpoints = 1` |
| Quest point accounting | `scripts/general/scripts/quests.rs2` adds `^cook_questpoints` on completion |

## Reward path

```
%cookquest = ^cook_complete;
stat_advance(cooking, 3000);            // 3000 tenths = 300 Cooking XP
send_quest_complete(questlist:cook, cake, 250, ^cook_questpoints, ...);
inv_del(inv, egg, 1); inv_del(inv, bucket_milk, 1); inv_del(inv, pot_flour, 1);
```

XP, quest points and ingredient consumption all match the wiki. Ingredients are consumed,
so the quest cannot be double-rewarded by talking again — the stage gate prevents it.

## Dialogue coverage

Start branch offers four options including the "Nice hat!" aside and the "give me all your
money" joke; the "you don't look happy" branch chains into a second choice and rejoins.
Partial-progress branch lists which ingredients are still missing. Post-quest dialogue offers
four options including the range permission. This matches the structure of the original.

## Verdict

**STRUCTURALLY VERIFIED — not playtested.**

Every requirement has a reachable code path and every reward value matches. What has *not*
been done is a human completing it in the running world, which is the only thing that can
catch a broken loc placement, a missing egg spawn, a wrong item id, or a dialogue line that
fires in the wrong order.

### What to check on the first playthrough

1. The egg spawn is actually present and pickable.
2. The dairy cow responds to a bucket, not just the `cow` id.
3. Wheat can be picked and the hopper accepts grain.
4. The lever produces flour and the bin gives it to an empty pot.
5. The Cook accepts the three items, consumes them, and awards 300 XP + 1 QP exactly once.
6. The range refuses before completion and works after.

Anything that fails above is a concrete defect with a known file, and can be fixed directly.

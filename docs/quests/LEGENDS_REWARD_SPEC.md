# Legends' Quest reward — implementation spec

Status: **IMPLEMENTED, NOT PLAYTESTED.** See "What was built" at the end.

---

## The correct values

Settled from the OSRS wiki, including its change history:

| Fact | Value | Source |
|---|---|---|
| XP per chosen skill | **7,650** | *"increased from 7,650 to 30,000"* — change dated 30 November 2022 |
| Number of choices | **4** | four skills of your choice |
| Total reward | **30,600 XP** | 7,650 × 4 |
| Repeats allowed | **yes** | *"It is possible to choose the same skill all four times"* |

### This corrects an earlier error

Previous batches recorded this as "~120,000 XP" using the modern 30,000 figure. That was wrong
for this era by a factor of four. The 30,000 value has only existed since **2022**, so a 274/377
reconstruction must use **7,650**.

The allowed skills (12):

```
Attack   Defence  Strength  Hitpoints  Prayer   Magic
Woodcutting  Crafting  Smithing  Herblore  Agility  Thieving
```

Notable exclusions: Ranged, Fishing, Cooking, Firemaking, Fletching, Runecraft, Slayer,
Farming, Construction, Hunter.

## Why it has not been implemented

The existing XP lamp at `scripts/general/scripts/xplamp/xplamp.rs2` is the obvious vehicle — it
already presents a skill-choice interface with all 19 skill buttons and a confirm step. But it
is hard-wired to one behaviour:

```rs
def_int $base_level = stat_base($stat);
stat_advance($stat, multiply($base_level, 100)); // level x 10
```

It also hard-codes the item (`inv_del(inv, macro_genilamp, 1)`) and the member-world check.

Reusing it for a fixed 7,650 requires parameterising shared reward code used by **genie lamps and
random events**. Without the ability to playtest, a mistake there breaks a working feature
(every genie lamp in the game) to fix a missing one. That trade is not worth making blind.

The 12-skill restriction is the second problem: the interface offers all 19, so the disallowed
seven must be refused either in the interface or at confirm time.

## Implementation plan, when it can be tested

1. Add `%xplamp_amount` (or a dedicated "lamp kind" var) set when a lamp is rubbed, before
   `if_openmain(xplamp)`.
2. In `xplamp_confirm`, branch on that var:
   - genie lamp → existing `base_level * 100`
   - Legends lamp → `7650`, and reject any of the seven disallowed skills
3. Add a `legends_lamp` object config modelled on `xplamp.obj`, `tradeable=no`.
4. On completion, give **four** lamps rather than granting XP inline, so the player chooses
   skills through a UI they already know.
5. Guard against re-entry: the completion path already sets `%legendsquest = ^legends_complete`;
   verify the lamp cannot be obtained twice.
6. Verify: pack the world, then complete the quest on a disposable account and confirm
   4 × 7,650 in two different skills and twice in the same skill.

## Alternative considered and rejected

A four-step `p_choice` dialogue works without touching shared code, but `p_choice` tops out at
five options and there are twelve skills. Any version of it would either invent a category
screen that never existed or silently drop skills from the allowed list.

## The rule this exercises

The reward is the **largest in the content** and the number I would have used was wrong by 4×.
That is precisely why this stays unimplemented rather than approximated.


---

## What was built

Rather than parameterising the shared genie-lamp code, the reward got its **own** interface and
script, so nothing existing can break:

| File | Purpose |
|---|---|
| `interfaces/legends_lamp.if` | copy of `xplamp.if`; own interface id, retitled |
| `scripts/legends_lamp.rs2` | rub → choose → confirm; grants `stat_advance($stat, 76500)` |
| `configs/legends_lamp.obj` | the lamp item, `tradeable=no` |
| `configs/legendslamp.varp` | UI selection state |
| completion path | `inv_add(inv, legends_lamp, 4)` |

Design decisions worth recording:

- **76500, not 7650.** `stat_advance` takes tenths, so 7,650 XP is `76500`. Writing `7650`
  would have paid 765 XP — the same class of error that produced the Priest in Peril defect.
- **Repeats are free.** Each lamp is consumed on use, so choosing the same skill four times
  works without a guard.
- **The seven disallowed skills refuse explicitly** with a message, instead of silently doing
  nothing. The copied interface still shows all 19 buttons; changing the interface layout to
  hide seven would be a visual change I cannot verify without a client.
- **No new shared code.** `xplamp.rs2` and every genie lamp are untouched.

## Verification

The engine repacked all content and reached `World ready` with the new interface, object, varp
and script present, and `rs2.cgi` served 200. That proves the interface file parses and the
script compiles.

It does **not** prove the reward works in play: nobody has completed Legends' Quest since the
change, and no one has rubbed a lamp.

Patch: `content-patches/rs274/patches/quest_legends_reward.patch`.

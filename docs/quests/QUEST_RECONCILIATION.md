# Quest reconciliation — three sources of truth, kept separate

There are three different questions being asked about quests, and conflating them is how
"done" drifts away from reality. This file keeps them apart.

| Source | Question it answers | Where |
|---|---|---|
| **Bot playtests** | Has a real character completed it in-game? | `tools/rs-sdk-quests/*_LAB_LOG.md` |
| **Structural audit** | Is the code capable of working? | `docs/quests/QUEST_AUDIT.md` |
| **Owner's target list** | What should exist? | the quest spreadsheet |

---

## 1. Bot-verified in-game (22 quests)

From `ELROTHIRO_LAB_LOG.md`, with XP and quest points recorded per quest:

Cook's Assistant · Sheep Shearer · The Restless Ghost · Rune Mysteries · Romeo & Juliet ·
Doric's Quest · Witch's Potion · Ernest the Chicken · The Knight's Sword · Vampyre Slayer ·
Pirate's Treasure · Goblin Diplomacy · Prince Ali Rescue · Black Knights' Fortress ·
Druidic Ritual · Fight Arena · Monk's Friend · Hazeel Cult · Sheep Herder · Plague City ·
Murder Mystery · Demon Slayer

This is the strongest evidence available: a real client, real item gathering, rewards
observed, quest points totalled.

### Critical caveat

**These ran against a Lost City 377 world at 25× XP, not the 274 browser world.** The log
records `+7,500 Cooking XP` where the wiki says 300 — 300 × 25. So:

- a quest proven here is proven **for 377**;
- it is **not** proven for the 274 world you can play in the browser;
- and an XP figure in the logs cannot be compared to the wiki without dividing by 25 first.

## 2. Structurally complete but not playtested

The 274 content holds **64** quest directories; **63** pass the structural audit. Of those,
the 22 above have bot evidence **for a different world**, leaving roughly **42** that are
structurally sound in 274 but have no playtest evidence anywhere.

Structural soundness is weak evidence. It catches a missing varp or an unreachable label; it
cannot catch dialogue in the wrong order, a missing spawn, or a wrong item id.

## 3. Target list coverage

The owner's sheet lists **88** quests. The 274 content provides **64**. The shortfall is
mostly **era**: revision 274 is around May 2004, and the sheet runs to November 2004. Quests
such as The Fremennik Trials, Horror from the Deep and Throne of Miscellania postdate the
client and its item/NPC configs.

Coverage is uneven rather than strictly chronological — Elemental Workshop and Waterfall
exist in content despite being later — so each missing quest needs checking individually
rather than assuming a clean cutoff.

### Known mapping gaps found while reconciling

| Sheet name | 274 content | Note |
|---|---|---|
| Monk's Friend | **absent** | no matching directory under any obvious name |
| Plague City | `quest_elena` (likely) | Elena is the start NPC; identity inferred, not confirmed |
| The Restless Ghost | `quest_priest` | content names it after Father Aereck |
| Witch's Potion | `quest_hetty` | named after the NPC |
| Ernest the Chicken | `quest_haunted` | named after the manor |
| The Knight's Sword | `quest_squire` | named after the NPC |
| Vampyre Slayer | `quest_vampire` | spelling difference |
| Pirate's Treasure | `quest_hunt` | named after the ship |
| Goblin Diplomacy | `quest_gobdip` | abbreviation |

The directory names do not follow the quest titles, which is why name-matching alone
mismatched nine quests before the `QUEST_STATUS.md` key column was used as a bridge.

## 4. Why I cannot run the bots from this device

The bot fleet needs three things that are not on the phone:

1. **Bun** — the bot scripts are `#!/usr/bin/env bun` and use Bun APIs. Termux has no `bun`
   package, and Bun does not support Android/Termux.
2. **`rs-sdk`** — a separate 97 MB repository, not vendored here.
3. **A reachable 377 server** — the bots target the Lost City 377 world on the owner's
   machine. The phone runs an isolated 274 world; the two are unrelated.

So playtesting is done on the owner's machine and its results arrive here as lab logs. That
is the loop, and it is a reasonable one — but it means "I playtested it myself" is not
something that can be claimed from this device.

## 5. What actually moves the needle next

1. **Add bot quest scripts** for structurally sound quests that have none. A quest with no
   bot script can only ever be verified by hand, which is why 42 sit untested.
2. **Fix defects reported by the bots** — a bot that fails a stage produces an exact,
   reproducible defect with a coordinate and a step, which is far better than a static guess.
3. **Decide the revision question** for the ~24 missing quests: port content into 274, or
   move the playable target to a later revision. That is a product decision, not a coding
   one, and it should be made explicitly rather than by accident.

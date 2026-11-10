# Revision-274 content patches

Fixes to the Rev-274 content that this project depends on. Apply against a **fresh**
`LostCityRS/Content` checkout on branch `274`.

```sh
git -C <content-checkout> apply /path/to/JoshRS/content-patches/rs274/patches/<name>.patch
```

Then restart the engine; it repacks content at boot. A patch that fails to pack leaves the
world unable to start, so apply one at a time and watch for `World ready`.

| Patch | Effect | Verified |
|---|---|---|
| `quest_seaslug_fishing_xp.patch` | Sea Slug awards 7,175 Fishing XP (was missing entirely) | engine repacked and reached `World ready` |
| `quest_legends_reward.patch` | Legends' Quest gives four 7,650 XP lamps (was awarding none) | engine repacked and reached `World ready` |
| `quest_sheep_spin_bonus.patch` | Sheep Shearer pays the extra 50 XP when you spin your own wool | engine repacked and reached `World ready` |
| `questlist_ported_entries.patch` | 18 quest-journal entries for ported quests | repacked; every entry verified inside the surface with visible ink |
| `varp_registrations.patch` | stage varps the ported quests reference, with `scope=perm` | repacked; audit 89/90 structurally complete |
| `ported-377-quests.patch` | the 26 quest directories ported from 377 | repacked; 90 quests, 0 completion failures |

**Not playtested.** Both were verified only to the point of the engine packing and booting.
Nobody has completed either quest since the change.

## Why these are patches and not a fork

The content is a third-party MIT-licensed checkout. Patches keep the change reviewable and
reversible, and make it obvious which lines are ours when upstream moves.


## Applying these to a fresh 274 content checkout

Order matters — varps must exist before the quests that use them are packed:

```sh
git -C <274-content> apply /path/to/content-patches/rs274/patches/varp_registrations.patch
git -C <274-content> apply /path/to/content-patches/rs274/patches/ported-377-quests.patch
git -C <274-content> apply /path/to/content-patches/rs274/patches/quest_legends_reward.patch
git -C <274-content> apply /path/to/content-patches/rs274/patches/quest_seaslug_fishing_xp.patch
git -C <274-content> apply /path/to/content-patches/rs274/patches/quest_sheep_spin_bonus.patch
git -C <274-content> apply /path/to/content-patches/rs274/patches/questlist_feud_entry.patch
```

Then restart the engine. `tools/questops/port-377-quests.sh` does the same thing from the pinned
upstream if the patch cannot be applied.

## Why these patches exist in git at all

The live world was reset once and took 26 ported quests and 152 stage-var registrations with it,
because they existed only as files in `~/lc274`. Anything that lives only in the world is one reset
away from gone; these patches are the durable copy.

## A verification trap worth recording

`audit-quests.mjs` scans **every** `scripts/_unpack/*/all.varp`, so a varp written into the wrong
revision still reads as "present". That happened: definitions landed in `_unpack/225/all.varp` while
the engine runs 274, and the audit reported `VARP: yes`. The tool now targets the revision named in
`engine/data/config/world.json`, but **the audit itself is still cross-revision** and cannot be
trusted alone for this particular check.



## Journal entries for ported quests

`tools/questops/add-quest-journal-entries.py` adds a quest-list component for each ported quest that
has a journal script but no entry, so its journal is reachable.

- entry text comes from an explicit table or the quest's own README title — **never invented**
- a quest whose name cannot be established is **refused**, not defaulted
- entries append below the last existing one; the list is a scrollable column, so this is
  order-correct and cannot collide

Verified: 18 entries added, 84 text components, **1 overlapping pair** (the pre-existing
title/header), every sampled entry inside the render surface with visible ink, and the world repacked
to `World ready`.



## Structural audit: 70 → 89 of 90, by fixing the measurement

The audit reported 70 of 90 quests structurally complete, but most of that gap was its own
`WIRED` heuristic: it required a reference from **outside** the quest directory. Ported quests keep
their NPC scripts inside their own directory, so nothing external referenced them and 18 were marked
unwired despite being complete.

`WIRED` now records a mode:

- `external` — something outside the quest reaches it (strongest signal)
- `self-contained` — its own directory references its varp/labels (still proves entry points exist)
- `n/a` — no varps or labels to wire

Result: **89 of 90** structurally complete, with the mode printed per quest so the weaker signal is
visible rather than hidden. The single remaining gap is `quest_barcrawl`, a miniquest with no journal
entry and no reward call — which may be correct for a miniquest and is left visible rather than
excused.

### A mistake made and reverted while doing this

Registering the two varps that exist in no upstream file (`lost_tribe_quest`,
`mdaughter_quest_var`) required an opt-in. The first version of the opt-in accepted **any** unknown
name, which registered eleven engine pseudo-variables (`npc_lastcombat`, `follower_uid`,
`npc_combat_xp_multiplier`, …) as varps. They were removed, and the opt-in now accepts only
quest-owned names (`*quest*`). Two genuine ones (`follower_uid`, `draugen_butterfly_uid`) were
restored because they *are* in the upstream pack — the removal was too broad, and the tool re-added
them.


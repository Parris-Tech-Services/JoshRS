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

## Cross-registry symbolic names must be unique (a real defect, repaired)

`Engine-TS` rev 274 rejects duplicate symbolic names across **all four** config registries —
`VarpPack`, `VarbitPack`, `VarnPack` and `VarsPack` (`tools/pack/config/PackShared.ts`). A symbol may
be registered in exactly one of them.

`add-missing-varps.py` did not know this. It registered every `%name` a ported quest referenced as a
**varp**, including names already owned by varbit, varn or vars. The result was **56 cross-registry
collisions**, and `troll_freed_eadgar` was one:

| registry | id |
|---|---|
| `varbit.pack` | 0 (pre-existing, `basevar=troll_varbit`, bits 0–0) |
| `varp.pack` | 649 (**redundant allocation by this project**) |

Checking `varp.pack` alone for duplicate names cannot find this — every file is internally unique.

`tools/questops/repair-cross-registry-varps.py` fixes it:

- audits all four registries together
- **the pre-existing registration wins**; the added varp is the redundant one
- only varp ids at or above `--min-id` (default 359) are considered, which are exactly the ids this
  project appended after the stock registry, so no established player-save id is touched
- removes the matching `all.varp` definition block, which is also invalid for a name owned elsewhere

Verified on the isolated dev world: **56 → 0 collisions**, world repacked to `World ready`, 518 varp
entries remain, and `troll_freed_eadgar` is reachable only as its varbit on `troll_varbit`.

## Login is not persistence: the account is only saved after character design

A save/reload check was added to the visual pipeline: log in, count the `.sav` files written, then log
in again as the same account and require that character design does **not** reappear.

It failed immediately, and usefully:

```
saves after first login:
total 0
save count: 0
::error::no save file was written after login
```

**No save file exists after a login that stops at the character-design screen.** The client has been
accepted by the server and is holding a pending player, but the account is not persisted until
appearance is confirmed.

This matters for two reasons:

1. **Login success was over-reading.** Reaching character design proves credentials were accepted, not
   that an account exists on disk. Any statement that a quest's stage can persist depends on the
   design step completing first.
2. **It explains the empty player directory in clean CI runs** — not a bug in the save path, but a
   player that never finished creation.

So persistence is **not yet verified**, and the check that would verify it is now written and honest:
it fails until the design step completes, and passes only when a returning login skips creation
entirely.


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

## Missing map regions: Uzer and the rest of 2005

Ported quests reference places that revision 274 never had. Uzer (region **54,48**, used by The Golem)
had no `m54_48.jm2` at all, so teleporting there renders a **black world** — no terrain, no locations,
no NPC spawns.

The 274 content ships **483** maps; revision 377 ships **660**. The missing 177 include entire later
areas, so ported quests cannot be played without them.

`tools/questops/restore-maps.sh <377-content> <target-content>` copies the missing maps across. The
`.jm2` format is text with a stable `==== MAP ====` header in both revisions, so files drop in
unchanged.

**Maps are game assets and are never committed to this repository** — the script is the reproducible
record, not the data.

### Verified on the isolated dev world

```
copied=193  target maps now: 677
engine repacked -> World ready, no map parse errors
m54_48.jm2: 4,168 terrain tiles, 4 sections (MAP/NPC/OBJ/LOC), 9 NPCs, 1 obj, location spawns
```

Not yet verified in a client: the region has not been *seen* rendered. The dev world serves it and the
engine accepted the file, but "not black" is a visual claim that still needs a client session.
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

## Issue #324 repairs in the isolated dev world

### Reference handling fixed in both tools

`opnpc`, `oploc` and `opheld` are separate namespaces, and each has a `u` variant (`opnpcu`,
`oplocu`, `opheldu`) used heavily by quests — **384 occurrences** across the ported content. Both the
importer and the audit previously matched only the numbered forms, which undercounted dependencies and
let the audit treat quests as complete that were not.

### Definitions are not only in the central registries

`all.<kind>` is not the whole story: many definitions live in per-quest configs such as
`scripts/quests/quest_mm/configs/mm.loc`. Indexing only `_unpack` reported ~1,000 locs as
"no definition upstream" **that did exist**, and is the likely reason The Golem stayed blocked. Both
`port-map-definitions.py` and `check-map-integrity.mjs` now index the whole source tree.

### New: `check-map-integrity.mjs`

For every map imported from the newer revision it resolves each numeric NPC/LOC/OBJ reference against
the target packs and the **source** packs, and classifies:

| class | meaning |
|---|---|
| `dangling` | id not registered at all — the entity cannot exist |
| `mismatch` | id registered, but to a *different* symbol than the source intended — spawns a plausible, wrong entity |
| `noDefinition` | symbol registered but no definition resolved |

Its first version parsed `level x y: id` wrongly, matched nothing, and reported a **clean bill of
health**. That is the fourth time this session a check silently found nothing; the parser now reads the
id after the colon.

### Measured on the dev world after importing 793 NPCs, 3,795 locs and 21 objs

```
maps with problems: 156
  npc: dangling=0 mismatch=18  noDefinition=5
  loc: dangling=0 mismatch=322 noDefinition=65
  obj: dangling=0 mismatch=0   noDefinition=1
```

**Zero dangling** is real progress: every referenced id now exists. The **340 mismatches** are the
remaining blocker — ids that already mean something else in revision 274, so an imported map would
spawn the wrong entity. Fixing those needs a map-scoped id translation (allocate a new id for the 377
symbol and rewrite only the imported maps), which is designed but **not implemented**.

### Sigmund, correctly this time

The 377 source has `2079=lost_tribe_sigmund` spawning at `1 9 19` in `m50_50` (world 3209,3219),
beside Duke Horacio at `1 12 20`. An earlier attempt registered the wrong symbol
(`lost_tribe_sigmund_there`, id 1359) at the wrong tile; that entry and spawn were removed and the
correct id, definition and position are in place.

### Quest presence scoreboard corrected

`quest-status.mjs` had wrong aliases: `Troll Romance` mapped to `null`, `Mountain Daughter` and
`Between a Rock...` pointed at directories that do not exist, and `Icthlarin's Little Helper` was
misspelt. Present count moved **72 → 76 of 88** on the same content.

## Map-scoped id translation: identity now matches, not just existence

After importing definitions, every numeric reference in the imported maps resolved — but **340 of them
resolved to the wrong symbol**. An id like `100` may be `man` in 274 and something else in 377, so a
map would spawn a plausible, wrong entity and nothing would error.

`tools/questops/translate-map-ids.py` fixes identity:

1. allocate a **new** id for the 377 symbol, above the target's maximum
2. register the symbol and its definition at that id
3. rewrite the reference **in the imported maps only**

Existing 274 ids are never reused, so 274 meanings and player-save compatibility are preserved. Maps
are not saved by players, so rewriting a map file cannot affect a save.

Result on the dev world:

```
before: 0 dangling · 340 mismatches · 71 unresolved
after : 0 dangling ·   0 mismatches ·  0 unresolved   (all 660 imported maps)
```

The last 71 were false: symbols such as `mmsnailpoint_red+black` contain `+`, which the index
character class excluded. Fixed — that is the fifth check in this project that under-reported by
failing to look properly.


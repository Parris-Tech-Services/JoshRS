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
| `questlist_feud_entry.patch` | The Feud gets a quest-journal entry | repacked; entry renders with ink (not yet seen in client) |
| `varp_registrations.patch` | 156 stage varps the ported quests reference, with `scope=perm` | repacked; audit 70/90 structurally complete |
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


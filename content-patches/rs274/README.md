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

**Not playtested.** Both were verified only to the point of the engine packing and booting.
Nobody has completed either quest since the change.

## Why these are patches and not a fork

The content is a third-party MIT-licensed checkout. Patches keep the change reviewable and
reversible, and make it obvious which lines are ours when upstream moves.

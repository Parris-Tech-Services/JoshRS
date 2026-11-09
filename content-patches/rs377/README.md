# Revision-377 content patches

Apply against a **fresh** `LostCityRS/Content` checkout on branch `377-wip`, then restart the
engine; it repacks at boot.

```sh
git -C <content-checkout> apply /path/to/JoshRS/content-patches/rs377/patches/<name>.patch
```

| Patch | Effect | Verified |
|---|---|---|
| `quest_priestperil_prayer_xp.patch` | Priest in Peril pays 1,406 Prayer XP (was 140.6) | applies to pristine; engine reached `World ready` |
| `quest_seaslug_fishing_xp.patch` | Sea Slug pays 7,175 Fishing XP (was nothing, while the UI promised it) | applies to pristine; engine reached `World ready` |

**Both were verified together** against a pristine `HEAD` worktree: applied cleanly as a pair and
produced the expected lines. **Neither has been playtested.**

## A defect found in this deliverable

`quest_seaslug_fishing_xp.patch` was first generated without a path filter, so it contained the
Priest in Peril hunk **as well**. Applying both patches would have conflicted, and applying only
the Sea Slug one would silently have made the Priest in Peril fix too.

Caught by reverse-checking each patch against the working tree — a check that only works if you
actually run it. The patch is now regenerated with `git diff -- <path>` and verified as a
single-file change.

The other 33 numbered patches in `patches/` predate this work and are applied by
`ci-compile-batch-quests.sh` to a throwaway copy rather than to a checkout, which is why they do
not reverse-apply here.

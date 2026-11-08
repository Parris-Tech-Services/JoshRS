# Quest bundle 2 — disposable revision-377 build handoff
Updated 8 November 2026 (rescoped twice: batch3 and batch4 landed on main mid-PR)

**State: COMPILED NATIVELY (local disposable build against both pins, full 0001-0024 +
10001-10008 stack).** This bundle ports the quest scaffolding for the remaining
unimplemented in-queue quests not already owned by the batch-quests bundle —
**Mourning's End Part I and In Aid of the Myreque** — following the five-quest bundle
pipeline (PR #148). **Not yet verified by an ordinary end-to-end player quest playthrough.
Not installed in the live JoshRS family world.**

## Rescope history (moving-target main)

- **Batch3** (patches 0020-0022) landed One Small Favour on main with the same `^osf_*`
  constant names this bundle originally used — OSF was dropped from this PR.
- **Batch4** (patches 0023-0024) landed Wanted!, Rum Deal, Forgettable Tale, Garden of
  Tranquillity, A Tail of Two Cats and Shadow of the Storm on main — Wanted! and Rum Deal
  were dropped from this PR (their `quest_wanted`/`deal_quest` varps are already
  `scope=perm` via 0023 and registered via 0024, with richer stage sets `^w_*`/`^dl_*`).
- The batch bundle also resolved the `[opnpc1,zogre_human_zavistic_rarve]` duplicate
  trigger by removing it from `quest_handsand.rs2`; this branch syncs to main's version.
- `10001`/`10007`/`10008` are regenerated against the full 0001-0024 stack each time.

## Why these quests

Both are in the 104-quest Revision 377 queue (`research/rs377/QUEST_QUEUE_2026-11-08.md`)
with full cache support, and each closes or extends a series already in the project:

- **Mourning's End Part I** (`questlist:mourning`, varp `mourning_quest` id 517): the
  prerequisite the existing ME Part II scaffold (PR #148) gates on. Cache also carries ~20
  `mourning_*` varbits (sheep dye, mourner disguise, gnome courier) — unused in this
  scaffold. Start NPC Eluned is cache NPC `roving_female_woodelf` (id 1679); gated on
  Roving Elves complete (`roving_elves_quest`).
- **In Aid of the Myreque** (`questlist:myreque_2`, varp `myreque_2_main_var` id 704): the
  newest remaining in-queue quest (30 March 2006). The start is a self-contained branch in
  the batch bundle's Veliaf handler (`quest_myreque/scripts/quest_route.rs2`), gated on
  `routequest` complete.

## Scope honesty

Each quest is a scaffold: journal (`[if_button,questlist:*]`), a start-NPC dialogue with
prerequisite gates (ME1), persistent transmitted quest varp, quest-point award and
quest-list colour registration. The deeper gameplay (mourner HQ infiltration, the Burgh de
Rott camp and statue repairs) is explicitly marked `NOT YET IMPLEMENTED IN THIS WORLD` in
journal/dialogue text. Stage scales are JoshRS reconstructions, not Jagex values. All
wording is original (no Jagex or wiki text).

## Patch chain (applies in numeric order after the batch-quests and bundle-1 series)

- `10001` (regenerated this PR): five-quest registration, stacked on the 0001-0024 series.
- `10007`: register the two new quests in `quests.rs2` (QP: ME1 2, Myreque 2; two colour
  lines).
- `10008`: add `scope=perm` in place to the two quest varps in `all.varp`
  (`mourning_quest`, `myreque_2_main_var`) — the batch-0006 in-place pattern rather than
  bundle 1's move-out pattern, so the batch bundle's Veliaf handler can reference
  `%myreque_2_main_var` in its own CI build.

## Cross-bundle integration fix (also pushed to PR #148)

Bundle 1's registration patch (10001) was generated against the pristine pinned content
and stopped applying once the batch-quests patches touched `quests.rs2` first — no CI had
ever applied both series together, so this was invisible until merge. `10001` is now
regenerated against the stacked state, and `ci-compile-sixquests.sh` applies **every**
patch in numeric order and overlays **every** quest folder on the branch, so it validates
the real combined post-merge state of main.

## Ownership boundaries

- The `quest_myreque` folder belongs to the batch-quests bundle; the only edit here is the
  Veliaf `case ^route_complete` branch, kept self-contained (raw stages `0/1/2` on the
  cache varp, no questbundle2 symbols) so the batch CI still compiles it standalone.
- `quest_100`, `quest_fever`, `quest_rd`, `quest_mourning2`, `quest_mm` belong to bundle 1.
- One Small Favour, Wanted!, Rum Deal (and batch4's forget/garden/twocats/agrith) belong
  to the batch-quests bundle; not touched here. Swan Song likewise stays with the batch
  bundle.

## Reproducible source and build

- Pinned Content: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Pinned Engine: `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- Local disposable build: all 32 patches in numeric order (0001-0024 + 10001-10008) + all
  94 quest folders, `BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build` — passed
  (pack ~19s, `script.dat` 5.6 MB), static symbol check passed (907 symbols, no unknowns),
  CI guard assertions verified locally.
- CI: `.github/workflows/sixquests-disposable-377.yml` (shared) runs the combined
  validation on PRs and pushes touching `content-patches/rs377/**`.

## Post-377 quests (the attached gap document)

The user-supplied gap document (every OSRS/RS3 quest not in the 377 queue) is answered by
`research/rs377/POST_377_QUEST_CAPABILITY_TRIAGE_2026-11-08.md`: none of those quests can
be implemented against the pinned 377 cache (no quest-list components beyond 104, no
varps, no map regions, no NPCs), so they remain out of scope. The remaining in-queue
quests are the implementable backlog.

## Remaining in-queue backlog (after bundle 1 + 2 + batch 1-4)

Rat Catchers (`ratcatch`), Devious Minds (`devious`), Enakhra's Lament (`enakh`), A Fairy
Tale Pt. 1 (`fairy_farmers`). All four retain full cache support per the quest-queue
research.

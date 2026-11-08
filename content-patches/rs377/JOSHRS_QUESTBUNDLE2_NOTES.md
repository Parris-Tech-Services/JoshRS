# Quest bundle 2 — disposable revision-377 build handoff
Updated 8 November 2026

**State: COMPILED NATIVELY (local disposable build against both pins).** This bundle ports
the quest scaffolding for five more un-implemented quests in the JoshRS 377 world —
**Mourning's End Part I, Wanted!, In Aid of the Myreque, One Small Favour, and Rum Deal** —
following the five-quest bundle pipeline (PR #148). **Not yet verified by an ordinary
end-to-end player quest playthrough. Not installed in the live JoshRS family world.**

## Why these quests

All five are in the 104-quest Revision 377 queue (`research/rs377/QUEST_QUEUE_2026-11-08.md`)
with full cache support, and each closes or extends a series already in the project:

- **Mourning's End Part I** (`questlist:mourning`, varp `mourning_quest` id 517): the
  prerequisite the existing ME Part II scaffold (PR #148) gates on. Cache also carries ~20
  `mourning_*` varbits (sheep dye, mourner disguise, gnome courier) — unused in this
  scaffold. Start NPC Eluned is cache NPC `roving_female_woodelf` (id 1679).
- **Wanted!** (`questlist:wanted`, varps `quest_wanted` 571 / `quest_wanted2` 572): the
  Temple Knight sequel to Recruitment Drive. Cache carries the full `wanted_*` varbit
  mission set. Start NPC Sir Tiffy Cashien is cache NPC `rd_teleporter_guy` (id 2290).
- **In Aid of the Myreque** (`questlist:myreque_2`, varp `myreque_2_main_var` id 704): the
  newest remaining in-queue quest (30 March 2006). The start is a self-contained branch in
  the batch bundle's Veliaf handler (`quest_myreque/scripts/quest_route.rs2`), gated on
  `routequest` complete.
- **One Small Favour** (`questlist:onesmallfavour`, varps 416/417): start NPC Yanni Salika
  (`shiloantiques` id 515) already had an upstream script — extended via patch 10009,
  same pattern as the cook/Sir Amik/Narnode extensions in bundle 1.
- **Rum Deal** (`questlist:deal`, varp `deal_quest` id 600): the cache carries all 37
  `deal_*` NPCs Jagex prepared for the quest (Pirate Pete is `deal_pete` id 2825).

## Scope honesty

Each quest is a scaffold: journal (`[if_button,questlist:*]`), a start-NPC dialogue with
prerequisite gates, persistent transmitted quest varp, quest-point award and quest-list
colour registration. The deeper gameplay (mourner HQ infiltration, commorb missions,
Burgh de Rott camp, the favour chain, Braindeath Island brewery) is explicitly marked
`NOT YET IMPLEMENTED IN THIS WORLD` in journal/dialogue text. Stage scales are JoshRS
reconstructions, not Jagex values. All wording is original (no Jagex or wiki text).

## Patch chain (applies in numeric order after the batch-quests and bundle-1 series)

- `10001` (regenerated this PR): five-quest registration, now stacked on the batch series.
- `10007`: register the five new quests in `quests.rs2` (QP: ME1 2, Wanted! 1, Myreque 2,
  OSF 2, Rum Deal 2; five colour lines).
- `10008`: add `scope=perm` in place to the five quest varps in `all.varp`
  (`mourning_quest`, `quest_wanted`, `myreque_2_main_var`, `onesmallfavour`, `deal_quest`)
  — the batch-0006 in-place pattern rather than bundle 1's move-out pattern, so the batch
  bundle's Veliaf handler can reference `%myreque_2_main_var` in its own CI build.
- `10009`: extend Yanni Salika's antique-shop dialogue with the OSF start branch.

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
- Swan Song stays with the batch bundle; not touched here.

## Reproducible source and build

- Pinned Content: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Pinned Engine: `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- Local disposable build: all 25 patches in numeric order + all 86 quest folders,
  `BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build` — passed (pack ~20s,
  `script.dat` 5.6 MB), static symbol check passed (1106 symbols, no unknowns).
- CI: `.github/workflows/sixquests-disposable-377.yml` (shared) runs the combined
  validation on PRs and pushes touching `content-patches/rs377/**`.

## Post-377 quests (the attached gap document)

The user-supplied gap document (every OSRS/RS3 quest not in the 377 queue) is answered by
`research/rs377/POST_377_QUEST_CAPABILITY_TRIAGE_2026-11-08.md`: none of those quests can
be implemented against the pinned 377 cache (no quest-list components beyond 104, no
varps, no map regions, no NPCs), so they remain out of scope. The remaining in-queue
quests are the implementable backlog.

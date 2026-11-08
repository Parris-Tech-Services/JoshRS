# Five quests — disposable revision-377 build handoff
Updated 8 November 2026

**State: COMPILED NATIVELY (local disposable build and GitHub Actions against both pins).**
This bundle ports the quest scaffolding for five of the six newest un-implemented quests
in the JoshRS 377 world — **Recipe for Disaster (intro chapter), Cabin Fever, Recruitment
Drive, Mourning's End Part II, and Monkey Madness** — following the Fenkenstrain overlay
pipeline (PR #136). **Not yet verified by an ordinary end-to-end player quest playthrough.
Not installed in the live JoshRS family world.**

## Why these quests

- Each existed in the pinned content only as a config-only stub (a `configs/*.loc`
  file, no scripts, no journal, no registration).

## Swan Song is not in this bundle

Swan Song (the sixth of the six originally identified) is now owned by the
batch-quests bundle merged to main (PR #147, `quest_swansong/` with its own
stage scale 10-100, fresh-monkfish fishing/cooking slice, and registration in
patch 0007). Registering it here as well would double-award its quest points,
so this bundle deliberately excludes it: no swansong QP/colour lines, no
`quest_swansong` folder, and `swansong_quest` stays in `all.varp` for the batch
bundle to own. Known gap in the batch bundle that this PR does not fill: it
ships no quest journal script (`[if_button,questlist:swansong]`).

## Reproducible source and build

- Pinned Content: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Pinned Engine: `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- `.github/workflows/sixquests-disposable-377.yml` clones both immutable pins
  to a disposable Actions runner and runs the real `npm ci && npm run build`
  with `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true`. It triggers on
  pull requests and branch pushes touching `content-patches/rs377/**`.
- `ci-compile-sixquests.sh` applies six guarded text-only patches on that
  disposable content copy only, merges the five quest folders into the four
  existing stubs, verifies unique permanent transmitted varps, surviving
  upstream `.loc` stubs, single quest-list registrations, no swansong
  re-registration, and runs the static symbol checker over all five overlays
  plus the three patched dialogue scripts.

## Patches

- **1001** — registers the five quests in `scripts/general/scripts/quests.rs2`:
  quest points for Cabin Fever (2), Recruitment Drive (1), Mourning's End
  Part II (2), Monkey Madness (3), and quest-list colour lines for all five.
  RFD gets a colour line but **no quest points yet**: the colour only turns
  green at `^rfd_full_complete = 255`, which no script sets until the eight
  chapters and the Culinaromancer are implemented.
- **1002** — moves the four cache varps (`fever_quest`, `recruitmentdrive`,
  `mourning_quest_part2`, `mm_main`) out of `scripts/_unpack/377/all.varp`
  into their quest configs with `scope=perm` and `transmit=yes`, so the
  cache's client-side varbits on them keep resolving while the definitions
  become quest-owned.
- **1006** — claims the cache's real RFD main var (id 678, upstream
  placeholder name `100intro`, which RuneScript cannot reference because it
  begins with a digit) for the quest: renamed to `rfd_quest` in
  `pack/varp.pack` and in the eight `basevar=` varbit references, definition
  moved into `quest_100`'s config. The client's RFD varbits
  (`hundred_main_quest_var` bits 0-6, `hundred_subquest_tally` bits 11-20,
  …) keep resolving against the same id 678.
- **1003** — RFD intro in the **Cook's existing post-quest chat**
  (`area_lumbridge/cook.rs2`): 10-Cooking-gated offer, milk/flour/egg hand-in,
  intro completion with an explicit "not yet implemented" wall for the feast.
- **1004** — Recruitment Drive start in **Sir Amik Varze's existing post-quest
  chat** (`area_falador/sir_amik_varze.rs2`), gated on Black Knights' Fortress
  (guaranteed in that branch) and Druidic Ritual. Sir Tiffy Cashien has **no
  NPC definition in the pinned 377 cache**, so the Temple Knights' recruitment
  starts from Amik instead; the Falador Park portal handler states the
  grounds are not yet open.
- **1005** — Monkey Madness start in **King Narnode's existing post-quest
  branch** (`quest_grandtree/king_narnode.rs2`), gated on The Grand Tree
  (guaranteed in that case) and Tree Gnome Village, invoking the overlay's
  `mm_narnode_branch` proc — the same cross-file pattern as the fenkenstrain
  Roavar patch.

## Implemented vs not implemented

| Quest | Implemented (playable) | Not implemented (journal/notes only) |
| --- | --- | --- |
| Recipe for Disaster | Intro chapter: Cook's offer, ingredient hand-in | Culinaromancer cutscene mechanics, the eight council-member chapters, final battle, rewards |
| Cabin Fever | Bill Teach start with 50 Smithing / 40 Ranged gates | Boarding The Adventurous, the sea battle, repair/plunder mechanics, rewards |
| Recruitment Drive | Amik start with prerequisite gates; portal message | Sir Tiffy (no NPC in cache), the seven test rooms, rewards |
| Mourning's End Part II | Arianwyn start (gated on ME1 var, which is itself unimplemented) | Essyllt, mourner tunnels, Temple of Light light-puzzle, Eluned, Thorgel, Death Altar, rewards |
| Monkey Madness | Narnode start + report-back stages with Grand Tree / Tree Gnome Village gates | Shipyard, Daero, hangar puzzle, Crash Island, Ape Atoll stealth, Zooknock, greegree, Jungle Demon, rewards |

## Known gaps and substitutions (377 cache constraints)

- **Sir Tiffy Cashien does not exist** as an NPC in the pinned 377 cache;
  Recruitment Drive is routed through Sir Amik Varze instead.
- **RFD's main cache varp** was named `100intro` — a digit-leading name that
  RuneScript identifiers cannot reference. Patch 1006 renames it (pack id 678)
  to `rfd_quest`; the other RFD cache varps (`100council`, `hundred_dave`, …)
  stay in `all.varp` untouched. No new varp id was invented: the 377 client's
  varp array only covers the cache's 725 ids (0-724), so a fresh id would be
  out of client range.
- **Mourning's End Part I is not implemented** in this world either, so the
  ME2 start gate on `%mourning_quest` can never pass yet. The branch is
  written so it lights up once ME1 lands.
- **Completion values are pinned to upstream constants**: `mm_complete = 10`
  is owned by upstream `quest.constant` (the MM armour level requirement
  reads it; redefining it is a build error), and RD's `rd_complete = 2`
  mirrors upstream's `recruitmentdrive_complete` (Temple Knight armour
  requirement). Discovered from upstream's `levelrequire.rs2`.
- Stage values on the state vars are otherwise **JoshRS reconstructions**
  (the cache does not ship quest scripts); quest-point values are wiki-sourced
  and unverified for 377.

## Provenance and licensing

All dialogue and journal wording in this bundle is **original JoshRS wording**;
nothing is copied from Jagex game transcripts or wiki text. Quest structure
(stage ordering, requirement values, item lists) is derived from publicly
documented quest facts. No game caches, proprietary models, client binaries,
passwords or saves are committed. The pinned upstream content is MIT-licensed
(LostCityRS/Content, Jagex assets excluded); AGPL sources (2009scape,
OpenRSC) were **not** used — clean-room only per the porting roadmap
(`docs/377_CONTENT_PORTING_ROADMAP.md`).

## Verification status

- `tools/check_fivequest_symbols.py` passes against the pinned content with all
  patches applied plus the three patched dialogue scripts (no unknowns,
  brackets balanced).
- **Local native compile PASSED**: the full pinned content (all patches +
  quest folders merged) built with Engine-TS@b5ac859b, `BUILD_VERIFY=true`,
  `BUILD_VERIFY_PACK=true` — `data/pack/server/script.dat` and `script.idx`
  produced. Build-time discoveries baked into the bundle: RuneScript forbids
  `@label` jumps from inside a proc (the Narnode branch uses nested procs),
  and the script compiler resolves `../content/scripts` relative to the engine
  cwd (CI keeps engine and content side-by-side).
- CI verdict on every commit is recorded in this bundle's PR.
- **A successful compile is not gameplay.** Player-verified playthroughs in
  the live 377 world are required before any of the five is called playable.

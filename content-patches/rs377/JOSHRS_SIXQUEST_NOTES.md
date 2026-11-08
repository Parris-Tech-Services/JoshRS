# Six quests — disposable revision-377 build handoff
Updated 8 November 2026

**State: COMPILED NATIVELY (local disposable build against both pins).**
This bundle ports the quest scaffolding for the six newest un-implemented quests
in the JoshRS 377 world — **Swan Song, Recipe for Disaster (intro chapter),
Cabin Fever, Recruitment Drive, Mourning's End Part II, and Monkey Madness** —
following the Fenkenstrain overlay pipeline (PR #136). **Not yet verified by an
ordinary end-to-end player quest playthrough. Not installed in the live JoshRS
family world.**

## Why these six

- **Swan Song** (May 2006) had no presence at all: no quest folder, no journal.
- The other five existed in the pinned content only as config-only stubs
  (a `configs/*.loc` file each, no scripts, no journal, no registration).

## Reproducible source and build

- Pinned Content: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Pinned Engine: `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- `.github/workflows/sixquests-disposable-377.yml` clones both immutable pins
  to a disposable Actions runner and runs the real `npm ci && npm run build`
  with `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true`.
- `ci-compile-sixquests.sh` applies five guarded text-only patches on that
  disposable content copy only, merges the six quest folders into the five
  existing stubs (Swan Song is new), verifies unique permanent transmitted
  varps, surviving upstream `.loc` stubs, single quest-list registrations, and
  runs the static symbol checker over all six overlays plus the three patched
  dialogue scripts.

## Patches

- **1001** — registers the six quests in `scripts/general/scripts/quests.rs2`:
  quest points for Swan Song (2), Cabin Fever (2), Recruitment Drive (1),
  Mourning's End Part II (2), Monkey Madness (3), and quest-list colour lines
  for all six. RFD gets a colour line but **no quest points yet**: the colour
  only turns green at `^rfd_full_complete = 255`, which no script sets until
  the eight chapters and the Culinaromancer are implemented.
- **1002** — moves the five cache varps (`swansong_quest`, `fever_quest`,
  `recruitmentdrive`, `mourning_quest_part2`, `mm_main`) out of
  `scripts/_unpack/377/all.varp` into their quest configs with `scope=perm`
  and `transmit=yes`, so the cache's client-side varbits on them keep
  resolving while the definitions become quest-owned.
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
  starts from Amik instead; the Falador Park portal handler records the
  testing stage and states the grounds are not yet open.
- **1005** — Monkey Madness start in **King Narnode's existing post-quest
  branch** (`quest_grandtree/king_narnode.rs2`), gated on The Grand Tree
  (guaranteed in that case) and Tree Gnome Village, invoking the overlay's
  `mm_narnode_branch` proc — the same cross-file pattern as the fenkenstrain
  Roavar patch.

## Implemented vs not implemented

| Quest | Implemented (playable) | Not implemented (journal/notes only) |
| --- | --- | --- |
| Swan Song | Herman start with 100-QP gate; Wise Old Man 10-blood-rune hand-in (substituted — see below); Arnold 5-monkfish hand-in; Franklin 5-iron-sheet hand-in | Sea troll battles, wall repair objects, Frumscone, Malignius, the Sea Troll Queen, rewards |
| Recipe for Disaster | Intro chapter: Cook's offer, ingredient hand-in | Culinaromancer cutscene mechanics, the eight council-member chapters, final battle, rewards |
| Cabin Fever | Bill Teach start with 50 Smithing / 40 Ranged gates | Boarding The Adventurous, the sea battle, repair/plunder mechanics, rewards |
| Recruitment Drive | Amik start with prerequisite gates; portal stage marker | Sir Tiffy (no NPC in cache), the seven test rooms, rewards |
| Mourning's End Part II | Arianwyn start (gated on ME1 var, which is itself unimplemented) | Essyllt, mourner tunnels, Temple of Light light-puzzle, Eluned, Thorgel, Death Altar, rewards |
| Monkey Madness | Narnode start + report-back stages with Grand Tree / Tree Gnome Village gates | Shipyard, Daero, hangar puzzle, Crash Island, Ape Atoll stealth, Zooknock, greegree, Jungle Demon, rewards |

## Known gaps and substitutions (377 cache constraints)

- **Sir Tiffy Cashien does not exist** as an NPC in the pinned 377 cache;
  Recruitment Drive is routed through Sir Amik Varze instead.
- **Lava runes and mist runes do not exist** in the 377 item list, so the Wise
  Old Man's rune payment is substituted with **10 blood runes** (the closest
  377-era high-tier rune). Historically the request was lava/mist runes; this
  is a documented gameplay deviation.
- **RFD's main cache varp** was named `100intro` — a digit-leading name that
  RuneScript identifiers cannot reference. Patch 1006 renames it (pack id 678)
  to `rfd_quest`; the other RFD cache varps (`100council`, `hundred_dave`, …)
  stay in `all.varp` untouched. No new varp id was invented: the 377 client's
  varp array only covers the cache's 725 ids (0-724), so a fresh id would be
  out of client range.
- **Mourning's End Part I is not implemented** in this world either, so the
  ME2 start gate on `%mourning_quest` can never pass yet. The branch is
  written so it lights up once ME1 lands.
- Stage values on all six state vars are **JoshRS reconstructions** (the cache
  does not ship quest scripts); quest-point values are wiki-sourced and
  unverified for 377.

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

- `tools/check_sixquest_symbols.py` passes against the pinned content with all
  six patches applied plus the three patched dialogue scripts (891 symbols, no
  unknowns, brackets balanced).
- **Local native compile PASSED**: the full pinned content (all six patches +
  quest folders merged) built with Engine-TS@b5ac859b, `BUILD_VERIFY=true`,
  `BUILD_VERIFY_PACK=true` — `pack: 18.8s`, `data/pack/server/script.dat`
  (5.4 MB) and `script.idx` produced. Two build-time discoveries are baked
  into the bundle: RuneScript forbids `@label` jumps from inside a proc (the
  Narnode branch uses nested procs), and the script compiler resolves
  `../content/scripts` relative to the engine cwd (CI keeps the engine and
  content side-by-side, as this build did).
- CI verdict on every commit will be recorded in this bundle's PR.
- **A successful compile is not gameplay.** Player-verified playthroughs in
  the live 377 world are required before any of the six is called playable.

<!-- ci retrigger: pull_request event did not dispatch on PR open -->

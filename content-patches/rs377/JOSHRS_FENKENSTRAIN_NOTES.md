# Creature of Fenkenstrain — disposable revision-377 build handoff
Updated 8 November 2026

**State: COMPILED AND TEST-SERVER BOOTED (disposable GitHub Actions).**
**Not yet verified by an ordinary end-to-end player quest playthrough. Not
installed in the live JoshRS family world.** This branch continues Claude's
original `quests/377-fenkenstrain-wip-20261108` via PR #136, without
overwriting or force-pushing Claude's working branch.

## Reproducible source and build

- Pinned Content: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Pinned Engine: `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- `.github/workflows/fenkenstrain-disposable-377.yml` clones *both* immutable
  pins to `$RUNNER_TEMP/joshrs-fenkenstrain-377`, installs no binaries into
  JParrisDesktop, and runs the real `npm ci && npm run build` with native
  `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true`.
- `ci-compile-fenkenstrain.sh` applies five guarded text-only patches on
  **that disposable content copy only**, verifies unique permanent and
  transmitted quest varps, invokes the static symbol checker and map contract.
- Compiled `script.dat` and `script.idx` must exist, then a disposable
  SQLite test server must boot on ports 15402 and 18880. The smoke test does
  **not log a player in or complete quest stages**.
- The automated `check_fenk_map.py` verifies source map object coordinates,
  key NPC 1676, both underground exit ladders, native ladder handler, and the
  existing Roavar dialogue extension against the exact pinned map files.

## Scripted quest flow

- `fenk_journal.rs2`: quest journal and stage-dependent requirements.
- `fenk_npcs.rs2`: original dialogue with Dr Fenkenstrain, the Gardener Ghost
  (shed key when equipped with ghostspeak amulet), Lord Rologarth, body-part
  turn-ins, final 25-Thieving pickpocket, and one-time reward guard.
- `fenk_castle.rs2`: Canifis notice; stage-gated amulets from two verified
  upstairs bookcases; assembling the star amulet; broom and canes; 20-Crafting
  brush with three canes, three bronze wires, west-fireplace mould;
  furnace-driven silver conductor (patch 0004); roof repair; shed/tower
  doors; map-confirmed castle spiral stairs extended in the existing
  native stair handlers (patch 0005); mapped head grave/brain assembly;
  castle clock.
- `fenk_dungeon.rs2`: star-amulet entry through easternmost memorial
  `0_55_55_56_6` to `0_55_155_56_6`; normal death-triggered cavern-key drop
  from actual wolf-woman NPC `fenk_experiment_1` (1676), gate in
  `m54_155`, chest, three correctly located surface mausoleum graves to
  retrieve body parts. Existing `[oploc1,loc_1757]` in pinned
  `scripts/ladders+stairs/scripts/ladders.rs2` provides the normal cave
  return; **do not add a duplicate trigger**.
- `fenk_roavar.rs2` and patch 0003: quest-only 50-coin preserved brain
  purchase via a small injection into **existing** Roavar NPC script.
  Ordinary tavern dialogue, gossip, and beer remain installed.
- Quest variables `fenk_quest` and `fenk_flags` are moved from the unpacked
  placeholder into their own config with **`scope=perm`** and
  **`transmit=yes`**; quest points and quest list entry are registered by
  patch 0001.

All dialogue added by this bundle is original JoshRS wording. The patch does
not commit game caches, proprietary models, client binaries, passwords or saves.

## Known unfinished or not-playtested behaviour

- **Player playthrough is still unverified**: not yet confirmed that the
  exact client offers every needed click option, pathfinding reaches the
  memorial/gravestones/ladders, the NPC key drop is visible, the 1,000-XP
  and 2-QP completion actually occurs once, or logged-out stage continuity
  works in the live customised world. A successful build/boot is not gameplay.
- Silver casting now uses a **normal item-on-furnace interaction** through
  a guarded addition to the existing native `_smithing_furnace` trigger
  (patch 0004); the original item-on-mould shortcut has been removed.
  This compiles, but an in-game casting and client option test remains open.
- The mapping of head grave, memorial, dungeon keys and the body parts is
  grounded in cache object positions and historical quest flow, not yet
  confirmed by an ordinary player following the entire 2005 quest.
- Gardener's direction variant `fenk_gardener_directions` and remaining
  dynamic NPC animation/cutscene beats need in-game acceptance.
- The original stage numbers 1–7 are reconstructed; the cache explicitly
  distinguishes completion stage 8. Verify reward XP and difficulty against
  2005-era evidence if historically exact reproduction is required.
- No automatic deployment to JParrisDesktop: that engine contains custom
  source unrelated to this PR. Back up saves and perform a targeted merge
  only after a separately authorised installation and ordinary family-world
  regression testing.

**CI verdict** on every commit is recorded in PR
https://github.com/Parris-Tech-Services/JoshRS/pull/136.

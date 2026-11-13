# JoshRS revision-377 interaction fixes

Small RuneScript fixes for objects that exist on the revision-377 map but had no handler. Each one is verified in an **isolated** world before it's merged.

## `shortcut_sinclair_log.rs2`: log balance north of Sinclair Mansion (issue #297)

| | |
|---|---|
| Objects | `loc_9322`, `loc_9323`, `loc_9324` "Log balance", op1 `Walk-across`, ground decor (shape 22) |
| Placement | x 2722, z 3593 / 3594 / 3595, stored on map level 1 over the river |
| River | blocked water/bank tiles z 3592–3596 at x 2721–2723 |
| Landings | south bank **2722,3591,0** and north bank **2722,3597,0** |

**Why it needed an approach trigger.** The logs sit over blocked tiles, so no tile is ever adjacent to them, and an operate trigger (`oploc1`) always answers "I can't reach that!" (verified). The fix uses `aploc1`, the same pattern as the Waterfall crossing rock, with a 5-tile range check. The walk itself copies the existing `loc_2296` log shortcut: log-balance walk animation, `~forcemove`, the `log_balance` sound and 4 Agility XP (40 in tenths-of-XP script units).

**Authentic requirement.** Crossing requires **48 Agility**; players below 48 are refused before movement. The current script is deterministic (no fall/slip simulation), so historical failure rates are not yet implemented. Source checks for the level gate and XP are included, but level-47/48 **in-world playtesting remains required** after this correction.

**Isolated evidence (10 Nov 2026).** This used `tools/rs377-climb-survey/isolated_ladder_test.mjs` with `sinclair_log_cases.json`, on ports 52502/8990/8991 with throwaway accounts:
- South edge 2722,3591 → `loc_9324`: landed 2722,3597 ✔ (prior movement test, before level gate)
- South edge 2722,3591 → `loc_9323`: landed 2722,3597 ✔ (prior movement test, before level gate)
- North edge 2722,3597 → `loc_9322`: landed 2722,3591 ✔ (prior movement test, before level gate)
- North bank 2722,3598 → `loc_9322`: landed 2722,3591 ✔ (prior movement test, before level gate)

Limitation: a bare OPLOC packet sent from 3+ tiles back on the **south** bank (2722,3590) still gets "I can't reach that!" from the server. The Java client walks to the bank edge first (client routefinder on), so normal play starts at 3591. This hasn't been confirmed with the real Java client yet.

## "Nothing interesting happens", batch 1 (13 Nov 2026)

The engine prints *Nothing interesting happens.* whenever an option has no script. A static audit (`tools/rs377-nothing-interesting/audit.py`) of the pinned 377 content found about 1,280 options on map-placed objects, 450 on placed NPCs and 890 inventory options with no handler. Many belong to areas and quests that aren't built yet. This batch fixes only the kinds that can copy behaviour the game already has for identical objects. Nothing here is invented content.

| File | What | Evidence |
|---|---|---|
| `scripts/nih_ladders.rs2` | 268 ladder/trapdoor spots (103 handlers). A spot gets a handler only if a climbable object exists directly above or below it (or 6400 tiles north for dungeons), using the existing `~climb_ladder`/`@ladder_options`. The landing keeps the player's offset, or falls back to `map_findsquare` around the destination ladder. Agility-style climbs (crevices, nets, rocks, trellises) are excluded. | 270/274 passed in the isolated world. The 4 failures plus 2 possible one-way trips are listed in `tools/rs377-nothing-interesting/cases/ladder_exclude.json` and keep the default message. Every shipped ladder has a working return. |
| `scripts/nih_search.rs2` | 12 generic crates/boxes/bookcases/cupboards (54 placements) routed to the standard search messages from `general_use` (including the `~findsomethingnice` chance). Quest-named furniture is excluded. | 54/54 passed in the isolated world. |
| `config/nih_fishing_spots.json` | 13 fishing spots missing the `category=` and `param=whirlpool,…` lines that their working siblings have. Both fields are **server-only** (`NpcConfig.ts` packs them into the server pack), so the client cache is unchanged. | Built server pack shows the categories (verified via `NpcType`). Not fished in-world, because the harness can't target NPCs yet. |

Not done yet: rocks (each needs a `mining_table` row plus its depleted-rock loc), doors/gates, NPC Talk-to (needs researched authentic dialogue), inventory options.

Known gaps: the 9 middle ladders with an up/down choice were only checked to open the dialog, not to finish the climb. The 4 failed spots are unreachable from adjacent tiles by a bare packet and may need approach (`aploc`) triggers.

## Batch 2: rocks, doors and the combat sound bug (13 Nov 2026)

| File | What | Evidence |
|---|---|---|
| `config/nih_rocks.json` | 40 rock types on the map with no mining handler. The ore comes from the rock's ore colour (a `recolNd` value that only one ore uses among working rocks; leave-one-out check: 74/74 correct, 0 wrong). The empty version has the same model and source colours, no ore colour, and the nearest id. Adds `category`, `next_loc_stage_mining` and a `mining_table` row, all server-only. | Prospect gave the right ore everywhere these rocks were reachable. Mining gave the right ore (copper, tin, iron, coal, clay, silver, gold, mithril, adamantite, runite) and the rock depleted to its empty twin ("no ore currently available"). The runite/adamantite depletion check was confirmed only indirectly (the rock was still empty minutes later). Excluded: 18 "Mineral vein" types around x2700–2800/z4400–4500 (unreachable from every side) and `misc_dummy_coalrock1` (it has its own Miscellania script). |
| `config/nih_doors.json` | 17 ordinary closed doors (Keldagrim houses, Rellekka houses, Port Phasmatys harbour, Wilderness, Fenkenstrain, 4 generic) get the standard `door_closed`/`door_opened` categories and their existing open twin. Quest-gated, locked, magic and double doors are excluded. | **142/142** placements: walking through is blocked while closed, and after Open the character walks through. The hinge direction isn't checked visually; `fenk_door_open` already had `reverse_door_opened`, which agrees with using reverse there. |
| `config/nih_combat_sound.json` | Guards `sound_synth(%com_attacksound …)` against null in 7 combat scripts, the same guard upstream uses in `castlewars_maindoor.rs2`. It fixes the `player_melee.rs2:51 sound_synth An input number was null` script error. | Before: 9 errors in a test session. After: 0. |

Install the same way as batch 1: `apply-config-additions.mjs --spec <each json>`. Each spec is idempotent and refuses the live world without `--allow-active`.

### Installing batch 1 (server stopped, after a verified backup, owner-approved)
```
copy expansions\rs377-fixes\scripts\nih_*.rs2  <content>\scripts\rs377_fixes\scripts\
node tools\rs377-nothing-interesting\apply-config-additions.mjs --content <content> --spec expansions\rs377-fixes\config\nih_fishing_spots.json --apply --allow-active
```
The installer refuses the live world (anything under `runtime/jparris-377`, or the content named in `active.json`), even for a dry run, unless `--allow-active` is given. **The live server hot-reloads content edits within seconds**, so never touch live content while anyone is playing.

## Installing
Copy `scripts/*.rs2` into the active content under `scripts/skill_agility/scripts/` **only** while the server is stopped, after a backup. The server rebuilds packs on startup.

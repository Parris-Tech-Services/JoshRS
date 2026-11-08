# Creature of Fenkenstrain: work in progress (updated 8 Nov 2026)

STATUS: PARTIAL, **NOT COMPILED, NOT RUN**. Nothing here has been packed or run against a 377 world.
The engine's own build (`tsx tools/pack/Build.ts`) was blocked in the Claude session by its permission classifier (it will not run
code from an external checkout), so the real compile is still outstanding.

What WAS checked instead: `tools/check_fenk_symbols.py` (own code, reads the pinned content as data only). It confirms every NPC, obj,
varp/varbit, constant, proc, label, queue, questlist component, anim and sound used by the scripts exists in the pinned content, and that
brackets balance. Result: 199 symbols, 0 unknown. A negative test (planted bad names and an unclosed brace) was caught, so the pass is meaningful.
This does NOT check types, argument counts, trigger/script semantics or varp duplication, so it is not a substitute for the real compile.
Run it: `FENK_CONTENT=<pinned content checkout> python3 -I tools/check_fenk_symbols.py`.

Pinned: `LostCityRS/Content@44eab090`, `Engine-TS@b5ac859b` (per `deploy/jparris-windows/upstreams.json`).
This quest has no scripts upstream, but the cache already defines everything it needs: varp `fenk_quest` and
`fenk_flags` (17 varbits), 13 `fenk_*` NPCs, 21 `fenk_*` objs, ~90 `fenk_*` locs, `questlist:creatureoffenkenstrain`,
and map spawns (Canifis signpost 0_54_54_37_29, castle m55_55, dungeon m54_155/m55_155).

## Files in this patch (copy into the private content checkout at the same relative paths)
- `tools/check_fenk_symbols.py`: the static checker above (not game content; do not copy into the content tree).
- `scripts/quests/quest_fenkenstrain/configs/quest_fenkenstrain.constant`: stage, reward and requirement constants.
- `.../configs/quest_fenkenstrain.varp`: `fenk_quest` and `fenk_flags` with `scope=perm` AND `transmit=yes`.
- `.../scripts/fenk_journal.rs2`: journal text for every stage.
- `.../scripts/fenk_npcs.rs2`: Dr Fenkenstrain (hire, hand over parts, sewing, conductor, tower key, after), creature /
  Lord Rologarth, Gardener Ghost, pickpocket finale, quest-complete queue, requirements proc.
- `patches/0001-register-fenkenstrain-in-quests-rs2.patch`: QP count + quest list colour. `git apply --check` passes on the pin.
- `patches/0002-move-fenk-varps-out-of-unpack.patch`: removes the two varp blocks from `_unpack/377/all.varp`. `git apply --check` passes on the pin.
  Needed because claimed varps (e.g. `prieststart`) live in their quest folder and are absent from `all.varp`; leaving both would likely
  duplicate the definitions. Not yet proven by a pack run.

## Corrections to the earlier plan (found by reading the pinned source)
- The first `.varp` draft lacked `transmit=yes`. The cache marks both varps `transmit=yes` and the NPC morphs resolve client-side, so it was required.
- Bind handlers to the PARENT types only. Triggers resolve on the spawned `npc.type` (engine `Player.getOpTrigger`), and `m55_55.jm2` spawns
  1668 `fenk_fenkenstrain`, 1669 `fenk_fenkenstrain_in_tower`, 1671 `fenk_creature`, 1672 `fenk_creature_released`, 1667 `fenk_gardener_multi_2`.
  Binding the `*_model` children is unnecessary. The cache confirms stage 8 = complete (doctor moves to the tower, creature becomes Lord Rologarth).
- Pickpocket (`op3`) is defined on the doctor's model child, so it works at any stage 0-7. The script only allows it from stage 5 on.

## Still to write
1. `fenk_castle.rs2`: signpost read (sets `%fenk_read_signpost`), bookcases (upstairs west 1_55_55_22_38 = marble amulet, east 1_55_55_35_38 =
   obsidian amulet), marble + obsidian = star amulet, cupboard (26,43), shed door and tower door (keys; sets `fenk_unlocked_shed/tower`), cane pile,
   brush chain `fenk_brush0..3` (cane + `bronzecraftwire`), west upstairs fireplace 1_55_55_24_35 gives `fenk_lightning_mould`, silver bar + mould
   gives `fenk_conductor`, `fenk_conductor_broken` at 2_55_55_28_16 (set `%fenk_conductor_repaired` and `%fenk_quest = ^fenk_conductor_fixed`), clock 1_55_55_20_25.
   Until this exists the quest cannot be started in game (no signpost handler) or advanced past stage 2.
2. Head: `fenk_grave_poor` locs in m56_54. Candidate head grave 0_56_54_24_35 (UNVERIFIED). `oploc2` Dig gives `fenk_head_empty`; `fenk_brain` on it gives `fenk_head_full`.
3. Gardener: what toggles `fenk_gardener_directions` and what directions he gives is unknown (TODO in `fenk_npcs.rs2`).

## Not implemented (needs on-machine work)
- Experiment dungeon: kill an `fenk_experiment_*` for its key, gate `fenk_mausoleum_door` (0_54_155_54_37), chest `fenk_chest_open`, and the arms/legs/torso digs.
  Surface candidates: `fenk_grave` at 0_54_55_(46,56), (48,57), (50,56) and `fenk_coffin` at (49,51). The mapping from graves to body parts is unconfirmed.
- Authentic silver casting at a furnace (planned shortcut: silver bar used on the mould).
- Pickled brain from Roavar (`werewolfinnkeeper`, existing handler in `area_canafis`); needs an extra menu option.

## Next safe checks (in order)
1. Apply both patches and copy the quest folder into a DISPOSABLE content checkout (never the live one with saves), then run the pinned pack/compile step.
2. Fix any compile errors, then start a disposable server and walk the quest with a test account.
3. Only then mark anything playable. Per AGENTS.md: no claim of runtime-ready from source alone.

## Unverified facts
Stage numbers 1-7 are a reconstruction (cache only fixes 0-7 vs 8). Requirements (Restless Ghost, Priest in Peril, 20 Crafting, 25 Thieving), thread count of 5,
the Thieving XP reward (1,000 XP) and the pickpocket success odds (`stat_random(thieving, 80, 220)`) come from memory, the modern wiki or are guesses, and must be
checked against 377-era sources. Dialogue is original wording; nothing is copied from game transcripts.

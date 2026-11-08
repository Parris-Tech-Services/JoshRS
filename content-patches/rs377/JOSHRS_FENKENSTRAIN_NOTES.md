# Creature of Fenkenstrain: work in progress (8 Nov 2026)

STATUS: PARTIAL, UNCOMPILED, UNTESTED. Nothing here has been compiled or run against the 377 world.

Pinned content: `LostCityRS/Content@44eab090`. This quest has no scripts upstream, but the cache already defines everything it needs:
varp `fenk_quest` and `fenk_flags` (17 varbits), 13 `fenk_*` NPCs, 21 `fenk_*` objs, ~90 `fenk_*` locs, the questlist entry
`questlist:creatureoffenkenstrain`, and map spawns (Canifis signpost 0_54_54_37_29, castle m55_55, dungeon m54_155/m55_155).

## Written so far (copy into the private content checkout, same relative paths)
- `scripts/quests/quest_fenkenstrain/configs/quest_fenkenstrain.constant`: stage and reward constants.
- `.../configs/quest_fenkenstrain.varp`: `scope=perm` for `fenk_quest` and `fenk_flags`.
- `.../scripts/fenk_journal.rs2`: journal text for every stage.

## Still to write
1. `fenk_npcs.rs2`: Dr Fenkenstrain (interview, hand-over of parts, sewing, tower key, post-quest), Gardener Ghost (needs worn ghostspeak amulet), the creature and Lord Rologarth. Bind both the parent (`fenk_fenkenstrain`, `fenk_creature`, `fenk_gardener_multi*`) and visible child (`fenk_fenkenstrain_model`, `fenk_creature_model`, `fenk_creature_model_2`, `fenk_gardener`) types.
2. `fenk_castle.rs2`: signpost read, bookcases (upstairs west 1_55_55_22_38 = marble amulet, east 1_55_55_35_38 = obsidian amulet), marble + obsidian = star amulet, cupboard (26,43), shed door and tower door (keys), cane pile, brush chain `fenk_brush0..3` (cane + `bronzecraftwire`), west upstairs fireplace 1_55_55_24_35 gives `fenk_lightning_mould`, silver bar + mould gives `fenk_conductor`, `fenk_conductor_broken` at 2_55_55_28_16 (set `%fenk_conductor_repaired`, stage 3), clock 1_55_55_20_25.
3. Head: `fenk_grave_poor` locs in m56_54. Candidate head grave is 0_56_54_24_35 (UNVERIFIED; wiki says slightly south-east of fairy ring ALQ). `oploc2` Dig gives `fenk_head_empty`; `fenk_brain` on it gives `fenk_head_full`.
4. Pickpocket (`opnpc3` on `fenk_fenkenstrain_model`) at stage 5 completes the quest: stage 8, `ring_of_charos`, 2 QP, Thieving XP (UNVERIFIED).
5. Patch `scripts/general/scripts/quests.rs2`: add Fenkenstrain to `count_questpoints` and `update_questlist` (`~send_quest_progress_colour(questlist:creatureoffenkenstrain, %fenk_quest, ^fenk_complete)`).

## Not implemented (needs on-machine work)
- Experiment dungeon: kill an `fenk_experiment_*` for its key, gate `fenk_mausoleum_door` (0_54_155_54_37), chest `fenk_chest_open`, and the arms/legs/torso digs. Surface candidates: `fenk_grave` at 0_54_55_(46,56), (48,57), (50,56) and `fenk_coffin` at (49,51). The mapping from graves to body parts is unconfirmed.
- Authentic silver casting at a furnace (planned shortcut: silver bar used on the mould).
- Pickled brain from Roavar (`werewolfinnkeeper`, existing handler in `area_canafis`); needs an extra menu option.

## Unverified facts
Stage numbers 1-7 are a reconstruction (cache only fixes 0-7 vs 8). Requirements (Restless Ghost, Priest in Peril, 20 Crafting, 25 Thieving), thread count of 5, and the Thieving XP reward come from memory or the modern wiki and must be checked against 377-era sources.
Dialogue will be written in original wording; nothing is copied from game transcripts.

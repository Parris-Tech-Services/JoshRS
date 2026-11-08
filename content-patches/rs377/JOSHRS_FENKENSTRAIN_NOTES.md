# Creature of Fenkenstrain — revision 377 handoff (8 Nov 2026)

**Status: source compiled and disposable server boots; full quest playthrough NOT yet verified.** This is the continuation of Claude's original `quests/377-fenkenstrain-wip-20261108` branch, now maintained through [PR #135](https://github.com/Parris-Tech-Services/JoshRS/pull/135).

The original scripts in Claude's handoff were not compilable-verified. We have run the **actual** pinned `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb` RuneScript compiler and `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50` packer in an isolated GitHub Actions environment. The expanded NPC, castle and conductor scripts passed compilation and the separate server boot probe. Revalidate using **.github/workflows/377-fenkenstrain-compile.yml** for any subsequent changes; do not claim green until the newest commit passes.

No files have been deployed to JParrisDesktop's live engine, no passwords/SQLite/saves uploaded, and no player account has completed the quest in-game as part of this proof.

## Quest content and assets

- `scripts/quests/quest_fenkenstrain/configs`: permanent, client-transmitted quest varps `fenk_quest`, `fenk_flags`; stages, requirements and quest point/XP constants.
- `scripts/quests/quest_fenkenstrain/scripts/fenk_npcs.rs2`: normal doctor dialogue and hand-ins, sewing, tower key and monster, pickpocket/final reward, Gardener Ghost and shed key. Pickpocket finale is stage-bounded to prevent granting repeated Ring of Charos/XP.
- `.../scripts/fenk_journal.rs2`: journal for every stage. Requires having **started** The Restless Ghost, not finished it, plus Priest in Peril and the skill requirements.
- `.../scripts/fenk_castle.rs2`: signpost, west/east upstairs bookcases, star amulet, shed cupboard and canes, real three-cane/two-piece item combinations, west fireplace, conductor mould, real furnace silver casting and rooftop repair, tower and shed locks, Ed Lestwit's head grave candidate and brain combination.
- `.../scripts/fenk_dungeon.rs2`: star amulet unlocks the eastmost memorial, normal entrance at 0_55_55_58_7 and genuine cave ladder (0_55_155_58_7). Wolf-woman Experiment 1676 drops the cavern key **only after actual NPC death** via the pinned `ai_queue3` handler, gate 0_54_155_54_37, spare key chest, mausoleum's original ladder at 0_54_155_48_50 and three graves (west to east: torso, arms, legs).
- `patches/0001-register-fenkenstrain-in-quests-rs2.patch`: quest-point total and quest journal registration.
- `patches/0002-move-fenk-varps-out-of-unpack.patch`: avoids duplicate varp ownership.
- `patches/0003-fenk-conductor-furnace.patch`: a narrowly gated replacement for silver-bar interaction when this player has the mould and is at the correct stage; normal silver jewellery works otherwise.
- `patches/0004-fenk-brain-roavar.patch`: opt-in 50-coin pickled brain purchase through existing Roavar dialogue, preserving tavern choices.

**Never install the candidate directly onto an active custom USB game.** The runtime content is not a Git worktree, may include unrelated Antigravity changes and needs a separate backup-aware merge.

## Safety and regression checks

- `tools/check_fenk_symbols.py` validates symbols and balanced blocks but is not a compiler; expanded source counts 387+ names.
- `tools/audit_fenk_triggers.py` rejects duplicate quest-specific NPC, object, item and UI triggers. It caught the first attempted extra `[oploc1,loc_1757]`, which conflicts with the **existing original ladder handler** in `scripts/ladders+stairs/scripts/ladders.rs2`. That new handler was removed: the original 377 ladder already routes region 155 underground to region 55 surface by subtracting 6,400 from world Z. No global ladder handler should be replaced.
- `tools/verify_fenk_map.py` confirms the exact quest objects exist at pinned .jm2 map coordinates, checks that genuine combat/drop and gate conditions exist, and checks that generic ladder behaviour is intact. This cannot prove that a click reaches or animates a location.
- CI patches the **disposable** pinned Content checkout, compiles RuneScript and validates nonempty script pack. It starts an isolated 377 server, independent of any existing Windows family account.

## Outstanding before honestly calling it fully playable

1. A normal player must start from the Canifis signpost, pass prerequisites, progress through the doctor, recover the head and pickled brain, combine the two amulets, enter and exit both dungeon entrances, defeat a wolf-woman Experiment, pick up the legitimate key, open the gate, obtain all three body parts, deliver them and finish the needle/thread stage.
2. Continue with the shed, mould, silver furnace, conductor, tower monster and real pickpocket; check that the quest journal, XP, ring, quest points, and all permanent states survive a genuine logout and login.
3. Confirm the **Ed Lestwit grave** at `0_56_54_24_35` with live map/name dialogue. Its location is plausible (near fairy ring ALQ) and exists in the map but has not yet been distinguished by an authoritative contemporary inscription.
4. Confirm the chosen dungeon arrival cells, monster's actual drop visibility, the giant castle door/mausoleum gate collision and that every intended client `oploc`/item-use option is available in revision 377. The native compiler does not perform such user-facing checks.
5. The historical accuracy of the 2005 dialogue, stage labels and item/reward odds is incomplete. Dialogue was newly written, not reproduced from copyrighted RuneScape transcripts. Do not advertise exact original wording.
6. Once the above are verified in a **throwaway native character** and the live engine's separately backed-up customisations are reconciled, use a safe opt-in installer, gracefully stop the game, and retest the family world. This branch intentionally does **not** silently restart or overwrite the Windows game.

**Additional quest work**: Claude's separate seven bundles (Rag and Bone Man, A Soul's Bane, Swan Song, In Search of the Myreque, Icthlarin's Little Helper, Mountain Daughter, The Lost Tribe) remain on `quests/377-claude-20261108`. This Fenkenstrain work neither installs nor declares them playable.

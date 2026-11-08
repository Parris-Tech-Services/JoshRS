# A Soul's Bane (3 April 2006) - JoshRS original-dialogue bundle

Uncompiled source. Dialogue, stage values and rewards are **original JoshRS content** (the owner authorised inventing them
from the cache's context clues). Copy `configs/` + `scripts/` to `<content>/scripts/quests/quest_soulbane/`.

From the pinned 377 cache: NPCs `soulbane_*` (launa, tolna, brana, anger/fear/confusion/hope/final monsters), varp `soulbane`
with varbits (`soulbane_prog`, kill tallies, shade flags), the four anger weapons and `soulbane_zaros_spear`.

## Collision warning
Antigravity's private pass added `[opnpc1,soulbane_launa]` and `[opnpc1,soulbane_tolna_multi]` in `varrock_npcs_377.rs2`.
Delete those two triggers (this bundle defines them) or `audit_npc_trigger_collisions.py` will fail.

## Needs wiring / not done
- Add `^soulbane_complete` / QP to `quests.rs2` (`count_questpoints`, `update_questlist`).
- Dungeon traversal (ravine, fire wall, doors, rope), the anger-weapon rack and instancing are **not implemented**;
  the bundle assumes the cache's monsters are spawned and reachable. Verify map spawns in a disposable world.
- Reset of tallies on abandon/relog is not handled.

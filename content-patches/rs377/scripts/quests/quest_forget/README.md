# quest_forget - Forgettable Tale of a Drunken Dwarf (377)

JoshRS-original condensed reconstruction (released 2005-07-04, Members, 2 QP).

- Varp: `forget_main_var` (cache varp, made permanent by the batch-4 patch).
- Start NPC: `dwarf_city_black_guard1` (Keldagrim Black Guard stand-in; Veldaban has no cache NPC).
- Chain: Black Guard officer suspects the Red Axe beer -> drunken dwarf trades a keg (`forget_cutscene_beer`) -> Red Axe director (`forget_redaxe_director_cutscene`) takes the beer and drops `forget_gardener_letter` -> return the letter to the officer -> complete.
- NOT IMPLEMENTED: tunnel digging, the full Keldagrim forgetfulness matrix, mushroom farming.
- Verified against npc.pack/obj.pack names; no opnpc1 collisions for the NPCs used.

# Swan Song (2 May 2006) — 377-native, original-dialogue port

**Status: native compilation and disposable server boot PASS; real Java-client playthrough NOT VERIFIED.** The source project does not include the personalised Windows/Fedora world or player save. Do not install the overlay into a running family world.

## Added in this batch

- Herman now requires at least 100 quest points to begin the quest and sends the player to the pinned `swan_wom_draynor` NPC. The Wise Old Man takes 10 lava, 10 mist and 5 blood runes and advances the original 377 quest state.
- Franklin introduces the five wall repairs; the pinned metal press uses logs (firebox 14958), a tinderbox (firebox 14959), and iron bars (press 14956) to make genuine `iron_sheet` items, checking 42 Firemaking and 45 Smithing.
- Using an iron sheet on the pinned damaged-wall locs (14945–14947) consumes it if a hammer and 40 Crafting are present, setting five persistent `swansong_wall_1..5` varbits; Arnold's five cooked fish set the persistent `swansong_arnold` flag. The main stage advances only after both tasks are done.
- Corrected the fresh monkfish fishing action to the client's **Net / NPC option 3** while Harpoon / option 1 displays guidance. The existing generic cooking table handles the cooked monkfish.
- Scripted death events for the three fishing-troll NPC variants record real kills up to the 377 two-bit limit; ambush and final queen death rewards remain stage-gated.
- Added a scoped Wizard Frumscone interaction using his *existing* NPC and seven bones, an empty pot and a pot lid to create the existing `swan_army` bone-seed item at level 66 Magic. Using the item advances to a new 65 / army-deployed stage.
- Corrected 377 quest-point counting to read **`%swansong`** rather than equality against the full packed `%swansong_quest` varp, which also contains wall and other progress flags.
- Quest completion gives 50,000 Fishing XP, 15,000 Magic XP, 10,000 Prayer XP and 25,000 coins once, with inventory-space and stage guards.

## Material differences from a complete, real-player 2006 quest

**Not completed:** The Wise Old Man's original combat prologue and eight-troll initial battle, reliable spawn/instancing and NPC combat target attribution, per-wall location identity and persistent world visual patching, the skeletons visibly fighting the final sea-troll wave, accurate Sea Troll Queen encounter placement/pathfinding, and actual travel/bank/shop access. The interim bone-seed activation changes the stage but does not spawn the skeleton army or prove any fight occurred. You can currently interact with the same damaged wall repeatedly to increment all five flags; client/map coordinate verification is required to fix that exploit before release.

Further historic prerequisites (One Small Favour, Garden of Tranquillity), post-quest monkfish use and world access, asset rights, and gameplay fidelity remain unverified. Do not advertise this as a faithful complete quest or a working adventure with Sylvie until observed in the personalised Java client.

## Acceptance checklist

1. Back up family saves; create a **separate disposable world** with no private accounts or data.
2. Verify genuine NPC spawns and dialogue from Herman, Draynor Wise Old Man, Franklin, Arnold and Frumscone at quest stages 0/10/20/30/40/50/60/65/70/100.
3. Verify rune removal exactly once; net fishing at NPC option 3; cooking at real range; press consumes one bar per sheet; wall repair cannot be repeated on the same tile; five unique sections visibly change and persist across relog.
4. Verify the initial troll fights, fishing troll encounters, defensive skeletons and queen combat are spawned/attributed, involve *real* combat rather than scripted stage changes, survive disconnect/relog, and cannot pay XP/coins twice.
5. Verify full client quest journal, QP, bank/service access, map area, item conservation and safe restart/relog, then both family accounts in the shared world. Do not mark any of these passed from a compiler or socket check.

Run GitHub's disposable `batch-quests-disposable-377.yml` build to validate source. It does not substitute for the gameplay checklist.

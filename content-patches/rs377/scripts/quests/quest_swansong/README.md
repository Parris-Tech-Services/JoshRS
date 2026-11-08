# Swan Song (2 May 2006) — revision-377 original-dialogue bundle

**Status: SOURCE-IMPLEMENTED, NOT PLAYER-VERIFIED.** The overlay is compiled and boot-smoke tested by the disposable revision-377 CI workflow when it passes. That does **not** prove an in-game quest completion or preserved family-world save.

Uses cache names `swan_*`, `swansong_quest`, `swan_raw_monkfish` and `swan_monkfish`. All new dialogue and stage values are JoshRS originals, not verbatim official quest script.

## Implemented

- Herman starts the quest; Franklin and Arnold advance the quest stages.
- Arnold gives a small fishing net once when entering the fish collection stage, with an inventory-space check.
- `[opnpc1,swan_fishingspot]` catches **quest-specific fresh monkfish** while the food stage is active; it requires level 62 Fishing, a net, an inventory slot and an action cooldown.
- `configs/swan_fresh_monkfish.dbrow` plugs the fresh fish into the **existing** generic range/fire cooking system, requiring 62 Cooking and awarding quest-scale XP; no conflicting global cooking override.
- Arnold consumes five cooked quest fish before opening the scripted combat stages.
- Ambush and Sea Troll Queen death queues move the quest forward only from the expected stage. Final reward queue checks the return stage to prevent duplicate completion rewards.
- Three colonists, two boatwomen, the drunk dwarf and ambush Wise Old Man have original dialogue.

## Unfinished — do not mark the historical quest complete

- Official 100-QP entry condition, skill/item requirements beyond Fishing and Cooking, Franklin's fortification repairs, the Draynor Wise Old Man visit, and skeleton battle.
- Correct sequence and number of sea troll attacks, queen encounter placement and NPC spawning, precise minimap/path/boat/area validation.
- Ordinary **post-quest** monkfish harvesting and world access (deliberately not enabled by the quest-only fishing hook).
- In-game client interaction, catching, cooking, inventory persistence, relog, NPC visibility and full completion on an isolated 377 client remain unverified.
- The `burntfish4` output is a compatible existing burnt-fish item until the exact cache's quest-specific burnt monkfish name is confirmed.

## Safety and test route

Run the pinned disposable build workflow `.github/workflows/batch-quests-disposable-377.yml`. It performs the native RuneScript compiler/build and server boot against the pinned 377 content. It must not modify the family world. For player verification use an isolated world, confirm correct small-net catching, cooking at a real range, no duplicate XP/items on repeat clicks and persistent 0/10/20/40/50/60/70/100 stages over logouts. Only install into the family's world after backups and consent.

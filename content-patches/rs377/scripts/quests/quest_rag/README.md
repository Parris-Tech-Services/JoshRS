# Rag and Bone Man (10 April 2006) — pinned rev-377 native RuneScript

**State: source-implemented, compiler and disposable-server smoke when CI passes; no real-client complete playthrough or family save validation.**

## Source present
- First eight required species (goblin, bear, ram, unicorn, giant rat, giant bat, monkey, big frog) remain distinct from the additional 27-bone postquest wish-list. All 35 raw/in-vinegar/polished cache items map to two permanent delivered-bitmask varps.
- New `rag_npc_drops.rs2` maps the 35 special bones to **51 actual NPC names already defined in pinned rev-377 source**. Scoped patch `0024` adds one extra drop check from the existing native `npc_death` procedure **after actual NPC kill/hero attribution**. It does not register competing death queues or replace ordinary loot; 35/35 mappings and NPC existence are checked via `check_rag_npc_drops.py`.
- Each first-quest bone drops guaranteed from an eligible NPC while the initial quest is open, except types already handed in; postquest uncollected extra bones have a 1-in-4 tertiary chance, based on the OSRS reference. Stage restrictions mean the 27 extra bones cannot complete the first eight-bone quest.
- Odd Old Man consumes eight required polished bones before awarding one quest point plus 500 Cooking and 500 Prayer XP **once**. After all 27 extras he records the historical-era additional quest point, 5,000 Prayer XP and a choice of one bonesack or ram skull helm. Reward exchange consumes the currently carried reward before giving the alternative.
- Fortunato's existing vinegar shop unlocks after quest introduction; the pot-boiler states and merchant/reward flags live in permanent varps. Delayed boiling now has a `rag_potboiler_onfire` tinderbox recovery handler for reconnects (it does not spawn items). Need actual player relog test.
- All extra source names and dialogue in this overlay are newly authored; no external copyrighted assets were imported.

## Still incomplete / unverified
- All 35 **actual monster spawn locations, successful attacks/deaths, raw special bone drops, collection, boiling, deliveries and reward reclaims have not been exercised in a real 377 Java client**. The source maps species names and hooks loot, not a guarantee that all 35 NPCs are reachable on existing maps; some quest-locked monsters may need new access or appropriate variants.
- The pot-boiler recovery after process restart, cooking/polishing state consistency, saved bitmasks, simulated packet loss/duplicate click prevention, inventory/bank/equipment reward swap and world state visuals need authentic tests.
- Monster death ownership and item visibility to the correct killer need real-world verification; the original game's rare-drop and XP details may differ. The code uses a best-evidence 1-in-4 extra chance.
- 377 maps, quest entries, spawn/merchant interactions, account privacy, adult/child multiplayer and backup/rollback are **not verified** by native compilation.

## Tests
Native patches `0001–0024` compile the pinned content and boot a fresh isolated server through `.github/workflows/batch-quests-disposable-377.yml`. Source regressions include `test_ragbone_eight_and_vinegar_contract.py`, `test_rag_extra_wishlist_contract.py`, `test_rag_npc_drops_contract.py`, `test_rag_recovery_and_postquest_monkfish.py`. Passing source CI does not establish completion by an authenticated player.

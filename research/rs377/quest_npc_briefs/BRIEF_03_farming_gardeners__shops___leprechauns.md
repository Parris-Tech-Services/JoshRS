# Brief 3: Farming Gardeners, Shops & Leprechauns

**Anchor:** Farming (shops/gardeners)  
**Anchor date:** 2005 farming era; confirm (wiki-confirmed: no, confirm before starting)  
**NPCs missing a Talk-to trigger:** 11

## Contract for agy

1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.
2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.
3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).
4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.
5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.

## NPCs (sorted by region then id)

| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |
|---:|---|---|---|---|---|
| 2344 | `farming_gardener_fruit_2` | Gileth | farming_gardener_advice_and_crop_protection | (0, 2488, 3179, m38_49) | [wiki](https://oldschool.runescape.wiki/w/Gileth) |
| 2343 | `farming_gardener_fruit_1` | Bolongo | farming_gardener_advice_and_crop_protection | (0, 2474, 3446, m38_53) | [wiki](https://oldschool.runescape.wiki/w/Bolongo) |
| 2332 | `farming_gardener_hops_1` | Selena | farming_gardener_advice_and_crop_protection | (0, 2578, 3101, m40_48) | [wiki](https://oldschool.runescape.wiki/w/Selena) |
| 2338 | `farming_gardener_bush_4` | Torrell | farming_gardener_advice_and_crop_protection | (0, 2617, 3227, m40_50) | [wiki](https://oldschool.runescape.wiki/w/Torrell) |
| 2337 | `farming_gardener_bush_3` | Rhazien | farming_gardener_advice_and_crop_protection | (0, 2591, 3865, m40_60) | [wiki](https://oldschool.runescape.wiki/w/Rhazien) |
| 2306 | `farming_shopkeeper_3` | Richard | shopkeeper_greeting_and_openshop | (0, 2646, 3364, m41_52) | [wiki](https://oldschool.runescape.wiki/w/Richard) |
| 2334 | `farming_gardener_hops_4` | Rhonen | farming_gardener_advice_and_crop_protection | (0, 2666, 3530, m41_55) | [wiki](https://oldschool.runescape.wiki/w/Rhonen) |
| 2330 | `farming_gardener_fruit_3` | Garth | farming_gardener_advice_and_crop_protection | (0, 2766, 3212, m43_50) | [wiki](https://oldschool.runescape.wiki/w/Garth) |
| 2331 | `farming_gardener_fruit_4` | Ellena | farming_gardener_advice_and_crop_protection | (0, 2861, 3432, m44_53) | [wiki](https://oldschool.runescape.wiki/w/Ellena) |
| 2305 | `farming_shopkeeper_2` | Vanessa | shopkeeper_greeting_and_openshop | (0, 2820, 3463, m44_54) | [wiki](https://oldschool.runescape.wiki/w/Vanessa) |
| 2307 | `farming_shopkeeper_4` | Alice | shopkeeper_greeting_and_openshop | (0, 3627, 3526, m56_55) | [wiki](https://oldschool.runescape.wiki/w/Alice) |

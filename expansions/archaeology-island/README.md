# Tideglass Isle — original content starter pack
**Status: source components ready; NOT installed or verified inside RuneScape revision 377.**

This deliberately original mini-island includes a 16×16 conceptual terrain-grid manifest, 4 NPC roles and original dialogue, 3 specimen collectibles, a one-time reward quest, a low-poly OBJ reference mesh (stone, crate, bollard), SVG texture palette and deterministic Node.js tests.

## Run tests
`node --test expansions/archaeology-island/tests/gameplay.test.mjs` (Node 20+).

## Integration order for Agy
1. Inspect the **active** Windows `runtime/jparris-377/active.json`, source map encoding and map loc/npc definitions; check existing coordinates and cache support. Back up running world safely, and isolate all modifications in a disposable test copy.
2. Confirm the region square allocation and connectivity. The manifest is a **schematic**, not a client-readable cache or a complete 64×64 map square. Convert to actual 377-compatible terrain and collision using the checked engine/content tools; do not inject it blindly.
3. Convert/replace original `.obj` reference props into whatever compatible proprietary-era packed model format the actual Java client supports. SVG palette is **source art**, not final game textures. Do not add unlicensed Jagex model/cache assets.
4. Define new NPC/object IDs safely in available namespaces and use real `category`/trigger definitions, not hardcoded guesses. Implement `gameplay.mjs` state-machine behavior with RuneScript or equivalent *actual* server scripts and persistent per-player state.
5. Configure ferry origin/return coordinates only after verifying walkable destinations. Disabled-by-default feature flag for the region; all transport must have a guaranteed exit.
6. Test in actual 377 client: loaded tiles and models, all four NPCs, inventory/item drops and duplicate prevention, quest persist after restart, both players entering/leaving, no collision or crashes.
7. Only then call it VERIFIED PLAYABLE. If full 377-compatible packaging isn't possible, report exact blockers instead of calling this an implementation.

## Current limitations
These are real original source assets and tested standalone logic, **not** plug-and-play 377 cache, mesh conversions, persistent server scripts or live in-game tests. This avoids silently overwriting Agy's concurrent engine changes.
Sources: https://lostcity.rs/t/tutorial-how-to-add-new-object-to-your-map-225-based/7718 ; https://wiki.lostcity.rs/Configs/NPC

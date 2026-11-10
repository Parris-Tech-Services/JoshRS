# Layer 2 — revision-274 dev diagnostics

Read-only, text-first diagnostics for ~/dev274/content. Works in Termux without starting the game or a browser. Independent of Claude's Layer 1 except for the optional runtime adapter.

## Static checks (no game world boot)

From your JoshRS repository:

    node tools/questops/dev-debug/inspect.mjs map --content ~/dev274/content --x 3491 --z 3090 --level 0
    node tools/questops/dev-debug/inspect.mjs near --content ~/dev274/content --x 3210 --z 3219 --level 1 --radius 5 --expect lost_tribe_sigmund
    node tools/questops/dev-debug/inspect.mjs var --content ~/dev274/content --name losttribe
    node tools/questops/dev-debug/inspect.mjs stage --content ~/dev274/content --quest quest_losttribe --json

Map: finds the 64x64 region, counts terrain/NPC/LOC/OBJ records, and checks for a terrain tile at the exact world coordinates and plane. Missing Uzer is MISSING_MAP; absent tile is NO_TERRAIN_AT_TILE.

Near: lists fixed NPC spawns with IDs, names, locations and distances, including across region boundaries. --expect NAME fails with a non-zero exit code if absent. This is static map data, NOT proof the entity loaded into World.

Var: checks active rev-274 variable pack ID, definition and scope=perm, explicitly excluding earlier unpack revisions. No player value is available without the runtime adapter.

Stage: infers a candidate quest-stage variable from script comparisons and journals, displaying ambiguity rather than guessing. No current stage is claimed without runtime evidence.

--json outputs machine-readable objects with status and staticOnly flags. Exit codes: 0 good, 1 missing/invalid, 2 unsafe input or diagnostic failure.

## Runtime diagnostics: integration with Layer 1

After Claude's Layer 1 harness exists, run from isolated dev engine (never live):

    cd ~/dev274/engine
    npx tsx ~/JoshRS/tools/questops/dev-debug/runtime.ts near --x 3210 --z 3219 --level 1 --radius 5 --expect lost_tribe_sigmund --json
    npx tsx ~/JoshRS/tools/questops/dev-debug/runtime.ts map --x 3491 --z 3090 --level 0 --json
    npx tsx ~/JoshRS/tools/questops/dev-debug/runtime.ts var --name losttribe --json
    npx tsx ~/JoshRS/tools/questops/dev-debug/runtime.ts stage --quest quest_losttribe --json
    npx tsx ~/JoshRS/tools/questops/dev-debug/runtime.ts stage --quest quest_losttribe --varp losttribe --json

This imports Claude's playtest/harness.ts, boots a disposable in-memory player, and queries real World NPC entities and getVar/isPerm. It refuses paths under lc274 and insists on dev274/engine. It does not connect to a running server or read live accounts. The stage of a fresh test player normally starts at zero; to check progression, call Layer 2 diagnostics from a Layer 1 scenario after quest actions.

Do not run this while another dev274 process holds its engine ports. The runtime adapter needs a packed dev274 engine and an actual acceptance run on the phone, which GitHub CI cannot simulate.

## Verification and boundaries

npm test checks the static parser, map/var/quest detection, cross-region NPCs and missing-map errors on synthetic fixtures. No browser rendering or model verification; that is Layer 3. No 274 quest is marked verified playable by these checks. Never touch live ~/lc274, Elrothiro saves, or publish copied game assets.

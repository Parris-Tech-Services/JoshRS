# Native JoshRS 377 original-content integration

## Actual implementation and rollback of duplicate suppliers

**Correction (31 October 2026):** The earlier eight-NPC pack included seven speculative merchants, including rune, amulet mould and tool sellers. Those were never established as missing features. They are **retired**. The current native overlay contains only the optional original Woodland Guide dialogue and temporary admin spawn. It does not duplicate base-game inventory trades, crafting or shops.

The pinned 377 object registry already includes law runes, nature runes, amulet moulds and chisels, and the jewellery scripts already include amulet-crafting handlers. The actual owner's world may have other existing custom content we cannot inspect via GitHub.

The `Verify native 377 content pack` workflow now checks the **pinned source for existing functionality** before compiling, runs Python safety tests, uses a clean temporary checkout, builds with narrow checksum exceptions and boots a disposable server for TCP/web listener testing. This is not a player login or in-game playtest. No player saves or game caches are committed.

Previous JoshRS addon versions can be retired by the installer only when the old generated source has one of the approved exact hashes. The seven known `joshrs_` merchant registry lines may then be backed up and removed; all unrelated NPC IDs, player saves and custom script edits are left untouched. Unsupported customisations cause a fail-closed error.

## One-click installer (Windows)

Once the game is configured, **log out and stop the local server** first. Download/extract updated JoshRS and double-click `JoshRS-Install-377-Content.cmd`. It uses the active private Windows copy found in `runtime/jparris-377/active.json`, never an original Fedora USB. The installer:

1. Checks the world is not listening on its game/web ports.
2. Verifies the generated manifest and SHA-256 for each source file; only upgrades the exact previously approved JoshRS v1 script/config hashes, refusing unrelated custom edits.
3. Assigns unused IDs only for new original NPCs and preserves every existing NPC ID.
4. Makes local backups of existing engine packs, the content pack, custom scripts, the packer source and `.env`.
5. Selectively permits the **new NPC definitions'** historical checksum mismatch while preserving other pack verification. It also respects the earlier narrow custom-loc exception when present.
6. Rebuilds using the copied local engine and reports success only when the packer exits successfully and compiled scripts exist.
7. If something fails, attempts to restore source and compiled-pack files from that backup. It does not alter the player-save database or the original USB.

The helper `deploy/jparris-windows/install-native377.ps1` without `-Apply` is a read-only preflight, suitable for inspecting the intended change. The double-click CMD deliberately uses `-Apply`. Engine/source rollback and syntax are tested where possible in CI; **the actual Windows runtime installer has not been playtested on JParris Desktop**.

## Test in game

After successful Windows installation, start your usual JoshRS 377 client, log in to the local world and use its configured administrative debug-command syntax to spawn `joshrs_woodland_guide` (the generated debug procedure is `joshrs_spawn_joshrs_woodland_guide`). The underlying Lost City debugproc character is configured using `NODE_DEBUGPROC_CHAR` (default tilde in the pinned engine); do not assume a double-colon prefix applies in every customised client. Talk to the new NPC and confirm its dialogue and model appearance.

Each spawn is session-scoped (500 cycles) and does **not** create a persistent spawn location; there are no automated quests, equipment items or inventory rewards in this first slice. Do not claim the gameplay test passed until a real screenshot/log and in-game interaction confirms it.

## Future game content

Further implementation agents should take one rights-cleared work order, add real native scripts/definitions/locations as appropriate, run the same disposable build gate, then test in a backed-up local 377 world. Never automatically copy proprietary assets from later-game clients, cache dumps, mods or downloaded archives into JoshRS. Consult `AGENTS.md` and `content-factory/generated/agent-work-orders.json`.

## Compiler and disposable smoke-test proof

Automated PR checks build with the pinned engine and content sources, then launch a disposable server with SQLite and check the game/Web TCP listeners. Both must pass before merging any new native game logic. This tests that the compiled server **boots**, but does not exercise player login, trade interactions, live client rendering or Elrothiro's private character save. Existing customised scripts are accepted for upgrade only if their hashes match explicitly approved previous JoshRS releases; all other replacements fail closed and the installer backs up sources/packs locally.

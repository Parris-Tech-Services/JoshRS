# Native JoshRS 377 original-content integration

## Actual implementation

The content factory now produces a text-only, original **Woodland Guide NPC** with a genuine revision-377 NPC definition, a Talk-to RuneScript handler, and an administrative spawn command. Unlike the research catalogue, these are native files under `content-factory/generated/native377/scripts/` that the pinned `LostCityRS/Engine-TS` compiler can pack.

The automated runner generates original overlay source every day. The separate `Verify native 377 content pack` workflow checks the hashes, tests safety guards, clones the **exact pinned engine/content commits** into an ephemeral GitHub runner, registers an unused NPC ID, applies only a scoped intentional NPC-cache checksum exception, and compiles with `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true`. No game cache assets or saves are committed to the repository.

**These tests do not prove a successful login or live NPC interaction on JParris Desktop.** The custom world and Elrothiro's saves are only available locally. The generated Trial Token is not yet a native item, and modern RuneScape updates are not automatically compatible with the old client.

## One-click installer (Windows)

Once the game is configured, **log out and stop the local server** first. Download/extract updated JoshRS and double-click `JoshRS-Install-377-Content.cmd`. It uses the active private Windows copy found in `runtime/jparris-377/active.json`, never an original Fedora USB. The installer:

1. Checks the world is not listening on its game/web ports.
2. Verifies the generated manifest and SHA-256 for each source file; refuses to overwrite any differing custom file.
3. Preserves all existing NPC IDs, assigning unique unused IDs only for new original NPCs, while preserving all existing IDs.
4. Makes local backups of existing engine packs, the content pack, custom scripts, the packer source and `.env`.
5. Selectively permits the **new NPC** historical checksum mismatch while preserving other pack verification. It also respects the earlier narrow custom-loc exception when present.
6. Rebuilds using the copied local engine and reports success only when the packer exits successfully and compiled scripts exist.
7. If something fails, attempts to restore source and compiled-pack files from that backup. It does not alter the player-save database or the original USB.

The helper `deploy/jparris-windows/install-native377.ps1` without `-Apply` is a read-only preflight, suitable for inspecting the intended change. The double-click CMD deliberately uses `-Apply`. Engine/source rollback and syntax are tested where possible in CI; **the actual Windows runtime installer has not been playtested on JParris Desktop**.

## Test in game

After successful Windows installation, start your usual JoshRS 377 client, log in to the local world and use its configured administrative debug-command syntax to spawn `joshrs_woodland_guide` (the generated debug procedure is `joshrs_spawn_joshrs_woodland_guide`). The underlying Lost City debugproc character is configured using `NODE_DEBUGPROC_CHAR` (default tilde in the pinned engine); do not assume a double-colon prefix applies in every customised client. Talk to the new NPC and confirm its dialogue and model appearance.

Each spawn is session-scoped (500 cycles) and does **not** create a persistent spawn location; there are no automated quests, equipment items or inventory rewards in this first slice. Do not claim the gameplay test passed until a real screenshot/log and in-game interaction confirms it.

## Future game content

Further implementation agents should take one rights-cleared work order, add real native scripts/definitions/locations as appropriate, run the same disposable build gate, then test in a backed-up local 377 world. Never automatically copy proprietary assets from later-game clients, cache dumps, mods or downloaded archives into JoshRS. Consult `AGENTS.md` and `content-factory/generated/agent-work-orders.json`.

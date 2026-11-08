# Prompt for Agy — verify and complete JoshRS unified Fedora/Windows updater

Agy, work on the JoshRS repository at `~/dev/JoshRS-source`. The user has requested **one reliable update path for Windows and Fedora** which installs the same reviewed revision-377 source patches, makes verifiable private backups, identifies already-applied patches, compiles, verifies and rolls back safely. ChatGPT implemented PR [#197](https://github.com/Parris-Tech-Services/JoshRS/pull/197) with:

- `tools/rs377-unified-updater/updater.mjs` (shared Node 24+ implementation)
- `tools/rs377-unified-updater/update-fedora.sh` and root `JoshRS-Update.cmd`
- `tools/rs377-unified-updater/updater.test.mjs`, README and CI workflow
- The existing `content-patches/rs377/patches/0001-0033` and reviewed source bundles

**Your assignment is to independently verify this on the actual Fedora workstation, investigate incompatibilities, make test-backed code improvements and report verified facts. Don't just review or plan.**

## Non-negotiable safety

1. **Start read-only.** Identify the real game/server being used and whether `~/dev/JoshRS/lostcity377`, `~/lostcity377` or another location is authoritative. Treat the RS-SDK disposable sandbox, the older revision-225 world, a copied `JoshRS-source` repo and the live family's 377 world as different entities. Do not choose a target from guesses.
2. Do not access, print, upload, delete, reset, re-register or overwrite Elrothiro/Sylvie/any player's saves, character data, credentials, private keys, `db.sqlite` or WAL/SHM. No forced server stops and no account creation for the family.
3. **Before any apply**, establish the actual server and client processes are stopped and all players logged out. The updater's port check is not enough to prove this. If the live world is running, stop and report `BLOCKED_ACTIVE_SERVER`; request explicit owner approval for shutdown/change. Never bypass backup or patch conflicts.
4. You may run source tests and a **new disposable world** without touching the live game. First prove the updater on that world. Do not claim that CI success equals a Fedora-family game installation.
5. Never force-apply or reset a customised Fedora content tree. On a conflict, investigate why and produce a precise non-destructive reconciliation patch/test. If the selected world has locally customised quests different from the pinned content, preserving them takes precedence over installing new patches.

## Execute now — complete each phase

### A. Inspect actual Fedora host read-only
- Identify Fedora version, architecture, Node/npm/Git, server and client processes, relevant service/ports and all candidate world paths using metadata and read-only filesystem checks.
- Fetch latest `main` into your **JoshRS source checkout** without altering the game's engine/content paths or overwriting local changes. If the PR is unmerged, use its feature branch in a separate worktree.
- Run `node --test tools/rs377-unified-updater/updater.test.mjs` and `bash -n tools/rs377-unified-updater/update-fedora.sh`. Explain failures and repair them.
- Run `bash tools/rs377-unified-updater/update-fedora.sh --check --world /ACTUAL/ABSOLUTE/WORLD` only after discovering the actual location. Record selected-world path/identifier, patch count, number of changes, and any `BLOCKED` result. **Do not upload logs with private paths or secrets.**
- Compare selected Fedora content with the reviewed 33-patch pinned source and its current local modifications. Distinguish patch-already-applied, patch-conflict and quest-bundle collision; identify the exact source file and hunk without leaking save contents.

### B. Prove installation and recovery on an isolated 377 world
- Create a **fresh disposable** 377 world (same pins as repo), with distinct ports and fake accounts/saves; keep it outside existing family directories.
- Run the unified updater's `--check` and prove no change to source or private dummy saves. Then with disposable server stopped, `--apply --confirm-stopped`.
- Prove all 33 patch files apply in numeric order and the reviewed quest bundles are present. Confirm the updater's manifest and every file hash.
- Compile with `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true`, verify non-empty `script.dat` and `script.idx`, boot the real engine, and test a normal revision-377 login on a disposable account if compatible clients/tools are available.
- Re-run preflight and apply: source changes must be zero and existing files retained. Simulate a failed build, a divergent local quest file, and an active server. Verify each blocks/rolls back with identical original source, packs, SQLite and fake player saves.
- Test a future numbered patch after a successful update to prove old patches aren't re-applied. Test original/custom Millie/Gillie handler precedence.
- Verify post-rollback and post-success source-pack/save hashes; report missing controls or undetected process states and fix them in scoped commits.

### C. Apply to actual Fedora installation **only with owner approval**
- Present the real selected-world plan, backup destination, any conflicts, proposed downtime and rollback plan. Do not silently proceed.
- If approved, log out the real players, stop the real server gracefully, verify process/ports are closed, take a verified local backup of players and SQLite DB/WAL/SHM, then run the unified updater. Do not change family accounts.
- Reboot the selected world only after build and content-pack verification, then use a **separate disposable character** for read-only world identification and ordinary in-game actions; do not manipulate existing character saves. Test NPCs/item interaction, and only mark quests verified after real actions and relog tests.
- Confirm the same **reviewed** source diffs are installed as on Windows, while acknowledging compiled artifacts, custom config and host state may differ.

### D. Integrate and report
- Fix defects directly in JoshRS with tests first where possible; rerun cross-platform CI and disposable native compile/boot; commit and merge only when permitted and green, preserving unrelated concurrent work.
- Do not call anything verified until the exact evidence exists. Track `VERIFIED COMPLETE`, `PARTIALLY COMPLETE`, `BLOCKED` separately for source, compilation, Fedora deployment, Windows deployment and real playthrough.
- Provide links to the exact commits/CI and a concise redacted status: Fedora version, selected world, number of patches, plan result, backup and rollback tests, build results, process safety, genuine in-game proof, and remaining blockers.
- **Do not outsource completion back to the user.** Ask for a decision only when actual live server shutdown, saving credentials or modifying private family data requires explicit permission.

Useful sources:
- [Unified updater README](../../tools/rs377-unified-updater/README.md)
- [PR #197](https://github.com/Parris-Tech-Services/JoshRS/pull/197)
- [Original disposable source batch CI](../../.github/workflows/batch-quests-disposable-377.yml)
- [Quest 1 audit](../../research/rs377/playability_audits/001_cooks_assistant_2026-11-08.md), [quest 2](../../research/rs377/playability_audits/002_demon_slayer_2026-11-08.md), [quest 3](../../research/rs377/playability_audits/003_romeo_and_juliet_2026-11-09.md)

The owner expects **working results with evidence**, not an aspirational plan or green status based only on a git merge.

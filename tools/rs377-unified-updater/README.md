# JoshRS 377 Unified Source Updater — Windows and Fedora

**Implemented:** one Node.js updater for both OSes. Windows `JoshRS-Update.cmd` and Fedora `tools/rs377-unified-updater/update-fedora.sh` are lightweight platform launchers. This **does not** automatically install Google Drive documents or silently modify a running world.

## What it updates

The same 33 numbered, reviewed `content-patches/rs377/patches/*.patch` files in numeric order, plus 24 quest folders, five Mort'ton scripts and optional Millie/Gillie guide dialogue from `content-patches/rs377/scripts/`. This includes Barcrawl, Cook's Assistant, Demon Slayer, Romeo & Juliet and additional 377 quest content. Future numbered patches can be added to this same pipeline; updating the JoshRS repository will expose them to the next run.

On the pinned unmodified 377 source, CI verified the unified updater's preflight, 130 changed text/config files, native `npm run build` with verification, idempotent re-run, and server/HTTP boot. [Full CI evidence](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42531620286). **No human/bot played these quests in that CI.**

## Required before any install

1. Update a **separate JoshRS source checkout** from GitHub, *not* the game runtime, and preserve your private `runtime/` and saves. Do not overwrite an existing customised engine with an upstream clone.
2. Have Node.js 24+, npm and Git installed. The selected game must contain sibling `engine/` and `content/` with a compiled revision-377 pack, and an `engine/.env` stating its ports.
3. **Log out all characters and gracefully stop the actual server.** Check its Node process has ended. The updater checks localhost port listeners but cannot prove that a process with closed listeners is stopped.
4. Run the **read-only preflight first**. Review the selected world and changes; if it reports `BLOCKED`, stop. Never force patches into an unknown customised world.
5. Only then authorise the confirmed install. The updater never auto-stops the game, changes credentials, resets SQLite, modifies login records, or starts the server.

## Windows

From the current JoshRS repository root, double-click:

`JoshRS-Update.cmd`

It selects the private game recorded in `runtime/jparris-377/active.json`, runs a **read-only check**, then prompts you before applying/rebuilding. If there is no active configuration it blocks.

For a deliberate different world, use Node commands instead, with an absolute directory:

```powershell
node .\tools\rs377-unified-updater\updater.mjs --check --world "C:\absolute\path\to\lostcity377"
# Only after logging out, stopping the server and reviewing that check:
node .\tools\rs377-unified-updater\updater.mjs --apply --confirm-stopped --world "C:\absolute\path\to\lostcity377"
```

**Do not run the old per-quest .cmd files after a successful unified update.** They are kept for historical/reference use and may see the same patch as already applied.

## Fedora

In the current JoshRS repository checkout (normally `~/dev/JoshRS-source`):

```bash
bash tools/rs377-unified-updater/update-fedora.sh --check
# If more than one possible world is discovered:
bash tools/rs377-unified-updater/update-fedora.sh --check --world /absolute/path/to/lostcity377
# Once all players are logged out and the server has been stopped:
bash tools/rs377-unified-updater/update-fedora.sh --apply --world /absolute/path/to/lostcity377
```

The Fedora launcher refuses root/unattended installation, requires you to type **yes**, then passes explicit confirmation to the shared Node updater. It searches only known JoshRS 377 locations and refuses ambiguous selection; `--world` must explicitly identify a real sibling engine/content pair. It does **not** assume Agy's isolated RS-SDK sandbox is your family world.

## SQLite preflight on copied Fedora installations

The engine may use either legacy `engine/.env` or the newer authoritative
`engine/data/config/world.json`. The updater now checks the **effective**
backend, not just a literal `DB_BACKEND=sqlite` line in `.env`.
It verifies any existing `engine/db.sqlite` has the SQLite file signature
and checks configured game/web listeners before applying. Existing account
databases and saves must still pass the backup and unchanged-hash checks.

A missing or unconfirmed SQLite configuration remains a **hard block**.
Do not add `DB_BACKEND=sqlite` blindly: first inspect whether `world.json`
specifies a different backend, and verify the original account database.
Never run database migrations or replace account files to make this gate pass.

To view the private recovery report, use
`less ~/.local/state/joshrs-desktop-to-fedora/latest-preflight.json` rather
than trying to run the JSON file as a command.

## Safety and recovery

- Default CLI mode is `--check` and writes **nothing to selected game files**. It builds a shadow patch plan in the OS temporary directory; no save/account files are read or modified by this check.
- Accepts both standard `diff --git` and historical `--- a/`, `+++ b/` text patches. Blocks symlinks, renames/deletions, unrecognised paths, mixed/manual conflicting edits, duplicated Cook support dialogue and missing quest packages.
- On `--apply`, requires `--confirm-stopped` after user review, checks game/update ports, obtains an exclusive per-world update lock, verifies SHA-256 source and account/save backups, then applies the preflighted source changes.
- The updater **refuses non-SQLite worlds** (whose database it cannot back up) and blocks when existing `.sav` characters have no matching `db.sqlite` account file. It never silently creates a replacement login database.
- **Backups are outside the game's Git/source tree:** Linux `~/.local/state/joshrs-unified-377-updater/<world-id>/backups`, Windows `%USERPROFILE%\AppData\Local\JoshRS\unified-377-updater\<world-id>\backups`. Each contains full existing `data/players`, `db.sqlite`, `db.sqlite-wal`, `db.sqlite-shm`, touched source files, the engine compiled pack, content pack and a local `build.log`. These are private and must not be uploaded to GitHub/Drive.
- `npm run build` uses `BUILD_SRC_DIR` pointing at the selected world's `content`, `BUILD_VERIFY=true`, `BUILD_VERIFY_PACK=true`. It verifies `data/pack/server/script.dat` and `script.idx`, and rechecks all original save/account bytes. On failure it attempts to restore original source and both pack folders. **After a failed/partial rollback, do not restart the server until the original files are checked**.
- A local private `installed.json` records each patch file name/sha256 and all managed file hashes, making verified repeat runs a no-op and permitting a later numbered patch without replaying earlier ones. A stale `update.lock` intentionally blocks instead of guessing whether another update has stopped. Inspect a stale lock and process state before manually clearing it.
- Existing customised source that differs from reviewed upstream is **never overwritten**. A block is a safety result, not evidence that the custom game needs resetting.

## What is *not* verified

The physical Fedora JoshRS installation, JParrisDesktop's personalised Windows world, real client login, NPC dialogue, combat, quest rewards, cutscenes, two-account interaction and save/relogin **remain unverified** until tested on the respective machines. CI's disposable-server boot is not a player playthrough. Agy's read-only Fedora verification instructions are in [AGY_UNIFIED_UPDATER_FEDORA_VALIDATION_PROMPT_2026-11-09.md](../../docs/rs377/AGY_UNIFIED_UPDATER_FEDORA_VALIDATION_PROMPT_2026-11-09.md).

## Developer acceptance

```bash
node --test tools/rs377-unified-updater/updater.test.mjs
bash -n tools/rs377-unified-updater/update-fedora.sh
```

`.github/workflows/rs377-unified-updater.yml` runs both Linux and Windows unit tests and a disposable pinned source apply/build/boot. Every test must pass before merging changes to the updater.

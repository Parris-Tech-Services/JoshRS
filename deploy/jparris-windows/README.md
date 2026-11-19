# JParris Desktop — revision 377 one-click setup

This is a **local Windows desktop game server and Java client** for JoshRS 377. It is separate from the revision-274 research instance and the Woodlands browser demo.

## Bundled Windows updates (8 November 2026)

**No more separate repair scripts for every fresh installation.** Download the latest
[JoshRS main ZIP](https://github.com/Parris-Tech-Services/JoshRS/archive/refs/heads/main.zip),
extract it, then open `JoshRS.cmd`. **Set Up and Play** automatically runs
the versioned `Apply-WindowsGameUpdates.ps1` coordinator on the installed
private 377 world, after prerequisites, account backup and client compilation.
It applies only *reviewed and applicable* changes; an unknown or missing
source remains untouched and is reported clearly.

- **Automatically included:** Alfred Grimhand's Barcrawl native source repairs
  (ten-bar game already in pinned 377), correct Friends startup flags on
  supported local embedded-service setups, and Luna playtime restore **only**
  if both her native bot source and validated saved character exist.
- **Existing PC:** Open `JoshRS.cmd` → **UPDATE GAME / REPAIR**, once the game
  has been gracefully stopped. The updater is included in the same repair flow.
  The lightweight `JoshRS-Update.cmd` is an optional standalone shortcut;
  it performs a read-only preflight before asking permission.
- **Never auto-install:** incomplete Rag and Bone Man or other unverified Jagex
  quest ports; Yrsa's optional shop, experimental bots, custom map checksum
  exemptions, Eadgar/Fred-George source replacements, or new original NPCs.
  Those are opt-in or require local compatibility evidence.

The coordinator validates the **actual** `active.json` paths and ports, rejects
active game/login/friend services, calls each patch's own exact-source preflight
and offline backup/rollback guards, and rechecks relevant effects on every run.
Updates are idempotent: running again must not duplicate NPC handlers,
transactions, quests or source patches. If it reports `BLOCKED_CUSTOM_SOURCE`,
do **not** force it; the installed world and saves remain the authority.
`WINDOWS_GAME_UPDATES_COMPLETE` means the compatible source updates were
processed, **not** that every optional feature or real-client playthrough passed.

**IMPORTANT for a second computer:** the GitHub launcher downloads pinned
engine/content/client source, not your private Elrothiro/Sylvie saves,
modified maps or customised Java client. To transfer *your* world use the
dashboard's **Restore my Fedora USB game** with an explicit verified backup
of the corresponding private game, saves and account database. A clean world
is separate and will have new accounts. Never put private runtime files in a
public repository or replace a working `runtime/jparris-377/` folder with a
fresh ZIP.

## New: JoshRS Control Center

For the easiest experience, **double-click `JoshRS.cmd`** in the extracted JoshRS folder. It opens a native Windows control window rather than asking you to enter PowerShell commands.

**Improved first run:** the main button now says **Set Up and Play** until a game is configured. Click it after inserting your USB drive. JoshRS checks only the usual game locations on attached removable drives for a complete revision-377 source; it does not browse all your other files. If it finds exactly one game, it shows the path and separately confirms whether the Elrothiro save, account database and Java client are present. You must approve the import. If none or several are found, a folder picker appears instead. **It never silently chooses a clean game in place of your Fedora copy.**

After the first successful installation, the main button becomes **Play JoshRS**. The desktop shortcut created during setup also opens the full dashboard. If its graphical window fails to initialize, an error dialog and a private diagnostic file appear instead of silently disappearing.

The control window includes:

- **Play JoshRS:** starts the local revision-377 server and Java client using your currently configured world.
- **Restore my Fedora USB game:** opens a folder picker. Choose the USB's JoshRS folder; it copies your customised server, original content and saves to a new timestamped location and configures it. It refuses to switch worlds while the game is active.
- **Install a clean 377 world:** obtains the pinned upstream engine, content and Java client, with a warning that your Fedora customizations and character are not part of the clean source.
- **Back up my player saves:** offline copy of the whole players directory and SQLite account database (including WAL when present). The button is disabled if either game/network port is listening.
- **Refresh status:** shows whether the expected TCP and HTTP listeners are responding. Port readiness alone does not prove a successful game login.
- **Update Game / Repair:** after a world is installed, the clean-install action updates compatible native 377 gameplay and services, backs up saves, reinstalls dependencies, runs non-destructive migrations and recompiles Java without replacing your world.
- **View logs:** opens the latest server, client or dashboard diagnostic in Notepad. Logs are private and rotated to at most 25 copies.
- **Diagnostics:** copies a status report without reading or exposing local passwords, player contents or configuration secrets.
- **Game files / Backups:** opens the correct private local folder in Windows Explorer.

The dashboard refreshes automatically. All existing `jparris-setup.cmd` and `jparris-play.cmd` scripts continue to work for direct command-line use. A command window remains open during setup and game launch so errors are visible. The dashboard is a convenient front end, **not** another server process.

```text
JoshRS.cmd                     Double-click to open the control center
jparris-setup.cmd              Old direct first-time setup (still supported)
jparris-play.cmd               Old direct game launcher (still supported)
```

For customised save restoration, choose the actual USB copy, not the incomplete Google Drive folder view. The control center does not automatically merge a clean upstream client with your modified Fedora Java client.

## Start with minimal commands

**On JParris Desktop:**

1. Download the current [JoshRS GitHub ZIP](https://github.com/Parris-Tech-Services/JoshRS/archive/refs/heads/main.zip) and extract it somewhere permanent, such as `C:\JoshRS` (do not launch it from inside the compressed ZIP).
2. Plug in the USB drive containing your Fedora JoshRS game.
3. **Double-click `JoshRS.cmd` and select `SET UP AND PLAY`.** Approve the detected copy, or choose its folder manually if needed.
4. Setup installs missing tools, copies the game, backs up saves, migrates the database, compiles the client and opens the game.
5. Later, open the **Play JoshRS** desktop shortcut or `JoshRS.cmd` and select `PLAY JOSHRS`.

You can still drag your USB JoshRS folder onto `jparris-setup.cmd` to skip the picker. Keep the extracted launcher folder in its permanent location so the shortcut keeps working. First setup needs internet access and can take several minutes. Approve any Windows tool-installation prompts. No WSL, Docker or paid host is needed.

Setup checks Git and Node.js 24+, then automatically selects an existing JDK 21 or installs the free Eclipse Temurin JDK 21 using Windows Package Manager. **Java 17 can remain installed**; JoshRS selects Java 21 for its own setup/client processes without changing your system-wide default. Approve the Windows installer prompt if required. Stop an existing world with **Ctrl+C** in its server window before rerunning setup; setup refuses to migrate an active configured world.

Equivalent commands in Command Prompt opened in the extracted JoshRS root:

```bat
jparris-setup.cmd "E:\JoshRS"
jparris-play.cmd
```

Replace `E:\JoshRS` with the actual USB path. If the USB has `JoshRS\lostcity377\engine`, `JoshRS\lostcity377\content`, or direct `engine` and `content` folders, setup attempts to locate them automatically.

## Where the files go

- All runtime and data are stored under `runtime/jparris-377/`. That directory is Git-ignored; it is never uploaded to GitHub by this launcher. Startup logs under `runtime/jparris-377/logs/` remain local and may contain technical output; inspect before sharing.
- `runtime/jparris-377/upstream/` contains three independent upstream repositories cloned at verified, pinned Git commit SHAs.
- A supplied USB copy is **copied** into a timestamped `runtime/jparris-377/usb-YYYYMMDD-HHMMSS/` folder. Original USB files remain unchanged.
- Any original player saves and SQLite database are backed up under `runtime/jparris-377/save-backups/` before installing/migrating the server.
- `runtime/jparris-377/active.json` records which engine, content and client the launcher should start.

See [upstreams.json](upstreams.json) for the *exact* compatible engine/content/client pins. They use:
- [LostCityRS/Engine-TS](https://github.com/LostCityRS/Engine-TS), branch `377-wip`;
- [LostCityRS/Content](https://github.com/LostCityRS/Content), branch `377-wip`;
- [LostCityRS/Client-Java](https://github.com/LostCityRS/Client-Java), branch `377`.

The public JoshRS repository **does not vendor the game content or redistribute it as JoshRS-owned material**. Lost City licenses its original engine code separately; original historical game assets are Jagex-owned and are not included in its MIT code license.

## Behaviour and safety

- Setup does **not** overwrite a copy of the USB or an existing `.env` file.
- It refuses to start a personalised USB copy if the source is incomplete; it does not secretly substitute a plain upstream world.
- If the USB lacks the modified Java client, it installs upstream Client-Java and **warns** that locally created map UI/custom client changes are not present.
- Missing engine/content/client files are not silently replaced inside a custom installation.
- The server starts with local game port `52402`, HTTP/update port `8888`, and Java client port offset `8808` for a **fresh** `.env`. Existing custom configurations are retained, and their game/web port relationship is validated.
- Setup performs SQLite migrations rather than database resets. It never runs `sqlite:reset` or wipes player saves.
- Clicking Play will not start another server if the expected TCP port is already in use. It does not kill other Node or Java processes.
- Windows PowerShell windows display server logs and the Java client. Stop the server gracefully with **Ctrl+C** in its window, rather than force-killing the process.
- One-click setup is a **local desktop workflow**, not a remote mobile-browser server. The Java 377 client is not an Android browser client. Making it remotely accessible requires a separate secure network setup and mobile-compatible client.

### If you previously saw "JDK 21 is required; found javac 17"

Older launchers checked for Java's presence without installing the correct major version. Download the updated `main` launcher ZIP and extract it, then run `JoshRS.cmd` again. The revised setup automatically finds or installs JDK 21.

If you don't want to re-download the launcher, the existing Windows PowerShell window can install JDK 21 with:

```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK --exact --source winget --accept-package-agreements --accept-source-agreements
```

You must then use a PowerShell session where JDK 21 is selected before retrying the old setup. It is simpler to use the updated launcher, which makes that selection automatically. Do not uninstall JDK 17; other Windows software may depend on it.

### Resume after "WEB_PORT=80" configuration mismatch

A Fedora game copy can contain `NODE_PORT=52402` but `WEB_PORT=80`. The revision-377 Java client configured with this game port expects its local HTTP/update server on **8888**. The revised installer fixes only that known mismatch in a private **Windows copy**, saves the original `.env` beside the copy, and leaves your USB untouched. It refuses to overwrite other unexpected custom port settings.

If a previous setup already copied your USB before reporting a port error, resume the **same timestamped copy** instead of copying gigabytes again. Example:

```powershell
& 'C:\JoshRS-Launcher\JoshRS-main\deploy\jparris-windows\setup.ps1' -ResumeSnapshotPath 'C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\usb-20261030-203927'
```

That exact example uses a local snapshot that was shown in the setup output. For other computers, replace it with the actual path printed by the earlier setup. The resume feature accepts only `usb-YYYYMMDD-HHMMSS` snapshots inside the launcher's own `runtime/jparris-377` folder. It does not change files on the original USB.

If an existing custom world deliberately runs HTTP on another port, the installer stops rather than guessing. Verify the Java client's network settings before changing ports.

### Custom object definitions: `loc checksum mismatch!` in the RuneScape chat

The game's development worker broadcasts **Packing changes** while rebuilding content. If that rebuild fails, it also sends **Check the console for more information**. The underlying `loc checksum mismatch!` comes from a **comparison with the original unmodified revision-377 location configuration**, not a check of Elrothiro's save file. A customised world can legitimately differ from the original CRC. A failed rebuild still deserves checking, though: the content may have other problems.

**Preferred approach for the custom Fedora world:** keep the broad `BUILD_VERIFY=true` and `BUILD_VERIFY_PACK=true` checks, but explicitly allow the expected original *loc* checksum to differ, using a narrow, reversible modification to the **copied Windows runtime engine**. Other original config CRC checks and parsing errors remain active.

1. Log out of Elrothiro and any other players. Stop the JoshRS server gracefully with **Ctrl+C** in the server console. Wait until the server game/HTTP ports close.
2. Update your extracted JoshRS launcher to the latest GitHub `main` version (do not delete `runtime/`).
3. In PowerShell, run from the extracted launcher root:

```powershell
& '.\deploy\jparris-windows\fix-custom-loc.ps1'
```

4. Read the confirmation that local backups were created under `runtime/jparris-377/custom-loc-backups/`. The tool refuses to touch the original USB, refuses to edit a clean upstream engine and stops if the custom packer's source code does not match the expected revision-377 implementation.
5. Open `JoshRS.cmd` and start your world. Log in again. **Old chat messages won't disappear from existing chat history**, but subsequent intentional loc changes should no longer broadcast that checksum failure.

This fix does **not** set `BUILD_VERIFY=false`. It adds `JOSHRS_CUSTOM_LOCS=true` to the copied world's private `.env`, and selectively bypasses only the original loc CRC comparison. This means a genuinely broken custom loc checksum is not detected by comparison to the original; parsing, other configuration CRC checks, pack ID checks and unrelated consistency checks still run. If a *different* error remains, read the actual server log rather than ignoring it.

## Login says “Invalid username or password”

The native 377 server's error code 1 means **either** there is no matching
account in its active SQLite database, **or** the supplied password failed the
stored bcrypt hash check. A reachable game port or successful autonomous bot
login does **not** prove that Elrothiro's personal account can log in.

1. On JParris Desktop, run this **read-only** command in the *installed* launcher
   directory (not the source-only GitHub checkout). It checks the active
   `active.json` selection, native Elrothiro save CRC and matching account record
   without printing or changing passwords:

   ```powershell
   & '.\deploy\jparris-windows\Protect-Elrothiro.ps1'
   ```

2. If it says **Elrothiro account record NOT FOUND**, stop. Preserve the
   `elrothiro.sav` file and find the *matching* backed-up `db.sqlite` (and
   corresponding WAL files, where present). Do **not** clear the database,
   reset the character, create a new Elrothiro account or toggle automatic
   registration to claim an existing saved character.
3. If the character and matching account record are present, the optional
   **read-only local password check** can distinguish a password/hash mismatch
   from a client/server connection problem. Download only this public-source
   diagnostic into your existing launcher checkout (do not replace `runtime/`):

   ```powershell
   Invoke-WebRequest 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/tools/rs377-saves/verify-local-login.mjs' -OutFile '.\\tools\\rs377-saves\\verify-local-login.mjs'
   node '.\\tools\\rs377-saves\\verify-local-login.mjs'
   ```

   Type the password at the **hidden terminal prompt** on the desktop, never
   in chat or a shell argument. It uses Node 24's read-only SQLite access and
   the **active engine's own** bcrypt-ts comparator with its lowercase
   password policy; it prints only a match/mismatch or case-mismatch result.
   It neither updates account hashes nor registers new accounts. A matching
   hash still does not independently establish which game process is running.

3. If the account is present and the save passes verification, the correct
   password still needs to be tested *privately* on the real local client.
   Neither this report nor a GitHub CI run can validate a user's password.
   Keep passwords, hashes and databases off GitHub/chat.
5. Unknown/new usernames are a separate case: upstream Engine-TS defaults
   `WEBSITE_REGISTRATION=true`, which **rejects unknown names** if no website
   signup has provisioned them. New, empty Windows worlds created by the
   corrected launcher explicitly choose `WEBSITE_REGISTRATION=false`. Existing
   `.env` files remain untouched; imported worlds with saved characters
   default to registration locked, and installs with saved characters but no
   database fail closed. Don't apply the new-world configuration to a family
   world without first verifying all account records and saves.

There is no safe way for GitHub code alone to identify or repair a live desktop's
private account database. Do not claim login restored until the actual Java
client logs in, displays the expected character and survives a clean
logout/relogin.

## Offline Elrothiro password recovery (Windows only)

If the read-only local diagnostic returns `PASSWORD_DOES_NOT_MATCH_ACTIVE_DATABASE`,
this means the **entered password** does not match the hash in the **selected**
Windows account DB. It does NOT prove who changed a password or whether an
older account DB was imported.

**Never use a password reset to fix absent server listeners.** These are
separate issues. If the game process exists but game TCP 52402/HTTP 8888
are absent, collect the server console output first. PowerShell
`Start-Transcript` does not reliably capture all native npm/Node process
output; the server startup transcript may therefore be incomplete.

The optional reset tool has a deliberately narrow scope:
- Require the *real server engine process* to be stopped (not merely absent
  game ports). Log out characters and use Ctrl+C in the actual server window.
  If that cannot stop gracefully, leave the live files untouched.
- Confirm Elrothiro's existing native save CRC and exact login account.
- Back up the entire players directory, SQLite DB and any WAL/SHM files into
  private gitignored `runtime/jparris-377/save-backups`, with hashes.
- Replace only the existing Elrothiro password hash **after** the operator
  types the explicit confirmation; never change account ID, other accounts
  or character saves. Check the new hash and save bytes afterwards.

In the **existing** `C:\\JoshRS-Launcher\\JoshRS-main` folder, once the server
is OFFLINE, download the single public-source helper:

```powershell
Invoke-WebRequest 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/tools/rs377-saves/reset-local-elrothiro-password.mjs' -OutFile '.\\tools\\rs377-saves\\reset-local-elrothiro-password.mjs'
node '.\\tools\\rs377-saves\\reset-local-elrothiro-password.mjs'
```

The user-requested password `a` is **unsafe** for any LAN, multiplayer or
public server, so this procedure displays a prominent warning and requires
the exact interactive confirmation `CHANGE ELROTHIRO TO A`. Use this only
as a temporary recovery choice for a controlled private installation, then
replace it with a strong password or implement a Windows-protected login
mechanism before enabling outside access.

No online account recovery, automatic login, server restart or live game
playthrough is claimed by this offline procedure. Keep DB backups and
player saves private, and verify the real client login after a safe restart.

## Sylvie account recovery without losing progress (Windows)

The Elrothiro reset **does not** change Sylvie. If her original password no
longer works, this separate optional tool can change only the existing
`sylvie` account hash to the temporary password `a`.

Before running it, **close the Java client and gracefully stop the actual
JoshRS server** with Ctrl+C in its PowerShell window. A lingering Node
`src/app.ts` process is treated as running even when no network ports
are listening, and the tool refuses to modify the database. Do **not**
force-kill a stuck server to get past this gate.

The script verifies the existing native `sylvie.sav` CRC and the exact
account record, independently SHA-256 backs up the entire players directory,
SQLite DB and WAL/SHM, then updates only Sylvie's existing password using
a compare-and-update SQL transaction. It verifies her save bytes, account
ID and account count are unchanged. Other users, including Elrothiro, are
not modified.

From the original installed Windows launcher folder:

```powershell
cd 'C:\\JoshRS-Launcher\\JoshRS-main'
Invoke-WebRequest 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/tools/rs377-saves/reset-local-sylvie-password.mjs' -OutFile '.\\tools\\rs377-saves\\reset-local-sylvie-password.mjs'
node '.\\tools\\rs377-saves\\reset-local-sylvie-password.mjs'
```

Enter the exact local confirmation `CHANGE SYLVIE TO A` if you want to make
the offline change. **Never** upload the SQLite database or character saves
to GitHub or chat. A `PASSWORD_RESET_TO_A` result proves the local DB
update and save verification succeeded; a real client login still has to
be checked separately.

`a` is deliberately **not** suitable for a networked or multiplayer
server. Before allowing other players or external access, move to a
strong private credential and Windows-protected auto-login instead.
This recovery also cannot fix the separate no-listeners server issue.

## Fred/George initially offline after save/relogin (377)

If `Inspect-Agents.ps1` reports `fredOnline:false`,
`georgeOnline:false`, and both bots show
`initial_save_persistence_relog_check`, do **not** launch the
separate `fred-george-family-client.mjs`: the engine may already own
the two bot player identities. Do not change bot account passwords or
delete their saves.

On the affected original engine overlay, `PlayerLoading.load('Fred')`
normalises `player.username` to `fred`, but the old relog gate uses
`world.logoutRequests.has('Fred')`. The normal login-thread logout
acknowledgement is keyed by the **lowercase account name**. This can
mistakenly enqueue a new bot before its previous save finishes, losing
the bot from the active world. The source patch gates on the actual
player username and adds explicit relog telemetry. This is a
**source-rooted diagnosis**, not proof of the current desktop engine
until its exact local code has been inspected.

The following tool checks the active installed engine without changing it:

```powershell
cd 'C:\\JoshRS-Launcher\\JoshRS-main'
& '.\\deploy\\jparris-windows\\Repair-FredGeorgeRelog.ps1'
```

Only if it prints `PATCH_READY` and you are prepared to restart:
log out Elrothiro and Sylvie normally, stop the server with Ctrl+C,
and confirm all Node game processes have ended. The optional
`-Apply` mode checks for running engines and listening game ports,
calls the existing verified world-backup tool, creates a separate
original-source backup, then atomically changes only the single known
relocation guard. It refuses unfamiliar engine source. It **never**
kills/restarts the game or edits `.sav`, SQLite or `.env`.

```powershell
& '.\\deploy\\jparris-windows\\Repair-FredGeorgeRelog.ps1' -Apply
```

After a successful offline patch, restart using the **existing**
`jparris-play.cmd` and confirm the new bot live-state telemetry,
online presence and ordinary gameplay. Do not claim the bots are
working just because the source line changed. This fixes a narrow
native-engine bot race and does **not** complete the full RS-SDK
revision-377 adapter.

## Repair a custom Eadgar's Ruse RuneScript queue-arity error

On JParrisDesktop, the active revision-377 game content is a **copied folder,
not a Git worktree**. `git -C <content> status` legitimately reports
`not a git repository`; this does **not** mean any saves are lost.

The compiler may print `queue,int` vs `queue,int,int` at
`scripts/quests/quest_eadgar/scripts/quest_eadgar.rs2` for
`queue(eadgar_quest_complete, 0);`. Pinned source examples confirm
revision-377 expects `queue(eadgar_quest_complete, 0, 0);`.

Use the **read-only** preflight while the server is still running:

```powershell
cd 'C:\\JoshRS-Launcher\\JoshRS-main'
& '.\\deploy\\jparris-windows\\Repair-EadgarQueue.ps1'
```

`PATCH_READY` means one and only one unsafe call is found and the patch is
available. `ALREADY_PATCHED` means no further change is required.
If the output is `UNRECOGNISED_SOURCE`, stop; do not force it.

To **apply**, log Elrothiro and Sylvie out normally, stop the server with
Ctrl+C and close its engine console. Then use:

```powershell
& '.\\deploy\\jparris-windows\\Repair-EadgarQueue.ps1' -Apply
```

The repair refuses active game processes/listeners, requires a verified
full-world backup through `Protect-Elrothiro.ps1 -CreateBackup`,
creates a SHA256-checkable original copy of just the quest script in
`runtime/jparris-377/save-backups`, and atomically changes only the
specific queue arity call. It does **not** run git commands, download
unknown versions of the content, edit player/account saves, or touch
unrelated scripts.

`QUEUE_ARITY_REPAIR_APPLIED` proves the single local source edit, **not**
that the full quest has compiled successfully. After restarting the game,
check the server's packing log for **all remaining** script errors.
Earlier reports of unresolved `@eadgar_*` labels may indicate missing
additional custom quest definitions. Do not fabricate stub labels or
replace the whole quest from a different Lost City revision.

## Troubleshooting

### Broken desktop Java client: Could not find or load main class .java2d.d3d=false

The Java process is misreading a JVM property as its main class. This
concerns the client only; do not reset or replace accounts or the server.

The local directly launched Java client may be different from GitHub's
original Gradle-based play.ps1. The surgical repair protects those differences:

1. Download the latest JoshRS main ZIP. Copy three files into the EXISTING
   C:\JoshRS-Launcher\JoshRS-main preserving their paths:
   * JoshRS-Fix-Java-Client.cmd
   * deploy/jparris-windows/fix-java-client-launch.ps1
   * deploy/jparris-windows/launch-java-client-safe.ps1
2. Double-click JoshRS-Fix-Java-Client.cmd. It validates the configured
   client, makes a full original backup of play.ps1 in
   runtime/jparris-377/launcher-backups and replaces ONLY the recognised
   Client launch block. It does not touch the server block, original Java
   client project, save files, account database, VM or any runtime data.
   The repair fails closed on unexpected customised source.
3. Reuse your existing Play JoshRS desktop shortcut. The repaired client
   launches via Gradle --no-daemon run, which selects the supported actual
   main class and runtime dependencies. A process-local JAVA_TOOL_OPTIONS
   carries the proper Java2D property: -Dsun.java2d.d3d=false, avoiding the
   broken PowerShell 5.1 native -D flag marshalling. The environment variable
   is restored when the client exits; no global JDK setting changes.

No need to disconnect existing clients or restart a running server when
INSTALLING this launcher-only change. The existing desktop shortcut is
reused, not deleted or recreated. The next client start picks up the fix.

READ-ONLY compatibility check: run the fix-java-client-launch.ps1 script
without the -Apply argument.

Rollback: copy the private original play-before-java-args-*.ps1 backup over
deploy/jparris-windows/play.ps1. Never delete or overwrite runtime/.

CI runs a synthetic Windows PowerShell 5.1 fixture with the malformed
direct-Java command, validates the targeted backup/rewrite and idempotence.
Only a successful real desktop Java client login can establish a live fix.



- **Windows SmartScreen / execution policy:** run the extracted scripts directly from a folder you control; do not use random mirrored downloads.
- **Missing Node/Java/Git:** use the setup installer prompts and reopen the terminal if the new PATH is not visible. Microsoft recommends JDK 21 with WinGet.
- **Wrong USB copy:** if the original `engine/package.json`, `src/app.ts`, `src/engine/World.ts`, and `content/scripts/` are not present, choose the correct USB location. If the only copy available is an incomplete Google Drive directory tree, the customised world cannot be restored yet.
- **Game server fails at startup:** click **View logs** for the most recent report, or inspect the separate server PowerShell window. The initial engine content/cache build can perform substantial work. Do not assume an open TCP port proves gameplay works.
- **Unable to log into your existing character:** check that the source USB snapshot includes `engine/data/players/main/elrothiro.sav` **and** the matching `engine/db.sqlite` account database. Missing either can prevent a faithful save/account restoration.
- **Custom changes missing:** upstream repositories supply only vanilla revision-377 code. The USB copy must contain your modified Lua/Luna logic, teleport/map code, custom launchers and any other development edits. The clean upstream build cannot regenerate them.
- **Browser download cannot play 377:** this revision is Java-only in the checked upstream set. Do not confuse it with the separately hosted 274 browser game.

## Verification limitations

The Windows workflow runs under Windows PowerShell 5.1 (the same interpreter as the double-click launcher). It checks syntax, imports a synthetic USB fixture with spaces in its path, verifies save/database hashes, rejects incomplete copies, installs the pinned engine, migrates SQLite, compiles Java and starts a disposable world to check both listeners. These automated checks do not establish successful interactive game login or restoration of your actual Elrothiro save: those still require your USB files and JParris Desktop.

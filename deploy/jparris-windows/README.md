# JParris Desktop — revision 377 one-click setup

This is a **local Windows desktop game server and Java client** for JoshRS 377. It is separate from the revision-274 research instance and the Woodlands browser demo.

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
- **Check / Repair Installation:** after a world is installed, the clean-install action changes to offline repair. It backs up saves, reinstalls dependencies, applies non-destructive migrations and recompiles Java without replacing your existing world.
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

Setup checks Git, Node.js 24+ and JDK 21. Stop an existing world with **Ctrl+C** in its server window before rerunning setup; setup refuses to migrate an active configured world.

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

## Troubleshooting

- **Windows SmartScreen / execution policy:** run the extracted scripts directly from a folder you control; do not use random mirrored downloads.
- **Missing Node/Java/Git:** use the setup installer prompts and reopen the terminal if the new PATH is not visible. Microsoft recommends JDK 21 with WinGet.
- **Wrong USB copy:** if the original `engine/package.json`, `src/app.ts`, `src/engine/World.ts`, and `content/scripts/` are not present, choose the correct USB location. If the only copy available is an incomplete Google Drive directory tree, the customised world cannot be restored yet.
- **Game server fails at startup:** click **View logs** for the most recent report, or inspect the separate server PowerShell window. The initial engine content/cache build can perform substantial work. Do not assume an open TCP port proves gameplay works.
- **Unable to log into your existing character:** check that the source USB snapshot includes `engine/data/players/main/elrothiro.sav` **and** the matching `engine/db.sqlite` account database. Missing either can prevent a faithful save/account restoration.
- **Custom changes missing:** upstream repositories supply only vanilla revision-377 code. The USB copy must contain your modified Lua/Luna logic, teleport/map code, custom launchers and any other development edits. The clean upstream build cannot regenerate them.
- **Browser download cannot play 377:** this revision is Java-only in the checked upstream set. Do not confuse it with the separately hosted 274 browser game.

## Verification limitations

The Windows workflow runs under Windows PowerShell 5.1 (the same interpreter as the double-click launcher). It checks syntax, imports a synthetic USB fixture with spaces in its path, verifies save/database hashes, rejects incomplete copies, installs the pinned engine, migrates SQLite, compiles Java and starts a disposable world to check both listeners. These automated checks do not establish successful interactive game login or restoration of your actual Elrothiro save: those still require your USB files and JParris Desktop.

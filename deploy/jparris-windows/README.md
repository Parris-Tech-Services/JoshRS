# JParris Desktop — revision 377 one-click setup

This is a **local Windows desktop game server and Java client** for JoshRS 377. It is separate from the revision-274 research instance and the Woodlands browser demo.

## Start with minimal commands

**On JParris Desktop:**

1. Download the current [JoshRS GitHub ZIP](https://github.com/Parris-Tech-Services/JoshRS/archive/refs/heads/main.zip) and extract it somewhere permanent, such as \`C:\JoshRS\` (do not launch it from inside the compressed ZIP).
2. **To restore your actual customised Fedora world:** attach the USB copy and drag the **USB JoshRS folder** onto \`jparris-setup.cmd\`. The Windows launcher accepts the folder path as its only optional argument.
3. **To try a clean upstream revision-377 world instead:** double-click \`jparris-setup.cmd\` normally, without a USB folder.
4. After the initial setup, **double-click \`jparris-play.cmd\`** for later sessions.

Setup checks for Git, Node.js 24+, and JDK 21, using Windows Package Manager to install missing prerequisites where available. You may need to approve Windows installation prompts and rerun the setup script after opening a fresh terminal. It does **not** require WSL, Docker or a paid host.

Equivalent commands in Command Prompt opened in the extracted JoshRS root:

\`\`\`bat
jparris-setup.cmd "E:\JoshRS"
jparris-play.cmd
\`\`\`

Replace \`E:\JoshRS\` with the actual USB path. If the USB has \`JoshRS\lostcity377\engine\`, \`JoshRS\lostcity377\content\`, or direct \`engine\` and \`content\` folders, setup attempts to locate them automatically.

## Where the files go

- All runtime and data are stored under \`runtime/jparris-377/\`. That directory is Git-ignored; it is never uploaded to GitHub by this launcher.
- \`runtime/jparris-377/upstream/\` contains three independent upstream repositories cloned at verified, pinned Git commit SHAs.
- A supplied USB copy is **copied** into a timestamped \`runtime/jparris-377/usb-YYYYMMDD-HHMMSS/\` folder. Original USB files remain unchanged.
- Any original player saves and SQLite database are backed up under \`runtime/jparris-377/save-backups/\` before installing/migrating the server.
- \`runtime/jparris-377/active.json\` records which engine, content and client the launcher should start.

See [upstreams.json](upstreams.json) for the *exact* compatible engine/content/client pins. They use:
- [LostCityRS/Engine-TS](https://github.com/LostCityRS/Engine-TS), branch \`377-wip\`;
- [LostCityRS/Content](https://github.com/LostCityRS/Content), branch \`377-wip\`;
- [LostCityRS/Client-Java](https://github.com/LostCityRS/Client-Java), branch \`377\`.

The public JoshRS repository **does not vendor the game content or redistribute it as JoshRS-owned material**. Lost City licenses its original engine code separately; original historical game assets are Jagex-owned and are not included in its MIT code license.

## Behaviour and safety

- Setup does **not** overwrite a copy of the USB or an existing \`.env\` file.
- It refuses to start a personalised USB copy if the source is incomplete; it does not secretly substitute a plain upstream world.
- If the USB lacks the modified Java client, it installs upstream Client-Java and **warns** that locally created map UI/custom client changes are not present.
- Missing engine/content/client files are not silently replaced inside a custom installation.
- The server starts with local game port \`52402\`, HTTP/update port \`8888\`, and Java client port offset \`8808\` for a **fresh** \`.env\`. Existing custom configurations are retained, and their game/web port relationship is validated.
- Setup performs SQLite migrations rather than database resets. It never runs \`sqlite:reset\` or wipes player saves.
- Clicking Play will not start another server if the expected TCP port is already in use. It does not kill other Node or Java processes.
- Windows PowerShell windows display server logs and the Java client. Stop the server gracefully with **Ctrl+C** in its window, rather than force-killing the process.
- One-click setup is a **local desktop workflow**, not a remote mobile-browser server. The Java 377 client is not an Android browser client. Making it remotely accessible requires a separate secure network setup and mobile-compatible client.

## Troubleshooting

- **Windows SmartScreen / execution policy:** run the extracted scripts directly from a folder you control; do not use random mirrored downloads.
- **Missing Node/Java/Git:** use the setup installer prompts and reopen the terminal if the new PATH is not visible. Microsoft recommends JDK 21 with WinGet.
- **Wrong USB copy:** if the original \`engine/package.json\`, \`src/app.ts\`, \`src/engine/World.ts\`, and \`content/scripts/\` are not present, choose the correct USB location. If the only copy available is an incomplete Google Drive directory tree, the customised world cannot be restored yet.
- **Game server fails at startup:** inspect the separate server PowerShell window. The initial engine content/cache build can perform substantial work. Do not assume an open TCP port proves gameplay works.
- **Unable to log into your existing character:** check that the source USB snapshot includes \`engine/data/players/main/elrothiro.sav\` **and** the matching \`engine/db.sqlite\` account database. Missing either can prevent a faithful save/account restoration.
- **Custom changes missing:** upstream repositories supply only vanilla revision-377 code. The USB copy must contain your modified Lua/Luna logic, teleport/map code, custom launchers and any other development edits. The clean upstream build cannot regenerate them.
- **Browser download cannot play 377:** this revision is Java-only in the checked upstream set. Do not confuse it with the separately hosted 274 browser game.

## Verification limitations

GitHub can run a static PowerShell syntax/manifest check. Actual Windows engine installation, Gradle build, Fedora save restoration, game login and interactive client rendering require a real Windows test machine and are **not claimed as completed** by this source-only change.

# JoshRS personalised-world portability: Step 1

This is a **read-only inventory**, not yet a backup, sync or universal installer.
The real Windows JoshRS 377 world lives in gitignored runtime/jparris-377/, not in the GitHub ZIP.

## One-click on JParrisDesktop

1. Find your existing installed directory, usually C:\JoshRS-Launcher\JoshRS-main.
2. Do **not** delete, replace, re-extract over or move its runtime/ folder.
3. Update the launcher source safely, or copy these two files from the GitHub main branch into that installation:
   - JoshRS-Check-My-World.cmd
   - tools/portable-world/audit.mjs
4. Double-click JoshRS-Check-My-World.cmd. Node.js 22+ is needed (normal Windows setup uses 24+).
5. Open Documents\JoshRS-Exports\<timestamp>\SUMMARY.txt, then provide only inventory.json for comparison.

The inventory can be generated while the game is running. It inspects allow-listed source and asset filenames, sizes and SHA-256 hashes from the engine, content and Java client selected by active.json. It ignores players/, .sav, db.sqlite, .env, private/secret paths, raw caches, build directories and generated outputs. It never reads save or database contents, uploads anything, changes code, stops the game, or claims a working backup. It reports only relative source paths, not local absolute paths.

If a clean upstream baseline is available, the report lists added, changed and missing paths, but the baseline's commit has **not** been verified against the pinned revision. If the baseline is absent, it reports that honestly.

## For command-line usage

    node tools/portable-world/audit.mjs --root C:\JoshRS-Launcher\JoshRS-main

Advanced testing allows --active-file, --output, --baseline-engine, --baseline-content, --baseline-client.

Run tests:

    node --test tools/portable-world/audit.test.mjs

## Required next stages

Review inventory against the pinned original sources and repo, then create and test licence-cleared source patches for GitHub. Create a separate **offline consistent encrypted backup** of the character saves, complete player state, database (including SQLite WAL when present), local configuration and permitted binary assets. Verify a disposable restore and actual game login without overwriting the original. Only then complete Windows, Linux and macOS installers and genuinely test those operating systems. A clean GitHub checkout alone is not equivalent to the personalised world.

Never upload passwords, .env, account databases, character saves, game caches, private keys or unreviewed third-party assets to public GitHub.

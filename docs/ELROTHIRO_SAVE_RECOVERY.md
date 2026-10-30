# Protecting Elrothiro's original JoshRS 377 save

**This is a private desktop backup and recovery check. It does not publish, restore or migrate your character automatically.**

## One-click offline protection on JParris Desktop

1. Use the latest full JoshRS source directory **without replacing or deleting** the existing `runtime/jparris-377` contents. If you use Git, pull normally, but inspect any local edits before updating.
2. In the game, log out Elrothiro and **gracefully stop** the JoshRS server. The tool refuses an online backup when either game or web port is listening.
3. Double-click `JoshRS-Backup-Elrothiro.cmd`.

This runs `deploy/jparris-windows/Protect-Elrothiro.ps1 -CreateBackup` and:

- Reads `runtime/jparris-377/active.json` to select the **actual active** engine.
- Refuses to proceed if `data/players/main/elrothiro.sav` is missing or unexpectedly small.
- Independently checks revision-377 magic `0x2004`, save format version up to 7 and the original engine's final CRC-32.
- Displays total skill XP and saved playtime field to help compare candidate snapshots; does not treat those as definitive proof of the latest quests/items.
- Inspects local SQLite using Node 24's read-only SQLite module, checks `PRAGMA quick_check` and warns if the Elrothiro login record does not exist. **No password is printed.**
- Invokes the existing offline backup routine to copy **all** player saves plus `db.sqlite`, `db.sqlite-wal`, `db.sqlite-shm` when present.
- Records a separate SHA-256 manifest and verifies source-vs-copy and backup-vs-manifest hashes. Refuses to certify a changed or incomplete snapshot.
- Keeps backups under the private `runtime/jparris-377/save-backups` directory. It never overwrites player saves, repairs the database or changes account details.

If the local account database is missing or has no Elrothiro account record, **do not guess credentials or replace the database with an older empty copy**.

## Read-only check

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\deploy\jparris-windows\Protect-Elrothiro.ps1"
```

## Compare a recovered candidate to the active save without restoring it

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\deploy\jparris-windows\Protect-Elrothiro.ps1" -CandidateSavePath "D:\PrivateBackup\recovered-elrothiro.sav"
```

The candidate must pass CRC. The tool reports byte identity or the XP/playtime differences and does **not** install either file.

## Verify a previously created private snapshot

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\deploy\jparris-windows\Protect-Elrothiro.ps1" -VerifyBackup "runtime\jparris-377\save-backups\manual-YYYYMMDD-HHMMSS-NNNNNNN"
```

Only backups with `integrity.json` pass the independent SHA-256 test. Older backups are not assumed corrupt but are marked **unverified** until independently checked.

## Never restore directly into a running world

The **character save** and **account login database** are separate. A valid save with no matching database account can be structurally healthy yet unusable for login. All recovery actions should first be tested in a disposable clone of the engine/content/database with a separate test port. Do not overwrite an existing Elrothiro save, automatically register accounts or copy old SQLite over a newer production database.

## Browser / Android goal

The public `joshrs.vercel.app` site is not the personalised JoshRS 377 server and holds no Elrothiro save. Existing experimental `tools/web377-bridge` only forwards WebSocket bytes to TCP; it does not translate the Apollo login protocol to Lost City 377 or prove a real login. For real browser play, that compatibility and secure remote transport must be implemented and tested **against the active desktop server**, preserving its player and account storage.

Never upload account files, backups, RSA keys, private web endpoints, player saves or screenshots containing account credentials to public GitHub or a publicly linked Drive folder.

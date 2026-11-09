# JoshRS -> RS-SDK patch compatibility audit

**Safe default: report only.** The Fedora RS-SDK game on web port 8890 and game port 43595 is a separate, older LostCity-derived revision from JoshRS' native 377 world (usually 8888/52402). Its world configuration, item/varp definitions and RuneScript may differ. A patch that passes `git apply --check` is **not** certified compatible or safe to deploy.

This tool scans every `.patch` under `content-patches/` plus the historical `tools/rs-sdk-quests/patches/` folder, and inventories source files under `content-patches/rs377/scripts/`. It reports each patch as:

- `already-applied-hunks`: identical reverse hunks found in RS-SDK; semantic equivalence **not** established.
- `hunks-appear-applicable`: a forward `git apply --check` passes, but it **still requires manual revision/ID/script/compiler review**.
- `requires-manual-port`: conflicting, missing, engine/SDK-specific, or otherwise not directly compatible.

It does **not** auto-apply any files, migrate an account database, restart services, connect bots, or change Git remotes. The one patch at `content-patches/jimmy-dev/patches/0001...` is included, alongside the 33 numbered revision-377 patches, rather than assuming the latest reports cover every fix.

## On Fedora, while all four bots remain active

Use the **JoshRS clone** as the source and the existing RS-SDK checkout as the read-only target. These commands do not operate on the remote `MaxBittker/rs-sdk` repository:

```bash
cd ~/dev/JoshRS-pilot-ZEen8Ygq
git fetch origin main
# If this checkout already contains the bridge script:
node tools/rs-sdk-patch-bridge/audit.mjs --sdk "$HOME/dev/JoshRS/lostcity377/engine/rs-sdk"
# Otherwise run it from a fresh JoshRS main worktree (instructions below).
```

To create a shareable JSON report **in JoshRS, not in RS-SDK**, from the JoshRS checkout:

```bash
git -C ~/dev/JoshRS-pilot-ZEen8Ygq worktree add -b review/rs-sdk-compatibility-20261109 ~/dev/JoshRS-sdk-compat-review origin/main
cd ~/dev/JoshRS-sdk-compat-review
mkdir -p reviews/rs-sdk-compatibility
node tools/rs-sdk-patch-bridge/audit.mjs --sdk "$HOME/dev/JoshRS/lostcity377/engine/rs-sdk" --json > reviews/rs-sdk-compatibility/fedora-report.json
```

Read the JSON before sharing. It contains relative patch paths and Git commit IDs, not credentials or bot databases. Commit the report on a new JoshRS review branch and push to **Parris-Tech-Services/JoshRS**, never from within the MaxBittker RS-SDK checkout:

```bash
git add reviews/rs-sdk-compatibility/fedora-report.json
git diff --cached
git commit -m "Report native 377 patch compatibility with live Fedora RS-SDK sources"
git push -u origin review/rs-sdk-compatibility-20261109
```

If the local JoshRS checkout is concurrently being edited by an agent, use a separate worktree instead of switching that checkout's branch. Avoid committing or uploading `bot.env`, passwords, cookies, `db.sqlite*`, player saves, or private crash dumps.

## From audit to patched RS-SDK world

1. Review the audit and select a *specific* compatible fix (for example, Bedabin Fighter Talk-to), rather than applying all 377 scripts unchanged.
2. Make an isolated branch or **disposable clone** of RS-SDK engine/content; port the fix to that revision's actual loc/NPC/varp IDs and quest steps. Retain attribution and licences. Put the adapted **diff** under a dedicated JoshRS `content-patches/rs-sdk/` directory, not in MaxBittker's upstream.
3. Verify the native RS-SDK `bun run build`, bots' actual NPC/quest interaction and quest-point/XP/save-relogin results on the disposable world. Ensure no duplicated handlers or changed quest prerequisites. Do not copy the 377 `db.sqlite` or player saves into RS-SDK.
4. Arrange downtime; pause and checkpoint each of the four bots, log them out, gracefully stop the RS-SDK **game engine** while preserving the separate 377 service; back up its engine content, packs, SQLite database (with WAL/SHM handled consistently while stopped), and player saves. Avoid resetting/migrating DB without a separate reviewed schema plan.
5. Apply the reviewed, tested RS-SDK-specific patch bundle to the **local** RS-SDK engine/content (never `git push` to `MaxBittker/rs-sdk`). Rebuild, check in-game effects and relog, restart bot controllers, and monitor errors. Roll back on failure.

The **JoshRS revision-377 unified updater is not an RS-SDK installer**, even if a hunk looks applicable. Its build, backup and port assumptions are different.

## Developer checks

```bash
node --test tools/rs-sdk-patch-bridge/audit.test.mjs
```
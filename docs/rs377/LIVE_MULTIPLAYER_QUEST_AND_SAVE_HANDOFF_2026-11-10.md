# JoshRS 377 — live multiplayer quest and save handoff (10 November 2026)

## Provenance and limits

This is a durable **human-supplied Claude Code summary** from JParrisDesktop, not a repeatable full independent audit. The original Claude local `quest_audit.ps1`, `quest_saves.ps1` and CSV outputs were reported to live in a **temporary scratchpad outside GitHub**. Their bytes and rows have **not been copied into this repository**; an agent with local access must inspect and migrate only non-sensitive audit tools and redacted results. Do not claim this document contains the missing local results.

## Live world (not modified by this handoff)

- Running revision 377 (Windows) in `runtime/jparris-377`, separate from Android revision 274 and Fedora RS-SDK. The user showed **Elrothiro and Sylvie in the game simultaneously** and a trade interaction; this is proof of a shared session, not of every game mechanic.
- Claude reported pinned Lost City `Engine-TS` **`b5ac859b47915afb545e60e4c1208f25d43cb3fb`**, `Content` **`44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`** with local changes. GitHub's 377-wip heads matched those pins when independently checked 10 November. Updating the **same upstream branch** does not yield new quests.
- Active compiled `engine/data/pack/server/script.dat` was observed at **6,614,323 bytes**, last modified **8 November 2026 at 9:20:13 PM (Windows local time)**. A source directory or script string is not proof of a compiled playable quest.

## Quest audit — Claude-reported, not independently replayed

Claude described a **104-quest inventory**: **1 quest verified complete in a save** (Rune Mysteries), **14 started** by Elrothiro, approximately **44 other Lost City source quests not independently playtested**, **25 local AI-written imports compiled but never played**, and **20 missing**. Treat these as reported category counts rather than a final complete 104-row data export. Their categories and source evidence need reconciliation with the local CSVs and the owner's 88-quest checklist. The Windows source-directory list had **88 `quest_*` folders**, plus an Abyss miniquest; different counting methods must not be conflated.

Claude recommends first trying **Cook's Assistant** on ordinary human accounts and independently checking start, interactions, completion, journal, rewards, and persistence. Older Fedora RS-SDK bot completion evidence uses a different implementation and cannot be promoted automatically to Windows rev-377 verification.

## Observed interaction blocker

User clicked a ladder in Falador and received **"Nothing interesting happens."** Precise loc ID and position **not yet captured**. Read-only identification first, isolated reproduction second, fix/test from a separate worktree third. Track alongside Fedora bot findings in [issue #293](https://github.com/Parris-Tech-Services/JoshRS/issues/293). Do not guess a staircase or teleport live characters to diagnose it.

## Save freshness — verified source mechanism, not live execution proof

Pinned upstream `World.ts` defines `PLAYER_SAVERATE = 1500` and `TICKRATE = 600` milliseconds, then periodically calls `savePlayers()` to dispatch `player_autosave` for online players. The nominal interval is **15 minutes**, but a periodic timer does not prove successful writes to disk on this desktop. A last-modified time of 2:14 PM alone does **not** establish a save defect. Stale saves for offline accounts are expected.

A **read-only** helper is available at `tools/rs377-saves/check-autosave.mjs`. From the JoshRS repository root on JParrisDesktop, with Node.js installed, execute:

```powershell
node .\tools\rs377-saves\check-autosave.mjs elrothiro sylvie
```

It inspects only the installed engine path from `active.json` and target `.sav` file metadata; no SQLite, save bytes, live processes, ports or game files are changed. It reports an older-than-20-minute timestamp as an **investigation flag**, not proof of a broken autosave. If players remain online and timestamps do not advance across multiple full intervals, inspect read-only engine logs and the `player_autosave` worker path. Never test a reset/restore against running saves.

## Agent next steps

1. Preserve the live Elrothiro/Sylvie world; no live restarts, new bots, source/cache modifications or database writes.
2. On JParrisDesktop, inspect Claude's temporary `quest_audit.ps1`, `quest_saves.ps1` and CSV reports; check for sensitive values, then move the **tools and redacted summaries** to appropriate tracked repo paths. Do not upload player saves, personal paths, DB contents or account secrets.
3. Run the read-only save-freshness helper after a normal 15-minute tick period; verify timestamps **and** worker/server log messages, separately from actual save serialization checks on a disposable copy.
4. Independently reproduce and fix the Falador ladder in an isolated 377 world; prepare deployment for a later explicit downtime window, with verified offline backup and rollback.
5. Preserve exact `SCRIPT / NPC / LOC / revision / evidence / tested` states for each of the 104 quest rows; do not claim completion based on directories, compile, or prompts.

**Status when authored:** durable report and helper created; no live world, user save, gameplay or quest fix changed. Windows execution of the helper and full Claude audit-data migration have not yet been verified.

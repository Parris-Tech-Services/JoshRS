# JoshRS → RS-SDK compatibility audit (9 November 2026)

**Target:** MaxBittker/rs-sdk upstream at `2ec1a4e7f7e64d88a909da03f4503cc577b25406` (public source only).
**JoshRS:** `856e3f919a7fe8c61f0a8add52fdc660e632cb28`.
**CI:** [JoshRS-to-RS-SDK audit run](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42570843373).
**Raw report:** [JSON artifact](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42570843373/artifacts/13653052658).
**Safety:** automated compatibility audit only, **zero patches installed**, no live accounts or bot activity accessed. The public RS-SDK checkout is not identical by proof to the ongoing Fedora 8890 world.

## Inventory

| Scope | Matching reverse hunks | Appears syntactically applicable | Manual port required |
| --- | ---: | ---: | ---: |
| 33 native revision-377 patches | 10 | 4 | 19 |
| Jimmy's Bedabin Fighter NPC patch | 0 | 1 | 0 |
| 11 older bot/script patch files | 0 | 0 | 11 |
| **Total** | **10** | **5** | **30** |

The content-source bundle has **101 files**: 100 absent from public RS-SDK source and one different; none byte-identical.

### Reverse hunks match upstream (review before claiming equivalent)

Native patches: `0008` placeholder varps, `0015` Rag & Bone Man boiler persistence, `0016` Fortunato vinegar shop, `0025` Barcrawl guard/gate/pricing, `0028` Cook's range item use, `0029` quest journal registrations, `0030` Barcrawl restored card/scorpion start, `0031` Mort'ton quest points, `0032` Demon Slayer keys/boss gates, `0033` Romeo & Juliet item/reward guards.

This only means the current source matches the reverse patch context. It does **not** prove that the historical gameplay behaviour is identical, all dependencies exist, or that Fedora's local version has these changes.

### Forward hunks appear applicable (port candidate, not install-ready)

- `content-patches/jimmy-dev/patches/0001-bedabin-fighter-talkto.patch` — previously tested by the Jimmy-dev bot in the running RS-SDK world; check local source first for the already-added trigger.
- `rs377/0010` — Mort'ton Tarromin serum.
- `rs377/0018` — Swan Song Wizard Frumscone.
- `rs377/0021` — One Small Favour / Yanni quest start.
- `rs377/0027` — Rag & Bone Man 35 NPC quest-bone drops.

For each, verify actual NPC/item/varp IDs and engine script compatibility and compile in an isolated checkout. A green `git apply --check` result is only syntactic.

### Manual ports

The other 19 native revision-377 patches have conflicting or missing hunks in upstream RS-SDK. All 11 historical `tools/rs-sdk-quests/patches/*.patch` include file creation/deletion and must be reviewed rather than assumed portable. The 101-source-file content bundle must be handled per quest, **not** bulk-copied into a different revision.

## Deploy sequence for Fedora 8890 (NOT EXECUTED)

1. Run `node tools/rs-sdk-patch-bridge/audit.mjs --sdk "$HOME/dev/JoshRS/lostcity377/engine/rs-sdk" --json` using the current JoshRS checkout to inventory the **actual live SDK source**. Keep all four bots running during this read-only check.
2. Save and review the report **in the JoshRS repo**, not `MaxBittker/rs-sdk`. Compare local uncommitted changes, current engine config and live quests.
3. Port selected fixes on a disposable RS-SDK clone/branch and retain the adapted patches under JoshRS `content-patches/rs-sdk/`. Never directly run the **377 unified updater** against the SDK world.
4. Build the SDK world using `bun run build`, then play through affected quests on disposable bots. Assert original quest-state transitions and persistence after relog. The 377 world and RS-SDK's account DB and saves remain independent.
5. Only after successful tests, checkpoint and log out the four active bots; gracefully stop **the RS-SDK game process**, preserving JoshRS 377 processes. Back up RS-SDK source, compiled packs, player saves, SQLite and WAL/SHM in a consistent offline snapshot.
6. Apply only the tested RS-SDK-specific fixes; rebuild, restart, validate original four accounts, quest points and persistence, and resume agents. Restore backup if any verification fails.

**Not done:** no native RS-SDK source changes applied, no Fedora audit output received, no local/test game build or quest regression verification, no restart. This audit is a first compatibility gate, not patch deployment.

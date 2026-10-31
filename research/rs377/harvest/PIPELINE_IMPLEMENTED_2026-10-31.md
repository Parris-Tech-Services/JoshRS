# JoshRS 377 source harvesting — implemented metadata pipeline

**31 October 2026. Scope:** personalised revision-377 research and original-content preparation ONLY. **Not an asset importer, server installer or a claim of functional NPC/quest/map content.**

## New working components

| File | Action | Safety boundary |
| --- | --- | --- |
| [factory.py](../../../content-factory/factory.py) | Owns existing GitHub tree cursor/pack work queue; resolves **exact pinned** Lost City engine, content and client commits; now offers \`--source-metadata\` and \`--source-compare\` | No source blobs, binaries or Jagex assets downloaded |
| [harvest_sources.py](../../../content-factory/harvest_sources.py) | Adds bounded **GitLab 2009Scape**, **OpenRS2 377 cache metadata** and **Hugging Face knowledge-dataset metadata** reads; saves resumable GitLab keyset cursor | HTTPS hosts allowlisted, response capped, no API credentials, no cache downloads, blocked providers reported rather than faked |
| [sources.json](../../../content-factory/sources.json) | Adds **OSRSReboxed**, **OpenRSC** and **RuneWiki RS-DataAPI** as metadata-only GitHub research sources, using existing GitHub scanner | All third-party rights remain unreviewed; later-era IDs not portable |
| [harvest_match.py](../../../content-factory/harvest_match.py) | Exact pinned path/blob comparator, full-tree completeness flag and source-only classifications, plus independent original dialogue branch graph validator | No name-based ID mapping, no missing-feature claim from source differences, no auto deployment |
| [harvest_evidence.py](../../../content-factory/harvest_evidence.py) | Explicit rev377 candidate stage / rights / tests gate | This is **declaration validation**, not proof that the live world works |
| [audit_dispatch.py](../../../content-factory/audit_dispatch.py) | Read-only three-NPC Varrock source trigger and optional compiled script-pack checksum diagnostic | Logs only booleans/hash; cannot establish that running Java client loaded the pack |

The [three-NPC source-trace ledger](VARROCK_NPC_SOURCE_TRACE_2026-10-31.json) remains the grounded first candidate batch: Reldo, Juliet and Romeo. All already have pinned \`[opnpc1,...]\` script handlers; their real Java-client behaviour remains **unverified**. Agent 4's public report at [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35) says multiple headless trigger tests pass but the actual active server pack is older than current on-disk changes. Don't author replacement dialogue until the dispatch or pack regression is ruled out.

## How to run

All commands run locally against source-only checked-out JoshRS, never against the active production game directory.

\`\`\`bash
# Entire existing pipeline + bounded metadata scan and pinned source match:
python content-factory/factory.py --live --source-metadata --source-compare --metadata-pages 2

# Small independent metadata-only run (GitLab keyset cursor, OpenRS2, HF):
python content-factory/harvest_sources.py --pages 1

# Offline comparison of the existing generated candidate catalogues:
python content-factory/harvest_match.py

# Local pinned-content read-only diagnostic; use a disposable matching content checkout:
python content-factory/audit_dispatch.py --content /path/to/disposable/pinned-377/content

# Test new and existing safety functionality without network:
python -m unittest discover -s content-factory/tests -v
\`\`\`

Do not commit or post source diagnostics captured from the personalised runtime, player saves, local credentials, IPs or private Drive filenames. Agent 3 should provide a sanitised handoff statement referencing only accepted build identities and test outcomes. \`audit_dispatch.py\` optionally hashes \`--script-dat\` and \`--script-idx\`; it never reads saves.

## Evidence and checkpoint format

\`content-factory/generated/\` contains provenance-first **non-executable** outputs:

- \`state.json\`, \`packs/*.json\`: existing GitHub cursor and per-source candidates.
- \`pinned-377-index.json\`: complete *read-only* path→Git-blob manifest from the exact pinned Content commit; only stored when the recursive tree is not truncated.
- \`source-metadata-state.json\`: provider source revision, bounded candidate paths/identities and GitLab keyset continuation. Successful provider checkpoints remain intact when another source fails.
- \`source-metadata-report.json\`: per-source \`metadata_only\` or \`blocked\`, complete/incomplete and candidate counts.
- \`source-comparison.json\`: exact pinned file presence / blob-equality vs cross-era research. If the full pinned tree was unavailable, results explicitly say \`baseline_complete=false\`; all nonmatches are \`unmapped_partial_inventory\` and **never confirmed missing**.
- \`agent-work-orders.json\`: existing rotating queue; agents still must independently verify gap, rights, compiler, actual gameplay and persistence.

The GitHub content-factory workflow now checkpoints on \`21 * * * *\` (UTC), uses the existing job/concurrency group and tests before writes, and only commits metadata plus original authorised content specifications on main. The *ChatGPT hourly task* remains a separate contributor and should use these generated checkpoints when available rather than automatically touching the game or assuming the CI run actually published a new patch.

## Current source routes and the limitations

**GitHub (existing):** GitHub commit + recursive tree metadata; pin exact Lost City 377 SHA and blob identities. The 377 source defines numerous canonical NPC/loc/item/quest routes; source code existence does not prove live server loading.

**GitLab (new):** [2009Scape Server](https://gitlab.com/2009scape/2009scape), \`GET /api/v4/projects/2009scape%2F2009scape/repository/commits/master\`, then \`GET .../repository/tree?pagination=keyset&recursive=true&per_page=100&ref=<SHA>\`. Consume provider \`Link\` next-page token with an exact same-host/path check. GitLab documents [keyset repository-tree pagination](https://docs.gitlab.com/api/repositories/). 2009Scape is later-era and AGPL-licensed: no direct software or game-text copy into JoshRS. A partial cursor is **not** a complete inventory.

**OpenRS2 (new):** [archive API](https://archive.openrs2.org/api) JSON \`/caches.json\`; locate **exact cache ID 2696** and allowlist only public id/game/build/time fields. Cache completeness proves neither gameplay nor rights; binaries/ZIPs are excluded. If provider schema, access or response cap differs, the adapter reports \`blocked\` instead of inventing data.

**Hugging Face (new):** [2009Scape dataset card](https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data) and public dataset API metadata (revision and safe source/README filenames only). No SQLite/parquet/game-data download. Pipeline or dataset-card licence is not an automatic game-data licence.

**Other GitHub metadata sources (new registry additions):** [OSRSReboxed](https://github.com/RSPSApp/osrsreboxed-db) (shop/NPC schema shape), [OpenRSC](https://github.com/Open-RSC/Core-Framework) (historical quest flow structure), [RuneWiki API](https://github.com/RuneWiki/RS-DataAPI) (tooling). These use **the same** factory cursor and queue, not a second importer. Other already registered sources include 2006Scape, Luna, RuneScriptTS and historical Lost City branches.

**Rights:** [Jagex Fan Content Policy §6.1.3](https://legal.jagex.com/docs/policies/fan-content-policy) excludes game software and private servers from its standard fan-content permission. These tools handle allowable public *references* and original program logic, not Jagex assets, dialogue, clients, binaries, music or map packs. Rights to actual integration need separate review and any required authorisation.

## What is automatically accomplished vs withheld

| Outcome | Automatic | Held for agents |
| --- | --- | --- |
| Public tree/commit metadata and bounded source checkpoints | Yes, when API access and GitHub Actions are available | Provider auth errors or incomplete listings stay blocked |
| Exact pinned 377 paths and blob change comparisons | Yes, when complete tree available | Actual user's active runtime may differ |
| Detect duplicate reference paths and unsupported modern-only data | Yes, metadata-level | Entity ID/quest-stage mapping requires source/runtime evidence |
| Original dialogue graph lint (unique greetings, reachable choices, exits) | Yes, for supplied *original* non-installable proposals | No speculative NPCs/IDs; no mass-script insertion |
| Compile pinned content in disposable CI | Existing workflow (independent) | CI does not confirm installed active pack |
| Generic NPC greeting root-cause and fix | Read-only diagnostic available | **Agent 1** owns trigger/morph/category/fallback; **Agent 3** owns loaded pack, client and relog |
| Map ZIPs and quest mechanics | Metadata references only | Yanille/Edgeville loc ID problems blocked; quest progression/player verification needed |

## One-vertical-slice hourly playbook

1. Read Agent 4 [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35) newest report and [#36](https://github.com/Parris-Tech-Services/JoshRS/issues/36), then compare pinned index, latest metadata checkpoint and current code ownership.
2. Continue the same area (Varrock first, max 3 existing NPCs) until each source handler is associated with a **specific** observed action, category/morph, runtime pack identity or explicit unknown. Avoid routine rewording of working canonical NPCs.
3. Harvest a bounded batch **without binaries**, diff by immutable source revision and hash, and label missing IDs/paths unknown. Block on privacy and licence.
4. If a gameplay gap is truly confirmed and rights permit, draft an *original* branching proposal and tests. Otherwise issue a reproducible dispatcher/pack handoff, not generic prose.
5. Run local Python unit tests, ledger validation, pinned disposable compile if a compatible native patch exists, and check CI on the actual commit.
6. Link one substantive file/validator or verified finding to #36 with exact stage (SOURCE-TRACED, STATIC-VALIDATED, COMPILED-DISPOSABLE, CLIENT-VERIFIED, PERSISTENT-PLAYABLE). Agent 1 integrates, Agent 3 backs up/QA-tests, Agent 4 reviews.
7. Next hour resumes the checkpoint. Don't count file totals as game completion or claim deployment automatically.

**Open blockers:** no authenticated direct control of JParris Desktop's active Java client from this GitHub-only lane; no verified runtime matching; no confirmed unscripted 377 NPC IDs; no authorisation to transplant game assets or protected text; CI compile success != gameplay.

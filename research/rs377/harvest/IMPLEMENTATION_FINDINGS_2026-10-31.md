# 31 October 2026: rev377 source-harvest investigation and first executable evidence gate

**Scope:** JoshRS personalised Lost City 377, not Woodlands. **Status:** SOURCE-TRACED + METADATA VALIDATOR TESTED. **No client, runtime, save, cache, or deployment changes.** Follows [harvest research](../CONTENT_HARVEST_DEEP_RESEARCH_IMPLEMENTATION_2026-10-31.md), [source catalogue](HARVEST_SOURCE_CATALOGUE_2026-10-31.json) and [hourly SOP](../HOURLY_CONTENT_PRODUCTION_PIPELINE_2026-10-31.md).

## What this run added

- [Varrock three-NPC evidence ledger](VARROCK_NPC_SOURCE_TRACE_2026-10-31.json) pinned to Lost City Content commit **44eab09081ef0f6c5f3eaabd1897a588ad7d9e50** and individual Git blob SHAs. All three cases are **existing_unverified / source_traced**, not missing, newly authored, or playable.
- [Fail-closed candidate validator](../../../content-factory/harvest_evidence.py) with seven negative and positive [unit tests](../../../content-factory/tests/test_harvest_evidence.py): duplicate key, duplicate ID, unpublished private links, invented modern IDs and unsupported promotion without real checks are rejected.
- The validator supplements existing **content-factory/factory.py** metadata scans; it neither imports remote code nor modifies **native377.py**, the pinned compiler, Agent 1-owned scripts, Agent 2 bot code or Agent 3 live QA. Source metadata is not equivalent to a missing feature.
- Run locally: \`python content-factory/harvest_evidence.py research/rs377/harvest/VARROCK_NPC_SOURCE_TRACE_2026-10-31.json\`; tests: \`python -m unittest discover -s content-factory/tests -p 'test_harvest_evidence.py' -v\`.
- Local standalone result on 31 Oct: **7/7 PASS**, validator returns **VALID: 3 source candidates; no runtime or gameplay certification**. Repository CI result is separate and must be checked before claiming a successful GitHub build.

## First actual source-backed hub: Varrock

All below links refer to the same **exact pinned commit**; GitHub tree API returned **23,464 entries**, \`truncated=false\`. Blob IDs came from that tree and were cross-checked through pinned file reads.

| Existing NPC | Native 377 source, SHA prefix | Trigger and mechanics present | What is NOT established |
| --- | --- | --- | --- |
| Reldo | [area_varrock/scripts/reldo.rs2](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts/reldo.rs2), \`a3af9aea\` | \`[opnpc1,reldo]\`; occupation, lore, quest and trade conversation paths | Exact live spawn/ID, whether script pack or fallback loads |
| Juliet | [area_varrock/scripts/juliet.rs2](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts/juliet.rs2), \`510d1e77\` | \`[opnpc1,juliet_multi_visible]\`; branching by Romeo-and-Juliet quest stage with item handoff | Whether active modified server dispatches the correct quest-state branch |
| Romeo | [area_varrock/scripts/romeo.rs2](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts/romeo.rs2), \`b3209858\` | \`[opnpc1,romeo]\`; stage switch, choices, message exchange and quest progression | Actual live click, stage, compiled pack freshness, logout/relog |

The source evidence proves these **scripts exist**, not that the live player's specific generic NPCs are these three. The reporter did not provide NPC names or IDs for the generic greetings. These three are a safe comparison group because Agent 4's latest public report says Agent 1's **headless** NPC script-runner resolved Reldo and Juliet; this has not been repeated in the real Java client. Do not copy authentic dialogue into new files. Do not replace correct quest handlers with a universal greeting.

## Evidence-driven diagnosis handoff

1. **Agent 3 (read-only first):** fingerprint the truly active engine/content/client using \`active.json\` privately; record current pack build time and checksum, protect save/SQLite state, and establish whether these exact 377 NPCs are present in test world. Publish only sanitised pass/fail and target code SHA, never local private paths, raw data or account IDs.
2. **Agent 1:** for each reproducible NPC Talk-to click, trace the packet's selected option (e.g. \`OPNPC1\`), symbol and NPC morph, \`Player.ts\` \`multinpc\`/category dispatch, \`ScriptProvider.ts\`, compiled \`script.dat\`/\`script.idx\` and fallback selection. Compare **active pack** to the pinned source and Agent 1's modified-but-not-yet-live worktree. Determine whether generic greeting is intentional unscripted fallback, stale pack, trigger override, or quest-state branch before changing content. On a fixed source-only test, confirm the original script's distinct route without touching authentic dialogue.
3. **Agent 3:** run two or three **actual Java-client** conversations and correct conditional quest/merchant outcomes in an isolated verified world, then logout/relog for persisted quest stages as applicable. Never claim verified from opening a chatbox or from a headless mock.
4. **Agent 4:** compare evidence against [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35) and update on integration conflicts. This contribution does **not** overwrite or claim completion of Agent 1's outstanding food-consumption \`DbTable\` indexing failure, Agent 2's Luna work, or Agent 3's runtime checks.

**Current outcome:** source-traced = 3; confirmed missing = 0; original NPCs added = 0; copied assets/dialogue = 0; actual client tests = 0. No generic-greeting bug is claimed repaired.

## Fresh cross-project source findings and ingestion paths

| Route (priority) | Verified endpoint / source | Ingest only | Boundary / decision |
| --- | --- | --- | --- |
| P0 Lost City Content | GitHub commit API and recursive tree at pinned 377 commit; use blob SHA and path | Existing native \`.rs2\` and \`.npc\` identities, specific trigger names and semantic evidence | Already pinned is **not** missing; licence and item-specific rights review before reproduction |
| P0 owner's Drive snapshot | Connected owner's personal Drive \`lostcity377/content/scripts\` and \`maps\` folders visible in bounded folder listings on 31 Oct | Private folder/file revision and *private-only* equality checks against pinned/live fingerprint | Folder existence **not** parity; no private IDs or raw content in GitHub |
| P0 compiler | [RuneScriptTS](https://github.com/LostCityRS/RuneScriptTS): \`CompileServerScript\` takes explicit command/script/NPC symbols | API contract and pinned package/toolchain identity | Its contemporary compiler is not automatically compatible with JoshRS pinned code |
| P1 OpenRS2 | [cache #2696](https://archive.openrs2.org/caches/runescape/2696) plus [API](https://archive.openrs2.org/api) | Build=377, historical cache provenance and *metadata* only: 12/12 archives, 17,922/17,938 groups | 99.91% group coverage **not** 99.91% playable game; no binary/cache import |
| P1 2009Scape | [GitLab server](https://gitlab.com/2009scape/2009scape), README licence and area-oriented testing | Quest-state/test architecture, independent logic specification | AGPL-3; 2009 era ≠ May 2006 rev377; no code transplant |
| P1 OSRSReboxed | [RSPSApp/osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db) documentation | Schema for \`npcs-interactions.json\` option slots; \`shops-by-npc.json\` and \`shops-items-by-shop.json\` relationships | Modern OSRS IDs and dialogue transcripts are not rev377 historical evidence, not for copying |
| P1 2009 knowledge dataset | [Dataset card](https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data) | \`meta\`, \`entity\`, \`edge\`, \`canonical_id\`, version and source relationship modelling | Apache-2.0 pipeline != permission to redistribute underlying game data |
| P2 OpenRSC, 2006Scape, Luna, RS-DataAPI | Linked in [existing catalogue](HARVEST_SOURCE_CATALOGUE_2026-10-31.json) | Compare licence, era, mechanics and unit-test patterns only | Different engine/era; historical ID mapping and distribution need their own proof |

**Important policy:** [Jagex Fan Content Policy 6.1.3](https://legal.jagex.com/docs/policies/fan-content-policy) explicitly excludes making game software and private servers under its standard licence. Open-source implementation licence does not grant rights to Jagex game assets or quest/dialogue text. Public repository publication remains metadata, original validator and evidence documentation only; no original cache, sprites, maps or dialogue dumps.

### Adapter design for upcoming harvest cycles

Keep \`content-factory/factory.py\` as the sole discovery state/cursor owner. Additional **metadata-only**, opt-in adapters should normalise fields \`source_key, repo_path, source_url, source_commit, blob_sha, discovery_method, first_seen, last_seen, source_access\` and emit a bounded list to the **existing queue**; do not create another auto-installer.

- GitHub: \`GET /repos/{owner}/{repo}/commits/{ref}\` then \`GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1\`. Reject \`truncated=true\`, store tree SHA, cursor and blob identities. Only compare changed blob SHA, do not download unchanged trees or media.
- GitLab: \`GET /api/v4/projects/{urlencoded_project}/repository/commits/{ref}\`, then paged \`/repository/tree?recursive=true&per_page=100&page=N\` (follow provider pagination). Record access blocked on 401, 403, 429, network failure, unknown branch and incomplete pagination; do not silently claim full scan.
- Hugging Face: dataset card and file metadata only; pin dataset revision/content hash, read schema documentation and never fetch \`knowledge.sqlite3\` or game data automatically.
- Drive: authenticated per-folder metadata and file revision only; keep an owner-only private delta manifest outside public GitHub, require Agent 3 sanitised live match before classifying missing.
- OpenRS2: cache-list and metadata page only. Never fetch \`.dat\`, cache ZIP, keys ZIP or map ZIP into JoshRS or CI.

**Promotion contract:** \`source_traced -> gap_confirmed\` requires the exact 377 NPC ID, handler, observed runtime evidence, authorised rights and a real demonstrated gap; later stages require original authored pack, isolated static/native compile and Agent 3 client/relog results. The validator checks **presence and declared consistency of evidence**, not the authenticity of a human-provided \`verified:\` string. An Agy reviewer must still inspect the actual logs/tests before advancing a stage.

## Next independent bounded job

After Agent 3 provides the sanitised active-pack fingerprint, compare the three Varrock triggers to the **loaded** scripts and ask Agent 1 for one actual generic-greeting NPC with verified ID and option. If the fallback is overriding a working historical script, prepare an isolated **dispatch regression test**, not more dialogue. If it is truly unscripted, write a distinct original dialogue proposal and request per-NPC approval. Do not edit shared handlers in the content-preparation lane.

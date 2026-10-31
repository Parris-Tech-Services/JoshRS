# JoshRS source harvesting: deep research and implementation specification

**31 October 2026 • Owner:** ChatGPT hourly content contributor • **Status:** RESEARCHED + PREPARATION SPEC ONLY • **Scope:** private, personalised revision-377 game; do not confuse with the separate Woodlands project.

Companion machine-readable research-only catalogue: [12 verified discovery routes](harvest/HARVEST_SOURCE_CATALOGUE_2026-10-31.json). Existing content factory registry: [content-factory/sources.json](../../content-factory/sources.json). Existing hourly SOP: [HOURLY_CONTENT_PRODUCTION_PIPELINE_2026-10-31.md](HOURLY_CONTENT_PRODUCTION_PIPELINE_2026-10-31.md). Priority/handoffs: issues [#28](https://github.com/Parris-Tech-Services/JoshRS/issues/28), [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29), [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30), [#34](https://github.com/Parris-Tech-Services/JoshRS/issues/34), [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35), [#36](https://github.com/Parris-Tech-Services/JoshRS/issues/36).

## Verified starting point

- JoshRS upstream pins from `deploy/jparris-windows/upstreams.json`: Lost City **Engine-TS 377-wip @ b5ac859b47915afb545e60e4c1208f25d43cb3fb**, **Content 377-wip @ 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50**, and **Client-Java 377 @ 327880f6de74b40c420705bc42e4b34284885087**. Treat the *actual active Windows runtime*, which may diverge, as unknown until read-only fingerprinted by Agent 3.
- `content-factory/factory.py` already scans GitHub tree metadata incrementally with a cursor, pinned blob identities, candidate classification and an agent work queue. `content-factory/sources.json` already lists nine sources. **Extend this design; do not create a second competing importer or presume 'found' means 'missing'.**
- `content-factory/native377.py` generates only the explicitly authorised original Woodland Guide; it refuses speculative NPCs and duplicate merchant content. It is **not** an existing-NPC dialogue patcher. Do not loosen its permissions just to increase output counts.
- `tools/rs377-map-bridge/audit-and-stage.mjs` audits terrain/locs against matching packs and stages text-only map output. Its recorded Yanille candidate has 256 unsupported location instances (16 distinct IDs) and 7 trailing bytes; Edgeville has 266 (39 distinct) and 741 trailing bytes. **Neither candidate is installable.**
- The connected owner's personal Google Drive contains a `JoshRS/lostcity377` tree with `content/scripts/npc`, `content/scripts/quests`, `content/scripts/areas`, `content/maps`, and a separate earlier `lostcity289` tree, plus map-project references. Drive snapshot contents and branch parity must be verified; **private Drive URLs/IDs and private file contents must never be copied to public repo**.
- First reported player experience: many previously unscripted NPCs now all say identical generic greetings. Agent 4 reported source-versus-running-server divergence. Fix priority is *dispatch / packaging / fallback root cause* before authoring new words.

## 1. Exact external harvesting pathways and limits

| Priority | Source | How to discover | What to extract **for research only** | Gate for integration |
| --- | --- | --- | --- | --- |
| P0 | [LostCityRS/Content](https://github.com/LostCityRS/Content), pinned 377-wip | GitHub commit and recursive Git tree; compare baseline blob SHAs with new upstream; find `scripts/areas/`, `scripts/quests/`, `.npc`, `.loc`, `.obj`, `.rs2`; use `content-factory/factory.py` | Filename/path, commit SHA, changed scripts, possible missing hooks, original source licence per file | Source definition already in pinned engine is **not new**. Obtain rights for any actual text/code copied; avoid assets and original dialogue |
| P0 | Owner's connected Drive 377 snapshot | Drive connector folder listing + bounded reads; compare named config/script references and file revision with pinned Git and Agent 3 **private** active-source hash inventory | Private delta findings, current-vs-pinned conflict list, file identities/hashes | No public Drive IDs, save data or raw private scripts; local live source is authoritative only after Agent 3 checks active.json |
| P0 | [RuneScriptTS](https://github.com/LostCityRS/RuneScriptTS) + JoshRS verifier | Inspect package/compiler revision and symbol contract; use disposable CI runner and pinned engine scripts | Compiler/symbol/API compatibility and concrete compile diagnostics | Newer upstream may differ from old 377 engine; do not invoke as a drop-in without toolchain validation |
| P1 | [OpenRS2 377 snapshot](https://archive.openrs2.org/caches/runescape/2696), [API docs](https://archive.openrs2.org/api) | Read `GET /caches.json` and cache metadata; verify ID 2696 corresponds to 377, archive/group counts, hash/version metadata | Cache provenance and archive-completeness evidence only; source vs expected definition checks | Cache binaries/models/maps remain Jagex IP; **no automatic binary downloads to public repo or live server**. Cache fullness never proves server quest/spawn/dialogue functionality |
| P1 | [2009Scape GitLab server](https://gitlab.com/2009scape/2009scape) | GitLab repo/API commit and repository-tree listing; examine NPC/quest classes/JSON and contributor area-by-area process | Feature audit patterns, semantics and **independent** acceptance specs; release-era differences | Its AGPL-3.0 software is not a direct code drop into MIT project; 2009 IDs/requirements are not 377 |
| P1 | [OSRSReboxed structured data](https://github.com/RSPSApp/osrsreboxed-db) | Inspect `docs/npcs-interactions.json`, `docs/shops-by-npc.json`, `docs/shops-items-by-shop.json`, `docs/npcs-summary.json`, `docs/npc-dialogues.json` schema | **Only schemas/categories and research references** for menu slots, shop relationships, state coverage, dialogue tests | Modern IDs not rev377; do **not** copy NPC dialogue transcripts or redistribute wiki-derived text |
| P1 | [2009Scape knowledge graph](https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data) | Review dataset card/schema, `meta` build fields, `entity`, `edge`, `canonical_id`, `source_file`, game_version; optional private read-only SQLite with permission | Relationships and de-duplication model; stage-specific NPC/quest/shop graph query plan | Apache-2.0 applies to its tooling/pipeline; underlying game data has other terms. **No automatic transplantation** |
| P2 | [OpenRSC](https://github.com/Open-RSC/Core-Framework), [2006Scape](https://github.com/2006-Scape/2006Scape), [Luna](https://github.com/luna-rs/luna) | Pin exact commits; inspect quest-stage, shop, minigame and test structures via source review | Conceptual state machines, staged tests, previously overlooked mechanics | Different era/language; OpenRSC AGPL, 2006Scape GPL, compatibility & copying require separate rights assessment |
| P2 | [RuneWiki RS-DataAPI](https://github.com/RuneWiki/RS-DataAPI), RuneLite | Read API/tool source + usage limits and cache revision selection | Independent metadata tooling patterns, consistency checks, ID-matching heuristics | No proprietary sprite dumps, decoded game data publication or modern IDs asserted as historical |

Source and licence evidence: [OpenRS2 API](https://archive.openrs2.org/api); [OpenRS2 377 snapshot](https://archive.openrs2.org/caches/runescape/2696); [RuneScriptTS compiler](https://github.com/LostCityRS/RuneScriptTS); [2009Scape server](https://gitlab.com/2009scape/2009scape); [OSRSReboxed](https://github.com/RSPSApp/osrsreboxed-db); [2009 knowledge dataset card](https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data); [OpenRSC](https://github.com/Open-RSC/Core-Framework); [Jagex Fan Content Policy](https://legal.jagex.com/docs/policies/fan-content-policy). Confirm licence status **per file and data layer**: tool licence is not asset/text permission. Jagex policy §6.1.3 excludes private game servers/game software from the standard fan content permission; separate authorisation would be needed for such uses. Do not misinterpret public availability as redistribution authorisation.

## 2. Design: reusable harvest system without dangerous auto-install

**Bronze: discovery/provenance** (automatic and read-only)
- Source key, verified public URL, format/era, licence claims, source revision/commit, candidate path, git blob SHA, first_seen/last_seen, collection method, extraction policy, source freshness, no raw binaries.
- Batch scan using `content-factory/factory.py`, preserving cursors and not re-downloading an unchanged source. GitLab/Drive/Hugging Face adapters should emit the same **metadata-only** candidate fields; avoid full clones and broad file downloads when a tree listing suffices.
- Record `source_access=blocked` if auth/rate-limit/tool is unavailable, and fall back to current pinned source and lawful public documentation.

**Silver: canonical 377 matching** (automatic comparison, manual gap approval)
- Index the *exact pinned* 377 NPC, location, item, quest, map region and script symbols, and compare with Agent 3's sanitized live-runtime fingerprint. The pinned 377 source is **baseline**, not an import candidate.
- Match in this order: exact 377 symbol/type & ID; exact versioned source-path evidence; spawn/loc region + quest linkage; behavioural semantic match; uncertain cross-era candidates **remain UNMAPPED**. Never map by name or modern numeric ID alone.
- Classify each match as `existing_working`, `existing_unverified`, `dispatcher_or_pack_regression`, `missing_confirmed`, `modern_optional`, `rights_blocked`, `unknown`. Duplicate law/nature rune, mould, chisel, jewellery and shops are exclusion examples.

**Gold: legal original content and tests** (generated in isolated source paths)
- Prepare per-NPC **original authored** personality brief and conditional dialogue proposal only for demonstrated gaps. Check default route, `opnpc1`, category handlers, menu slots, morph/quest-state dispatch, expected UI output and whether the relevant compiled pack is actually live. Avoid rewriting authentic working NPCs.
- Quest state graph: start, tasks, inventory/skill gates, stage flags, choices, rewards, failure/retry paths, end state, save/reload assertions. A quest directory or journal is not completion.
- Map/region graph: square ID, NPC/loc definitions, spawns, collision/walk paths, doors/ladders, quest constraints, source and compatibility. Custom map ZIPs remain **quarantined until proven safe**.
- Generated artifacts must carry origin, provenance, target revision, rights clearance state, implemented_tested status and intended Agy owner. Do not auto-export third-party dialogue, models, caches, music or game assets.

**Promotion gate: supervised local-only integration**
1. Agent 1 requests or accepts a specific content patch, checks no other agent owns the file, and integrates in an isolated worktree; no blanket bulk edits.
2. Native 377 scripts compile with the pinned symbol tables; static tests enforce valid trigger bindings, IDs, branch/exit reachability, idempotence and non-duplication, quest flags and correct side effects.
3. Agent 4 reviews consistency and conflicts; Agent 3 verifies matching offline backups, disposable Java client talk/shop/quest/map interactions and logout/relog persistence.
4. Any possible live deployment must have clear content rights and a rollback; actual game installation is **never the default job of the hourly ChatGPT task**.

## 3. Per-resource, per-candidate schema / ledger contract

Proposed new report schema (do not confuse with `content-factory/sources.json`):
```json
{
  "schema": "joshrs-rev377-candidate-v1",
  "key": "source:path:rev:entity",
  "source": {"url": "public-source-url", "commit": "full-sha", "path": "repo-relative-file", "licence_review": "unresolved"},
  "target": {"revision": 377, "area": "verified-area-or-unknown", "entity_type": "npc|quest|loc|map|shop", "id377": null, "handler": null},
  "evidence": {"baseline_source": "source-ref", "runtime": "unverified", "issue": 36},
  "classification": "unknown",
  "original_addition": false,
  "stage": "discovered",
  "checks": {"rights": "blocked", "static": "not_run", "compiler": "not_run", "client": "not_run", "persistence": "not_run"},
  "handoff": {"owner": "Agy 1", "task": "investigate specific gap"}
}
```
Allowed stages: `discovered` → `source_traced` → `gap_confirmed` → `original_pack_prepared` → `static_validated` → `compiled_disposable` → `Agy_handoff` → `client_verified` → `persistent_playable`. Stages must not be advanced merely because a file exists, test-runner assertion passes, or an NPC starts a chat window.

## 4. Actual improvement to scheduled hourly process

Do **one vertical slice** each hour, from current evidence to a deliverable:
- Read #35 (latest Agy 4), #36 and previously prepared artifacts; check latest #28/#29/#30/#34 and the pinned source registry. Record prior cursor/checkpoint and choose a batch that no other agent is editing.
- Prefer a single **geographic hub** and a maximum of three *confirmed existing* NPCs, or one quest-stage transition, or one map-region data problem. Deepen the same batch across runs before starting another. Prioritise today's generic-NPC-greeting regression.
- Run source-specific metadata collection and SHA/rights/version mapping. Where possible emit a machine-readable candidate or an executable independent validator in a new isolated path.
- Analyse why a real gap exists. If it is a runtime dispatch / pack problem, hand the diagnosis to Agent 1 rather than invent dialogue. If source evidence and rights pass, prepare original compatible code/tests.
- Validate and publish exactly **one substantive deliverable** (candidate ledger, parsed source report, legal original dialogue tree, independent test, compatibility diagnostic). Record unavailable steps truthfully.
- Update #36 with sanitized one-paragraph status and links. Never post repetitive status without artifacts. Share precise Agy 1 handoff; Agent 3 owns actual playable confirmation.
- Mark what was **newly accomplished this run** vs already done; do not conflate file-count coverage, metadata count and player-verified gameplay. Keep the same hourly schedule unchanged.

Quality targets: zero accidental duplicate NPCs, zero unverified numerical ID imports, zero accidental map swaps, zero unauthorised asset distribution, no shared-file agent conflict, always one objectively checkable output when tools permit.

## 5. Priority investigation: duplicate 'Hello adventurer'

For up to three actual NPCs in the first verified hub:
1. Check active Java client's click option and text (Agent 3 evidence); inspect active content pack build timestamp and current script/engine code IDs privately.
2. Inspect pinned source and relevant Agent 1 script-runner test; determine whether default greeting is overriding valid per-NPC triggers, NPC morphs, category handler fallback, or a quest branch.
3. Record `npc_id377`, spawn/region, handler/script trigger, effect and source commit. If not proven, label UNVERIFIED rather than assuming.
4. Diagnose and propose a small dispatch/fallback correction **before** original writing; preserve existing canonical dialogue.
5. Only for genuinely empty NPCs, design distinct occupation/location-sensitive original text with branching choices where appropriate, no repeated universal greeting. Provide test cases: distinct lines across NPCs, each branch terminates, quest prerequisites and shop options preserved, no changed quest progression unintentionally.
6. Agent 1 integrates, Agent 3 plays and relogs. Do not claim completion based on CI or reports.

## 6. Research questions every future contributor must be able to answer

1. Which public source contains the **most applicable rights-cleared source code** for the exact missing 377 behaviour, and what exact pinned commit/path proves it?
2. How can that source be harvested incrementally (API/metadata, pagination, rate limits, snapshots, SHA, change detection) without downloading or redistributing prohibited assets?
3. Was the behaviour already present in pinned 377, the private Drive snapshot or customised active Windows runtime? If so, why isn't it visible?
4. What exact ID mapping / region / trigger / quest-state evidence supports a *rev377* mapping, not a later OSRS guess?
5. Is there a legally safe, original-code reimplementation or test specification? If rights are unclear, what metadata-only work can proceed?
6. Can an isolated pinned compiler/test runner demonstrate the patch without touching user saves or the live process? What is still untested?
7. Which Agy agent integrates, who validates, what rollback applies, and what exact GitHub issue/commit/test result records the handoff?
8. How do we prove genuinely better gameplay (branch depth, distinct personality, correct shops/quests, persistence) instead of just adding files/lines?

## 7. Standalone deep-research master prompt (copyable)

> You are a senior RuneScape historical-content preservation researcher, software supply-chain auditor, compiler integration engineer, and NPC/quest gameplay QA designer. Investigate how to reliably harvest source-compatible, rights-cleared NPC/dialogue, quests, shops, spawns, maps and their metadata for a customised Lost City 377-wip game, while protecting an active user's world. Begin by inspecting JoshRS's actual pinned 377 upstreams, the private owner-provided Drive source snapshots via authorised connector, the source registry, existing content factory, native-377 verifier, map-stage tool, Agent 4 reports and live source fingerprints that an authorised QA agent has recorded. Compare LostCityRS/Content, RuneScriptTS, OpenRS2 archive API, 2009Scape's GitLab implementation and structured community datasets, OSRSReboxed, OpenRSC, 2006Scape, Luna and RuneWiki API. For **each** source state exact link, file/API endpoints, revision/era, available formats, licence and rights boundaries, incremental harvesting approach, required authentication/rate limits, actual 377 mapping proof, potential gaps, compiler/engine adaptation, tests, and whether public repo publication is allowed. Distinguish client-cache assets from server-side dialogue, spawns, quest scripts and runtime state. Use a provenance-first multi-stage pipeline: discovery -> local 377 inventory -> source-match and confirmed gap -> original lawful content and isolated tests -> native compile -> Agy 1 integration -> Agy 3 client/relog verification -> evidence ledger. Prioritise the user's observed repeated generic NPC greeting, tracing dispatch and stale packs before writing any replacement dialogue. Do not assert missing functionality from filenames or add duplicate vendors/items. Create a prioritized, source-backed implementation register and one small validated, isolated deliverable for this run, with a concise GitHub handoff to Agy 1 and Agent 4. Treat unclear licences, copied dialogue, binary caches, map assets and public private-server distribution as hard blocks, not technical problems to bypass. Never change live saves/server or other Agy agents' owned files, never buy services and never draft/send email. Finish with EXACT source commit/path links, pass/fail/skipped test results, current stage and next independent task. Mark unknowns honestly.

## 8. What is and is not verified

**VERIFIED / observed:** public API/repo/dataset documentation and their source policies; JoshRS existing GitHub pinned upstreams, factory script/registry, map audit tooling, and listed private Drive folder structure; existence of Agent 4 reports and open workflow issues.

**NOT VERIFIED:** that these external sources are legally reusable as game content; that a 377 NPC is missing rather than masked by fallback; any automated downloader/importer for newly listed non-GitHub sources; validity of the local build against latest source changes; any source auto-merged into running game; full quest completion; any Windows Java client playtest. Proceed via small, reversible, evidence-based implementation batches.

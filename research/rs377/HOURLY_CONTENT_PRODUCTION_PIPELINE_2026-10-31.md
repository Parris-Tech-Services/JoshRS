# JoshRS hourly content production: source -> review -> staged handoff -> verified gameplay

**Date:** 31 October 2026 (Australia/Sydney). **Owner:** ChatGPT independent content preparation lane. **Queue:** [#36](https://github.com/Parris-Tech-Services/JoshRS/issues/36). **Agy oversight:** [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35). **Status:** planning and research contract; **NOT** proof of installed content, licensed distribution or a client test.

## Why this exists

Multiple existing NPCs reportedly changed from `No action available` to the same `Hello adventurer` greeting. Do not automatically add NPCs, patch the generic fallback, or invent "historically accurate" dialogue. First distinguish an **engine dispatch defect**, an **unscripted NPC**, an **intentional small talk NPC**, a **quest-state branch**, and a **content pack not loaded by the currently running world**. Agent 4's first report says the live server was running older packs than Agent 1's latest patches; GitHub content can be stale relative to the private machine.

## Existing tools to reuse; no paid tooling

| Existing component | What it actually does | Use / limitations |
| --- | --- | --- |
| `content-factory/factory.py` | Provenance-first inventory, upstream pin comparisons, rights/compatibility tags and work-order preparation | Find candidates; a source file or name isn't a missing feature; never auto-port candidates |
| `content-factory/native377.py`, `content-factory/tests/test_native377.py` | Reproducible **original NPC overlay** limited to approved `joshrs_woodland_guide`; checks duplicates and unsafe input | Do **not** use as a mass editor for existing NPCs; retirement of speculative merchants and feature-gap gate stay enforced |
| `docs/377_NATIVE_CONTENT_INTEGRATION.md` and native-content GitHub verification | Existing compile, manifest/checksum and disposable server smoke checks | Compile success is not Java-client gameplay or save-persistence proof |
| `tools/rs377-map-bridge/README.md` / `audit-and-stage.mjs` | Audits map source against exact `flo.pack` / `loc.pack` and stages `.jm2` without overwriting active world | Yanille/Edgeville custom map ZIPs have unresolved IDs/trailers; BLOCK installing until matched to actual runtime and rights |
| `research/rs377/CONTENT_RECOVERY_BACKLOG_2026-10-30.md` | Interaction contracts, historical release gate and quest candidates | Source-only candidates, NOT missing/working assertions |
| `research/rs377/UNFINISHED_WORK_REGISTER_2026-10-31.md` | Canonical owner/to-do and evidence status | Deduplicate against issues #28/#29/#30/#34 |
| `docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md` | Strict Agy file ownership, safety and integration order | Agent 1 owns interaction scripts; Agent 2 Luna; Agent 3 live QA/backups; Agent 4 read-only supervision; ChatGPT independent research/tests |

## Lessons from other projects and authoritative sources

- **2009Scape:** distinct roles for content tester, JSON editor, authenticity auditor and code contributor; audit one geographic area at a time. [Project](https://gitlab.com/daveyscape/2009-scape).
- **Lost City:** source configs/scripts/maps are separate inputs; `.rs2` compilation depends on symbol data and the appropriate target compiler. Use current pinned **377-wip** packages, not an unrelated or newer build. [Content](https://github.com/LostCityRS/Content), [RuneScriptTS](https://github.com/LostCityRS/RuneScriptTS), [wiki intro](https://wiki.lostcity.rs/Scriptref_Intro). Its content repository uses a Verify Content workflow.
- **RuneLite:** its client developer tools and APIs describe NPCs/scene/map region identifiers, but **modern OSRS IDs and positions are not evidence of 377 IDs**. [Developer guide](https://github.com/runelite/runelite/wiki/Developer-Guide), [Scene API](https://static.runelite.net/runelite-api/apidocs/net/runelite/api/Scene.html).
- **Historical gate:** 377 targets the May 2006 era (104 quests through Swan Song on 2 May); features released later must be explicitly optional and versioned, not silently called restoration. [Quest dates](https://oldschool.runescape.wiki/w/Quests/Release_dates). Even an eligible historical quest is not necessarily implemented in the pinned game.
- **Rights gate:** Jagex's fan-content permission explicitly excludes derivative private game servers and game software. Lost City's README says MIT **source code** does not license Jagex-owned assets. Keep the *public* repo to original safe prose, references, metadata, allowed tooling and separately licensed original code; do not redistribute caches, original dialogue, models, maps or game binaries. [Jagex policy](https://legal.jagex.com/docs/policies/fan-content-policy), [Lost City rights notice](https://github.com/LostCityRS/Content).

## Hourly bounded workflow (prioritise quality, not NPC count)

1. **Read once, deduplicate:** Check #35 newest Agent 4 status, #36 last handoff, open issues #28/#29/#30/#34 and pinned source/commit. Determine whether live source is accessible; explicitly mark if it isn't. Continue *one geographic area* and do not rotate until its current batch is accounted for.
2. **Diagnose before writing:** Inventory up to **three** existing NPCs with **confirmed 377 source IDs**, region, existing action/handler, quest/shop affiliation and evidence link. Mark runtime-specific observations as unknown unless Agent 3 actually proves them. Check for dispatch regression vs missing authored script before proposing any line.
3. **Write one coherent pack:** For only NPCs confirmed to need original supplemental dialogue, create unique character briefs (occupation, motivation, vocabulary, secrets/knowledge, tone); each tree has greeting, at least two relevant choices when gameplay warrants them, an exit, missing-prerequisite response and pre/during/post-quest conditions **only when supported by real quest flags**. For legitimate background NPCs allow a short distinct response without forcing quest branches. Protect canonical existing scripts.
4. **Map/quest links:** Attach proven spawn/loc ids and map-region references; when unverified label UNKNOWN, not invented. For quests record state transitions and handlers, item/level gates, rewards, mutually exclusive branches, cooldowns and logout persistence. Keep 2006 restoration distinct from optional modern-inspired additions.
5. **Provenance and rights:** Record pinned source SHA, paths, observation status, author/permission or original text classification, and compatibility assumptions. No wiki/game dialogue copy; no proprietary cache or artwork in public repo.
6. **Validate:** Check identifiers unique and real (not only syntactically valid); duplicate generic response detection, bad/unreachable dialogue branches, missing exit, wrong quest flag, unsupported `.rs2` functions, script dependency resolution and source-state drift. Compile against the pinned 377 toolchain in an **isolated** runner if accessible; otherwise label **not compiled**. Run existing test/tooling when possible and attach actual results, never fabricated passes.
7. **Stage & hand off:** Commit *new isolated* review data/docs/tests to own content-only paths; open a PR if changes need review. Post one concise #36 comment with exact files, commit, evidence, tests, unresolved questions and **Agent 1 implementation target**; Agent 4 may audit via #36. Never edit Agent 1–3 owned runtime handlers or post duplicate Agent 4 monitoring commentary.
8. **Player verification:** Agent 3 only after safe backup and coordination. Real Java client conversation for all branches/quest prerequisites, option-specific actions and relog/persistence. Only then call VERIFIED PLAYABLE. A unit test or opening the UI is not acceptance.

## NPC review record required for every batch

The smallest valid record contains:
- `candidate_key` (stable local review key), `target_revision` (377), `region` (supported source), `npc_id` (verified exact number), `npc_name`, `spawn_evidence` (or explicit unknown), `upstream_sha`, `handler_path` and `option`;
- `current_response_category` = observed generic / script-driven / intentional background / missing trigger / unknown; `runtime_observation` = verified by Agent 3 or unverified; no exact copied proprietary dialogue;
- `baseline_behavior`, `proposed_change`, `is_original_addition`, `dialogue_tree` including node IDs, choices, prerequisites and deterministic exit;
- `rights_status`, `static_test`, `compiler_test`, `client_test`, `persistence_test`, `handoff_owner`, `evidence_links`, `status`.

If source IDs, locations or rights are unverified, **publish a research/unknown ledger row, not executable content.**

## Handoff quality gates

- **EVIDENCE FOUND:** pinned identity/path and actual (or explicitly unavailable) runtime proof; no assumption from modern wiki.
- **DRAFT PACK:** original content + interaction diagram and references; no pretend deployment.
- **STATIC VALIDATED:** real executable test results and compiler result or explicit skipped reason.
- **AGENT 1 HANDOFF:** exact target, proposed change and tests; no concurrent runtime writes.
- **AGENT 3 ACCEPTED:** disposable build and real Java client test, with safe state restoration.
- **VERIFIED PLAYABLE:** real interaction, correct conditional branches, no regression, and persistent results where relevant.

Quality measures per area: existing NPCs audited, confirmed generic fallbacks, legitimate defaults retained, unique dialogue paths prepared, duplicate identifiers/lines rejected, stage and exit coverage, test evidence, agent handoff accepted, live player-verified count. Never convert a code/file count into a game-completion percent.

## First pack to prepare

Start with an **area-based interaction audit of a hub already confirmed by the 377 source**. Prefer Lumbridge or Varrock if the pinned spawn/handler evidence confirms availability. Do not invent the first three NPC IDs. Test whether existing 377 dialogue was hidden by generic fallback or stale script packing before authoring new dialogue. Record exact blockers and hand Agent 1 an actionable change.

## Non-negotiables

No new unneeded vendor/NPCs, no fake quests, no imported Jagex assets, no live saves/DB or passwords, no server restart, no purchases, no drafted/sent emails. Public issue comments and repository files must be sanitised. Stop if approvals or licence grants are unclear; continue with lawful research and original independent tooling.

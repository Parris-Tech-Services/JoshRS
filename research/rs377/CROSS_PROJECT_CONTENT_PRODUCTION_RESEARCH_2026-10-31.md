# How RuneScape preservation projects produce content: deep comparative research for JoshRS #377

**Research date:** 31 October 2026 (Australia/Sydney)  
**Status:** RESEARCH VERIFIED AT DOCUMENTATION/SOURCE LEVEL; no cross-project throughput measurements or live JoshRS client playtests were performed.  
**Target:** JoshRS private, personalised Lost City revision-377 runtime on JParris Desktop, **not** its separate public Woodlands/browser prototype.  
**Execution companions:** [hourly SOP](HOURLY_CONTENT_PRODUCTION_PIPELINE_2026-10-31.md), [implementation prompt](CONTENT_FACTORY_2_RESEARCH_AND_EXECUTION_PROMPT_2026-10-31.md), [handoff issue #36](https://github.com/Parris-Tech-Services/JoshRS/issues/36), [agent ownership](../../docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md).

## Executive findings

**The winning pattern is not bulk NPC generation.** Mature projects lower the marginal cost of *finished, correct player actions* by combining declarative/typed content authoring, observable historical evidence, narrow automated tests, a quick edit/compile loop, and disposable-world acceptance. The sources do **not** establish that any project is numerically the fastest or most reliable; no standardised production or defect dataset was available. Treat the following as verified **practices**, with adaptation to JoshRS an **engineering proposal**.

1. **Lost City:** same-parent engine/content layout; compatible branch matching; watched script/config repacking during content development; separate engine-restart development mode. [Engine docs](https://github.com/LostCityRS/Engine-TS); [server setup](https://github.com/LostCityRS/Server). **Adopt:** preserve pinned engine/content/compiler versions, small native RuneScript slices and fast isolated compile cycles; do not switch the user's running world to a new branch just for convenience.
2. **RuneScriptTS and language tooling:** .rs2 scripts compiled with symbol information to server pack output; editor has definition lookup, symbol references, rename and completion. [compiler](https://github.com/LostCityRS/RuneScriptTS); [extension](https://marketplace.visualstudio.com/items?itemName=2004scape.runescriptlanguage). **Adopt:** symbol-aware validation and compile failure as a hard gate, using the compiler actually wired to locked 377, not assuming the latest tool is backwards-compatible.
3. **2009Scape:** separate content testers, JSON editors (Thanos/Zaros editor), authenticity auditors and code contributors; area-by-area audit; testing on a separate test server; easy data contributions without building the entire game. [GitLab server](https://gitlab.com/2009scape/2009scape); [tool](https://gitlab.com/2009scape/tools/rs09-thanos-tool); [older project role descriptions](https://2009legacy.github.io/site/game_guide/credits.html). **Adopt:** area-based interaction ledger, author/test split, original data/spec editors for nonprogrammers and explicit QA. Note: some 2009Scape contributor docs are historical and do not establish present operational performance.
4. **OpenRSC:** authenticity work draws on thousands of hours of RSC+ replays and incremental review of observed behaviour. [Core-Framework](https://github.com/Open-RSC/Core-Framework). **Adopt:** evidence attached to each NPC/quest/action contract, with source vs actual behaviour distinguished. *Version mismatch:* RuneScape Classic is not an RS2 #377 reference; its code is AGPL-3.0 and not a drop-in MIT component.
5. **RuneJS:** plugin/content development APIs, development watch mode, Jest tests, lint, format and typechecking, with a documented combined validation command. [server README](https://github.com/runejs/server). **Adopt:** one locally reproducible pre-merge quality command, focused regression fixtures and isolated plugins where the 377 architecture permits. *Version mismatch:* RuneJS targets #435.
6. **Void:** Kotlin content organisation, formatting discipline and focused test expectations; contributor guidance explicitly rejects low-effort bulk-generated AI changes. [README](https://github.com/GregHib/void). **Adopt:** focused diffs, acceptance criteria per interaction and content review that judges behaviour, not code volume. Void's architecture/data is not an automatic #377 port.
7. **Luna #377:** event-based Kotlin plugins and bot scripts; authors themselves label the project unstable/not production-ready in its README. [repository](https://github.com/luna-rs/luna). **Adopt:** event/scenario and bot action ideas only after type, protocol, ID, rights and runtime review. The open-source Luna project is unrelated to the user's personalised Luna BotPlayer.
8. **2004SP Progressive:** a Lost City-family single-player mod with goal planner, skill-specific bot tasks and game-state-driven interactions; its README describes a #254 origin and autonomous activities. [repository](https://github.com/2004sp/2004sp-progressive). **Adopt:** task planner / observation / normal action / outcome verification separation for Luna; do not transplant its entire engine, client or bundled assets into #377 or trust feature claims without tests.
9. **RuneLite:** developer guide names map/coordinate, item/NPC/object inspection and client-side data/API tools. [developer guide](https://github.com/runelite/runelite/wiki/Developer-Guide). **Adopt:** a version-tagged, read-only inspector and registry for NPC IDs, options, spawns, collision and regions. *Version mismatch:* modern OSRS IDs, widgets and cache definitions are **not authoritative** for #377.
10. **OpenRS2:** automated cache indexing, per-source provenance, checksums/versions, content-addressable storage; external cache contributions are manually checked for provenance. Their server repo explicitly segregates nonfree client/cache material. [archive](https://archive.openrs2.org/); [repository](https://github.com/openrs2/openrs2). **Adopt:** immutable content metadata, deduplication, reproducible source hashes and quarantine of unlicensed binary/asset material; **do not** pull archive cache assets into JoshRS public repo.
11. **2006Scape / other-era projects:** useful for tracing quest journal vs actual handlers, but GPL and/or incompatible client/engine boundaries mean descriptive research is more appropriate than code copying. [2006Scape](https://github.com/2006-Scape/2006Scape).
12. **Lost City source version selection:** the chosen 377-wip branch is a work-in-progress; the mere presence of a definition or quest folder is not playability. [pinned user audit](../../docs/377_OPEN_SOURCE_GAMEPLAY_COMPLETENESS_AUDIT_2026-10-31.md), [Lost City discussion](https://lostcity.rs/t/question-for-devs-about-versioning-and-personal-custom-work/12822).

### Verified mechanisms versus unproven outcomes

| Claim | Assessment | Reproducible proof required before stronger claim |
|---|---|---|
| Watched content repacking reduces *manual rebuild steps* | Mechanism documented by Lost City | Benchmark on exact #377 toolchain, measure elapsed minutes and false rebuilds |
| Independent content tester protects live world | Stated 2009Scape process | Release / rollback records and pre/post defect rates |
| Replay-driven observation aids historical accuracy | OpenRSC documented practice | Matched episode/quest checkpoints with audited replay provenance |
| Plugin/module boundaries enable focused tests | Documented in RuneJS/Void/Luna | Targeted test inventory and changed-file impact mapping |
| A project is faster / has 80% complete content / zero bugs | **NOT ESTABLISHED** | Stable feature denominator, accepted in-game features over time, escaped defects and independent replays |

## What is already in JoshRS: avoid duplicate development

Read [actual pinned revisions](../../deploy/jparris-windows/upstreams.json):
- Engine-TS 377-wip: `b5ac859b47915afb545e60e4c1208f25d43cb3fb`.
- Content 377-wip: `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.
- Client-Java 377: `327880f6de74b40c420705bc42e4b34284885087`.

**These are the repo's documented pins on the research date, not independently verified live Windows binaries.** The running world may have local overrides, patched content or stale packs. Read its private `runtime/jparris-377/active.json` *locally and read-only* before a runtime conclusion.

The JoshRS [feature audit](../../docs/fedora-377/FEATURE_AUDIT_2026-10-30.md) records **3,432 NPC definitions; 10,174 location definitions; 7,280 object definitions; 66 quest-labelled roots and 18 skill-labelled roots**. These are source inventories, not counts of interactive objects or completed quests. The [native integration note](../../docs/377_NATIVE_CONTENT_INTEGRATION.md) documents the **retirement of seven speculative duplicate merchants** after existing runes, moulds, chisels and jewellery were found. **Never reintroduce those duplicates.**

Already built/partially built:
- `content-factory/factory.py`: rolling, provenance-first GitHub metadata inventory; policy and source-hash classification; original-user-authored, narrow JSON spec validation; review work orders. It is **not** a feature-semantic gap detector or automatic runtime importer.
- `content-factory/native377.py`, generated overlays, Python tests, native 377 CI: original narrow source overlay, hash checking, clean build and disposable server listener smoke. These **do not prove live dialogue, trading, quest completion or save persistence**.
- `tools/rs377-map-bridge/` and map inspector: read-only map validation and staged analysis, **not** permission to republish proprietary maps or install incompatible map edits.
- [hourly contributor SOP](HOURLY_CONTENT_PRODUCTION_PIPELINE_2026-10-31.md) and issues [#28](https://github.com/Parris-Tech-Services/JoshRS/issues/28), [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29), [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30), [#34](https://github.com/Parris-Tech-Services/JoshRS/issues/34), [#35](https://github.com/Parris-Tech-Services/JoshRS/issues/35), [#36](https://github.com/Parris-Tech-Services/JoshRS/issues/36).
- **Gap:** automated catalogue candidates are currently **file-level**, and many lack player-visible identity, trigger, dependency, historical-era evidence, valid local mapping, reproducible client trace and accepted user outcome. Filling those fields, not scanning more file names, is the next bottleneck.

## Proposed production architecture (incremental; do not replace existing factory)

```text
GitHub pinned source metadata + 2006-era factual references + source observations
                  |
                  v
[1. Source identity / licence / immutable SHA gate]
                  |
                  v
[2. Existing-feature reconciliation: pinned engine + content + local overrides]
       | already works        | missing handler       | unknowable locally
       v                      v                       v
  KEEP / regression       small focused            EVIDENCE-NEEDED
  test; no duplication    repair work order        (no guessed IDs)
                               |
                               v
[3. Author original spec or rights-cleared compatible patch; stable key]
                               |
                               v
[4. Dialogue graph / quest state / trigger / item conservation / map lint]
                               |
                               v
[5. Locked #377 compiler and isolated disposable-world tests]
                               |
                               v
[6. Agent 1/2 targeted patch and Agent 3 Java-client + persistence acceptance]
                               |
                               v
[7. Review, one runtime owner, release, rollback drill, observable status]
```

### Data model: one record per *player-visible behaviour*, not per source file

Proposed minimum `interaction_contract_v1` fields:
- **identity:** stable `feature_key`, `type` (npc/loc/item/quest/bot/map), `revision`, `area`, `entity_id` (nullable), `spawn/loc coordinate` (nullable + proof), `option`, `owned_by_agent`.
- **actual state:** source pin, source blob and path, installed override hash if available, current script trigger, current outcome, confidence/evidence, classification (works, fallback, dispatch-regression, quest-gate, absent, unknown).
- **proposal:** smallest player-visible change, original text provenance/licence, expected branches/actions, quest vars/prerequisites, item/XP effects, failure message, explicit rollback.
- **acceptance:** fixture inputs, anticipated transitions, referenced IDs/symbols, compiler build hash, automated test results, client video/screenshot or safe log ID, relog state, failed/blocked reasons, status.
- **lineage:** upstream repo/source file/snapshot SHA and fork-parent; historical era date. When unknown, **null**, not invented.

For the reported generic greetings: **do not replace 'Hello adventurer' until its origin is proven.** The first test compares interaction option routing, multi-NPC category triggers/morphs, zone/quest filters, actual pack compilation SHA and server startup log. Distinguish these five categories: (a) valid intentional background greeting, (b) dispatch broken, (c) missing NPC-specific script, (d) quest-stage/precondition branch, (e) new script built but old pack running. Generic greeting appearing during a scripted quest is an especially high-priority regression.

### Dialogue quality tests beyond compilation

- **Distinctiveness:** flag identical normalised player-visible lines across unrelated NPCs; *do not* prohibit legitimate short common responses, and preserve original scripts.
- **Reachability:** directed dialogue graph has opening, valid menu options, every branch reaches a terminal/next state; no dead references or infinite unconditional cycles.
- **State coverage:** explicit matrix for before/active/after quest states only where source proves actual quest variables.
- **Gameplay effects:** Talk-to and other actions must preserve inventory quantities, quest transitions and rewards under accepted conditions; no client-only facade.
- **Fallback priority:** quest/shop/skill specific handlers must win over broad generic messages; instrument dispatch *in a disposable test build*, not sensitive production telemetry.
- **Format:** source symbols actually exist in locked 377 and the content packer accepts scripts.
- **Role authenticity:** unique motive/knowledge/voice only for *original* authored additions, not fabricated 'historical transcripts'.

### Quality gates — statuses are not interchangeable

| Gate | Acceptance | Responsible lane |
|---|---|---|
| G0 EVIDENCE | exact target #377 ID/spawn/trigger or explicitly unknown, verified existing-feature search, source SHA | ChatGPT research + Agent 1 source check |
| G1 RIGHTS & COMPAT | independent text/source rights, full revision/client/ID check, no proprietary cache/media; failed = blocked | ChatGPT research, review |
| G2 STATIC | deterministic graph/state/ID/reference lint; source code checked; no duplicates or speculative merchants | ChatGPT isolated tests / Agent 1 |
| G3 BUILD + SERVER | pinned 377 compiler+packer, target tests, disposable startup; no production save | Agent 1 / CI |
| G4 CLIENT INTERACTION | actual JParris Java-client action, all meaningful branches and visible effects | Agent 3 |
| G5 PERSISTENCE + RELEASE | relog state, inventory/quest state, recoverable backup, rollback proof, no regressions | Agent 3/runtime owner |

The existing public factory may pass up to G3 for some overlays; **G4/G5 cannot be asserted from GitHub-only access**. Keep red/blocked states and CI failures visible; avoid gaming metrics by deleting tests or reclassifying defects.

## Measurable experiment: determine what is *actually* fastest and safest

Without comparable throughput data, ranking projects by popularity, commits or source-file count is invalid. Build an **internal JoshRS measured baseline** instead:

1. Freeze a sample of **10 source-verified interaction contracts** in one selected area; include scripted quest NPC, background NPC, shop, bank, door, resource object and generic-fallback candidate *only where those exist*. No invented coordinates or IDs.
2. Record baseline source SHA, runtime version if accessible, bug reproduction, count accepted vs missing/unknown, pre-existing tests.
3. Run batches in the exact same target build, tracked by key and PR. Start with max **3 NPCs per hourly contributor batch**. Record non-overlapping prep time, engineering implementation time and acceptance test time separately.
4. Measure **verified interactions accepted per engineering hour**, median source-to-first-green-test time, median source-to-Java-client acceptance time, reopen/rollback rate over 7 days, duplicate features prevented, generic fallback rate, untestable handoff fraction, and % carrying hard evidence.
5. Compare an evidence-first small-batch process against the old ad hoc process **on matched complexity and same test conditions**. Do not assert a productivity gain before collecting data; display median and sample size, not only totals.
6. Maintain a permanent baseline regression suite with an action/result oracle for each accepted contract. Non-executable acceptance is marked manual/blocked, not green.
7. Publish a daily concise dashboard from *existing* machine evidence. Do not claim a gameplay-complete percentage from catalogues or a server listener check.

**Suggested release safety target** (local goal, not observed performance): 0 unreviewed rights issues; 0 production-save writes from research CI; 100% new content with a feature contract; 100% changed scripts compiled against locked pins; 100% accepted features with client evidence, and no known breaking regression. 'Zero bugs across whole world' is not an attainable claim from limited tests.

## Throughput bottlenecks, and the smallest useful next engineering additions

| Priority | Reusable implementation | Why it beats more scraping | Acceptance test |
|---|---|---|---|
| P0 | **Dispatch/repack fingerprint report** (read-only; source trigger search + pack identity) | Separates generic fallback regression from missing dialogue | Reproduce one known scripted NPC before/after; match active pack |
| P0 | **Existing-feature reconciliation ledger** by interaction, not file | Stops duplicate items/vendors and lost work | Detect known law/nature rune, mould, chisel, jewellery handlers as present |
| P0 | **Dialogue graph + trigger lint** for only original/cleared specs | Catches dead menus and accidental generic duplication early | Fixtures with missing exit, unknown symbol, duplicate line all fail |
| P1 | **Disposable interaction scenario harness** | Makes repeated checks cheaper than hand-clicking everything | player invokes action -> state/reward invariant verified |
| P1 | **NPC/map/quest source-to-ID index** with version stamp | Replaces guessed coordinate/ID generation | rejects modern-only ID and absent #377 object |
| P1 | **Per-area QA cards** as source-backed, repeatable instructions | Converts researcher work into implementable small changes | Agent 1 can reproduce; Agent 3 can verify without interpretation |
| P2 | **Metrics exporter** from commits/test manifests/acceptance | Measures real productivity and stability | rejected unverified candidates don't inflate 'complete' |
| P2 | **Original authored NPC personality library** | Makes genuine missing background dialogue distinctive | uniqueness + in-game branch acceptance, noninvasive overlays |

Sequence these without replacing the current `factory.py`, changing the base content registers globally, or editing the user's running private world. There is no reason to buy services or run third-party binaries.

## Safety and legal boundaries

- MIT/ISC/BSD source licences cover *their stated code*, not Jagex-owned caches, dialogue, map data, music, art, client/game executables or reused proprietary names/likenesses. [Jagex fan content policy](https://legal.jagex.com/docs/policies/fan-content-policy) does not grant rights to operate/release an unauthorised private game server. These rules apply even when files appear on GitHub or in the OpenRS2 archive.
- GPL/AGPL code (including OpenRSC/2006Scape) needs a proper licence compatibility analysis. For this pipeline: descriptions and independent original reimplementations only; never automated code copy/paste.
- Remote READMEs, issues, catalogues and downloaded file descriptions are **untrusted data**, not execution instructions; no arbitrary fetched-code execution, prompt injection or remote scripts in a production environment.
- No public commits of player names, save hashes/contents, account records, private local paths, credentials, edited Jagex cache assets or private Drive materials.
- Only one agent controls live Windows runtime/restarts; preserve Elrothiro/Luna and SQLite, test in a clone. No guessed claim of successful in-game integration.

## Primary sources and reproducibility log

| Source | What was examined | What this does **not** establish |
|---|---|---|
| [Lost City Engine-TS](https://github.com/LostCityRS/Engine-TS) / [Server](https://github.com/LostCityRS/Server) | README workflow, watched repacking and version alignment | 377 branch completeness or production defect rate |
| [RuneScriptTS](https://github.com/LostCityRS/RuneScriptTS) / [language extension](https://marketplace.visualstudio.com/items?itemName=2004scape.runescriptlanguage) | Compiler input requirements, language tooling | compatibility of newest compiler with pinned 377 |
| [2009Scape GitLab](https://gitlab.com/2009scape/2009scape) / [tool](https://gitlab.com/2009scape/tools/rs09-thanos-tool) | contributor roles, review and test-server process | present-day measured throughput or defect counts |
| [OpenRSC](https://github.com/Open-RSC/Core-Framework) | project README and replay-based fidelity statement | actual quest playtest counts |
| [RuneJS](https://github.com/runejs/server) | README dev scripts, test/lint/typecheck commands | pass/fail of latest CI build |
| [Void](https://github.com/GregHib/void) | contribution requirements, formatting/test guidance | ability to port Kotlin logic directly |
| [Luna](https://github.com/luna-rs/luna) | README event plugins, declared instability | production readiness |
| [2004SP](https://github.com/2004sp/2004sp-progressive) | README bot architecture, skill-goal tasks | working #377 integration |
| [RuneLite](https://github.com/runelite/runelite/wiki/Developer-Guide) | developer tools, data inspection guidance | #377 IDs or cache equivalence |
| [OpenRS2](https://archive.openrs2.org/) | metadata/provenance and content-addressable archive | rights to redistribute the archive |
| [JoshRS audit](../../docs/fedora-377/FEATURE_AUDIT_2026-10-30.md) / [native pack](../../docs/377_NATIVE_CONTENT_INTEGRATION.md) / [factory](../../content-factory/factory.py) | current repo's documented counts, boundaries and correction of duplicate merchants | active Windows game state |

**Audit limitation:** live repos can change; pin individual remote commits/blobs in *each actual production work order*. This research compares published architecture and documentation, not timed development sessions or all code paths. Source URLs were checked on 31 October 2026; historical README claims may not reflect their latest operations.

## Decision

**Keep the existing hourly SOP and source-harvest queue. Add evidence-first semantic reconciliation, tiny native-format patches, explicit G0-G5 gates, and measurable client-accepted throughput.** For the first increment, prioritise the reported repeated generic NPC greeting and its dispatch/repack cause before any fresh dialogue. Agent 1 implements the minimal proven handler/content change; Agent 2 owns Luna; Agent 3 performs disposable-client and save acceptance; Agent 4 monitors read-only; ChatGPT supplies source-backed contracts and independent QA checks.

Continue via the [specific research-and-execution agent prompt](CONTENT_FACTORY_2_RESEARCH_AND_EXECUTION_PROMPT_2026-10-31.md).
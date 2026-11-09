# JoshRS modern parity: committed research and execution package

**Authoritative owner direction:** [8 November private exact-content parity and maximal-risk decision](../../../docs/decisions/2026-11-08-private-rune-parity-and-risk.md). The owner rejected merely OSRS-/RS3-*inspired* replacement content as fulfilling their private family game; the selected multi-profile architecture is a technical means to pursue **faithful original-game content and mechanics**, subject to independently tracked content rights. An explicit willingness to bear personal legal risk does not license assets or authorise redistribution. Do not alter older audit counts or claim completed implementation because this decision is recorded.

**Prepared 8 November 2026 (Australia/Sydney). Status: PARTIALLY COMPLETE RESEARCH; live desktop/world and modern full-feature enumeration are NOT VERIFIED.**

## Start here

1. [Executive assessment and decision](EXECUTIVE_ASSESSMENT.md): preserve 274/377 and use technically separate OSRS/RS3 **exact-fidelity target profiles**, with shared offline family infrastructure; source/rights status remains distinct.
2. [Recommended architecture with four alternatives](ARCHITECTURE_OPTIONS.md) and [technical reuse matrix](TECHNICAL_COMPATIBILITY_MATRIX.md).
3. [Master release roadmap P0–P12](MASTER_ROADMAP.md), with actual source/quest/asset technical prerequisites.
4. [100 detailed actionable tasks](FIRST_100_ENGINEERING_TASKS.md) and [100-task/228-edge dependency graph](DEPENDENCY_GRAPH.md).
5. [Full machine-readable first 100 tasks](data/implementation_backlog_first_100.json) and [dependency graph JSON](data/dependency_graph.json).
6. [Gap database — 1,281 records](data/joshrs_gap_inventory_2026-11-08.csv): **not** 1,281 confirmed missing items; 104 old quests, 673 NPC handler candidates, 30 skill concepts and 474 modern reference *research seeds*.
7. [27 historical quest source gaps, newest-first](data/rev377_27_quest_source_gaps_newest_first.csv), reconciled against PR #145/#148 flags, not live proof.
8. [Eight architecture PoCs](PROOF_OF_CONCEPTS.md), [25 family acceptance tests](FAMILY_ACCEPTANCE_TESTS.md).
9. [Source/research completeness](RESEARCH_COVERAGE.md), [source manifest](evidence/source_manifest.json), [checkpoint](evidence/audit_checkpoints.json).
10. [Estimations and risks](ESTIMATES_AND_RISKS.md), [legal provenance register](CONTENT_RIGHTS_REGISTER.md), [seven upstream projects compared](UPSTREAM_EMULATOR_REUSE_RESEARCH.md).

## Current immediate work

**First:** protect the active historical save and investigate [Party Drop Chest data loss #52](https://github.com/Parris-Tech-Services/JoshRS/issues/52). **Second:** prove normal offline login, two-player approved LAN and restart-safe inventory/quest/bank via a *restored isolated copy*. **Third:** merge/reconcile existing open quest branches only after verified version/quest-varp conflicts and real stage playthroughs. **Fourth:** prototype the original modern client and moving ship while retaining the legacy runtime unchanged.

Independent family-mode mechanics may still be prototyped, but **new original quests/NPCs are not equivalent to the owner's Jagex-content parity target**. Exact Jagex artistic, literary and binary material requires separate rights/permission clearance; being offline or noncommercial, or accepting legal risk, does not automatically authorise copying or distribution.

## Validation (offline, no private saves)

```bash
node tools/parity-inventory/validate-roadmap.mjs
node --test tools/parity-inventory/validate-roadmap.test.mjs
```

[CI workflow](../../../.github/workflows/parity-roadmap-check.yml) should run both on roadmap changes. These checks verify schema counts, CSV alignment, dependencies and honest evidence statuses. They do **not** boot the 377 server or make anything playable.

## Important statuses

**VERIFIED_PLAYABLE** = actual approved client/player action observed, final authoritative state persisted and post-relogin verified. **SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED** = audit found source, but no live end-to-end proof. **RESEARCH_NOT_COMPLETE** = cannot conclude feature is missing. **BACKLOG_ONLY** = authored task, not completed implementation.

## Other work that this must not overwrite

[PR #141](https://github.com/Parris-Tech-Services/JoshRS/pull/141) drafts an existing historical content-porting architecture, [PR #145](https://github.com/Parris-Tech-Services/JoshRS/pull/145) and [PR #148](https://github.com/Parris-Tech-Services/JoshRS/pull/148) contain pending historical quest scripts. This research package adds cross-era programme planning; do not mistake its existence on main for merging those PRs or shipping features.

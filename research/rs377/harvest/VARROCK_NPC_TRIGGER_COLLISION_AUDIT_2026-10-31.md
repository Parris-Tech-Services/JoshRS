# Varrock 377 NPC source trigger collision audit — 31 October 2026

**Scope:** source-only, read-only, independently authored diagnostic. **Not a live NPC repair.** Complements the existing `audit_dispatch.py` (pinned source Git blob checks) and `verify_varrock_dispatch_evidence.py` (Agent 3 pack/click evidence); does **not** duplicate the hourly `harvest_multi.py` source collector.

## Why this additional gate matters

The previous Varrock audit confirmed that Reldo, Juliet and Romeo have source-traced `OPNPC1` headers, but did **not** check whether *another* script in the same source checkout also declared the same trigger. Two definitions for the same trigger could cause compilation ambiguity or different dispatch behaviour, depending on the actual engine/compiler. Source collision is a **hypothesis to test**, not an explanation already proven for the reported repeated “Hello adventurer” greeting.

New [collision audit](../../../content-factory/audit_npc_trigger_collisions.py) scans only `scripts/**/*.rs2` headers for `opnpc1` through `opnpc5`, indexes handler symbol + relative source file/line, detects duplicate declarations including duplicates within a file, and checks exact expected file locations for these three Varrock NPCs. It fails closed for missing scripts, unreadable/oversized files, symlinks and incomplete scans. Reports only symbols and relative paths, **never dialogue, assets, account data or raw source text**. For private custom script names, keep the generated report private and share only aggregate counts.

**Exact pinned provenance:** [LostCityRS/Content commit 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50), source paths `scripts/areas/area_varrock/scripts/reldo.rs2`, `juliet.rs2`, `romeo.rs2`. Expected triggers `opnpc1,reldo`, `opnpc1,juliet_multi_visible`, `opnpc1,romeo`. Numeric NPC IDs remain UNKNOWN. No Jagex-owned dialogue, maps, sprites, music, cache or proprietary assets copied.

## Run on an isolated, version-matched content checkout

```bash
python3 content-factory/audit_npc_trigger_collisions.py --content /path/to/disposable/377/content --output /path/to/private/new-npc-collision-audit.json
python3 -m unittest discover -s content-factory/tests -p test_audit_npc_trigger_collisions.py -v
```

The output file is created exclusively; an existing report is never overwritten. CLI exits `2` when any of the three expected triggers is absent, duplicated, moved, or the scan is incomplete. It can report other NPC trigger collisions but does not automatically delete/merge any scripts. The scanner recognises ordinary single-line `[opnpcN,symbol]` headers; generated or dynamically registered handlers, multiline macros, compiler precedence and runtime-loaded scripts are **outside its evidence**.

## Agent 1 / Agent 3 handoff

1. **Agent 1:** In a disposable copy of the *actual selected* content source (not a fresh unrelated tree), run this source-only scan alongside `audit_dispatch.py`. If collision exists, inspect compiler symbol resolution and `OpNpcHandler`/morph/category fallback ordering; do not replace working Reldo/Juliet/Romeo dialogue or patch a generic greeting blindly. Compare the exact pinned source blob hashes and distinguish intentional customisation from unexpected drift.
2. **Agent 3:** Separately fingerprint actual running `script.dat` and `script.idx` against the audited pack, then test each real `OPNPC1` click and server delivery using a disposable 377 account. Record sanitised result categories, not account names, dialogue transcripts or private paths. Only Agent 3 can mark real Java-client/relog gameplay verified after a protected backup and controlled test.
3. **Agent 4:** Review collision findings as static source evidence, not a gameplay completion claim.

## Validation and limits

- Local `python -m unittest discover -s content-factory/tests -p test_audit_npc_trigger_collisions.py -v`: **13/13 synthetic tests PASS** (unique/duplicate/missing/moved headers, comment parsing, case normalisation, unsafe inputs, no dialogue disclosure).
- Python `py_compile`: **PASS**.
- Actual pinned 377 source checkout scan: **NOT RUN** (no authorised runtime checkout in this execution).
- Native 377 compiler and live client tests: **NOT RUN**.
- GitHub Actions scheduled metadata artifact: **NOT VERIFIED** in this execution; the single existing hourly workflow remains unchanged.

**Next precise action:** Agent 1 runs this source trigger inventory on the source selected by the actual `active.json` under Agent 3's supervision, compares it with the loaded-pack/click evidence, and reports whether source trigger collisions exist before altering fallback code.

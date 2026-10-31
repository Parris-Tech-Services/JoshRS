# Varrock 377: one-command private-safe evidence handoff (31 October 2026)

**Status: SOURCE-ONLY TOOL, NOT A LIVE NPC FIX.** This consolidates three existing diagnostics, not a new harvester or game-content installer.

## Purpose

The repeated generic "Hello adventurer" observation has not been traced to a confirmed server-side cause. PRs #42–#46 added separate source pin, click-delivery, collision and dispatch checks, but the actual selected Windows content and loaded packs remain unverified. This wrapper produces one consistent, sanitised handoff without exporting raw source scripts, dialogue, player data or local paths.

**Exact source provenance:** [LostCity Content 377-wip commit 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50). Existing source-traced Varrock handlers:

- Reldo: scripts/areas/area_varrock/scripts/reldo.rs2 — opnpc1,reldo
- Juliet: scripts/areas/area_varrock/scripts/juliet.rs2 — opnpc1,juliet_multi_visible
- Romeo: scripts/areas/area_varrock/scripts/romeo.rs2 — opnpc1,romeo

**Numeric NPC IDs, live spawns, loaded-process pack identities and real Java-client clicks remain UNKNOWN.** Preserve intentional source customisations even if the local blob differs from the public pin.

## Run on a protected disposable checkout

Agent 3 first establishes which source/pack version the active runtime actually selected **privately**. The operator then makes a protected copy. Never point the tool at character saves or a mutable live content directory. The tool does not inspect active.json or running processes.

    python3 content-factory/collect_varrock_triage.py --content /path/to/protected/377-content-copy --script-dat /path/to/audited/pack/script.dat --script-idx /path/to/audited/pack/script.idx --output /path/outside-game/private-varrock-triage.json
    python3 -m unittest discover -s content-factory/tests -p test_collect_varrock_triage.py -v

Optional --agent3 /path/to/private/agent3-observation.json uses the existing joshrs-377-agent3-dispatch-observation-v1 schema in verify_varrock_dispatch_evidence.py. That JSON must originate from independently observed Java-client clicks and process/pack fingerprints; the tool cannot manufacture evidence.

The report is created exclusively, outside content and pack directories. Inputs must be bounded regular files with exact script pack filenames. Symlinks, absent scripts, invalid observation JSON and contradictory inventories fail closed. Exit code 2 means incomplete evidence or review required, not permission to reinstall a pack.

Output contains three NPC keys, source presence/trigger/pinned-blob comparison, aggregate collision counts, source-only classifications and SHA-256 fingerprints of **audited disk** packs. **Keep the complete report private**, including pack hashes. Publish only non-sensitive aggregate statuses and public source references to issue #36. No private paths, source filenames, hashes, player names or dialogue in a public issue.

## Agent handoff

1. **Agent 1:** Review any review_required classification. Source drift can be intentional. Trace trigger collisions, morph/category resolution, OPNPC1 dispatch and generic fallback **only after server click delivery is confirmed**. Do not mass-replace existing dialogue.
2. **Agent 3:** Independently compare disk script-pack hashes with **loaded-process** identity. Capture real disposable Java-client OPNPC1 clicks for Reldo/Juliet/Romeo and check relog/persistence where relevant. Static source success does not prove the process loaded the pack.
3. **Agent 4:** Treat this as source/pack triage. A green unit test, pack hash or reported dialogue outcome is not independently verified gameplay.

## Evidence and limitations

**PASS:** 15/15 local synthetic regression tests and Python py_compile. **NOT RUN:** actual Windows content scan, live process fingerprint, Java-client conversations, save persistence or native 377 compilation (no engine source changed). No game assets, caches, third-party dialogue, maps, saves or emails accessed. Scheduled public metadata artifact remains unverified because a workflow run list was unavailable; no duplicate harvesting was launched.

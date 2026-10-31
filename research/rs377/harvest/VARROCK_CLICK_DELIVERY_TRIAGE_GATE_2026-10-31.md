# Varrock NPC click-delivery triage gate (31 October 2026)

**Scope:** One source-only safety improvement in the existing ChatGPT content-preparation lane. **Not a live NPC fix or an importer.** Three protected, already-source-traced NPCs: Reldo (`opnpc1,reldo`), Juliet (`opnpc1,juliet_multi_visible`), Romeo (`opnpc1,romeo`). Their numeric NPC IDs and current Windows live process dispatch remain unverified. Source identity: LostCityRS/Content exact pinned 377 commit [44eab09081ef0f6c5f3eaabd1897a588ad7d9e50](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50); no Jagex text or assets included.

## What was corrected

The existing [evidence validator](../../../content-factory/verify_varrock_dispatch_evidence.py) previously classified a reported `generic_greeting` as `fallback_or_dispatch_suspected_not_proven` when the audited script-pack SHA-256 matched the reported loaded pack, **even if the test report explicitly said `click_reached_server=false`**. This can misdirect Agent 1 to edit the fallback handler when the client-to-server packet route has not been demonstrated.

Now, with source and pack checks already passing, `generic_greeting`, `no_action`, or `crash` and `click_reached_server=false` are classified `server_click_unconfirmed_trace_transport_before_dialogue`. This means **not observed**, not proof the packet was dropped. The original classifications remain when `click_reached_server=true`. Missing source, mismatched pinned source, missing pack and loaded-pack mismatch continue to take precedence. Distinct dialogue with no observed server click remains invalid evidence. The validator never sets `actual_java_client_verified_by_this_tool=true`.

## Exact Agent 1 / Agent 3 handoff

1. Agent 3: On a **disposable account** and without touching Elrothiro or live saves, verify actual rev377 Java client `OPNPC1` clicks for the three NPCs and establish whether a corresponding server-side packet is observed. Provide only sanitised booleans, expected triggers, observed result categories, and read-only loaded `script.dat`/`script.idx` SHA-256 fingerprints; no player IDs, private paths, dialogue transcripts or raw packets in public GitHub.
2. Agent 1: If `server_click_unconfirmed_trace_transport_before_dialogue`, inspect client menu option -> packet encoding -> server decoder -> `OpNpcHandler` before editing dialogue or fallback. If packet is observed but hashes differ, resolve source/pack drift first. Only if packet is observed and pack fingerprints match should `OPNPC1` trigger/morph/multinpc/category/fallback precedence be investigated.
3. Agent 3: Only after a narrow approved fix, independently verify actual conversation choices, quest-stage side effects and logout/relogin in a protected test environment. GitHub CI and metadata counts do not prove gameplay.

## Validation

`python3 -m unittest discover -s content-factory/tests -p 'test_varrock_click_delivery_gate.py' -v` — 12 synthetic tests cover packet-confirmed/unconfirmed greeting, no-action, crash, distinct-dialogue contradiction, unverified observation, missing pack, pack drift, and absence of live evidence. Python syntax compile also checked locally. Tests use no game assets or actual private data.

**Unverified:** current Windows loaded pack, any actual server click trace, NPC numeric IDs, generic greeting root cause, real Java-client/relog results, and the scheduled GitHub metadata-harvest artifact (no verified scheduled run evidence available in this execution). The existing hourly `harvest_multi.py` workflow remains unchanged. No private Drive data, source code owned by local agents, active saves, NPC dialogue, maps, payments or emails were touched.

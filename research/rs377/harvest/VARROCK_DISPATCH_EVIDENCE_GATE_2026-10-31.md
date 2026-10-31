# Varrock NPC dispatch evidence gate (Reldo, Juliet, Romeo)

**31 October 2026. Source-only / offline validator, NOT a live game fix.** This tool consumes the existing `content-factory/audit_dispatch.py` report and optionally a **sanitised** Agent 3 report of the loaded script packs and Java client clicks. It does not read live saves, export dialogue, compile scripts, alter runtime files or infer NPC IDs.

Source reference: [pinned Lost City 377 content](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts). The exact existing source triggers are `opnpc1,reldo`, `opnpc1,juliet_multi_visible`, `opnpc1,romeo`. [Existing source trace](VARROCK_NPC_SOURCE_TRACE_2026-10-31.json) has commit/path/blob identities. **NPC numerical IDs, actual live loaded pack and actual client behaviour remain unverified by this tool.**

## Run on a disposable source checkout only

1. Agent 3 confirms a protected backup and uses an isolated, non-player content checkout, not the live directory. The actual running Java process and its loaded script pack fingerprint must be independently established before providing an observation.
2. Generate the existing audit as JSON, with both packs supplied where available:

```bash
python content-factory/audit_dispatch.py --content /path/to/disposable/content --script-dat /path/to/disposable/script.dat --script-idx /path/to/disposable/script.idx > /tmp/varrock-audit.json
python content-factory/verify_varrock_dispatch_evidence.py --audit /tmp/varrock-audit.json
```

3. When Agent 3 has verified the loaded process, use a **local private** JSON report of the following shape (dummy hashes here are NOT evidence):

```json
{
  "schema": "joshrs-377-agent3-dispatch-observation-v1",
  "evidence_method": "agent3_read_only_loaded_pack_fingerprint",
  "client_revision": 377,
  "disposable_test_account": true,
  "loaded_script_dat_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "loaded_script_idx_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "observations": {
    "reldo": {"result": "unverified", "click_reached_server": false, "relog_checked": false},
    "juliet": {"result": "unverified", "click_reached_server": false, "relog_checked": false},
    "romeo": {"result": "unverified", "click_reached_server": false, "relog_checked": false}
  }
}
```

Allowed result values: `distinct_dialogue`, `generic_greeting`, `no_action`, `crash`, `unverified`. **Do not put player names, addresses, save paths, account IDs, real dialogue, cache data or secrets into this JSON.** Run `python content-factory/verify_varrock_dispatch_evidence.py --audit /tmp/varrock-audit.json --agent3 /path/to/private/sanitised-observations.json --output /tmp/new-dispatch-report.json`; output uses exclusive create to avoid overwriting an existing report.

## Interpretation and handoff

- **Source missing/trigger missing:** Agent 1 investigates the source checkout and compiler first.
- **Script pack missing or loaded SHA mismatch:** Agent 1 and Agent 3 investigate stale/mismatched packs before blaming generic fallback.
- **Matching packs + generic greeting reported:** *fallback or dispatch suspected*, not proven. Trace `OPNPC1`, morph/multinpc and category/fallback precedence on the active process.
- **Matching packs + distinct dialogue reported:** Agent 3 reports a client route; the validator still marks `actual_java_client_verified_by_this_tool=false` and never asserts quest completion. Agent 3 must independently verify the conversation, stage changes and relog/persistence before a gameplay claim.
- **No observation:** remains awaiting Agent 3. No fictional NPC replacement text should be generated.

Tests: `python3 -m unittest discover -s content-factory/tests -p 'test_verify_varrock_dispatch_evidence.py' -v`. All fixtures are synthetic. This validator is separate from the single multi-source metadata harvester; it does not schedule, fetch or duplicate harvesting. No Jagex game assets or third-party dialogue are included.

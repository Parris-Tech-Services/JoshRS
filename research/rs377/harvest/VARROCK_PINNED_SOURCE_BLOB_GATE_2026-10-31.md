# Varrock 377 pinned source-identity gate — Reldo, Juliet and Romeo

**31 October 2026. Research/QA only; not a game patch.** This improvement addresses a missing link in the earlier source-vs-pack investigation: a file containing the expected `opnpc1` trigger might be a *different* version or a deliberate local customisation, even when its script packs have matching SHA-256 fingerprints. The previous audit could not distinguish this from the exact historical 377 baseline.

## New evidence and behaviour

`content-factory/audit_dispatch.py` now computes the Git blob SHA-1 of each audited source file's **exact bytes** (`SHA1("blob " + byte_length + NUL + file_bytes)`), and compares it with the three pinned source identities already recorded in [the public Varrock source trace](VARROCK_NPC_SOURCE_TRACE_2026-10-31.json) for LostCityRS/Content commit [44eab09081ef0f6c5f3eaabd1897a588ad7d9e50](https://github.com/LostCityRS/Content/tree/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50). The report exports only the hash, boolean and expected public blob ID; **no script text, paths, player data or proprietary assets**.

| Existing source | Exact public pinned Git blob SHA-1 | Expected script trigger |
| --- | --- | --- |
| Reldo | `a3af9aea051e92409b11c9d561a3381f2a824480` | `opnpc1,reldo` |
| Juliet | `510d1e770c86ae35da6bce3432074a7be44cce89` | `opnpc1,juliet_multi_visible` |
| Romeo | `b32098585ed83069be3cb0826551b20367970653` | `opnpc1,romeo` |

`content-factory/verify_varrock_dispatch_evidence.py` now validates this source-identity evidence, rejecting incomplete fields, substituted baseline hashes and contradictory `matches` booleans. A source that differs from the pinned baseline is classified `source_differs_from_pinned_377_review_customizations` **before** any speculative fallback diagnosis. A mismatch is **not automatically a bug**: it may be an intentional JoshRS customisation. Legacy audit JSON remains supported, with source identity **unknown** rather than assumed to match. The report still explicitly sets `actual_java_client_verified_by_this_tool=false`.

## Safe Agent 1 / Agent 3 workflow

1. **Agent 1** checks for ongoing ownership conflicts and reviews any source-identity differences against intentional personalised changes, `opnpc1`/morph/category routing and compiled script ID mapping. Do not replace or reset customised source just to match a public hash.
2. **Agent 3** uses an isolated, disposable 377 content checkout, not the running Windows game, to run the existing read-only audit:

   ```bash
   python3 content-factory/audit_dispatch.py --content /path/to/disposable/content --script-dat /path/to/disposable/script.dat --script-idx /path/to/disposable/script.idx > /tmp/varrock-audit.json
   python3 content-factory/verify_varrock_dispatch_evidence.py --audit /tmp/varrock-audit.json --output /tmp/varrock-pin-check-new.json
   ```

3. For any `source_matches_pinned_377=false`, compare the *actual local source change* privately before diagnosing the greeting. Source differences do **not** prove the running Java process loaded that checkout.
4. Agent 3 independently identifies the **running process's** loaded pack hashes and checks actual Java client clicks for each NPC, then performs relevant quest-state/relog checks on a disposable account. Do not publish private paths, save data or actual game dialogue.
5. Only Agent 1 may propose a narrowly scoped handler fix after the root cause is evidenced; Agent 3 owns the deployment/rollback and live acceptance.

## Validation and limitations

The isolated regression suite includes **9 new synthetic tests** for Git blob hash equivalence to `git hash-object`, all three public pin identities, deliberate local drift, absent source, contradictory evidence, substituted baseline, incomplete evidence, legacy compatibility and non-playability. The previous audit (3 tests) and evidence validator (12 tests) also passed locally: **24/24**. This is not a native RuneScript compiler test, a live Java-client test or a scheduled metadata-harvest artifact check.

**Unverified:** exact active Windows source revision, loaded Java process script pack, actual Romeo/Juliet/Reldo NPC numerical IDs, fallback greeting root cause and save persistence for these conversations. The existing hourly `harvest_multi.py` GitHub Action is unchanged; this is a separate local read-only evidence gate, not a new importer or second scheduled scanner.

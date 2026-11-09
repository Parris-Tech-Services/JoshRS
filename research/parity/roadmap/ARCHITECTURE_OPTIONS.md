# Architecture decision record ADR-JR-PARITY-001

**Date:** 2026-11-08. **Decision:** Option D — **hybrid three-profile architecture**, conditional on disposable integration prototype and a reviewed cost/rights gate. This is a research recommendation, not a completed architecture deployment.

**Owner-goal override:** [8 November 2026 private exact-content parity/risk ADR](../../../docs/decisions/2026-11-08-private-rune-parity-and-risk.md). The **private family's requested content** is faithful Jagex-authored RuneScape, OSRS and RS3, not merely inspired alternatives. Internal profile names ending in `-like` are legacy engineering identifiers, **not a fidelity reduction or a permission to fabricate replacement content**. Owner acceptance of legal risk does not grant content rights; rights must be independently tracked, with no protected asset distribution in this public repository.

## Four candidate approaches

| Dimension | A: extend 377 client+server | B: modern client on 377 server | C: one new universal engine | D: hybrid preserved legacy + separate modern profiles |
| --- | --- | --- | --- | --- |
| 377 save preservation | Moderate, schema coupling risk | Moderate, adapter coupling risk | Weak, forced migration risk | **Strong, isolated** |
| Authentic historical protocol and feel | **Strong** | Moderate | Weak unless re-created | **Strong, keep legacy** |
| Sailing moving platforms and sea world | Weak: significant client limitations | Moderate | Strong with new rules | **Strong in modern profile** |
| RS3 EoC/action bars, abilities | Weak: interface and protocol absent | Moderate if major server rewrite | Strong | **Strong in RS3-specific profile** |
| Modern 3D/FX/mobile accessibility | Weak | **Strong** | **Strong** | **Strong** |
| Independent OSRS and RS3 rulesets | Weak | Complex | Possible but shared-state risks | **Strong via ruleset isolation** |
| Code duplication burden | Low initially, high compatibility tax | Medium | Lowest theoretical shared core; costly rewrite | Medium, shared *only stable* subsystems |
| Time to first family play | Fast if existing 377 works | Medium | Slow | **Fast with preserved 377** |
| Time to genuine modern vertical slice | Slow, protocol ceiling | Medium | Medium/slow | Medium with separate prototype |
| Source/dev licence constraints | Historical source/code/asset provenance | Same plus replacement client | Must establish all rights | Legacy protected; fidelity targets have independent per-asset rights gates |
| Production disruption | High if upgraded in place | High if network/save migrations | High if migrated | **Low if isolation is enforced** |
| CI/playtest automation | Existing 377 tests reusable | Needs adapter/old engine integration | Clean test model but rewrite cost | **Separate suites; unified evidence ledger** |
| Long-term maintenance | High backport complexity | High cross-era glue | High new-engine rewrite cost | **Medium/high but manageable boundaries** |

These are **engineering judgements, not timed benchmarks**. Verify selected approach by Gate-2 working prototype before permanent lock-in.

## Proposed architecture

```text
 Family-only Windows launcher / offline content selection
  | -- Legacy historical profile (rev274 reference and pinned native 377 world)
  |      \-- Existing 377 client + 377 engine/content + ORIGINAL private saves (untouched)
  |
  | -- OSRS fidelity-target modern profile (future rights-reviewed content pack)
  |      \-- Modern client/protocol adapter -> OSRS-specific ruleset and instances -> OSRS save store
  |
  \ -- RS3 fidelity-target modern profile (future rights-reviewed content pack)
         \-- Modern client/protocol adapter -> RS3-specific EoC/ability rules -> RS3 save store
                               |
         Shared HOUSEHOLD foundation (no item/quest state sharing by default):
           device enrolment, parent identity, offline registry, local-only gateway,
           original asset loader, backup/restore, logs, parity catalogue, QA runner.
```

## Boundaries and interface contracts

1. **Mode identity** is immutable: `game_profile_id` = `historic-274-reference`, `historic-377`, `modern-osrs-like`, or `modern-rs3-like`; `world_instance_id` and `save_schema_version` required on all writes. Do not give a 274 reference mode a fake live-world save record.
2. **Native protocol** belongs to the legacy 377 client. New modern clients negotiate a separate `capabilities` envelope. Never reuse unused 377 opcodes as silently "modern" packets without a new version/capability profile.
3. **Identity is shared, characters are not:** local household identity maps to `(profile_id, character_id)`. Each profile has distinct XP curves if necessary, item namespace, quest var namespace, combat rules, inventory capacities, bank rules and location graph.
4. **State is authoritative:** client sends intents (walk/interact/craft/cast); server enforces range, tick budget, prerequisites and atomic item/XP/quest writes. Actions have idempotency tokens and observable postconditions; no mock successes.
5. **Local security:** loopback by default; LAN only after explicit parent enrolment, interface binding and OS firewall allowlist. Never use public discovery, UPnP, a remote relay or paid identity service.
6. **Backups:** versioned snapshots with manifest `SHA256`, schema version and recovery drill. Separate production, staging and disposable directories. No direct shared DB access among game profiles.
7. **Compat adapter:** if shared quests or item concepts are desired, map canonical semantic IDs to per-mode IDs *only through a reviewed mapping table*; never infer equivalence from identical numeric IDs or names.
8. **Content rights:** Jagex client/cache/map/music/dialogue assets are not conferred by engine MIT licences. New original authored asset and story track; separate permission-needed column for authentic copyrighted content.
9. **Feature flags:** gate new features to one profile and disposable tester, not production. Disable cross-mode drops or item transfers until server-authoritative conversion/migration is defined and proven.
10. **Real gameplay evidence:** engine-source, compiled-asset and live-client proofs each have separate statuses.

## Prototyping order and reversible choices

- **P0:** intact 377 backup/restore and an actual two-character LAN playtest (do not assume).
- **P1:** a *separate* modern-client/server disposable world can load a small original region and two characters, persist one inventory item and one quest flag.
- **P2:** implement two rule modules operating on the same test framework but disjoint saves: OSRS-style click/tick combat and RS3-style ability/adrenaline. No copyrighted assets needed for an architecture proof.
- **P3:** a ship moves on a sea navigation mesh, docks, saves hull/upgrades; compare latency and frame-time against ordinary walking.
- **P4:** formal decision review: retain independent engines if rulesets diverge heavily; share only schema/security/QA if no measurable performance or maintenance benefit.

## Research questions requiring prototypes

Exact baseline hardware FPS and memory ceiling; private 377 client interface packing limits; modern client framework performance; multi-shard vs single process; database transactions/restore durability on Windows; authored original-content throughput; offline LAN packet loss and reconnect; content packaging and cold-boot with WAN disconnected.

## Source-based reasons

- [377 upstream pins](../../../deploy/jparris-windows/upstreams.json) and [274 lock](../../../docs/REFERENCE_VERSION_LOCK.json) confirm two incompatible historical version anchors.
- [Existing SDK bridge](../../../tools/rs377-chatgpt-bridge/README.md) confirms real native 377 protocol and the absence of fully observed UI/quest/bank/shop fields.
- [Family architecture](../FAMILY_OFFLINE_WORLD_ARCHITECTURE_2026-11-08.md) already specifies loopback-first local sessions and save recovery.
- Official OSRS [Sailing](https://oldschool.runescape.wiki/w/Sailing) requires actual boats, crew, ship facilities and hazardous sea; RS3 modern abilities need distinct combat state/UI. These do not follow merely from adding quest or item symbols to 377 packs.

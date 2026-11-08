# JoshRS technical compatibility and source reuse matrix

**Research cutoff:** 2026-11-08. Symbols such as `? live` mean **not verified on private Windows production**. Reuse claims are conditional on licences and actual pinned source.

| Layer / capability | Current evidence | 377 legacy | Modern OSRS-style | Modern RS3-style | Next proof |
| --- | --- | --- | --- | --- | --- |
| Historic 274 reference | `docs/REFERENCE_VERSION_LOCK.json` | Keep separate | Reference only | Reference only | Verify lock consistency |
| 377 Engine-TS tick and world | pinned `b5ac859` | **Preserve / extend carefully** | Prefer new ruleset server | Prefer new ruleset server | Disposable tick and concurrency tests |
| 377 Content scripts | pinned `44eab090` | **Reuse only verified and cleared parts** | Reference/crosswalk, not direct runtime import | Reference/crosswalk | Compile, original ownership, playthrough |
| 377 Java client | pinned `327880f` | **Preserve** | **Replace** for ship, maps and new UI | **Replace** for EoC/FX/action bars | Client capability POC |
| 377 packets/ISAAC/RSA | `tools/rs377-chatgpt-bridge` | Keep for native legacy client | New protocol layer | New protocol layer | Capture real dispatch/effect |
| 377 RS-SDK adapter | `tools/rs377-chatgpt-bridge`, `controller-boundary` | **Adapt and complete** | Adapter per modern protocol | Adapter per modern protocol | Real UI/shop/dialogue state |
| Native disposable CI | `content-factory/smoke_377.py`, `377-native-compile.yml` | **Reuse for isolated proof** | Add independent E2E | Add independent E2E | Real current-HEAD CI run |
| Windows launcher | `deploy/jparris-windows/` | **Reuse shell / add profile selection** | Extend selector, separate install | Extend selector | Play after WAN disconnected |
| Private saves | Actual host not inspected | **Never migrate in place** | New isolated DB | New isolated DB | Backup + restore into *copy* |
| 104 historical quest queue | `research/rs377/QUEST_QUEUE_2026-11-08.json` | Evidence queue | Historical lineage reference | Historical lineage reference | Reconcile PR #145/#148, fresh quest states |
| 673 NPC talk candidates | `research/rs377/npc_dialogue_audit_2026-11-08.json` | Triage | Semantic metadata only | Semantic metadata only | Spawn/handler/interaction test |
| Quest and stage engine | Source scripts/configs, not complete live proof | **Adapt/repair** | Versioned stage graph, persistent events | Same contract, distinct quests | Replay/idempotency and relog |
| Skills (21 native) | Native observer reports 21 indices in isolated tests | Preserve | Add Hunter, Construction, Sailing | Add Hunter, Construction and six RS3-only skills | XP/recipes/boost proof each |
| Combat | 377 historical client/server | Preserve mode | Native OSRS-style specials/spellbooks | Separate EoC ability, adrenaline, Necromancy | Damage and cooldown invariants |
| Boats and sea world | No playable modern system proved | Unsupported without large rewrite | New moving-entity/sea layer | Mode-dependent | Dock/move/relog POC |
| Character models, scene effects | Historical asset/renderer dependency | Keep historically scoped | New original/cleared renderer/pack | New original/cleared renderer/pack | FPS/collision/asset rights |
| Interfaces and action bars | Historical interface archives | Preserve | New skilling/sailing/POH UI | New EoC/multi-panel UI | Capture genuine input/action |
| Item containers and bank | Native inv state observed, full bank UI unresolved for SDK | Verify live | New atomic item storage/ID namespaces | Same with RS3-style charges/augmentation | Restart/dupe/death tests |
| Friends/chat/trading | Existing #49, local profile intention | Gate LAN clients and chat | No public social routes | No public social routes | Unknown-player rejection and no WAN |
| Active bots | Agent Manager prototype + pending PRs | Disposable tests only | Independent adapter | Independent adapter | Actual normal SDK account action |
| CI and verification ledger | Existing scripts and parity catalogues | Reuse separate 377 CI | Add modern profiles | Add modern profiles | Strict VERIFIED_PLAYABLE proof policy |
| Rights and provenance | AGENTS and content factory; PR #141 | Review every asset | Original/cleared assets | Original/cleared assets | File-level provenance manifest |
| Hardware and deployment | JParris Desktop inaccessible | Real benchmark unknown | Profile-specific FPS/memory target | Profile-specific FPS/memory target | Hardware test before release |

### Compatibility classifications

**Preserve:** Native 377 client, current 377 save path and 274 reference; no in-place upgrade. **Adapt:** historical quest, dialogue and agent observation where actually sourced, compatible and authorised. **Replace:** modern rendering/control/UI/protocol requirements incompatible with the historical protocol. **Share:** household auth, backups, rights manifest, content-index generator and test evidence; **never share item IDs or quest flags without explicit mapping**.

### Review gates

1. Check precise checked-out engine/content/client hashes and runtime packer behaviour.
2. Verify asset/protocol licence independently; third-party engine licence does not license caches.
3. Build in disposable isolated world.
4. Verify authentic player-caused state transitions, no privileged grants.
5. Prove save/relog and two-device LAN only when family device permissions allow.
6. Do not apply an unverified overlay to the real 377 world.

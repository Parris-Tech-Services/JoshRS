# JoshRS complete-parity engineering roadmap

**Version:** 2026-11-08; **state:** researched and proposed, not implemented. **Profiles:** historic 274 reference; private historic 377; separate OSRS-style and RS3-style modern experiences. This roadmap's high-level *P0–P12 release gates* intentionally differ from the task backlog's *P0–P9 engineering workstreams*. They are mapped below; do not assume phase number equality.

## Architecture and definition of done

**Decision:** hybrid preservation. The native 377 client and historical saves are **not** the modern client's deployment target. The shared platform may provide only identity, security, backups, launcher, provenance, telemetry and tests. Rules, combat, quest flags, item IDs and maps remain version-specific unless proven compatible.

A feature is **VERIFIED_PLAYABLE** only after: (a) correct source + licence/provenance; (b) target mode/client/server SHA, packed assets and schema; (c) real normal client input and server-authoritative effect; (d) edge/error checks; (e) save/relogin; and (f) two-player test if co-op. Source-implemented, pack-compiled, CI fixture-passed and gameplay-verified are distinct.

## Release gates

| Gate | Engineering deliverable | Task IDs | Mandatory result |
| --- | --- | --- | --- |
| **P0: Protect** | Read-only actual host inventory, source pins, backups, restore, PR overlap | JR-001–JR-010 | Two restore-checked backups, no production writes; #52 data-loss investigation |
| **P1: Private Family Foundation** | Offline registration, parent-child auth, optional approved LAN, two clients, transactions | JR-011–JR-020 | No WAN; unknown client denied; two independent real accounts can move, interact and relog |
| **P2: Durable Cross-Version Core** | Profile ID, capability protocol, namespaces, migration and event proof | JR-021–JR-030 | No cross-profile item/XP writes or migration without backup; replay safe |
| **P3: Real 377 Completeness** | 104 quest audit, 27 candidates, 673 NPC audit, skills, bank, object/combat tests | JR-031–JR-042 | Historical progress counted **quest-by-quest and NPC-by-NPC**, no fabricated 77 playable |
| **P4: Modern Client/World** | Modern render, terrain, geometry, UI, boat/instances original POC | JR-043–JR-056 | Two devices view moving boat, a UI action and a persisted item/quest in isolated prototype |
| **P5: OSRS Mechanics** | Distinct old-style combat, Hunter, Construction, Sailing, prayers/spells | JR-057–JR-068 | Independent complete activity loops, skills XP, ship dock/relog and local persistence |
| **P6: OSRS Content** | Versioned quest DAG, modern world regions, NPCs, bosses/raids, minigames, achievements | JR-069–JR-078 | Per-entity proof; one full quest + co-op instance; every untested record explicitly pending |
| **P7: RS3 Combat/Skills** | EoC, abilities/adrenaline, Necromancy, Summoning, Dungeoneering, Divination, Invention | JR-079–JR-088 | Distinct RS3 rules/skill caps; ability and ritual evidence, no 377 state conflicts |
| **P8: RS3 Content** | Archaeology, original RS3-style regions/stories/bosses, skills 110/120, ports/farms/logs | JR-089–JR-096 | Region traversal and persistent multi-step content with solo/duo game evidence |
| **P9: Exhaustive Gap Catalogue** | Full reference pagination and item/NPC/quest map crosswalk | JR-098, JR-030 | Every page cursor and version source logged; never call partial extraction "100%" |
| **P10: Family UX** | Accessible controls, friendly companion NPCs, quiet modes, parental permissions | JR-097 plus JR-014–016, 050, 056, 063, 074 | Child profile cannot fight other players or join stranger servers; parent retains authentic mode |
| **P11: Release Hardening** | Performance, rights/privacy and backup recovery tests | JR-099–JR-100 | Full clean offline install; zero unsolicited WAN; two-PC save recovery and publishable rights review |
| **P12: Living Updates** | Continuous source cutoff reconciliation, content test queues and new official releases | JR-098 + repeat cycles | Every modern update tagged released/planned/reworked/seasonal and assigned a verification queue |

### First usable milestones

**M1 — preservation proof:** Completed JR-001..010, signed backup manifest and a disposable recoverable world; no content port is permitted to sidestep M1.

**M2 — fun family session:** Completed local auth and genuine 2-client presence (JR-011..020), one real quest interaction and item/currency persistence; **no internet or public chat**.

**M3 — legacy completeness ledger:** Per-quest stage proof of all 104 slots, triage of 673 NPC candidates and one verified action per native skill; incomplete work stays visible.

**M4 — modern-client vertical slice:** Independently authored village/shore, 2 characters, two working resource loops, a quest with choices, a live shop/bank, movement/collision, boat, save/relog and offline LAN.

**M5 — Sailing and co-op:** A sea mesh, owned ship, upgrade, crew and 2-player voyage with safe docking, cargo transaction and persistence.

**M6 — distinct combat modes:** Original OSRS-style combat special-attack system and original RS3-style adrenaline/action bars/combat abilities, verified independently with distinct characters.

**M7 — extensive parity:** Modern quests, areas and all items/NPCs catalogued via API/official releases; per-entity red-green proof and rights review.

### Quest port ordering

Maintain **separate** historical rev377 and modern quests. User preference: newest-to-oldest **among currently feasible, rights-cleared tasks**; prerequisite chains may force an older unlock first. Every quest row must show historical release date, latest PR/branch, source/completed/unverified stage, gameplay blockers, item/NPC/region links, reward-once proof, save/relog and exact test world. PR #148 five quest scaffolds and PR #145 six quest reconstructions are **in-flight**; do not merge both blindly or double-register varps/quest points.

### NPC and world approach

Prioritise living towns (bankers, cook, shopkeepers, guides, quests, service NPCs), then reachable quest-critical characters, creatures, bosses and dynamic/morph NPCs. Verify NPC movement, click option, full dialogue choices, path to player, render/model rights and persistence. Static map NPC density is not a sufficient realism metric.

### Automated content pipeline

1. **Enumerate** OSRS, RS3 and historical reference entity metadata by unique version IDs, redirects, page-cursor and dated source.
2. **Crosswalk** entities to independently pinned 377 code/pack or new modern-original catalogue; detect name/ID collisions.
3. **Classify** supported in source, stage incomplete, not in version, client incompatible, unverified, rights blocked. Never classify absence from search as known missing.
4. **Write original content spec** with stable canonical ID, version-specific ID, requirements, NPC/item/loc links, outcomes, tests and provenance.
5. **Compile/test** in CI disposable world; fail closed on packet/cache/id collisions and untested migrations.
6. **Gameplay probe** normal account; capture actual before→action→after and save/relog; manually review non-deterministic quests.
7. **Promote** only to selected isolated profile after parental/local deployment approval and verified recoverability.
8. **Measure coverage** by category and evidence, never by collapsed all-era totals. A generated NPC name/quest file is a research finding, not a playable feature.

### Parallel agent ownership

**Agent A:** preserving 377, backup, no-disruption and quest/NPC source. **Agent B:** independent modern client/protocol/UI. **Agent C:** OSRS-style skills/Sailing/world. **Agent D:** RS3-style ability/skills/content. **Agent E:** QA, provenance, scraper metadata and dependency ledger. All commit narrowly scoped files; **only one operator controls production runtime**. No agent may autonomously merge high-risk content, access private saves or run unsupervised account modifications.

### Why the full programme is not "one or two months"

Even modern OSRS-only has ~24 interrelated skills, hundreds of quests/miniquests across its lineage, a huge item/monster/area corpus and complex group encounters; RS3 adds a separate modern interface, six additional exclusive skill concepts, different combat and another decades-long content lineage. The total modern reference catalogue has **not been exhaustively paginated**. Without a production client sample and full content count, any exact completion date or percentage would be misleading. See [effort ranges](ESTIMATES_AND_RISKS.md).

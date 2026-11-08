# JoshRS parity — engineering estimates and uncertainty

**Date:** 8 November 2026. Ranges below are **research planning estimates, not observed productivity, fixed quotes or delivery commitments**. No modern client prototype benchmark, full current reference catalogue, or verified desktop save audit exists. A "person-month" assumes one engineer approximately full time for a month, not 24-hour AI agent execution.

## 1. System-scale planning assumptions

- Existing 377 code and scripts help only for historical content and technical experiments; they do **not** supply modern RS3 EoC, OSRS Sailing navigation or complete modern client assets.
- Source-only 77/104 "complete" quests is **not** equivalent to 77 live-completable quests.
- The modern reference scope includes **separate 24-skill OSRS and 29-skill RS3 profiles**, with a 30-skill concept union but many distinct methods, interface features and reward curves.
- Exact quest denominators are dynamic; 184 OSRS as of September and two added + Daddy's Home moved to full quest on 3 Nov; RS3 277 as of 28 Sep 2026. **No verified exhaustive current quests/items/NPCs** at this cutoff.
- A historical emulator's MIT engine alone does not clear rights to original RuneScape client, quest text, models, maps or music.
- Family-only LAN and offline install do not require a distributed, globally scalable MMO service; this reduces network operations but *not* the content-authoring labour.

## 2. Initial planning envelopes

| Workstream | Minimum credible vertical-slice effort | Broad production-quality programme (not full content parity) | Most important uncertainty |
| --- | --- | --- | --- |
| Protect/restore 377 and prove two-player session | 2–6 engineer-weeks | 2–4 engineer-months | Real desktop state, active DB, live chest bug |
| Family LAN, authentication, persistence and permissions | 4–12 engineer-weeks | 4–10 engineer-months | OS firewall, hard disconnect, two-client tests |
| Versioned schemas/ruleset/protocol architecture | 6–16 engineer-weeks | 6–18 engineer-months | Degree of safe code sharing and eventual renderer |
| Modern client, scene/collision/UI baseline | 3–8 engineer-months | 12–30 engineer-months | Rendering stack choice, target devices and 3D asset pipeline |
| Original OSRS-like core skills + Sailing boat MVP | 3–8 engineer-months | 12–36 engineer-months | Ship/sea simulation, ports, production chain complexity |
| Original RS3-like EoC and Necromancy MVP | 4–10 engineer-months | 12–40 engineer-months | Ability balancing, animation/asset burdens, creature AI |
| 377 quest/NPC/source completeness QA | 3–12 engineer-months | 12–36 engineer-months | Hidden script dependencies; 27 source candidates; 673 dialogue candidates |
| Reference metadata crawling and crosswalk | 4–12 engineer-weeks | 6–18 engineer-months | Wiki category semantics, page limits, IDs and provenance |
| Original modern quest/world/content at vast scale | Not meaningfully estimable until 3 vertical-slice packs | **Many years of multidisciplinary production** | Total unique quests/areas/assets/methods and permissions |
| Automated gameplay acceptance, regression and hardening | 6–14 engineer-weeks initial | Continual (roughly 15–30% of engineering effort after foundations) | Real client observability, deterministic isolated runs |

**These overlap and must not be added into an exact project finish date.** A production-quality technical platform and a complete commercial-MMO-scale content catalogue are different scopes.

## 3. Illustrative staffing scenarios

| Team | Near-term attainable target | Full exact OSRS+RS3 parity |
| --- | --- | --- |
| One developer + coding AI | Verified 377 restoration, carefully scoped family LAN, first independently authored modern vertical slice over **months to years** | **Likely multiple years to decades** if genuinely all content, assets and live QA are required; cannot produce a reliable forecast without catalogue and time-study |
| 3–5 dedicated developers + AI | Architecture prototype and first complete systems in roughly **1–2 years** subject to source/evidence and asset scope | **Multi-year** program with artists, writers, content designers, QA, legal and operations work; not assured |
| 10+ skilled multidisciplinary contributors | Parallel client, server, content and QA once contracts are frozen | Still a **multi-year, rights-dependent** undertaking; more contributors can increase integration and consistency costs |

**Initial effort confidence:** LOW. Update once JR-006 (restore), JR-016 (genuine family session), JR-043 (modern original client prototype), JR-055 (boat prototype), and JR-080 (ability vertical slice) are independently timed and measured.

## 4. Hard technical risks and mitigation

| Risk | Severity | Evidence | Mitigation |
| --- | --- | --- | --- |
| Loss of historical family character progress | **Critical** | Existing #52 item-loss issue and no full live restore proof | immutable backup, restore drill, transaction journal, stop-the-line on mismatch |
| Unknowingly merging conflicting quest branches | **High** | Open PR #145/#148 and existing quest status queue | same quest/varp registration overlap audit; compile and reward-once tests |
| Assuming 377 client renders RS3 mechanics | **High** | Separate 377 ISAAC packet client, modern EoC UI/ship demands | modern independent client, explicit capabilities |
| ID/varp collision across versions | **Critical** | 274/377 modern entities share names but not stable numeric IDs | profile namespacing and verified semantic crosswalk |
| Incomplete source interpreted as playable | **High** | 77 quest source labels and 673 handler candidates are not live tests | source vs pack vs live evidence ledger |
| Jagex copyrighted content in public repository | **High** | Published policy §6.1.3 and code/asset licence split | provenance manifest, CI block, separately seek permission |
| Huge, never-ending modern reference scope | **High** | Live 2026 game updates | dated cutoffs, rolling catalogue, staged release gates |
| AI agents claim unobserved success | **High** | Incomplete `BotWorldState` and manager fixtures | genuine event postcondition and rejected fabricated state |
| Poor low-end performance | Medium/High | No current hardware benchmark for modern client | visual quality presets, tile culling, 30/60 FPS budgets and measured tests |
| Child safety settings only enforced in client | **High** | UI alone is bypassable via packets | server-authoritative per-account permissions, deny by default |
| Expensive cloud dependencies | Medium | Offline-first objective | local server/storage, no remote auth or paid services |
| Licence contagion in code reuse | High | Third-party AGPL/GPL/BSD/MIT mix | file-by-file licence audit and separate compliant modules |

## 5. Estimation checkpoint protocol

Measure in isolated proof-of-concept runs: (a) feature design hours; (b) script/code/asset work; (c) test defects and retests; (d) content authoring time per fully playable quest/NPC/item/region; (e) performance/support/maintenance; (f) rights/provenance review. Re-estimate from median work on several **real** exemplars per category. Only then model remaining counts and critical-path staffing.

**Stop condition:** If a milestone lacks licensed assets, verified saves or target-client ability, mark it BLOCKED rather than quietly dropping tests or shortening the definition of "everything".

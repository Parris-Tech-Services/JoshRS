# Scope, evidence and coverage of the 8 November 2026 parity roadmap

**Cutoff:** 2026-11-08 (Australia/Sydney). This is the *research and engineering-roadmap package*, not a claim of exhaustive RuneScape inventory or released family product.

## 1. Evidence hierarchy

1. **VERIFIED_PLAYABLE:** observed real client input → authoritative server state change → save/relog with matching versioned environment and test log.
2. **ISOLATED_ENGINE_PROOF:** CI built/ran actual pinned 377 engine with a disposable account; **not** family live proof.
3. **COMPILED_SOURCE / SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED:** source and/or native pack compile with known gaps; cannot imply complete quest.
4. **REPOSITORY_AUDIT:** source-derived status such as 77/104 and 673 NPC candidates, exact JSON/CSV source; may be stale vs pending PRs/local checkout.
5. **PUBLIC_REFERENCE_CONFIRMED:** source game feature/date/count supported by dated official or curated wiki sources.
6. **RESEARCH_SEED / NOT_AUDITED:** a proposed modern category/item/name or engineering work order with no item-specific runtime proof.

All `implementation_backlog_first_100.json` statuses are **NOT_STARTED_OR_NOT_RECONCILED** (not "confirmed absent"). Real local work may have progressed after these public commits.

## 2. Sources and specific facts actually checked

| Source | URL/repo | Concrete finding | Freshness / caveat |
| --- | --- | --- | --- |
| JoshRS README | [main](../../../README.md) | Public launch site links to external 2004Scape; Woodlands is independent | GitHub fetched 8 Nov |
| Historical 274 version lock | [lock JSON](../../../docs/REFERENCE_VERSION_LOCK.json) | BASE-02 revision 274, 23 Nov 2004, pinned engine+content | Repo manifest |
| Windows 377 source manifest | [pins](../../../deploy/jparris-windows/upstreams.json) | 377 branch pins: engine b5ac859, content 44eab090, client 327880f; local 52402/8888 default ports | Actual Windows checkout **not inspected** |
| Existing quest audit | [queue JSON](../../rs377/QUEST_QUEUE_2026-11-08.json) | 104 entries, 77 source complete, 4 stub, 23 not started | Source classification; pending PRs may supersede |
| Existing NPC audit | [dialogue JSON](../../rs377/npc_dialogue_audit_2026-11-08.json) | 3850 definitions, 1799 Talk-to, 673 candidate missing handlers, 487 spawned | Not a count of confirmed game defects |
| 377 RS-SDK bridge | [README](../../../tools/rs377-chatgpt-bridge/README.md) | Genuine isolated engine state partly observable; full bank/shop/dialogue/UI absent | A source-level claim backed by linked CI; current family world unknown |
| Windows Manager | [README](../../../tools/rs377-agent-manager/README.md) | Local UI and safe disposable goal execution; bot-world full SDK unproven | Not approved for real family accounts |
| OSRS official news | https://oldschool.runescape.com/ | 3 Nov 2026 two surprise quests, 4 Nov hardcore worlds, 5 Nov name release | News checked 8 Nov; later updates may change content |
| OSRS quest wiki | https://oldschool.runescape.wiki/w/Quests/Release_dates | September 8 last enumerated 2026 quests in cached list | Older wiki snapshot **not November completeness** |
| OSRS Sailing wiki | https://oldschool.runescape.wiki/w/Sailing | Released 19 Nov 2025; boats with hull/helm/mast/sails; crew, shipyards, sea charting, courier/salvage | Modern feature engineering requirements |
| RS3 wiki | https://runescape.wiki/w/Quests | **277 quests and 476 QP as at 28 Sep 2026** | Dated RS3 count, not post-Sep proof |
| RS3 official news | https://www.runescape.com/community | Nov 2 and Nov 3 updates; latest list includes Nov 6 developer/community items | No confirmation of a new post-Sep permanent quest in viewed news |
| Jagex fan policy | https://legal.jagex.com/docs/policies/fan-content-policy | §6.1.3 specifically excludes private game server/game software using its IP | No automatic exception for noncommercial project |
| Open content framework | https://github.com/LostCityRS/Engine-TS | MIT engine code possible; original Jagex client/cache assets separately restricted | Verify exact current pinned package and per-file rights |
| Open RSMod/Alter | https://github.com/AlterRSPS/Alter | Modular Kotlin OSRS-style framework; client and cache dependencies distinct | Engineering reference, not content rights clearance |

### 3. Quest-count reconciliation

RS3: **277** as of 2026-09-28 (the [RuneScape Wiki](https://runescape.wiki/w/Quests) and [release date table](https://runescape.wiki/w/List_of_quests_and_miniquests_by_release_date) agree). OSRS: a September wiki reference says **184** (different views/counting conventions must be checked); on [3 November 2026](https://oldschool.runescape.com/) **two new quests** were released, and **Daddy's Home** was upgraded from miniquest to full quest. This implies **up to +3 on a fixed counting basis, i.e. 187 if the 184 baseline was exact**, but **187 is a derived estimate, not an independently verified current Quest List**. Some wiki release tables disagree by one if special quests are classified differently. Preserve the ambiguity rather than invent a strict denominator.

### 4. New reusable data outputs

- [Historical 104 quest rows](../data/rev377_104_quest_source_crosswalk_2026-11-08.csv): all native quest-list entries, audit statuses and link to missing NPC handler candidates.
- [673 NPC Talk-to candidates](../data/rev377_673_npc_talkto_candidates_2026-11-08.csv): name/ID/map status/spawn count/area and reference, not proof of failure.
- [30 distinct skill concepts](../data/skill_systems_union_2026-11-08.csv): modern 24+29 set union with historical fit.
- [474 modern feature research leads](../data/modern_feature_research_seed_2026-11-08.csv): named quests, systems, bosses, locations, skill loops, items etc; **seed list, not exhaustive**.
- [100 engineering work orders](data/implementation_backlog_first_100.json): dependently actionable, not proof of absence.
- [228 proposed dependency links](data/dependency_graph.json): technical ordering, not a timed critical path.

## 5. Unfinished research — the exact continuation needed

**Open:** full modern OSRS and RS3 page-wise quest, item, NPC, equipment, ability, boss, map, loc and recipe enumeration; per-source release and ID reconciliation; modern entity-to-377 semantics and rights; 377 item/loc/drop tables *complete* parser inventory; branch heads and active PR merge status after audit; installed Windows client/engine/pack hashes; real production character, world and save checks; 30-skill per-level training actions; complete live quest stage evidence.

**Automatable next:** use [the metadata-only page crawler](../../../tools/parity-inventory/scan.mjs) with `--live --budget` and explicit checkpoints, respecting wiki API access. Do **not** run a mass scrape without checking host policies and configuration. A category member is **not** necessarily an entity. Record unique count and unresolved redirects/categories; stop on continuation, errors, licensing or rate limits. Avoid copying entire wiki pages or private cache data to the public repository.

**Highest-leverage next engineering:** JR-001 through JR-010; protect the save before any merge/deployment. PR #141 already contains a historical content-roadmap proposal—do not reimplement without branch reconciliation.

## 6. Project limitations

- Host/source evidence comes from the accessible public repository. The private desktop game and player saves were not read.
- The most recent GitHub code search indexed SHA `49d626717d7ec952813d0f7655b5285803b0da3c`; **this is an observed search ref, not guaranteed HEAD** as other agents commit.
- The 19 open PRs and 14 open issues returned by current repository searches are point-in-time search results, not proof all were exhaustively paged.
- This roadmap's implementation tasks are authored proposed specifications; **no tested modern gameplay implementation was committed in this research package**.

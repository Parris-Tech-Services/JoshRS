# JoshRS Ultimate Parity Roadmap — Executive Assessment

**Research cutoff:** 8 November 2026, Australia/Sydney. **Evidence:** public current GitHub files and repo PR/issues; OSRS/RS3 news and wiki pages; no personal desktop or family save access. **Overall:** RESEARCH PARTIALLY COMPLETE, LIVE FAMILY ENVIRONMENT NOT VERIFIED. No gameplay changes installed.

## Executive decision

**Use Option D: a hybrid, three-experience architecture.** Preserve the pinned historical 274 design and private 377 local world; launch two independently versioned modern game profiles inspired by OSRS and RS3, with carefully shared offline launcher, local family account identities, backup/restore, observability and QA. Do not merge incompatible quest flags, ability systems, world geography or item IDs into the legacy save schema. A modern client capability boundary is mandatory.

### Distinct products rather than a fictional "one JoshRS world"

| Target | Actual established state | Recommended path |
| --- | --- | --- |
| 274 reference | `docs/REFERENCE_VERSION_LOCK.json` fixes date 2004-11-23, rev 274, Engine-TS `1d25566cb53e7af1b1cb18ade8af996316c19614`, Content `65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe` | Preserve history; do not turn this into an OSRS/RS3 release |
| Private 377 local world | `deploy/jparris-windows/upstreams.json` pins Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, Client-Java `327880f6de74b40c420705bc42e4b34284885087`; `NODE` requirements and 377 TCP protocol | Immutable backup + real-world proof first; source-only patches gated |
| Public JoshRS site | `README.md` says launcher links to external 2004Scape and runs original Woodlands demo | Keep separate from actual 377 game; never claim public game parity |
| 225 RS-SDK | Separate experimental test server | Never use its quest/AI evidence to certify 377 |
| 377 SDK bridge/agents | Observable real disposable-world login, movement, ticks and some saves in repository-described CI; complete `BotWorldState`, UI, bank/shop/dialogue/combat remain unresolved; manager not certified for family world | Complete actual state feed and real agent action effects in isolated world |
| Modern OSRS-style profile | **No source-backed deployed complete experience located** | Independent ruleset, client, original content pack, fully local |
| Modern RS3-style profile | **No source-backed deployed complete experience located** | Distinct EoC/rules and UI, original content pack, fully local |

### Confirmed audit populations — do not equate to gameplay

- Existing rev377 source quest queue lists **104** historical quest-list entries, **77** source-classified complete, **4** stubs and **23** unstarted. **Zero** of these figures establishes a fresh-account full playthrough.
- NPC audit counts **3,850 definitions**, **1,799 Talk-to definitions**, **673** unresolved handler candidates, including **487** statically spawned. Candidate != bug.
- Combined modern skill taxonomy contains **30 distinct skill concepts**: 24 OSRS, 29 RS3, 21 shared historical.
- The initial modern seed of **474 named entries** is a *research queue*, NOT a complete modern feature inventory nor a list of confirmed JoshRS gaps.
- Modern quest counts are date-dependent: RS3 **277 as of 28 September 2026**; OSRS **184 September snapshot**, then the **3 November 2026** release added two quests and promoted a miniquest to quest. A provisional derived **187** is **not an individually reconciled official 8 November count**.

### Conflicts and live work to reconcile before any quest port

[PR #148](https://github.com/Parris-Tech-Services/JoshRS/pull/148) has five **compiled scaffolds**, not completed playthroughs. [PR #145](https://github.com/Parris-Tech-Services/JoshRS/pull/145) has six source reconstructions, not proven runtime completions. [PR #141](https://github.com/Parris-Tech-Services/JoshRS/pull/141) already drafts a content/rights roadmap; this set addresses **full three-experience engine architecture** and must not overwrite or silently merge its content. [PR #139](https://github.com/Parris-Tech-Services/JoshRS/pull/139) separately attempts a real signpost test. [Issue #52](https://github.com/Parris-Tech-Services/JoshRS/issues/52) reports a Party Drop Chest item-loss risk; [Issue #30](https://github.com/Parris-Tech-Services/JoshRS/issues/30) records live game/save proof missing. Existing bot and NPC PRs must not be marked integrated merely because open.

### Decision checkpoints

**Gate 0:** Read-only active host, exact executable/content/cache/save hashes, two clean backups and isolated restoration. **Do not run a migration on real family accounts.**

**Gate 1:** Real normal-login solo play with WAN disconnected; two approved LAN accounts can share a world; genuine persistence/reconnect and strict outside-client denial.

**Gate 2:** Version-aware character data contract and original modern-client vertical slice: move, interact, collect, save, load, bank, dialogue, progress and multiplayer observed from two clients.

**Gate 3:** Independent OSRS and RS3 rulesets with automated reference-regression tests and no cross-world ID corruption.

**Gate 4:** All quest/item/NPC/region features enumerated, reconciled and individually game-tested with rights gate; a repository presence claim is insufficient.

## What is NOT complete

No read of private JParrisDesktop filesystem or running 377 session; no full modern OSRS/RS3 item/NPC/quest/ability/location crawl; no confirmed production 377 character restore; no finished end-to-end family LAN; no modern 377-compatible Sailing/EoC implementation; no rights clearance for exact game assets. This roadmap is implementation-ready **planning and prioritisation**, not a release.

## Companion documents

[Architecture decision](ARCHITECTURE_OPTIONS.md) · [Technical compatibility](TECHNICAL_COMPATIBILITY_MATRIX.md) · [Master roadmap](MASTER_ROADMAP.md) · [Dependency graph](DEPENDENCY_GRAPH.md) · [First 100 tasks](FIRST_100_ENGINEERING_TASKS.md) · [Research coverage](RESEARCH_COVERAGE.md) · [Rights register](CONTENT_RIGHTS_REGISTER.md).

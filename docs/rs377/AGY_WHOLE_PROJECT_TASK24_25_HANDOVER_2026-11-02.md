# Agy whole-project execution handover — 2 November 2026

## Start here: source of truth, not a standalone task prompt
Read in order:
1. [Root AGENTS.md](../../AGENTS.md) — ownership and agent boundaries.
2. [Project-wide master backlog](../JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md) — ALL JoshRS workstreams, not only bots.
3. [42 ChatGPT-owned tasks](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md) — exact task descriptions, checked source deliverables, links, and remaining work.
4. [Agy's separate 71-task companion checklist](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/docs/rs377/AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md) — branch-specific Agy work; PR #62 remains a draft until verified otherwise.
5. [111-task AI agent checklist](AI_AGENTS_MASTER_TODO_2026-11-02.md), [114-item MMO checklist](../FULL_CLASSIC_MMO_CHECKLIST.md), [deduplicated dependency matrix](CHATGPT_TASK_04_BOT_WORK_DEDUP_2026-11-02.md), [source dependency map](CHATGPT_TASK_03_SOURCE_DEPENDENCY_MAP_2026-11-02.md), [topology](TASK_05_NETWORK_TOPOLOGY.md), [pinned SDK audit](CHATGPT_TASK_07_PINNED_RSSDK_API_AUDIT_2026-11-02.md).
6. [Pinned revision-377 sources](../../deploy/jparris-windows/upstreams.json) and actual GitHub main HEAD. Do not rely on historic handover claims over current source.

## Whole project goal
JoshRS includes a 2004Scape-inspired web launcher and original Woodlands demo, a separately installed revision-377 desktop MMO server/client, modernisation/gameplay/quest/social/mobile ambitions, and autonomous companion agents. The immediate companion goal is **a real, persistent, ordinary-gameplay, no-cheat bot visibly playing alongside Elrothiro on the same authoritative world**, including movement, chat, interactions, gathering and progress. A separate disposable world is a necessary safe development gate, **not** final same-world acceptance. A source-only bridge, green CI, synthetic snapshot or server-only screenshot is not playable-bot proof.

## The complete 42-task map (ChatGPT-owned, not silently delegated to Agy)
1 ownership; 2 GitHub/environment audit; 3 dependency map; 4 deduplicate backlog; 5 topology; 6 pinned engine/client/content audit; 7 pinned RS-SDK contract; 8 capability matrix; 9 licensing/security; 10 missing machine facts; 11 Fedora bootstrap hardening; 12 bootstrap failure fixtures; 13 read-only preflight; 14 cross-host network doctor; 15 Fedora entrypoint; 16 safe bot configuration; 17 RSA/CRC key safety; 18 bot doctor; 19 Agy handoff; 20 CI repair; 21 native protocol; 22 login/session; 23 normal-player packet builders; 24 real observation; 25 SDK adapter; 26 gateway security; 27 observed-effect tracking; 28 bounded reconnect; 29 goal/executor boundary; 30 typed tools; 31 follow/chat modes; 32 no-cheat gathering scenario; 33 regression tests; 34 disposable integration entrypoint; 35 two-client assertions; 36 real gameplay acceptance; 37 evidence parser; 38 cross-platform gates; 39 rollback; 40 tested handoff; 41 safe merge; 42 five-way proof.

**Status must be independently reconciled**: the tracker contains source-deliverable ticks, not necessarily runtime proof. It currently marks task 24 checked for *source-only observation contract* while the actual live native observation pipeline remains unverified. Task 25 is unchecked. Do not silently reassign the 42 ChatGPT tasks; identify Fedora-only execution steps Agy can own, and coordinate changes to avoid collisions.

## Current integration work and evidence
- PR #69: native 377 protocol, login, packet builders, observer and SDK source mapping.
- PR #77 and #78: native observer adapter and opt-in engine HTTP observer; native compile/disposable engine boot passed but real network bot observation not established.
- PR #81: SDK action mapper now calls authenticated native session packet transport, but action effects remain unverified.
- PR #82: authenticated loopback SDK state/action HTTP adapter, tests passed; **not** yet upstream RS-SDK gateway protocol parity.
- PR #80: companion state machine, no-cheat scenarios and disposable/two-client acceptance scaffolding, offline CI passed.
- Source files: `tools/rs377-chatgpt-bridge/src/{protocol,session,observation,native-observer,engine-observer,sdk-bridge,sdk-runtime,sdk-gateway}.mjs`; `tools/rs377-bot-bench/engine-patch/src/web.ts`; `tools/rs377-companion-contract/`; `.github/workflows/377-native-compile.yml`.
- Pinned upstream Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, Client-Java `327880f6de74b40c420705bc42e4b34284885087`; RS-SDK pin must be verified from actual pinned source/audit.
- Fedora checkout: `/home/josh/dev/JoshRS/`. Windows JParrisDesktop and Fedora may not be the same authoritative world. Verify, do not assume.

## Immediate mission: finish Tasks 24 and 25 in full-project context
1. Inspect git status, active processes, ports and source ownership without modifying production or discarding local edits. Identify which server is authoritative for Elrothiro; **do not touch it** during disposable tests.
2. Prepare isolated engine/content, distinct ports, SQLite DB, save directories, account, public key/CRC, and token. Do not copy private server keys or expose listener publicly.
3. Complete real native 377 bot login with authentic RSA/ISAAC/CRC and ensure server sees `HarnessBot`.
4. Complete opt-in read-only observer: actual world/ticks/identity, position, 21 skills/XP, inventory/equipment and verified available nearby/dialogue data. No fabricated `isBot`, names, skill values or SDK properties; unsupported values must be explicitly unavailable.
5. Reconcile actual pinned `BotWorldState` and `BotAction` contracts and gateway protocol; implement correct typed conversion and authenticated transport without inventing a parallel SDK.
6. Dispatch ordinary `walkTo` through SDK -> gateway -> mapped native TCP packet. Independently observe tick advancement and coordinate delta. Add observed-effect tracking with explicit rejected/dispatched/verified/timeout outcomes.
7. Verify at least one ordinary NPC, object or item interaction where actual disposable content permits; verify state delta, not packet write alone.
8. Add reproducible real-engine disposable CI, security negatives, cross-player isolation, source SHA evidence, stale/replay protection and rollback. Keep source-only and live acceptance clearly distinct.
9. Commit, run checks, merge when appropriate, and verify main HEAD. Do not tick either task as runtime complete without genuine end-to-end evidence.
10. Then proceed through remaining 36–42 evidence and two-client/same-world acceptance gates, coordinating Agy's 71 tasks and ChatGPT's source-only responsibilities.

## Absolute safety
No production restart, save overwrite, private credential exposure, force push, cheat/admin packets, XP/item grants, quest-stage manipulation, unapproved family-world bot login, or untrusted chat -> shell. Normal 600 ms ticks and 1x XP. If isolation cannot be established, stop that risky operation and use a safer disposable alternative.

## Required output
Provide a 42-item status reconciliation linked to evidence, separate Agy/ChatGPT ownership, actual source commit/PR/CI IDs, test command outputs, disposable login and state/action evidence, known blockers, and **five separate verdicts**: GitHub source, Fedora readiness, disposable 377 bot, same-world Elrothiro bot, genuinely playable autonomous bot. Label VERIFIED COMPLETE / PARTIALLY COMPLETE / BLOCKED accurately. Do not claim end-to-end completion from mocks, CI compile alone or a document.

# JoshRS quest autopilot — RS-SDK + Agy closed-loop quest completion

**Date:** 2 November 2026  
**Status:** implementation specification, NOT a running unattended automation.

## Goal

A self-improving quest agent system:

**fresh/preconditioned bot → execute actual quest → verify outcome → on barrier capture redacted evidence → notify/invoke Agy → Agy diagnoses and fixes quest logic → tests → safely resume or replay → verify completion → next quest**.

The target is **one-shot quest reliability**: after the agent has learnt and fixed a quest, a *new eligible bot* must complete it end-to-end in one uninterrupted run, without human decisions. Development iterations/failures are evidence, never counted as one-shot completions. A separate campaign run must finish every independently playable quest and all dependencies using ordinary in-game mechanics.

## Current supported evidence / do not assume

- Local user's RS-SDK checkout: `~/dev/JoshRS-source/rs-sdk`; MaxBittker/rs-sdk. The demonstrated engine is **revision 225**, not JoshRS's separate revision 377. Do not mix revisions, migrations, quest denominators or saves.
- A real Jimmy browser bot has observed Elrothiro, chopped a tree, received logs and gained XP in localhost 8888/7780. That does not establish universal quest automation.
- Local `bots/lib/quest-kit.ts`, `bots/lib/quests/cooks-assistant.ts`, `bots/bob_template.ts`, `scripts/run-fresh.sh`, `AGENT_QUESTS.md` were proposed in a Claude conversation. Inspect whether they were actually saved and executed. Do not equate snippets or a "DONE" line with a verified quest.
- Upstream RS-SDK includes `sdk/runner.ts`, `sdk/API.md`, `sdk/actions.ts`, `sdk/types.ts`, `mcp/`, `learnings/`, `wiki/quests/`. It supplies action methods, client-observed state and a code-execution MCP tool. It is not a safe autonomous fixer interface by itself.
- Agy has paused overlapping JoshRS Tasks 21–30 custom bridge work. Preserve current branches/worktrees; do not rewrite history or stop existing players.

## Required architecture

### A. Quest catalogue and prerequisite graph
- Enumerate each quest **from pinned local RS-SDK engine/content and wiki**, classifying `implemented`, `partial`, `unsupported`, `uncertain`. Quest wiki pages are references, not proof of executable end-to-end implementation. Record quest ID, prerequisites, required items/skills, start NPC/coords, source paths, strategy version, observed completion signal and hard blockers.
- Support two distinct proof modes: **cold-run** (fresh eligible bot with prereqs fulfilled *through normal gameplay*, never direct grants) and **campaign** (single test account completes its full available quest graph in dependency order). No forcing quests with unimplemented content.
- For multi-player quests, use separately provisioned disposable companion bots, with ordinary trades/actions, and account-level ownership.

### B. Durable supervisor
- Build local single-owner supervisor under a **new, isolated worktree or directory**, not over Agy's active changes. On startup fingerprint local engine, SDK, gateway, quest source and bot profile. Refuse the wrong revision/server.
- Persistent local queue with states `queued → preflight → running → verified_complete` or `blocked → repairing → validating → resumable`, and distinct `unsupported` and `needs_human`. Atomic writes, run IDs, action/step IDs and durable progress. On crash, reconcile real game state before doing anything else, never replay uncertain trades or quest decisions.
- One active controller per bot, lease/heartbeat and stale-tick detection. Bounded quest runtime and per-step timeout; no tight 600-ms polling loops over AI. One current quest per bot.
- Capture bounded evidence at each step: observed tick, position, floor, inventory and skill delta, dialogue page/options, nearby relevant entities, latest non-private game messages, command/result, timeout, source fingerprints; redact credentials, URLs with passwords, private chat, other account data, tokens and saves.
- `verified_complete` requires real server/client quest-completion evidence (e.g. known quest varp/journal completed value plus completion event/reward, if available); **inventory items disappearing is NOT enough**. Capture logout/save/relogin proof when feasible.
- Produce local per-quest evidence JSON/Markdown and aggregate dashboard: verified count / eligible count / unsupported / blocked; never label source-only quests completed.

### C. Barrier classification and Agy handoff
- Recognise: stale/disconnected state; dead/missing bot client; wrong server; missing prerequisite; unavailable quest mechanics; pathfinding/door/floor; wrong NPC/loc/option; transient game failure; script exception/type error; dialogue uncertainty; script timeout; authentication or permissions; game-defect vs bot-defect.
- On barrier, **pause that bot/quest safely**, emit a single machine-readable incident with evidence pointers and deduplicated fingerprint. Do not spam Agy every tick.
- Discover the **actual local Agy runner invocation and permissions**; do not invent an endpoint, CLI or claim an async process exists. Implement an adapter that sends the incident to the real Agy workflow, records delivery/ack and retries with bounded backoff. If unavailable, leave a durable `needs_human` incident and optionally create/redact a GitHub issue; do NOT silently claim self-healing.
- Give Agy bounded source scope: only quest module, generic quest helpers and relevant unit tests in the sandbox; no direct player save, database, credentials or production engine modification.
- Agy should: inspect evidence + scripts + wiki + engine quest handlers; propose smallest tested code repair; add regression test; run disposable dry-run/live bot on **separate eligible test profile**; verify quest-specific success. Commit to a feature branch and protect tested version. A failed repair remains blocked and is not counted as progress.
- Restart/recover policy: resume SAME bot **only if** step idempotence and authoritative game state allow it; otherwise use a new disposable bot and replay genuine prereqs. Preserve failed run evidence. No infinite retries: cap per incident/run, change the hypothesis on each retry and escalate genuinely unimplemented mechanics.

### D. Cold-start acceptance and continuous learning
- Each fixed quest is submitted to **clean-room cold-run regression**: new eligible account, no manual clicks, no directly edited stats/items/quest stages, no privileged teleports, no server mutation, no shortcut to completion. At least two independent cold runs for critical quest logic; run full dependency campaign before claiming campaign completion.
- Cross-quest helpers should be reusable (dialogue, locomotion, item acquisition, banking, NPC interactions); no copy-pasted hardcoded guesses without live verification.
- Engine/service changes are separate reviewed proposals. Tests must not restart the family's game, rebind existing live ports, or kill Elrothiro/Sylvie/Luna/Jimmy.
- Honour API semantics: `bot.*` attempts to observe an effect; `sdk.send*` only proves dispatch. Every success claim must be independently grounded.

### E. Security before unattended operation
- **Current observed risk**: local gateway 7780 and game 8888 listened on `0.0.0.0`, gateway said authentication disabled. Fix loopback bind and bot-scoped authentication/control ownership before an agent controls bots. Verify `ss -ltnp` on Fedora.
- Passwords previously displayed in `bot.env` and a browser query URL must be rotated; never commit/publish or log them, and disable opt-in telemetry if undesired. Protect process arguments, incident bundles and local state files.
- Do not connect unrestricted upstream `mcp.execute_code` to an unattended fixer: it can execute arbitrary JS with filesystem/process/network access. Expose narrowly allowlisted bot actions and read-only observation; run fixer in sandbox/worktree with auditable edits.
- Never dispatch quest automation or aggressive retries to human/family accounts without explicit opt-in. No item grants, XP edits, admin shortcuts, cheating save writes or scripted account takeovers.

## Implement in safe increments

1. **Audit baseline**: record pinned RS-SDK commit; show what Claude files actually exist; capture true Cook's Assistant completion evidence if available and list documented vs unverified quests. Check current services **read-only**.
2. **Harden the local gateway and credential handling** on a separately tested instance; stage any unavoidable live restart behind an explicit operational window.
3. **Supervisor MVP**: persistent queue, read-only real state, per-step evidence and incident JSON, mock Agy adapter with tests, real Agy adapter only after CLI/agent trigger is discovered.
4. **Cook's Assistant** end-to-end as first acceptance, including accurate objective state, normal acquisition and proof; then Sheep Shearer; then generated dependency catalogue and subsequent quests.
5. **Self-healing demonstration**: deliberately introduce a *test-only* wrong quest target. Supervisor captures a single incident; actual Agy agent receives it, commits a bounded fix, clean validation passes and a newly eligible bot completes the quest without Josh manually copying logs or rerunning commands.
6. **Campaign**: run all eligible quests in dependency order with a dashboard, classify unsupported quests honestly.

## Explicit pass/fail

- **PASS** only with real local bot state, real quest completion, timestamped evidence, no cheats, automatic incident delivery + actual Agy fix + verified retry and continuous campaign. 
- **PARTIAL** if scripts run but no true completion proof, Agy delivery unverified, or human must paste logs.
- **BLOCKED** if gateway unsafe, game/quest content absent, service identity uncertain, or Agy cannot be invoked.
- A quest is **one-shot verified** only when it passes a fresh eligible-bot attempt without the supervisor needing a repair during that measured attempt. Fix-and-replay loops improve code, but failed attempts are still failures.

## Related
- [#28: quest/source/playable completeness ledger](https://github.com/Parris-Tech-Services/JoshRS/issues/28)
- [#55: genuine independent bot gameplay](https://github.com/Parris-Tech-Services/JoshRS/issues/55)
- [#59: no-cheat Cook's Assistant acceptance](https://github.com/Parris-Tech-Services/JoshRS/issues/59)

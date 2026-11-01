# AGY IMPLEMENTATION HANDOFF — RS-SDK-compatible LLM harness for JoshRS 377

**Priority: P0, start now with Antigravity (Agy), 2 November 2026.** Claude Code/Codex/ChatGPT Work return Tuesday/Wednesday; **do not block on them**. Agy owns immediate implementation, with a seamless Claude Code handover later.

**Branch:** `feature/rs377-rssdk-claude-harness-20261102` (work here; do not casually merge into main or patch the active family server).  
**Existing issue:** [#55](https://github.com/Parris-Tech-Services/JoshRS/issues/55) for autonomous bot tracking, [draft PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) for strict no-grant quest test.  
**Source pins:** [JoshRS #377](../../deploy/jparris-windows/upstreams.json): Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`; Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`; Client-Java `327880f6de74b40c420705bc42e4b34284885087`.  
**RS-SDK reference at audit:** [MaxBittker/rs-sdk](https://github.com/MaxBittker/rs-sdk/tree/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb), commit `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb` (29 Oct 2026). Pin this checkout; don't assume the tip stays compatible.

## Exact strategic decision

**Use RS-SDK as the *agent-facing API and MCP/gateway reference*, not its 274-ish modified game server. Keep JoshRS's existing private custom 377 engine, 600 ms tick, 1x XP, quests, accounts and content.**

RS-SDK components inspected:

1. `sdk/index.ts` — `BotSDK`, state reads, raw `sendWalk`, `sendInteractNpc`, `sendInteractLoc`, `sendPickup`, `sendUseItemOnLoc`, dialogue and item tools. **Raw action ack means dispatched, not successful gameplay.**
2. `sdk/actions.ts` — `BotActions` high-level observed-effect operations (movement, woodcutting, mining, banking etc.) and outcome verification. Reuse semantic/typed behaviour where compatible; don't blindly copy revision-specific IDs/scripts.
3. `sdk/types.ts` — `BotWorldState`, `BotAction`, `ActionResult`, game interaction types.
4. `server/gateway/types.ts` — wire messages: bot client sends `connected`, `state`, `actionResult`; gateway sends `action`; SDK sends `sdk_connect`, `sdk_action`; SDK receives `sdk_state`, `sdk_action_result`. Messages use `actionId` for correlation.
5. `server/gateway/gateway.ts` — WebSocket router (usual private port `7780` with configurable bind); never expose unauthenticated gateway to LAN/internet.
6. `server/webclient/src/bot/StateCollector.ts`, `ActionExecutor.ts` — reference for *what* to observe and how to dispatch **normal client interactions**. They are tied to a different TypeScript game client.
7. `server/webclient/src/lite/session.ts` + `lite/runner.ts` — autonomous headless RuneScape client, but **not binary compatible with the customised Java #377 protocol merely by switching port**.
8. `mcp/server.ts` + `mcp/README.md` and upstream `.mcp.json` — Claude Code MCP `execute_code`, `list_bots`, `disconnect_bot`; upstream `execute_code` executes arbitrary TypeScript and can reach the host filesystem. **Do not enable unsandboxed on production Windows.**

**JoshRS integration anchors (actually checked):**
- `tools/rs377-bot-bench/fred-george-family-client.mjs`: #377 RSA+ISAAC login handshake, `NO_TIMEOUT=40`, `MOVE_GAMECLICK=28` with four hardcoded patrol destinations. This is a narrow protocol reference, NOT a full state-aware client; it reads a local private PEM — never commit/disclose PEM, account passwords or actual login data.
- `tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.ts`: `Player`, `PlayerLoading`, native RuneScript triggers, game map pathfinding, bot lifecycle, XP and state. Engine-side logic is useful for authoritative **read-only observation and result verification**. Do not give the LLM arbitrary `Player` object or mutating internal API.
- `tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.test.ts`: several engine tests but currently includes synthetic `invAdd` for Cook's ingredients. Draft PR #59 forbids this and requires full quest steps.
- `docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md`: Agent 1 owns shared interactions; Agent 2 Luna/bots; Agent 3 production QA/backups. Agy must coordinate these responsibilities.
- `tools/rs377-agent-harness/` (this branch): offline `Observation377` contract, no-cheat `Action377` allowlist, `createHarness`, fixture transport and tests. **Foundation only; no live game adapter implemented.**

## Phase A — start immediately, without disrupting the family game

1. [ ] On JParrisDesktop, inspect `C:\JoshRS-Launcher\JoshRS-repo` and `C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json` read-only. If a repository was moved, resolve actual root instead of assuming paths.
2. [ ] Confirm agent ownership, local uncommitted edits/worktrees, currently logged-in people, whether any game/login services are healthy and whether Agy is currently modifying a shared `Player.ts`. **Do not stop or restart anything.** If family world is unhealthy, report the P0 blocker, but keep bot development isolated.
3. [ ] Fetch the new branch into a **separate git worktree**; do not reset, clean, overwrite the live engine ZIP/checkout, or move private saves.
4. [ ] Run `node --version` (Node 20+, 24 preferred) and `node --test tools/rs377-agent-harness/test/*.test.mjs`; report verbatim pass/fail and don't silently weaken assertions.
5. [ ] Clone RS-SDK into a research directory **outside** JoshRS's active `runtime/`; checkout immutable commit `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`. Keep RS-SDK upstream as a separate research/sidecar checkout. Do **not** blindly run the RS-SDK game server or its Claude MCP against the private world.
6. [ ] Create an isolated disposable #377 engine/content test world with separate account DB, player save directory and explicit nonproduction port profile. No copying Elrothiro/Sylvie credentials/saves. Set `world.mode=isolated`, `revision=377`, `tickMs=600`, `xpMultiplier=1`; independently verify these from engine configuration, not merely a string.
7. [ ] Declare one normal test-bot identity (`HarnessTest` or another fresh disposable, explicitly owned bot account) via normal account flow; never derive bot credentials from human accounts.

## Phase B — bridge RS-SDK to the real #377 world

**Preferred engineering route:** implement a **sidecar adapter** that controls a *normal #377 client session* for actions and uses a narrowly scoped read-only state observer from the isolated #377 runtime, then publishes an RS-SDK-compatible state/action stream. Keep both interfaces separate:
- **Client action channel:** send real revision-377 packets through a properly authenticated client session (not direct calls to `invAdd`, `addXp`, player varps, `teleport`, world coords or admin cheats). Use the existing `MOVE_GAMECLICK` code only as a starting point; implement `OPNPC`, `OPLOC`, ground item, dialogue, item-on-object, bank, shop and logout with exact pinned revision and tests.
- **Read-only observation channel:** snapshot only the disposable bot `Player` through an agent-locked observer: world/profile+server tick, coordinates, collision, inventory+equipment, skills+raw XP, quest flags/journal, NPCs/locs/ground items, dialogue and action outcomes. No arbitrary introspection, no other player locations/PMs/passwords/private DBs. When room details are unknown, mark fields unsupported; **never invent values**.
- **RS-SDK compatibility:** map these to the `BotWorldState` shape in `sdk/types.ts` and `BotAction`/result semantics. Either implement a minimal loopback WS game-client shim feeding the unmodified RS-SDK gateway (`server/gateway/types.ts`) or an isolated gateway-compatible service with the exact protocol. Document unsupported actions and API drift. Test that an actual RS-SDK `BotSDK` can subscribe to `sdk_state` and submit `sdk_action`; a standalone fake local SDK is insufficient.
- **Correct completion semantics:** `ActionResult.success=true` at low level only means dispatched. Mark high-level action complete only on *observed* effects after one or more genuine server ticks, with timeout/stale-state handling, consistent identity, no retries of uncertain item transfers and a trace ID.
- **Safety:** loopback-only gateway, authenticated disposable bot, single authoritative controller lease, finite typed action allowlist, input validation, rate limits/backpressure, state staleness refusal, timeouts and cancellation; no unlimited model-generated eval on Windows; redact accounts and secret paths from telemetry. No automatic dual clients controlling Fred or George at the same time.

### Minimum vertical slice (do this before quests)

1. [ ] `sdk.getState()` returns the actual disposable revision-377 bot position (not hardcoded fixture values), skills and inventory, with accurate tick/instance identity.
2. [ ] `sdk.sendWalk(x,z)` dispatches one genuine permitted game click, respecting obstacles/path, and `bot.walkTo` (or wrapped equivalent) observes real movement before reporting completion.
3. [ ] `sdk.sendInteractNpc` initiates a real native dialogue and exposes its actual options. Buttons must correspond to UI state; no guessing.
4. [ ] `sdk.sendInteractLoc` with a level-one tree causes native chop with an acquired axe, then real log and ordinary XP. Confirm the game awarded XP, not the bot.
5. [ ] Logout, relog in, recover quest/inventory/XP, verify no disconnects/crashes and obtain a reproducible trace.
6. [ ] Assert `get_state` is read-only, the LLM has no `setVar/invAdd/addXp` tools, and all actions leave an auditable provenance chain.

## Phase C — Claude Code / Codex handover (later Tuesday/Wednesday)

1. [ ] After Phase B's demo and targeted tests pass, implement a **restricted MCP** exposing `list_disposable_bots`, `observe_bot`, `perform_legal_action`, `get_action_evidence`, `get_objective_status`. Avoid exposing the upstream unrestricted `execute_code` on the user's main host; if necessary, run it only inside a separate sandbox with no production files/network.
2. [ ] Provide a project-scoped `.mcp.json` **only when the adapter truly boots**, set to loopback and explicit isolated profile. Never publish passwords or private URLs; use private runtime env files outside Git.
3. [ ] Give Claude Code `CLAUDE.md` (included on this branch), the `sdk/API.md` pinned API, and a test-owned starter objective; use small scripts, observe actual outcome and iterate.
4. [ ] First ambitious milestone: **Cook's Assistant** from empty/unseeded normal starter state; acquire bucket/milk/egg/wheat/pot/flour through gameplay, talk to Cook, verify quest flag, 300 XP, save/relog. Continue PR #59 strict acceptance; no shortcut grants.
5. [ ] Expand across real quests and independent Fred/George/Barry/Larry/Gary/Rory only after one bot works reliably. Do not deploy family-world autonomous players without preflight, consent, backup and rollback.

## Contract and checks

- `cd tools/rs377-agent-harness && npm test`: quick offline **fixture only**. These tests exercise policy/guard correctness, NOT live gameplay.
- `src/guard.mjs`: rejects family world, wrong revision, accelerated tick/XP, unapproved name, privileged action types and extra action properties.
- `src/harness.mjs`: dry-run default; result statuses: `dry_run`, `rejected`, `unverified_dispatch`, `observed_effect`. Even `observed_effect` doesn't prove quest completion.
- `src/fixture-transport.mjs`: deterministic in-memory data **for tests only**. **NEVER** mistake it for a working RS-SDK bridge.
- Agy must provide actual compatibility proof against the pinned `sdk/types.ts`, a real RuneScape #377 packet trace, normal tick/XP config proof and a separate bot account save/relog record.
- No additional producer/agent should write into `Player.ts`, `BotPlayer.ts` or running server while Agent 1/2 has unmerged local edits. New adapter files and isolated tests first.

## Immediate deliverables from Agy

1. A small independently tested `Observation377` module and packet/action adapter in this branch (not production).
2. A real `BotSDK` subscription/dispatch smoke test against a *disposable* 377 world, using the pinned upstream package.
3. Automated mocks plus a reproducible integration test log showing observed movement, one NPC dialogue and one real resource skill with no cheats, or an explicit technical blocker.
4. A durable, safe handoff note for Claude Code containing actual files/ports/source SHA, passing and failing tests and the next uncompleted stage.
5. An updated issue #55 comment and PR evidence (only source-safe, no private account details).

**Do not mark "LLM harness works" until RS-SDK itself can observe/control a real #377 disposable player and verify effects. Do not mark "questing done" until full no-cheat quest state is independently reproduced and saved.**

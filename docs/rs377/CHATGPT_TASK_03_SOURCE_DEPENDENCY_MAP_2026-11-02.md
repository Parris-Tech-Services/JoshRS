# Task 3 — source-specific dependency map (2 Nov 2026)

Evidence scope: connected GitHub read of the task register on main, the harness README and implementation handoff on PR #62, and the changed-file lists for PR #59 and #62. This is a **verified index of identified paths**, not a complete recursive repository inventory. Paths not inspected directly are labelled accordingly.

| Area | Exact source path | Branch / owner | Readiness and dependency |
|---|---|---|---|
| Client login / RSA / ISAAC | `tools/rs377-bot-bench/fred-george-family-client.mjs` | main reference; ChatGPT can extract separate modules | Existing narrow client; reads local PEM, hardcoded patrol and no general observation; do not copy secrets |
| Engine bot lifecycle | `tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.ts` | main reference; coordinate with Agy | Engine-side Player/PlayerLoading and native scripts; cannot substitute privileged mutation for gameplay |
| Engine bot tests | `tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.test.ts` | PR #59; PR author owns ongoing patch | Contains synthetic ingredient grants in baseline; PR #59 changes strict acceptance; avoid concurrent edits |
| Engine and content pins | `deploy/jparris-windows/upstreams.json` | main, read-only reference | Engine `b5ac859b47915afb545e60e4c1208f25d43cb3fb`; content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`; client `327880f6de74b40c420705bc42e4b34284885087`; source-level handlers still require audit |
| Harness safety guard | `tools/rs377-agent-harness/src/guard.mjs` | draft PR #62, Agy | Offline policy validation only |
| Harness orchestrator | `tools/rs377-agent-harness/src/harness.mjs` | draft PR #62, Agy | Dry-run/fixture semantics; no live transport |
| Mock transport | `tools/rs377-agent-harness/src/fixture-transport.mjs` | draft PR #62, Agy | Tests only; cannot prove real movement |
| Native #377 client | `tools/rs377-agent-harness/src/native377/client.mjs`, `codec.mjs`, `cli.mjs` | draft PR #62, Agy | Source scaffold and offline tests; real session not independently verified |
| RS-SDK action translation | `tools/rs377-agent-harness/src/rssdk-actions.mjs` | draft PR #62, Agy | Typed action mapping; missing real game adapter |
| Harness tests | `tools/rs377-agent-harness/test/{harness,native377-cli,native377-client,native377-codec,rssdk-actions}.test.mjs` | draft PR #62, Agy | Offline fixture tests, not world integration |
| Fedora bootstrap | `tools/rs377-agent-harness/fedora/{bootstrap,setup,test-bootstrap}.sh` | draft PR #62, Agy | Source-only setup; Fedora execution unverified |
| CI | `.github/workflows/377-agent-harness-isolated.yml` | draft PR #62, Agy | Source-only checks; inspect run logs in task #20 |
| Friends List | exact implementation path **not yet identified** | parallel agent / avoid collisions | Need repo tree and source trace before edits |
| NPC / loc / dialogue / packet handlers | exact engine paths **not yet identified** | engine/content, shared Agy ownership | Need pinned upstream source audit (#6); do not guess packet IDs |
| RS-SDK public types | `sdk/{types,index,actions}.ts` at pinned `MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb` | upstream, research only | BotWorldState / BotAction / BotSDK; revision-specific incompatibilities |
| RS-SDK gateway | `server/gateway/{types,gateway}.ts` | upstream, research only | WebSocket action/state protocol; auth/binding required |
| RS-SDK collector/executor | `server/webclient/src/bot/{StateCollector,ActionExecutor}.ts` | upstream, research only | Different game client, not drop-in #377 |
| RS-SDK MCP | `mcp/server.ts` | upstream, research only | Unrestricted execute_code unsafe on production |

## Dependency order

1. **Safe independent ChatGPT work:** audit pinned protocol and SDK sources (#6–#9); write tests in separately owned paths; map real engine packet handlers and Friends implementation. Avoid editing PR #62-owned files while Agy works.
2. **Agy-owned source under active development:** PR #62 harness, Fedora bootstrap, native client and RS-SDK adapter. Coordinate before changing; do not merge its draft without CI and integration proof.
3. **Integration seam:** genuine normal #377 authenticated client actions + strictly read-only isolated bot observation -> validated RS-SDK action/state messages -> observed effects across real ticks.
4. **Live acceptance remains blocked on local access:** verify authoritative Elrothiro world, actual client login, same-world visibility, normal XP, persistence and no-cheat provenance.

## Known limitations

This map is grounded in paths listed in PR diffs and handoff docs. It does **not** assert that every engine, content, service, NPC, Friends or test file was enumerated; those exact paths remain an explicit discovery gap. No local Fedora, Windows or game session was accessed. No test was run by this mapping task.

## Complete repository tree inspection — follow-up

Read GitHub's recursive `main` tree at `29605f690f390ff72a61de4c23291f7b447868d9`: **491 entries; truncated=false**. The JoshRS repository is primarily a **patch/deployment orchestration repository**, not a complete vendored Engine-TS or Client-Java checkout. The complete upstream NPC/loc/packet implementations are therefore **not present in this tree**; claiming their exact paths inside JoshRS would be fabrication. Their pinned upstream source is a distinct audit in task #6.

### Confirmed additional source paths (main)

| Function | Source path | Source verification | Owner / next dependency |
|---|---|---|---|
| Player session/login service | `tools/rs377-bot-bench/engine-patch/src/server/login/LoginServer.ts` | Read source: account DB, bcrypt, PlayerLoading, WebSocket; source is overlay, not entire login implementation | Engine owner; safe read-only audit, no concurrent mutation |
| Player-on-player action handler | `tools/rs377-bot-bench/engine-patch/src/network/game/client/handler/OpPlayerHandler.ts` | Read source: visibility checks, delayed-action guard, normal RuneScript APPLAYER dispatch, Luna spar special case | Parallel Luna/social owner; do not edit concurrently |
| Private message handler | `tools/rs377-bot-bench/engine-patch/src/network/game/client/handler/MessagePrivateHandler.ts` | Read source: wordpack, mute and rate protection, World.sendPrivateMessage | Social owner; privacy-sensitive |
| BotPlayer entity | `tools/rs377-bot-bench/engine-patch/src/engine/entity/BotPlayer.ts` | Read source: extends Player, server-side bot, GameMap pathfinding, LunaBrain and RuneScript hooks; no network socket | Agy/Luna owner; **not** evidence of external client login |
| Player/World patches | `tools/rs377-bot-bench/engine-patch/src/engine/entity/Player.ts`, `src/engine/World.ts` under same overlay | Exact paths confirmed by full tree; internals not fully audited | Shared high-collision files; read-only until ownership agreed |
| Engine startup and web | `tools/rs377-bot-bench/engine-patch/src/app.ts`, `src/web.ts` | Exact paths confirmed by tree | Engine/service owner |
| Client cheat handler | `tools/rs377-bot-bench/engine-patch/src/network/game/client/handler/ClientCheatHandler.ts` | Tree verified, content not yet audited | Security audit #9 |
| Friends readiness | `tools/rs377-social/check-social-readiness.mjs` and `.test.mjs` | Read preflight: whitelisted env keys and loopback port checks; listener **does not** prove presence or PM | ChatGPT can add independent tests |
| Friends startup/config repair | `deploy/jparris-windows/fix-disabled-friends.ps1` and `test-disabled-friends.ps1` | Read repair: fail-closed runtime location and .env checks, optional Apply | Windows service owner; do not run against live world |
| Friends CI | `.github/workflows/rs377-social-preflight.yml` | Tree verified | ChatGPT can review |
| Content NPC collision audit | `content-factory/audit_npc_trigger_collisions.py`, `content-factory/tests/test_audit_npc_trigger_collisions.py` | Tree verified | Content factory owner |
| Content NPC CRC | `content-factory/patch_377_npc_crc.py`, `content-factory/tests/test_npc_crc.py` | Tree verified | Content factory owner |
| Dialogue graph test | `content-factory/tests/test_dialogue_graph_exit_gate.py` | Tree verified | Content factory owner |
| Woodcutting bot | `deploy/lostcity377/bots/WoodcutterBot.ts` | Tree verified | Historical alternative; not proof of real 377 client |
| Fred/George supervisor | `tools/rs377-bot-bench/fred-george-supervisor.mjs` | Tree verified | ChatGPT research/tests; coordinate with issue #55 |
| Fred/George reporting | `tools/rs377-bot-bench/{fred_george_hourly.py,report.py}`, `tests/{test_fred_george_hourly.py,test_report.py}` | Tree verified | ChatGPT telemetry tests |
| Native compilation | `.github/workflows/377-native-compile.yml` | Tree verified | CI owner; source compile not equivalent to live world |
| No-cheat benchmark CI | `.github/workflows/377-no-cheat-benchmark.yml` | Tree verified | PR #59 overlap; avoid collision |
| Windows deployment and tests | `deploy/jparris-windows/test-{bootstrap,discovery,recovery,save-integrity,setup,support}.ps1` | Tree verified | Windows owner; no live mutation |
| Web client bridge | `tools/web377-bridge/prepare-client.mjs`, `test/bridge.test.mjs` | Tree verified | Web-only bridge; not proof of Java #377 bot |
| Android preview client | `android-client/app/src/main/java/au/com/parristech/joshrs/android/{MainActivity,GameSurfaceView,PreviewWorld}.kt` | Tree verified | Android preview, not normal game session |

### Source ownership and safe implementation boundaries

- **ChatGPT-owned independent work:** new standalone protocol verification tests, source-only dependency matrices, CI audits, social preflight tests, report integrity tests and separate adapter files. Avoid overlapping PR #62 source.
- **Agy / PR #62:** `tools/rs377-agent-harness/**` including `native377`, SDK mapping and Fedora bootstrap. Do not silently edit, merge or rebase Agy's draft.
- **PR #59:** `FredGeorgeBot.test.ts` strict no-grant quest test. Do not independently rewrite the same file.
- **Shared engine / social:** `Player.ts`, `World.ts`, `BotPlayer.ts`, `OpPlayerHandler.ts`, `MessagePrivateHandler.ts`, `LoginServer.ts`, `app.ts`; preserve separate owner coordination.
- **Not present as JoshRS source files:** the complete pinned upstream `OPNPC`, `OPLOC`, movement packet handler set, full NPC dialogue RuneScripts, Client-Java decoding, full Friends service internals. Fetch the pinned Engine-TS/Content/Client-Java repositories for task #6 rather than guessing.
- **Validation boundary:** file presence and inspected imports establish dependency topology; they do not establish runtime readiness. No source tests or local-world execution were performed in this task.

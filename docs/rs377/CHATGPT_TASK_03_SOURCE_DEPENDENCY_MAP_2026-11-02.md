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

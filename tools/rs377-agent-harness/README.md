# JoshRS 377 RS-SDK-compatible harness scaffold

**Development status:** isolated guard, action contract and mock transport implemented; **NOT CONNECTED to JoshRS, RS-SDK, an LLM or real players**. Agy is the active implementation agent until Claude Code/Codex access returns on Tuesday/Wednesday.

This folder defines strict, zero-dependency building blocks for the independent revision-377 bot transport. It does not vendor Jagex content, an RS-SDK checkout or account credentials.

## Try the offline safety tests

```sh
cd tools/rs377-agent-harness
npm test
npm run check
```

The tests use Node 20+ and `node:test`. They do not start the server, open sockets, create accounts, access saves or mutate data.

## Read these in order

1. [Agy implementation handoff](../../docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md).
2. [Agent ownership / family-world safety](../../docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md).
3. [Existing strict no-cheat bot test](../../docs/rs377/NO_CHEAT_AUTONOMOUS_BOT_BENCHMARK_2026-11-01.md), [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59).
4. [Upstream RS-SDK](https://github.com/MaxBittker/rs-sdk/tree/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb), especially `sdk/types.ts`, `sdk/index.ts`, `sdk/actions.ts`, `server/gateway/types.ts`, `mcp/server.ts`, and `server/webclient/src/bot/StateCollector.ts`.

## Adapter interface

```js
import {createHarness} from './src/harness.mjs';
const h=createHarness(transport,{
  allowedBots:['HarnessTest'], enableIsolatedActions:false
});
const state=await h.observe();
const result=await h.perform({type:'walk',x:3224,z:3218}); // dry_run
```

`transport.observe()` returns a disposable bot's validated state; `transport.dispatch(action)` sends one legitimate action, returning `{accepted:boolean}`. **Agy must implement the real transport** and observe an independent genuine game effect, NOT plug fixture data into a public dashboard.

## Security gates

- Only `world.mode=isolated`, `revision=377`, `tickMs=600`, `xpMultiplier=1`, whitelisted bot identities and 8 typed normal action classes.
- No direct stat, item, quest, location, save or database edits; no arbitrary code execution from the LLM; no automatic production changes; no port exposure outside loopback.
- `observed_effect` is a state delta, not a completed quest or verified XP provenance. Real-world tick/state/event polling with timeouts and source provenance must be added.
- Engine-side controls, script-packing and precise state schema must be audited before wiring any connected controller. The actions in this package are a deliberately limited first step.
- Agy owns current development. Claude Code/Codex are future consumers **after** the adapter passes live isolated tests.

**Do not enable upstream RS-SDK's unrestricted MCP `execute_code` on the production Windows desktop without a separately proven sandbox boundary.**

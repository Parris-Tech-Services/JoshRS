# JoshRS 377 RS-SDK-compatible harness scaffold

**Development status:** isolated guard, action contract and mock transport implemented; **NOT CONNECTED to JoshRS, RS-SDK, an LLM or real players**. Agy is the active implementation agent until Claude Code/Codex access returns on Tuesday/Wednesday.

This folder defines strict, zero-dependency building blocks for the independent revision-377 bot transport. It does not vendor Jagex content, an RS-SDK checkout or account credentials.

**Agy delivery checklist:** [71 numbered tasks to one visible, truly playable companion in Elrothiro's server](../../docs/rs377/AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md). Treat the real-world identity/topology proof as mandatory before any production action.

## Native revision-377 TCP code now implemented

Agy can **reuse actual source**, rather than rewriting the RSA/ISAAC login from scratch:

- [native377/codec.mjs](src/native377/codec.mjs): public RSA key only, random ISAAC seeds, revision-377 login+CRC framing, normal gameclick and NO_TIMEOUT packets.
- [native377/client.mjs](src/native377/client.mjs): one real TCP bot login session (no auto reconnect), bounded timeout, explicit private-network target, explicit family-world approval and normal walking packet; **does not decode incoming world state**.
- [native377/cli.mjs](src/native377/cli.mjs): offline doctor and deliberately approval-gated single login/move entrypoint with a bot-only password file (mode 0600), public RSA key and 36-byte cache CRC file. Normal login may create a new account; **never test against the family server casually**.
- [native377-codec.test.mjs](test/native377-codec.test.mjs), [native377-client.test.mjs](test/native377-client.test.mjs) and [native377-cli.test.mjs](test/native377-cli.test.mjs): local mock TCP handshake, production safety and CLI tests.

Safe to run without any game account or network connection:

```sh
cd tools/rs377-agent-harness
npm run doctor
npm run check
```

For an **isolated disposable world only**, Agy supplies these environment variables via a private noncommitted secret mechanism: `JOSHRS_BOT_USERNAME`, `JOSHRS_BOT_PASSWORD_FILE`, `JOSHRS_BOT_RSA_PUBLIC_FILE`, `JOSHRS_BOT_CRC_FILE`, `JOSHRS_BOT_ACCOUNT_APPROVED=YES`, plus optional `JOSHRS_BOT_HOST`/`JOSHRS_BOT_PORT`. `node src/native377/cli.mjs --login` logs in once; optional `--walk=3233,3217` emits only one normal movement packet. The key file must contain a **public** RSA PEM, not private.pem. The CLI cannot read the bot's position or assert the movement worked yet.

**Next real implementation:** use a legitimate revision-377 world-state decode/observer to feed `Observation377`, then map verified actions to the actual RS-SDK gateway. Do not mark connected gameplay or RS-SDK support as complete merely because the TCP fixture works.

## Fedora 44 / AVANCE-WS7 easiest setup

Follow the [Fedora single-command bootstrap](../../docs/rs377/FEDORA44_AGY_RSSDK_SETUP_2026-11-02.md). It creates a separate Agy worktree, detects the previously used `/home/josh/dev/JoshRS/lostcity377` engine/client, runs these offline tests, and checks out the pinned RS-SDK source without touching the family game. **Fedora live integration is not yet verified**.

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
- The [RS-SDK action translator](src/rssdk-actions.mjs) maps eight safe JoshRS actions to the **actual** pinned RS-SDK `BotAction` union, and rejects unsupported/privileged SDK actions. The real game transport is still missing.
- Agy owns current development. Claude Code/Codex are future consumers **after** the adapter passes live isolated tests.

**Do not enable upstream RS-SDK's unrestricted MCP `execute_code` on the production Windows desktop without a separately proven sandbox boundary.**

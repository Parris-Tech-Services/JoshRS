# JoshRS #377 — isolated companion-controller boundary (ChatGPT tasks 26–30)

**Source-only implementation. Not connected to RuneScape, the upstream RS-SDK WebSocket protocol, Fedora, Elrothiro, or production accounts.** The HTTP gateway is a separate typed *adapter boundary*, not a replacement for the actual rev-377 packet client or the upstream RS-SDK wire protocol. It requires a future, independently authenticated **trusted disposable-world** transport providing `observe()` and `dispatch(action,{signal})`. NEVER treat mock tests as actual gameplay.

## What was implemented

- **26 — Safety boundary:** `createLoopbackGateway` is a real Node HTTP service with **fixed `127.0.0.1` binding**, bearer authentication (operator-supplied token, >=32 bytes), separate random single-controller lease with expiry/renewal, cancellation/stop, max 4096-byte request bodies, no browser origins/CORS, host+remote-IP checks, strict normal-action allowlist, bot+isolated-world pinning and state sanitisation (max 32 KiB). No production-world profile supported. Rate-limited by minute **and** by real observed game ticks.
- **27 — Observed results:** `performObserved` treats `dispatch.accepted` as `sent` only. It requires a *matching effect after later ticks*, e.g. exact walk destination, new item quantity, changed dialogue, inventory or XP. Returns `observed`, `unverified`, `timeout`, `rejected` or `cancelled` distinctly; an unrelated delta never proves movement. All observations must carry a trusted, recent `observedAtMs` timestamp (up to 3 seconds old).
- **28 — Bounded recovery:** `ReplayLedger` saves action IDs and states via atomic replacement to a local mode-0600 journal; on restart any `reserved`/`sent` action becomes `unverified` and identical IDs can **never** replay. A `BoundedReconnect` helper provides exponential backoff with max retries and immediate refusal after authentication/wrong-world failures. The controller rejects duplicate active sessions and simultaneous actions; **reconnection does not replay gameplay**. The local operator must reconcile ambiguous item transfers/trades independently before new actions.
- **29 — Deterministic goals:** `DeterministicGoalExecutor` accepts *only* a short list of typed legal gameplay steps (maximum 12 by default), has a minimum 10-tick interval between model plans, at most one new step per tick, and stops immediately if any step is unverified/failed. No unrestricted LLM-to-socket/game-console pass-through.
- **30 — Provider-neutral tools:** standard JSON-schema `MODEL_TOOL_DECLARATIONS` for `observe`, `walk`, `npc_option`, `loc_option`, `ground_take`, `inventory_option`, `item_on_loc`, `dialog_option`, `wait`, `stop`, `report`; no `execute_code`, shell, script, admin, teleport, item grant or save edit. HTTP provides `/tools`, `/observe`, `/act`, `/report`, `/stop` and `/goal`/`/step` for deterministic queued steps. No AI provider/API key needed for the implementation or tests.

## Verify offline

```sh
cd tools/rs377-controller-boundary
npm run check
```

Works with Node 20+ and no third-party dependencies. Tests use a disposable **in-memory fake bot**, temporary mode-0600 journal and a loopback ephemeral HTTP port. They never log in to a RuneScape server, modify player saves or install game packages. GitHub Actions also checks this directory using `.github/workflows/rs377-controller-boundary.yml`.

## Integrate only in an isolated disposable world

```js
import {readFile} from 'node:fs/promises';
import {ReplayLedger} from './lib/recovery.mjs';
import {BoundaryController} from './lib/controller.mjs';
import {createLoopbackGateway} from './lib/gateway.mjs';

// You must provide a real, independently verified rev-377 bot-only adapter;
// the project deliberately does not ship a default live transport.
const transport = yourTrustedIsolated377Transport;
const ledger = await new ReplayLedger('/private/isolated-bot-journal.json').load();
const controller = new BoundaryController({
  transport, ledger, botName:'HarnessTest', worldId:'isolated-harness-01'
});
const authToken = (await readFile('/private/controller-token','utf8')).trim();
const gateway = createLoopbackGateway(controller,{authToken});
const {host,port} = await gateway.start();
```

`transport.observe()` must sample the **current** authorised bot's real game state and return `world: {mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-...'}`, `observedAtMs: Date.now()` measured at the trusted observation point, `tick`, and `player:{username,isBot:true,x,z,plane,inventory:[{slot,id,quantity}],xp:{},questStages:{},dialogue:null}`. No user-supplied header or fixture can establish authoritative world identity. The transport must reject cross-account input and expose only genuine normal rev-377 protocol actions, not engine mutation functions.

Client requests must be POST + `Content-Type: application/json` + `Authorization: Bearer <secret>` over the **local loopback** interface. First `POST /claim` with `{}` to obtain a short-lived secret lease; then provide that `lease` and a distinct 6–80-character `actionId` in `/act`, e.g. `{"lease":"...","actionId":"walk-000001","tool":"walk","args":{"x":3232,"z":3218}}`. Use `/renew` to extend lease, `/report` to inspect a result, `/stop` to abort an action/release the lease. Do not print/store either bearer token or lease in Git or normal logs. Boundaries are intentionally stricter than upstream RS-SDK (whose default gateway may bind publicly without login-server auth).

## Limitations / acceptance

- The source has **no actual rev-377 observation adapter**, no player credentials or RSA/public key, no real-game traffic and **no RS-SDK WebSocket implementation**. It is reusable logic for Agy, not a working companion.
- Mock data and timestamps are controlled by the trusted injected transport; future integration must validate provenance against the actual game engine/server. Server rate limiting is local-process only. The journal is a **single-process** design; do not run multiple controller processes against one bot/journal. File permissions protect only the local account, not a compromised host.
- Stop/cancel cannot undo a packet that already reached the engine; a cancelled/uncertain item action MUST NOT be replayed without reconciliation. The durable ledger is not intended to persist large player/game data.
- No `world.mode='family'`, default production credentials, remote network binding, privileged LLM commands or automatic deployment. Safely testing against the user's authoritative server requires a separate approved integration and actual two-player proof.

**Success for tasks 26–30:** source implementation and offline tests committed and verified. **Not success:** a bot visible beside Elrothiro. That requires separate native rev-377 transport, authentication, state observation and supervised live playtest.

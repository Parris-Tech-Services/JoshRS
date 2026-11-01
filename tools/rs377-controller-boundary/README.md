# JoshRS #377 — isolated companion-controller boundary (ChatGPT tasks 26–30)

**Source-only implementation. Not connected to RuneScape, the upstream RS-SDK WebSocket protocol, Fedora, Elrothiro, or production accounts.** The HTTP gateway is a separate typed *adapter boundary*, not a replacement for the actual rev-377 packet client or the upstream RS-SDK wire protocol. It requires a future, independently authenticated **trusted disposable-world** transport providing `observe()` and `dispatch(action,{signal})`. NEVER treat mock tests as actual gameplay.

## What was implemented

- **26 — Safety boundary:** `createLoopbackGateway` is a real Node HTTP service with **fixed `127.0.0.1` binding**, bearer authentication (operator-supplied token, >=32 bytes), separate random single-controller lease with expiry/renewal, cancellation/stop, max 4096-byte request bodies, no browser origins/CORS, host+remote-IP checks, strict normal-action allowlist, bot+isolated-world pinning and state sanitisation (max 32 KiB). No production-world profile supported. Rate-limited by minute **and** by real observed game ticks.
- **27 — Observed results:** `performObserved` treats `dispatch.accepted` as `sent` only. It requires a *matching effect after later ticks*, e.g. exact walk destination, new item quantity, changed dialogue, inventory or XP. Returns `observed`, `unverified`, `timeout`, `rejected` or `cancelled` distinctly; an unrelated delta never proves movement. All observations must carry a trusted, recent `observedAtMs` timestamp (up to 3 seconds old).
- **28 — Bounded recovery:** `ReplayLedger` saves action IDs and states via atomic replacement to a local mode-0600 journal; on restart any `reserved`/`sent` action becomes `unverified` and identical IDs can **never** replay. A `BoundedReconnect` helper provides exponential backoff with max retries and immediate refusal after authentication/wrong-world failures. The controller rejects duplicate active sessions and simultaneous actions; **reconnection does not replay gameplay**. The local operator must reconcile ambiguous item transfers/trades independently before new actions.
- **29 — Deterministic goals:** `DeterministicGoalExecutor` accepts *only* a short list of typed legal gameplay steps (maximum 12 by default), has a minimum 10-tick interval between model plans, at most one new step per tick, and stops immediately if any step is unverified/failed. No unrestricted LLM-to-socket/game-console pass-through.
- **30 — Provider-neutral tools:** standard JSON-schema `MODEL_TOOL_DECLARATIONS` for `observe`, `walk`, `npc_option`, `loc_option`, `ground_take`, `inventory_option`, `item_on_loc`, `dialog_option`, `wait`, `stop`, `report`; no `execute_code`, shell, script, admin, teleport, item grant or save edit. HTTP provides `/tools`, `/observe`, `/act`, `/report`, `/stop` and `/goal`/`/step` for deterministic queued steps. No AI provider/API key needed for the implementation or tests.

## Task 26 native-auth integration (2 Nov 2026)

**New tested source:** [`lib/native377-transport.mjs`](lib/native377-transport.mjs) and [`test/native377-integration.test.mjs`](test/native377-integration.test.mjs). [Passing CI run 41357708477](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41357708477): **37 tests passed, 0 failed**, including five tests of real loopback Node TCP socket handshakes and an authenticated-observer boundary. This is an **offline simulated game server**, NOT Elrothiro's server.

The `Native377BoundaryTransport` uses the actual `Session377` RSA/ISAAC login/client packet implementation from `../rs377-chatgpt-bridge/src/session.mjs`. It requires a separate authenticated `createNative377Observer` message source, matching bot identity, 377/600ms/1x XP/isolation, pinned source hash, and **at least two successive advancing engine ticks**. A missing source, wrong bearer token, wrong world, wrong player, stale tick or failed TCP login refuses readiness. It translates only observed, legitimate #377 packets; unobserved NPC/loc/item targets and unverified dialogue commands fail closed. An action dispatch stays `unverified` until real game effects are seen.

**Recommended fail-closed startup** (not a ready-to-run live configuration):

```js
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';
import {Native377BoundaryTransport,startAuthenticated377Gateway,createLoopbackEngine377Source} from './lib/native377-transport.mjs';
import {ReplayLedger} from './lib/recovery.mjs';

// All values must be obtained from the AUTHORISED DISPOSABLE test environment.
// The native source must produce real bot-only engine/client observations;
// it is NOT implemented by this repository and cannot be replaced with a fixture.
const session = new Session377({
  target: {host: isolatedHost, port: isolatedGamePort, mode: 'isolated'},
  username: disposableBotName, password: botPassword,
  publicKeyPem: trustedGamePublicKey, crcs: actualCacheCrc36
});
const nativeSource = createLoopbackEngine377Source({
  port: isolatedEngineManagementPort, token: nativeObserverSecret
});
const transport = new Native377BoundaryTransport({
  session, nativeSource,
  observerToken: nativeObserverSecret,
  botName: disposableBotName, worldId: trustedIsolatedWorldId
});
await transport.connect(); // authenticated login AND real tick progression required
const ledger = await new ReplayLedger(privateAbsoluteJournalFile).load();
const {address,close} = await startAuthenticated377Gateway({
  transport, ledger, authToken: localGatewayBearerSecret
});
// The HTTP gateway binds to 127.0.0.1:EPHEMERAL_PORT only.
// Shut down with await close(). Never expose it to the public Internet.
```

**Verified source-level and simulated-TCP security gates:** localhost binding and host/origin checking; strong bearer auth; controller leases; bot/world scope; validated normal actions; stale/unverifiable state refusal; 1 action per real observed tick plus minute rate limits; bounded bodies/state and timeouts; cancellation/stop; durable no-replay journal. The real TCP integration is opt-in, never auto-started or production-connected.

**Current task-24 integration:** [the actual opt-in Engine-TS telemetry endpoint](../rs377-bot-bench/engine-patch/src/web.ts) is present on `main` and [its localhost HTTP reader](../rs377-chatgpt-bridge/src/engine-observer.mjs) has source tests. The new `createLoopbackEngine377Source` calls that exact endpoint from loopback only, refuses production management ports, validates bearer responses and coalesces repeated reads within 600 ms. It correctly preserves `skills:null`, `questStages:null` because those values are not yet exposed by the real source. There is no synthetic XP, zero quest progression or fabricated success. A separate CI test uses a locally hosted HTTP endpoint with the task-24 wire format; that simulation is not a real game login. [Latest passing security CI](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358127810): 38/38 tests green.

**Unverified blockers to end-to-end completion:** the actual #377 native observer producer has not been shown authenticated with an online disposable account on Fedora/Windows; the isolated test server in CI accepts an emulated login and emits fixture observations, not a real Engine-TS game world. We have NOT authenticated a bot to the authoritative server, observed its real game ticks, or performed two-player security checks. Production/family deployment remains disabled. Do not describe the full live integration as verified.

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

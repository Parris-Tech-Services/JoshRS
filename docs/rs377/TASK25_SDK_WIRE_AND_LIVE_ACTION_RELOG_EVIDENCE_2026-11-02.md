# Task 25 — pinned SDK wire, real isolated action and persistence evidence

**Reviewed:** 2 November 2026 AEDT.  
**Tracking status:** **PARTIALLY COMPLETE** — do **not** restore checkbox #25 just because this transport acceptance passes.

## 1. Three distinct, actually executed acceptance layers

### A. Real 377 source observation

[PR #86](https://github.com/Parris-Tech-Services/JoshRS/pull/86) and [real CI 41359136066](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41359136066): pinned 377 engine/content compiled and booted on temporary CI runner. Real `HarnessProbe` TCP normal login and authenticated, bot-only management reader emitted observed position, all 21 real XP/level entries, inventory, equipment, four rsbuf-visible NPCs and server dialogue wait flags; ticks advanced. No production accounts or saves.

### B. Real SDK-shaped action over authenticated REST subset, effect and persistence

[PR #94](https://github.com/Parris-Tech-Services/JoshRS/pull/94), [real CI 41359676240](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41359676240).

Actual sequence:

1. Start pinned, compiled disposable 377 game on CI ports `15402`/web `18880`/observer `18881`, new private SQLite DB.
2. Normal native 377 TCP login to real server, valid 9 cache CRCs + RSA public key + ISAAC.
3. Query the actual engine's protected bot-only state.
4. POST an upstream `BotAction` variant `{type:'walkTo',x,z,running:false,reason:'...'}` to a loopback-only authenticated `/sdk_action` route. `sdk-runtime.mjs` maps it to the pinned, alt-byte-encoded `MOVE_GAMECLICK=28`; `Session377.sendPacket` writes ISAAC-framed bytes into the real 377 game session.
5. Do **not** accept a `dispatched_unverified` response as gameplay success. Poll subsequent real engine observations until the bot's position has actually changed.
6. Disconnect; wait for the server to create its own normal player `.sav`; log in a second time as the same disposable normal player and require the previously observed position to be restored. No direct save mutation/teleport/grant calls.

Verified CI evidence: `walkObserved:true`, `dispatchAttemptCount:1`, `saveRelogVerified:true`.

### C. Real pinned upstream SDK *WebSocket message format*, actual observed effect

[PR #97](https://github.com/Parris-Tech-Services/JoshRS/pull/97) and native [`probe-real-isolated377.mjs`](../../tools/rs377-chatgpt-bridge/probe-real-isolated377.mjs) add a separate, authenticated WebSocket `/gateway` with literal pinned [RS-SDK `sdk/index.ts` messaging](https://github.com/MaxBittker/rs-sdk/blob/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/index.ts):

- client `sdk_connect` with `username`, `password`, `clientId`, `mode:'control'`; server `sdk_connected`
- client `sdk_action` with `username`, `actionId`, `action`; server `sdk_action_result` containing the real pinned `ActionResult` shape `{success,message,phase,reason?,data?}`
- only return `phase:'completion', success:true` **after** seeing a later actual engine tick with the requested player position, not after TCP dispatch
- exclusively loopback binding, strong token, single-controller lease, input size bound, no automatic production login, no arbitrary game opcode
- if native `BotWorldState` is not fully grounded, send `sdk_error:authoritative_sdk_state_incomplete`; **do not send `sdk_state`** with invented game data.

The genuine disposable-engine CI has asserted `genuineSdkWebSocketAction:true`, a second observed normal walk and a second relog position match; source-only security tests separately reject weak tokens and a second controller. This is genuine wire *envelope* compatibility, **not yet an end-to-end test using the upstream `BotSDK` class** with complete state.

## 2. Crucial remaining work for checkbox 25

**Complete live `BotWorldState` is still missing.** The engine-only observer can truthfully expose bot position/skills/gear/visible NPCs and pending dialogue components, but not yet grounded client-rendered dialogue labels, valid choice indices, nearby map locations, dropped item objects, full player combat metadata, shop/bank/interface state, recent message history or every other required upstream state field. Current `toBotWorldState` intentionally **throws** on missing required fields; the gateway correctly refuses `sdk_state` instead of inventing defaults.

The final gate is to derive these *authoritatively* (from an actual client decoder/real engine events; no synthetic defaults), compile actual adapter declarations against the upstream SDK TypeScript API, run an **actual upstream `BotSDK`** client against the loopback gateway and prove it receives valid complete state and performs supported actions. Real dialogue choice needs pinned IF_BUTTON semantics and actual observed UI component ID. Grounding bank/shops and action feedback must not leak other players' data.

Until that passes, task #25 is **PARTIALLY COMPLETE**, even though real TCP login, real state observation, actual SDK-shaped walk effect, WebSocket action/result envelope and save/relog now have real disposable-engine evidence.

## 3. Safety / non-disruption

The entire acceptance launches a separate temporary database and engine checkout on GitHub-hosted runner ports, with new random credentials. It never touches the running JParrisDesktop world, Fedora production service, Elrothiro, Sylvie, Luna, local accounts or preserved saves. The WebSocket gateway is not auto-started on family infrastructure. All opt-in startup flags must be preserved.

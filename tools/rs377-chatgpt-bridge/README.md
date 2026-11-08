# ChatGPT-owned standalone source bridge — tasks 21–25

This package lives in **a separate source path from Agy's draft PR #62** and uses Node 22+ built-ins only. It is intentionally dormant by default. It does not load any JoshRS game engine, private key, account DB, personal save, custom content pack, live session or public socket.

## What's implemented

- **#21:** reusable, injectable rev377 packet/ISAAC/RSA encoders extracted from the old Fred/George proof and cross-checked against `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`, `Client-Java@327880f6de74b40c420705bc42e4b34284885087`. No hardcoded host, file paths or plaintext password. Original proof client **left untouched**.
- **#22:** single-use `Session377` with exact revision, 36-byte CRC requirement, public RSA login, 4 uint32 ISAAC seeds, known server reply codes, login timeout, no automatic retry, stop via graceful TCP end and secret-safe status. A socket write reports **dispatched_unverified**, never movement/save success.
- **#23:** type-checked packet construction for walk, NPC op1–5, loc op1–5, ground item op1–5, held op1–5, interface inventory op1–5, use-item-on-loc, pausebutton and public chat **only from pre-encoded 377 WordPack bytes**. Unverified game logout opcode and unknown plaintext WordPack encoder are rejected, not guessed. `session.close()` ends the connection but **cannot prove server save**.
- **#24:** `createObserver(readRaw,{botName,expectedWorld})` is a narrow, immutable, single-account observation validation facade that requires a **trusted source callback supplied by a future engine/client adapter**. It enforces 377, isolated, world fingerprint, normal tick/XP, 21 skills in tenths XP, correct bot ID and explicit `null` for unsupported data. It does **not** implement the missing real-game observation hook.
- **#25:** `mapSdkAction()` uses pinned **upstream** RS-SDK `BotAction` variants (1-based optionIndex), guarded visible NPC/loc/item, known inventory ID and strictly normal packets. Unknown dialogue/privileged/unsupported actions are rejected. `toBotWorldState()` refuses to publish a complete SDK state unless **every required upstream `BotWorldState` field** is provided by a real native observer; converts 377 XP tenths to SDK XP. This is *not* a running upstream gateway/SDK integration. 

## 8 November 2026: upstream SDK state stream groundwork

A genuine local RS-SDK controller expects recurring `sdk_state` messages
as real RuneScape ticks advance, not just one snapshot on login. The
revision-377 WebSocket gateway now polls its **authoritative** runtime at
bounded intervals, publishes **only distinct, increasing native ticks**
with the full pinned BotWorldState contract, pauses native polling while
an action is being observed, and ends its timer when the controller closes.

If a field is absent or the runtime is not authenticated, it **never**
creates synthetic bank/dialogue/shop/player-state values. It reports
`sdk_error: authoritative_sdk_state_incomplete` once and can recover
if a complete real state later becomes available. The gateway stays
bound to loopback, uses a strong token and a single controller lease.

**Important: this stream is a transport prerequisite, not proof of full
RS-SDK bots on JParrisDesktop.** The current native rev377 observer has
`nearbyLocs: null`, `groundItems: null`, `sdkDetails: null` and
unknown client-side dialogue details; those required parts must be
derived from actual 377 game events/client UI (not guessed) before any
real upstream `BotSDK` sees full `sdk_state`. The already proven
isolated harness demonstrates real native login/observer/walk/relog,
not family-world AI agents. No running server or private data is
modified by the stream change in GitHub.

The path to full Windows integration is:
1. Implement complete observed rev377 BotWorldState (game client state,
   dialogue labels, bank/shop, objects, drops, combat/player metadata);
   preserve unknown fields rather than advertising false data.
2. Run an **actual pinned upstream BotSDK class** against the local
   authenticated WebSocket gateway with a separate disposable bot account,
   and prove continuous state plus completed normal actions.
3. Add per-bot Windows launcher/supervisor, private account credentials,
   single-controller leases, durable restart handling, save/relog checks
   and a safe create/start/stop UI.
4. Only after isolated acceptance, opt in to the JParrisDesktop family
   world, never modifying Elrothiro or Sylvie accounts or replacing the
   customised Fred/George/Luna game engine.

## What is NOT done yet

Agy's draft harness, actual 377 server-side observer, 377 inbound game packet decoder, native client world-state parser, live account authentication, multi-client visibility, Friends presence, genuine dialogue, real gathering/XP, save/relog and WebSocket RS-SDK gateway are all **unimplemented / unverified here**. This module must not be described as a playable bot or connected to Elrothiro without explicit permission and proper isolated acceptance.

## Run offline tests

```bash
cd tools/rs377-chatgpt-bridge
npm run check
```

No npm install necessary. GitHub Actions also downloads the immutable upstream `sdk/types.ts`, verifies its exact Git blob SHA and key `BotAction` / `BotWorldState` declarations. This prevents silently claiming SDK compatibility against invented types; it is still not a live SDK integration test.

## Safe integration seam

```js
import {Session377} from './src/session.mjs';
import {createObserver} from './src/observation.mjs';
import {mapSdkAction,toBotWorldState} from './src/sdk-bridge.mjs';
// DO NOT connect a production port: use a separately approved isolated server,
// genuine disposable bot credentials, valid public key & server CRC.
//
// const session = new Session377({target:{host:'127.0.0.1',port:53402},
//   username:'HarnessBot',password:secretFromLocalEnv,publicKeyPem,crcs});
//
// const obs=createObserver(trustedNativeBotOnlyReadCallback,
//   {botName:'HarnessBot',expectedWorld:'isolated-...'});
// const snapshot=await obs.observe();
// const {packet}=mapSdkAction({type:'walkTo',x:3223,z:3218,reason:'test'},snapshot);
// const sdkState=toBotWorldState(snapshot,{botName:'HarnessBot',expectedWorld:'isolated-...'});
```

The example intentionally does **not** create a fake trusted observer or silently connect to any server. Future work must ensure the action sends through an authenticated, rate-limited, independently leased controller, not arbitrary engine methods like `invAdd`, `addXp`, `setVar` or privileged teleports. A TCP packet acknowledgement is not an observed result.

## Exact references

- [Engine protocol IDs](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/ClientGameProt.ts)
- [Engine packet byte transforms](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/io/Packet.ts#L534-L564)
- [Engine per-option decoders](https://github.com/LostCityRS/Engine-TS/tree/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec)
- [SDK BotAction, BotWorldState and ActionResult](https://github.com/MaxBittker/rs-sdk/blob/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/types.ts#L558-L660)
- [SDK real action forwarding semantics](https://github.com/MaxBittker/rs-sdk/blob/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/index.ts#L1129-L1158)
- [Prior task 6 compatibility audit](../../docs/rs377/CHATGPT_TASK_06_PINNED_377_COMPATIBILITY_AUDIT_2026-11-02.md)

All tests are fixture/source tests. They never touch the running JParrisDesktop/Fedora server or saves.

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

## 8 November 2026: real native nearby loc/ground-item observation

The isolated rev-377 server observer now reads up to 48 nearby active locations and
48 ground items from **existing native ZoneMap entries**. It does not allocate
empty zones, create game objects, bypass visibility, or read other players'
inventory. Ground drops are exposed only if valid for the authenticated bot
and unowned or assigned to that bot; both collections are restricted to the
same plane and within 16 tiles. Actual native loc/obj config names and
options are retained when known; unknown names remain `null` rather than
being invented. An unsupported ZoneMap layout leaves both fields `null`,
not fabricated empty arrays.

The native isolated boot probe requires these two grounded collections,
checks their spatial bounds, and reports the observed counts. A full pinned
upstream `BotWorldState` remains **unsupported**, because real client UI,
dialogue text, shop/bank, combat events and required full metadata are
still missing. The gateway must continue returning
`authoritative_sdk_state_incomplete` until these are genuinely observed.
No production/family-world engine is modified by this repository change.

## November 8, 2026 — native SDK UI, bank/shop and combat bridge

The isolated observer now derives real player HP/combat-level, energy, weight,
animation, actual 15 prayer-varps, RSBuf-visible other players, item names and
normal item options from the pinned rev-377 engine. It reads the authenticated
bot's own bank inventory and bank-note varp only when the real bank modal is
open, and projects the closed bank/shop accurately.

For a genuinely opened shop, the observer reads the real shared stock
inventory, player inventory, per-shop buy/sell/haggle varps, and the server's
actual `IfSetText` shop title. The price calculation follows the pinned
Content `shop.rs2` calculation including base-stock deltas, 100–1000
clamps, and integer scaling. Missing dynamic shop data causes `null`,
never fabricated prices.

A disposable CI-only passive trace intercepts messages that the engine
already writes to that specific bot. It records real `MessageGame`, UI
text updates and dialogue-open page revisions; it tracks HP transitions
during normal ticks. Dialogue option actions are admitted **only** for
genuinely suspended `PAUSEBUTTON` scripts with matching page/version and
server-pending component IDs, sent through the normal 377
`RESUME_PAUSEBUTTON` packet. No direct script calls or privileged
XP/item modification are exposed.

**Authority boundary:** The source must continue returning `null` when
the actual 377 network/client state is insufficient. In particular,
unknown client-only dialogue text/history, hidden UI scripting, combat
damage source attribution, NPC health that was not visible to the client,
and open shop pricing whose native varps are unavailable are **not**
reported as complete. `toBotWorldState()` and the websocket publisher
fail closed until every mandatory pinned RS-SDK field is grounded. Passing
a compile or packet-dispatch test is not the same as proving every game
state and agent capability. These changes are intentionally **not**
installed on JParrisDesktop or any family account.

## Outstanding acceptance

The disposable native revision-377 CI harness now proves **normal network
authentication, genuine authoritative observation, SDK-shaped WebSocket
movement, visible positions, and save/relogin**. The pinned SDK converter
has also produced a complete source-grounded `BotWorldState` on that
running isolated server. The native CI probe separately checks streaming
consecutive increasing ticks.

What is **not** proven for every game state is reliable full feed behaviour
while a genuine conversation, bank, shop or combat encounter is active.
Unavailable client-only facts must trigger `sdk_error`, not a fabricated
state. Full upstream `BotSDK` class interoperability, ordinary agent NPC
interactions/quests/trading, multi-client family presence, an ergonomic bot
launcher and a verified JParrisDesktop deployment still require their own
independent real-world acceptance. **Nothing in this source-only repo
change authorises replacing the family's customised engine or saves.**

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

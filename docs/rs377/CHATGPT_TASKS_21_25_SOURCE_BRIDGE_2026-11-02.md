# ChatGPT tasks 21–25/42: standalone revision-377 source bridge

**Date:** 2 November 2026 AEDT.  
**Owner:** ChatGPT, independent GitHub source files, **not Agy's PR #62**.  
**Status:** **VERIFIED COMPLETE FOR SOURCE-LEVEL IMPLEMENTATION AND OFFLINE TESTS ONLY**. Not a connected, visible, fully autonomous 377 bot.

## What was actually implemented

| # | Source deliverable | Tests / acceptance | Important boundary |
|---|---|---|---|
| **21** | [`src/protocol.mjs`](../../tools/rs377-chatgpt-bridge/src/protocol.mjs) extracts source-pinned RSA/ISAAC, proper 377 movement and finite typed packet encoders into a separately owned module, with no fixed runtime directory, hardcoded live host or account. | Golden movement bytes `[33,12,0,17,12]`, per-option alternate byte decoding, 377 opcodes. | Original `fred-george-family-client.mjs` deliberately untouched; no active server replacement. |
| **22** | [`src/session.mjs`](../../tools/rs377-chatgpt-bridge/src/session.mjs) implements *opt-in* normal 377 TCP hello, login revision/CRC, PUBLIC RSA, ISAAC, replies, bounded timeout, one-use disposable account and fail-closed target. | Fixture socket covers successful auth, failed login, timeout, production-port refusal, no duplicate session, secret-free status. | TCP login is **NOT** real-world authentication without actual host evidence. `close()` sends TCP FIN, returns `closed_unverified_save`; cannot claim persisted logout. No retries, no creation of production accounts. |
| **23** | [`buildAction`](../../tools/rs377-chatgpt-bridge/src/protocol.mjs) constructs normal-player walk, NPC option 1–5, loc option 1–5, ground item option 1–5, held item option 1–5, interface inventory option 1–5, use-item-on-location, pausebutton and public chat from pre-encoded verified WordPack bytes; encrypted framing follows ISAAC. | Source-backed tests for packet IDs and field order/transforms, and rejection of malformed, privileged and speculative packets. | No arbitrary chat plaintext packing, guessed game logout opcode, chat/quest cheats or real packet-result observation. |
| **24** | [`src/observation.mjs`](../../tools/rs377-chatgpt-bridge/src/observation.mjs) specifies a bot-only read callback with verified world fingerprint/source SHA/tick/normal 600ms/1x XP, 21 skills and raw tenths XP, inventory/equipment, NPCs/locs/items, dialogue, quest state and explicit `null` unknowns; revalidation, cloning, freezing, stale tick rejection and private/extra-field rejection. | Fixture validation/mutation tests including wrong human identity, world mismatch, XP scaling and cross-account data refusal. | **Does not supply or install the real engine observer.** An Agy/local source callback still must be implemented and separately tested. |
| **25** | [`src/sdk-bridge.mjs`](../../tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs) maps real **upstream** typed `BotAction` names and 1-based `optionIndex` to allowlisted 377 packets only with currently observed targets. Maps a complete authoritative observation into upstream `BotWorldState` (XP tenths → fractional units), strictly requiring every pinned SDK mandatory nested property. | Type-contract CI downloads exactly `MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/types.ts`, verifies Git blob SHA **`ec59cef4f878c908481f68bd42cf698b68cdf579`**, checks required types; state fixture asserts rejection of missing required nested fields. | **No actual RS-SDK BotSDK/gateway process is wired**, and absent/unknown SDK data is rejected, never guessed. Unmapped options (especially dialogue packet/button identity) remain intentionally blocked. |

## Exact pinned sources

- [JoshRS pinned engine/content/client](../../deploy/jparris-windows/upstreams.json): Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, Java Client `327880f6de74b40c420705bc42e4b34284885087`.
- Engine [client packet opcode table](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/ClientGameProt.ts) and [Packet.ts alternate byte codecs](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/io/Packet.ts#L534-L564).
- Engine real game decoders: [MoveClick](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/MoveClickDecoder.ts), [OpNpc](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/OpNpcDecoder.ts), [OpLoc](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/OpLocDecoder.ts), [OpObj](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/OpObjDecoder.ts), [InvButton](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/InvButtonDecoder.ts), [OpHeld](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/OpHeldDecoder.ts), [OpLocU](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/codec/OpLocUDecoder.ts).
- RS-SDK [actual pinned type union and required state](https://github.com/MaxBittker/rs-sdk/blob/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/types.ts#L558-L660) and [SDK 1-based normal option semantics](https://github.com/MaxBittker/rs-sdk/blob/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb/sdk/index.ts#L1129-L1158).
- Previous [task 6 compatibility audit](CHATGPT_TASK_06_PINNED_377_COMPATIBILITY_AUDIT_2026-11-02.md) documents existing special max-level `BotPlayer.ts` behaviour: it is **not** a lawful no-grant bot foundation.

## Executed tests

**Source-only workflow:** [GitHub Actions 41353513958](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41353513958) passed on the final code before this documentation, with **22 Node fixture tests passing, 0 failing**, syntax checks green and exact RS-SDK Git blob verification green.

**Commands:**
```bash
cd tools/rs377-chatgpt-bridge
npm run check
```
No npm packages, local secrets or active game state required. GitHub runs Node 24. Fixtures emulate a server TCP *handshake*, not real client gameplay. No downloads of game caches or copying proprietary assets. Tests in this PR are strictly source-only.

## Honest next steps / blockers

1. **Actual world**: Confirm Elrothiro's authoritative host, port, currently installed source hash and disposable bot account with safe local checks (not GitHub).
2. **Real inbound state**: Implement and test a normal 377 client world-update decoder OR a dedicated bot-only read-only observation callback in a disposable isolated engine; none is wired here.
3. **SDK integration**: Establish a loopback authenticated, single-controller gateway to a real upstream `BotSDK`, then prove `sdk_state` contains genuinely observed values and `sdk_action` causes normal packets; do not simply feed fixture state.
4. **Observed gameplay**: Move, interact, chat, gather, obtain normal XP, relog and verify persistence with two ordinary clients. A packet dispatch response is not success.
5. **Production safety**: Coordinate with Agy/parallel owners; no save/database edits, privileged item grants, shared `Player.ts` changes or unapproved restarts.

**Do not merge or deploy Agy's draft PR #62 as live-ready based solely on this source CI.** This independent module can be integrated at a later verified seam after real-world preflight.

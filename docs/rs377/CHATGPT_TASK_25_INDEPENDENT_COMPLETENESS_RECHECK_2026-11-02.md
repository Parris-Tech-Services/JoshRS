# Task 25/42 — independent completeness recheck (2 November 2026)

**Conclusion: PARTIALLY COMPLETE — checkbox must be unchecked.** This is a code-level audit of what is actually merged to JoshRS `main` after [PR #69](https://github.com/Parris-Tech-Services/JoshRS/pull/69), not an assessment based on the task's own description.

## Exact completion criterion

> "Implement a versioned RS-SDK mapping adapter **from real** `BotWorldState` **and supported** `BotAction` **to the 377 transport**; validate against **actual pinned RS-SDK type contract**, not a self-invented similarly named client."

The source-level work is useful, but **no working end-to-end RS-SDK ↔ #377 bridge exists in this module**.

## Direct code findings

| Criterion | Actual source evidence | Verdict |
|---|---|---|
| Pinned SDK source identified | [`sdk-bridge.mjs`](../../tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs) refers to `MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`. [CI](../../.github/workflows/377-chatgpt-bridge-tasks21-25.yml) checks exact upstream `sdk/types.ts` blob `ec59cef4f878c908481f68bd42cf698b68cdf579`. | **YES — source pin** |
| Supported `BotAction` values mapped to typed 377 packet objects | [`mapSdkAction()`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs#L42-L114) handles some normal action variants with target existence guards. | **PARTIAL** — intentionally rejects many actions |
| Actual mapped packet reaches 377 transport | `mapSdkAction({type:'walkTo',...},snapshot)` returns `{kind:'packet',packet:{opcode,body,variable},result:'dispatched_unverified'}` ([lines 40–58](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs#L40-L58)). [`Session377.send(action)`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/session.mjs#L103-L113) instead calls `buildAction(action)`, which expects a native `action.type`; a mapped packet object has **no** `type`. Sending an original SDK `walkTo` also fails: the native builder expects `walk`. There is **no adapter-to-session dispatch function**. | **NO** — concrete incompatible API boundary |
| Real `BotWorldState` supplied | [`toBotWorldState()`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs#L169-L208) constructs an SDK-shaped state but obtains most required fields from caller-supplied `sdkDetails`. [The test](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/test/observation-sdk.test.mjs#L70-L91) builds `sdkDetails` in memory. | **NO** real 377 observation source demonstrated |
| Real source callback | Newer [`native-observer.mjs`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/native-observer.mjs#L7-L28) reads from an **injected** `source.read()`, validates a token and replay sequence and forwards the object. It does not implement the real engine/player-state observer or 377 inbound packet decoder. | **PARTIAL** — interface/guard only |
| Runtime RS-SDK gateway integration | No gateway, `BotSDK` instance, `sdk_state` publisher or `sdk_action` consumer is used by the standalone adapter. The module exposes local mapping functions, not a gateway implementation. | **NO** |
| Real type-contract validation | [CI](https://github.com/Parris-Tech-Services/JoshRS/blob/main/.github/workflows/377-chatgpt-bridge-tasks21-25.yml#L25-L41) performs syntax + fixture tests, downloads pinned `sdk/types.ts`, checks its Git blob and `grep`s a few declarations. It does **not** compile the adapter against the SDK's actual TypeScript types or execute a real upstream SDK event/transport integration. | **PARTIAL** — pin verified, compatibility not proven |
| Dialogue / representative normal action | [`clickDialogOption`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs#L102-L112) **always rejects**, even with a correct observed dialog and page guard. | **NO** for that action |
| CI | [Run 41353513958](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41353513958) genuinely passed **22 source-only tests** and pinned source SHA check for PR #69. | **YES** — *offline fixture coverage only* |

## Reproducible composition counterexample (inspection, not a claim of a live test)

```js
const mapped = mapSdkAction(
  {type:'walkTo',x:3223,z:3219,reason:'test'},
  validIsolatedSnapshot
);
// mapped.packet === { opcode: 28, body: <Buffer ...>, variable: true }

// Session377.send(mapped.packet) throws: buildAction() expects action.type.
// Session377.send({type:'walkTo',...}) also throws: buildAction() expects 'walk'.
// Nothing in these exported APIs provides the missing transport handoff.
```

This was independently established from the exact merged functions and their input contracts; a live socket was **not** opened. There is currently **no evidence** of real `BotSDK`→gateway→mapping→ISAAC/TCP→state feedback execution.

## Acceptance required before marking #25 complete

1. Introduce a genuine typed integration seam with the actual pinned SDK `BotAction` / `BotWorldState` contract, using a *real* TypeScript compile-time check or test against the immutable SDK declarations, not solely text matching.
2. Supply real observed 377 state (verified bot-only observer or inbound client-state decoder), with authenticated world/account identity, tick monotonicity, no spoofed skills/items or fake `sdkDetails`.
3. Link mapped native packets to an authenticated, controlled 377 session with correct framing/ISAAC and bounded operation, including a verifiable dispatcher instead of the incompatible `mapSdkAction → Session377.send` boundary.
4. Prove the actual SDK gateway message contract (`sdk_connect`, `sdk_state`, `sdk_action`, `sdk_action_result`) with a **disposable isolated** 377 bot and one genuinely observed normal action. Document unsupported actions explicitly and distinguish packet dispatch from observed effect.
5. Keep live family servers, credentials, saves and Agy-owned engine files untouched until separately authorised. A complete isolated bridge should not be confused with live Elrothiro same-world acceptance.

## Scope of this recheck

- Reviewed latest `main` source files: `sdk-bridge.mjs`, `session.mjs`, `protocol.mjs`, `native-observer.mjs`, `observation-sdk.test.mjs`, `package.json`, the CI workflow and task wording.
- Verified PR #69 was merged and original CI source-only checks passed.
- **No implementation change** to any 377 transport, observer, gateway, test, PR #62 code or live runtime was made by this audit.
- Tasks **21–24** were not re-audited for full completeness here. Their checkboxes are not independently endorsed by this task-25 recheck.

**Correct tracking status: #25 `[ ]`, PARTIALLY COMPLETE**. Prior assertion of `VERIFIED COMPLETE` was too broad.

# Real revision-377 state observation — disposable bot acceptance

**Verified:** 2 November 2026 AEDT.  
**Result:** **VERIFIED COMPLETE for the genuine isolated-world observation subtask**; **Task 25/42 as a whole remains PARTIALLY COMPLETE** until genuine RS-SDK state/action gateway and action-effect acceptance are integrated.

## Actual acceptance (not an invented state fixture)

[GitHub Actions native disposable compile and boot, successful run **41358968679**](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358968679).

1. CI cloned LostCityRS Engine-TS at pinned `b5ac859b47915afb545e60e4c1208f25d43cb3fb` and Content at `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, compiled the real 377 content and applied the isolated observer overlay **only in the GitHub runner**.
2. Started the compiled RuneScape engine, login worker, cache HTTP endpoint and private SQLite database on disposable ports `15402`, `18880`, `18881`.
3. Created a fresh strong random observer token and disposable normal player credentials for the CI session; `WEBSITE_REGISTRATION=false` enabled isolated-world account auto-registration **only in this new temporary SQLite database**.
4. Fetched the genuine 40-byte engine cache table (`src/cache/CrcTable.ts` = nine 32-bit CRCs plus a rolling hash) and sent the first 36 bytes in the native revision-377 TCP login packet. Derived **only the RSA public key** locally from the runner's generated `private.pem`; no private key left the runner.
5. Authenticated the ordinary `HarnessProbe` session over TCP, then queried the actual running game's `/dev/rs377-observe` endpoint with a separate loopback-only bearer token. Accepted only an online `NetworkPlayer` linked to the real game socket with matching canonical base37 account identity, expected 377 instance and real 600ms tick rate.
6. Read the live `Player.stats` XP arrays, `levels` / `baseLevels`, `Player.invs` inventory/worn containers, `World.npcs` filtered by **the actual `rsbuf.hasNpc(bot.slot,npc.nid)` predicate used by the normal `OpNpcHandler`**, and pending dialogue script/button state from `Player.activeScript`/`resumeButtons`. Waited for another real game tick.
7. Closed the client and stopped the entire disposable game process tree. **No family-world processes, preserved account saves, or user credentials were accessed.**

The native CI output includes:

```json
{
  "verified": "isolated_real_377_engine_observation",
  "world": "isolated-joshrs-ci-377",
  "revision": 377,
  "bot": "HarnessProbe",
  "tickAdvanced": true,
  "positionObserved": true,
  "skillCount": 21,
  "inventoryObserved": true,
  "equipmentObserved": true,
  "visibleNpcCount": 4,
  "dialogueFlagsObserved": true,
  "sdkStateComplete": false,
  "saveRelogVerified": false,
  "familyWorldTouched": false
}
```

## Code and safety evidence

- [Genuine engine-side producer](../../tools/rs377-bot-bench/engine-patch/src/web.ts): opt-in read-only telemetry. Refuses access without exact isolated flags, 1x XP, current 600ms tick rate, bearer token and actual connected normal bot; listens via the existing management Fastify app but **accepts only loopback requests** for this endpoint.
- [Real TCP login + state proof](../../tools/rs377-chatgpt-bridge/probe-real-isolated377.mjs): refuses non-CI ports/profiles/world IDs, reads genuine cache CRCs and performs actual network authentication.
- [Disposable smoke harness](../../content-factory/smoke_377.py): launches engine, optionally runs native probe, kills the entire process group even on errors; disabled by default.
- [Compile and integration CI](../../.github/workflows/377-native-compile.yml): opt-in real bot probe enabled only on dedicated isolated CI runner. This is stronger than the independent Node fixture tests.
- [Existing local observer reader](../../tools/rs377-chatgpt-bridge/src/engine-observer.mjs) validates the bot-only observer response; [`observation.mjs`](../../tools/rs377-chatgpt-bridge/src/observation.mjs) checks immutable world, bot, tick and skills.

## What is and isn't observed

| Field | Real engine state | Limits |
|---|---|---|
| Bot identity | Yes: canonical base37 username is matched before emitting the configured disposable Harness casing | Does not prove family account identity |
| Position and world tick | Yes | Map reachability not tested |
| Skills and XP | Yes: **all 21 native stat indices**, real XP in tenths and current/base levels | No action-caused XP changes demonstrated |
| Inventory and equipment | Yes: native private `invs` maps, including logical empty containers without allocation | Item display names/option metadata not decoded |
| Nearby NPCs | Yes: four genuinely visible server NPCs returned in this CI session | Do not claim every NPC option or script works |
| Dialogue | Yes: server active script wait flags, pending component IDs | **Text and option labels not available in server-only view**, deliberately not invented |
| Locations, ground objects, quests | **No**; explicitly `null` | Need authoritative client/engine observation for these |
| Full RS-SDK `BotWorldState` | **No**; `sdkDetails=null` | Strict adapter refuses to claim a complete SDK state |
| Normal action effect / persistence | **Not tested** | Need SDK gateway, observed move/NPC click and save/relog acceptance |

## What still blocks overall task 25

Real observations now exist on an actual disposable engine. Next: connect supported verified native observations to a genuine upstream RS-SDK WebSocket `sdk_connected`/`sdk_state` publisher without inventing required metadata; route an actual `BotAction` through the hardened authenticated dispatcher and observe a later changed game tick/position. Add guarded dialogue extraction from client UI if dialogue choice support is required. Prove disconnected/relogged disposable save, not merely `socket.write`. None of these is satisfied by this standalone observer proof, so **leave task 25 unchecked**.

**Do not deploy this observer overlay to the family world or enable it there.** This test was intentionally restricted to an isolated CI process with disposable player database.

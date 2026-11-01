# JoshRS companion implementation — ChatGPT tasks 31–35/42

**Status:** Source and offline tests implemented. NOT a working RS-SDK connection and NOT a real in-world bot. This package is self-contained on `main` and does not modify Agy's experimental [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62).

## Exact code delivered

- **31. Companion policy:** `src/companion.mjs`: no-cheat `follow`, `assist`, `gather`, `stop`. Accepts only an *authenticated, public-chat* exact owner command: `bot follow`, `bot assist`, `bot gather` or `bot stop`. Callers must independently authenticate the origin using real server message metadata; no private messages, host commands, automatic trading, privileged actions or free-text shell/LLM interpretation. Observations must match a real bot account, normal 600 ms world tick and 1× XP. This module **plans** normal actions but doesn't send them until the native packet adapter validates and dispatches them.
- **32. No-cheat scenario:** `src/scenarios.mjs`: acquire an axe observed on the ground, interact with a real tree, require actual log inventory and increased Woodcutting XP. Banking is **BLOCKED** until an actual revision-377 bank-action encoder and UI observation exist. Cook's Assistant is a later acceptance gate requiring witnessed milk/egg/flour acquisition, Cook dialogue, normal **3000 tenths (300.0) Cooking XP**, no direct grants and save/relog. This gate evaluates supplied evidence but cannot certify the real game.
- **33. Regression tests:** `test/*.test.mjs`: owner/identity, injection, normal movement, XP source, game tick/version, retries/duplicate sessions, fail-closed adapter timeout, source evidence, server-only vs Java-client assertions, safe portable file paths. Session policy lives at `src/session-policy.mjs`. Neither package nor tests need an engine install, a username/password or the internet.
- **34. Disposable #377 integration:** `src/run-integration.mjs` and `src/isolation.mjs`: `--prepare` creates a new random temporary world profile, private and separate saves/DB/cache/reports, fresh test account name, loopback target, normal 600ms/1× XP, distinct test TCP ports. `--verify` checks its isolation. `--run` refuses to operate until an independently reviewed real source adapter exists at `adapters/real377.mjs`, exports `createReal377Adapter(manifest)`, and returns the matching world identity and real bot observation. **No server is automatically started or registered.**
- **35. Two-client acceptance:** `src/two-client.mjs` and `src/evaluate-capture.mjs`: require independent Java #377 observer sessions and the same world identity; mutually visible players, actual movement seen by the human client, Friends online/offline, follow, public chat seen on both sides, bot logout/relogin and preserved item/XP state. **Synthetic fixtures and server-only telemetry cannot pass the live requirement.** Real-labelled capture remains `capture_assertions_passed_pending_independent_review`, never automatically `VERIFIED LIVE`.

## Run tests (no games/saves started)

```bash
cd tools/rs377-companion-contract
npm run check
```

## Prepare a separate *disposable* world profile (no server starts)

```bash
node tools/rs377-companion-contract/src/run-integration.mjs --prepare
node tools/rs377-companion-contract/src/run-integration.mjs --verify /tmp/joshrs-377-disposable-.../manifest.json
```

The exact path is printed by `--prepare`. The default ports: game `53402`, web `8988`, login `53500`, Friends `55099`, logger `53501`; these are **explicit test candidates, not proof the ports are free**. If any are in use, coordinate another distinct test port mapping and ensure it passes the same manifest guard. The profile never chooses or shares the production `52402/8888/43500/45099` endpoints. It stores no secrets and does not create a database account. Temporary profiles can be deleted *only by the operator* after confirming they aren't in use.

## Agy real adapter contract (not yet implemented)

An explicitly reviewed `tools/rs377-companion-contract/adapters/real377.mjs` may export:

```js
export async function createReal377Adapter(manifest) {
  // Implement only after confirming the actual pinned 377 engine and
  // explicitly isolated game/saves. NEVER point this at Elrothiro's live DB.
  // Real adapter must return:
  return {
    async getWorldIdentity() { /* {worldId,revision:377,mode:'isolated',tickMs:600,
      xpMultiplier:1,host:'127.0.0.1',gamePort:manifest.ports.game,
      account:manifest.account} obtained from REAL running world */ },
    async observeBot() { /* {tick,player:{username:'HarnessTest',...}} */ },
    async dispatch(action) { /* normal #377 gameplay inputs only */ }
  };
}
```

A fake adapter **must not** be deployed or used as runtime proof. The `--run` gate begins with read-only world identity and observation; it does not automatically perform a game action. Agy still needs a genuine incoming game-state decoder/authoritative bot-only observer and actual native interaction packets.

## Run two-client evidence checks

After the owner approves a disposable test, gather independent, redacted observations from **two real Java clients** (not two processes simulating the same log), with JSON `{worldId,bot,owner,events}`, and evaluate:

```bash
node tools/rs377-companion-contract/src/evaluate-capture.mjs --input /path/to/redacted-two-client-capture.json real-client-capture
```

Each event has `source:'java-client-377'`, `type`, `tick`, `worldId`, `sessionId`, `captureId`, `observer` and event-specific fields. Event types: `client_login`, `players_visible`, `player_moved`, `friend_status`, `follow_observed`, `public_chat`, `client_logout`, `client_relogin`, `bot_save_state`. The tests in `test/two-client.test.mjs` show the complete fixture shape. The CLI exits **1** on missing evidence and **3** when the JSON assertions pass but still require independent client/log review. It intentionally never exits 0 to claim live acceptance. Avoid capturing login passwords, private messages or unnecessary other-player data.

### Source links for acceptance semantics

- [Pinned Java #377 login](https://github.com/LostCityRS/Client-Java/blob/327880f6de74b40c420705bc42e4b34284885087/src/main/java/jagex2/client/Client.java#L2676-L2730)
- [Pinned normal movement handler](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/handler/MoveClickHandler.ts#L11-L56)
- [Pinned game protocol including Friends, chat](https://github.com/LostCityRS/Engine-TS/blob/b5ac859b47915afb545e60e4c1208f25d43cb3fb/src/network/game/client/ClientGameProt.ts#L81-L95)
- [Existing family client](../../tools/rs377-bot-bench/fred-george-family-client.mjs) (basic normal login/patrol; not full autonomy)
- [Full pinned-source compatibility audit](../../docs/rs377/CHATGPT_TASK_06_PINNED_377_COMPATIBILITY_AUDIT_2026-11-02.md)

## Ownership and completion boundaries

The source files are distinct from all files owned by Agy in draft PR #62. Agy can import the policy, scenario and acceptance modules from its Fedora worktree after review. Do not unilaterally merge them into the running world, bypass player save protections, or open an unauthenticated RS-SDK gateway.

**Verified by CI:** code syntax/fixture tests, source-safety scan and file readback after commit. **Not verified:** that Agy's real Fedora adapter exists, a JoshRS server ran in a disposable profile, Elrothiro and the bot shared a world, or any real XP/quest was earned.

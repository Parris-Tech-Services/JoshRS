# Revision-377 Java client controls — isolated test profile only

This is a **real Java 377 client patch**, not an invented 377 server command.
It implements the three original upstream RS-SDK actions that were previously
unmapped: `setTab`, `randomizeCharacterDesign`, `acceptCharacterDesign`.

**Verification boundaries:**
- The source is the actual LostCityRS/Client-Java `377` branch, pinned to
  Git blob `0fc9ef32991a903d10da8c7ad53e797adc706b05`.
- CI checks the exact original source, verifies it refuses to modify an
  unmarked folder, applies the patch only to a disposable clone, and compiles
  the real client on Windows and Linux.
- The Java client will not start its control listener unless
  `JOSHRS_377_CLIENT_CONTROL_ENABLED=true` and a unique
  `Harness...` account, `isolated-...` world ID, **non-family** game port,
  loopback control port and strong token are supplied.
- Every control request is authenticated and applied from the real Java
  client update thread. No game world, saved account or player database is
  modified directly.
- `setTab` changes the native `selectedTab` and redraws the sidebar.
  `randomizeCharacterDesign` generates actual valid 377 identity kits
  and body colours while the packed `player_kit` interface is open.
  `acceptCharacterDesign` sends the exact ordinary client ISAAC opcode
  163 with gender, seven kits and five colours. Completion is NOT reported
  until the independently read native 377 server appearance actually changes.
- Native normal gameplay packets (walk, NPC, loc, inventory, etc.) are
  accepted **only** through the same Java client's authenticated ISAAC
  channel, with a strict opcode and payload-length whitelist. The adapter
  never makes a second login with the same account.

The code does **not** automatically install itself on the family PC. The
production family server at port 52402 is explicitly refused; Elrothiro,
Sylvie, private accounts and saves are never used by CI.

## Building a disposable client

Run `patch-client377.py --client <checked-out-original-377-client> --check`.
For an actual isolated test checkout, place a marker
`.joshrs-isolated-client-control-ok` containing exactly
`isolated-test-only` and run the same script with `--apply`.
The patch creates a byte-for-byte backup of the original Client.java, then
adds the helper and game-loop hook; never overwrite the original source.

To run the patched test Java client use a dedicated rev377 game TCP port
such as 15402, never the family port, and set these environment fields:

```text
NODE_PROFILE=joshrs_ci_377
NODE_XPRATE=1
JOSHRS_377_CLIENT_CONTROL_ENABLED=true
JOSHRS_377_CLIENT_CONTROL_WORLD=isolated-joshrs-ci-377
JOSHRS_377_CLIENT_CONTROL_BOT=HarnessProbe
JOSHRS_377_CLIENT_GAME_PORT=15402
JOSHRS_377_CLIENT_CONTROL_PORT=19083
JOSHRS_377_CLIENT_CONTROL_TOKEN=<new strong secret with 32+ ASCII letters/digits>
RS377_OBSERVER_ENABLED=true
RS377_OBSERVER_ISOLATED=true
RS377_OBSERVER_BOT=HarnessProbe
RS377_OBSERVER_WORLD=isolated-joshrs-ci-377
RS377_OBSERVER_TOKEN=<separate observer-only secret>
WEB_MANAGEMENT_PORT=<disposable game management port>
RS377_SDK_GATEWAY_PORT=<another dedicated local port>
RS377_SDK_TOKEN=<third separate strong secret>
```

When and only when the native Java client is logged into that *same*
isolated game and its observer is authenticated, run
`node tools/rs377-upstream-sdk/start-java-gateway.mjs`. The SDK then uses
`ws://127.0.0.1:<RS377_SDK_GATEWAY_PORT>/gateway`. The runner validates
the real game profile, world ID, account and observed state before opening
its WebSocket controller.

**Current acceptance:** Compiles against original Java source; source and
faked localhost control protocol tests pass. A real GUI character using
all three controls, followed by engine-observed character persistence and
relogin, is not yet demonstrated. Never equate compilation or a socket
acknowledgement with a finished real-world action.

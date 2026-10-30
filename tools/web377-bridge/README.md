# Experimental 377 browser transport bridge

This is a **working, local-only binary WebSocket ↔ TCP transport adapter** for investigation of the uploaded `runescape-web-client-377` project. The web client's `Socket.ts` opens `ws://127.0.0.1:43594`; JoshRS's personalised Lost City game normally listens on TCP 52402. This adapter joins those two **byte streams**, without decrypting, rewriting or inspecting game login credentials.

**Not a playable client integration yet:** Apollo and Lost City may differ in login RSA keys, ISAAC, opcode tables, caching, packet formats and engine revision. A successful echo test verifies transport only, **not in-game login**. It does not expose JoshRS on the public internet or allow Android phones to play from another machine.

## Locally run on the JoshRS server computer (no save modifications)

Requires Node.js 22+ and npm, and a deliberately launched separate compatible browser client:

```bash
cd tools/web377-bridge
npm install --ignore-scripts --no-audit --no-fund
npm test
npm start -- --origin http://127.0.0.1:8080 --target-port 52402
```

The web client must be served locally with the **exact** browser origin specified above. The gateway listens only on `127.0.0.1:43594` (binary WebSocket); forwards to `127.0.0.1:52402` (raw game TCP); accepts only the configured origin and paths `/` or `/game`; limits connected clients to 4, frames to 1 MiB; rejects text frames; and uses backpressure and shutdown on disconnect. No web-client code, third-party game caches or player credentials are installed in JoshRS.

Use Ctrl+C to stop. Never modify the existing 377 Java client or stop a working game to try this bridge. Do not configure LAN/WAN listening, publish raw game ports or rely on the bridge for production authentication.

## Prepare the upstream browser client in a private working copy

If you have cloned the pinned `integrations/reference-sources/web-client-377` submodule, you can prepare a **non-destructive** corrected copy:

```bash
node tools/web377-bridge/prepare-client.mjs --source integrations/reference-sources/web-client-377 --output runtime/web377-sandbox-001
```

The script verifies the expected client source/port, copies it **only** into new `runtime/` workspace, excludes `test-rsa.pem`, corrects `Socket.write$byte_A` so it sends `bytes.slice()` instead of the `bytes.slice` function, and writes a detailed patch report. It refuses existing destinations. The original pinned source and customised 377 world are unchanged. **Do not upload the sandbox or bundled client cache to public GitHub.** The patch does not solve gameplay packet, RSA or cache mismatches.

## Integration acceptance gates
1. Confirm the test suite succeeds and the `ws` dependency is installed from npm (source MIT; npm integrity checking).
2. Prove the *correct* browser client cache has been loaded from an authorised local source. Keep Jagex cache and assets out of this public repo.
3. Compare login packet and encryption behaviour between the pinned browser client and JoshRS 377 Java client/engine. **Do not copy test-rsa.pem** or expose private RSA keys.
4. Prove clean account login, character movement, chat, inventory, region load, logout/reconnect and concurrent Java+browser players using disposable test accounts.
5. Only then consider secure remote/mobile access through an authenticated HTTPS/WSS solution; loopback gateway alone is not mobile hosting.

The `tools/rs377-map-bridge/jm2-inspector.mjs` and `map-inspector.html` are a separate **usable** source-inspection integration. They work without a server connection and do not edit game packs.

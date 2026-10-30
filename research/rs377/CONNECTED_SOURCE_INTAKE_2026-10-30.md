# JoshRS source intake — 30 October 2026

**Status: inspected archives; no gameplay/client runtime tests.** This is an engineering hand-off, not proof of compatibility. Files are held in the owner's private Drive JoshRS folder. Do not upload unlicensed client caches or Jagex assets to this public repository.

## Findings from archive inspection

| Archive | Verified contents | Integration judgement |
| --- | --- | --- |
| `runescape-web-client-377-master.zip` | 157 ZIP entries, ~20.1 MiB unpacked; TypeScript browser client, WebGL/rendering sources, cache readers, socket implementation, standalone 377 `client_cache/main_file_cache.dat` & indexes; Docker setup with Apollo backend | **Highest-priority research candidate** for browser/mobile, but **not drop-in compatible** with the personalised Lost City Java 377 server |
| `runelite-master.zip` | 3,187 ZIP entries; RuneLite Java client/API/cache libraries, BSD 2-Clause README | **High-value reference** for diagnostics, cache inspectors, overlays and UI concepts; modern OSRS client != Lost City 377 client |
| `jar-re-main.zip` | 73 entries, Java/ASM reverse engineering utility, MIT README; repository notes that class modification/save remain TODO | **Specialist optional** tooling for diagnosing Java client, not game content |
| `OSRS-Steam-main.zip` | Six entries, notes and partial C++ disassembly snippets of native OSRS client; no complete runnable client | **Low priority**; do not treat as an implementation-ready renderer |
| `JoshRS_All_Agy_Upgrade_Prompts.zip` | 16 Agy/Codex prompts, README explicitly says not evidence of implementation | **Requirements and regression inventory**, not runnable source |
| `RSMap/` | Image references, two modified terrain/object archives, map viewer and associated map assets | **Useful for map UI research and offline staging**, not direct client-cache replacement |
| `Archive.zip` | 696,939,100 bytes in connected Drive; extracted JoshRS engine/content directories separately accessible | Potential complete host snapshot. **ZIP itself not inspected** because authenticated Drive fetch rejects >256 MiB; do not assume it is the current JParris Desktop runtime |

## Key incompatibility: browser client does not speak to JoshRS out of box

Inspected `runescape-web-client-377-master/osrs/Configuration.ts`:
- `SERVER_ADDRESS=127.0.0.1`
- `GAME_PORT=43594`
- `JAGGRAB_PORT=43595`
- `HTTP_PORT=8080`
- RSA handshake settings embedded for *another* server.

Inspected `osrs/net/Socket.ts`: connects with `ws://host:port`; `osrs/net/WebSocketClient.ts` uses browser WebSocket binary frames.

Inspected `docker-compose.yml`: assumes `../apollo` backend and mounts the included 377 cache. The user’s personalised JParris Desktop installation instead uses Lost City 377, commonly TCP 52402 / HTTP 8888 (must inspect active.json and .env, never assume). Simply changing a port constant cannot bridge a WebSocket client to a raw TCP listener, and Apollo-specific handshake/opcode behaviors may differ.

## Recommended working implementation order for Agy

1. In a **disposable environment**, build the downloaded browser client with a supported pinned toolchain, recording original dependency versions and failures. Do not run unknown bundled JAR/APK executables or touch live saves.
2. Audit the web client's full login/update packet, RSA/ISAAC handshake, incoming/outgoing opcode mappings and cache references against the real current 377 engine and working Java client. Enumerate mismatches in machine-readable form. Do **not** transmit plaintext user credentials over remote endpoints.
3. Implement a **localhost-only WebSocket ⇄ TCP bridge** in the existing host *only when* protocol compatibility is demonstrated. Secure origin/host checks, max frame lengths, connection limits, bounded queues, backpressure, authentication and disconnect lifecycle. For a phone, expose only through a deliberately authenticated and appropriately secured LAN gateway; never open the raw game/login service publicly.
4. Use authorised same-revision cache data for browser test, not older bundled `client_cache` by default. Jagex cache is not covered by code's ISC licence.
5. Test clean browser login to **existing** server with a fresh non-Elrothiro test character: movement, inventory, chat, player visibility, save/reconnect, map squares, multi-client concurrency; then mobile touch targets and performance.
6. If the browser client is incompatible, keep Java 377 as authoritative and use a distinct remote-play solution rather than claim browser gameplay works.
7. Use RuneLite `cache` module ideas for optional original tools to inspect scene model counts, loc IDs, terrain transforms, and visual overlay alignment—but don't drop modern RuneLite plugins into old 377.
8. Convert 16 Agy prompts into acceptance criteria and compare against live source before reimplementing; their presence does not mean features are finished.
9. Map changes must pass `tools/rs377-map-bridge/` audits and disposable server/client validation before promotion. Never overwrite original `m48_54` / `m40_48` without merging and verifying the desired delta.
10. Preserve all save directories and SQLite in consistent backup, local Agy changes and custom client edits before every deployment. Report VERIFIED BUILD, VERIFIED LOCAL LOGIN and VERIFIED LIVE separately.

## Licensing and security
- Inspect each archive's actual licence and transitive dependencies before moving source; the included web client contains proprietary game cache data.
- No copying proprietary 2026 map textures, official Jagex dialogue or native client binaries into public JoshRS.
- Do not publish personal world data, player databases, RSA keys, account passwords or private Google Drive links.

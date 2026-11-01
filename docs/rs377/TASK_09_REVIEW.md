# Task 9 — licence, provenance and security boundaries

## Verified source and limits
- JoshRS root LICENSE is MIT, copyright 2026 Parris Tech Services. This covers JoshRS-authored code, **not** third-party game assets or independently licensed source.
- Pinned RS-SDK is MaxBittker/rs-sdk at db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb. Its pinned LICENSE is MIT, copyright 2025 Lost City; preserve original notices for any copied substantial code; a Git reference or independently authored interface is not evidence that upstream code was copied.
- LostCityRS Engine-TS, Content and Client-Java are separate upstream projects pinned in deploy/jparris-windows/upstreams.json. Pinned Engine-TS and Content LICENSE files are MIT (copyright 2023–2026 Lost City); a root LICENSE at pinned Client-Java returned 404, so that project's licence remains unresolved. Review its actual licence and individual asset provenance before redistribution; do not assume the JoshRS MIT licence grants rights to RuneScape/Jagex cache, maps, sounds, sprites or other assets.
- This is a **provenance boundary**, not a legal opinion or an assertion that all dependencies are redistributable.

## Verified threat surfaces
1. **Server private RSA key:** pinned Engine-TS src/engine/World.ts reads data/config/private.pem. This key must remain server-side. Client should receive only public RSA material via an authenticated channel; never place private.pem in Git, Fedora handoff or SDK configuration.
2. **Unsafe SDK gateway defaults:** pinned rs-sdk/server/gateway/gateway.ts defaults GATEWAY_HOSTNAME to 0.0.0.0 and authenticateSDK permits development-mode connections when LOGIN_SERVER_ENABLED is false. Never deploy that default on the family host. Require loopback/private networking, authentication and scoped control.
3. **Observer chat:** gateway explicitly permits say/privateMessage in observe mode. Treat observe as *not strictly read-only* and prohibit chat unless intentionally authorised.
4. **Untrusted text and code execution:** player chat, NPC dialogue, tool results and MCP execute_code inputs are untrusted. Do not interpolate them into shell commands, JS execution, SQL, agent instructions or privileged admin actions. The upstream MCP execute-code surface is not safe to expose to a bot without an independently enforced sandbox and capability boundary.
5. **Credentials and state:** never commit .env, private.pem, account credentials, player saves, session cookies or real player telemetry. Git ignores reduce accidental staging but are not access controls; check history and logs separately.
6. **No-cheat and non-disruption:** normal login, server-validated movement/actions, rate limits and observed state deltas only. No inventory/XP grants, direct teleports, process restarts or save writes on the family server.
7. **Cross-branch exposure:** Agy's harness is an isolated feature branch; a passing offline fixture does not prove the gateway, player data or production server are safe.

## Evidence and verification
- JoshRS LICENSE and upstream pins inspected directly on GitHub.
- Engine-TS World.ts and RS-SDK gateway.ts and mcp/execute-code.ts inspected at pinned commits.
- Task 16 config and .gitignore safeguards tested in rs377-bot-safety workflow; no live host security audit performed.
- Before release: inventory actual imported third-party code and notices, run secret scanning on Git history, review asset provenance, pen-test authenticated gateway, and verify real host firewall/ACLs. These are **not complete** here.

## Pinned licence inventory
- JoshRS: MIT (2026 Parris Tech Services).
- Engine-TS at b5ac859b: MIT (2023–2026 Lost City).
- Content at 44eab090: MIT (2023–2026 Lost City).
- RS-SDK at db0cc51e: MIT (2025 Lost City).
- Client-Java at 327880f6: complete 109-entry pinned Git tree has no LICENSE, COPYING or NOTICE file. Its redistribution licence is unresolved. Related projects' MIT notices do not automatically apply.
- Original game assets and client binaries require separate rights review. This task is a source-security and provenance review, not permission to redistribute those materials.

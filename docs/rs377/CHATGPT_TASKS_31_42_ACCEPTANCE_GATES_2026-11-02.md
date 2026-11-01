# Tasks 32–42: executable evidence boundaries (2 Nov 2026)

## Current source-only status
- 21–25: source bridge with offline fixtures; normal gameplay and world observations not live-proven.
- 26–30: loopback-only controller and ledger with offline fixtures; no real RS-SDK gateway connection.
- 31: safe mode coordinator implements **follow proposals** from explicitly trusted visible-target observations; assist and gather intentionally fail closed until native state and interactions are implemented.
- 37: strict redacted evidence validator rejects fabricated same-world/gameplay pass records.
- 33/38: GitHub CI executes Node tests; no Fedora/Windows machine test is implied.

## 32: no-cheat scenario
1. Connect a **disposable** bot account to an isolated #377 server using normal client login.
2. Observe initial location, equipment, inventory, skills, XP and quest stage through native server-backed state, not fixtures.
3. Acquire an axe via a normal shop or ground interaction; observe inventory delta.
4. Walk to a real tree, select the ordinary chop action, observe log inventory increase and exact server XP delta at **1x**.
5. Walk to a bank, deposit logs using normal packets, observe bank and inventory deltas.
6. Logout and reconnect; verify persistent inventory, bank and XP.
7. Only then attempt Cook's Assistant with real dialogue, item acquisition and quest-state observations.
Any absent packet, observation, dialogue or bank action is **BLOCKED**, never a success by admin grant or synthetic state.

## 34: isolated integration safety gate
A disposable integration runner must require separate game port (not 52402), separate web port (not 8888), separate DB/save root and explicit disposable identity. Refuse any unknown or family-world fingerprint. Never default to production credentials, ports or saves. No such fully integrated runner has yet been verified.

## 35: two-client acceptance
With two actual independently authenticated clients connected to the *same* server world fingerprint, assert bot appearance to Elrothiro, reciprocal visibility, walking observed by both clients, Friends List online/offline, normal chat, follow movement, logout and re-login. Require redacted timestamps and screenshots or state evidence; a server-only bot fixture does not pass.

## 36: real gameplay acceptance
Assert NPC dialogue, loc interaction, ground pickup, legitimate 1x XP, inventory/bank changes, and persisted state after reconnect. Source tests and mocked states are insufficient.

## 37: evidence
Use `lib/evidence.mjs` with only kind, outcome, timestamp, sourceCommit, worldFingerprint (SHA-256 of a stable nonsecret world identity), and named pass/fail/blocked checks. Never capture credentials, player saves, private keys, raw chat or account names.

## 38: cross-platform gates
GitHub Linux CI proves only Linux source/test behaviour. Fedora AVANCE-WS7 and the active Windows family server remain unverified until redacted host-specific outputs are supplied.

## 39: non-disruption and rollback
- Before any real test, record the current server process identity, service port, world fingerprint and safe backup confirmation **without reading or copying saves**.
- Do not stop or restart active services; never reset the family world, overwrite saves or change human inventories.
- Use a disposable world/account and independent ports. Cancel by stopping only the new bot client or isolated runner.
- Rollback source by reverting the specific merged commit, not by resetting shared branches or Agy's worktree.
- If world identity is uncertain, stop before authentication. If a trade/transfer outcome is uncertain, do not replay it.
- Confirm Elrothiro, Sylvie and Luna remain online/unmodified when testing alongside them, with explicit operator approval.

## 40–42: honest handoff and proof
- GitHub source: inspect commits, exact test runs and open PRs.
- Fedora preflight: **unverified** until executed on Fedora.
- Disposable #377 login: **unverified** until actual engine/client integration passes.
- Same-world bot: **unverified** until two-client evidence passes.
- Playable autonomous bot: **unverified** until real movement, chat, interactions, 1x XP, persistence and recovery pass.
Do not mark task 42 complete from repository documents, fixtures or a single TCP handshake.

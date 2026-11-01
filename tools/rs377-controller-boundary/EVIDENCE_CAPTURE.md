# Task 37 — redacted evidence capture

This is a source/test deliverable, not evidence of a real-world login. The parser never contacts a game host, runs commands from evidence, reads a save or restarts a server.

Copy fixtures/evidence-capture.template.json to a private location. Replace placeholder hashes and timestamps using **actual authorised test observations**. Use only identity categories, not usernames. Keep IPs, credentials, chat, log streams, account names and save paths outside the JSON.

Run with Node 20+:

    node tools/rs377-controller-boundary/cli/capture-evidence.mjs --input /private/capture.json --output /private/validated.json

Omit --output to print a validated redacted result. Output is created mode 0600 and never overwritten. Invalid records return exit code 2 and a safe diagnostic.

## Provenance and raw outcomes

- host.identityHmacSha256: exact 64-character hex HMAC-SHA256 of the host identity, using a separately retained secret key; do not publish hostname or key.
- host.sourceCommit: actual 40-character lowercase SHA from git rev-parse HEAD.
- host.sourceSha256: SHA-256 of the precise approved source/binary file tested, never a save or credential.
- world.identityHmacSha256: HMAC-SHA256 of the stable *engine-observed* world identity using the same separately retained key. A self-declared value is not proof of a shared server.
- identities: bot/player category only (disposable, family, none, unknown).
- startedAt, endedAt and action at: exact chronological UTC timestamps. A genuine game observation needs an engine tick; dispatch is merely sent.
- rawTestOutcome: original test runner status and exitCode, with optional SHA-256 hashes of the unmodified stdout/stderr byte streams. Raw text is NOT accepted.
- assertions: unique named statuses and machine-safe failureCode for each failed, blocked or unverified assertion; no raw exception strings.

Passing same_world requires two_clients_visible plus world_identity_matched. Passing gameplay requires normal_action, observed_effect and persistent_relogin. Every assertion must pass. The parser deliberately returns liveVerified:false for all outputs; passing operator captures remain pending independent review.

A reviewer must separately corroborate originating host/process, real source/build hash, authoritative world identity, two real clients and observed gameplay before any live acceptance can be claimed.

## Offline checks

    cd tools/rs377-controller-boundary
    npm run check

No test fixture or source-only passing CI run is proof of Elrothiro/shared-world gameplay.

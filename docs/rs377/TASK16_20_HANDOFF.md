# Tasks 16–20: Fedora/Agy source-only handoff

## 16 — Safe bot configuration
Use [placeholder-only configuration](../../tools/rs377-bot-config.example.json). Default mode is offline; productionEnabled and gateway control are false. Use a separate disposable bot identity, never Elrothiro or family accounts. Set secrets only in environment variables outside Git. Never commit a filled config, logs, tokens, .env or key material. Verify gitignore with `git check-ignore -v .env tools/rs377-bot-config.local.json` (exit code 1 means a path is NOT ignored). No live endpoint is confirmed.

## 17 — Client key and handshake strategy
The game server's `private.pem` is a **server-only secret**; never copy, export or place it on Fedora. The client needs only the corresponding public RSA modulus/exponent (from a public client configuration or authenticated distribution), not the private key. Implement the revision-377 login using the pinned client and server sources, fresh random seed, proper ISAAC key derivation and verified CRCs. Keep existing server authentication unchanged. Reject wrong public key, malformed encrypted login, wrong CRC, bad revision and bad credentials. Test against a disposable offline mock and isolated game instance; do not weaken server login or use privileged bypasses. Do not assume gateway WebSocket credentials are interchangeable with game login.

## 18 — Bot doctor
Run `node tools/rs377-bot-doctor.mjs` to produce redacted JSON and human status. A source-only check can never claim worldReady=true. Exact blockers and next task are included; no credential values, player saves or private keys are read.

## 19 — Agy handoff
From the Fedora checkout root `/home/josh/dev/JoshRS`:
```bash
bash tools/rs377-task15-entrypoint.sh
```
This fetches Agy's pinned feature branch and prepares a separate worktree, runs offline checks, then prints the next task. Inspect the new worktree at `~/dev/JoshRS-rssdk-harness`. For offline checks: `npm run check --prefix tools/rs377-agent-harness` from the isolated worktree. Agy owns native client packet decoder, RS-SDK adapter, gateway and live proof; ChatGPT owns source-only CI, documentation and safe scripts. See [capability matrix](TASK08.md) and [42-task tracker](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md). **Do not** treat the bootstrap as an unattended live installation or start the game.

## 20 — CI evidence and remaining work
PR #63's harness run [41351224532](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41351224532) and JoshRS checks [41351224514](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41351224514) succeeded for the bootstrap hardening branch. PR #62 is still open and has separate CI status; inspect its most recent run and job logs before declaring the whole PR green. Vercel build-rate-limit is unrelated to harness correctness. Task 20 remains pending until latest PR #62 logs are reviewed.

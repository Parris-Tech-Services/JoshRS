# RS-SDK on Android/Termux — first working session

Machine: **Android SM-A556E (Termux)**, Node v26.3.1. No Bun available (`pkg search bun` → nothing).
Live `~/lc274` untouched; Elrothiro save untouched.

## What was done

1. Cloned [MaxBittker/rs-sdk](https://github.com/MaxBittker/rs-sdk) (`~/rs-sdk`, 13,956 files).
2. `npm install --ignore-scripts` after removing `bun.lock` → **227 packages, exit 0**. The SDK installs
   under npm; it does not hard-require Bun to resolve dependencies.
3. Counted the actual Bun surface used by the bot/SDK path:

   | API | uses |
   |---|---|
   | `Bun.sleep` | 18 |
   | `Bun.serve` | 16 |
   | `Bun.spawn` | 8 |
   | `Bun.file` | 7 |
   | `Bun.write` | 2 |

   That is a small, shimmable surface — none of it is Bun-specific in a way Node lacks.
4. Wrote `~/rs-sdk/bun-shim.mjs`: `sleep` → `setTimeout`, `file`/`write` → `node:fs/promises`,
   `spawn` → `child_process`, `serve` → `node:http`. Syntax-checked.

## How the pieces fit

- `bots/_template/script.ts` runs `runScript(async (ctx) => …)` with `ctx.bot` and `ctx.sdk`.
- Connection comes from `bots/<name>/bot.env`: `BOT_USERNAME`, `PASSWORD`, `SERVER`.
- `SERVER` is a **gateway** host, not a raw game port (`sdk/runner.ts` derives the gateway URL).
- The bundled `server/start.ts` clones `LostCityRS/Engine-TS`, `Content`, `Client-TS` into
  `server/{engine,content,webclient}` — i.e. an upstream 2004scape-style stack, and `server/content`
  already holds 115 MB of content.

## Consequence for "connect to any JoshRS world"

A JoshRS world does **not** speak the RS-SDK gateway protocol; it speaks the game protocol directly.
So a bot cannot attach to `~/lc274` as-is. The realistic paths are:

1. **Run RS-SDK's own bundled server** (upstream stack) and complete Cook's Assistant there — proves SDK
   + bot control on Android, which is what the goal's first half asks.
2. **Port the gateway** onto a JoshRS world (large; the gateway expects server-side state hooks).

## Status

| Step | State |
|---|---|
| RS-SDK on Android (deps + shim) | **PARTIALLY COMPLETE** — installs and shims, not yet executed |
| Bot connected to a world | **BLOCKED** — needs the bundled server running |
| Cook's Assistant by bot | **BLOCKED** — depends on the above |

## Next

Start `server/start.ts` under Node with the shim (it may clone three repos on first run), then run a
template bot with `bot.env` pointing at `127.0.0.1`, and only then script Cook's Assistant.

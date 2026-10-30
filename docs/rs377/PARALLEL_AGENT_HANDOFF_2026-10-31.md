# JoshRS: safe division of work across three Agy agents and ChatGPT

**Applies to the active personalised Windows #377 game.** This file is a safety/coordination policy, not evidence that a bot, interaction, quest or multiplayer test works.

The running game is the engine/client/content selected by `runtime/jparris-377/active.json`. Live Elrothiro/Luna saves and `db.sqlite` are private production state. Never substitute Woodlands/Vercel, fresh worlds or zero-account demo databases.

## Non-overlapping ownership

| Worker | Owns | Must defer / hand off |
| --- | --- | --- |
| Agent 1: core interactions | `Player.ts` trigger/morph resolution, `OpNpcHandler.ts`, `OpLocHandler.ts`, `ScriptProvider.ts`, item/quest/door/bank/shop scripts and their tests | Any bot-specific `BotPlayer.ts`, Luna duel state and `OpPlayerHandler.ts` edits belong to Agent 2 |
| Agent 2: Luna | `BotPlayer.ts`, dedicated `LunaSparSession` / bot AI modules, `OpPlayerHandler.ts`, dragon support/combat validation, AI regressions | Shared `Player.ts` hooks are **interface requests**, not concurrent live edits. Agree on the change with Agent 1 and merge it once |
| Agent 3: QA and persistence | Read-only active-runtime audit, `active.json`, clean backups, SHA/CRC/SQLite checks, isolated test worlds and client-gameplay acceptance matrix | Do not modify `Player.ts`, `BotPlayer.ts`, content scripts, live server start/stop or overwrite other agents' changes |
| ChatGPT: separate GitHub work | Independent native source research, content rights/completeness inventory, map/browser tooling, CI repairs and GitHub issue evidence | No direct edits to JParris Desktop, game binaries or private saves; do not assert live playback from GitHub tests |

**Collision observed in supplied progress logs:** Agents 1 and 2 have both inspected or changed `Player.ts` and bot-facing handlers. Agent 3 was given the same broad implementation prompt as Agent 1. Resolve that overlap before any competing writes or restarts.

## Required process

1. **Preflight:** Each agent reads `active.json`, inspects git/worktree status and identifies files currently changed by another agent. If the launcher is an extracted source ZIP rather than a clone, do not run `git reset`, `git clean`, or replace folders with a fresh ZIP. Prefer separate local branches/worktrees or disposable code copies.
2. **Protect production:** Agent 3 records SHA-256 of both player saves and account DB, checks native 377 save CRC-32 and SQLite integrity, and makes a consistent offline backup after graceful logout/server stop. Do not promote a game-changing commit without a verified rollback copy.
3. **Single runtime owner:** Only **one** agent may gracefully stop, restart, package or deploy the active Java/Node game at a time. Agent 3 coordinates that window. No other agent touches `active.json`, production `.env`, packs or `db.sqlite` while the runtime owner is operating.
4. **Explicit shared-file handoff:** When Agent 2 needs `Player.ts`, give Agent 1 a small patch, insertion point, tests and expected behaviour. Agent 1 integrates the common hook. Agent 2 integrates `BotPlayer`/duel modules only after that API exists. No overlapping live editor sessions.
5. **Build safely:** Test each branch against a separate disposable engine/content checkout and separate game/web ports. Compile exact pinned 377 scripts. Never test negative persistence, death, PvP or duelling on the sole live Elrothiro save.
6. **Integration order:** First Agent 1's script/interaction fix, then Agent 2's Luna challenge/combat patch, then Agent 3's integration acceptance. Each handoff includes source diff, test output, exact engine build and outstanding failures. Changes should be reviewed for duplicated behaviour and existing rune/amulet/crafting features.
7. **Close with evidence:** A feature is **VERIFIED PLAYABLE** only after actual client interaction and persistence check, not because it appears in the menu or an automated unit test passes. Mark missing stages PARTIALLY COMPLETE/BLOCKED. Only push code and safe documentation—not proprietary game caches, private login data or files from `runtime/`.

## This session's immediate order

- Agent 1: finish/retest `multinpc`/`multiloc` category dispatch, remove unsafe generic door/inventory fallbacks, independently prove affected NPC/location interactions.
- Agent 2: fix the dead `Challenge Luna` option, implement no-stakes consensual duel and valid dragon-assist behaviour using normal combat. Preserve Agent 1's shared code until integration. Level-99/gear enhancements are not proof of autonomous AI.
- Agent 3: verify that `elrothiro.sav`, `Luna.sav` and matching live SQLite are preserved, then prepare clean two-player and duel integration test evidence. Do not accidentally reset or empty the account DB.
- ChatGPT: fix isolated experimental Web377/WASM CI, check real source gaps and provide supporting independent tests, leaving Windows runtime untouched.

**If work collides:** Stop the *conflicting edit*, not the running user game. Preserve both versions of the changed file, compare hashes and diffs, reconcile explicitly in an isolated worktree, rerun tests, and only then commit/promote.

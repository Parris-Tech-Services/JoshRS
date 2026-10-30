# Luna 377: dead duel option and smart-bot upgrade — 31 October 2026

**Status: PARTIALLY COMPLETE.** Live screenshot shows visible Luna, player menu `Challenge Luna (level-3)` and no response after clicking. The screenshot proves rendering and client menu only, **not that the option is wired or that duel gameplay works**. The current Agy edits to JParris Desktop's `runtime/jparris-377/usb-20261030-203927/engine` are local and are **not part of this public JoshRS repository**. Never overwrite or replace them with an upstream checkout.

## Exact cause to investigate first

In LostCityRS/Engine-TS `377-wip`, `src/network/game/client/handler/OpPlayerHandler.ts` processes client player options and calls `player.setInteraction(Interaction.ENGINE, other, ServerTriggerType.APPLAYER1 + message.op - 1)`. **That schedules an interaction but is not a complete duel.** Actual behaviour requires an eligible script trigger/handler and a reciprocal decision by the target player.

In LostCityRS/Content `377-wip`, `scripts/minigames/game_duelarena/scripts/duel_arena.rs2` defines `toggle_duel_challenge_on` with `set_player_op("Challenge", 1, false)` and `in_duel_arena_challenge_area` / zone checks. It opens duel interfaces and expects *both* players to approve rule and confirmation screens. A server-created `BotPlayer` has no client GUI to click those buttons, so its acceptance must be implemented as **validated server-side bot actions**.

**Most plausible causes in the user's build** (inspect rather than assume): local Luna setup may show the option globally, without matching OPPLAYER trigger; the click may be rejected because the target is not visible/active at dispatch; or the bot has no action handler for duel request/reciprocal acceptance. Also note the screenshot is not at the native Duel Arena, and the original script restricts challenges by zone.

Do not "fix" by bypassing PvP checks, manually modifying inventories or toggling Duel Arena status vars. If duel cannot begin, send an explicit **reason** to Elrothiro instead of silently returning.

## Run the safe static audit first

Read `runtime/jparris-377/active.json` **without switching worlds**; use the actual `engine` and `content` paths from it.

```powershell
$root='C:\JoshRS-Launcher\JoshRS-main';$s=Get-Content "$root\runtime\jparris-377\active.json" -Raw|ConvertFrom-Json;node "$root\tools\luna377\audit-duel.mjs" --engine $s.engine --content $s.content
```

This audit is read-only and reports the exact source files and likely missing trigger wiring. It is NOT a gameplay test. Source unit tests run in `.github/workflows/luna377.yml`.

## First playable acceptance: no-stakes friendly sparring with Luna

Choose this **custom non-historical mode for challenges outside the Duel Arena** instead of accidentally invoking the real arena's stake interfaces. Inside the Duel Arena, preserve normal historical script flow.

1. Capture the live `OpPlayer` packet `op` and selected target `slot` for **one** `Challenge Luna` click. Confirm the genuine visible `BotPlayer` object, source player, same plane, active/online status, and allowed range. Avoid broad debug logging or credentials.
2. Route the action through the normal player option and script dispatch. Identify *who* owns the custom `Challenge` option (server player-op label vs. Lua/RS2). No silent no-op. Test it does not override normal human-vs-human duel or trade.
3. A **separate, server-owned** `LunaSparSession` state machine: `idle -> requested -> accepted | declined | timed_out -> countdown -> fighting -> finished | forfeited | disconnected -> idle`. Both identities/slots are checked at every transition; max one session per participant; bounded timer; no stale or ghost slots after logout/restart.
4. Require **Elrothiro initiating the duel** and Luna consenting. For a friendly bot, Luna may automatically accept on a short human-readable delay when free, or politely decline when busy, low-health, far away, path-blocked, in combat or already duelling. No pre-emptive attacks.
5. Use ordinary validated server movement, line of sight, combat, prayer, gear, food and timing. No teleport-on-attack, direct hitpoints setting during combat, forced XP or item duplication. Start only if the area is safe/legal for an explicitly authorised *custom spar*. If ordinary engine combat refuses damage outside PvP areas, implement an explicit opt-in training arena rather than relaxing global PvP restrictions.
6. **No stakes, loot or player deaths.** End at 1 HP or server-approved knockout; stop pending hits, clear combat and session flags, heal/recover through approved cleanup, restore original position if intentionally moved, award **no rewards** unless documented game rules provide them. Never replace save files. Respect logout/disconnect and other active events.
7. The client receives meaningful feedback at each stage, e.g. "Luna is considering your challenge", "Luna accepts", or "Luna can't duel while following you". Messages must reflect real session state.
8. Regression on a **disposable test clone**: click request, acceptance, refusal, two simultaneous requests, stale slot/region mismatch, disconnect, logout, combat damage, victory, recovery, repeated duels, no-stakes inventory, unrelated human duels, existing trade/follow actions and persistent Elrothiro save. Then verify the actual Java client visually and in saved state.

**Do not restart the user's current live game or replace Elrothiro/Luna data without a consistent offline backup and explicit supported maintenance workflow.**

## Free/open-source bot intelligence references, ranked by actual fit

1. **[2004SP Progressive](https://github.com/2004sp/2004sp-progressive)** (branch `dev`, commit `aeadbc43114d70805dd16a98bf327439732d535a`) — best **TypeScript/Lost City architectural fit**. Inspected `bundled/progressive/engine/src/engine/bot/`: `BotGoalPlanner.ts` (1,145 lines: personality-weighted skills, tools, needs), `BotAction.ts` (3,477 lines: real `setInteraction`, collision/pathfinding), `BotNeeds.ts`, `BotNavigation.ts`, and task implementations for woodcutting, fishing, mining, combat, cooking, smithing, banking and PvP. Strongest first source to **compare and selectively port concepts**, after matching the actual 377 revision and available content IDs. Do not blindly merge engine or bundled assets.
2. **[luna-rs/luna](https://github.com/luna-rs/luna)** (branch `master`, commit `090357b2571ef02c66fc1f517642a275e6f5644e`) — best **native revision-377 autonomous-bot architecture**. Inspected `BotBrain.java` (weighted behaviour domains/coordinators), `BotReflex.java` (dialogue and combat emergency response), `BotPersonality.java`, and `BotCombatActionHandler.kt`. Uses Java/Kotlin engine, so its bot classes **cannot** be pasted into the TypeScript Lost City engine. It is an independent project, unrelated to JoshRS's player named Luna.
3. **[RS-SDK](https://github.com/MaxBittker/rs-sdk)** (commit `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`) — best **agent perception, tools and verified outcomes**. Its SDK distinguishes an action sent from a server effect observed. Useful for observation and high-level goal evaluation, but its webclient/gateway/protocol and game fork are not drop-in 377.
4. **[Microbot](https://github.com/chsami/Microbot)** (commit `050a0826cea60a010a123f4090e44364c4044313`) — best free, broad RuneLite **OSRS client automation scripts**, many skills/activities. Useful for design, object queries and task scripts, but modern RuneLite/OpenOSRS is not compatible with the classic 377 Java client or server bot.
5. **[PvP-SDK](https://github.com/SeanVella/pvp-sdk)** — useful for autonomous PvP decision/evaluation, but modifies its entire world to allow PvP everywhere. **Do not import its unsafe all-world PvP rules** into JoshRS.

These are free code references, not free hosted inference or proof of right to republish all bundled historical game assets. The code and proprietary assets have separate licences. Do not create accounts, purchase API plans, install unknown third-party game clients or run bot scripts against the official Jagex servers.

## "Smart Luna" implementation architecture

Keep the **existing local `BotPlayer`** as the authoritative character; do not spawn a second Luna account or NPC clone.

```text
Live #377 world
   |-- Perception: nearby players, items, NPCs, collision, health, tasks, chat
   |-- Urgent reflex: combat response, duel request, low HP, logout, dialogue
   |-- Memory: last interaction, reachable targets, failed actions, social history
   |-- Goal selector: weighted personality + tools/needs + current player requests
   |-- Action planner: gather -> bank -> resupply -> craft/train -> recover
   |-- Execution: NORMAL server actions and scripts (never direct XP/item hacks)
   '-- Outcome watcher: verify actual XP/item/movement/duel outcomes + replan
```

Suggested **implementation order**:
1. **Duel click** and reliable player options, accept/decline, follow/trade; direct feedback.
2. **Survival reflex:** equipment loadout, HP threshold, eat, escape, prayer/weapon changes within normal engine rules.
3. **Progression:** woodcut -> bank -> restock -> fish/cook -> mine/smith, with bounded retries, familiar paths and inventories.
4. **Social:** Luna remembers recent conversations, trade commitments and player preferences *in a private bot-specific state file*; never stores real account credentials or private chats in public telemetry.
5. **Multiple roles and personalities:** different generated bot identities (no duplicate Luna) with separate goals and offline persistence.
6. **Optional local model:** dialogue and goals only, not direct combat/loot control. Prefer deterministic gameplay; paid LLM API keys and subscriptions are not required.

**Key acceptance metrics:** >=95% player click yields response, 0 silent `Challenge` outcomes, 0 duelling outside configured custom-area rules, no item creation/deletion exploit, 100% Elrothiro save SHA unaffected by test, bot stays active 30 minutes without network socket timeout, bot pathing honours collision, repeated actions demonstrably change real game state, and overnight bot progression is bounded by engine rules.

## Honest status

**VERIFIED:** screenshot of visible Luna and player options; upstream source mechanisms; research comparison; static audit source and CI tests.

**NOT VERIFIED:** actual Agy local click packet, actual event handler, a duel, a smart autonomous task port, end-to-end gameplay, or persistence after restart.

**NEXT:** Agy should execute the audit against its current active engine, implement `LunaSparSession` and the existing bot request/response hooks inside the real customised code, then run actual client playtesting. Do not stop at a design document.

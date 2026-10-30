# JoshRS #377 feature and interaction audit

Audit baseline: 2026-10-30. This is an evidence inventory, not a claim that
every packed definition or script is playable. A feature is `present` when the
repository contains relevant data or handlers, `partially verified` when a
focused regression or source trace covers only part of the behaviour, and
`outstanding` when real client interaction or a complete acceptance path is
still required.

## Inventory

| Area | Inventory evidence | Current classification |
| --- | ---: | --- |
| NPC definitions | 3,432 section entries in `content/scripts/_unpack/377/all.npc` | present; interaction coverage outstanding |
| Location definitions | 10,174 section entries in `all.loc` | present; interaction coverage outstanding |
| Object definitions | 7,280 section entries in `all.obj` | present; use/trade coverage outstanding |
| Quests | 66 `quest_*` content directories | present; quest-by-quest acceptance outstanding |
| Minigames | 10 `game_*` directories | present; individual completion states vary |
| Skills | 18 `skill_*` directories | present; rates and edge cases require historical verification |
| Banks | 12 bank-related files | partially verified; no complete bank acceptance suite |
| Shops | 6 shop files | partially verified; no complete shop acceptance suite |
| Doors/ladders | 13 interaction files | partially verified; quest-specific routes remain risky |
| Automated engine tests | 4 focused test entry points | insufficient for full interaction coverage |
| Uncertainty markers | 1,022 TODO/guess/borked/confirmation matches | triage required; marker count is not a defect count |

## Verified slices

- Teleport network: 39 destinations and 11 focused suites passed.
- Candlelight/Pious Pete: source, state, recovery, and command-safety checks
  passed.
- Client world map: automated overlay and interaction-math checks passed.
- Cook's Assistant: after completion, `cooksquestrange` now dispatches to the
  canonical `attempt_cook_item` routine and its Cook-o-Matic table; focused
  regression passed in commit `9d636cf42` plus engine test `f4466495`.

## High-value outstanding interaction candidates

These are source-triage candidates, not yet marked as fixed:

1. Haunted Manor bookcase/secret-door path: source comment says the door search
   is still broken across zones; the lever route works.
2. Troll Romance sled sequence: source contains explicit TODOs for the second
   sled ride and boss-fight fidelity.
3. Quest-specific doors and ladders: build an acceptance matrix instead of
   treating shared handlers as proof that every route works.
4. Shop and bank edge cases: test inventory-full, quantity, stock depletion,
   buy-back, withdrawal, and persistence behaviour.

## Audit rules going forward

- Do not mark an NPC, object, quest, or minigame complete because its definition
  exists or it appears at the right coordinates.
- Each feature needs a source trace, prerequisite check, expected interaction,
  state/reward consequence, persistence check where relevant, and a real client
  acceptance result.
- Keep the #377 baseline and subsequent OSRS update milestones separate. No RS3
  mechanics or later OSRS changes enter the historical branch without a dated
  version entry and prerequisite review.

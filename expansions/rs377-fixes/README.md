# JoshRS revision-377 interaction fixes

Small RuneScript fixes for objects that exist on the revision-377 map but had no handler. Each one is verified in an **isolated** world before it's merged.

## `shortcut_sinclair_log.rs2`: log balance north of Sinclair Mansion (issue #297)

| | |
|---|---|
| Objects | `loc_9322`, `loc_9323`, `loc_9324` "Log balance", op1 `Walk-across`, ground decor (shape 22) |
| Placement | x 2722, z 3593 / 3594 / 3595, stored on map level 1 over the river |
| River | blocked water/bank tiles z 3592–3596 at x 2721–2723 |
| Landings | south bank **2722,3591,0** and north bank **2722,3597,0** |

**Why it needed an approach trigger.** The logs sit over blocked tiles, so no tile is ever adjacent to them, and an operate trigger (`oploc1`) always answers "I can't reach that!" (verified). The fix uses `aploc1`, the same pattern as the Waterfall crossing rock, with a 5-tile range check. The walk itself copies the existing `loc_2296` log shortcut: log-balance walk animation, `~forcemove`, the `log_balance` sound and 4 Agility XP (40 in tenths-of-XP script units).

**Authentic requirement.** Crossing requires **48 Agility**; players below 48 are refused before movement. The current script is deterministic (no fall/slip simulation), so historical failure rates are not yet implemented. Source checks for the level gate and XP are included, but level-47/48 **in-world playtesting remains required** after this correction.

**Isolated evidence (10 Nov 2026).** This used `tools/rs377-climb-survey/isolated_ladder_test.mjs` with `sinclair_log_cases.json`, on ports 52502/8990/8991 with throwaway accounts:
- South edge 2722,3591 → `loc_9324`: landed 2722,3597 ✔ (prior movement test, before level gate)
- South edge 2722,3591 → `loc_9323`: landed 2722,3597 ✔ (prior movement test, before level gate)
- North edge 2722,3597 → `loc_9322`: landed 2722,3591 ✔ (prior movement test, before level gate)
- North bank 2722,3598 → `loc_9322`: landed 2722,3591 ✔ (prior movement test, before level gate)

Limitation: a bare OPLOC packet sent from 3+ tiles back on the **south** bank (2722,3590) still gets "I can't reach that!" from the server. The Java client walks to the bank edge first (client routefinder on), so normal play starts at 3591. This hasn't been confirmed with the real Java client yet.

## Installing
Copy `scripts/*.rs2` into the active content under `scripts/skill_agility/scripts/` **only** while the server is stopped, after a backup. The server rebuilds packs on startup.

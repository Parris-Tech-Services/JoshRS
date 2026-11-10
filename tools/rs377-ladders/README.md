# JoshRS 377 missing directional middle-ladder handler (loc 1751)

## Evidence

At pinned LostCityRS/Content `377-wip@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, `pack/loc.pack` maps `1751=loc_1751`, while `1748=laddermiddle`. `scripts/ladders+stairs/scripts/ladders.rs2` handles ID 1748 with three actions, and handles IDs 1749 and 1750, but does **not** have a handler for 1751. The earlier unpacked loc definition identifies 1751 as a directional middle ladder with `Climb`, `Climb-up`, and `Climb-down` actions. The missing three handlers here reuse the existing ladder options and movement procedure from the pinned script; they don't introduce unrelated map destinations.

**CAVEAT:** The photo from Falador showed a player in the vicinity of the Hairdresser's Salon, but did not provide an object ID or coordinates. We have **not** confirmed that the clicked Falador ladder is ID 1751. If not, this patch fixes another real missing interaction but the Falador issue needs further location identification.

## Run safely on JParrisDesktop

1. Make a separate, disposable copy of the pinned 377 content and engine (not inside `runtime/jparris-377`). Never run tests against active player saves/database, or bind to the live game ports.
2. From JoshRS repo root, after copying the isolated content to a development location:

```powershell
node .\tools\rs377-ladders\apply-directional-middle.mjs --content 'C:\JoshRS-DEV\content'
node .\tools\rs377-ladders\apply-directional-middle.mjs --content 'C:\JoshRS-DEV\content' --apply
node --test .\tools\rs377-ladders\apply-directional-middle.test.mjs
```

The first command is dry-run; `--apply` is refused for paths inside `runtime/jparris-377` or the active content configured by `active.json`. The installer retains an original file copy as `ladders.rs2.joshrs1751.original` in the **isolated copy**.

3. Build/pack **only in the isolated engine and content**, on isolated ports, and exercise ID 1751 Climb, Climb-up, Climb-down and return transitions with disposable accounts. Confirm no collision/softlock, correct plane, and save/relogin. If compiler errors or mismatched loc config, **do not deploy**. Also identify the actual Falador clicked loc via NPC/loc debug tool or map placement before claiming the user issue resolved.
4. Only schedule installation to the actual live world with the owner's approval **after** Elrothiro and Sylvie have finished, a fresh verified offline backup, and confirmed successful gameplay in the isolated world. The installer **never deploys** to the active world.

## Automated checks

`node --test tools/rs377-ladders/apply-directional-middle.test.mjs` passed 3/3 in a disposable fixture. Tests cover exact id mapping guards, the three handler bodies, source-drift refusal, dry-run, backup and live-path refusal. **Not** a RuneScript compilation or actual client gameplay pass.

No protected game assets, maps, models, account data or player saves are included in this commit.

## Confirmed Falador ladder repair (loc 11739/11740/11741/11742)

The player screenshot was from the Falador Hairdresser's Salon area. Pinned 377 map data places the salon-side ladder at `(2946, 3378, plane 0)` with loc `11739` (`Climb-up`), and its same-tile upper landing `11741` (`Climb-down`) on plane 1. The adjacent `11740`/`11742` pair is used by the multi-storey Falador ladders at `(2954, 3389)`, `(2946, 3363)` and `(2946, 3378)`.

The pinned `ladders.rs2` has **no** `oploc1` handler for any of those IDs, which is why the live game returned exactly the default `Nothing interesting happens.`. `apply-falador-vertical.mjs` adds the four handlers using the existing `~climb_ladder` procedure:

| Loc | Action | Destination |
| --- | --- | --- |
| 11739/11740 | Climb-up | same x/z, plane + 1 |
| 11741/11742 | Climb-down | same x/z, plane - 1 |

Note the engine argument order is `movecoord(coord, x, levelDelta, zDelta)`. The correct level change is therefore the **third** argument (`0, 1, 0` / `0, -1, 0`), not `0, 0, 1`.

### Isolated verification (10 Nov 2026)

- Disposable 377 engine/content copy on ports 60001/60002/60003, separate SQLite and profile.
- Disposable account `testhero` (not a live account), teleported to `(2946, 3378, 0)`.
- Before patch: `oploc1 11739` left the player at `(2946, 3378, 0)`.
- After patch and isolated rebuild: up moved to `(2946, 3378, 1)`; then `oploc1 11741` moved back to `(2946, 3378, 0)`. Inventory and interface state unchanged.
- This is source-plus-isolated-gameplay evidence, not live deployment. The live family world was not touched.

### Apply safely

```powershell
node .\tools\rs377-ladders\apply-falador-vertical.mjs --content 'C:\JoshRS-DEV\content'
node .\tools\rs377-ladders\apply-falador-vertical.mjs --content 'C:\JoshRS-DEV\content' --apply
node --test .\tools\rs377-ladders\apply-falador-vertical.test.mjs
```

The tool refuses active `runtime/jparris-377` paths, refuses source/loc drift, creates a backup in the isolated clone, and is idempotent. Deployment still requires the owner's approved offline restart and backup.

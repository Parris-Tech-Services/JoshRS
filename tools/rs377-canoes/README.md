# Revision 377 — River Lum canoe station repair (14 Nov 2026)

## Actual report / root cause
A normal rev377 Java client screenshot shows Elrothiro clicking **Chop-down Canoe Station**, resulting in the default **Nothing interesting happens.** Engine-TS `Player.defaultOp()` prints that when no handler resolves.

The pinned 377 Content (`44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`) contains the map placements, all 15 canoe morph states, interfaces `canoeing.if` and `canoe_map.if`, and all varbits, but no server-side canoe interaction scripts. Unlike ordinary trees, canoe objects are **multilocs** and are dispatched as their *parent locs* by pinned Engine-TS `Player.getOpTrigger()`. A `[oploc1,canoestation_tree]` handler alone would therefore NOT repair the screenshot.

| Station | Parent loc ID | Map tile | Tutor |
| --- | --- | --- | --- |
| Lumbridge | 12163 | 3241,3235 | Barfy Bill |
| Champions Guild | 12164 | 3200,3341 | Tarquin |
| Barbarian Village | 12165 | 3110,3409 | Sigurd |
| Edgeville | 12166 | 3130,3508 | Hari |

## Changes provided
- `content-patches/rs377/scripts/skill_woodcutting/scripts/joshrs_canoes_377.rs2`: all four parent handlers; Woodcutting 12 and an accessible axe required to fell; 12/27/42/57 requirements for log/dugout/stable/waka canoe choices; level-gated native interface; 30/60/90/150 Woodcutting XP respectively; per-character morph state via existing 377 varbits; launch and destination choice; single-use reset; server-side range checking.
- The four ordinary River Lum stations are implemented as destination choices, but **landing tiles are candidate coordinates that require isolated collision and both-direction gameplay verification**; a native compile does not prove they are safe.
- Wilderness pond is deliberately disabled pending an independently verified one-way arrival and collision test. Never treat it as complete parity.
- `tools/rs377-canoes/install.mjs`: refuses the active family runtime and `JoshRS-Launcher`, existing overlays, conflicting handlers or mismatched native loc mappings. Dry-run by default; never starts/stops the server or touches DBs/saves.
- `tools/rs377-canoes/install.test.mjs` checks the guardrails and all four parent triggers.
- `.github/workflows/rs377-canoes.yml` runs unit guards and the **real pinned native RuneScript packer in an isolated GitHub Actions runner**. No private client/cache/save is uploaded.

## How to test safely
Do **not** put this overlay in your running `C:\JoshRS-Launcher\JoshRS-main` world. Make a fully separate copy of the pinned Content and Engine-TS outside the JoshRS-Launcher directory, with new temporary DB/profile and unused ports. Confirm no agent has modified the intended source files first.

From a current JoshRS repo clone, with a *disposable* Content directory:
```powershell
node .\tools\rs377-canoes\install.mjs --content "C:\JoshRS-DEV\content"
node --test .\tools\rs377-canoes\install.test.mjs
node .\tools\rs377-canoes\install.mjs --content "C:\JoshRS-DEV\content" --apply
```
Compile the **disposable** engine with `BUILD_SRC_DIR` pointing to that Content. Then test a disposable account at each of the four stations: no axe; Woodcutting 11/12; low-level canoe choices; axe handling; shape XP; floating; stage morph; travel one/two/three stops in both directions; safe landings; menu spoofing; two players' separate states; logout/relogin; quest and woodcutting regressions. Do not use Elrothiro or Sylvie as test accounts. Verify rollback and both real save checksums before any future live deployment.

## Acceptance status (verified on 14 November 2026)
- Native RuneScript 377 build and packing: **PASS** in isolated pinned engine/content.
- Guarded installer dry-run and apply: **PASS**, isolated checkout only.
- Genuine native 377 game world / client OPLOC1 packet tests: **4/4 PASS**. A newly created level-1 account stood on reachable land and interacted with each of the four parent canoe locs; the server responded `You need a Woodcutting level of 12 to make a canoe.` rather than `Nothing interesting happens.` See [successful workflow run 43557411417](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/43557411417).
- Actual **level-12 axe chop, shaping, floating, map-interface click, travel landing and return journeys:** **NOT YET IN-GAME TESTED**. Source compiles, but this must not be called complete gameplay parity.
- **JParrisDesktop production install and real Elrothiro interaction:** **NOT PERFORMED**.
- **Wilderness leg:** deliberately blocked until safe arrival and one-way travel are verified.

Do not report **VERIFIED COMPLETE** until all gates pass and a single runtime owner authorises a backed-up offline installation with actual player-visible checks. This patch must not be described as fully playable solely because it exists on GitHub.

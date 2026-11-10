# Sinclair Mansion / Fremennik river crossing — revision 377

## User report (10 November 2026)

Screenshot shows Elrothiro near a river north of Camelot and a protruding timber/log structure; clicking at the presumed crossing does not take the character across. Exact player tile, clicked object ID, and interaction opcode are **not supplied**. Screenshot alone is insufficient to prove a specific map loc.

**Candidate:** Sinclair Mansion to Fremennik Province **level-48 Agility log balance**. Independent historical source says this shortcut was released **6 September 2005** and requires 48 Agility. Modern OSRS uses **loc IDs 16540, 16541 and 16542**, but those IDs must **NOT be substituted directly into the 377 revision** without checking cache/version compatibility.

- Historical/modern reference: https://oldschool.runescape.wiki/w/Log_balance_%28Fremennik_Province%29
- Region reference: https://oldschool.runescape.wiki/w/Sinclair_Mansion
- [JoshRS no-interruption interaction issue #293](https://github.com/Parris-Tech-Services/JoshRS/issues/293)

## Pinned Lost City 377 evidence

- Pinned Content: `377-wip@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`
- `pack/loc.pack` ends at loc ID **14973**; OSRS IDs 16540–16542 are absent.
- `scripts/skill_agility/scripts/shortcuts.rs2` implements the **level-20 Coal Trucks log balance** under `[oploc1,loc_2296]`, but has no Sinclair/Fremennik route handler.
- `maps/m42_55.jm2`, `m42_56.jm2`, `m43_55.jm2` and `m43_56.jm2` contain the adjacent terrain/loc records. Do not confuse a terrain overlay with a walkable bridge; inspect the exact crossing and collision map first.
- Screenshot chat reads “Nothing interesting happens”, which is also the normal `Player.defaultOp()` response to a missing action handler. It doesn't identify the target object or prove that it was the bridge click.

## Run the read-only evidence check

On JParrisDesktop or a disposable environment where the content exists (use a path that is actually present):

```powershell
node .\tools\rs377-bridge\inspect-sinclair.mjs --content "C:\JoshRS-DEV\content"
node --test .\tools\rs377-bridge\inspect-sinclair.test.mjs
```

Tool only reads `pack/loc.pack`, four text JM2 map files and `shortcuts.rs2`. It does not touch a game process, saves, SQLite, caches, packs or the world. It prints candidate log/bridge loc types and IDs in the regional map.

## Exact repair acceptance — not yet implemented

1. Identify the clicked object's **native 377 loc type/ID** and exact world (x,z,plane), first on a disposable copy or through read-only existing telemetry. If the visible crossing is only scenery or no native loc exists, record that as a **missing cache/map asset** issue.
2. Establish both banks' safe landing coordinates from the **native revision-377 map** and collision data; do not guess a player teleport across water.
3. If the existing 377 cache has a suitable walkable log/bridge model, implement a scoped `[oploc1,<native loc>]` Walk-across interaction with **Agility 48** and both directions using supported animation and correct scene/collision. If not, implement a version-compatible original crossing asset in a separate project with proper permissions. Do not copy modern OSRS cache blobs into public GitHub.
4. Test low Agility (47), sufficient Agility (48), east/west or north/south crossings, boundaries, replay, interruption, concurrent clients, safe fail/no fall-through, and logout/relogin. An implemented script or compile alone is not gameplay evidence.
5. After independently verified tests, propose an owner-approved maintenance window with offline backup. **Do not touch active Elrothiro/Sylvie production runtime** while they're playing.

**Status:** Root-cause investigation and read-only tooling; actual river crossing is **NOT fixed**. No gameplay repair claimed.

## Native 377 crossing identified (10 Nov 2026)

The scanner originally only inspected level 0, which missed the actual log balance. The updated inspector resolves display names from `scripts/_unpack/377/all.loc` and inspects every plane.

Pinned 377 data contains:

| Loc | Display | World tile | Plane | Model | Option |
| --- | --- | --- | --- | --- | --- |
| 9324 | Log balance | 2722, 3593 | **1** | loc_2291 | Walk-across |
| 9323 | Log balance | 2722, 3594 | **1** | loc_2292 | Walk-across |
| 9322 | Log balance | 2722, 3595 | **1** | loc_2293 | Walk-across |

The bridge deck is also on plane 1: `/maps/m42_56.jm2` has only `x=2722..2723, z=3592..3597` as `h7 o42 f3` level-1 tiles. The adjacent level-0 banks are:

- west bank candidate: `(2718..2721, 3594, plane 0)`
- east bank candidate: `(2724..2727, 3594, plane 0)`

There is **no level-1 bank approach** in the region, and no level-0 Walk-across loc on either bank. `scripts/skill_agility/scripts/shortcuts.rs2` has no handler for 9322/9323/9324. Therefore a script-only fix cannot make the object clickable from the bank: `OpLocHandler` looks up the loc at `player.level`, and the native log only exists on level 1.

This is now a **map-plane/content defect**, not just a missing handler. A safe repair must either:

1. Move the three log locs and the six bridge-deck tiles to level 0 and add a 48-Agility two-way handler, or
2. Add separate authorised level-0 bank interaction locs and a script that moves the player onto the existing level-1 bridge and back down.

Neither was applied. Both need an isolated map rebuild, collision/two-way gameplay tests at 47 vs 48 Agility, and owner approval. Do not substitute modern OSRS IDs 16540–16542.

Run:

```powershell
node .\tools\rs377-bridge\inspect-sinclair.mjs --content "C:\JoshRS-DEV\content"
```

The JSON now includes `logBalanceObjects`, `planeSummary`, and `candidateNamedShortcuts`.


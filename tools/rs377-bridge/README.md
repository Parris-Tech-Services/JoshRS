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

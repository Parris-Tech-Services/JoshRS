# JoshRS 377 map ZIP bridge — tested, non-destructive staging

This tool reads existing pre-OSRS compressed `number.gz` terrain/scene pairs, uses the **active 377** `content/pack/map.pack` to resolve their actual world squares, audits every tile against `flo.pack` and location against `loc.pack`, and generates **staged** human-readable Lost City `.jm2` sources. It **never** changes the server's real map files, client caches, player data or the active world.

## Actual user-provided samples, audited 30 October 2026

| Supplied package | Map index pair | Resolved area | Terrain records | Location entries | Missing ID instances | Trailing object bytes |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `Yanille_Custom.zip` | 796 / 797 | `m40_48` | 5,686 | 465 | 256 (16 distinct IDs) | 7 |
| `edgeville_modified_trees.zip` | 624 / 625 | `m48_54` | 5,724 | 2,958 | 266 (39 distinct IDs) | 741 |

**Both packages are currently NOT SAFE TO INSTALL**. Their location streams contain IDs outside the recorded revision-377 definitions, plus trailing bytes unhandled by the basic historical cache decoder. Placing them directly into cache index 4 would also leave the server's collision and content sources inconsistent. Do not copy the staged output over `content/maps`.

Sample location ID ranges were validated against the same Google Drive snapshot's `loc.pack` (14974 definitions, maximum ID 14973). These statistics are not proof of compatibility with any newer, unsynced Windows source.

## Windows one-command audit

1. Obtain updated `JoshRS` main on JParris Desktop, preserving `runtime/jparris-377` and `active.json`.
2. Keep `Yanille_Custom.zip` and/or `edgeville_modified_trees.zip` in a local directory. Do not run any included `.jar` executables.
3. Open PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\JoshRS-Launcher\JoshRS-main\tools\rs377-map-bridge\Run-MapAudit.ps1" -YanilleZip "C:\Downloads\Yanille_Custom.zip" -EdgevilleZip "C:\Downloads\edgeville_modified_trees.zip"
```

Replace ZIP paths with the files' actual locations. The wrapper reads `active.json` to find the **active** personalised content folder, rather than guessing. Reports and staged maps go in a timestamped new `runtime/jparris-377/map-audit-...` folder. It does **not** stop the world or install anything.

## Direct CLI for Agy / GitHub runners

Unzip each supplied package into a separate folder, keeping its two `.gz` files together (ignore any executable JAR). With Node.js 20+:

```bash
node tools/rs377-map-bridge/audit-and-stage.mjs /path/to/active/content /path/to/extracted_gz /tmp/audit-report.json /tmp/staged-maps
```

Outputs: `m40_48.jm2` or `m48_54.jm2` source and JSON blockers. No overwrite on existing report or staged JM2. Run each package with a new report and staging folder.

## Next required engineering steps

1. Compare the full converted map against the **actual** host's `content/maps/m40_48.jm2` / `m48_54.jm2` and the client-cache definitions. Preserve the untouched baseline.
2. Identify each unsupported location by appearance/model/role from its source archive; explicitly map it to a valid existing 377 object with equivalent size/collision **or create an authorised original 377 model, loc config and named pack entry**. Never map by numeric guess or silently discard unknown objects.
3. Investigate unparsed 7 and 741 byte trailers and confirm whether the source variant uses extra data or unsupported encoding before declaring the object map valid.
4. Determine which changes are actually wanted. Treat Yanille/Edgeville ZIPs as **replacements of existing regions**, not new landmasses. Use a delta merge with baseline source instead of overwriting all original terrain/objects.
5. Rebuild server/client source packs and collision **in a disposable runtime** with the matching 377-wip engine and client; test all player traversal, ladders, banks, doors, NPCs, logout/restart, multiple players and no missing models.
6. Preserve Elrothiro and Luna saves and original assets; promote verified change with explicit rollback. No Jagex-derived cache assets should be added to the public JoshRS repository without proper redistribution rights.

## Uploaded image/map viewers
- `rsmap-10february09.jpg`, `wildumap.jpg`, `5thage_religion.png`, `World_map_view.webp`, `osrs_world_map.jpg`: **visual map overlays only**, no tile/object sources. A 377 Java world-map UI adaptation needs pixel-to-world calibration, view dimensions and support in customised Java client. Importing the image does not create terrain or NPCs.
- `rs-map-viewer-master.zip`: an independent BSD-2-Clause 3D cache viewer. Useful for analysis, but it uses a separate OSRS cache/rendering stack; not directly a 377 client plugin.
- `runescape-worldmap-master.zip`: MIT code/styling resources for a *real-world MapTiler map* with RuneScape-themed icons (icons themselves Jagex-owned), **not** game-world content.

This folder contains original bridge tooling only. Actual user-supplied 3D maps and proprietary images remain out of the public repository. No in-game install or live test is claimed.

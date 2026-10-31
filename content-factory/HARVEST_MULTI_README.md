# JoshRS metadata-only multi-source harvester

This adds **metadata discovery and review**, not an automatic game-content installer. It **never** downloads Jagex cache files, copies NPC dialogue, alters the personalised runtime, edits `Player.ts`/quest scripts, or changes saves and account data.

## Run

```bash
cd content-factory
python3 harvest_multi.py --source lostcity-content-377 --source openrs2-377 --output /tmp/joshrs-source-metadata
python3 harvest_multi.py --source 2009scape-gitlab --source 2009scape-hf --output /tmp/joshrs-source-metadata
python3 -m unittest discover -s tests -p 'test_harvest_multi.py' -v
```

Omitting `--source` scans all entries in `content-factory/sources.json` plus the three non-GitHub adapters; this may use many read-only API calls. State is stored in `state.json` for GitHub rotating batches and GitLab page continuation. The output `catalog.json` contains path metadata only; all candidates are **rights uncleared, not installed and not play-tested**. Run only against public APIs; endpoints are fixed and redirects blocked. No API keys, paid services or unsandboxed executable downloads are required.

The optional `--drive-manifest /path/to/private.json` accepts a local user-authorised `{"schema":1,"files":[{"kind":"script"}]}` summary. It returns **aggregate category counts**, never Drive IDs, private paths or file contents; it is **not** a live Drive OAuth connector. Keep the manifest outside the public repository. The connected Drive copy and actual Windows source must be compared privately by the authorised operator before any gap is called confirmed.

## Integration / acceptance

The existing `factory.py` and `sources.json` remain the authoritative GitHub baseline and content queue. These new source adapters expand metadata coverage; they do not change the existing original-NPC overlay approval gate. For a candidate, Agent 1 must prove an exact rev377 NPC/loc/quest script mapping and fix a confirmed gap in an isolated checkout. The native 377 compiler and existing tests must pass. Agent 4 reviews evidence and Agent 3 takes a consistent offline backup before any controlled Java-client in-game acceptance, followed by logout/relogin verification. Only that can be called **VERIFIED PLAYABLE**.

For the repeated `Hello adventurer` regression, first compare active and pinned script packs and `opnpc1`/category dispatch, including morph resolution. Do not mass-apply unique dialogue over functioning quest scripts. Map bridge `Yanille_Custom.zip` and `edgeville_modified_trees.zip` remain quarantined because of unsupported location IDs and trailing data.

This tool's code and fixtures are independently written; upstream Jagex text, models, music, maps, caches and copyrighted binaries are excluded. Jagex's fan-content permission does not authorise private game servers or derivative game software. No claim of game-server distribution rights is made.
# Critical: `~/dev274` has never actually packed

**Discovered:** 10 November, by running the playtest harness (PR #337) for the first time.

## What happened

The harness logged in, teleported to `3210,3219,1` (Lumbridge Castle first floor) and reported nearby
NPCs:

```
FAIL  3 expectNpcNear {"npc":"lost_tribe_sigmund","radius":5}
    not within 5; nearby: man@3206,3219 duke_of_lumbridge@3212,3220
```

Sigmund was absent even though the data was correct:

```
pack/npc.pack         1500:2079=lost_tribe_sigmund
maps/m50_50.jm2       1 9 19: 2079
_unpack/274/all.npc   [lost_tribe_sigmund]
```

## Root cause

`data/config/world.json` has `build.startup: false`, and `data/pack/main_file_cache.idx4` was still
dated **Nov 9 22:50** — before any of the porting. The engine was serving a **pre-existing packed
cache**, not the content on disk.

Every "repacked → World ready" in this project's dev-world reports was therefore measured against a
cache that never contained the ported maps, NPCs or quests.

## The packer disagrees, and keeps disagreeing

`npm run build` fails immediately on the ported content:

```
Error during packing - [cooking_generic_swan_fresh_monkfish]
Data invalid in row, double-check the reference exists: data=cooked,swan_monkfish
```

`swan_monkfish` exists upstream as obj id 7943 but was absent from dev. Importing the five obj and one
loc symbols that ported configs reference cleared that error, and the next one appeared:

```
Error during parsing - ../content/scripts/_unpack/274/all.loc:3115
Invalid property value: anim=m_pyre_glow
```

## What this means

The ported content is **not packable as it stands**. It has a chain of dependencies beyond maps and
NPCs — items, locations, animations — that no audit in this project checked, because every audit read
the content files rather than the packed result.

Consequences, stated plainly:

- **The dev world has never run the ported content.** Not the maps, not the NPCs, not the quests.
- Earlier claims of the form "restored in dev274" mean "written to dev274's content directory",
  nothing more.
- The playtest harness itself is **working**: it logged in, teleported, listed NPCs, and would have
  caught this on its first scenario step. It is the first tool here that measures the running world.

## The correct loop, from now on

```
edit content → npm run build (must exit 0) → run.ts <scenario> → PASS/FAIL
```

`World ready` from `src/app.ts` is **not** evidence that content packed. It only means the server
started against whatever cache already existed.

## Next steps, in order

1. Make the packer exit 0 on the ported content: chase the missing-definition chain (items → locations
   → animations → …), importing each from the pinned 377 source with ids preserved.
2. Re-run `npm run build` until it is clean, **then** re-run the map/NPC/quest audits — their results
   will change, because they have been describing files, not the world.
3. Only then does the Lost Tribe scenario mean anything.

Until step 1 is done, no statement about dev274's contents being "in the world" is trustworthy.

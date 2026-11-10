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

---

## The dependency chain ends at cache data that does not exist in 274

Automating the chase (`tools/questops/fix-pack-deps.py`: parse the packer error, import the symbol
under its original 377 id, retry) cleared two layers and then hit a wall:

```
all.loc  -> Invalid property value: anim=m_pyre_glow      (a seq)
all.seq  -> Invalid property value: frame1=anim_10198     (an animation)
```

`m_pyre_glow` was imported from 377 and immediately demanded `anim_10198`–`anim_10202`.

| registry | revision 274 (dev) | revision 377 (source) |
|---|---|---|
| `anim.pack` entries | **10,100** | **33,568** |

Those animations are **not in the 274 cache**. Animations and models live in the packed config cache
(`idx0`/`idx1`), not in content files, so they cannot be "ported" by copying a script definition — and
they are Jagex assets that must never be committed to this repository.

### What this means, precisely

- Maps, NPC/loc/obj **definitions** and quest scripts can be ported as text.
- **Animations, models and other cache assets cannot** be ported the same way. The target cache either
  contains them or it does not.
- Therefore any ported quest whose scenery or NPCs use 2005-era animations **cannot pack against a 274
  cache**, however correct its scripts are.

This is an architectural limit of "port 377 content into a 274 world", not a bug to grind through. It
would need either the 377 cache data present locally (and never committed), or a decision to run the
ported content on a 377 cache instead.

### Where that leaves the harness loop

```
edit content → npm run build (MUST exit 0) → run.ts <scenario> → PASS/FAIL
```

The first gate currently fails for reasons outside the content's control. Until the cache question is
answered, **no scenario result for these quests can be produced**, and no quest can progress past
BLOCKED.

---

## Measured: the cache gap is models, and it is small in bytes but absolute in content

| file | dev274 (`~/dev274/engine/data/pack`) | rev-377 (`~/js377/engine/data/pack`) |
|---|---|---|
| `main_file_cache.idx0` | 54 B | 54 B |
| `main_file_cache.idx1` (**models**) | **27,702 B** | **89,562 B** |
| `main_file_cache.idx4` (maps/configs) | 6,048 B | 8,340 B |

`idx0` is a placeholder in both, so configs live in the world database, not the cache. The material gap
is **`idx1`: models**. The 274 cache simply does not contain the models the 2005 scenery and NPCs use,
which is why the packer kept asking for animations that resolve through model data.

Copying `idx1` across is not a safe fix: model ids are numeric and the 274 content references its own
numbering, so a straight copy would silently repoint existing 274 objects at 377 models — the same
class of identity failure as the map ids, but with no manifest to bound it.

## Decision required

This is a fork, not a task:

- **A. Run the ported content on a 377 cache** — what the other agents concluded weeks ago
  ("ported 2005-06 quests compile natively on 377, not 274"). Evidence gathered here independently
  agrees: the content packs on 377 and cannot pack on 274.
- **B. Bring 377 cache assets into a 274 world** — possible only with a full id-translation pass over
  models as well as maps, and with the assets present locally and never committed.

Option A is cheap and already half-done elsewhere. Option B is what the last six rounds were
implicitly attempting, and the measurements above are the first honest evidence of its cost.

**Nothing below this line is verified in a running world, and no quest is SCRIPT-VERIFIED or
VERIFIED PLAYABLE.**

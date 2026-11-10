# dev274 build: now fails at script compilation, in STOCK area scripts

**Correction to `274_CONTENT_CANNOT_REBUILD.md`.** I claimed the stock 274 content could not be
rebuilt because `legends_lamp.if` had no interface id. **That was wrong** — `legends_lamp.if` and
`legends_lamp.rs2` were added by **my own patch** (`content-patches/rs274/patches/quest_legends_reward.patch`)
without registering interface ids. Registering 43 ids (file + components, 377 numbering) plus
`interface.order` entries cleared it. The defect was mine, not stock.

Machine: Android SM-A556E (Termux). Worlds: `~/lc274` live (200 OK, untouched), `~/dev274` sandbox,
`~/js377` experimental. Save `/data/data/com.termux/files/home/lc274/engine/data/players/main/elrothiro.sav`
858 bytes, untouched.

## Sandbox progress, in order

| Blocker cleared | How |
|---|---|
| 377-only keys `multivar`/`multiloc`/`multinpc` | stripped per definition |
| duplicate npc names/ids (91 vs 3852) | deduped, stock id kept |
| varbit with `basevar=-1` (parked quest) | 11 stale varbits pruned |
| cosmetic sound params | 207 `param=` lines stripped |
| 18 journal components + 11 unreachable handlers | registered / removed |
| `legends_lamp` interface (my patch) | 43 ids registered in pack + order |
| `scripts/_test` (377 debug cheats) | excluded |

## Where it now stops

```
scripts/areas/area_seers/scripts/hemenster/bonzo.rs2:40:61: ERROR: Operator '=' cannot be applied to 'int', 'boolean'.
scripts/areas/area_varrock/scripts/gertrude.rs2:77:159: ERROR: Type mismatch: 'int' was given but 'obj' was expected.
```

These are **stock 274 area scripts**, not ported content, and they are the first script errors reached
(after config/pack phases passed).

## Two candidate causes — not yet distinguished

1. **Engine/content version mismatch**: this engine checkout may not be the engine the content was
   built with. The live world serves a cache packed 9 Nov with `build.startup=false`, so it has never
   compiled this content here.
2. **Sandbox damage from this session**: the pack edits (dedupe, stripping) could have changed symbol
   resolution for these scripts.

**The decisive test is a control build with pristine `~/lc274/content` against the same engine.** That
has not been run, so neither cause is claimed.

## Status

`npm run build` **fails** · 0 SCRIPT-VERIFIED · 0 VERIFIED PLAYABLE · live world untouched.

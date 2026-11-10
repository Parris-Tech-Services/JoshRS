# Finding: the stock rev-274 content cannot be rebuilt as it stands

Machine: **Android SM-A556E (Termux)**. Worlds visible here: `~/lc274` (live, 200 OK, untouched),
`~/dev274` (sandbox), `~/js377` (experimental).
Save: `/data/data/com.termux/files/home/lc274/engine/data/players/main/elrothiro.sav` — 858 bytes, untouched.

## The evidence

Both the live world and the sandbox contain:

```
content/scripts/quests/quest_legends/interfaces/legends_lamp.if     exists
content/pack/interface.pack                                         contains "=legends_lamp" → 0 matches
```

`tools/pack/interface/PackShared.ts:197` throws `Could not find name <-> ID for interface file` when an
`.if` file has no id. So `npm run build` **cannot succeed on unmodified 274 content** in either world.

The live world serves a cache packed on **9 Nov 22:50**, before this state existed. `build.startup` is
`false`, so the engine never re-packs: it has been running that stale cache all along. That is also why
every earlier "World ready" proved nothing.

## What this means

- **The 274 import sandbox cannot be made to pack without first repairing stock content** (interface ids
  for files that have none).
- The live world is unaffected *today* because it serves the old cache, but **any future restart that
  packs would fail** the same way.
- This is a pre-existing defect, not damage from this session. I verified both worlds show the same gap.

## Progress made in the sandbox this round

| Blocker | Resolution |
|---|---|
| 377-only keys (`multivar`/`multiloc`/`multinpc`) | stripped per definition |
| duplicate NPC ids/names in `npc.pack` (91 vs 3852) | deduped, stock id kept |
| stale varbits with `basevar=-1` (parked quest) | 11 pruned from `varbit.pack` |
| cosmetic sound params (`attack_sound`/`defend_sound`/`death_sound`) | 207 lines stripped |
| 18 journal components registered | `interface.pack` + `interface.order` |
| 11 unreachable journal handlers | removed from quest scripts |

Build now reaches **script compilation**, i.e. past the config/pack phases, and fails on
`legends_lamp:*` — the stock defect above.

## Honest status

| | |
|---|---|
| `npm run build` | **fails** — on stock content defect, not on the port |
| SCRIPT-VERIFIED quests | 0 |
| Live world | 200 OK, cache from 9 Nov, untouched |

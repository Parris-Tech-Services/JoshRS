# dev274 import sandbox — exact state after this session's build work

Machine: **Android SM-A556E (Termux)**. This document describes only this device.
Worlds here: `~/lc274` (live browser world, 200 OK via 10.8.0.1:8888, 4 engine pids, **do not touch**),
`~/dev274` (this sandbox, **does not pack**), `~/js377` (experimental 377, 2 player saves).
Windows (JPARRISDESKTOP) and Fedora environments are **not visible from this machine**.

Save: `/data/data/com.termux/files/home/lc274/engine/data/players/main/elrothiro.sav` — 858 bytes,
mtime 15:11, untouched throughout.

## What was fixed in the sandbox this round

| Blocker | Resolution |
|---|---|
| `multivar`/`multiloc`/`multinpc` keys (377-only) | stripped per definition via `prepack-check --strip-keys` |
| duplicate config `lost_tribe_sigmund_there` | deduped within `_unpack/274/all.npc` (1 removed) |
| `param=attack_sound/defend_sound/death_sound` (cosmetic, cache-only) | 125 lines stripped from `all.npc` |
| `questlist:*` components missing from `interface.pack` | registered (18 entries) |
| `questlist:*` ids missing from `interface.order` | appended as numeric ids |
| `legends_lamp` interface file had no id | registered file-level id |

Build advanced from `Invalid property key: multivar=handsand_coffee_multi` to:

```
Cannot read properties of undefined (reading 'type')
```

## Where it now stops — and why I stopped

That error is a **packer crash, not a validation message**, and it appeared after I appended
file-level ids to `pack/interface.order`. The likely cause is that `interface.order` expects *component*
ids for file entries, not the file id itself, and my append desynchronised it.

I stopped rather than continue guessing: the last time I edited pack files by inference I removed 4,292
lines from `all.loc` and had to restore from the pristine world.

## PARKED quests (moved to `~/parked_quests`)

`quest_golem` (32 missing models), `quest_troll_love` (26 missing models) — interactive models 274 lacks.

## Honest status

| | |
|---|---|
| `npm run build` | **fails** (packer crash above) |
| SCRIPT-VERIFIED quests | **0** |
| VERIFIED PLAYABLE | **0** |
| Live world | untouched, 200 |
| Elrothiro save | untouched, 858 bytes |

## Next concrete step for whoever continues

Restore `pack/interface.order` from `~/lc274/content/pack/interface.order` (pristine), then register
interface ids **the way the packer expects** — read `tools/pack/interface/PackClient.ts` to see whether
order holds component ids, file ids, or both, and add a unit test for one ported interface before
touching the real file.

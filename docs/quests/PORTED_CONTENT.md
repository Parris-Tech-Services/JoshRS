# Ported quest content — what is in the live world, and how to recreate it

The rev-274 world at `~/lc274` contains **26 quest directories ported from the rev-377 content**,
plus four local content fixes. None of that content is duplicated into this repository; this file
records exactly what was copied, from where, and what was refused, so the world can be rebuilt
byte-for-byte without vendoring Jagex-derived quest text into a public repo.

## Source

| | |
|---|---|
| Repository | `LostCityRS/Content` |
| Branch | `377-wip` |
| **Commit** | **`44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`** |
| Same pin as | `deploy/jparris-windows/upstreams.json` → `content.commit` |

The ported scripts therefore come from the same upstream commit this project already pins, not from
an arbitrary working copy.

## Ported directories (26)

```
quest_agrith        quest_deal          quest_dwarfrock     quest_elid
quest_fenkenstrain  quest_feud          quest_forget        quest_garden
quest_giantdwarf    quest_golem         quest_handsand      quest_hauntedmine
quest_ics           quest_losttribe     quest_makinghistory quest_mdaughter
quest_myreque       quest_osf           quest_rag           quest_soulbane
quest_swansong      quest_tog           quest_troll_love    quest_twocats
quest_wanted        quest_zogre
```

Recreate with:

```bash
git clone --depth 1 --branch 377-wip https://github.com/LostCityRS/Content.git /tmp/c377
git -C /tmp/c377 fetch --depth 1 origin 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50
git -C /tmp/c377 checkout --detach 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50
tools/questops/port-377-quests.sh /tmp/c377 "$HOME/lc274"
```

The script is idempotent and refuses anything unsafe, so re-running it changes nothing.

## Refused, and why

| Directory | Reason |
|---|---|
| `quest_100` | packs, but contains **no `send_quest_complete`** — cannot be finished |
| `quest_fever` | same |
| `quest_mm` | same |
| `quest_mourning2` | same |
| `quest_rd` | same |
| `quest_mortton` | **274 already has a local version with fixes**; a copy would overwrite them |

Their source work is not lost: it remains in the upstream checkout at the pin above. If any is made
completable later, adding it is a one-line change to the script's `REFUSED` list.

## Effect, measured on the live world

| | before port | after port |
|---|---|---|
| quest directories | 64 | **90** |
| owner's sheet targets present | 62 | **72 of 88** |
| absent | 26 | **16** |
| `check-completion-paths` failures | 0 | **0** |
| structurally complete | 63 | **66** |

Structural completeness barely moved relative to the increase: many ported quests bring scripts but
**not journals or varps**, so 24 of the 90 fail the structural audit. That is the next work item.

## The caveat that must travel with this

**Packing is not playing.** A ported quest may reference NPCs, items, objects or maps that exist in
377 but not in 274. The engine packed all 90 directories and reached `World ready`, which proves
syntax and symbol syntax only.

**Every ported quest is unplayed.** None has been completed, and no ported quest's NPCs have been
confirmed present in the 274 world.

## Local content fixes (not ports)

Four edits carried in the world, all captured as patches in `content-patches/rs274/patches/`:

- `quest_legends_reward.patch` — four 7,650 XP lamps
- `quest_seaslug_fishing_xp.patch` — 7,175 Fishing XP
- `quest_sheep_spin_bonus.patch` — +50 spin bonus (also touches `skill_crafting/.../spinning.rs2`)

Player saves are **not** content: `~/lc274/engine/data/players/main/elrothiro.sav` (858 bytes) is
untouched, and a dated copy is kept in `~/saves-backup/`.

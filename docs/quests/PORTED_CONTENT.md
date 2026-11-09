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

## The real remaining gap: 377-only stage variables (corrected)

> **Correction.** An earlier version of this section said nine ported quests failed on `JOURNAL`
> and blamed a missing component in `questlist.if`. **That was wrong.** My parser of the audit
> table mis-aligned the columns. The actual flags are `VARP` and `WIRED`, and the journal
> components were never the problem.

Nine ported quests fail the structural audit:

```
quest_elid  quest_feud  quest_handsand  quest_ics  quest_losttribe
quest_makinghistory  quest_rag  quest_soulbane  quest_troll_love
```

### `WIRED` is a false negative

My wiring heuristic looks for references to a quest's varp or labels **outside the quest's own
directory**. These quests keep their NPC scripts inside their own directory, so nothing external
references them and the check reports "not wired" even though the content is self-contained.

Confirmed for `quest_feud`: it has `feud_journal.rs2` and two `questlist:` references, and its
journal handlers exist. The flag is a limitation of the audit, not a defect in the content.

### `VARP` is real, and it is the blocker

`quest_feud` uses `%main_feud_var` and `%feud_var_multi`. Both are defined in
`js377/content/scripts/_unpack/377/all.varp` and **not** in the 274 registry:

```
main_feud_var    in 377 registry: yes    in 274: no
feud_var_multi   in 377 registry: yes    in 274: no
```

Without those definitions the quest's stage cannot persist — it would run and forget itself.

### Why appending them is not a one-line fix

The obvious fix is to append the missing definitions to `scripts/_unpack/274/all.varp`. That file is
**not the registry**: it contains only **5 entries**, and it is an override layer. The real varp
definitions live in the packed 274 cache (`main_file_cache.idx0`).

So adding a varp means allocating a **numeric id inside a packed config**, not appending a name to a
list. Varp ids are positional, so a careless insert would silently renumber every varp after it and
corrupt existing player saves — the exact class of change this project forbids.

That is why this is left open rather than guessed at. The work needs the packing toolchain
(`tools/pack`), a confirmed free id range, and a save-migration check.

## What this means for the nine quests

They **pack and load**, and their journals may well display, but their progress cannot be trusted to
persist until their varps exist. They should be treated as **demonstration content, not playable
quests**, until the varp work is done.


# Port status — 10 November 2026 (authoritative)

Supersedes the scattered per-round notes. Status words are used strictly:
**BLOCKED** = does not pack · **PARKED** = needs a model/command 274 lacks ·
**SCRIPT-VERIFIED** = build + static + layer 1 + layer 3 pass · **VERIFIED PLAYABLE** = Josh played it.

## Headline

| | |
|---|---|
| Ported quests | 26 |
| **VERIFIED PLAYABLE** | **0** |
| **SCRIPT-VERIFIED** | **0** |
| **PARKED** | **1** (`quest_golem` — `golem_demon_portal` has no 274 models) |
| BLOCKED | 25 (the content tree does not pack) |

`npm run build` on `~/dev274` **fails**. That single fact governs everything below.

## VERIFIED COMPLETE (evidence committed)

| Item | Evidence |
|---|---|
| Map referential integrity, manifest-scoped | 0 dangling / 0 mismatch / 0 unresolved across 194 imported maps |
| Cross-registry varp collisions repaired | `repair-cross-registry-varps.py`; 56 → 0 |
| Quest stage vars are `scope=perm` | 26/26 detected by search, 0 non-permanent |
| Quest-points gap identified | 24 of 26 quests absent from `count_questpoints` |
| Persistence of a stock stage var | `persist-check.ts`: `cookquest` before=7 after=7 |
| Model gaps measured | `quest_golem` 32, `quest_troll_love` 26; other 24 model-complete |
| Self-check tooling | three layers merged; 65 tests pass |
| Save discipline | Elrothiro save `~/lc274/engine/data/players/main/elrothiro.sav` 858 bytes, untouched throughout |

## PARTIALLY COMPLETE

| Item | State |
|---|---|
| Import of ported definitions | 10,874 broken references → **102** remaining |
| Duplicate definitions | 197 → **1** |
| Script problems | 70 → **3** |
| 377-only config keys (`multivar`/`multinpc`/`multiloc`/`ldmodel`) | stripped from imported NPCs; need per-definition translation, not deletion |
| Lost Tribe | content present, scenario not run |
| Visual client verification | pipeline works to login + in-game UI; never run for a quest |

## BLOCKED

| Item | Reason |
|---|---|
| Any quest packing | build fails: undefined constants (e.g. `^slayer_dwarf`), missing procs (`music_playbyregionplane`, `openshop_fortunato`) |
| Quarantine (enabled-quest list) | not implemented; one bad quest stops the world |
| Layer 1/3 scenarios | cannot run without a packed world |
| Promotion to live `lc274` | never attempted; needs Josh's approval and a packed world |

## Incidents recorded this session

- Conflict markers committed to `main` once (fixed, `8d52172`)
- 4,292 lines removed from `all.loc` by an error-string-driven loop; recovered byte-identical from the live world
- A shell-inline backtick redirect attempted the Elrothiro save path (failed, save untouched, mtime unchanged)

## Next step, unambiguously

1. Teach `prepack-check.mjs --apply` to **translate** 377-only keys rather than import or delete them.
2. Implement the enabled-quest quarantine list so one broken quest cannot block the world.
3. Drive `npm run build` to exit 0 on the base world, then The Lost Tribe alone.
4. Only then: `run.ts` scenario → `client-check` → first SCRIPT-VERIFIED quest.

World: `~/dev274` · Save: `~/lc274/engine/data/players/main/elrothiro.sav` (858 bytes, untouched) ·
Live: `http://10.8.0.1:8888/rs2.cgi` (200, never restarted by this session's final rounds).

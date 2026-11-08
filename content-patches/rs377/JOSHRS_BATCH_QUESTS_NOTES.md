# JoshRS 377 batch quest bundles — port notes (2026-11-08)

Second content batch after Fenkenstrain (see `JOSHRS_FENKENSTRAIN_NOTES.md`). Ports the
eight uncompiled quest bundles from branch `quests/377-claude-20261108`
(`deploy/jparris-windows/quests377/`) into the proven `content-patches/rs377/` overlay
pattern, and proves them with a real engine compile + boot smoke, locally and in CI.

## What was added

| Folder | Quest | State |
|---|---|---|
| quest_rag | Rag and Bone Man | most complete of the batch (bone tables, pot boiler) |
| quest_soulbane | A Soul's Bane | four trials + Tolna shades |
| quest_swansong | Swan Song | combat stages; fishing/cooking hooks still missing |
| quest_myreque | In Search of the Myreque | routequest stages; Burgh/Canifis scenes missing |
| quest_ics | Icthlarin's Little Helper | priest kill + stages; item sources missing |
| quest_mdaughter | Mountain Daughter | bear/Kendal kill; puzzles missing |
| quest_hauntedmine | Haunted Mine | boss ghost + reward key; start NPC/carts/lift missing |
| quest_losttribe | The Lost Tribe | stage chain |

Stage values are JoshRS-original reconstructions, not verified against the original game.
Known content gaps are listed in each bundle README (kept in the quest folders).

## Patch chain (apply in numeric order on the pinned content pin)

Pinned: LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50 (377-wip),
Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb.

- `0001`–`0005` — Fenkenstrain (unchanged from the merged PR #136).
- `0006-batch-quest-varps-permanent.patch` — adds `scope=perm` to the existing
  all.varp blocks `[hauntedmine] [routequest] [mdaughter_var] [lost_tribe] [soulbane]
  [swansong_quest]` and deletes the placeholder blocks `[varp_713] [varp_715]
  [varp_717] [varp_724]` (all.varp is last-line sensitive; 724 has no trailing newline).
- `0007-register-batch-quests.patch` — 8 QP blocks + 8 `send_quest_progress_colour`
  lines in `scripts/general/scripts/quests.rs2`. Anchored on the post-0001 state:
  **must be applied after 0001** (apply --check on a pristine tree fails otherwise).
- `0008-batch-claim-placeholder-varp-ids.patch` — renames in `pack/varp.pack`:
  713=soulbane_mask, 715=rag_bones_a, 717=rag_bones_b, 724=ics_little_stage.
  NOT 719 (used as basevar by four varbits in all.varbit). Renaming (not appending)
  keeps client varp.dat byte-identical, so the BUILD_VERIFY CRC check (-1587312319)
  still passes.

An earlier approach (`0008-batch-new-varp-pack-ids.patch`, appended new ids) broke the
CRC and was deleted. Quest-owned varps (`fenk_*`, `ics_little_stage`, `rag_bones_*`,
`soulbane_mask`) live in each quest folder's `configs/*.varp` with `scope=perm`;
varps referenced only in scripts (e.g. `%swansong`, `%soulbane_prog`) are allocated
server-side by the compiler and never enter client varp.dat.

## Engine context rules learned this round

NPC-death handlers (`[ai_queue3,...]`) run in NPC context:

- Reading `%varp` in the handler is fine; **writing** one is not — the compiler fails
  with `Attempt to access uninitialized pointer [p_active_player]`.
- `if (npc_findhero = ^false) { return; }` early-return guards do NOT establish the
  player binding, and neither does a positive `if (npc_findhero = ^true)` wrap for
  varp writes (it does work for NPC-context ops like `obj_add`).
- Correct pattern (see `scripts/tutorial/scripts/npcs/tut_giant_rat.rs2`):
  guard the handler with `if (npc_findhero = ^true)`, do `obj_add` drops there, and
  delegate every varp write / `mes` to a `[queue,...]` script, which runs in player
  context. Queue call syntax: `queue(name, delay, arg...)` — even no-arg queues take
  a trailing int (`queue(set_rat_kill, 0, 0)`).
- Queue bodies may call procs (`~name`) which then inherit the player context.
- `testbit` returns int: compare with `= ^true` / `= ^false`, never bare `true`.
- `return()` cannot contain a comparison expression.

Applied to: `quest_ics` (ics_possessed_kill), `quest_mdaughter` (mdaughter_bear_kill),
`quest_swansong` (swan_troll_kill, swan_queen_kill), `quest_soulbane`
(soulbane_anger_kill/fear_kill/confu_kill/hope_kill/tolna_dead).

## Verification

- Local: patches 0001–0008 applied in order on a pristine pin clone + all 9 quest
  folders → `BUILD_SRC_DIR=... BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build`
  exit 0 (script.dat regenerated, all CRC checks pass), then
  `content-factory/smoke_377.py` → `compiled_world_started: True`,
  `game_tcp_port_reachable: True`, `web_http_port_reachable: True`
  (login flags false is expected — no family accounts in the disposable world).
- CI: `.github/workflows/batch-quests-disposable-377.yml` runs
  `content-patches/rs377/ci-compile-batch-quests.sh` on a disposable runner:
  SHA-pinned clones, patches in numeric order, per-folder existence guards, python
  checks (unique permanent varps, renamed placeholders, single quest-list
  registration per quest), the two Fenkenstrain contract checkers, native compile,
  and the boot smoke. Runs on PRs touching `content-patches/rs377/**`.

## Batch 3 - oldest not-started quests (2026-11-08, quest audit round 2)

Quest audit round 2: the queue doc (research/rs377/QUEST_QUEUE_2026-11-08.md) lists 72
COMPLETE-VERIFIED quests (re-verified by the parallel NPC-dialogue audit session), so the
remaining work is the not-started quests, oldest by release date first. Six added in this
batch, all JoshRS-original reconstructions in the established pattern:

| Folder | Quest | Released | Varp | Start NPC |
|---|---|---|---|---|
| quest_osf | One Small Favour | 2005-02-21 | onefavour | Yanni Salika (shiloantiques) |
| quest_dwarfrock | Between a Rock... | 2005-03-14 | dwarfrock_main | Dondakan (dwarfrock_dondakan) |
| quest_feud | The Feud | 2005-04-04 | main_feud_var | Ali M (feud_ali_m) |
| quest_tog | Tears of Guthix | 2005-05-09 | tog_minigame | Juna (tog_juna_dummy) |
| quest_zogre | Zogre Flesh Eaters | 2005-05-16 | zombie_ogre | ogre guard (zogre_ogre_guard; Grish has no cache NPC) |
| quest_giantdwarf | The Giant Dwarf | 2005-05-31 | giantdwarf_main | boatman (dwarf_city_boatman_mines_prequest) |

New patches (renumbered 0020-0022 after the merge with main; see below):
- `0020-batch3-quest-varps-permanent.patch` - scope=perm on the six quest varps in all.varp.
- `0021-osf-yanni-quest-start.patch` - extends the existing shiloantiques handler in
  scripts/areas/area_shilo/scripts/yanni_salika.rs2 (Yanni already had antique-buyer
  dialogue): offers the quest start, shows quest progress, and otherwise falls through
  to the original dialogue. First patch to touch area_shilo - checked for handler
  collisions first (only shiloantiques had an existing opnpc1 among all new NPCs).
- `0022-register-batch3-quests.patch` - 6 QP blocks + 6 quest-list colour lines in
  quests.rs2, anchored on the post-0019 state.

Merge with main (2026-11-08): main had landed the parallel session's Feud / Making
History / Hand in the Sand / Elid / Swan Song rebuild / Rag extras as patches
0009-0019, colliding with this branch's 0009-0011. Resolution: keep main's quest_feud
folder and patches 0009-0019 verbatim, drop this branch's quest_feud folder and old
0009-0011, and regenerate this branch's three patches as 0020-0022 against the
post-0019 state. Full chain 0001-0022 verified on a pristine pin clone with all 19
quest folders + the Morytania addendum files: BUILD_VERIFY compile exit 0 and
smoke_377.py green. CI script updated to 22 patches / 18 folders / 18 quest-list
keys / 17 permanent varp blocks.

## Batch 4 - next-oldest not-started quests (2026-11-08, quest audit round 2 continued)

Six more quests, all JoshRS-original reconstructions in the established pattern. The parallel
session's open PR #148 covers the STUB quests (RFD intro, Cabin Fever, Recruitment Drive,
Mourning's End II, Monkey Madness), so this batch took the next not-started quests that
nobody had claimed:

| Folder | Quest | Released | Varp | Start NPC |
|---|---|---|---|---|
| quest_forget | Forgettable Tale of a Drunken Dwarf | 2005-07-04 | forget_main_var | Black Guard officer (dwarf_city_black_guard1; Veldaban has no cache NPC) |
| quest_garden | Garden of Tranquillity | 2005-07-18 | garden_varp_1 | Queen Ellamaria (queen_ellamaria) |
| quest_twocats | A Tail of Two Cats | 2005-07-25 | twocats_varbit (varp id 568, despite the name) | Unferth (twocats_unferth) |
| quest_wanted | Wanted! | 2005-08-08 | quest_wanted | the Savant (wanted_savant; Sir Tiffy Cashien has no cache NPC) |
| quest_deal | Rum Deal | 2005-08-30 | deal_quest | Pirate Pete (deal_pete) |
| quest_agrith | Shadow of the Storm | 2005-09-05 | agrith_quest_varp | Father Reen (agrith_reen_alkharid) |

New patches (anchored on the post-0022 state):
- `0023-batch4-quest-varps-permanent.patch` - scope=perm on the six quest varps in all.varp.
- `0024-register-batch4-quests.patch` - 6 QP blocks + 6 quest-list colour lines in quests.rs2.
- No handler-extension patch this time: every start NPC was a fresh cache NPC with no
  existing opnpc1 (checked against the whole scripts tree first). stanford_the_gardener is
  owned by quest_murder, so quest_garden uses misc_gardener for the seed-giver.

New engine facts: `&&` does not appear in any real script - compound conditions must be
nested ifs. No `return;` inside switch cases in existing quests either; use if/else chains
inside the case instead. Combat quests follow the Feud pattern: [opnpc1,boss] spawns the
attackable via npc_add(movecoord(npc_coord, 1, 0, 0), name, 1000) + npc_setmode(opplayer2),
death is detected in [ai_queue3,name] with ~npc_default_death and an npc_findhero guard,
and the varp advance happens in a [queue,...] script. quest_wanted uses this pattern for
Solus Dellagar (wanted_solus_attackable).

Verification: full chain 0001-0024 applied in order on a pristine pin clone + all 24 quest
folders + the Morytania addendum files -> BUILD_VERIFY compile exit 0 (12.7s pack) and
smoke_377.py green. CI script updated to 24 patches / 24 folders / 24 quest-list keys /
23 permanent varp blocks.

New engine facts: NPC trigger names resolve via npc.pack names (`[opnpc1,<name>]`); cache
quest NPCs exist with quest prefixes (favour_*, dwarfrock_*, feud_*, zogre_*, dwarf_city_*,
tog_*) and quest items in obj.pack - checked all referenced names against both packs and
for existing handlers before writing. Quest-owned constants are globally visible, so
quests.rs2 can use ^osf_* etc. from quest configs. ~p_choice2 works inside procs; use the
`def_int $option = ~p_choice2(...)` form (cook-quest pattern), not inline comparison.

Verification: patches 0001-0011 applied in order on a pristine pin clone + all 15 quest
folders -> BUILD_VERIFY compile exit 0 (full 18.6s pack, all CRC checks pass) and
smoke_377.py green. CI script updated to 11 patches / 15 folders / 15 quest-list keys /
12 permanent varp blocks.

## Patch 0029 — journal slots for five existing 377 quests (2026-11-08)

The pinned 377 quest-list interface has 104 named slots; after 0001-0028, 21 were still
unwired. `0029-register-regicide-fremennik-mm-rd-dt-journal.patch` wires the five whose
completion value is already defined in the pinned `quest.constant`:

| Slot | Quest | Progress var | Complete | QP |
|---|---|---|---|---|
| regicide | Regicide | `%regicide_quest` | 15 | 3 |
| viking | The Fremennik Trials | `%viking` | 10 | 3 |
| mm | Monkey Madness | `%mm_main` | 10 | 3 |
| rd | Recruitment Drive | `%rd_main` (varbit) | 2 | 1 |
| deserttreasure | Desert Treasure | `%deserttreasure` (varbit) | 15 | 3 |

It also makes the backing varps permanent (`scope=perm`), adds the QP constants to
`scripts/general/configs/quest.constant`, and the QP and journal-colour lines to
`quests.rs2`. QP values come from the quest spreadsheet.

This is registration only: no quest scripts were added, so these quests stay red until a
script (or an existing save) sets the varp. Source-only; not compiled or played in-game.

Still unwired (slot exists, completion value not defined in the pinned content, so not
guessed): `tbwt`, `mourning`, `mourning2`, `misc`, `fairy_farmers`, `eadgar`, `mortton`,
`horror`, `roving_elves`, `ahoy`, `ratcatch`, `devious`, `enakh`, `fever`,
`hundred_main`, `myreque_2`.

# Ported 2005–06 quests: revision-377 build result (10 November 2026)

## Finding

The 24 quest bundles that do not compile against the revision-274 world **do compile
against the pinned revision-377 content** (`LostCityRS/Content@44eab090`, May 2006).
The earlier 274 attempt reported **452 distinct unresolved symbols / ~1,200 errors**
(fenk_tower_key, rag_ram_helm, elid_statuette, …) because the 274 cache never had those
2005–06 items. The 377 cache does, so no definitions need backporting.

Evidence: `npm run build` (`tsx tools/pack/Build.ts`) on a scratch branch of the 377
content, with the 24 quest folders copied in from `~/lc274/content/quests-unbuilt`:

- **exit 0, `pack: 36.5s`**, 0 unresolved symbols;
- `data/pack/server/script.dat` contains Fenkenstrain, Tears of Guthix, Rag and Bone,
  Swan Song, Zogre, The Feud, Garden of Tranquillity, Icthlarin, Mountain Daughter;
- the same engine boots: `World ready`, `11666/16383 static NPCs added`.

## Fixes required (small, all text)

1. Register new interface ids/components (`pack/interface.pack` + `interface.order`).
2. Register missing config ids: `pack/<kind>.pack` (`obj`, `varp`, …). Use
   `tools/questops/register-missing-packs.py <content> <build-log>`.
3. `quest_legends/configs/legends_lamp.obj` used `model=inv_genilamp`; the 377 cache
   names it `obj_macro_genilamp`.
4. Delete the duplicate `[fenk_quest]`/`[fenk_flags]` blocks from
   `scripts/_unpack/377/all.varp`; the quest-local `.varp` already re-declares them with
   `scope=perm` + `transmit=yes` (progress must persist).
5. Port-local interface/item additions are not needed on 377 (the native Legends,
   Golem, Troll Romance quests already exist) and must not overwrite the native dirs.
6. Building modified content needs `BUILD_VERIFY=false` (the CRC gate protects the
   stock cache, not a custom world).

## Playability status — do not overstate

Compiling is not playable. The structural audit (`tools/questops/audit-quests.mjs`) on
the 377 branch reports **91 quests, 63 structurally complete**. Of the 24 ports only
four are wired to an NPC trigger:

| Wired (startable) | Not wired (cannot be started in-game) |
|---|---|
| `quest_fenkenstrain` | agrith, deal, dwarfrock, elid, feud, forget, garden, giantdwarf, ics, losttribe, makinghistory, mdaughter, myreque, osf, rag, tog, twocats, wanted |

`handsand`, `swansong`, `zogre` are wired and structurally complete but have not been
played end-to-end.

## Recommended order

1. `quest_fenkenstrain` — most complete, already wired, has map/NPC contract checks in
   `content-patches/rs377/`; drive it to a real completion + save/relogin proof.
2. Then wire one quest at a time (start NPC trigger + `questlist:` journal component +
   QP line in `general/scripts/quests.rs2`), compile, play, commit.
3. Keep the 274 browser world as-is; do not re-attempt the 274 backport.

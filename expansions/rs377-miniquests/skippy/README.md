# Independent JoshRS rev377 miniquest: Skippy and the Mogres

**Owner:** ChatGPT. **Tracked issue:** #306.

This is a **small, new miniquest lane** outside the native 104-quest journal and outside Claude's existing 25 imported quests and DeepSeek's assigned 20 missing quests. No existing quest script is overwritten.

## What has been implemented here

- Skippy talk interactions for native `multi_skippy` and the four existing appearance stages.
- A per-player staged storyline using native persistent `%skippy_state`: water -> nettle tea -> hangover cure -> stage 3.
- Item-on-NPC interactions for bucket of water, bowl/cup of nettle tea and hangover cure.
- Inventory conservation: removes exactly one used item, returns empty bucket/bowl/cup where appropriate, refuses re-consuming items at the wrong stage.
- All prose is newly written; no third-party dialogue, assets, textures, models or caches are bundled.
- The installer defaults to read-only, validates native pack IDs, refuses active family runtime paths and does not overwrite any pre-existing miniquest script.

## Known gap: does NOT yet make the full historical miniquest playable

The pinned 377 NPC pack does not define a generic fightable Mogre. The fishing spots and fishing explosives exist, but the actual Mogre combat/spawn/Slayer unlock has **not** been built or demonstrated. **Do not mark the miniquest as installed, complete or playable.** No quest journal entry or quest point is added (this is a miniquest).

The historical quest released 24 Oct 2005; source reference: https://oldschool.runescape.wiki/w/Skippy_and_the_Mogres

Native content pin: `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50` has:
- NPC 2795–2799; placed `multi_skippy` at (2983,3196) on plane 0.
- Varbit 1344 `skippy_state`, bits 0–2 of `rimmington_extras_var`.
- Bucket water 1929, bowl tea 4239, cup tea 4242, hangover cure 1504.
- Ominous fishing spots 10087–10089, fishing explosive 6664.

## Safe development/test commands

```bash
node --test tools/rs377-skippy/apply-skippy.test.mjs
node tools/rs377-skippy/apply-skippy.mjs --content /absolute/path/to/disposable-377-content
node tools/rs377-skippy/apply-skippy.mjs --content /absolute/path/to/disposable-377-content --apply
```

**No direct installation into `C:\JoshRS-Launcher\...`, `runtime/jparris-377` or active profiles.** Compile with the exact pinned native 377 engine in disposable CI, then verify clicking Skippy, item hand-ins, state persistence after logout/relogin, two independent simultaneous accounts, and safe failure if the inventory has insufficient space.

## Remaining acceptance

- [ ] Actual pinned 377 RuneScript compilation succeeds.
- [ ] In-game Skippy morphs correspond to stage changes; no wrong NPC trigger/type.
- [ ] Real normal client item-on-NPC + chat progression from stage 0 to 3.
- [ ] State survives logout/relogin and remains per-player.
- [ ] Add licensed/compatible Mogre NPC combat lure using existing fishing spots, original model if needed, and proper level/Slayer gates.
- [ ] Confirm two players' separate progress; no lost/granted items.
- [ ] Deploy only after owner-approved offline backup/restart.

**Status: PARTIAL SOURCE IMPLEMENTATION; DO NOT MERGE UNTIL COMPILE/CLIENT TESTS AND MOGRE GAP ARE RESOLVED.**

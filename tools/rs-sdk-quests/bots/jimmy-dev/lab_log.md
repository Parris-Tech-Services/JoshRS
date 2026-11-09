# Jimmy-Dev Lab Log

## 1. Bedabin Nomad Fighter (`id=1239`, `bedabin_fighter`) @ `(3160, 3031, L0)`
- **Observed**: `No trigger for [opnpc1,bedabin_fighter]` / `Nothing interesting happens.`
- **Fix**: Added `[opnpc1,bedabin_fighter]` and `[proc,bedabin_fighter_options]` in `server/content/scripts/areas/area_desert/scripts/bedabin_nomad.rs2`.
- **Verified**: Tested all dialogue branches (`"What is this place?"`, `"Where is the Shantay Pass?"`, `"Okay, thanks"`) and relog in-game (`PASS`, `patches/0001-bedabin-fighter-talkto.patch`).

## Session Update (Etceteria, Mort'ton, Canifis, Zanaris, Sunken Trawler)
- Tested `1367` (`etc_guard1`), `1368` (`etc_guard2`), `1369` (`etc_fish_monger`), `1370` (`etc_veg_monger`) in Etceteria -> all `OK` (dialogue and shops open properly).
- Tested `1257` (`mort_afflicted_man`), `1258` (`mort_afflicted_woman`), `1261` (`mort_afflicted_man2`), `1262` (`mort_afflicted_woman2`) in Mort'ton -> all `OK` (respond via `[opnpc1,_afflicted]`).
- Checked `1576` (`canafis_stranger`) @ `(3503, 3477, L0)` -> `OK` (static spawn is `Vanstrom Klause (1577)`).
- Checked `57` (`fairy`) -> `OK` (no `Talk-to` option in `lostcity.npc` in rev 274).
- Tested `466` (`murphy_sunk`, "Murphy") @ `(1947, 4827, L0)` -> `OK` (floats in water shouting overhead lines while players use `sinkingbarrel1`).
- Next: Walking `jimmy-dev` overland to Burthorpe, Catherby, Fishing Platform (`697 kennith`), Yanille (`461 magic_store_owner`), West Ardougne (`719 mournertwb`), and Arandar (`1201 elf_overpass_guard`).

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
- `892` (`hazeel`, "Hazeel") @ `(2607, 9669, L0)`: Completed the entire **Hazeel Cult** quest in-game (`do_hazeel_cult.ts`, `finish_hazeel_cult.ts`, `spawn_and_test_hazeel.ts`), testing `885` (`sir_ceril_carnillean`), `886` (`claus_carnillean`), `888` (`philipe_carnillean`), `890` (`butler_jones_hazeel_cultist`), `891` (`alomone_hazeel_cultist`), `893` (`clivet_hazeel_cultist`), and `894` (`hazeel_cultist`), and spawning `892` (`hazeel`) at `(2607, 9669, L0)` -> **OK** (`Hazeel` speaks during the ritual cutscene in `alomone.rs2` and vanishes in a smoke puff via `[queue,hazeel_leave]` when the cutscene ends or is interrupted).
- `679` (`Ranging Guild Doorman`), `227` (`Morris`), `226` (`A Sinister Stranger`), `230` (`Grandpa Jack`) @ `(2658, 3439, L0)`: Walked up and tested `Talk-to` in-game -> **OK**.
- `251` (`King Arthur`), `239` (`Sir Lancelot`), `240` (`Sir Gawain`), `241` (`Sir Kay`), `242` (`Sir Bedivere`), `243` (`Sir Tristram`), `244` (`Sir Pelleas`), `245` (`Sir Lucan`), `246` (`Sir Palomedes`) @ `(2763, 3516, L0-L1)`: Tested `Talk-to` in-game and started **Merlin's Crystal** -> **OK**.
- `562` (`Candle maker`), `563` (`Arhein`) @ `(2800, 3438, L0)` & `247` (`Sir Mordred`) @ `(2768, 3404, L2)`: Tested `Talk-to` in-game and stowed away in Arhein's crate to Keep Le Faye L2 -> **OK**.
- `0` (`Hans`), `1`/`3` (`Man`), `4` (`Woman`), `278` (`Cook`) @ `(3222, 3219, L0)`: Tested `Talk-to` in-game in Lumbridge -> **OK**.
- `970` (`Diango`), `917` (`Jail guard`), `922` (`Aggie`) @ `(3080, 3248, L0)`: Tested `Talk-to` and `Trade` in-game in Draynor Village -> **OK**.
- `376` (`Captain Tobias`), `377` (`Seaman Lorris`), `378` (`Seaman Thresnor`) @ `(3026, 3220, L0)`: Tested `Talk-to` in-game at Port Sarim docks -> **OK**.

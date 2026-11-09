# NPC Talk-to Audit & Fix Report (jimmy-dev)

- `PASS` | `1239` (`bedabin_fighter`, "Bedabin Nomad Fighter") @ `(3160, 3031, L0)` — Added `[opnpc1,bedabin_fighter]` & `[proc,bedabin_fighter_options]` in `bedabin_nomad.rs2`; verified all dialogue branches and relog in-game (`patches/0001-bedabin-fighter-talkto.patch`).
- `OK` | `1595` (`tribesman_doorman`, "Saniboch") @ `(2745, 3152, L0)` — Walked up and tested `Talk-to` in-game; responds with `"Good day to you bwana."` and Brimhaven Dungeon entry options.
- `OK` | `1287` (`vt_council_workmen`, "Council workman") @ `(2655, 3592, L0)` — Walked up and tested `Talk-to` in-game; opens dialogue normally.
- `OK` | `610` (`grillknight`, "Black Knight") @ `(3028, 3508, L0)` — Walked to Black Knights' Fortress `(3016, 3513, L0)`; NPC is inside the sealed Witch/Greldo eavesdrop room (`[oploc1,bkfortress_grill]` cutscene NPC, not directly reachable for `opnpc1`).
- `OK` | `1091` (`death_growncat_black`, "Bob") @ `(2924, 3565, L0)` — Walked to Burthorpe `(2935, 3564, L0)` and found `Bob (id=1091)` in-game; has no `Talk-to` option in rev 274 (`quest_death.npc`, pre-Tail of Two Cats).
- `OK` | `372` (`mournerwatchtower`, "Mourner") @ `(2559, 3303, L0)` — Walked to `(2559, 3303, L0)` south of East Ardougne; the 4 Mourners stand inside the fenced watchtower (`biowatchtower`) and are spoken to via `[oploc1,biowatchtower]` in `quest_biohazard.rs2` (`"Keep away civilian."`).
- `OK` | `636` (`gnomecheerleader`, "Cheerleader") @ `(2395, 3495, L0)` — Walked to Gnomeball pitch `(2393, 3494, L0)`; the 2 Cheerleaders stand inside the fenced sideline box (`reachable=false`) and only shout overhead messages (`"Goal!"`, `"You Win!"`) during Gnomeball.

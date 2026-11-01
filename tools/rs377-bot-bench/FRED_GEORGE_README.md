# Fred and George — A/B reporting artifacts (no gameplay started yet)

**The reporter does not start bots, connect to the live world or synthesize XP.** The local Agy implementation instructions are at [AGY_FRED_GEORGE_AUTONOMOUS_AB_PROMPT_2026-11-01.md](../../docs/rs377/AGY_FRED_GEORGE_AUTONOMOUS_AB_PROMPT_2026-11-01.md). The underlying research and original per-skill scorer are in [NO_CHEAT_AUTONOMOUS_BOT_BENCHMARK_2026-11-01.md](../../docs/rs377/NO_CHEAT_AUTONOMOUS_BOT_BENCHMARK_2026-11-01.md).

## Delivery architecture

- Agy's LOCAL Windows agent (to be built) runs normal player sessions for **Fred** (gather_first) and **George** (quest_first). It observes unmodified normal gameplay. Elrothiro adds them in the authentic Friends list and uses an authenticated in-game location lookup. No production login credentials, chat transcripts or human coordinates are public.
- Agy's LOCAL scheduled sampler (to be built) measures two 10-minute bot intervals at each UTC boundary **:00, :10, :20, :30, :40, :50**, validates and redacts each record and commits 12 records per hour to this repo, under `reports/fred-george/snapshots/YYYY-MM-DD/YYYY-MM-DDTHH-MMZ-Fred.json` and the same for George. Commit data only after real observations. Do not invent missing data or overwrite existing files.
- GitHub Action `.github/workflows/377-fred-george-hourly.yml` runs around UTC **:15**, inspects the last complete hour, parses the two bots' 12 possible snapshots and commits JSON/Markdown + four SVG charts to `reports/fred-george/hourly/YYYY-MM-DDTHHZ/` when genuine input exists.
- ChatGPT's separate hourly task, scheduled **:25 Australia/Sydney**, checks those actual six time windows and existing graphs, writes additional interpreted findings to GitHub when tool access allows, and reports NO LIVE DATA if the bots are not running. Scheduling alone does not make an experiment active.

## A/B scientific conditions

Both bots must be created as *two normal new 377 accounts* with identical legitimate starting equipment, starting position, initial skills, quest states and world rules; prove with their shared redacted `starting_signature`. Both may eventually train all 21 historical skills and attempt all 104 historical quests, subject to real 377 availability; never skip missing content by setting quest flags. Compare one gather-first versus one quest-first policy (exploratory n=1 per arm).

Initial periods must be **solo**. Fred and George **may team up** through native game mechanics to fight difficult monsters or collaborate on legitimate quests; mark every 10-minute interval as `phase: coop` or `mixed` when cooperation occurs, and record bounded `cooperation_events`. Team XP and quests are useful data but must not be presented as fair causal solo A/B outcomes. The aggregator only calls an hour `COMPLETE` and `comparable=true` when all 12 records are valid with identical starting provenance and all periods are solo. Partial or mixed reports are still plotted and remain informative.

Each record must have the fields required by `fred_george_hourly.validate()`:

- `schema`: joshrs-ab-ten-minute-v1; `experiment_id`: fred-george-v1
- `ab_run_id` safe identifier, same for the two bots in a given AB run; `policy_version` frozen version; `bot`: Fred or George; `policy`: gather_first/quest_first; `world_mode`: isolated/family_world, `online`: genuine boolean
- `window_start_utc` and `window_end_utc`: timezone-aware, matching ten-minute UTC boundaries, `engine_sha`, `content_sha`, `starting_signature` a 16–64-character hexadecimal fingerprint excluding account identifiers/credentials
- `fresh_account:true`, `items_seeded:false`, `cheats_enabled:false`, `accelerated_time:false`, `xp_multiplier:1`, `tick_ms` verified native value
- `xp_before_tenths` and `xp_after_tenths`: full exact mappings of all 21 skill names imported from `report.py`, each nonnegative integer raw 377 tenths-XP
- `successful_actions`, `failed_actions`, `deaths` nonnegative ints; `quests_verified_new` array of journal+persisted legitimately verified newly completed quests; `bug_candidates` array of stable safe IDs + low/medium/high/critical severity
- `location` with numeric x,z,plane, short region name, `route_points` optional bounded array of world [x,z]; **bot-only** coordinates
- `phase`: solo/coop/mixed; `cooperation_events`: [] or bounded array of `{type:"joint_combat"|"trade"|"quest"|"resupply"|"follow",partner:"Fred"|"George"}`; the partner must be the other bot and no events can be attached to solo.

**Important**: Schema flags are assertions, not proof the bot actually used ordinary gameplay. Agy must inspect server action traces and inventory conservation without exporting private data. For comparisons, do not infer relative level-99 times from 60 minutes. Never report an unobserved skill as complete or a no-bug-hour as proof of no defects.

## Run tests and create reports from real data

```bash
python -m unittest discover -s tools/rs377-bot-bench/tests -v
python tools/rs377-bot-bench/fred_george_hourly.py --root reports/fred-george --hour 2026-11-01T04
```

That command makes a **PARTIAL/NO DATA** report if no snapshots exist. Do NOT commit generated empties as if a live test had succeeded. The GitHub Action skips generation until it finds a genuine source snapshot.

## Human acceptance — not met by repo merge

Prove both fresh accounts login and relog with default starter gear, real game movement and all saved stats, both present as **Online** friends for Elrothiro, real native PM delivery, real locator coordinates on a second plane/in a different region, then different paths, a legal team-combat/quest scenario, 12 published snapshots and the corresponding real four-chart hourly report. No premature production rollout, no need to stop the current player session and never disturb family accounts.

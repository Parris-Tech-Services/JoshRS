# Quest points: 24 ported quests are not counted at login

`check-quest-points.mjs` reports **24 problems** on `~/dev274/content`: ported quests whose stage
variable is set but which are absent from `[proc,count_questpoints]`
(`scripts/general/scripts/quests.rs2`).

## Why it matters

Quest points are **recomputed at login** from that procedure. A quest that is not listed there has its
points silently dropped the next time the player logs in — the quest still shows as complete, but the
points are gone. This is the failure mode the layer-2 checker was built for.

## Why it cannot be fixed mechanically

The counter needs two things per quest: the completion test and **a `^<prefix>_questpoints` constant**.
The ported quests have **no such constants** — an attempted automated fix found 0 of 24, e.g.:

```
quest_feud      needs ^feud_questpoints     — absent
quest_agrith    needs ^as_questpoints       — absent
quest_dwarfrock needs ^br_questpoints       — absent
```

Awarding points without knowing each quest's real value would invent game content, which the project
rules forbid. The values would have to be researched per quest and recorded, exactly as the reward
work was earlier in this project.

## Status

| | |
|---|---|
| Quests affected | **24 of 26** |
| Quests correctly counted | 2 |
| Fix | needs per-quest point values (research), then one line each in `count_questpoints` |
| Claimed as working | **no** |

World: `/data/data/com.termux/files/home/dev274/content`.
Save: `/data/data/com.termux/files/home/lc274/engine/data/players/main/elrothiro.sav` — untouched.

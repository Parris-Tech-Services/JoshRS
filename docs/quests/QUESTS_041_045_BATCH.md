# Quests 41–45 — verification batch, plus three directory-identity corrections

| # | Quest | QP wiki/content | Rewards | Verdict |
|---|---|---|---|---|
| 41 | The Grand Tree | 5 / 5 | 18,400 Atk + 7,900 Agi + 2,150 Magic / `184000`, `79000`, `21500` | ✅ exact |
| 42 | Shilo Village | 2 / — | **no content found** | ❌ absent |
| 43 | Underground Pass | 5 / 5 | 3,000 Atk + 3,000 Agi / `30000`, `30000` | ✅ exact |
| 44 | Observatory Quest | 2 / 2 | 2,250 Craft + 875 Atk/Def/HP/Str / `22500`, `8750` ×4 | ✅ exact |
| 45 | The Tourist Trap | 2 / 2 | 4,650 Fletch/Agi/Smith/Thiev / `46500` ×4 | ✅ exact |

## Directory names did not match the quests — three more corrections

The content does not follow "one directory per quest", and two of my earlier mappings were
wrong as a result:

| Quest | I had | Actually | Evidence |
|---|---|---|---|
| Observatory Quest | *absent* | `quest_itgronigen` | `observatory_professor.rs2`, `book_of_astrology.rs2` |
| The Tourist Trap | *absent* | `quest_desertrescue` | `irena.rs2`, `mining_slave.rs2`, completion message "Tourist Trap Quest" |
| Prince Ali Rescue | `quest_desertrescue` | `quest_prince` | its own completion: `questlist:prince`, `^prince_questpoints = 3` |

`quest_desertrescue` is **The Tourist Trap**, not Prince Ali Rescue. That was my error, and it
mattered: the directory's only completion message says "You have completed the Tourist Trap
Quest!" and awards 2 QP — which looked like a missing Prince Ali completion until the real
directory was found.

Target-status now reads **62 present / 26 absent**, up from 60.

## Shilo Village is genuinely absent

Checked three ways: no `quest_shilo*` directory, no Shilo entry in any `all.varp` registry, and
the only Shilo-related scripts are area NPCs (`hajedy.rs2`, `captain_shanks.rs2`) with no quest
logic. It is a real content hole for a quest released in January 2003.

## Mage Arena I is not a content hole

Earlier listed as "absent despite predating the revision". It is a **minigame**, and the
content implements it as an area: `scripts/areas/area_mage_arena/scripts/battle_mage.rs2`,
`chamber.rs2`. It has no quest dir because it is not a quest. Removed from the anomaly list.

## Running tally, quests 1–45

| Result | Count |
|---|---|
| Rewards verified against wiki | **40** |
| Confirmed gaps | **2** (Sheep Shearer +50; Sea Slug 7,175 — Sea Slug fixed) |
| Resolved era questions | **4** |
| Defects found in 377 content | **2** (Priest in Peril, Sea Slug) |
| Genuinely absent in-era quests | **1** (Shilo Village) |
| Design constraint | **1** (Shield of Arrav) |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 45.

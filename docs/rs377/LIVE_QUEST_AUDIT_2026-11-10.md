# Live revision-377 quest audit: JParrisDesktop, 10 November 2026

All checks were read-only. The live server was running with Elrothiro and Sylvie connected the whole time, and nothing was restarted, repacked or written. Tools: [tools/rs377-live-quest-evidence](../../tools/rs377-live-quest-evidence/README.md).

## What is running

| Item | Value | Verified how |
|---|---|---|
| Engine | LostCityRS/Engine-TS `377-wip` @ `b5ac859` | `deploy/jparris-windows/upstreams.json` |
| Content | LostCityRS/Content `377-wip` @ `44eab09` (18 Oct 2026) | Sparse clone of upstream checked out at the pin; `git rev-list 44eab09..origin/377-wip` = **0**, so the pin is the current upstream head |
| Compiled server scripts | `engine/data/pack/server/script.dat`, built 8 Nov 2026 21:20:13 | Newer than every `.rs2` (latest 21:20:01), so all local script edits are in the running world |
| Persistence | Autosave every 1500 ticks (`World.ts` `PLAYER_SAVERATE`) | Save files were written at 14:14:49, exactly 30 minutes after the 13:44:49 start. Working. |

The live content folder is **not** a git checkout. "Upstream" vs "local" below comes from file-by-file comparison with the pinned upstream commit, ignoring line-ending differences.

## Quest counts (104 quests in the 377 quest list)

| Classification | Count | Meaning |
|---|---:|---|
| **VERIFIED COMPLETE** | **1** | Rune Mysteries: `DONE(6)` in Elrothiro's save |
| Started in a real save | 14 | Elrothiro: Cook's Assistant, Demon Slayer, Doric's Quest, Romeo & Juliet, Prince Ali Rescue, Vampire Slayer, Imp Catcher, Witch's Potion, Ernest the Chicken, Merlin's Crystal, Witch's House, Family Crest, Gertrude's Cat, Murder Mystery. Sylvie has none yet. |
| Upstream Lost City scripts, NOT TESTED | ~44 more | 56 folders are identical to upstream; 9 more are upstream with small local fixes (cook, haunted, arthur, biohazard, death, grandtree, troll, upass, waterfall) |
| Local AI-written imports, NOT TESTED | 25 | Not in upstream: ahoy, deserttreasure, dwarfrock, eadgar, fenk, feud, giantdwarf, hauntedmine, horror, ics_little, lost_tribe, mdaughter, misc, mourning, myreque (In Search of the Myreque), osf (One Small Favour), regicide, roving_elves, tbwt, tog, viking, zogre; plus mm, mortton and rd, which upstream ships as config-only stubs. They compile and have start triggers, but most are 150–800 lines, far smaller than upstream quests of similar scope. |
| Missing | 20 | No scripts, or an empty stub folder: Forgettable Tale, Garden of Tranquillity, A Tail of Two Cats, Wanted!, Mourning's End Part 2, Rum Deal, Shadow of the Storm, Making History, Rat Catchers, Spirits of the Elid, Devious Minds, The Hand in the Sand, Enakhra's Lament, Cabin Fever, A Fairy Tale Pt. 1, Recipe for Disaster, In Aid of the Myreque, A Soul's Bane, Rag and Bone Man, Swan Song |

The earlier `QUEST_QUEUE_2026-11-08` label `COMPLETE-VERIFIED` only meant "a journal script and a completion script exist". It is not gameplay evidence.

The static pass flagged Demon Slayer and Fishing Contest as having no start handler. Both are false positives: they start from area NPCs (`[opnpc1,aris]` in `areas/area_varrock/scripts/gypsy.rs2`, and `tunnel_dwarf`).

## Engine defect, or missing content?

- **Engine defects found: none.** Every quest gap is missing or unverified content scripts. Persistence, NPC dispatch (opnpc/oploc triggers are present in the compiled pack for every implemented quest) and script compilation all work.
- **The 20 missing quests** need new content scripts. Updating Lost City won't supply them: the pin is already the current `377-wip` head.
- **The 25 local imports** need playtesting in a disposable world. Their compiled presence proves only that they build.
- **Falador ladder ("Nothing interesting happens", issue #293):** this text is the engine's default when an object has no handler (`Player.ts` around line 1389). `ladders+stairs/scripts/ladders.rs2` is identical to upstream, and the only local change in that folder (`stairs.rs2`) touches Haunted Mine stairs and an `ogre_stairs` removal, not Falador. So this is an unhandled loc in upstream content, not an engine bug and not a local regression. The exact ladder (building and coordinates) still needs confirming in-game.

## Suggested order
1. Playtest the 14 started quests to completion. That's real evidence for free, starting with Cook's Assistant.
2. Report unhandled locs (such as the Falador ladder) upstream to LostCityRS/Content, with coordinates.
3. Before relying on any of the 25 local imports, test each one in a disposable world copy (separate ports and accounts).

# JoshRS 377 quest bundles (branch quests/377-claude-20261108)
All bundles are **uncompiled source** for the private 377 content checkout (`content/scripts/quests/<folder>/`).
Rag and Bone Man has placeholder dialogue; the rest use original JoshRS dialogue/stages/rewards (owner-authorised).

| Folder | Quest (wiki release date) | Notes |
|---|---|---|
| rag_and_bone_man | Rag and Bone Man (10 Apr 2006) | Most complete mechanics (35 bone chains, pot-boiler) |
| a_souls_bane | A Soul's Bane (3 Apr 2006) | Remove agy's duplicate Launa/Tolna triggers first |
| swan_song | Swan Song (2 May 2006) | Fishing/cooking hooks missing |
| in_search_of_the_myreque | In Search of the Myreque (10 Jan 2005) | Burgh/Canifis scenes missing |
| icthlarins_little_helper | Icthlarin's Little Helper (26 Apr 2005) | Item sources missing |
| mountain_daughter | Mountain Daughter (7 Mar 2005) | Puzzles missing |

Common to-do: add `scope=perm` to cache varps (`soulbane`, `swansong_quest`, `routequest`, `mdaughter_var`), add QP/quest-list lines to
`general/scripts/quests.rs2`, run `audit_npc_trigger_collisions.py`, then pack and fix compile errors. `testbit`/`setbit` use is unverified.
Not started: In Aid of the Myreque (cache has varps only), Haunted Mine, Throne of Miscellania, Horror from the Deep, Fremennik Trials,
Ghosts Ahoy, Between a Rock..., The Feud, Zogre Flesh Eaters, The Lost Tribe, Desert Treasure, Tears of Guthix.

# Luna: context-aware companion mode (Agent 2 acceptance contract)

**Status: SPECIFIED / NOT YET IMPLEMENTED OR LIVE VERIFIED.** Requested for the *existing* private, local JoshRS 377 world, not as a replacement Luna, NPC, client macro, paid AI service or separate game. This extends issue [#34](https://github.com/Parris-Tech-Services/JoshRS/issues/34), and the already active Agent 2 dragon-assist and friendly-duel work. Agent 1 owns common `Player.ts` handler changes; Agent 3 owns integration, live restarts and save acceptance; Agent 4 audits the handoffs.

## User experience

> "I wish Luna would join in on whatever I'm doing: if I'm fighting, she would fight; if I'm fishing, she would fish; if I'm chopping trees, she would chop trees; if I'm questing, she quests."

**Default:** Luna stays near Elrothiro and mirrors the *purpose* of his current activity without repeated explicit commands. She should feel like a cooperating party member, not a script blindly replaying every click. One opt-in toggle such as `::luna auto on|off` and helpful `::luna status` are allowed, but automatic activity matching should be the normal mode. Existing explicit `follow`, `assist`, `stop`, `gear` controls remain functional and can take priority.

| Elrothiro does | Luna should do | Genuine limitation |
| --- | --- | --- |
| Fights a dragon, goblin or boss | Identify the **same legitimate combat encounter** and assist it using permitted movement, multi-combat eligibility, attack timers and damage; defend if aggressed | In single-combat, don't steal or illegally double-attack an engaged target; stand guard/recover or help on another legal attacker only when safe |
| Harpoons raw sharks | Check she has a harpoon, valid Fishing level, inventory capacity, a reachable `Net/Harpoon` spot, then fish nearby using standard server interaction and earn genuine fish/XP | Never make a harpoon, item or XP appear from nowhere; if lacking supplies, announce and use an achievable supply/banking goal |
| Chops a tree | Select a reachable valid nearby tree and cut it with her actual axe, level, inventory and tree availability; bank/restock when appropriate | Respect depletion/other players' interactions and don't manufacture logs |
| Mines, cooks, smiths, crafts, trains or banks | Perform the same *category* of task with own inventory/abilities and normal engine actions; do not copy the player's inventory operation blindly | Some content may be incomplete; acknowledge and safely follow if not supported |
| Walks/explores/travels | Follow with collision-aware pathfinding and distance maintenance, recover from blocked routes and handle region changes | Never teleport Luna just because Elrothiro moved, unless an existing allowed game travel mechanism permits it |
| Starts/continues a quest | Follow to quest locations; participate in relevant legal NPC dialogues when supported; help fight quest enemies where legal; operate safe cooperative puzzles; give brief contextual support | **Do not copy Elrothiro's quest flags, complete dialogue/steps on his behalf or skip prerequisites.** Each entity has separate legal quest state; some quest steps will only support accompaniment until proper script support exists |
| Banks / prepares supplies | Bank only Luna's own items, restock using available game mechanisms and rejoin the player | Don't move Elrothiro's inventory or duplicate anything |
| Logs out, pauses, changes activity or says stop | Stop current assist safely, clear target, preserve bot state, follow/recover or idle as appropriate | Don't continue attacking or skilling indefinitely after the party objective ends |

## Required design

1. **Observe intent from authoritative events**, not from guessing based solely on animation. Read current validated target/interaction, combat target, skill action, location, last successful actions, inventory changes, quest progress and explicit commands. Don't scrape the GUI or read/save the player's credentials.
2. Introduce a **bounded, tick-driven CompanionController** with a clear activity enum: `FOLLOW, COMBAT_ASSIST, FISHING, WOODCUTTING, MINING, COOKING, BANKING, QUEST_SUPPORT, OTHER_SKILL, RECOVER, IDLE`. Use version-appropriate actions and re-use the existing `BotPlayer` rather than creating a second bot.
3. Add **activity confidence and hysteresis**: repeated/committed player interactions establish intent, interruptions and quest/combat hazards pre-empt slower skilling, a few ticks of action change settle before switching, and the bot never thrashes between goals each tick.
4. **Priorities**: explicit `stop` / manual override > immediate survival and legal combat response > active player combat assist > active quest step assist > mirroring skills > following > safe idle. A short waiting window prevents rapidly switching on transient clicks.
5. **Shared party distance, distinct assets**: Luna stays reasonably near Elrothiro, chooses nearby eligible resources independently, respects collision/line of sight and never uses Elrothiro's items/account/quest flags. If Luna needs materials or has a full inventory, it performs legitimate bank/resupply or communicates why it cannot join.
6. **Server-authoritative execution**: call existing player action/interaction + RuneScript pathways; never use developer `inv_add`, `setLevel`, `stat_advance`, teleport or guaranteed damage as shortcuts. All item/XP changes derive from validated successful game actions. Existing maxed Luna loadout is a local dev feature, not a licence to bypass future progression.
7. **Observability**: `::luna status` tells which activity/goal she's currently pursuing and why; concise in-game feedback when she begins fishing/woodcutting/assisting, lacks equipment, is blocked or must obey single-combat rules. Chat is rate-limited.
8. **Recovery**: handle target disappearance, resource depletion, player logout, death, trade, duel, blocked movement, pathfinding timeout, changing zones/planes, invalid quest state and full inventory without loops or ghost combat targets. Persist only appropriately bounded Luna-specific preferences/goals in the protected private bot state.
9. **Quest support is incremental**: build one actual quest vertical slice based on an already implemented #377 quest (read existing script and required flags), verify each supported cooperation action, then broaden. Distinguish "accompanies a quest" from "completes a quest with Elrothiro" in reports.

## Proof before calling it complete

- **Fishing:** Elrothiro begins shark harpooning; without any extra Luna command, Luna walks to a suitable spot, performs normal fishing with required tool, and a real catch/XP occurs; stop fishing and she follows. When missing gear, clear reason and safe recovery.
- **Woodcutting:** Elrothiro cuts a tree; Luna selects another reachable tree, gains an ordinary log/XP, then bank/resupply or clear explanation on full inventory.
- **Combat:** Attack a dragon in a legal multi-combat test and verify Luna chooses the same target with legitimate damage, no friendly fire or target thrashing. In a single-combat test, verify she explicitly does *not* bypass combat rules.
- **Quest:** Elrothiro initiates/advances a supported quest; Luna travels with him, demonstrably performs at least one valid cooperative action and does not bypass or alter Elrothiro's quest state. More complex scripted cooperative quests remain PARTIALLY COMPLETE until supported.
- **Transition:** fishing -> combat -> woodcutting -> bank -> follow without spamming commands, duplicating items or lingering actions; explicit `stop` takes effect; logout/relogin and restart preserve both characters.
- **Safety:** no second Luna, no lost or replaced saves, no live world restart without Agent 3 consent/backup, no shared `Player.ts` overwrite while Agent 1 works, no production Elrothiro used for destructive test.

## Delivery order

1. Observe and mirror woodcutting and fishing with real actions (a visible minimal slice).
2. Integrate existing Agent 2 dragon assist and safe duel work through the same controller.
3. Add transitions, supply/banking, stop/status and recovery.
4. Implement one carefully selected quest accompaniment/cooperation vertical slice, then expand to other activities.
5. Agent 3 verifies in the *actual* Java client and persistence; Agent 4 posts evidence/status to #35.

Acceptance can be **PARTIALLY COMPLETE** even when one skill works; do not claim full "whatever I do" support until real actions in the major activity categories are tested. Keep local code changes in Agent 2's working copy or isolated worktree, compile, run tests, coordinate integration with Agents 1/3, and publish safe code/test evidence only.
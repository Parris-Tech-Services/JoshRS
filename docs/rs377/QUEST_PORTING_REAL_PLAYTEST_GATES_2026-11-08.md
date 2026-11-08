# JoshRS native quest port — genuine gameplay acceptance gates

Date: 8 November 2026. Reference: May 2006 revision 377, pinned Engine-TS / Content; **not** RS3 or current OSRS.

## What the 377 source validation proves

`content-patches/rs377/ci-compile-batch-quests.sh` pins the source and verifies patch ordering, RuneScript compilation, pack CRC, and disposable server listener startup. This is *source-backed compatibility*, not an authenticated player, NPC click, combat, quest completion or persistent game session.

Both Swan Song and Rag and Bone Man have source implementations of their basic state machines and some of their 2006 mechanics. Each still has material gaps listed in its local README. Do **not** mark either fully playable, and never mutate the owner's saves or merge proprietary game resources as a shortcut.

## Essential live test sequence before claiming finished

**Isolation:** Clone only cleared source into a fresh test directory. Run a disposable game/database on independent ports. Never use Elrothiro's or Sylvie's saved characters, accounts, database, assets or client caches. Prove independent rollback first.

**Swan Song:** Fresh test login; 100 QP eligibility; Draynor Wise Old Man three-rune collection; Franklin's 5 iron-sheet press; 5 *distinct* repaired wall locations; Arnold fishing net and 5 cooked fish; actual sea-troll ambush and fishing trolls; Wizard Frumscone's 7 bones/pot/lid; visibly spawned skeleton defenders; queen genuine combat and death; Herman reward. Record stage, XP, bank, coins, inv and QP before/after every step and across relog. Reject any scripted completion without battle or repeated repairs on the same wall.

**Rag and Bone Man:** Each of the eight first-quest bones and all 27 extra bones must be obtained from authorised real in-game NPCs, prepared using vinegar and the pot-boiler, handed over once with drop conservation, and survive logout. Test 5,000 Prayer XP, original-era extra QP, reward selection, reward exchange, empty inventory, bank/equipment ownership, lag/disconnection, and no duplicate items.

**Area and bot verification:** Authenticate two separate normal-377 accounts, show both players in the same map region via actual client/network evidence, and replay at least one quest step on each without using admin/debug shortcuts. Record screenshots and exact build/source IDs; reject blank region/collision failures and NPC dialogue fallback. Protect against children encountering unintended online players or public chat.

## Modern RS3 / OSRS scope boundary

The 377 Java client cannot render post-2006 modern NPCs, animations, item models, interfaces or map squares just because a historical name appears in a script. Later areas require independently authorised **original** 377-compatible terrain/models, world coordinates/scene handling, server pack generation, collisions, transports, minimap, quests, NPC/loc data and functional live client proof. `research/rs377/MAP_EXPANSION_2006_TO_2026_2026-10-30.md` remains a build specification, not proof of any ported map.

Modern quests/NPCs/areas are therefore **BLOCKED for truthful complete-parity claims**, not counted as installed or functional. A later game-era project may need a new client/protocol rather than attempting to bolt a full 2026 world onto a 2006 client.

## Release decision

Source compile + boot: recorded by CI when green.

Complete real-player quest & family save verification: **NOT VERIFIED**.

Full modern world parity: **NOT IMPLEMENTED**.

Do not deploy to the family's live save-bearing world until the above checks and authorised backup/rollback have been satisfied.

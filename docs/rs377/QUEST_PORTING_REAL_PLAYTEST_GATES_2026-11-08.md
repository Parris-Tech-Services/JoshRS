# Quest ports: what native 377 CI proves and what still needs real-client evidence

Date: 8 November 2026. Target: May 2006 rev-377. Family local game and saves remain separate.

## Build evidence
`content-patches/rs377/ci-compile-batch-quests.sh` checks clean pinned Content+Engine SHAs, applies reviewed patches `0001–0021`, copies scoped scripts, validates five actual Piscatoris map LOC tiles and 35 bone mappings to pinned real NPC definitions, compiles RuneScript/packs and boots a disposable world. GitHub checks when green prove source compatibility and socket listeners, **not a complete client quest, shared player world or durable save**.

## Required in-game verification before claiming full 2006 quest completion

**Swan Song:** On a truly isolated save and normal rev-377 client, verify Herman 100-QP and Wise Old Man hand-in; all repaired walls (5 unique clickable positions), all five repaired visuals persisting per player; metal press, 3 sea troll fishing combat deaths, fresh fish catch/cook/Arnold; 8 hostile troll deaths, Frumscone→Malignius and bone seeds; native skeleton allied combat with the queen and boss defeat; Herman one-time reward with the historical 10k Fishing XP; normal postquest monkfish. Record every item debit/credit, quest varbit, questpoints, level/XP, real combat event, logout, and map location. The current stage order differs from the original 2006 quest and skeleton AI does not yet fight; fix fidelity before final certification.

**Rag and Bone Man:** Test each of the 35 named NPCs for reachable spawns and real kills, source-specific chance (guaranteed initial 8 / 1:4 extra 27), special bone ground item/ownership, vinegar purchase, pot-boiler with process restart, every hand-in, initial 500+500 XP and extra 5k Prayer XP, original-era QP and helmet/bonesack exchange without duplication. Test bank/equipment, dropped items, inventory full, tick delay, latency, simultaneous clicks and disconnect/relog. Source mapping alone cannot prove any of these.

**Safety and multiplayer:** Two genuine isolated account logins, two native Java clients in the same world, measured NPC visibility and combat, persistent stages after relog, snapshots/hashes and fully verified backup/restore. Do not touch Elrothiro or Sylvie saves or family production. Do not claim "VERIFIED COMPLETE" without saved screenshots, packet traces and session results.

## 2026+ RS3 and OSRS content
The present 377 client cannot represent modern animated NPCs, later-era map squares, quest interfaces, new skills, scene/texture packs, collision, animation formats or network protocols by simply copying database names. Post-2006 modern content still needs independent rights-cleared map/asset authoring, scene packers, client/UI or separate client architecture, terrain navigation, NPC shops/banks/transport, dialogue scripts, skill mechanics and actual normal-client verification. See `research/rs377/MAP_EXPANSION_2006_TO_2026_2026-10-30.md`. **No full 2026 RS3/OSRS port has been built.** Do not mislabel research/specification as runtime content.

## Release gate
Pinned source compile+boot may pass CI. Authenticated real-player end-to-end quests, persistent family saves and modern world parity **remain unverified/unimplemented**. Preserve all local-world data until fully backed-up proof and user-authorised deployment.

# Post-377 Quest Capability Triage (OSRS/RS3 gap document)
Date: 8 November 2026 · Input: user-supplied "RuneScape Quests NOT in the JoshRS Revision 377 Quest Queue" (83 OSRS + 189 RS3 quests) · Baseline: `research/rs377/QUEST_QUEUE_2026-11-08.md`

## Question

The gap document enumerates every quest in live OSRS and RS3 that is absent from the
104-quest Revision 377 queue (cutoff: Swan Song, 2 May 2006). Can any of them be
implemented into JoshRS against the pinned 377 cache?

## Answer

**No.** Every quest in the document is blocked by missing client-cache infrastructure, and
the block is structural, not a matter of effort. The implementable quest backlog for the
pinned 377 world is the remaining in-queue quests (10 after questbundle2).

## What a 377 quest requires, and what the cache provides

| Requirement | 377 cache reality | Post-cutoff quests |
|---|---|---|
| Quest-list button (`questlist.if` component) | Exactly 104 quest buttons ending at `[swansong]`; the only other components are the scroll layer and the FREE/MEMBERS headers (`com_0`, `com_24`, `com_43`) — no spare slots | None exist |
| Progress varp / varbit (client range 0-724) | All 725 varp ids are named in `varp.pack`; no varp or varbit named for any post-cutoff quest (searched: royal trouble, dorgeshuun, fairytale II, lunar, glouphrie, slug menace, my arm, enlightened journey, eagles' peak, animal magnetism, contact, cold war, fremennik isles, tower of life, brain robbery, what lies below, olaf, slice of H.A.M., dream mentor, grim tales, king's ransom, and more) | None exist |
| Map regions (`.jm2`) | 664 map files, all pre-cutoff. Absent: Lunar Isle, Neitiznot/Jatizso, Harmony Island, the penguin iceberg, Eagles' Peak, Braindeath Island, the Royal Trouble dungeon, the Dorgeshuun caves, the Eyes of Glouphrie dungeon, the EW II workshop lower floors | Missing for every quest that needs new areas |
| NPCs / items | Cache carries only pre-cutoff entities (e.g. Zanik, Baba Yaga, Ambassador Alvijar are absent; the 37 `deal_*` NPCs exist because Rum Deal predates the cutoff) | Missing for essentially every quest |

Notable nuance: interface definitions (`questlist.if`) and NPC composites are content-side
and technically extensible, but varps are hard-capped at the client's 725 and **map regions
cannot be added without client-cache modification**, which the pinned-cache revision
integrity policy excludes.

## The six exclusion-table quests in detail

| Quest | Released | Blocking evidence |
|---|---|---|
| Royal Trouble | 22 May 2006 | No `questlist.if` component; no varp/varbit; the Miscellania dungeon map region does not exist in the 664 `.jm2` files |
| Death to the Dorgeshuun | 21 Jun 2006 | No component; no varp/varbit; the Dorgeshuun cave passage map region does not exist |
| Fairytale II - Cure a Queen | 11 Jul 2006 | No component; no varp/varbit; the fairy ring network and related map data do not exist |
| Lunar Diplomacy | 24 Jul 2006 | No component; no varp/varbit; Lunar Isle does not exist in any form |
| The Eyes of Glouphrie | 15 Aug 2006 | No component; no varp/varbit; the gnome dungeon map region does not exist |
| Elemental Workshop II | 2 Oct 2006 | No component; no varp/varbit; the workshop's lower floors do not exist as map regions |

## Classification of the 83 OSRS quests

- **1 quest, pre-cutoff:** Rag and Bone Man II (10 Apr 2006) predates the cutoff but Jagex
  shipped it as a miniquest, not a quest-list quest; the project already models it as the
  `rag_wishlist` miniquest (varbit `rag_bone_2`), implemented by the batch-quests bundle.
  Nothing further to port.
- **26 quests, RS2 2006-2007 window** (Darkness of Hallowvale through King's Ransom):
  same structural blocks as the six above (no component, no varp, missing map regions for
  Burgh de Rott, the Braindeath/ pirates arc, Neitiznot, the Dream World, etc.).
- **56 quests, OSRS-original (2013+) or otherwise post-RS2:** additionally built on game
  systems (new areas, interfaces, mechanics) that a 377 client cannot express.

## RS3's 189 quests

All blocked by the same evidence, increasingly so: RS3 quests depend on post-2007 engine
systems (reworked interfaces, evolution-of-combat-era content, instancing models) that have
no analogue in a 377 client and cache.

## Recommended path forward

1. **Finish the in-queue backlog (current policy).** 10 quests remain unimplemented after
   questbundle2: Zogre Flesh Eaters, The Giant Dwarf, Forgettable Tale..., Garden of
   Tranquillity, A Tail of Two Cats, Shadow of the Storm, Rat Catchers, Devious Minds,
   Enakhra's Lament, A Fairy Tale Pt. 1. Each has a quest-list component and cache varps.
2. **Post-377 quests stay excluded** unless the project adopts a cache-extension program
   (authoring new `.jm2` map regions and interface components and auditing the 725-varp
   budget). That is a separate, major initiative — licensing-clean (all original data) but
   out of scope for the pinned 377 revision.
3. **A later-revision cache** (e.g. a 400s build with Lunar Isle onward) would unlock the
   2006-2007 window naturally, at the cost of re-pinning the entire content pipeline.

## Verification commands (pinned content checkout)

- Quest buttons: `grep -c "buttontype=normal" scripts/interfaces/questlist.if` → 104
- Post-cutoff varps/varbits: keyword search of `pack/varp.pack`, `pack/varbit.pack` →
  only false-positive substrings (`seaslugquest`, `lost_tribe_contact`, `deal_slug`)
- Maps: `ls maps/*.jm2 | wc -l` → 664; no Lunar/Neitiznot/Jatizso/Harmony/iceberg/Eagles
  Peak regions
- NPCs: `pack/npc.pack` has no Zanik/Baba Yaga/Alvijar; `roving_female_woodelf` (Eluned),
  `rd_teleporter_guy` (Sir Tiffy), `deal_pete` (Pirate Pete) exist because their quests
  predate the cutoff

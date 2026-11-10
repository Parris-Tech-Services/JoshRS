# NPC Voices: original dialogue for the JoshRS family world

Original, handcrafted conversations for NPCs in the revision-377 world that had a **Talk-to** option but no conversation, so clicking them said "Nothing interesting happens."

- Every character is written individually: their own voice, a topic menu, and a goodbye. There are no shared line pools.
- The writing is original. It does not reproduce RuneScape's dialogue or quest stories.
- Dialogue only: no items, quest starts or variable changes, so it cannot interfere with quests, minigames or saves.
- One file per NPC in `scripts/`, named after the NPC's config id.
- NPCs whose names tie them to quests are intentionally left alone.

## Status
Written one character at a time on the `feat/npc-voices` branch. A batch is merged to `main` only after it compiles in an **isolated** copy of the world and has been talked to in-game there.

## Installing (after an approved restart only)
1. Back up the live world (saves and content).
2. Copy `scripts/*.rs2` into the active content at `scripts/joshrs_original/scripts/`.
3. Start the server normally. It rebuilds the packs on startup.
Never copy into the live content while people are playing.

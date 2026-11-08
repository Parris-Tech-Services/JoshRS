# quest_wanted - Wanted! (377)

JoshRS-original condensed reconstruction (released 2005-08-08, Members, 1 QP).

- Varp: `quest_wanted` (cache varp, made permanent by the batch-4 patch).
- Start NPC: `wanted_savant` (Temple Knight contact; Sir Tiffy Cashien has no cache NPC).
- Chain: the Savant sets you on the murderer Solus Dellagar -> `wanted_solus1` taunts you and vanishes -> confront him again to spawn the attackable `wanted_solus_attackable` (Feud-style `npc_add` + `npc_setmode(opplayer2)`) -> defeat him in normal combat (death detected in `[ai_queue3,wanted_solus_attackable]`) -> complete, 1 QP + `wanted_solus_trophy`.
- NOT IMPLEMENTED: the cross-Gielinor disguise chase (solus2-solus19 forms), the Black Knight fortress siege.
- Verified against npc.pack/obj.pack names; no opnpc1 collisions for the NPCs used.

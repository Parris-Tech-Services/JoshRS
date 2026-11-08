# quest_ratcatch - Rat Catchers (377)

JoshRS-original condensed reconstruction (released 2005-10-10, Members, 2 QP).

- Varp: `main_ratcatch_var` (cache varp, made permanent by the batch-5 patch).
- Start NPC: `ratcatcher_chiefguard` (rat pits beneath East Ardougne; Gertrude, the canonical giver, already has two opnpc1 handlers in the pinned content).
- Chain: the chief guard gives `ratcatchers_poisonedcheese` -> place it in the tunnels (`[opheld1,ratcatchers_poisonedcheese]`) -> he gives `ratcatchers_smokey_weedpot` -> smoke the nest chamber (`[opheld1,ratcatchers_smokey_weedpot]`) -> complete, 2 QP.
- NOT IMPLEMENTED: the Ardougne rat pits minigame, cat training, the various ratcatcher NPCs.
- Verified against npc.pack/obj.pack names; no opnpc1 collisions for the NPCs used.

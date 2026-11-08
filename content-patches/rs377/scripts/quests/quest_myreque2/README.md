# quest_myreque2 - In Aid of the Myreque (377)

JoshRS-original condensed reconstruction (released 2006-03-30, Members, 2 QP).

- Varp: `myreque_2_main_var` (cache varp, made permanent by the batch-5 patch).
- Start NPC: `burgh_rescue_veliaf_hurtz_talk` (Veliaf Hurtz, Burgh de Rott; `route_veliaf_hurtz` is owned by quest_myreque from batch 2).
- Chain: Veliaf gives a `sickle_mould` -> cast a `silver_sickle` with a `silver_bar` (`[opheld1,sickle_mould]`) -> bless it at the nature grotto altar (`[opheld1,silver_sickle]` -> `silver_sickle_blessed`) -> return it to Veliaf -> complete, 2 QP.
- NOT IMPLEMENTED: the Burgh de Rott bank/temple repairs, the juvinate fight, the Drezel scenes.
- Verified against npc.pack/obj.pack names; no opnpc1 collisions for the NPCs used.

# quest_deal - Rum Deal (377)

JoshRS-original condensed reconstruction (released 2005-08-30, Members, 2 QP).

- Varp: `deal_quest` (cache varp, made permanent by the batch-4 patch).
- Start NPC: `deal_pete` (Port Phasmatys dock).
- Chain: Pirate Pete ferries you to Braindeath Island -> Captain Braindeath (`deal_captian_braindeath`) needs blindweed, stagnant water and a blessed wrench -> 50% Luke (`deal_50luke`) gives a `deal_blindweed_seed`, planted via `[opheld1,deal_blindweed_seed]` -> the Captain trades the `deal_blindweed` for a `deal_stagnant_bucket` -> hands you his `deal_wrench` -> Davey (`deal_davey`) blesses it into `deal_wrench_blessed` -> return it to complete the 'rum' brew. 2 QP.
- NOT IMPLEMENTED: the zombie pirate siege, fever spiders, the 'rum' itself as a reward item.
- Verified against npc.pack/obj.pack names; no opnpc1 collisions for the NPCs used.

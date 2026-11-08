# Rag and Bone Man (10 April 2006) — 377-native original-dialogue port

**Status: source compile and disposable server boot PASS; real client quest and wish-list playthrough NOT VERIFIED.**

## Native implementation

- Eight-bone initial quest (goblin, bear, ram, unicorn, giant rat, giant bat, monkey and medium frog). Rewards and quest-point flags cannot be duplicated through stale queues.
- The additional **27** cache-defined bone types are now handled as a separate **post-quest** wish list, not an extra prerequisite for the first eight. The existing 35-entry `rag_bone_tables.rs2` and two permanent bitmasks record which polished bones were actually handed over; turn-ins can be partial and are reflected in the list/journal.
- On all 27 extra bones, the Odd Old Man offers a bonesack or ram skull helm, awards one original-era quest point and 5,000 Prayer XP exactly once. Players may exchange only while physically carrying their currently owned reward, so duplicate items are not created. (The additional quest point was removed in later official versions.)
- Fortunato's pinned vinegar shop unlocks when the 377 quest is started and the merchant conversation sets `rag_wine`. The existing `rag_bone_2` varp, covering boiler state and merchant/reward flags, is now permanent.
- Boiler validates item indices, fuel/step state, delayed activity and inventory space before releasing cleaned bones.
- No new proprietary models, NPC IDs, dialogue transcripts, map data or cache files were imported.

## Not yet complete or proven

- **Bone drops:** the original 27 NPC drop sources, real monster defeat/drop odds, NPC spawns and access to required zones have **not** been independently wired or checked against actual 377 gameplay. The 27 bone records and turn-in code are present; gathering them legitimately is still unverified.
- Persistent pot-boiler object visual state and anti-race behaviour under simultaneous clicks/relogs need real-world tests. Historical stages, text, rewards and difficulty need client validation.
- Some 2006 quest prerequisites may not yet be implemented in JoshRS. The post-quest skull helmet/bonesack swap path requires the item to be carried, not equipped or banked; recover/drop/reclaim policies need verification.
- Family save/SQLite preservation, all 35 genuine bone kills/boil/turn-ins, Prayer XP, QP, reward swap, purchase, disconnect/relog, and dual-client gameplay remain unverified.

## Test

Native patches 0001–0019 are compiled with the pinned content and engine in the isolated `.github/workflows/batch-quests-disposable-377.yml` job. The source regressions live in `content-factory/tests/test_ragbone_eight_and_vinegar_contract.py` and `test_rag_extra_wishlist_contract.py`. Passing CI proves the native pack compiles and a separate test server boots; **it does not prove a real full quest was completed**.

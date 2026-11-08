# JoshRS quest acceptance audit 001/077 — Cook's Assistant

Audited: 8 November 2026  
Target: Windows JoshRS, revision 377. Pinned reference: LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50.  
Status: **PARTIALLY IMPLEMENTED — NOT FULLY PLAYABLE/VERIFIED**.

This is a **direct pinned-source and map-object audit**, not a completed 377 player playthrough, an installation check, or proof that actual player saves persist. A separate RS-SDK revision-225 bot completion must not be counted here.

## Source checks (14 pass, 1 fail)

| # | Requirement | Source-level result | Evidence |
|---|---|---|---|
| 1 | Cook NPC exists at Lumbridge Castle kitchen | PASS | NPC 278, map `m50_50` tile (0,9,15) → (3209,3215) |
| 2 | Talk-to Cook triggers quest start, progress, post-completion conversation | PASS | `[opnpc1,cook]` chooses on `%cookquest` |
| 3 | Consent, quest start and journal | PASS | `%cookquest=1`; progress call and quest journal |
| 4 | Permanent progression | PASS (source) | `[cookquest] scope=perm`; complete value 2 |
| 5 | Egg obtainable without combat | PASS (definition + spawn) | Item 1944; map `m50_51` egg spawns (3226,3301) and (3229,3299) |
| 6 | Empty pot obtainable | PASS (definition + spawn) | Item 1931; map `m50_50` (3209,3214) |
| 7 | Empty bucket obtainable | PASS (definition + spawn) | Item 1925; map `m50_51` (3225,3294) |
| 8 | Milk gathering | PASS (source) | Dairy-cow loc 8689 on `m50_51`; `[oploc1,fat_cow]` → `[queue,milk_cow]`; 1925 removed, bucket_milk 1927 awarded |
| 9 | Wheat gathering | PASS (source) | Wheat loc 313 in `m49_51`; `[oploc2,wheat]` grants grain 1947 |
| 10 | Windmill hopper and controls exist | PASS (definition + map) | Hopper 2714 on floor 2 `m49_51` tile (30,43); controls 2718 floor 2 tile (30,41) |
| 11 | Mill flour conversion | PASS (source) | Hopper wheat insert → lever increments `%flour` → flour-bin with empty pot produces item 1933 |
| 12 | All 3 ingredients checked and consumed | PASS (source) | Inventory predicates for `egg`, `bucket_milk`, `pot_flour` followed by one deletion each |
| 13 | Quest-complete logic | PASS (source) | Queue sets `%cookquest=2`, calls `stat_advance(cooking,3000)` (300 XP display) and quest complete; QP constant = 1, QP aggregate references it |
| 14 | Cook's special range loc exists | PASS (definition + map) | Loc 114 in `m50_50` (3212,3215); configured as cooking oven |
| 15 | After quest, using food on special range cooks it | **FAIL — known TODO** | `[oplocu,cooksquestrange]` contains commented-out `@attempt_cook_item(last_useitem)`, not executable. Shared cooking code knows cook-o-matic success chances, but this exact item-use interaction must be repaired and tested. |

### Essential versus supporting NPCs

- **Required:** Cook, ID 278 — placed and direct Talk-to handler found.
- **Supporting / optional guidance:** Millie Miller, ID 3806, at windmill `m49_51` (3168,3307); Gillie Groats, ID 3807, at cow field `m50_51` (3254,3274). Both spawn in the map. Their direct **Talk-to** dialogue has **not** been positively traced in this pinned audit; neither is required by the three-ingredient hand-in.
- **Required enemies:** none. Combat is not a mandatory quest stage.
- **Required skills / prerequisite quests:** none in this quest's core code. Other quest prerequisite integration is separate.

### Unresolved verification boundaries

- **Source vs actual engine:** Raw maps and handler declarations establish source inclusion, not that the exact installed JoshRS pack exposes the correct clicking and client interactions. Hopper/cow loc category routing, map path/collision, ladders and floor transitions need a real client check.
- **Item acquisition:** Empty bucket and pot, egg, cow milk, wheat, hopper, lever and flour-bin have identifiable scripts/maps but no recorded end-to-end 377 player acquisition trace.
- **Dialogue:** Need to test each quest branch (decline, accept, no items, partial items, all items), optional Millie/Gillie Talk-to and completion/repeat behaviour.
- **Rewards:** XP/QP and removal logic source-reviewed; confirm precisely +300 XP, +1 QP, exactly 1 each removed, no duplicate rewards.
- **Permanent save:** `scope=perm` is configured, but **not tested after logout/login**.
- **Real-world CI:** A recent Windows bootstrap job failed on an external Gradle download (HTTP 504), not on a quest assertion. Do not interpret static CI as a quest acceptance result.

## Reproducible test plan — independent disposable revision 377

1. Confirm pinned source/overlays and Windows installed hashes. Snapshot an isolated test world/database and use a new non-family test account; never touch the Elrothiro or Sylvie saves.
2. Login and find the Cook at (3209,3215), talk, refuse, then accept; verify quest changes 0→1 and journal.
3. Collect the pot (3209,3214), egg (3226,3301 or 3229,3299), and bucket (3225,3294) using ordinary in-game clicks. Inspect inventory state after each.
4. Milk a mapped dairy cow with the empty bucket; show bucket_empty→bucket_milk. Collect grain from wheat and use the hopper/lever/flour bin to make pot_flour. Test upstairs/downstairs transport.
5. Return to Cook: test partial inventory dialogue; present three ingredients and verify one of each removed, quest 1→2, reward scroll, XP +300 and QP +1, and no repeatable grant.
6. After completion, use valid raw food on the Cook's range; confirm special burn chance behaviour. **This currently has a known source TODO and cannot be marked complete until repaired.**
7. Logout and relog, confirm quest, points, XP, inventory and range unlock persist.
8. Save redacted client/server logs, step results, revision/overlay SHA, and screenshots for this exact commit.

**Acceptance**: every required step must pass on installed Windows revision 377, including the range and relog. Until then, the main spreadsheet's green Y is only a source-coverage marker.

## Pinned sources

- [Quest script](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/quests/quest_cook/scripts/quest_cook.rs2)
- [Cook NPC handler](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_lumbridge/scripts/cook.rs2)
- [Quest journal](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/quests/quest_cook/scripts/cook_journal.rs2)
- [Permanent quest varp](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/quests/quest_cook/configs/quest_cook.varp)
- [Special range config](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/quests/quest_cook/configs/quest_cook.loc)
- [Cow milking](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/general_use/cow_milking.rs2)
- [Windmill](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/general_use/windmills.rs2)
- [Wheat pickup](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/general_use/scripts/pickables.rs2)
- [Cooking mechanics](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/skill_cooking/scripts/cooking.rs2)
- [Quest point registry](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/general/scripts/quests.rs2)
- [Map placements](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/maps/m50_50.jm2), [chicken/cow](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/maps/m50_51.jm2), [windmill/wheat](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/maps/m49_51.jm2)
- [Pack IDs](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/pack/obj.pack), [locations](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/pack/loc.pack), [NPCs](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/pack/npc.pack)

Last checked by read-only source inspection. No game files were changed and no gameplay success was fabricated.

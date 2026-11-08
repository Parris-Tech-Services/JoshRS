# JoshRS quest acceptance audit 003/077 — Romeo & Juliet

Date: 9 November 2026 (Australia/Sydney). Target: Windows/native revision 377, pinned LostCityRS/Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.  
**Verdict: SOURCE AUDIT AND PROPOSED REPAIR; FULL END-TO-END 377 GAMEPLAY NOT VERIFIED.**

Source audit here means actual pinned quest scripts, NPC/item IDs, raw map placements, and a compiled disposable build when CI evidence is attached. It is **not** a player-client completion, cutscene test, save persistence test or proof the user's installed Windows world contains this patch.

## Quest dependency inventory

| Requirement | Pinned source evidence | Status |
|---|---|---|
| Start with Romeo or Juliet | [Romeo](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts/romeo.rs2) NPC 639 at `m50_53` tile (0,11,33) = (3211,3425); [Juliet](https://github.com/LostCityRS/Content/blob/44eab09081ef0f6c5f3eaabd1897a588ad7d9e50/scripts/areas/area_varrock/scripts/juliet.rs2) NPC `juliet_multi_visible`, ID 3323, first floor `m49_53` tile (1,22,33) = (3158,3425) | SOURCE CONFIRMED; dialogue and navigation not live tested |
| Obtain Juliet's letter | Item `julietmessage` ID 755; Juliet issues at stage 0 or 10, sets stage 20. Lost-message reissue stage 20; bank must be checked. | SOURCE FIX 0033: prevent false hand-in/progression and full-inventory loss |
| Hand the letter to Romeo | Romeo stage 20 consumes exactly one letter and sets stage 30 | SOURCE FIX 0033: reject absent or banked message |
| Father Lawrence | NPC ID 640, `m50_54` at (3254,3484). `[opnpc1,father_lawrence]` has explicit stage 30→40 transition | **PRESENT**: earlier October "missing transition" was a false negative |
| Apothecary | NPC ID 638, `m49_53` at (3195,3404). `[opnpc1,apothecary]` has explicit stage 40→50 transition | **PRESENT**: earlier October "missing transition" was a false negative |
| Cadava berries | `cadavaberries` item ID 753, three ground spawns in `m51_52`: (3266,3361), (3273,3375), (3277,3370); one berry consumed by Apothecary | SOURCE CONFIRMED; actual click/pickup and respawn NOT TESTED |
| Cadava potion | `cadava` item ID 756; Apothecary consumes one berry and awards one potion; Juliet requires it, consumes one, sets stage 60 | SOURCE CONFIRMED; actual inventory transitions NOT TESTED |
| Complete at Romeo | Stage 60 handler queues `romeo_and_juliet_complete` which sets stage 100 | SOURCE FIX 0033: completion queue must still be at stage 60; prevents repeat/stale reward |
| Quest journal and QP | Permanent `[rjquest] scope=perm`; `^romeojuliet_complete=100`, `^romeojuliet_questpoints=5`, quest-points aggregation and journal handler | SOURCE CONFIRMED; real QP state and logout/relogin NOT TESTED |
| Combat, prerequisite quests/skills | None required by pinned quest scripts and period walkthroughs | NO COMBAT REQUIRED |
| Optional scene NPCs | Draul Leptoc ID 3324 and Phillipa ID 3325 spawned in `m49_53`. Main 377 scripts only have ordinary NPC dialogue for the protagonists. | CINEMATIC/SCENE PARITY NOT CONFIRMED |

### Stage graph — verified by direct handler inspection

`0 → 10` Romeo accepts (or `0 → 20` Juliet independently begins by giving letter) → `20` Juliet delivers letter → `30` Romeo receives letter → `40` Father Lawrence advises potion → `50` Apothecary requests berries → `60` Juliet receives potion → `100` Romeo closes quest.

This corrects the older [Varrock October stage ledger](../harvest/VARROCK_QUEST_STAGE_QA_2026-10-31.json): the `30→40` and `40→50` branches are explicitly implemented in `father_lawrence.rs2` and `apothecary.rs2`. The October report's two `unverified` transitions were **source-inspection gaps**, not missing scripts.

### Actual source issues and patch

Proposed [patch 0033](../../../content-patches/rs377/patches/0033-romeo-juliet-quest-item-and-reward-guards.patch) changes only three existing RuneScript files.

1. **Romeo missing-letter skip:** A player with quest stage 20 could talk to Romeo with no `julietmessage` in their carried inventory and reach stage 30, even if they had lost or banked the letter. The handler now distinguishes banked and missing items and refuses to advance until the letter is carried.
2. **Juliet full-inventory loss:** Initial letter hand-in set stage 20 even if no inventory slot was available; the reissue branch could also claim to give an item while full. Both paths now require a free slot first.
3. **Repeat queue reward:** Queue handler did not check the expected pending stage 60 before setting 100 and showing completion. The queue now refuses executions from any other stage; repeated/stale executions cannot regrant the quest reward after the first state update.

The original stage graph, five-quest-point reward and one-berry recipe remain unchanged.

### Historical parity caveat

Contemporaneous 2004 guides, including [Sal's Realm (17 August 2004)](https://runescape.salmoneus.net/archived-projects-and-content/site-content/quests/romeo-and-juliet.html) and [archived RuneHQ/LostHQ (31 March 2004)](https://2004.losthq.rs/?p=questguides&quest=romeojuliet), document the Juliet potion scene and final crypt scene. The pinned `quest_romeojuliet.rs2` / protagonists' dialogue source does **not** itself show those cinematics. Both source-to-renderer integration and presence of correct scenes on the user's actual build remain **unverified**, not claimed complete. The final dialogue-only quest stage could be playable without historical audiovisual parity; that is **not** the user's 100%-parity acceptance standard.

### Native checks and live acceptance gate

- [Pinned-source acceptance checker](../../../content-patches/rs377/tools/check_romeo_juliet.py) verifies six stage transitions, four core NPC scripts/placements, three item IDs, three ground-spawn locations, item loss/reissue safeguards, one-berry conversion, 5 QP reward and persistence configuration.
- [Disposable 377 batch compilation](https://github.com/Parris-Tech-Services/JoshRS/actions/workflows/batch-quests-disposable-377.yml) must pass with 0033 before merging.
- The guarded Windows files `JoshRS-Fix-RomeoJuliet.cmd` and `deploy/jparris-windows/Install-RomeoJuliet377.ps1` are read-only by default, protect family saves, require a stopped game server, and provide verified source+pack backups with rollback if native compile fails.
- Never interpret source/compile/boot as evidence of UI dialogue, actual NPC click, berry pickup, potion, cutscene, reward or relog success.

To certify **FULLY PLAYABLE**: On a disposable revision-377 test account/world, exercise (a) Romeo-first and Juliet-first starts, refusals, and full-pack refusal, (b) message hand-in, loss, bank, replacement, and correct inventory delta, (c) Father Lawrence stage 30→40 and Apothecary 40→50, (d) berry pickup and one-for-one potion, (e) potion hand-in and Romeo completion exactly once with +5 QP, (f) all scene/NPC interaction and historically required animations, and (g) save/relog after partial quest and completion, with redacted logs/screenshots, source SHA and assertion-by-assertion outcome. No player/family saves were accessed for this source audit.

# JoshRS: outstanding work register (31 October 2026)

**Status: PARTIALLY COMPLETE.** This register consolidates open work. The GitHub issues are the **actionable task lists**, while the documents below hold supporting evidence. A code directory, CI pass, NPC definition or factory candidate is not a working game feature.

## Target separation

- **Personalised JoshRS revision 377** on JParris Desktop: private Lost City engine/client/content, original customised world, Elrothiro account/save. This is **not** the Woodlands website.
- **Original Woodlands independent MMO**: [114-task classic MMO checklist](../../docs/FULL_CLASSIC_MMO_CHECKLIST.md), [hosting/asset rights gate #3](https://github.com/Parris-Tech-Services/JoshRS/issues/3), [free self-contained multiplayer goal #5](https://github.com/Parris-Tech-Services/JoshRS/issues/5). No claim of public historical game hosting or free-cloud suitability.
- **Open-source RuneScape ecosystem benchmark**: independent research; do not mistake other projects' source files for content already implemented in JoshRS.

## Completed evidence checks this pass

- [x] Inspected [open-source research audit](../../docs/377_OPEN_SOURCE_GAMEPLAY_COMPLETENESS_AUDIT_2026-10-31.md), [content recovery backlog](CONTENT_RECOVERY_BACKLOG_2026-10-30.md), [377 feature audit](../../docs/fedora-377/FEATURE_AUDIT_2026-10-30.md) and existing open release-gate issues.
- [x] Verified against **pinned OpenRSC commit `273e630b6ab0e875878038ea4cf60d5c7c89a839`** that Shield of Arrav completion runs through King's NPC handler; Holy Grail completion runs through King Arthur in `MerlinsCrystal.java`. Both require appropriate quest/item state. These are source traces, **not** playable quest completions.
- [x] Verified that six named quest roots under **pinned Lost City Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`** contain configurations only, **not .rs2 scripts inside those roots**. See below. This does not establish whether game logic lives elsewhere.
- [x] Created separate tracked issues [#28](https://github.com/Parris-Tech-Services/JoshRS/issues/28), [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29) and [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30).
- [x] Retained the existing documented recognition of law/nature runes, chisels, moulds and jewellery handlers. Do not resurrect speculative merchant duplicates.

## P0 — open work that affects correctness

- [ ] **[#29 — actual broken 377 interactions](https://github.com/Parris-Tech-Services/JoshRS/issues/29)**: prove before fixing any banking, shop, staircase, ladder, quest door, tool, resource or inventory interaction. Specific candidates: Haunted Manor secret-door/bookcase and Troll Romance sled/boss.
- [ ] **[#28 — quest-by-quest cross-project completeness](https://github.com/Parris-Tech-Services/JoshRS/issues/28)**: map each game to historically correct quest denominator, trace start/progression/ending/reward, deduplicate forks, and produce per-quest *source* vs *player-tested* ledgers. OpenRSC's 50/50 quest source entries is not 50/50 playtested.
- [ ] **Exact pinned 377 configuration-only quest root review (part of #28):**

| Source root | Contents checked | Likely historical quest/system | Remaining question |
|---|---|---|---|
| `quest_100` | `configs/100.loc` | Recipe for Disaster (100th quest) | Are stage, interactions and completion implemented outside this root? |
| `quest_fever` | `configs/fever.loc` | Cabin Fever | Search all other source files and runtime scripts for interactions and completion |
| `quest_mm` | `configs/mm.loc` | Monkey Madness | Locate actual stage/quest/reward handlers, if any |
| `quest_mortton` | `configs/quest_mortton.constant` | Shades of Mort'ton | Stage constants alone are not executable minigame/quest logic |
| `quest_mourning2` | `configs/mourning2.loc` | Mourning's Ends Part II | Locate puzzle, stages and reward code |
| `quest_rd` | `configs/rd.loc` | Recruitment Drive | Locate quest/puzzle stage handlers elsewhere |

Names are working mappings from source prefixes/config names, **not** audited historical-quest IDs. The pinned folder check is complete; whole-repository trigger mapping and gameplay tests remain open.

## P1 — gameplay acceptance and source compatibility

- [ ] **[#30 — local client + VM, persistence and Elrothiro restore](https://github.com/Parris-Tech-Services/JoshRS/issues/30)**. First read `runtime/jparris-377/active.json`; make a verified offline, consistent snapshot before writing; test only with disposable accounts/save copies. Preserve private credentials and original character data.
- [ ] Compare Luna's Barrows and Castle Wars, Void's quests/minigames, OpenRune's boss/skill mechanics and 2009Scape's quest implementations **only after** verifying a true missing or broken 377 behaviour and checking rights/engine version. #28 / #29.
- [ ] Prove 377 browser client interoperability and safe authentication in a disposable environment: [browser bridge](../../tools/web377-bridge/README.md) is **transport-only**, not proof of login; do not expose raw game TCP or reuse test keys.
- [ ] Verify optional original Woodland Guide gameplay on the actual 377 installation; source build/boot isn't sufficient. [Native 377 integration](../../docs/377_NATIVE_CONTENT_INTEGRATION.md).

## P2 — independent Woodlands world, not the 377 game

- [ ] **[#3 — asset rights and historically exact world public release gate](https://github.com/Parris-Tech-Services/JoshRS/issues/3)**. No Jagex-owned assets on a public game host without permission.
- [ ] **[#5 — zero-subscription independent persistent MMO](https://github.com/Parris-Tech-Services/JoshRS/issues/5)**. Current original Woodlands remains distinct from a full-featured, persistent multiplayer world; no paid deployment permitted.
- [ ] Continue the [classic MMO checklist](../../docs/FULL_CLASSIC_MMO_CHECKLIST.md) with feature-by-feature live acceptance rather than checkbox inference.

## Evidence policy

**Source traced:** exact repository, full SHA, path, handler, state/reward effects. **Compiler verified:** relevant build and tests at pinned SHA. **Player verified:** real client action, quest/activity end state, persistence and recovery proof. Do not assign a whole-game completion percentage without historical denominator and per-feature acceptance evidence. Broken/access-blocked runtime tasks remain OPEN, not marked fixed.

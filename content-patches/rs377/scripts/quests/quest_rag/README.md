# Rag and Bone Man — 10 April 2006 (377 native overlay)

**Status: SOURCE IMPLEMENTATION / disposable 377 compilation required; no real-player gameplay verification yet.**

The pinned `LostCityRS/Content` at `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50` already contains the 2006 `rag_*` item names, Fortunato's `rag_wine_merchant` and the **complete** `wine_vinegar_merchant` stock in `scripts/_unpack/727/all.inv`. Do not create duplicate items or merchants.

## Working source changes in this overlay

- **First quest: eight required bones**, not all 35. Exact quest indices from the existing original mapping: 0 goblin, 1 bear, 2 ram, 3 unicorn, 4 giant rat, 5 giant bat, 14 monkey, 32 big frog. The other 27 belong to a separate wish-list flow and are not silently required to earn the first quest point.
- Retains the original 35-entry bone/pot/polish catalogue for future expansion; the first quest's journal shows 0–8 and the Odd Old Man only consumes required bones.
- Rewards are guarded by the started state and all eight hand-ins, preventing repeated quest-point screen/reward calls on stale queue events.
- Fortunato's `Talk-to` handler reveals vinegar only after beginning the members quest, by setting the existing `rag_wine` varbit. Patch `0015` changes the *existing* shop dispatcher to use its **already configured** 500-jug `wine_vinegar_merchant` stock only when unlocked. The free shop remains unchanged.
- Patch `0014` makes the existing `rag_bone_2` varp permanent: the vinegar flag and pot-boiler state no longer disappear from the server-side save on logout.
- The pot-boiler now guards its bone index, slot availability and delayed completion to avoid empty-state item creation, accidental inventory loss and duplicate hand-ins.

## Still incomplete

- The **27-bone extra wish-list miniquest** must be separately implemented, with its own completion/rewards.
- Enemy-specific bone drops are not verified; neither are the 377 map/NPC spawn, quests' stage numbers, 2006 dialogue, shop purchase UX, full cooking/boiler loop after logout or real client access.
- The pot-boiler currently uses basic logs only; support for every combustible log type needs an accurate inventory/action audit.
- The 2006 original quest reward details, potential helmet/bonesack/wine-stealing side quests and game-entry progression need authoritative gameplay evidence.

## Validation boundary

The disposable build job `.github/workflows/batch-quests-disposable-377.yml` applies patches 0001–0015, compiles the scripts/packs against pinned content and boots an isolated world. Source contract tests are in `content-factory/tests/test_ragbone_eight_and_vinegar_contract.py`. Even a green CI result **does not** certify a real player bought vinegar, polished bones, completed the quest or logged back in with progress intact. Preserve existing family-world saves.

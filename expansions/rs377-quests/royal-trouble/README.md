# Royal Trouble — JoshRS independent post-revision-377 quest (22 May 2006)

**Owner:** ChatGPT. **Issue:** #309. **Status:** PARTIAL SOURCE IMPLEMENTATION, not yet playable or installed.

This quest is **outside** Claude's 10 November desktop audit of the 104 historical revision-377 quest-list entries, and is outside DeepSeek's 20 missing items assigned from that list. Work here never edits their quest files or the family game.

## Scope built in this branch

- New **per-player, permanent** `joshrs_royaltrouble` varp (slot **725**, appended only to a disposable copy of pinned `pack/varp.pack` after verifying slot 724 is the original final entry and 725 is unallocated); new stage constants and story dialogue in a separate `expansions/rs377-quests/royal-trouble` subtree.
- Starting conversation with Advisor Ghrim, royal children, King Vargas; Miscellania and Etceteria citizen theft interviews; Queen Sigrid; sailor; eventual king's permission to enter the dungeon.
- Stage progression requires dialogue and actual in-world NPC interaction (no script-only stage-jump, variable edit, teleport, grant or fake quest completion). Original dialogue written specifically for JoshRS, not an exact copy.
- Discrete, idempotent disposable-content installer with read-only default and absolute path, marker, NPC-pack, existing-dialogue collision and content-overwrite checks.
- Local synthetic tests and pinned LostCityRS Engine-TS/Content native compile and temporary server boot in GitHub Actions. The CI first compiles the **unaltered pinned content with BUILD_VERIFY=true**, then applies the new varp ID and builds it with checksum matching disabled *only for the altered disposable pack*, verifying that the only tracked change is `pack/varp.pack`. Do not disable these checks in production.

## Native 377 evidence

Pinned original engine `LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb`; content `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`.

Character IDs and placement from native NPC packs and maps:

| NPC / world | Native NPC ID | Placement |
|---|---:|---|
| Advisor Ghrim | 1375 | `m39_60` level 1, local (3,17) |
| King Vargas | 1373 | `m39_60` level 1, local (5,19) |
| Prince Brand | 1371 | `m39_60` level 1, local (6,12) |
| Princess Astrid | 1372 | `m39_60` level 1, local (6,28) |
| Gardener | 1398 | `m39_60` level 0, local (29,10) |
| Lumberjack | 1395 | `m39_60` level 0, local (54,29) |
| Miner | 1396 | `m39_60` level 0, local (30,53) |
| Sailor | 1385 | `m40_60` level 0, local (21,7) |
| Fisherman | 1397 | `m40_60` level 0, local (16,12) |
| Queen Sigrid | 1359 | `m40_60` level 1, local (52,37) |
| Etceteria citizens | 1361, 1362, 1364, 1365 | `m40_60` level 0 |

The native `misc_quest` (varp 359) belongs to **Throne of Miscellania**, but we could not prove its completed stage in the pinned content; the source has no complete Throne quest implementation. A provisional **fail-closed** gate of `%misc_quest >= 10` exists in the new start handler **only as a development safeguard, NOT as verified parity**. Do not activate in any player world before the actual completed-stage value is verified from source/evidence.

## Missing content, blockers, and next acceptance

**NOT IMPLEMENTED:**
1. Correct and playable Throne of Miscellania completion, including real prerequisite acceptance and `misc_quest` end stage; do not grant it to characters artificially.
2. Royal dungeon entrances, permissions, underground maps, Donal, mining props, lift puzzle, coal/rope/plank, burnt diary and clue scenes. The pinned loc/obj/NPC packs do not contain the identified Royal Trouble-specific dungeon assets.
3. Giant Sea Snake (level 149), isolated boss combat, poison, legitimate loot, heavy box and return.
4. Queen's letter, hand-in to King Vargas, 1 quest point, 20,000 coins, 5,000 XP each in Agility, Slayer and Hitpoints, and expanded kingdom management economy.
5. Historical quest-journal component; the 377 client quest list doesn't include Royal Trouble.
6. Native Java-client normal NPC clicks and stage persistence/relog through every point. Script compilation, if passing, proves only the source parses/builds.

**Never** mark the quest playable, deployed, journal-listed, completed or reward-bearing based on this branch.

## Safe command to reproduce the CI source installation

```bash
node --test tools/rs377-royal-trouble/apply.test.mjs
# The marker must be added ONLY to a disposable new checkout, NEVER family content.
printf 'DISPOSABLE TEST\n' > /absolute/disposable-377-content/.joshrs-disposable-content
node tools/rs377-royal-trouble/apply.mjs --content /absolute/disposable-377-content
node tools/rs377-royal-trouble/apply.mjs --content /absolute/disposable-377-content --apply
```

For compilation use `.github/workflows/rs377-royal-trouble.yml`, which builds a fresh pinned temporary Engine-TS and Content checkout with no player saves. **DO NOT apply to** `C:\JoshRS-Launcher\JoshRS-main`, `runtime/jparris-377`, actual save backups or a running world.

Historical gameplay references (mechanics only): 
- https://oldschool.runescape.wiki/w/Royal_Trouble
- https://www.tip.it/runescape/quests/view/139-royal-trouble

Royal Trouble was released after rev377's original historical quest-list subset; the late quest must be implemented with compatible owned/licensed assets and independently verified mechanics rather than assuming modern OSRS IDs can be installed.

# The Peace Shirt: original JoshRS quest (Burgh de Rott)

An original, family-friendly quest written for the JoshRS world. It isn't based on any RuneScape quest.

Radu's goat Margareta ate Florin's best shirt, ending eleven years of evening chess. You help Radu make amends: wool for Ileana, one terrible row knitted by Radu himself, the finished shirt taken to Florin, and the two old friends back at the board.

| Stage (`varp_724`) | What happens | Who |
|---|---|---|
| 0 → 1 | Ask Radu about Florin (topic 3), offer to help ("Quest started: The Peace Shirt.") | Radu |
| 1 → 2 | Bring Ileana **3 balls of wool**. Fewer than 3: she explains and keeps nothing | Ileana |
| 2 → 3 | Radu knits his row (a funny, diagonal row) | Radu |
| 3 → 4 | Ileana finishes the shirt | Ileana |
| 4 → 5 | Persuade Florin. Flattery or "because I said so" sends you back to try again; the honest answer works | Florin |
| 5 → 6 | Tell Radu: quest complete | Radu |

**Rewards:** 1 Quest Point, 450 Crafting XP and 300 coins (paid once). Afterwards, Radu, Florin and Ileana each say something new.

**Journal:** this isn't in the Quest List. Adding a quest-list entry would change the client's interface cache. Instead, while the quest is in progress, Radu, Ileana and Florin open with what you need to do next.

## Technical design
- Progress is stored in **`varp_724`**, a spare varp that already exists in the revision-377 cache and is unused by any script or save. The installer adds `scope=perm` so it's saved with the character. `scope` is server-only, so the client cache and the packer's `.varp` checksum are unchanged. A *new* varp fails the packer's safety check ("`.varp checksum mismatch`").
- The quest point comes from one line added to `[proc,count_questpoints]`, and completion calls `~update_questpoints`, the same way native quests work.
- NPC hooks are in `expansions/npc-voices/scripts/burgh_vilager_{3,5,8}.rs2`. Outside the quest, those characters keep their original conversations.

## Install
```powershell
node install.mjs --content <isolated content dir>            # dry run
node install.mjs --content <isolated content dir> --apply    # backs up every changed file
node --test install.test.mjs
```
The active family world is refused unless `--allow-active` is passed, which is only for an approved, offline, backed-up deployment. Rebuild packs afterwards (`npm run build`).

## Evidence (isolated revision-377 world, 10 Nov 2026)
Driven over the real 377 protocol by `tools/rs377-quest-playtest/dialogue_test.mjs`. That covers Talk-to, "Click here to continue", menu choices, every dialogue line recorded, logout/login, and the save read back after each check.

- `evidence/playtest_full.json` → `evidence/playtest_full_transcript.txt`: **37/37 checks pass**:
  - Declining keeps stage 0. Accepting goes to stage 1.
  - Ileana with 0 and then 2 wool: no progress, and she keeps the wool. With 3: wool taken, stage 2.
  - Florin before stage 4: normal conversation, no progress.
  - Stages 3, 4 and 5 progress; both wrong persuasion answers loop back to the choice.
  - Completion: stage 6, 300 coins, quest points 0 → 1 (as sent to the client), still 1 after relog.
  - A repeat visit pays no second reward.
  - Every stage is checked after a logout/login.
- `evidence/multiplayer_*`: a finished player and a brand-new player talking to Radu **at the same time** keep fully separate progress (6 / QP 1 vs 1 / QP 0).
- The installer, run on a copy of the live content, produces files byte-identical to the playtested ones.

Not yet verified: playing it in the **real Java client**.

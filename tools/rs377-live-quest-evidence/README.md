# rs377-live-quest-evidence

Read-only tools that show what quests the **active** JoshRS revision-377 world really has, and what players have actually done. Safe to run while people are playing.

| Script | What it reads | What it reports |
|---|---|---|
| `quest_audit.ps1` | The active content's `.rs2` scripts, the compiled `engine\data\pack\server\script.dat`, and the quest queue in `research\rs377\QUEST_QUEUE_2026-11-08.json` | For each of the 104 quests in the 377 quest list: script folder, size, start trigger (any npc/loc/obj trigger that moves the quest variable), whether that trigger is in the compiled pack, completion call, TODO markers, and a static verdict |
| `quest_saves.ps1` | **Copies** of `engine\data\players\main\*.sav` (copied to a temp folder first) | For each quest, each player's progress: `-` not started, `started(n)`, `DONE(n)` |

```powershell
# defaults: -Root C:\JoshRS-Launcher\JoshRS-main ; finds the world through runtime\jparris-377\active.json
.\quest_audit.ps1 | Format-Table Order, Id, Lines, StartHandler, HandlerInPack, Verdict
.\quest_saves.ps1 -Players elrothiro, sylvie | Where-Object { $_.elrothiro -ne '-' }
```

## Rules

- A static verdict of `IMPLEMENTED - NOT PLAYTESTED` is **not** proof the quest can be played. Only `DONE(n)` in a real save counts as verified.
- The save tool never opens the live `.sav` files for writing, and it writes output only to its temp folder. Don't commit save copies or per-player CSVs.
- Save format: the `PlayerLoading.ts` v7 layout, where varps are stored as (u16 id, varint value) pairs. Varbits are worked out from `.varbit` definitions (`basevar`, `startbit`, `endbit`).

Results from 10 November 2026: [docs/rs377/LIVE_QUEST_AUDIT_2026-11-10.md](../../docs/rs377/LIVE_QUEST_AUDIT_2026-11-10.md).

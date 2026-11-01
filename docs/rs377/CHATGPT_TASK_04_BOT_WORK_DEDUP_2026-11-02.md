# Task 4/42 — bot-work deduplication and dependency matrix (2 Nov 2026)

Reviewed the master JoshRS backlog, AI Agents 111-task checklist, Agy 71-task checklist on draft PR #62, ChatGPT's 42-task checklist, issues #29/#30/#52/#55, and draft PRs #59/#62. These are overlapping work descriptions, **not additive counts of distinct defects**. Existing task IDs and original checkboxes remain intact.

| ID | Single deliverable | Overlapping references | Owner and prerequisite |
|---|---|---|---|
| D01 | Preserve real family world, accounts, inventory and backups | Master §1; AI §1; Agy 1–9; #29/#30/#52 | Agy/human live, ChatGPT safeguards; **P0 first** |
| D02 | Identify actual Elrothiro authoritative server and private topology | Master §1; AI §1; Agy 1–4,19–28; ChatGPT 5,10,13–18 | Agy live, ChatGPT diagnostics; after D01 |
| D03 | Repair observed real NPC/loc/party interactions | Master §2; AI §3; Agy 27,41,53–55; #29 | ChatGPT source/Agy live; after D01/D02 |
| D04 | Pinned SDK and safe Fedora bootstrap | Agy 10–18,62,69; ChatGPT 6–20; PR #62 | ChatGPT source/Agy executes; independent of live server edits |
| D05 | Normal 377 login, packets, observations and guarded controller | AI §3,§5; Agy 22–28,29–36,39–48; ChatGPT 21–28,33–35; PR #62 | ChatGPT source/Agy integration; D02+D04 |
| D06 | One visible persistent bot alongside Elrothiro | AI §5,§9; Agy 29–38,65–66; ChatGPT 35,37,42; #30/#55 | Agy live; D01+D02+D05 |
| D07 | No-cheat gathering and complete Cook's Assistant | AI §4; Agy 49–59,61,67; ChatGPT 29–36; PR #59/#55 | ChatGPT tests/Agy live; D03+D05+D06 |
| D08 | Real RS-SDK gateway, bounded LLM and recovery | AI §3,§6; Agy 39–48,58–59; ChatGPT 24–31; PR #62 | ChatGPT source/Agy live; D05+D06 |
| D09 | Test gates, evidence, telemetry, rollback | AI §7–9; Agy 60–71; ChatGPT 18,20,33–42; #30/#55 | Cross-cutting, distinct fixture versus client evidence |
| D10 | Expand from one proven bot to Fred/George and others | AI §5,§9; Agy 70; ChatGPT 31,40; #55 | After D06–D08 |

## Distinct risks and nonduplicates

- **#52 Party Drop Chest** is its own P0 possible player-item-loss incident: read-only forensics, item conservation and explicit approval for any live recovery. It cannot be closed by generic backup or CI.
- **#29** concerns real broken world interactions. A source-level Haunted Manor patch does not establish live player acceptance.
- **#30** requires two genuine clients, save/relog and actual gameplay; not equivalent to green fixture tests.
- **#55** requires bot identity, autonomy, Friends, real progression and valid telemetry; a four-point patroller does not meet it.
- **PR #59** is an unmerged draft no-grant quest acceptance test, not a completed quest.
- **PR #62** is an unmerged draft source-only SDK-inspired harness/bootstrap, not a connected real-world bot.
- The 111 AI tasks, Agy's 71 and ChatGPT's 42 differ in granularity and owner. Do not sum them as unique bugs or delete their original numbers.

## Dependency order and assignment

1. **P0 D01:** protect saves, stop unsafe Party Chest changes, identify real world and backups before new live experiments.
2. **P0 D02/D04:** Agy captures actual world fingerprint; ChatGPT independently hardens bootstrap and pinned SDK tests.
3. **P0/P1 D03/D05:** reproduce native defects and implement legitimate auth/packets/observation with disposable tests, avoiding shared Player/BotPlayer edits owned by Agy.
4. **P1 D06:** prove one normal account visible and persistent on Elrothiro's exact world; requires Agy/client access and safe maintenance approval.
5. **P1 D07/D08:** no-cheat gathering/quest and actual RS-SDK integration with observed outcomes, not dispatched-only actions.
6. **P1 D09/D10:** evidence, recovery, telemetry, then expand bots only after one genuinely works.

**ChatGPT owns** repository source audits, scripts, tests, CI and source-only handoff. **Agy owns** physical Fedora/Windows runtime and genuine game-client verification. **User approval** is required for production disruption, save changes and item restoration. No live-world claim follows from this matrix.

Sources: [master backlog](../JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md), [AI checklist](AI_AGENTS_MASTER_TODO_2026-11-02.md), [Agy checklist](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/docs/rs377/AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md), [#29](https://github.com/Parris-Tech-Services/JoshRS/issues/29), [#30](https://github.com/Parris-Tech-Services/JoshRS/issues/30), [#52](https://github.com/Parris-Tech-Services/JoshRS/issues/52), [#55](https://github.com/Parris-Tech-Services/JoshRS/issues/55), [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59), [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62).

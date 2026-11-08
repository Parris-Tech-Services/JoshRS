# JoshRS 377: genuine Microsoft UFO2 Windows desktop proof

**Date:** 8 November 2026 (Australia/Sydney). **Evidence state:** windows UI inspection and native client boot **VERIFIED**; **UFO2 LLM gameplay agent, Legends' Quest and private family world NOT VERIFIED.**

## Windows computer execution, actual source

GitHub-hosted Windows machine runs the following **real** pinned upstreams, without affecting Windows family saves or accounts:

- Microsoft [UFO² Desktop AgentOS](https://github.com/microsoft/UFO) `eae3c0a8d168c47cb10df0652e293e092eda1078`.
- LostCityRS [revision-377 Java Client](https://github.com/LostCityRS/Client-Java) `327880f6de74b40c420705bc42e4b34284885087`.
- GitHub Actions native Windows runner with Python 3.10, Java 21, Gradle and Windows UI Automation.

[Successful run #42479354465](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42479354465) and [logged job #128727691764](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42479354465/job/128727691764) **passed**:

| Acceptance | Result | Actual evidence |
| --- | --- | --- |
| UFO²'s own Windows UIA control inspector imports | PASS | Pinned module `ControlInspectorFacade` |
| Disposable Notepad target found in Windows desktop | PASS | Four top-level windows, one `Untitled - Notepad` |
| Insert and independently read back Notepad text | PASS | `notepad_ui_action_confirmed=true` |
| Pinned Java 377 source compiles in Windows | PASS | Gradle `jar` completed |
| Java 377 native window launches | PASS | Actual `RS2 user client - release #377` process/window |
| UFO² captures Java client window | PASS | 781 × 542 pixel window capture |
| Actual valid RuneScape cache and game login | **NOT TESTED** | This Windows job does **not** boot the game server or log into a character |
| Model-directed UFO² HostAgent/AppAgent actions | **NOT TESTED in this run** | UIA component and keyboard were invoked by deterministic harness |
| Full Legends' Quest start-to-completion | **NOT VERIFIED** | No normal client quest stages, puzzles, combat or post-relog quest reward |

The job outputs JSON only; captured screenshots are intentionally **not** uploaded, protecting third-party visual assets and account details. Evidence artifact: `ufo2-windows-desktop-disposable-evidence` and `ufo2-native-java377-window-evidence` in [run page](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42479354465).

## What the test means

A native 377 Java client creates a Windows top-level frame accessible to UFO²'s UIA inspector. **This validates the Windows-control integration boundary.** It does not prove that the old game engine exposes its canvas-internal NPCs, dialogue choices, quests or combat through Windows UIA. Those are usually drawn pixels without ordinary Windows child controls. The independent JoshRS RS-SDK bridge should remain the authoritative source of game state.

The next true game test must run a version-pinned disposable server **and client in the same machine or securely isolated pair**, with cache and real normal game login; use UFO² vision/GUI actions *only* for client UI and use RS-SDK observer to validate each action against the server's authoritative state.

## Independent local-model experiment

A separate, opt-in-by-workflow (not family host) Windows agent trial uses a free on-runner [Ollama](https://ollama.com/) small model, **no paid API credentials**. The [model-agent workflow](https://github.com/Parris-Tech-Services/JoshRS/actions/workflows/ufo2-local-model-agent.yml) and `tools/rs377-ufo2/model_agent_probe.py` require real HostAgent/AppAgent execution and independently read the marker from Notepad; returning exit code 0 without an action **must not count**. This experiment is independent from the verified native-client detection above; final outcome to be recorded from its own run.

## Blockers and next work

- **Full Legends quest:** [issue #166](https://github.com/Parris-Tech-Services/JoshRS/issues/166), currently not genuinely playtested.
- **UFO² AI:** an LLM (local or configured API), working screenshot/vision or UIA grounding, and safe action loop are necessary for autonomous navigation. Notepad deterministic UIA smoke is not AI action.
- **Java canvas:** the game's actual interface may be a single opaque UIA canvas. Add screenshot/coordinate grounding and independent authoritative RS-SDK observations without inventing NPC choices or results.
- **Full game:** valid pinned 377 cache and a running isolated server; a 107-QP eligible disposable character for Legends; stage-specific assertions; restart-safe reward-once proof.
- **Privacy and licences:** never upload user saves, real account identities, credentials or Jagex cache/music/dialogue to the public GitHub repo. Do not run the agent on family accounts without separate safe approval.

## Model-agent experiment (separate from the proven Java window test)

- [Run #42479882952](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42479882952): installed Ollama and `qwen2.5:3b` but full agent did not start because the independent Windows verifier imported `ufo` from the wrong checkout. **FAILED**, corrected by loading the pinned inspector module by full path.
- [Run #42480425174](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42480425174): reinstalled full agent dependencies and local Ollama; real UFO2 model subprocess **did launch**, but exited 1 due to Windows CP1252 `UnicodeEncodeError` when printing a status symbol (not due to a successfully observed action). Independent Notepad marker: **FALSE**. **FAILED**. Report artifact captured.
- [Run #42481499841](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42481499841): rerun after setting `PYTHONIOENCODING=utf-8` and `PYTHONUTF8=1` for the model subprocess. **STATUS PENDING VERIFICATION** at the 8 Nov research checkpoint, not counted as success. Read its final JSON artifact/exit and independently observed Notepad marker before updating claims.

### What a future complete proof must establish

Even a successful local-model Notepad action would prove only model-directed Windows GUI automation. A full Legends playthrough additionally requires a real running 377 game/cache in the same test environment, normal character login and quest prerequisites, real NPC and location interactions, combat and puzzle actions, 4 QP/rewards and saved state after relog, with authoritative RS-SDK state confirming all effects. No current UFO2 cloud run certifies those conditions.

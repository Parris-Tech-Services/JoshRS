# Legends' Quest — cloud execution evidence, not full quest verification

**Checked:** 8 November 2026 (AEDT). **Game:** JoshRS 377. **Result:** **PARTIALLY COMPLETE: genuine disposable engine/compiler/login/movement/save test passed, full Legends' Quest playthrough BLOCKED / NOT VERIFIED.**

## Remote computer actually used

- [GitHub Actions run #201](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42467878826): `completed / success`, job `128691491142`.
- Triggering commit `f5ab3de4447bb4cae7ac7297fcacfad8383da678` modified the existing native cloud CI runner. The workflow clones immutable LostCityRS/Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, packs scripts and boots real 377 on a disposable Ubuntu machine with separate SQLite, no household data.
- Legends-specific [audit source](../../tools/rs377-legends/ci_audit.py) ran against the actual pinned Content and passed: **21 quest RS2 script files**, quest stage constants, entry NPCs, Gujuo, Ungadulu and Nezikchened source markers, journal and completion handler detected.
- Normal isolated `HarnessProbe` client: authenticated via real 377 RSA/ISAAC TCP, real 600 ms ticks, source-grounded `BotWorldState` with 21 skills, inventory/equipment, 4 visible NPCs, 48 nearby locations, normal walking, successful save/relogin and security rejection gates. These are from actual [job logs](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42467878826/job/128691491142), **not fixture simulations**.
- [Uploaded report artifact](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/42467878826/artifacts): `legends-quest-377-cloud-evidence`, artifact ID `13612108565` (GitHub retention 14 days). Report records `real_377_disposable_server_smoke=true` and `full_legends_quest_playthrough_verified=false`.

### Precisely what was not tested

The normal bot did **not** start Legends' Quest, talk to Radimus/Gujuo in quest context, bring a valid 107-QP eligible character, complete jungle mapping, the fire circle and Ungadulu rescue, jungle item/ritual puzzles, Nezikchened fights, totem turn-in or training-reward selection. There is no evidence of complete quest reward, 4 QP or post-relog guild access. The source audit's `COMPLETE-VERIFIED` is **source classification only**.

Pinned scripts still annotate uncertainty around agility obstacle/lockpick success rates, source TODOs, final boss damage and one NPC special dialogue option. These must be evaluated against actual mechanics and real client behaviour rather than automatically treated as a confirmed defect.

## Recommended AI-controlled full quest test system

**Primary:** [RS-SDK](https://github.com/MaxBittker/rs-sdk) TypeScript bot client and high-level action API, integrated with JoshRS's native authenticated 377 observer. This supports real entity queries and ordinary action intents while allowing an AI coding agent to debug/retry based on authoritative state. The existing JoshRS `tools/rs377-chatgpt-bridge/` and `tools/rs377-agent-manager/` are the starting adapters. The isolated runner proves the basics, but a complete genuine world-state feed **during** dialogue, bank/shop, puzzle and combat interactions remains to be established.

**Secondary:** [Microsoft UFO2 Windows desktop automation](https://www.microsoft.com/en-us/research/publication/ufo2-the-desktop-agentos/) or computer-use API/virtual display if the real Java client has UI details absent from the native observer. Screenshot control alone is inadequate proof of server-side quest flags.

### Engineering acceptance before a full-pass claim

1. Reproducible disposable quest-ready account: actual prerequisites verified; any test-only eligibility fixture must be explicitly labelled and **never** touch a family account.
2. Normal TCP auth and per-tick source-backed fields during interaction, including options and combat.
3. Scripted checkpoint-by-checkpoint quest stage graph; all item/loc/NPC prerequisites accessible.
4. Real inputs, real NPC/boss/puzzle effects, no direct stage mutation or item grant during the quest.
5. Completion exactly once; four skill choices, QP, Guild access and item rewards verified.
6. Mid-quest and finished save/relog; crash/reconnect and two independent clean runs.
7. Timestamped evidence, source SHA and client version, redacted artefacts and failing-stage diagnostics.

**Follow-up issue:** [#166 — complete authentic Legends' Quest autonomous playthrough](https://github.com/Parris-Tech-Services/JoshRS/issues/166). Do not mark completed until all acceptance gates pass.

# Task 38 — cross-platform source/fixture test-gate verification

**Date:** 2 November 2026 (AEDT)  
**Owner:** ChatGPT  
**Task:** Run available GitHub/Linux fixture tests and static checks, repair failures, and do not confuse CI with real Fedora/Windows host validation.

## Result and reproducible evidence

**VERIFIED COMPLETE for task 38's GitHub/Linux fixtures and static checks only.** No Fedora workstation or JParris Desktop/Windows VM runtime check has been performed.

- Source workflow: [`.github/workflows/rs377-task38-cross-platform.yml`](../../.github/workflows/rs377-task38-cross-platform.yml)
- Final passing check: [GitHub Actions run 41359096517](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41359096517), source commit [`09dabd4e074251e600a7d978cc4228318eec8a42`](https://github.com/Parris-Tech-Services/JoshRS/commit/09dabd4e074251e600a7d978cc4228318eec8a42).
- Both `Linux - source, safety and negative fixtures` and `Windows CI - PowerShell parsing and manifest only` completed with **success**.
- General [JoshRS checks](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358991858) also passed at the preceding validated source revision. The task 38 checks provide broader coverage than the general `npm test` workflow.

### What ran, on which disposable runner

| Runner | Check | Evidence |
|---|---|---|
| GitHub Linux (Node 24) | top-level `npm test`, bridge `npm run check`, controller-boundary `npm run check`, companion-contract `npm run check` | 21 + 33 + 38 + 34 = **126 passing Node tests** |
| GitHub Linux (Node 24) | bot-safety, Fedora preflight, network doctor, social preflight, Luna duel, map bridge, save inspectors, Web377 WebSocket bridge | 2 + 5 + 8 + 10 + 3 + 5 + 4 + 3 = **40 more passing Node tests** |
| GitHub Linux (Python 3.12) | content-factory regression + no-cheat bot benchmark reporter | **148 + 16 = 164 passing Python tests** |
| GitHub Linux | `bash -n` of task-15 entrypoint/fixture, offline bare-repository/worktree negative fixture, Node static checks, Python bytecode compilation | all passed |
| GitHub Windows runner | Parse **34 PowerShell scripts** using Windows PowerShell 5.1; validate upstream commit pins and game/web port offsets | all passed |

**Total:** 166 passing Node tests + 164 passing Python tests = **330 passing test cases**, plus standalone shell fixtures, syntax and manifest guards. These numbers refer to *separate test invocations*, not end-to-end game sessions.

### Failure found and repaired

- First cross-platform run [41358892383](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358892383): every actual test suite passed and Windows static checks passed; the final `test ! -e runtime` assertion failed **after** source tests generated a disposable `runtime` directory on the runner.
- Fix [`cd6dc24`](https://github.com/Parris-Tech-Services/JoshRS/commit/cd6dc242a452556c4bf44b6103456d3a575daae4): assert the pristine checkout contains no private `runtime` directory *before* fixture execution, and separately label runtime artefacts created by the CI tests.
- Fix [`09dabd4`](https://github.com/Parris-Tech-Services/JoshRS/commit/09dabd4e074251e600a7d978cc4228318eec8a42): change the workflow path filter from `tools/rs377-**` to recursive `tools/rs377-*/**` and cover top-level tools/tests so subsequent source changes trigger the gate.
- Final run 41359096517 rechecked both jobs green.

## Evidence boundary — DO NOT promote source fixtures to gameplay acceptance

| Check | Status | What is missing |
|---|---|---|
| GitHub Linux suite and Bash/Node/Python static checks | **VERIFIED** | None for source-only task 38 |
| GitHub-hosted Windows PowerShell parsing and manifest checks | **VERIFIED** | These are **not** validation on the actual Windows server or Sylvie VM |
| Fedora AVANCE-WS7 local bootstrap, active ports, SDK/engine deployment | **UNVERIFIED** | Host-owned command outputs and hashes |
| Actual JParris Desktop authoritative 377 world identity and live bot login | **UNVERIFIED** | Real server identity, disposable-account authentication and native observer evidence |
| Two real clients, Elrothiro visibility/Friends, dialogue, XP, inventory, persistence | **UNVERIFIED** | Independent client captures, real tick/state deltas and save recovery checks |
| Long-running safety and actual Windows VM input/crash stability | **UNVERIFIED** | Live host/VM observations |

No machine was remotely accessed, no live world restarted, no account save or SQLite database read/modified, and no gameplay assertion was marked successful based on fixtures. The temporary GitHub build runner may install public development dependencies; its tests are isolated from the user's private runtime.

## To reproduce on GitHub

Open [Task 38 workflow](https://github.com/Parris-Tech-Services/JoshRS/actions/workflows/rs377-task38-cross-platform.yml), select **Run workflow** on `main`, and check **both** job conclusions. The linked successful run is the verification for this delivery. Host-level checks must be separately dated, attested and attached to the relevant Fedora/Windows acceptance task, not silently inferred from this report.

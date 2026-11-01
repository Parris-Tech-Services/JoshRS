# ChatGPT task 2/42 — GitHub state and environment boundary verification

**Verified on:** 2 November 2026 (Australia/Sydney)  
**Scope:** connected GitHub (read-only inspection) and previously supplied, dated host observations.  
**Status:** **VERIFIED COMPLETE for task #2's repository-state audit**. **NOT** evidence of live-world access, live bot login, Fedora installation, or actual same-world play.

This is an evidence snapshot, not a deployment instruction. No live process, character save, account database, credential, firewall or public port was accessed or changed.

## 1. What is actually in the default branch

- Repository: [Parris-Tech-Services/JoshRS](https://github.com/Parris-Tech-Services/JoshRS), default branch **`main`**.
- [42-item ChatGPT-owned task list](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md) is on `main`; task **#2** is this verification. Task **#3** (source-specific dependency map) and other unchecked implementation work are not completed by this audit.
- [`AGENTS.md`](../../AGENTS.md) on `main` distinguishes ChatGPT's GitHub-side work from Agy's Fedora ownership and forbids assuming remote-host or live-world access.
- [Cross-project master backlog](../JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md) on `main` explicitly separates the private 377 server, original Woodlands website, Android/browser experiments and agent harnesses.
- [Parallel agent handoff](PARALLEL_AGENT_HANDOFF_2026-10-31.md) forbids competing writes to shared engine code and active-world restarts without the designated runtime owner.
- [377 launcher upstream pins](../../deploy/jparris-windows/upstreams.json) declare Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, and Client-Java `327880f6de74b40c420705bc42e4b34284885087`, with nominal game `52402` and web/cache `8888` ports. **These are versioned launcher source settings, not an attestation of current production listener state.**

## 2. What is **not** merged into `main`

| Source | GitHub state verified | What exists | What remains unproved |
|---|---|---|---|
| [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62), `feature/rs377-rssdk-claude-harness-20261102` | **OPEN, DRAFT, UNMERGED**; head `fe81f95517ccc57b76c88337c79ac3b0ef9ae323` at this inspection | `tools/rs377-agent-harness/` includes a strict isolated-world action guard, in-memory fixture, offline harness, source-only tests and Fedora bootstrap. The later `src/native377/client.mjs` implements limited TCP/login and sends movement packets (unverified dispatch). `AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md` (71 items) exists on **this branch**, not `main`. | No authenticated session observed on Elrothiro's authoritative world, no reliable incoming real-world state decoder, no confirmed real RS-SDK adapter, no observed bot movement, no actual Fedora/Windows host verification. Do not merge/deploy the draft as a working companion. |
| [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59), `test/george-no-cheat-full-quest-20261101` | **OPEN, DRAFT, UNMERGED**; head `a525cbe8e93e22e5014fc40bf34d68beb4279c43` | Stricter no-grant Cook's Assistant acceptance test proposal | No green genuine, complete normal-gameplay quest verification and no live-game evidence; do not equate the existence of the test with passing gameplay. |

**Actual source anchors inspected in PR #62:** [`guard.mjs`](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/tools/rs377-agent-harness/src/guard.mjs) enforces isolated 377/600ms/1x XP constraints; [`fixture-transport.mjs`](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/tools/rs377-agent-harness/src/fixture-transport.mjs) is explicitly fake; [`harness.mjs`](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/tools/rs377-agent-harness/src/harness.mjs) separates `unverified_dispatch` from observed changes; [`native377/client.mjs`](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/tools/rs377-agent-harness/src/native377/client.mjs) explicitly reports `hasWorldState:false`. None is a working joined-family-world bot.

## 3. Exact scope of green CI

- [Source-only harness run **41350300152**](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41350300152): completed successfully at the inspected PR #62 head. Jobs passed: Fedora bootstrap/doctor **on GitHub Ubuntu runner**, safe separate worktree fixture, isolated source syntax/tests. These are **offline fixtures**, not Fedora workstation acceptance or genuine 377 client gameplay.
- [JoshRS checks run **41350300128**](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41350300128): completed successfully at that PR head; repository tests and browser checks. They do not establish a successful real server login.
- CI results are point-in-time evidence for the above head commit. New commits need their own checks.

## 4. Environments must not be conflated

| Environment | Evidence category | Known facts | Unknown/required next evidence |
|---|---|---|---|
| **AVANCE-WS7 Fedora** | **Historical workspace notes, not live machine verification** | Previously used source workspace `/home/josh/dev/JoshRS/` (with `lostcity377`), Fedora 44 and private local engine tools. Agy's dedicated bootstrap targets a separate worktree, not the running engine. | Current Fedora branch, dirty files, listening processes, network path to target, SDK checkout/test outcome, existing active bot, and whether Fedora hosts Elrothiro's world. |
| **JParrisDesktop Windows** | **User-supplied Action1 diagnostic from 1 November 2026; point-in-time only** | `C:\JoshRS-Launcher\JoshRS-main` and `runtime\jparris-377\active.json` were reported present; web port `8888` was listening, while `52402` was **not** shown listening in that specific output. | Current game PID, game connection/login, version/source selected by `active.json`, who is logged in, and whether this remains Elrothiro's actual authoritative world. |
| **`main` GitHub / CI** | **Verified accessible sources and Ubuntu isolated CI** | Docs, 377 pins, task ownership, and static/deterministic test results. | No private saves, no live account/session or valid world fingerprint. |
| **Draft PR #62 sandbox** | **GitHub source-only fixture** | Can run isolated policy, test movement encoding and simple TCP client logic. | Has not been shown to be the real host, independent authenticated 377 client with incoming state, or connected RS-SDK controlling real gameplay. |

**World identity rule:** A host name, private IP, source checkout, branch name, or open port does not establish world identity. A valid comparison needs evidence that Elrothiro's Java client and a separate bot authenticate against the **same currently authoritative game process and world fingerprint**, and can observe each other's legitimate movement, including save/relog. A second Fedora instance with matching ports does **not** qualify.

## 5. Completed and excluded

**Task #2 verified complete:** checked the actual GitHub default-branch contracts and backlog, PR #62/#59 state and key harness modules, exact pinned source settings, and completed CI jobs; recorded host evidence grades and honest boundaries. No edits to PR #62, shared engine `Player.ts`/`BotPlayer.ts`, active scripts, game services, passwords, or player saves.

**Excluded/not completed:** task #3 source-specific dependency inventory, task #5 live topology, task #6 engine compatibility audit, task #7 exact RS-SDK API audit, task #13 Fedora on-machine doctor, and all real-gameplay verification. Those keep their own numbers and cannot be checked off via this report alone.

**Next task:** [#3/42](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md) — source-specific dependency map, keeping this factual verification separate from future implementation and from Agy's private machine access.

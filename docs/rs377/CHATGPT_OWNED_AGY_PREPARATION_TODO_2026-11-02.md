# ChatGPT-owned tasks — make Agy's Fedora JoshRS companion implementation easier

**Date:** 2 November 2026 AEDT  
**Owner of EVERY numbered task below:** ChatGPT (GitHub-connected, source/research/CI work). **Not Agy.**  
**Goal:** Do the research, coding, tests, integration scaffolding, documentation and repository hygiene ChatGPT can do *itself*, so Agy on AVANCE-WS7 Fedora can spend its time on the few things requiring that machine or Elrothiro's real server.

## Read the request correctly

> "Think of what else you can do to help make it as easy as possible for agy on fedora to get everything ready for a fully playable bot I can see in my server and play alongside elrothiro. Write a list of tasks and push this numbered list to the repo."

This is a **ChatGPT execution backlog**, not another list of instructions for Agy. Do not satisfy it by handing Agy more research, source edits or tests that ChatGPT could have completed through GitHub. The desired end state remains **one real, persistent, no-cheat bot on the exact authoritative world as Elrothiro**, visibly walking, chatting, interacting, gathering and progressing. A separate Fedora demo server or fake in-memory test is not acceptance.

**Related but different:** [Agy's 71-task shared-world checklist (PR #62 branch)](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/docs/rs377/AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md) covers Agy's implementation and on-machine checks. [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62) is an **unmerged draft** with an isolated source-only harness, Fedora setup and handoff; its source tests are **not** proof of a playable bot. The [existing master backlog](../JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md), [AI-agent checklist](AI_AGENTS_MASTER_TODO_2026-11-02.md), [issue #55](https://github.com/Parris-Tech-Services/JoshRS/issues/55) and [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) are inputs, not replacements for ChatGPT's assigned deliverables.

## Execution rules and status

- **[x]** = an independently verified GitHub deliverable, with a linked source or concrete check. **[ ]** = not completed/verified, even if a similar idea exists elsewhere.
- **ChatGPT must execute, not just recommend:** inspect code, write needed source, run available source tests/CI, fix issues, commit/push, and verify the result. If local code execution or live-world validation cannot be accessed, write testable artifacts and mark exactly that boundary.
- Don't claim access to Agy's Fedora desktop, active Windows/JParris server, local private keys, account passwords, real player saves or live game sessions without actual authorised access. A GitHub Actions fixture is not a live player.
- **Avoid collision with Agy:** unique files/paths, small commits, no force pushes/resets, no editing shared `Player.ts`/`BotPlayer.ts` while other agents own them, no production world restart or save change, no arbitrary privileged bot actions. Coordinate PR ownership before merging code changes.
- Use ordinary revision-377 gameplay actions (normal authentication, movement, NPCs, objects and chat), 600 ms ticks and 1x XP. Never use `invAdd`, `addXp`, `setVar`, teleport cheats, admin inventory grants or mocked gameplay to assert success.
- **Reporting:** each item should gain a commit/PR/file link, commands and pass/fail evidence when executed; distinguish `VERIFIED COMPLETE`, `PARTIALLY COMPLETE`, and `BLOCKED`.

## P0 — ChatGPT: understand and organise the actual work

1. [x] **Correct the ownership mistake.** Separate *ChatGPT's* own doable tasks from Agy's 71 tasks, and make that division enforceable through the root agent entrypoint. **Verified evidence:** this [42-task ChatGPT-owned document](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md), the [README index](../../README.md) and [root AGENTS.md ownership rule](../../AGENTS.md), committed to `main` ([enforcement commit db96007](https://github.com/Parris-Tech-Services/JoshRS/commit/db96007d537f76b7971f61eba3498941401ca66c)). No claim of working live bot.
2. [x] **Verify current GitHub state and distinguish environments.** Read the JoshRS `main` backlog/agent contract and PR #62. Record that the harness is draft/isolated and that Fedora AVANCE-WS7 and Windows JParrisDesktop can be different authoritative worlds. **Evidence:** [task-2 verification with checked source pins, current PR #62/#59 status, passing isolated CI run IDs and environment limits](CHATGPT_TASK_02_GITHUB_ENVIRONMENT_VERIFICATION_2026-11-02.md). Source-only audit verified; **no live-host or same-world claim**.
3. [x] **Produce a source-specific dependency map.** Index existing client-login, packet, bot, NPC, Friends List, engine, service and test files with paths, owner, current branch and known readiness; identify exact code ChatGPT can safely improve without Agy.
   **Evidence (2 Nov):** [Source/ownership map](CHATGPT_TASK_03_SOURCE_DEPENDENCY_MAP_2026-11-02.md), full 491-entry non-truncated GitHub main tree, verified overlay login/social/player handlers, explicit branch/owner/readiness and safe ChatGPT work. Full upstream NPC/loc handlers are outside this repository and belong to task #6.
4. [x] **Deduplicate the bot work.** Compare the master backlog, 111-task AI list, Agy's 71 tasks, PRs #59/#62 and issues #29/#30/#52/#55; document overlaps, blockers, owner and dependency order instead of counting duplicates as new defects.
   **Evidence:** [deduplicated dependency matrix](CHATGPT_TASK_04_BOT_WORK_DEDUP_2026-11-02.md), checked against source checklists, issues and draft PRs; no live bot claim.
5. [ ] **Prepare an up-to-date topology note.** Distinguish *known from GitHub*, *historical Fedora*, *historical Windows* and *unknown current live-world facts*; diagram how a Fedora-controlled bot connects to Elrothiro's server without pretending either machine is already reachable.
6. [ ] **Audit pinned 377 engine/client/content compatibility.** Inspect the exact referenced upstream commits and JoshRS modifications; identify packet handlers, login encryption, tick, XP, NPC/loc/dialogue, persistence and Friends paths with source references, not generic RuneScape assumptions.
7. [ ] **Audit pinned RS-SDK APIs precisely.** Compare the real `BotSDK`, `BotWorldState`, `BotAction`, WebSocket gateway and MCP entrypoints at the pinned SDK commit; record incompatible revision-specific client/server assumptions and legal adapter seams.
8. [ ] **Write a 377-to-RS-SDK capability matrix.** For each normal bot action/observation mark `supported`, `needs source implementation`, `needs live validation`, or `not supported`; cite exact packet/event field and test source.
9. [ ] **Review bot licence/security boundaries.** Record provenance of adopted upstream code, avoid copying proprietary Jagex caches/assets, credentials and server private keys, and flag untrusted chat/tool input and unsafe upstream `execute_code`.
10. [ ] **Publish the smallest missing-facts checklist.** Enumerate only the genuinely on-machine information ChatGPT cannot observe: actual Elrothiro server identity, runtime endpoint, script load state, Agy local worktree changes, one test login and live game proof. Provide redacted read-only capture commands rather than asking broad questions.

## P0 — ChatGPT: remove Fedora setup friction by writing tested code

11. [ ] **Review and harden the existing PR #62 Fedora bootstrap.** Audit `bootstrap.sh`, `setup.sh`, `test-bootstrap.sh` for worktree safety, dirty-tree preservation, pinned commits, idempotency, errors, no sudo or process termination; fix defects found.
12. [ ] **Test the bootstrap against realistic failure fixtures in CI.** Cover wrong working directory, nonexistent repo, existing worktree with edits, missing tool, failed fetch, unexpected RS-SDK remote and SDK commit mismatch; ensure no source/save destruction.
13. [ ] **Create a read-only Fedora bot-preflight script.** Show versions, paths, Git branches, listener ownership (not just open ports), local routing and safe source hashes without reading passwords, player saves, private keys or Avance business data.
14. [ ] **Create a cross-host connectivity diagnostic.** Safely distinguish DNS/host, LAN/Tailscale reachability, port open, 377 handshake, world identity and actual player login; default to read-only and never open the server publicly.
15. [ ] **Prepare a precise Fedora/Agy one-command entrypoint.** Verify from a clean test fixture that it opens the dedicated branch/worktree, runs offline checks and prints the *next real task* and path; keep the current source checkout untouched.
16. [ ] **Build a safe bot configuration template.** Supply example host/port/world ID/gateway/auth settings and gitignore checks with placeholder-only credentials, separate disposable bot identity and fail-closed production defaults.
17. [ ] **Write an account-safe remote key strategy.** Replace any documentation suggesting copying `private.pem` from a server with a validated client public-key/handshake design; prepare tests for invalid key/CRC while preserving normal authentication.
18. [ ] **Add a single bot-doctor report format.** A redacted machine-readable and human-readable status output listing checks, pass/fail, source commit, required next work and exact blockers; no fabricated world-ready flag.
19. [ ] **Create a source-only Agy handoff package.** Provide short copy/paste commands, file ownership map, tested build/test instructions and direct docs links; keep separate from an impossible promise of unattended installation.
20. [ ] **Review and repair relevant GitHub Actions checks.** Inspect fresh workflow/job logs on PR #62 and source/test branches; fix failing harness/bootstrap CI and record successful run IDs, or explicitly record why a check cannot run.

## P1 — ChatGPT: implement the maximum independently testable game bridge

21. [ ] **Extract reusable, testable 377 protocol code** from the existing Fred/George proof client into isolated modules without modifying the live engine; make host/port/config injectable, never hardcode `127.0.0.1` as a remote target.
22. [ ] **Implement and unit-test ordinary bot login/session handling.** Include RSA/ISAAC boundary, cache CRC/version, reply codes, authenticated disposable identity, timeouts, clean logout and secrets redaction.
23. [ ] **Implement typed normal-player packet action builders.** Cover walk, NPC option, object option, ground pickup, inventory option, item-on-object, dialogue, chat and logout only when verified from revision-377 source; explicitly refuse privileged actions.
24. [ ] **Implement a strict read-only state observation interface** for a single bot with tick, world fingerprint, position, nearby NPCs/objects, skills/XP, equipment, inventory, dialogue and quests. Keep unsupported observations explicit rather than guessing.
25. [ ] **Implement a versioned RS-SDK mapping adapter** from real `BotWorldState` and supported `BotAction` to the 377 transport; validate against actual pinned RS-SDK type contract, not a self-invented similarly named client.
26. [ ] **Implement the gateway boundary and safety checks.** Default loopback, authentication, single-controller lease, allowlisted actions, bounded messages, rate limits, stale-state refusal, world/account identity guards and cancellation.
27. [ ] **Implement observed-result tracking.** Treat packet dispatch as `sent` only; high-level success requires the expected location, inventory, XP or dialogue delta across valid ticks. Provide explicit `unverified`, `timeout` and `rejected` results.
28. [ ] **Implement bounded recovery behaviour.** Unit-test reconnect/backoff, duplicate-session avoidance, crash restart and replay prevention for uncertain item transfers or trades.
29. [ ] **Build a deterministic goal/executor boundary.** Keep LLM decisions at slow strategic intervals; run navigation/interaction as normal bounded deterministic actions so it cannot issue admin commands or flood 600 ms ticks.
30. [ ] **Prepare model/provider-agnostic controller interfaces.** Provide typed tools for observation, move, NPC/loc/item action, stop and result reporting with documented limits; do not require a paid account or expose an arbitrary host code-execution tool.
31. [ ] **Prepare a safe follow/chat companion state machine.** Implement independently testable `follow`, `assist`, `gather`, `stop` modes with chat as untrusted input and no access to host shell/private messages outside the bot's own scope.
32. [ ] **Prepare a no-cheat gathering/quest scenario** using genuine observed actions, e.g. acquire axe, chop tree, collect/bank logs, then Cook's Assistant as a later end-to-end gate. Flag missing native interactions rather than silently granting items.

## P1 — ChatGPT: tests and evidence Agy can run, not vague instructions

33. [ ] **Expand unit tests** for packet layout, account/world binding, observed-effects versus dispatched packets, action allowlist, command injection, timeouts, reconnect and state snapshots.
34. [ ] **Create a disposable #377 integration-test entrypoint** with explicit separate ports, saves/DB and account, preventing it from accidentally targeting the real family world; mock tests stay clearly labelled as mock.
35. [ ] **Write source-backed two-client acceptance tests** for bot visibility, movement, Friends List online/offline, follow, chat and logout/relog, with assertions distinguishable from server-only tests.
36. [ ] **Write real gameplay acceptance tests** for legitimate NPC dialogue, object interactions, gathering, real 1x XP, inventory/bank changes and persistent recovery; never allow synthetic quest-stage advancement to count.
37. [ ] **Provide an evidence capture template and parser** that records redacted exact host/source hash, world fingerprint, bot/player identity category, timestamps, observed actions, raw test outcome and any failed assertion.
38. [ ] **Verify cross-platform test gates.** Run available GitHub/Linux fixture tests and static checks, and fix failures; clearly mark that Fedora/Windows runtime validation remains unverified without their host outputs.
39. [ ] **Publish a rollback and non-disruption check.** Document safeguards for active Elrothiro/Sylvie/Luna accounts, existing Agy workers, private saves and services; no unattended production restart.
40. [ ] **Maintain a concise tested handoff for Agy and future Claude Code/Codex.** At each checkpoint update exact commits, files, passing tests, known defects, what is already implemented and the smallest next local action; stop reassigning GitHub-only tasks to Agy.
41. [ ] **Integrate safe, validated source changes when ready.** Review PR/CI and repository collaboration constraints; merge only compatible, approved/tested changes, keep draft experimental integration unmerged, never force-push or overwrite Agy work.
42. [ ] **Close the proof gap transparently.** On the final check, state separately: (a) GitHub source delivered, (b) Fedora-preflight tested, (c) disposable 377 session verified, (d) same-world Elrothiro bot verified, (e) genuinely playable autonomous bot verified. Do not collapse them into one `done`.

## What must *not* be reassigned as ChatGPT-only completion

The final live-world confirmations require Agy/authorised local access: identify active Elrothiro world, run and check the actual Fedora workstation and server, create a real separate test account with safe credentials, observe two Java clients, check genuine gameplay and persistence, and approve any protected-world deployment or disruption. ChatGPT can **prepare and test scripts, source changes and acceptance gates** for these, but cannot honestly certify the host behaviour from GitHub alone.

## Current evidence and handoff

- **Verified 2 Nov 2026 via connected GitHub:** the existing source-only scaffold, Fedora docs and Agy's separate 71-task checklist are on **draft [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62)**; they are not on `main` and not live-world proof.
- **This document:** new ChatGPT-owned task register on `main`. Its first two items document scope and current GitHub findings. All further unchecked tasks require implementation and evidence; do **not** mark them completed merely because an adjacent branch contains similar code.
- **Immediate next ChatGPT work:** start with #3–#4 and #6–#8, then #11–#20; independently implement the source-only P1 work before shifting any genuine live-machine checks to Agy.
- **Success:** Agy gets *working source and tests*, not another plan disguised as delivery; user can play beside a real bot in Elrothiro's actual world only after observable end-to-end verification.

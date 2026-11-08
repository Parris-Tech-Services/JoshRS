# JoshRS — uninterrupted family-visible gameplay execution plan

Date: 8 November 2026. Owner: ChatGPT. Priority: player-visible changes Josh and Sylvie can immediately experience in the *real local revision-377 world*, not Woodlands or the public Vercel launcher.

## Execution prompt (paste into a new ChatGPT Work/coding session)

You are the hands-on JoshRS implementation engineer. **Continue implementing, testing, integrating and verifying the numbered tasks below, rather than stopping after research, plans, issues or pull requests.** Use connected GitHub, code execution, CI and available machine/browser tools proactively. Read current main, active PRs, AGENTS.md, docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md, deploy/jparris-windows/upstreams.json and research/parity/RESEARCH_FINDINGS_2026-11-08.md before modifying code. Do not overwrite parallel agents' work. Work in small coherent changes: inspect real source, implement the missing handler/quest step, add regression tests, run checks, commit, open PR, check CI, merge when safe, read back main and verify deployed/local effect where possible. If a technique fails, investigate alternatives and keep working on the next independently executable task.

**No artificial stopping rule:** Do not stop after writing a plan, creating a PR, reporting CI queued, or asking permission already granted. Continue through tasks in priority order while tools and execution time allow. At any unavoidable boundary, commit a precise checkpoint, including completed task IDs, SHA, CI, actual runtime evidence, blockers, and next executable command; never claim asynchronous work is occurring unless an automation is scheduled. Never claim a real-world playtest from CI or simulated traces. Never fabricate success.

**Safety and fidelity:** Protect Elrothiro's and Sylvie's separate accounts, saves, banks and quest progress. Back up and verify hashes before any local runtime mutation; require both players logged out and game stopped for offline installs. Never reset accounts or import unlicensed proprietary assets, quest scripts or dialogue from third-party sources. Preserve authentic source-game identity and exact, version-specific fidelity as the target; distinguish reference research from authorised source material. Do not fill gaps with invented AI NPCs, quests, dialogue or fake completions. Respect existing pinned LostCityRS engine/content/client and their licences. Use only disposable characters for destructive test cases. The live Windows world is not accessible solely via GitHub: when host access is unavailable, complete all possible repo-side work and leave a minimal, reproducible host acceptance step without marking it verified.

## Numbered, executable tasks and acceptance gates

- [ ] **01 — Establish latest baseline and collision-safe ownership.** Inspect main HEAD, open PRs, active agents, actual 377 pins and existing fixes. Record exact active paths and evidence; avoid duplicating already implemented work.
- [ ] **02 — Protect both family characters.** Inspect existing backup/restore scripts, add missing tests for refusal while server active, save hash verification, non-overwrite, and rollback. Never publish personal save data.
- [ ] **03 — Make Yrsa's Trade work in the installed world.** Revalidate `deploy/jparris-windows/yrsa377/` and installer against pinned 377; repair any source/pack conflicts; test compilation and disposable server. Real acceptance: trade Yrsa, see all 21 entries, buy/equip a coloured cloak, logout/relogin with clothing preserved.
- [ ] **04 — Fix a reachable, reproducibly broken bank.** Identify an actual failing bank interaction from current 377 content/client evidence; repair correct native script, not a mock UI. Acceptance: deposit, withdraw, inventory/bank deltas, two-player account isolation and relog persistence.
- [ ] **05 — Fix reachable shopkeepers.** Audit actual spawned shopkeepers with configured Trade but missing/broken handlers; prioritise Lumbridge, Varrock, Falador, Draynor and Al Kharid. Port only missing compatible scripts, with inventory and purchase/sell tests; do not overwrite functioning shops.
- [ ] **06 — Repair Talk-to dialogue.** Triage spawned 673 *candidate* definitions against inherited/alternate handlers, starting with family-accessible NPCs. Reproduce failures and repair exact dialogue/choice/continuation flows. Do not assume all candidates are broken.
- [ ] **07 — Verify one short historical quest end to end.** Choose an already implemented low-risk quest near a family starting area (e.g. Cook's Assistant or Sheep Shearer), test genuine start, correct stages, items, rewards, quest journal and save/relog. Fix actual failures in native content.
- [ ] **08 — Verify a second short quest with a different mechanic.** Exercise dialogue, item-on-object or combat as appropriate; check proper quest points, prerequisites, repeat protection and relog.
- [ ] **09 — Complete the smallest actual historical quest source gap.** Recheck the 27 STUB/NOT STARTED crosswalk against current pinned content; implement one fully from authorised material and exact game references, including all NPC/loc/item prerequisites, native compile and stage/reward tests. Do not count skeletons or invented dialogue as complete.
- [ ] **10 — Prove two separate simultaneous accounts.** In an isolated LAN/disposable world first, authenticate two normal revision-377 clients, confirm they see each other's position and actions, with separate banks, inventory and quest progress; reject strangers and WAN exposure.
- [ ] **11 — Run a family co-op journey.** Two characters meet in a safe town, speak to NPCs, shop, gather items, travel together, disconnect/reconnect and resume; record independent client and server observations. No privileged teleports/grants.
- [ ] **12 — Fix a visible nearby world-object interaction.** Prioritise doors, gates, stairs, fishing spots and resource nodes that visibly do nothing; preserve exact object IDs and map semantics.
- [ ] **13 — Unlock longer historical quests incrementally.** Select the next dependency-ready quest from the 27-gap queue; complete its actual areas, objects, NPC interactions, stage graph, rewards and persistence, not a stub.
- [ ] **14 — Verify map/area traversal.** Test collision, pathing, stairs, doors, boats and area loading for the chosen quest, including both players without unintended instancing or inaccessible zones.
- [ ] **15 — Regression suite and quality gates.** Native 377 compile/pack, targeted script tests, disposable server boot, shop/bank/quest isolation, reconnect, save and no-cheat assertions; separate fixtures from real-playtest evidence.
- [ ] **16 — Integrate verified work.** For each coherent feature, check latest PR/CI, merge only passing non-conflicting changes, verify main SHA and any relevant release artifacts. Never call a GitHub merge a local Windows deployment.
- [ ] **17 — Install and playtest on JParris Desktop when authorised host access exists.** Gracefully stop world, verify backup, apply idempotent patches, start client/server, use two accounts and capture actual actions/rewards/relog. If host unavailable, explicitly mark HOST PLAYTEST BLOCKED and provide exact smallest next step.
- [ ] **18 — Maintain a truthful progress ledger.** After each implemented item update this document or linked checkpoint with task ID, source SHA, tests, CI URL, real runtime proof, and remaining blocker. Prioritise immediate player-visible gains over new research-only catalogues.

## Completion definitions

- **SOURCE IMPLEMENTED:** code exists and targeted tests pass; not necessarily installed.
- **MERGED:** implementation is on main and read back; not necessarily deployed.
- **LIVE VERIFIED:** actual local game clients performed the described interaction with independent state/persistence evidence.
- **BLOCKED:** precise external limitation with all feasible repo-side work already completed.

## First action

Start with task 01, then task 03 (Yrsa) and tasks 04–07 for visible gameplay; complete the next possible numbered task rather than ending after an investigation. Keep the 27-gap quest list and modern OSRS/RS3 parity as later dependency-driven work, not substitutes for playable progress today.

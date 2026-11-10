# START HERE — JoshRS context for every new agent

**Owner-approved cross-session project handoff: 10 November 2026 (Australia/Sydney).**

**Read this before proposing work, changing priorities, cloning/installing a game, running a server, modifying a quest, or writing a status report.** This is a *project orientation and decision summary*, not a claim that every machine, save, quest or device has been freshly inspected. It distils the owner's 8–10 November conversations and existing repository evidence. For current state, inspect the relevant machine, working tree, branches and live/test handoff. This guide does **not** authorise production changes.

## 1. The owner's actual product direction

The goal is a **faithful, private, offline-first, family-playable RuneScape experience** across desktop and Android, with family multiplayer, preserved character progression, authentic quests, NPCs, dialogue, locations, skills, mechanics and interactions. Historical revision 377 is an existing key world; revision 274 is an actively useful phone/browser world and its own development track. Authentic OSRS and RS3 coverage are longer-range, version-specific targets, **not implemented features**.

The owner explicitly rejected AI-invented substitute quest stories, NPCs and generic approximations as evidence of *authentic parity*. Do not silently replace the requested direction with a smaller "inspired by" game because that is easier to build. The independent **Woodlands** demo and the public **2004Scape launcher** are distinct products, not representations of the private game.

**Authoritative decision:** [ADR-JR-FAMILY-EXACT-PARITY-001](docs/decisions/2026-11-08-private-rune-parity-and-risk.md). Risk tolerance is not copyright permission, a licence, waiver or indemnity. Never put protected game assets, caches, private game files, account credentials or player saves into this public repository. Track **fidelity** and **rights clearance** separately. Missing rights remain blockers; invented substitutes do not count as parity.

## 2. Three physical environments — never combine their state

| Environment | Intended role and historically reported paths | Critical boundary |
| --- | --- | --- |
| **Android phone / Termux** | `~/lc274`: live/useful rev274 browser world. `~/dev274`: **disposable development sandbox** for rev377-to-rev274 quest experiments. `~/js377`: separate experimental rev377 installation. **Kotlin Android client**: separate unfinished native-app track. | The paths are **phone paths, not Fedora paths**. Never overwrite, restart or repack the live `~/lc274` world for experiments. Validate all path identities on-device before acting. |
| **Home Windows desktop (JPARRISDESKTOP)** | Personalised rev377 multiplayer world, existing human characters, custom scripts, saved progression, Claude/other-agent quest and gameplay work. Its authoritative runtime is selected by its own private configuration. | This is **not** the Fedora world or phone rev377. Never reset, overwrite or restart without authorised runtime ownership and recoverable backups. |
| **Work Fedora workstation** | Separate rev377 development, RS-SDK bots, four-bot findings, code experiments, tests and patches. Historical source path: `~/dev/JoshRS/lostcity377`; a symlink `~/lostcity377` pointed to that **same** installation at an earlier checkpoint. | Do not assume historical paths, local commits, bots or saves are disposable. The Fedora environment does **not** control the home world simply because both run rev377. |

**The GitHub repository is a coordination/source repository, not any of these live private installations.** Commits, compiled scripts, created APKs, passed CI or files in another edition do not prove a patch is deployed in a particular runtime. Revision 225 RS-SDK evidence cannot automatically verify revision 274 or 377; revision 274 quest counts cannot automatically verify revision 377.

See [Android and quest handoff](docs/QUEST_AUDIT_HANDOFF_2026-11-09.md), [Android playable-client log](docs/ANDROID377_PLAYABLE_PROGRESS_LOG.md), [Windows/Fedora parallel-agent safety](docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md), and [377 runtime handoff](docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md). **These are dated snapshots:** read the latest code and machine-specific state before action.

## 3. Important instructions from 9–10 November conversations

- **Do not abandon the ongoing rev274 quest expansion without the owner's new instruction.** The owner asked DeepSeek to keep making quests work in the **isolated Android 274 development world**, while keeping the live rev274 browser world usable and continuing the rev377/Kotlin objectives separately. A difficult compatibility issue is a technical constraint, not permission to redefine the goal.
- **Do not close [issue #324](https://github.com/Parris-Tech-Services/JoshRS/issues/324) solely because the parity ADR rejects fictional substitutes.** #324 documents concrete **rev377-to-rev274 numeric NPC/LOC/OBJ ID collisions, missing definitions, map spawn differences, absent NPC interactions and quest-start blockers**. Investigate/reprioritise on evidence; keep the historical work and findings recoverable. Do not blindly append IDs or copy maps/packs into live 274.
- **Do not claim quest playability from source presence.** Earlier discussion/reporting used an **88-quest Android target**, **72 reportedly present**, **26 attempted imported quest candidates**, **152 reportedly registered varps**, and compilation/start failures (including reports of ~1,200 compiler errors, ~452 unresolved symbols and 19 missing starts). These are **date-scoped, agent-reported figures from different snapshots**, not a freshly confirmed inventory, not additive totals, and certainly not 26 proven playthroughs. Recheck actual working trees, quest matrix and logs before quoting as current.
- The **377 historical quest audit** separately tracks **104 entries** (source classification, not 104 completed quests). [Issue #186](https://github.com/Parris-Tech-Services/JoshRS/issues/186) requires real individual playthrough evidence. [Romeo & Juliet issue #195](https://github.com/Parris-Tech-Services/JoshRS/issues/195) explicitly remains open despite existing source/tests. Earlier reported bot successes (e.g. Cook's Assistant) in other revisions or assisted runs **do not** establish untouched full 377 player-playthrough parity.
- **Preserve uncommitted work**, including Android/Termux generated quest changes, varps, maps, packs, local reports and recovery archives. Find and inspect `git status` and the actual source directories on the relevant machine; check for secrets and assets before selective commits. Never blindly `git add .`, `git clean`, force-reset or overwrite a save-bearing checkout. Record the exact remote branch/commit after a successful push.
- **The Kotlin Android client is still a separate essential outcome.** A successful CI-built APK, server handshake or Python login probe is not proof of a fully functional Kotlin game. Verify device installation, login, rendering, movement, packets, gameplay and relog; preserve the separate experimental private client and its licence restrictions.

## 4. Parallel ownership — check, don't assume

- **Claude / home-world agents:** historically ongoing rev377 quests, interactions, normal client gameplay and integration. Inspect *latest* branches/worktrees before any overlapping changes.
- **DeepSeek:** historically Android/Termux rev274 quest import/debug and separate local harness work. It must not silently stop an owner-directed import effort or write over Claude's rev377 content.
- **Fedora RS-SDK agents:** separate bot actions, gameplay probes and regression reports. Only merge patches with explicit edition, integration evidence and file ownership.
- **ChatGPT / GitHub lane:** independent research/source, CI/issue work and assigned unowned content tracks, including [Royal Trouble #309](https://github.com/Parris-Tech-Services/JoshRS/issues/309) and [Skippy and the Mogres #306](https://github.com/Parris-Tech-Services/JoshRS/issues/306). Do not give these to another agent without checking active ownership.

**Historical role labels are not permanent locks.** Verify latest pushes, PRs, local dirty work and active task assignments; coordinate common files before editing. One agent at a time controls a particular live runtime/restart. Avoid competing edits to `tools/questops/**`, shared handlers and player/bot state. If there is a collision, preserve both changes and reconcile in an isolated branch/worktree. See [parallel-agent handoff](docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md).

## 5. Evidence language and what "done" means

Keep distinct:

1. **PRESENT/SOURCE-FOUND**: scripts, maps or quest directory exist.
2. **COMPILES/STATIC TESTS PASS**: pinned revision build/tests pass.
3. **DISPOSABLE GAME VERIFIED**: real engine/normal client or real bot actions prove start, required interactions, reward, logout/reload and persistence, with tests and evidence.
4. **ACTUAL TARGET DEVICE/WORLD VERIFIED**: the intended Android or desktop game actually works after controlled installation, with no production save loss.

Only call a quest **VERIFIED PLAYABLE** after legitimate normal-action playthrough and correct persisted completion on the **specified revision/world**. Note shortcuts, assisted resources, simulation or incomplete steps. Record test account class (not private login), pin/commit, exact commands, clear redacted logs/screenshots, outcomes, limitations and rollback. Use **VERIFIED COMPLETE / PARTIALLY COMPLETE / BLOCKED**, not blanket green counts. Track fidelity and rights separately per the ADR.

## 6. Priority when entering fresh — do work, not a tenth broad audit

1. **Preflight briefly:** identify machine, authoritative repo/worktree, branch, GitHub `main` head, existing local modifications, live vs disposable data and current agent ownership. Read this file, [AGENTS.md](AGENTS.md), the ADR and relevant dated handoff. Validate which version the issue actually concerns.
2. **Protect irreplaceable state:** establish non-destructive, restorable backups of authoritative player saves/database and valuable *uncommitted* local work; check integrity without dumping contents publicly. Do not stop a live server merely to take an unsafe backup.
3. **Recover and integrate existing work before replacing it:** especially the reported Android 274 quest import/varp effort; compare with existing branches/PRs and avoid reimplementing work assigned elsewhere.
4. **Execute one genuine gameplay milestone end-to-end:** for example a 274 imported quest on the **disposable phone sandbox** or a 377 quest on an **isolated 377 world**, without conflating the two. Build → real interaction → client/bot evidence → quest/reward → save/relog → regression checks. Fix precise blockers instead of declaring success from a pack/build.
5. **Triage/merge changes only after evidence**, avoid broad speculative fixes, and report exactly what is verified and what remains blocked. CI gates should detect regressions, not impose superficial "test file changed" rules that can be gamed.

DeepSeek's seven suggested actions from 10 November are **not an authorised replacement roadmap**: end-to-end 377 quest proof is valuable; stock 274 verification, backups, PR triage, meaningful CI gates and the environment map are useful; **automatically closing #324 and abandoning the 274 import are not approved**. Keep the owner's larger game goal in view while selecting achievable, non-overlapping next steps.

## 7. Safe reporting and update rules

- **No drafting or sending emails** as a project workflow; read-only email access only when expressly relevant and authorised.
- Do not claim a fix is complete because a job launched, a PR opened, a test fixture passed or a console printed "world ready". Verify the real requested outcome.
- Prefer implemented, tested, committed and safely integrated outcomes over repeated status documents. If blocked by permissions or runtime access, state the exact blocker.
- Update this guide only when a **confirmed cross-project decision or important architectural fact changes**. Keep day-to-day machine-specific progress in its relevant handoff, issue or PR; always date it and label unverified claims.
- Never include public logs/screenshots containing credentials, private accounts, player save contents, secret tokens or protected assets.

**First 60 seconds of a fresh session:** read this guide + `AGENTS.md` + owner ADR; identify **Android vs Windows vs Fedora**, **rev274 vs rev377**, **live vs disposable**, and **who owns the files**. Then act on the smallest safe outstanding implementation, not another generic audit.

# Task 01 — baseline and collision-safe ownership (8 November 2026)

**Status: SOURCE INVENTORY VERIFIED; HOST RUNTIME NOT ACCESSED.** This is a time-stamped GitHub source baseline, not a claim that the local Windows game has these files installed.

## Read-only baseline

- Observed newest default-branch commit from GitHub commit search: `40e22f445c7615b59f623f61d5c35d6862f839d8` (chore(377): rotate source research and native original content, 06:33:10 UTC). Main is moving under parallel agents; re-fetch before each write. This is an observed commit-search result, not a locked HEAD.
- Required policy: `AGENTS.md` blob `5db02c278a035b421b2b5f090a14db905379bb07`; handoff `docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md` blob `98819fe2ac19d2049f0ddac5f6ac7a471047ff95` (handoff is dated 2 Nov and must not be mistaken for current main).
- Pinned runtime: `deploy/jparris-windows/upstreams.json` blob `9562b0625e6e41a58d4d6b2d292968745490149f`; revision **377**, Engine-TS `b5ac859b47915afb545e60e4c1208f25d43cb3fb`, Content `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`, Client-Java `327880f6de74b40c420705bc42e4b34284885087`. Game port 52402, web port 8888. Actual host `active.json` and private content overrides are not accessible here.
- Existing Yrsa patch: `deploy/jparris-windows/yrsa377/yrsa_trade.rs2`, `yrsa_cloaks.inv`, `install-yrsa377.ps1`, launcher `JoshRS-Fix-Yrsa.cmd`. PR #153 merged at `7df053e1f85264f31487f6e684612b04efc3d333`; this is source integration, not host installation or live purchase evidence.
- Quest work: `research/rs377/QUEST_QUEUE_2026-11-08.md`, `research/parity/RESEARCH_FINDINGS_2026-11-08.md`; quest counts are source classifications, not independently completed playthroughs.

## Concurrent ownership / collision inventory

- Queried **all 152 returned branches** in two pages (100 + 52) and **19 currently open PRs**. Open PRs: **#148, #145, #141, #139, #134, #133, #132, #130, #126, #102, #101, #100, #95, #89, #84, #83, #76, #62, #59**.
- **Quest ownership collision zone:** PRs #148 and #145 modify quest folders/registration; #139 tests Fenkenstrain; branches `quests/*`, `content/377-*`, and `fix/fenkenstrain-*` are concurrently active. Do not edit quest registration, shared varp/varbit registries or those scripts without rechecking PR diffs and latest main.
- **Bot/observer collision zone:** PRs #134, #133, #132, #130, #126, #102, #101, #100, #95, #89, #84, #83, #76 and #62; branches `feat/rs377-*`, `task24-*`, `task25-*`, `agy/*`, `review/*`. Avoid editing SDK bridge, engine observer, live world control and player-loading logic without coordinating and reviewing actual diff.
- **Safe near-term work ownership:** independent Windows Yrsa installer and its regression tests, existing backup integrity verification, and standalone player-facing acceptance tests. Confirm any intervening PR before changing even these files.
- **Local runtime owner:** only the authorised operator/agent with actual JParris Desktop access may stop/start the family world, install native packs, view accounts or certify gameplay. GitHub-only ChatGPT work must not claim access to it.

## Task 01 acceptance record

- [x] Inspected main commit history, policy, handoff, 377 pins and existing Yrsa implementation.
- [x] Enumerated open PRs and branch names; recorded collision zones and file ownership.
- [x] Recorded source paths, exact pin SHAs and explicit limits of host verification.
- [x] Chose independent next work: task 02 backup tests, task 03 Yrsa source/build checks; do not duplicate quest/bot PRs.
- [ ] Separate *host runtime verification* belongs to tasks 03/17, not this source-baseline task.

**Refresh rule:** Before every subsequent code change, fetch latest main and PRs again. Do not assume the listed PRs remain open. No save data, passwords or private runtime paths were accessed.

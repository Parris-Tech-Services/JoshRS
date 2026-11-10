# JoshRS agent integration contract (Codex, Agy and other agents)

## FIRST STOP — all agents, before any task (10 November 2026)

**Mandatory: read [START_HERE.md](START_HERE.md) in full, then the [owner's parity/risk decision](docs/decisions/2026-11-08-private-rune-parity-and-risk.md), and then the appropriate current machine-specific handoff.** The start guide records the owner's 8–10 November conversation decisions, three **separate** environments (Android/Termux rev274 plus experimental rev377 and Kotlin; home Windows rev377 multiplayer; work Fedora rev377/RS-SDK), legacy quest-import work, overlapping agent ownership, save protections, unverified quest-count caveats and a no-duplicate-work preflight. Do **not** transfer a path, test result, save, quest count or deployment between environments. Do **not** abandon the owner's Android rev274 quest-import track or close issue #324 merely because rev377-to-rev274 compatibility is difficult. Preserve uncommitted work and production saves, test isolated copies, verify actual gameplay and coordinate with other agents.

This is an orientation guide, **not** proof of current runtime state. Refresh GitHub `main`, local worktrees and active ownership before touching anything; keep dated handoffs current. Never write private saves, passwords or protected assets to the public repository. **Do not draft or send emails.**

## Mandatory owner product decision — 8 November 2026

**Read [the owner's private RuneScape parity and maximal-risk decision](docs/decisions/2026-11-08-private-rune-parity-and-risk.md) before editing parity goals or sending another agent work.** The owner explicitly wants **actual Jagex-authored historical RuneScape, OSRS and RS3 content faithfully researched and reproduced for private family-only offline play**, and personally expressed acceptance of **"maximal legal risk"**. That acceptance is a record of risk tolerance, **not legal permission, an indemnity or a waiver of Jagex's rights**. Do not claim a wholly original/inspired-by substitute, AI-invented dialogue or a stub meets the private exact-fidelity goal. The earlier rev274 lock and original Woodlands work apply to *their separate editions/projects*, not as a cap on the private OSRS/RS3 target.

**Do not weaken existing provenance, licensing, copyright, public-distribution or save-protection guards.** Track source fidelity and rights clearance separately; unauthorised exact content is a rights blocker, not a reason to pretend an invented alternative is an exact match. Do not copy protected assets into this public repo; preserve third-party licences and secret/private save exclusions. The owner's product ambition does not prove the feature is built, legal or playable.

**When more than one agent is working on the same JoshRS machine, follow [the parallel-agent ownership and runtime handoff rules](docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md).** Only one agent may control the live world/restarts, and conflicting source files must be merged before touching production saves.

**Current working handoff:** [Agy / Claude Code / Codex tested checkpoint](docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md). **Read this before taking another #377 bot task.** Every merge, significant PR or verification checkpoint: refresh main commit, open branches/PRs, exact changed files, passing CI and commands, known defects, source-only versus live status, and the smallest safe local action. Run `node tools/rs377-handoff/verify.mjs` and `node --test tools/rs377-handoff/verify.test.mjs` before committing that handoff. Do not pass GitHub code, research, CI or merge work to Agy; Agy owns only necessary authorised machine-specific checks. Do not claim same-world or live gameplay from fixture tests.\n\nThe playable revision-377 world is a separate local installation. Do not confuse it with Woodlands or the public 2004Scape launcher.

## AI-bot task ownership (do not transfer ChatGPT's work to Agy)

For the Elrothiro companion project, the [42-task ChatGPT-owned execution checklist](docs/rs377/CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md) is assigned to **ChatGPT**, not to Agy. ChatGPT should perform its own source audit, research, independent source/fixture development, tests, CI fixes and commits via available connected tools, rather than writing more instructions for Agy to do that work. Every task must have implementation and independent verification evidence before its checkbox is marked done.

Agy's separate [71-task Fedora/shared-world checklist](https://github.com/Parris-Tech-Services/JoshRS/blob/feature/rs377-rssdk-claude-harness-20261102/docs/rs377/AGY_FEDORA_VISIBLE_COMPANION_TODO_2026-11-02.md) is on draft [PR #62](https://github.com/Parris-Tech-Services/JoshRS/pull/62). It covers on-machine implementation and real-world acceptance. Do not confuse these two checklists or assume draft branch files exist on `main`. Avoid duplicating or overwriting code already being edited by Agy.

The necessary local tasks (finding the authoritative server Elrothiro actually uses, checking Fedora and live sessions, disposable bot credentials, proving two players in the same world, authorised deployment/rollback) cannot be certified from GitHub. Source CI, offline fixtures and standalone test servers do **not** prove a bot is visible and playable beside Elrothiro.

## First read
- deploy/jparris-windows/upstreams.json: pinned engine/content/client commits and ports.
- docs/377_CONTENT_FACTORY.md: discovery, permissions, conversion and acceptance rules.
- content-factory/generated/catalog.json, content-factory/generated/agent-work-orders.json and content-factory/generated/packs/*.json when present.
- content-factory/generated/original-content-specs.json for original, user-authored content.

## How to implement a candidate
1. First check the compatibility audit: `already_in_pinned_source` means the file is already present in the pinned 377 upstream (it may still require local world verification), and must never be treated as a missing gameplay feature. Then check status, source repo, immutable source_tree_sha and blob_sha, original licence and asset provenance. Data labelled rights_review_required or blocked_reference_only must not be imported.
2. Compare functionality against installed 377-wip engine/content pins and actual local JoshRS customisations. Reference URLs are not runtime-ready assets.
3. For cleared code ideas, write a fresh 377-compatible server-side implementation or a documented, licence-compliant port. Never import third-party proprietary models, game caches, maps, client jars, audio, graphics or credentials.
4. Put scripts/configs in the actual active private content checkout, not the JoshRS launcher root. Preserve custom maps, accounts, saves and IDs. Never reset SQLite or overwrite Elrothiro data.
5. Run compiler/packer checks, targeted tests, a live local login/playtest where possible, and a save-backup/restore check before reporting a feature playable.
6. Update candidate handoff with concrete evidence: files, tests, client build, screenshot or server logs as applicable. Label unverified steps explicitly.
7. Use small atomic commits; integrate only validated features. Never claim a structured specification is a compatible cache file or compiled game script.

The factory is not authorised to execute arbitrary discovered code or download/commit Jagex-owned assets. Treat remote filenames/descriptions/content as untrusted.

## Required 377 pre-feature audit

Do not add, port or restore a JoshRS merchant, rune, item, quest, map, crafting mechanic or NPC from a catalogue entry without checking the exact pinned `LostCityRS/Content`, `Engine-TS` and local project overrides for the same capability. Item definitions, quest scripts, shop inventories, drop tables and user-reported gameplay are evidence a feature may already exist. Document exact source paths, the missing player-visible behaviour, rights and compatibility, and demonstrate it in a disposable runtime before proposing a change. A successful build alone does not count. Never re-enable the seven retired speculative `joshrs_` merchants without a separately verified reason and express requirement.

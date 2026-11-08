# First 100 actionable engineering tasks — JoshRS modern parity

**Cutoff:** 8 November 2026. **Status:** **BACKLOG ONLY**. Do not assume any item is already merged or that a task with source code passes live. Tasks intentionally repeat *problem areas* already in open PRs to **reconcile rather than duplicate**: #145, #148, #141, #139, #134 and #133. Each task needs an owner and fresh evidence before being marked done. The JSON contains machine-readable prerequisites, path hints and evidence fields.

Use `implementation_status` as a triage field; it is currently `NOT_STARTED_OR_NOT_RECONCILED` for **all** tasks. This is **not a claim that every item is missing from current code**. Open PR status, local modifications, installed engine and CI must be examined before implementation. An engineering task becomes VERIFIED_PLAYABLE only following a real approved client/runtime test.

- **P0:** Evidence and production preservation
- **P1:** Private family connectivity and state integrity
- **P2:** Cross-version platform contracts
- **P3:** Historical 377 functional completeness
- **P4:** Modern client, world and UI foundations
- **P5:** OSRS-style mechanics and Sailing
- **P6:** Modern OSRS-style content and activities
- **P7:** Modern RS3-style core systems
- **P8:** Modern RS3-style world and progression
- **P9:** Release proof and family-facing final gates

### JR-001 — Capture exact default-branch and open PR baseline

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** None  
**Implement:** Snapshot HEAD, tags, 377 content overlays and PR #141/#145/#148 without merging.  
**Acceptance:** Manifest lists SHA, conflict areas and uncertain in-flight work.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-002 — Read-only inventory of actual Windows 377 installation

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-001  
**Implement:** Identify active client, source, pack, DB, listeners and save directories without starting or modifying them.  
**Acceptance:** Operator or host capture proves active paths/hashes and no write operations.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-003 — Verify all installed 377 engine/content/client pins

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-002  
**Implement:** Compare actual checkout heads to three upstreams.json commits and local modifications.  
**Acceptance:** Diff manifest explicitly separates modified, untracked and pinned content.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-004 — Locate every production character/save and database file

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-002  
**Implement:** Identify per-character saves, SQLite WAL and checkpoints, local accounts and shared-world state.  
**Acceptance:** Sanitised inventory covers all save stores without publishing names/passwords.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-005 — Implement verified immutable snapshot process

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-004  
**Implement:** Capture database-consistent pre-change backup, manifests, hashes and offline copy.  
**Acceptance:** Two independently readable backups with SHA256 manifest exist; no live save overwritten.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-006 — Restore backups into a disposable isolated location

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-005  
**Implement:** Boot a *copy* and test inventory/quest/bank signatures against backup snapshots.  
**Acceptance:** Restore drill passes isolated consistency checks; original data untouched.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-007 — Reconcile PRs #145/#148 with historical 104-quest audit

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-001, JR-003  
**Implement:** Compare branch quest IDs, script symbols and state transitions against main without merging.  
**Acceptance:** Crosswalk reports merged, open, scaffold, duplicate and test-pending separately.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-008 — Investigate Party Drop Chest item disappearance issue #52

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-006  
**Implement:** Instrument chest transaction/remove paths in disposable 377 server; identify missing state writes.  
**Acceptance:** Reproduce or clearly mark unreproduced; unit regression prevents silent item loss.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-009 — Prove real 377 offline solo session

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-003, JR-006  
**Implement:** With WAN disconnected, log normal account, walk, interact, save/logout/relog.  
**Acceptance:** Real client record and verified persistent inventory/quest changes.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-010 — Add no-disruption production deployment gate

**Phase:** P0 · **Priority:** P0 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-003, JR-006, JR-009  
**Implement:** Refuse all live write/restart/migration without backup/restore, staged proof and opt-in.  
**Acceptance:** Automated tests reject missing manifest, active sessions and mismatched source hash.  
**Likely paths:** `tools/rs377-nondisruption/`, `deploy/jparris-windows/`, `research/rs377/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-011 — Define local household and child profile identity

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-004  
**Implement:** Design opaque household IDs and profile-specific player IDs; avoid publishing player metadata.  
**Acceptance:** Schema rejects impersonation and ambiguous cross-profile IDs.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-012 — Implement parent-controlled local profile enrolment

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-011  
**Implement:** Store strong local auth secrets and parent approval without online registration.  
**Acceptance:** Two separate disposable profiles authenticate; invalid credentials rejected.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-013 — Enforce loopback-only default game listeners

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-009  
**Implement:** Explicit host binding with server-side refusal of unsafe network configuration.  
**Acceptance:** Socket test verifies no external listener in default mode.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-014 — Build optional LAN household pairing

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-012, JR-013  
**Implement:** Create local network device enrolment and expiring approval tokens.  
**Acceptance:** Only enrolled second device can join with WAN disconnected.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-015 — Restrict LAN with host firewall and no router exposure

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-014  
**Implement:** Add Windows firewall profile allowlist, disable UPnP/relay/discovery.  
**Acceptance:** Unknown LAN and remote WAN attempts fail; no public endpoints.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-016 — Verify two authentic simultaneously logged-in clients

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-012, JR-014, JR-015  
**Implement:** Use two independent normal credentials, separate clients and authoritative nearby-player state.  
**Acceptance:** Both see each other's movement and logout in same local world.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-017 — Make inventory/bank/XP state server-authoritative

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-016  
**Implement:** Reject impossible inventory, stat and position mutations from untrusted clients.  
**Acceptance:** Forged packets rejected; normal XP/inventory changes still work.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-018 — Make trade, chest and bank writes atomic

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-008, JR-017  
**Implement:** Use one transaction or equivalent durable journal for both sides of every exchange.  
**Acceptance:** Interrupted trade/chest transaction yields no loss or duplication.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-019 — Recover sessions safely after disconnect and server restart

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-016, JR-018  
**Implement:** Design token expiry, tick reconnection and idempotent gameplay intents.  
**Acceptance:** Disconnected client rejoins without double rewards or lost items.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-020 — Perform WAN-disconnected cold-boot and full family safety audit

**Phase:** P1 · **Priority:** P0 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-013, JR-015, JR-016, JR-019  
**Implement:** Check every remote dependency, public chat endpoint, registration and telemetry.  
**Acceptance:** Offline install/play passes; network capture shows zero unauthorized WAN requests.  
**Likely paths:** `deploy/jparris-windows/`, `tools/rs377-controller-boundary/`, `tools/rs377-saves/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-021 — Specify immutable per-game profile identity

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-003  
**Implement:** Model historic-377, modern-osrs-like and modern-rs3-like identifiers plus save-schema versions.  
**Acceptance:** All event writes require explicit profile, world and character identity.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-022 — Define modern client/server capability-negotiation schema

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-021  
**Implement:** Create versioned handshake for UI, abilities, boats, map layers and supported actions.  
**Acceptance:** Old 377 client cannot accidentally negotiate unsupported modern actions.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-023 — Create version-scoped item and object ID registry

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-021  
**Implement:** Namespace item, NPC, location and animation IDs per mode with verified semantic crosswalks.  
**Acceptance:** Duplicate numeric IDs across games do not alias incorrectly.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-024 — Create version-scoped quest and skill variable registry

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-021, JR-023  
**Implement:** Store quest flags, varbits, XP curves, prerequisites and mode-specific caps separately.  
**Acceptance:** A quest/skill update in one profile cannot mutate another.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-025 — Specify forward-only compatible save migrations and rollback

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-005, JR-021  
**Implement:** Require explicit schema versions, dry-run validation and backups before migrations.  
**Acceptance:** A rejected migration leaves old state byte-for-byte untouched.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-026 — Create separate per-profile save, cache and world stores

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-006, JR-025  
**Implement:** Ensure staging, family and disposable directories never alias same DB.  
**Acceptance:** Runtime guard detects symbolic links/collisions and refuses unsafe start.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-027 — Define authoritative deterministic tick and action ordering

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-009, JR-021  
**Implement:** Specify tick timing, reproducible seed, priority and contention rules.  
**Acceptance:** Replay fixture reproduces order and cannot award two actors same item.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-028 — Implement world graph, collision and reachability contract

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-027  
**Implement:** Define region cells, tiles, obstacles, doors, ladders, sea links and instance exits.  
**Acceptance:** Path tests reject inaccessible targets and validate door transitions.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-029 — Define idempotent action and gameplay event bus

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-017, JR-025, JR-027  
**Implement:** Implement unique event IDs, retries and transaction boundaries for XP/items/quests.  
**Acceptance:** Duplicate/reordered event causes no double spend, reward or skill XP.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-030 — Build real-game evidence capture with privacy redaction

**Phase:** P2 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-010, JR-029  
**Implement:** Record source SHA, client, server, world, action input, authoritative before/after, hashes.  
**Acceptance:** Verifier rejects synthetic, stale, wrong-account or unsupported evidence.  
**Likely paths:** `tools/rs377-chatgpt-bridge/`, `tools/rs377-companion-contract/`, `research/parity/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-031 — Reconcile historical quest list against latest main and PRs

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-007  
**Implement:** Rebuild source statuses of all 104 quests after pending branches and pinned overlays.  
**Acceptance:** CSV contains every quest exactly once with committed/PR/live-proof statuses.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-032 — Validate every historical quest's required prerequisites

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-031  
**Implement:** Check each 377 quest start NPC, quest/skill prerequisites and relevant cache IDs.  
**Acceptance:** Quest cannot start illegitimately, and legal fresh account can reach starter.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-033 — Complete a real historical quest end-to-end in fresh world

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-009, JR-029, JR-032  
**Implement:** Drive an easy representative quest via normal client from start through reward and relog.  
**Acceptance:** Authoritative QP/XP/item postconditions and relog recorded.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-034 — Audit stage transitions across all 104 historical quests

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-031, JR-033  
**Implement:** Extract every stage, journal flag, script branch, reward-once condition.  
**Acceptance:** Stage audit reports unsupported transitions, not only missing quest folders.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-035 — Rebuild four known quest source stubs without damaging originals

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-034  
**Implement:** Resolve Recruitment Drive, Mourning's End II, Cabin Fever and Recipe for Disaster with PR collision map.  
**Acceptance:** Each works in disposable world or is marked stage-blocked with exact missing step.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-036 — Sequence remaining 23 quest source-gap candidates newest-first

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-007, JR-032, JR-034  
**Implement:** Create gated work orders ordered release-newest but first satisfy quests/skills/regions dependencies.  
**Acceptance:** Every candidate has dependency set, current branch and first failing real step.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-037 — Classify 673 NPC Talk-to handler candidates

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-031  
**Implement:** Resolve morphs, spawned state, inherited category, alternate handler and no-op actions.  
**Acceptance:** Every candidate has a justified classification rather than automatically flagged broken.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-038 — Verify 487 statically spawned NPC dialogue candidates

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-037, JR-033  
**Implement:** For reachable NPCs, test op1 access and observed dialogue/service result with normal client.  
**Acceptance:** Evidence logs each working, unhandled, unreachable or gated case.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-039 — Audit authentic 377 banking and merchant UI

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-009, JR-018  
**Implement:** Test deposit/withdraw, item notations, shop buy/sell, stock and full inventory.  
**Acceptance:** Inventory/coin deltas and post-relog bank/stock persistence validated.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-040 — Test 377 ground item and object interactions

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-017, JR-028, JR-029  
**Implement:** Run item-on-object, pick-up, doors/ladders and concurrent-take tests.  
**Acceptance:** Server handles claim conflict and no item dupe across restart.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-041 — Verify all 21 377 skill loops and XP semantics

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-017, JR-033  
**Implement:** For every skill prove at least one legitimate input→XP/output, level-up and relog.  
**Acceptance:** 21 individually cited evidence records; unsupported skills remain incomplete.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-042 — Verify 377 combat/death/loot cycle

**Phase:** P3 · **Priority:** P1 · **Size:** M (low-confidence initial estimate) · **Dependencies:** JR-017, JR-029  
**Implement:** Exercise melee/ranged/magic, prayers, drops, death and retrieval in disposable environment.  
**Acceptance:** Authoritative HP/XP/loot and death state persist with no unintended loss.  
**Likely paths:** `research/rs377/`, `content-patches/rs377/`, `tools/rs377-npc-dialogue-audit/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-043 — Prototype modern independent client and local game loop

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-021, JR-026  
**Implement:** Create original-art demo with local login, camera, 30 FPS minimum on target hardware.  
**Acceptance:** Original player crosses area and saves; no 377 packets misinterpreted.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-044 — Design scalable region streaming and spatial indices

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-028, JR-043  
**Implement:** Load/unload terrain, NPCs and interactables by proximity without stalling ticks.  
**Acceptance:** Stress benchmark bounded heap, map completion and no missing collision.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-045 — Implement interior/exterior visibility and precise collisions

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-028, JR-044  
**Implement:** Doors, roofs, furnishings, windows and indoor/exterior transitions remain valid.  
**Acceptance:** Automated interior suite finds no black-window logic gaps or impassable doors.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-046 — Build skeletal animation and interactable entity states

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-043, JR-044  
**Implement:** Support walk/idle/work/fight/cast/ship animations with distinct state transitions.  
**Acceptance:** Animations follow authoritative actions without NPC freezing.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-047 — Add independent effect/audio pipeline with licence manifests

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-043  
**Implement:** Implement FX, sound events and music/ambience from cleared/original assets.  
**Acceptance:** Asset manifest passes provenance scan; effects align with server ticks.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-048 — Implement accessible desktop/mobile camera and input

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-043  
**Implement:** Mouse/keyboard/touch path requests, camera zoom, accessible text scaling.  
**Acceptance:** Actions all usable on target desktop and touch device; no click-through loss.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-049 — Build scalable minimap, world map and path previews

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-028, JR-043  
**Implement:** Client displays location, region, accessible route and instance boundaries.  
**Acceptance:** Path changes when blocked; no inaccessible shortcut advertised.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-050 — Develop versioned UI component/interface description layer

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-022, JR-043  
**Implement:** Reusable declarative forms for dialogue, inventory, bank, quest, ship and abilities.  
**Acceptance:** Server validates interaction IDs and rejects spoofed form choices.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-051 — Implement action bars, cooldown and hotkey presentation

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-027, JR-050  
**Implement:** Provide modern RS3-style multi-slot bar and independent OSRS-style UI profiles.  
**Acceptance:** UI accurately reflects server-authoritative cooldown and locked abilities.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-052 — Implement branch-aware quest journal and dialogue presentation

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-024, JR-050  
**Implement:** Render real options, quest markers, progression, prerequisites and readable hints.  
**Acceptance:** Selecting dialogue advances correct quest state or reports a safe failure.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-053 — Build skills UI for 30-concept reference taxonomy

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-023, JR-050  
**Implement:** Per-mode caps and level-up unlock rendering without implying all systems exist.  
**Acceptance:** Unimplemented concepts show disabled capability, not fabricated XP.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-054 — Build transactional modern inventory/equipment/bank interface

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-018, JR-023, JR-050  
**Implement:** Client reconciles optimistic view to server commits, stacked/charged/bound item rules.  
**Acceptance:** Disconnect mid move/craft leaves consistent inventory and bank.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-055 — Prototype rendered moving boat connected to sea navigation

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-044, JR-046, JR-048  
**Implement:** Move boat and boarded avatars with camera, docking and collision.  
**Acceptance:** Two logged-in viewers see same boat location and intact boarded player.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-056 — Implement instance and player-owned home framework

**Phase:** P4 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-026, JR-028, JR-050  
**Implement:** Create party/private instance IDs, portals and home permissions.  
**Acceptance:** Unauthorized entry/build attempts fail; furniture/world state persists.  
**Likely paths:** `research/parity/roadmap/`, `src/`, `tests/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-057 — Implement independent OSRS-style historical tick combat rules

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-021, JR-027, JR-042  
**Implement:** Version-specific accuracy, weapon speeds, prayer and special attack model.  
**Acceptance:** Deterministic fixtures validate combat states and damage bounds.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-058 — Create OSRS-style resource, recipe and equipment registries

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-023, JR-029  
**Implement:** Original definitions with tool tiers, item sources/sinks, crafting chains and levels.  
**Acceptance:** Every recipe has obtainable inputs and output, no free grants.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-059 — Implement Hunter and creature tracking loops

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-028, JR-058  
**Implement:** Tracking, traps, wildlife spawns, level checks and peaceful collection.  
**Acceptance:** Resource cycles, inventory, XP and catch cooldown persist.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-060 — Implement Construction and household building

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-023, JR-056, JR-058  
**Implement:** Room planning, furnishings, costs, permission flags and persistence.  
**Acceptance:** Child can decorate permitted room but cannot grief shared storage.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-061 — Implement Sailing water navigation and hazard graph

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-028, JR-044  
**Implement:** Sea mesh, currents, collisions, shoreline/port boundaries and path invalidation.  
**Acceptance:** Boat cannot sail onto land and reroutes after map change.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-062 — Implement boat construction, hull and facility components

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-055, JR-058, JR-061  
**Implement:** Original raft/skiff/ship prototypes with parts, storage and upgrades.  
**Acceptance:** Upgrade consumes resources once and persists stats/appearance.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-063 — Implement ship crew and companion operator roles

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-062  
**Implement:** Owned NPC companions with assignment, stamina/task limits and no remote AI services.  
**Acceptance:** Crew continues server-authoritative task and stops on disable.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-064 — Implement ports, embark/disembark and docking transitions

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-061, JR-062  
**Implement:** Attach passengers to boat; safely leave/enter port and instance.  
**Acceptance:** Reconnection cannot strand a player in void/sea.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-065 — Implement sea charting, navigation discoveries and logs

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-061, JR-064  
**Implement:** Discovery marks, shipboard journals, charting rewards and duplicate protection.  
**Acceptance:** Each chart discovery pays only once and is visible after relog.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-066 — Implement salvage, shipwreck and maritime resources

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-062, JR-065  
**Implement:** Fishing net, salvage hook, debris spawns and item cargo lifecycle.  
**Acceptance:** Full cargo, concurrent salvage and disconnect are dupe-safe.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-067 — Implement Sailing XP and port contract progression

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-057, JR-065, JR-066  
**Implement:** Level-gated courier/salvage tasks with repeatable orders and progression.  
**Acceptance:** Port contract completion and XP survive restart; task cannot repeat rewards.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-068 — Implement OSRS-style spellbooks, runes and prayer gating

**Phase:** P5 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-057, JR-058, JR-050  
**Implement:** Separate spell unlocks, rune consumption, spell targets and prayer points.  
**Acceptance:** Actual combat/teleport/use-on with correct resource accounting.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-069 — Build full OSRS quest prerequisite semantic graph

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-024, JR-031  
**Implement:** Enumerate every live quest and miniquest with version/lineage and prereq edges.  
**Acceptance:** Graph includes November 2026 changes; no prereq cycle or unlinked starter.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-070 — Create original quest content pipeline with stage replay proof

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-029, JR-052, JR-069  
**Implement:** Reusable quest scripts, interaction specs, validation and reward-once semantics.  
**Acceptance:** One original multi-branch quest passes fresh-account/relog/negative tests.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-071 — Plan and implement modern OSRS-style regions incrementally

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-044, JR-049, JR-061  
**Implement:** Separate world-graph region packs with metadata, object reachability and portals.  
**Acceptance:** Each new region passes nav, collision, return-home and save tests.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-072 — Audit and implement modern NPC services and monster behaviours

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-046, JR-071  
**Implement:** Original NPC AI with trade/bank/talk/follow/attack and boss phase hooks.  
**Acceptance:** NPCs act purposefully and do not jam doors; interactions pass observed tests.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-073 — Implement modular boss and encounter state machines

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-042, JR-057, JR-072  
**Implement:** Phase-graph triggers, telegraphing, aggro, loot tables, respawn and reset.  
**Acceptance:** Boss defeat grants loot once; failure/restart recovers safely.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-074 — Implement family-scaled co-op raid instances

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-056, JR-073  
**Implement:** Solo/2-player selectable difficulty, puzzle resets, NPC helper substitutions.  
**Acceptance:** Both players can complete with no external third/fourth participant.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-075 — Implement modern OSRS-style skilling/minigame rotation

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-053, JR-058, JR-057  
**Implement:** Reusable timed/repeatable minigames, scheduling and reward currencies.  
**Acceptance:** Minigame entry/exit and reward scores survive disconnection.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-076 — Implement achievement diaries, clue and collection logs

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-029, JR-069, JR-075  
**Implement:** Typed trigger/event book covering skilling, quests, loot, bosses and diaries.  
**Acceptance:** Complete a log slot through real action; no manual status spoofing.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-077 — Implement offline merchant economy and safe market substitutes

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-018, JR-058  
**Implement:** NPC supply/demand and asynchronous local offers, no public trading dependency.  
**Acceptance:** Buy/sell/stock/tax accounting remains balanced and reboot-safe.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-078 — Automate modern quest/region/boss playthrough evidence

**Phase:** P6 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-030, JR-069, JR-070, JR-074, JR-076  
**Implement:** Playtest many quest stages, transitions and co-op events with disposable profiles.  
**Acceptance:** Dashboard shows verified, blocked, untested and rights-gated separately.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-079 — Create isolated RS3-style combat and progression profile

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-021, JR-024, JR-027  
**Implement:** Independent XP caps, quests, item stats and player abilities from OSRS/377.  
**Acceptance:** Cross-mode state tests detect accidental XP, item or quest writes.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-080 — Implement action ability engine with server tick validation

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-051, JR-079  
**Implement:** Basic/threshold/ultimate abilities, targets, costs and range in separate ruleset.  
**Acceptance:** Invalid cooldown/range/adrenaline requests rejected.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-081 — Implement adrenaline, cooldowns and defensive statuses

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-080  
**Implement:** Adrenaline gain/spend, shields, status stacking, damage-over-time and interruption.  
**Acceptance:** Replay matches cooldown and mitigation reference fixtures.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-082 — Implement RS3-style combat styles and switching

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-079, JR-080  
**Implement:** Melee, Ranged, Magic and Necromancy style-specific stats and equipment.  
**Acceptance:** Style switch recomputes stats and invalidates illegal equipped items.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-083 — Implement original Necromancy ritual and progression loop

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-029, JR-053, JR-079  
**Implement:** Ritual sites, consumables, souls/resource pool, level unlocks and instancing.  
**Acceptance:** Ritual consumes valid inputs and awards XP once with persistent soul tally.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-084 — Implement Necromancy conjures and incantation combat

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-080, JR-081, JR-083  
**Implement:** Server-owned summoned entity lifetimes, ability targets and resource costs.  
**Acceptance:** Conjures cannot spawn indefinitely; logout/death clean-up verified.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-085 — Implement Summoning familiars and pouch progression

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-028, JR-079, JR-082  
**Implement:** Pouch crafting, charm resources, summon duration, follower tasks and inventory.  
**Acceptance:** Familiar uses resources, follows owner and despawns safely on restart.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-086 — Implement procedural Dungeoneering floors and group scaling

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-056, JR-079, JR-081  
**Implement:** Generated floor seeds, puzzle locks, equipment rules, safe exits and co-op difficulty.  
**Acceptance:** Solo/dual players can enter, solve, complete, and keep legitimate rewards.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-087 — Implement Divination gathering and energy conversion

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-058, JR-079  
**Implement:** Wisp nodes, conversion activities, caches and level prerequisites.  
**Acceptance:** Energy changes accounted for; no infinite XP loop.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-088 — Implement Invention disassembly, augmentations and perks

**Phase:** P7 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-023, JR-029, JR-079  
**Implement:** Materials, item ownership, gizmos, perk combination rules and charges.  
**Acceptance:** Item augments persist; material balances and charge depletion correct.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-089 — Implement Archaeology dig sites, excavation and restoration

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-044, JR-058, JR-079  
**Implement:** Original dig layers, damaged artefacts, restoration materials, research and collections.  
**Acceptance:** Excavate/restoration consumes resources and unlocks milestones.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-090 — Implement archaeology mystery and relic-effect framework

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-024, JR-089  
**Implement:** Persistent investigation flags, world changes and configurable passive effects.  
**Acceptance:** Mystery state and relic restrictions survive logout/restart.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-091 — Implement RS3-style modern region content packs

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-044, JR-049, JR-079  
**Implement:** Versioned sea/land/city/underground original map regions and transitions.  
**Acceptance:** Every region loads, NPCs spawn, interactions work and return route exists.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-092 — Implement RS3-style branching story and quest systems

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-052, JR-090, JR-091  
**Implement:** Complex cutscenes, quest choices, lore sequencing and post-quest world changes.  
**Acceptance:** Original multi-quest chain retains choices and unlocks after relog.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-093 — Implement RS3-style boss hub, encounters and elite dungeons

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-056, JR-081, JR-091  
**Implement:** Boss portals, selectable difficulty, phases, rewards, storage and group scaling.  
**Acceptance:** Each hub entry/boss/floor fully playable with restart-safe rewards.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-094 — Implement modern skill cap upgrades and advanced progression

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-053, JR-079  
**Implement:** Support 99/110/120 virtual and special mastery caps as profile-specific data.  
**Acceptance:** XP function, level-up/UI and post-cap unlocks correctly follow chosen mode.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-095 — Implement personal ports, farms and long-running activities

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-026, JR-079, JR-091  
**Implement:** Background-time tasks driven from local clock with deterministic offline catch-up.  
**Acceptance:** Tasks neither require internet nor produce unbounded offline rewards.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-096 — Implement RS3 achievements, boss logs and completion trackers

**Phase:** P8 · **Priority:** P2 · **Size:** L (low-confidence initial estimate) · **Dependencies:** JR-029, JR-079, JR-094  
**Implement:** Progress events, titles, collections, mastery counters and replay safety.  
**Acceptance:** Every award maps to a confirmed gameplay event and persists.  
**Likely paths:** `research/parity/data/`, `research/parity/roadmap/`, `tools/parity-inventory/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-097 — Add parent safety controls and child-accessibility acceptance

**Phase:** P9 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-012, JR-015, JR-020, JR-050, JR-054  
**Implement:** World-specific comfort settings, combat/death toggle, readable UI and permissions.  
**Acceptance:** Parent lock enforced by server; real child-profile solo/play tests pass.  
**Likely paths:** `research/parity/`, `tools/parity-inventory/`, `.github/workflows/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-098 — Finish exhaustive modern reference enumerator and gap reconciliation

**Phase:** P9 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-030, JR-031, JR-037, JR-058, JR-069, JR-079  
**Implement:** Paginated all quest/NPC/item/region/ability lists with source/provenance, IDs, dates, aliases and nulls.  
**Acceptance:** No false exhaustive flag; full page cursors, unique counts, source dates and disputes recorded.  
**Likely paths:** `research/parity/`, `tools/parity-inventory/`, `.github/workflows/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-099 — Enforce file-level licences and public repo privacy gates

**Phase:** P9 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-001, JR-023, JR-043, JR-070, JR-098  
**Implement:** Provenance manifest, forbidden proprietary assets, cache/binary/credential scan and manual review.  
**Acceptance:** CI blocks unauthorised media/private data and incompatible code licence mixing.  
**Likely paths:** `research/parity/`, `tools/parity-inventory/`, `.github/workflows/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.

### JR-100 — Run whole-program regression, performance and recoverability acceptance

**Phase:** P9 · **Priority:** P2 · **Size:** XL (low-confidence initial estimate) · **Dependencies:** JR-006, JR-016, JR-020, JR-030, JR-078, JR-096, JR-097, JR-098, JR-099  
**Implement:** Separate profile test matrices, offline cold boot, 2-device LAN, 100 quest/skill/boss probes and backup drill.  
**Acceptance:** Release only when required live tests pass; no synthetic VERIFIED_PLAYABLE.  
**Likely paths:** `research/parity/`, `tools/parity-inventory/`, `.github/workflows/`.  
**Evidence gate:** source/automated checks; a *real disposable player and save/relog test* for gameplay state, then reviewed promotion.



## Operating contract

- Check active main and existing PRs before opening any new branch; don't overwrite others' edits.
- Never run on the production family world or overwrite its saves without verified isolated restore and explicit host approval.
- For historical 377 items, validate against pinned upstream files first; no speculative merchant/NPC/quest copies.
- For modern references, record rights/provenance before implementation; open-source engine licences do not license Jagex creative assets.
- Keep original OSRS-like and RS3-like rulesets separate; each completed feature must have exact version, client/server SHA, save-schema version and gameplay evidence.

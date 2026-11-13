# Windows JoshRS improvement research — 13 November 2026

Scope: existing home Windows revision-377 family world only. Research performed against fetched GitHub main d3e869cc4875eba404714eedb698470f2c5c3a48, current PR metadata and installed source selected by active.json. No runtime edits, restarts, deployments or save writes were performed for this audit. This is an implementation recommendation, not gameplay certification.

## Findings that affect every change

- The installed launcher is an extracted/customised tree. The separate Git checkout has unrelated dirty bot work; preserve it.
- Installed play.ps1, Protect-Elrothiro.ps1 and save-integrity.ps1 are NOT byte-identical to current main. Compare their actual behaviour and preserve local repairs before integrating anything.
- Claude remains the designated quest/runtime installer in this conversation. Read-only research can proceed alongside it; shared content edits, builds and restarts require a single runtime owner.
- JoshMemory resume_brief returned no historical handoff or active lease for project JoshRS at this checkout. Local worktrees and GitHub remain the available concrete evidence; absence of a memory lease does not mean Claude is idle.
- A desktop shortcut now points at the installed play.ps1. Earlier checks confirmed a Java client window, reachable game TCP and HTTP 200 from /crc. Those checks do not prove all quests playable.

## 1. Quest journal

Already present: native questlist button handlers, quest progress colours, and journal rendering calls. Installed Cook journal is scripts/quests/quest_cook/scripts/cook_journal.rs2; general/scripts/quests.rs2 contains send_quest_progress_colour and update_questlist. The Peace Shirt deliberately has no quest-list entry and uses existing permanent varp_724 for stages 0–6.

Existing related tool: tools/questops/add-quest-journal-entries.py adds entries for a different content layout (scripts/player/interfaces/questlist.if). It does not establish compatibility with the installed 377 interface data or build checksum checks. Do not run it on production.

Recommended implementation: first prototype a stage-aware journal using native journal rendering and existing varp_724 in a disposable copy. A dedicated dialogue option on the three quest NPCs can open it without adding a client interface component. Separately investigate a genuine quest-tab entry: exact component registry, interface pack and client-cache compatibility must be proven before adding it. Never replace an existing quest entry or disable build checksum checks to make room.

Acceptance: correct objectives for stages 0–6; unchanged progress/rewards; updates after each stage and relog; no stale text from another player's journal; scroll/text fit in the real Java client; existing quest entries still work. Opening the journal must be read-only with respect to quest progress.

## 2. Interaction feedback

Already present: installed engine Player.ts defaultOp calls tryFallbackOp before sending “Nothing interesting happens.” There are existing interaction and ladder repairs, so a global generic replacement is not sufficient to diagnose missing handlers.

Recommended implementation: capture the exact NPC/location/item ID, option, coordinate and quest stage in an opt-in local diagnostic path; reproduce in a disposable world; repair the specific handler or add a truthful quest prerequisite hint. Preserve exact historical dialogue where fidelity is intended. Do not turn unknown interactions into guessed doors, shops, rewards or teleports. Review existing fallback behaviour before changing shared Player.ts.

Acceptance: normal click produces the intended effect; wrong stage gives accurate feedback; unrelated interactions, distance, plane and category/morph handling still behave correctly. Log no credentials or raw saves.

## 3. Family co-op

Already present: the Peace Shirt's merged evidence includes two concurrent disposable players with separate progress. Stage and rewards are per character; each player supplies their own wool. That is independent multiplayer, not a shared quest system.

Recommended implementation: preserve per-character quest state and add clear participation guidance first. If shared objectives are later wanted, define opt-in membership, range, disconnect behaviour, item ownership and reward eligibility before coding. Never synchronise all quest varps or grant a reward simply because another player completed it.

Acceptance: two accounts at different stages; one logs out; one declines; only one has wool; simultaneous hand-ins; one completes/relogs while the other stays incomplete; no duplicate rewards. Verify through normal interaction on a disposable two-player world before family use.

## 4. Save protection

Already present in source: Protect-Elrothiro.ps1, save-integrity.ps1, support.ps1, native .sav CRC inspection, SHA-256 manifests, account database inspection, read-only autosave checks, offline backup guards and family-save checks. Open PR #155 also addresses both family saves and synthetic regression tests; its overlap must be reviewed, not assumed missing or merged.

The examined main backup code refuses active game/web ports, copies saves and SQLite files, verifies hashes and publishes a completed snapshot. No JoshRS-named scheduled backup task was found; observed matching tasks were control-centre opening and remote-main recovery. This does not exclude automation under other names.

Recommended implementation: compare installed guards with main/#155, then prove backup and recovery using private disposable copies. Start with automatic backups at a verified offline boundary, retention and visible last-verified time. A backup is not proven recoverable until a separate restored test world can load it. Preserve both human characters and every other existing character.

For later online SQLite snapshots, use SQLite's backup API or VACUUM INTO rather than ordinary file copying. A consistent database snapshot alone does not synchronise separate .sav files: coordinate successful save completion or use an offline checkpoint for a coherent world snapshot. Recovery must refuse an active destination and preserve the current state before replacing files. Never test restore against the live world.

Primary references: https://www.sqlite.org/backup.html and https://www.sqlite.org/wal.html .

## 5. Launcher

Already present: installed play.ps1 handles server readiness, process-role mutexes, JDK 21 selection, CRC preflight, logs and Java client launch. The source control centre already includes status and backup actions. The desktop shortcut is already created.

Open PR #169 proposes one-click guarded updates and repair; #165 is its older predecessor. Review #169 and the installed customisations before starting another updater. PR #178 is a separate Bash/Git-worktree batch quest installer: the active extracted Windows content is not a clean Git checkout, so it cannot be assumed suitable.

Recommended implementation: extend the existing control centre with clear Starting / Ready / Failed states, an error-log action, last verified backup and a versioned installed-content manifest. Keep Play separate from update/repair. A play action should never install packages, reset a database or silently upgrade content. Readiness should check the expected server identity, not just any open port. Preserve working JDK and client argument repairs.

Acceptance: cold launch; existing server; repeated clicks; occupied unrelated port; corrupt save; missing Java; client launch failure; no duplicate services; no updates or save resets from Play. Use synthetic fixtures and disposable ports.

## 6. Quest verification

Already present: tools/rs377-quest-playtest, quest audit/questops tools, per-quest evidence and open gameplay work. PR #323 is merged; #189 and #190 are still open acceptance-related work. Source/build success and imported folder counts are not completion evidence.

Important limitation: dialogue_test.mjs uses development cheats, teleports, item grants and NPC spawning on the tester's tile. Its 37 Peace Shirt checks are useful dialogue/state/persistence coverage, but do not establish natural NPC reachability, walking routes or gathering supplies. Retain them as assisted protocol tests, not a full unassisted playthrough.

Recommended implementation: add a separate normal-action acceptance tier: find naturally spawned NPCs, walk the route, acquire resources normally, complete, check exact rewards, relog and repeat reward interaction. Keep assisted tests for speed, with explicit labels. Extend existing test tools rather than build another parallel harness. Use a disposable Java-client world for visual and route acceptance; PR #190 is related prior work requiring review.

## Recommended sequence

1. Read-only comparison of installed/main/open-PR launcher and backup code; agree file ownership and record exact installed-content hashes.
2. Backup/recovery proof on disposable copies; launcher diagnostics and regression checks on disposable ports.
3. Normal-action Peace Shirt playthrough to expose route/access problems before adding UX.
4. Native stage-aware journal prototype; full quest-tab entry only after interface/cache compatibility proof.
5. Specific interaction repairs found by playtesting, one tested patch at a time.
6. Family participation guidance; shared objectives only under an explicit design with independent reward tests.

Each release: separate worktree -> exact customised disposable runtime -> compiler/packer -> targeted regression -> real client and save/relog -> reviewable diff and rollback -> one authorised offline deployment. Do not merge stale overlapping PRs wholesale.

## Live GitHub references checked

- https://github.com/Parris-Tech-Services/JoshRS/pull/323 — merged Peace Shirt/dialogue/tests.
- https://github.com/Parris-Tech-Services/JoshRS/pull/155 — open family backup verification.
- https://github.com/Parris-Tech-Services/JoshRS/pull/169 — open guarded Windows updater.
- https://github.com/Parris-Tech-Services/JoshRS/pull/178 — open batch installer with clean-Git precondition.
- https://github.com/Parris-Tech-Services/JoshRS/pull/190 — open isolated Java-client acceptance work.

PR metadata and descriptions were reviewed; this audit does not certify their current CI, mergeability or complete diffs. No PR was merged or deployed.

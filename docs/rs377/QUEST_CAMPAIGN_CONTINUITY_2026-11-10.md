# JoshRS revision-377 quest campaign — reconciled continuation (10 November 2026)

**Owner issue:** [#186](../../issues/186) — full historical quest-by-quest source AND gameplay verification. This is a continuation checkpoint, **not** another campaign, new quest implementation, or proof of game completion.

## Required separation of worlds and evidence

| Evidence | What it proves | What it does **not** prove |
| --- | --- | --- |
| [`tools/rs-sdk-quests/ELROTHIRO_LAB_LOG.md`](../../tools/rs-sdk-quests/ELROTHIRO_LAB_LOG.md), [`QUEST_STATUS.md`](../../tools/rs-sdk-quests/QUEST_STATUS.md) | The **historical RS-SDK bot environment** recorded 22 quest completions, 51 QP and 25× XP (e.g. Cook +7,500 XP). Detailed logs/playbooks should be reused as **research and strategies**. | Completion on JParrisDesktop revision 377. [`docs/QUEST_MATRIX.md`](../QUEST_MATRIX.md) explicitly attributes the `QUEST_STATUS.md` run to **revision 225**. An older [reconciliation note](../quests/QUEST_RECONCILIATION.md) instead says 377; **these historical claims conflict**. Until a contemporaneous engine/content hash and original account/run logs settle the discrepancy, label the environment `HISTORICAL_SDK_REVISION_CONFLICT`, never count its 22 against the current live world. |
| [Fred/George native bot test](../../tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.test.ts) | Native 377 engine exercise of Cook stage 1→2, 300 XP and persistence infrastructure. | **No-cheat collection or a genuine full quest playthrough:** the test calls `george.invAdd(... bucket_milk/egg/pot_flour ...)` before hand-in. Account persistence alone is insufficient. |
| [Fedora 377 campaign runner](../../tools/rs377-fedora-quests/README.md), [`campaign.mjs`](../../tools/rs377-fedora-quests/campaign.mjs) and [Cook playbook](../../tools/rs377-fedora-quests/playbooks/cook.ts) | Separate disposable revision-377 action harness and a real-ingredient route drafted for Cook's Assistant. Runner enforces isolated identity, real action effect checks and checkpoints. | The coordinator **never marks a quest fully verified**; at best it records `PARTIAL_NORMAL_GAMEPLAY_OBSERVED` pending authoritative completion, reward-once, relog and native Java-client proof. Source/synthetic tests are not live playthroughs. |
| [`tools/rs377-family-visible`](../../tools/rs377-family-visible/README.md) and [HarnessView1 Cook handoff](AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md) | A separate normal-client rev377 experiment in Fedora and its intended next Cook's Assistant test. | Patrol/login, bot visibility, and packet dispatch do **not** establish a completed quest. Do not confuse this Fedora world with Windows family production or rs-jimmy's older 225 gateway. |
| [JParrisDesktop live-audit tooling](../../tools/rs377-live-quest-evidence/README.md) | Windows source/compiled-pack audit plus a **private save snapshot**; no writing to the live game. | A compiled quest, journal entry, named start trigger, or save `DONE(n)` alone does not prove every required gameplay step or correct one-time rewards. |

**Fresh owner-supplied Windows results, 10 Nov:** the 104-row static audit classified **53 `IMPLEMENTED - NOT PLAYTESTED`**, **29 `PARTIAL`**, **20 `MISSING`**, and **2 `BLOCKED (no start handler)`**. The two blocker flags (Demon Slayer and Fishing Contest) are known *static detector false positives*: area scripts have differently named NPC handlers. Six `MISSING` rows even show trigger presence; **do not conflate detection columns, trigger presence, and executable quest stages**. The private save decoder returned 74 quest-state rows, including one recorded completion and multiple started quests. **Do not commit, upload, copy into a public issue, or overwrite personal saves, names or player-progress CSVs.** The source-only [live audit note](LIVE_QUEST_AUDIT_2026-11-10.md) predates these fresh results.

## Resume the existing campaign — oldest first

**Canonical 104 historical quests:** [`research/rs377/QUEST_QUEUE_2026-11-08.json`](../../research/rs377/QUEST_QUEUE_2026-11-08.json). They are not the 64-quest 274 world or the historical 225 SDK catalogue; seven additional miniquests are tracked separately. Do not add quests by comparing raw directory names.

Read-only queue command **from a current JoshRS checkout with Bun**:

```bash
bun tools/rs377-fedora-quests/run.ts --plan --oldest --no-miniquests
```

This reports **source-only ordering**, not playable coverage. `--oldest` is essential: the existing runner defaults to **newest first**. The engine cannot be controlled from this GitHub-only handoff.

**Earliest genuinely unproven no-cheat revision-377 test: #1 Cook's Assistant (`cook`).** Existing source evidence and playbooks already cover the intended sequence. Do not restart it from scratch:

1. Read and reconcile **actual local checkpoint files** under `~/.local/state/joshrs-quests/` (Fedora), the existing Agy/Claude scratchpads and lab logs, existing PRs, and `playbooks/cook.ts`. Inspect timestamps, engine/content hashes, world identity, control mechanism, and outcome. Preserve all checkpoint files. A genuinely matching completed run may supersede this handoff; otherwise carry on from the last proven action.
2. Work on an **isolated ordinary revision-377 player**, with separate database, game ports and compiled content. Use the existing controller and Cook playbook. Implement the missing **observed** dialogue/choice/normal game action path rather than creating an unrelated quest runner.
3. Prove **real Cook dialogue**, ordinary pot, egg, bucket and milk collection, wheat, mill/flour, hand-in, quest stage `0→1→2`, ingredient consumption, **300 Cooking XP at 1×**, **1 quest point**, completion journal and no double rewards. No `invAdd`, `setVarp`, teleport, admin commands or save edits count as natural questing.
4. Prove ordinary **logout and relog**, same character and stage/rewards intact, with a redacted trace and the exact compiled engine/content SHA; verify the graphical Java-client interaction where possible. If unavailable, label `SERVER_GAMEPLAY_ONLY` or `BLOCKED_JAVA_CLIENT_PROOF` rather than `VERIFIED_PLAYABLE`.
5. Only when Cook meets the [#186](https://github.com/Parris-Tech-Services/JoshRS/issues/186) gates, continue to **#2 Demon Slayer**, then the remainder in **canonical oldest-first/dependency-aware order**. Reuse historical bot strategies, but rerun in the actual 377 target version. Preserve failed-playbook evidence and use targeted repairs on the responsible owner branch.

**Known practical gap:** `tools/rs377-fedora-quests/run.ts --run --all` will produce blocked rows for quests without reviewed playbooks; it is not a push-button 104-quest completion program. Start with a bounded `--only cook --oldest` disposable run after the authenticated SDK gateway and separate test world have genuinely been established. The gateway URL/token examples in the README are placeholders, **not discovered live services**. Confirm its same-world authentication, normal-client state and one-controller lease; do not force past refusal guards.

## Ownership and progress contract

- **Claude Code:** quest source/integration, NPC dialogue-capable test client, original Peace Shirt quest, independent quest gameplay QA and handoff for #173/#178. Do not write competing content under Claude's owned branches.
- **DeepSeek:** staircase/door and unique Fedora interaction bugs, issue #293; may contribute quest regression evidence but **not** duplicate Claude's implementations.
- **This GitHub reconciliation:** evidence taxonomy, historical-source correction and clear **next checkpoint**. It cannot run a local Windows client from GitHub or claim its quest runs.
- **Live safety:** no changing or restarting JParrisDesktop's occupied world; no active accounts/saves, direct varp/item grants, bot takeover, altered production packs or recompilation. Source-only docs/merges do not deploy to Windows.

For each quest keep five separate columns: **source exists**, **compiled in named world**, **real isolated native quest completion**, **one-time rewards/save-relog**, **actual target Java client verified**. A previously complete quest in an unrelated world retains its evidence *there* only. A quest is `VERIFIED_PLAYABLE` only when **all applicable #186 acceptance evidence** is linked; do not inflate totals from lab labels, code compilation, private stage `DONE(n)`, bot action responses or synthetic tests.

**Checkpoint:** SOURCE RECONCILIATION COMPLETE; actual new 377 no-cheat end-to-end quest completion **NOT VERIFIED BY THIS PASS**; next playable target = **Cook's Assistant**, reuse existing playbook and checkpoints.

# JoshRS repository-wide evidence and unfinished-work audit — 2 November 2026

**Status:** GITHUB HISTORY AUDITED / LIVE RUNTIME NOT VERIFIED / HISTORICAL CONVERSATION COVERAGE NOT PROVABLY COMPLETE.

**Purpose:** This is a correctness audit of the master backlog, not a promise that all gameplay is fixed. It reconciles previously omitted work from earlier ChatGPT sessions, all accessible GitHub issue/PR listings, documentation and relevant source inspection. It preserves both distinct products: (1) the **private customised #377 family world** and (2) **original Woodlands**, which is not the same game. The independent historical rev274 research target is a *third baseline*, not proof the customised rev377 user save is in that build.

## 1. Coverage ledger (explicitly checked)

| Source | Coverage this audit | Limitation |
|---|---|---|
| GitHub issues | All 12 currently OPEN: #3, #5, #28, #29, #30, #34, #35, #36, #49, #50, #52, #55. No CLOSED issues returned by the connected issue search. | Issue state is not equivalent to feature status. |
| GitHub PRs | All 49 listed PRs; 48 merged, 1 open DRAFT (#59). Titles, descriptions and merge status checked. | Source merges can still lack runtime acceptance. |
| GitHub branches | All 52 returned names; pagination confirmed exhausted. | No cross-branch diff/unique unmerged code scan; 51 non-main branches are not automatically unfinished. |
| GitHub commits | Recent commits plus targeted history for Tideglass, Android, 377 research and Luna. | Did not replay or inspect every individual commit/file in the repository history. |
| Project documents | 31-Oct unfinished register, 111-task AI list, 114-entry classic MMO checklist, 377 research/feature audit, content recovery and source harvesting, Tideglass, map expansion, Luna, social, Windows and browser bridge. | Not a complete recursive read of every source or document under every directory. |
| Source code | Sampled FredGeorgeBot.test.ts, family client, login handler and targeted files; source/docs checked for explicit claims. | **Private code search returns 0 results even for known symbols; GitHub connector does not expose a recursive file-tree read.** Full repo-wide TODO/FIXME/source scan not completed. |
| GitHub CI | Read combined statuses for George no-cheat PR, Android, bot and docs commits. | Combined statuses return Vercel statuses only, not proof of all GitHub Actions tests, nor real local Java gameplay. |
| Prior ChatGPT JoshRS work | Searched historical conversation context in multiple thematic queries, including clients, Windows, gameplay, bots, Tideglass, maps, and family-world bugs. | Historical conversation context cannot enumerate every past chat. Older unindexed turns may be missing. |
| Live JParris Desktop | Prior user PowerShell/Java logs and Agy reports reviewed. | **No direct interactive desktop connection, no current database/backup inspection, no in-client testing.** |

## 2. Critical factual corrections to the earlier backlog

1. **Party Room items:** The user subsequently observed deposited items **back in balloons**. Therefore permanent item loss is **NOT established**. Still audit dangerous chest-clearing conditions and any genuinely missing items; do not inject replacement items without evidence.
2. **Fred/George:** Engine-side autonomous functions and benchmark snapshots do not prove family-world autonomy. [Family TCP client](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/rs377-bot-bench/fred-george-family-client.mjs) sends keepalive and four fixed waypoints; real no-cheat family quest proof remains missing.
3. **George Cook's Assistant:** Mainline original test adds egg, flour and milk directly; [draft PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59) strengthens acceptance but is **not merged and not proven passing**.
4. **Android:** PRs #60 and #61 are merged, but their own descriptions call them **offline visual prototypes, not revision-377 clients**. A flat green-grid UI was improved to original isometric artwork; current real account login/gameplay still unverified.
5. **Tideglass Isle:** Original source pack, JM2 source and static CI support exist, but `expansions/archaeology-island/README.md` explicitly says **not installed or playable inside #377**.
6. **Historical map:** Research on later OSRS/RS3 regions and blank squares is *not* integrated terrain. Blank map may instead be an incorrect overlay or legitimately absent terrain. Don't silently graft modern assets into rev377.
7. **Windows #377:** Previous user diagnostics exposed game 52402 listener loss and login rejection even after `World ready`; several launcher repair PRs do **not** prove current live startup or retained saves.
8. **NPCs:** Source-trace and synthetic CI for Reldo/Juliet/Romeo do **not** prove generic greeting or missing NPC interaction is repaired in the active script pack.
9. **Woodlands:** Browser original-game improvements and item-conservation fixes are distinct from the live #377 player saves, shops, skills and quest state.
10. **CI interpretation:** A combined Vercel status for the no-grants PR showed success, but this is **not the missing 377 test**. The Android visual commit has a Vercel build-rate-limit failure unrelated to native Android gameplay.
11. **Merged versus delivered:** 48 merged PRs do not mean 48 gameplay features are actually playable. Most clearly document runtime/integration follow-ups.
12. **Historical conversation specificity:** The earlier original 114-task MMO list and 111-item AI list were separate. A single count summing their items overcounts duplicated outcomes; neither can honestly be labelled 'all unfinished work'.

## 3. Full PR reconciliation — all 49 pull requests

Merge state verified by fetching individual PR metadata. The following groups cover every PR **exactly once**. An older merged PR stays merged; its unverified user-facing outcome remains on the backlog.

- **Authenticated historical/private hosting and release research:** [#1](https://github.com/Parris-Tech-Services/JoshRS/pull/1), [#2](https://github.com/Parris-Tech-Services/JoshRS/pull/2). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Original Woodlands/browser game, feature and licensing contract:** [#4](https://github.com/Parris-Tech-Services/JoshRS/pull/4), [#6](https://github.com/Parris-Tech-Services/JoshRS/pull/6), [#7](https://github.com/Parris-Tech-Services/JoshRS/pull/7), [#8](https://github.com/Parris-Tech-Services/JoshRS/pull/8), [#31](https://github.com/Parris-Tech-Services/JoshRS/pull/31), [#33](https://github.com/Parris-Tech-Services/JoshRS/pull/33). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Revision-377 server, source import, Windows launch and repair:** [#10](https://github.com/Parris-Tech-Services/JoshRS/pull/10), [#11](https://github.com/Parris-Tech-Services/JoshRS/pull/11), [#12](https://github.com/Parris-Tech-Services/JoshRS/pull/12), [#13](https://github.com/Parris-Tech-Services/JoshRS/pull/13), [#14](https://github.com/Parris-Tech-Services/JoshRS/pull/14), [#15](https://github.com/Parris-Tech-Services/JoshRS/pull/15), [#16](https://github.com/Parris-Tech-Services/JoshRS/pull/16), [#17](https://github.com/Parris-Tech-Services/JoshRS/pull/17), [#18](https://github.com/Parris-Tech-Services/JoshRS/pull/18), [#56](https://github.com/Parris-Tech-Services/JoshRS/pull/56). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Optional initial woodcutter bot:** [#9](https://github.com/Parris-Tech-Services/JoshRS/pull/9). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Historical source acquisition, licensing, rights and compiler:** [#19](https://github.com/Parris-Tech-Services/JoshRS/pull/19), [#20](https://github.com/Parris-Tech-Services/JoshRS/pull/20), [#21](https://github.com/Parris-Tech-Services/JoshRS/pull/21), [#22](https://github.com/Parris-Tech-Services/JoshRS/pull/22), [#23](https://github.com/Parris-Tech-Services/JoshRS/pull/23), [#24](https://github.com/Parris-Tech-Services/JoshRS/pull/24), [#25](https://github.com/Parris-Tech-Services/JoshRS/pull/25), [#26](https://github.com/Parris-Tech-Services/JoshRS/pull/26), [#27](https://github.com/Parris-Tech-Services/JoshRS/pull/27). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Historical and customised quest/map source diagnostics:** [#32](https://github.com/Parris-Tech-Services/JoshRS/pull/32), [#41](https://github.com/Parris-Tech-Services/JoshRS/pull/41). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **NPC/Varrock scripts, greetings and source-harvest verification:** [#37](https://github.com/Parris-Tech-Services/JoshRS/pull/37), [#38](https://github.com/Parris-Tech-Services/JoshRS/pull/38), [#39](https://github.com/Parris-Tech-Services/JoshRS/pull/39), [#40](https://github.com/Parris-Tech-Services/JoshRS/pull/40), [#42](https://github.com/Parris-Tech-Services/JoshRS/pull/42), [#43](https://github.com/Parris-Tech-Services/JoshRS/pull/43), [#44](https://github.com/Parris-Tech-Services/JoshRS/pull/44), [#45](https://github.com/Parris-Tech-Services/JoshRS/pull/45), [#46](https://github.com/Parris-Tech-Services/JoshRS/pull/46), [#47](https://github.com/Parris-Tech-Services/JoshRS/pull/47). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Friends/PM configuration and diagnostics:** [#48](https://github.com/Parris-Tech-Services/JoshRS/pull/48), [#57](https://github.com/Parris-Tech-Services/JoshRS/pull/57), [#58](https://github.com/Parris-Tech-Services/JoshRS/pull/58). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Rellekka/Yrsa clothing shop source fix:** [#51](https://github.com/Parris-Tech-Services/JoshRS/pull/51). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Fred/George bot benchmark and reporting infrastructure:** [#53](https://github.com/Parris-Tech-Services/JoshRS/pull/53), [#54](https://github.com/Parris-Tech-Services/JoshRS/pull/54). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Native Android offline prototype:** [#60](https://github.com/Parris-Tech-Services/JoshRS/pull/60), [#61](https://github.com/Parris-Tech-Services/JoshRS/pull/61). Merged source; see runtime/acceptance gates before calling gameplay finished.
- **Strict no-grant George quest test — DRAFT, NOT MERGED:** [#59](https://github.com/Parris-Tech-Services/JoshRS/pull/59). #59 OPEN DRAFT; all others in this group merged.

**Aggregate:** 48 merged; only open PR = draft #59. No unmerged closed PR in the returned set. This counts GitHub PRs, not all internal branches, local uncommitted edits or issues.

## 4. Evidence-linked reconciled workstreams

Each row here is a **canonical higher-level outcome** or deliberately narrow missed-history task; the original 111 and 114 line-item checklists remain linked, not deleted. Rows overlap finer-grained checklist tasks. `repo` means safe source/issue work can be done via GitHub; `runtime` means cannot mark VERIFIED PLAYABLE without the Windows game; `history` means chat context may be incomplete.

| ID | Priority | Task / required acceptance | Evidence scope | Primary evidence |
|---|---|---|---|---|
| CRIT-01 | P0 | Recover full active family world runtime: game 52402, login, web, Friends; preserve old saves and DB; reproduce process crash and authentication failure | runtime | [`docs/rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md) |
| CRIT-02 | P0 | Determine outcome and root cause of Party Chest accepted-items reset/Inventory.add wrappers; confirm recovered items in balloons and prevent the damaging clear flow on next deposit | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/52) |
| CRIT-03 | P0 | Confirm Sylvie's four-piece pink outfit (including the missing top/boots) and avoid silently replacing items before checking bank/inventory; verify Yrsa shop live | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/pull/51) |
| CRIT-04 | P0 | Prevent automatic engine reload, experimental scripts or bot loops from hanging production; verify safe rollback and friend/login service startup | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/30) |
| GAME-01 | P1 | Implement/verifiably test Luna popping Party Room balloons legitimately, without duplicating or consuming party drops | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/34) |
| GAME-02 | P1 | Implement Luna's real contextual assistance for questing, fishing, woodcutting, mining, banking and combat; preserve follow/chat and consent gates | repo+runtime | [`docs/rs377/LUNA_CONTEXT_AWARE_COMPANION_2026-10-31.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/rs377/LUNA_CONTEXT_AWARE_COMPANION_2026-10-31.md) |
| GAME-03 | P1 | Verify Pious Pete candle minigame repaired in personalised 377 runtime, including collision, dialog, puzzle and item state | runtime | [`docs/377_NATIVE_CONTENT_INTEGRATION.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/377_NATIVE_CONTENT_INTEGRATION.md) |
| GAME-04 | P1 | Verify interactive 377 full-world map and 39-destination teleport network with real UI layering, click-to-open, camera focus and safe destinations; distinguish previously committed source vs loaded runtime | runtime | [`docs/fedora-377/FEATURE_AUDIT_2026-10-30.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/fedora-377/FEATURE_AUDIT_2026-10-30.md) |
| GAME-05 | P1 | Verify exact source-only fixes for the RuneScape login-region music and actual playback after clean relaunch | runtime | [`docs/377_NATIVE_CONTENT_INTEGRATION.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/377_NATIVE_CONTENT_INTEGRATION.md) |
| GAME-06 | P1 | Review user-requested 200-level skill extensions and original 1–99 XP curve constraints as optional personalised-world feature; do not change existing 99s or live saves without opt-in | repo+runtime | [`docs/FULL_CLASSIC_MMO_CHECKLIST.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/FULL_CLASSIC_MMO_CHECKLIST.md) |
| GAME-07 | P2 | Inventory/equipment QoL previously requested: gear preset manager, portable banking, protected admin panel and custom shortcuts; confirm scope before implementation and separate from 28+28 pouch | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/50) |
| GAME-08 | P1 | Add real meaningful NPC dialogue/branching to selected verified NPCs; fix generic greeting fallback and broken triggers using current packed scripts, no speculative replacements | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/36) |
| GAME-09 | P1 | Verify the client Skill Guide buttons and Quest Journal buttons are interactive and correct with 21 period-correct skills and available quests | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/29) |
| GAME-10 | P1 | Implement and test 28+28 accessible portable item storage with UI, atomic transfers and persistence, preserving all existing slots | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/50) |
| MAP-01 | P1 | Complete Tideglass Isle conversion from original concept/JM2 source to compatible 377 map/collision/models/NPC/RuneScript/quests and real-client gameplay | repo+runtime | [`expansions/archaeology-island/README.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/expansions/archaeology-island/README.md) |
| MAP-02 | P1 | Audit genuinely blank 377 terrain squares vs water, version gaps or map UI errors; keep 2026 OSRS and RS3 additions separately gated by assets and era | repo+runtime | [`research/rs377/MAP_EXPANSION_2006_TO_2026_2026-10-30.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/research/rs377/MAP_EXPANSION_2006_TO_2026_2026-10-30.md) |
| MAP-03 | P2 | Evaluate user-requested 25-quest/15-system and regional 2006–2026 expansion packs individually against existing content and legal art constraints; avoid bulk installs | repo+runtime | [`research/rs377/CONTENT_RECOVERY_BACKLOG_2026-10-30.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/research/rs377/CONTENT_RECOVERY_BACKLOG_2026-10-30.md) |
| CLIENT-01 | P1 | Bring Sylvie second-player VM to full customised desktop client parity: zoom, fullscreen, scaling, world map, control layout and chat; preserve separate saved identities | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/30) |
| CLIENT-02 | P1 | Fix Mac-to-Windows VM remote play (Royal TSX / RDP forwarding) and Chrome Remote Desktop click/crash problems, supported on older Mac | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/30) |
| CLIENT-03 | P1 | Resolve ProBook Java client resizing, black screen/stall and web server/Gradle startup through Tailscale; prove local gameplay and safe logout | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/30) |
| CLIENT-04 | P1 | Verify Android streaming of real saved Elrothiro gameplay from desktop with authenticated, private, non-destructive LAN/Tailscale connection | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/commit/0d6d3085e98b44d0021f232956b4dc4a9baf5b61) |
| CLIENT-05 | P1 | Complete native Kotlin Android app past offline original-isometric visual prototype to actual revision-377 client or compliant remote viewer; verify on Galaxy A55 | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/pull/61) |
| CLIENT-06 | P1 | Verify browser 377 protocol bridge real login, cache, movement, persistence and mobile controls, not just a working TCP->WebSocket tunnel | repo+runtime | [`tools/web377-bridge/README.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/tools/web377-bridge/README.md) |
| CLIENT-07 | P1 | Prove JParris Windows one-click setup from both Fedora USB and Google Drive recovery sources, full client build, customised world map, safe rollback, precise selected snapshot and preserved player state | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/30) |
| BOT-01 | P0 | Repair George no-grants Cook's Assistant test and implement every legitimate item-acquisition, dialogue, milling and delivery step (PR #59 draft); isolated real-time 600ms proof | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/pull/59) |
| BOT-02 | P0 | Replace family-world Fred/George four-waypoint patrol clients with authoritative same-world native action engine, persistent true progression, no duplicate identities | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/55) |
| BOT-03 | P1 | Build shared Observation377/Action377 planner and Barry/Larry/Gary/Rory personalities and genuine no-cheat quests; avoid 289/377 incompatibilities | repo+runtime | [`docs/rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/rs377/AI_AGENTS_MASTER_TODO_2026-11-02.md) |
| BOT-04 | P1 | Repair telemetry: cross-window XP rollback, disconnected reports, 0/12 missing snapshots and separate production from isolated test worlds | repo | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/55) |
| BOT-05 | P1 | Prove existing Luna Challenge/Friends/PM/follow/trade and contextual dragon assist work in correct combat/social rules; no silent actions | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/34) |
| RESEARCH-01 | P1 | Map all six configuration-only 377 quest roots, historical 104 quests and encounter/minigame sources to actual runnable state and playable outcomes | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/28) |
| RESEARCH-02 | P2 | Complete source-rights/licence and compatibility audit for historical engines and open-source RuneScape bot libraries before source reuse | repo | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/28) |
| WOOD-01 | P1 | Deploy and verify original Woodlands item conservation and save-import fixes through actual Vercel served build, independent of 377 | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/pull/33) |
| WOOD-02 | P1 | Finish authenticated server-authoritative zero-subscription original Woodlands multiplayer world, original 2004-look assets and existing 114-point MMO checklist | repo+runtime | [`docs/FULL_CLASSIC_MMO_CHECKLIST.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/FULL_CLASSIC_MMO_CHECKLIST.md) |
| HOST-01 | P1 | Verify local/private historically sourced engine host fail-safe, backups and restore, origin binding and player login; don't publish proprietary assets | runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/3) |
| HOST-02 | P2 | Demonstrate independent original no-cost hosting, origin limits, real mobile/desktop gameplay, rights clearance and complete rollback proof | repo+runtime | [source](https://github.com/Parris-Tech-Services/JoshRS/issues/5) |
| QA-01 | P0 | Review CI: Vercel build-rate-limit on Android commit is not a pass/fail on Android game functionality; native engine/Java clients require separate tests | repo | [source](https://github.com/Parris-Tech-Services/JoshRS/pull/61) |
| QA-02 | P1 | Make GitHub progress evidence coherent across issues, 49 PRs, 52 branches and active source documents; preserve merged ≠ deployed ≠ playable states | repo | [`docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md) |
| QA-03 | P1 | Audit possible unmerged source living in 51 non-main GitHub branches, comparing each to main; don't assume a branch's existence proves work undone | repo | [source](https://github.com/Parris-Tech-Services/JoshRS/branches) |
| QA-04 | P1 | Run full code-tree TODO/FIXME and filename/schema scan on an authorised repo checkout, as connected GitHub code search returns no private results; collect test/artifact evidence | repo+runner | [source](https://github.com/Parris-Tech-Services/JoshRS) |
| QA-05 | P1 | Reconcile closed/merged PR descriptions: source-only, isolated CI, real client and save verification; reopen/track missing acceptance via issue without undoing merged patches | repo | [source](https://github.com/Parris-Tech-Services/JoshRS/pulls?q=is%3Apr+is%3Aclosed) |
| QA-06 | P1 | Reconcile further historical JoshRS ChatGPT requests with repository source; prior conversations cannot be exhaustively enumerated by current context retrieval | history | [`docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md`](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md) |

## 5. Additional earlier-chat requirements not correctly surfaced before

These were recovered via targeted project-history retrieval and require explicit acknowledgement, even where they also appear above:

1. **Pious Pete candle quest/minigame** and exact visual world-map layering/39-teleport behaviour: source changes previously reported but current client verification is outstanding.
2. **User-requested 1–200 level extension** was discussed for the local personal 377 game; ensure it is optional and never silently alters historical 1–99 XP rules or 99s already achieved.
3. **Equipment conveniences** (Ultimate Gear Manager, presets, portable bank and admin interface) were earlier wishes and not established as deployed features; clarify against 28+28 pouch prior to mutating inventory schema.
4. **Tideglass Isle** was built as a source bundle but lacks server scripts, packed 377 objects, loaded region and verified quest completion; avoid mislabelling it playable.
5. **Party Room balloons:** recovered contents reappeared in balloons, but Luna cannot pop them yet; character behaviour and chest reset remain separate tasks.
6. **Sylvie's dark-pink four-piece clothing** needs exact top/boots/account item location check; source Yrsa shop patch alone is not proof clothing restored.
7. **Mac RDP / VirtualBox and second-client parity** still need user-verified stable play including zoom, fullscreen, worldmap and mouse-click behaviour.
8. **ProBook Tailscale Java client resizing** and local web bridge 8888 / 18888 handshake remain separate from family game server repair.
9. **Original 377 login music** was inserted into `login.rs2` by a local agent but final client playback not verified.
10. **Two separate restoration inputs** (Fedora USB and Google Drive upload) were discussed, and their completeness was never cross-validated.
11. **Luna context awareness** is a specific requirement: mirror the player's *activity*, not merely follow a waypoint, and obey legal single-/multi-combat rules.
12. **Modern features from 2006–2026** were requested as optional later additions, but neither content compatibility nor asset permissions are established.

## 6. 52 branch triage

Connected GitHub branch search returned 52 names and a final empty page. One is `main`; 51 others require eventual divergence comparison if the goal is to prove no orphaned unfinished code. Several branches correspond to merged PRs, e.g. Android foundation/visual preview; a branch remaining after merge is NOT evidence of incomplete work. A draft PR branch `test/george-no-cheat-full-quest-20261101` is genuinely not merged. Do **not** delete branches, reset local checkouts or squash experimental code without inspection.

## 7. Distinct product and licensing boundaries

- Private personal **revision 377** has customised source/game cache/accounts/saves on JParris Desktop; GitHub docs and source patches are not the same as installed runtime.
- **Original Woodlands** is an independently authored browser RPG on Vercel and has its own [114-task MMORPG acceptance checklist](https://github.com/Parris-Tech-Services/JoshRS/blob/main/docs/FULL_CLASSIC_MMO_CHECKLIST.md). Existing original single-player systems do not prove hosted multiplayer.
- Historical **revision 274** is a pinned historical design/deployment research baseline for independent world experimentation, not a substitute for the current #377 character.
- Game engine MIT licence does not clear rights to Jagex assets, sounds, map, models, text or public server hosting. Do not distribute or upload private user saves/DB/passwords in CI/artifacts.

## 8. Priority delivery order and stop gates

1. **P0 current family world**: read-only runtime provenance; validate saves/backups; genuine game/login listeners; protect users from surprise restarts.
2. **P0 potential item-loss mechanisms**: Party Room chest/balloon provenance, inventories, banking and extra pouch; no speculative item grants.
3. **P1 gameplay acceptance**: broken NPC interactions and quests, minigames, world map, client parity, friends/PM, Luna duo, Pious Pete and real quests.
4. **P1 AI bot action engine**: strict no-cheat Cook's Assistant from genuine resources in an isolated #377 world at real 600 ms; one real family-world bot only after verified backup/consent.
5. **P1 modern client expansion**: native Android vs streamed existing client; do not ship offline prototype as revision 377.
6. **P1 separate original Woodlands MMO**: original 114-entry checklist, secure multiplayer, legally cleared assets and no-cost hosting.
7. **P2 optional world expansion**: Tideglass Isle and later-era map/skill/quest additions after baseline world stability.
8. **Maintenance**: fix reporting and distinguish source, tested, deployed, in-client verified, and full save/persistence proof.

## 9. Remaining audit blockers and claim boundary

1. **Cannot guarantee every prior ChatGPT conversation** has been surfaced. Historical context searches retrieved useful snippets, not a complete, enumerated transcript archive. A claim of full conversation coverage would be false.
2. **Cannot inspect every file in the private repository through available connected GitHub search**; known queries for `FredGeorgeBot`, `TODO`, and `JoshRS` returned zero despite files existing. File-by-file code TODO scan needs an authenticated full checkout or GitHub workflow artifact, followed by source-line review.
3. **Cannot compare all 51 non-main branches against `main` with currently exposed GitHub operations**; listing branches is not semantic diff/merge analysis.
4. **Cannot independently inspect local uncommitted Agy/Windows modifications** or historical USB/Google Drive restoration images without an authorised read-only runtime connector or mounted upload.
5. **Cannot mark any live issue resolved based on source changes alone**. Specifically current gameplay login, friend presence, quests, Party Room, native Android and independent multiplayer still require physical/client evidence.

**Audit classification:** 49/49 GitHub PRs reconciled; 12/12 open issues reviewed; 52/52 branch names enumerated; core dated checklists inspected; targeted historical chats recovered. Full project source tree, every chat transcript, 51 branch diffs and current production game data remain **BLOCKED**. This report deliberately does not call the audit '100% exhaustive'.

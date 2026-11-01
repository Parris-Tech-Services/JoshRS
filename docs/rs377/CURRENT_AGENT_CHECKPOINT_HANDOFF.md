# JoshRS 377 — current Agy / Claude Code / Codex checkpoint

> **Status: PARTIALLY COMPLETE (source-backed, NOT playable-bot verified).**  
> **Checkpoint:** 2 Nov 2026 AEDT; verified `main` baseline [`5bd5d025bbd82191fe0add4481141ffb251dffb7`](https://github.com/Parris-Tech-Services/JoshRS/commit/5bd5d025bbd82191fe0add4481141ffb251dffb7).  
> This is a **point-in-time baseline**, not a claim that the linked SHA remains HEAD. At each handoff, refresh HEAD, PRs, CI and this document. Do not copy old test results to new commits.

## Implemented and evidenced

| Source / owner | Exact files / changes | Test evidence and boundary |
| --- | --- | --- |
| **ChatGPT #21–24**: standalone rev-377 packet, login and observer contracts | `tools/rs377-chatgpt-bridge/src/{protocol,session,observation,native-observer}.mjs`; [PR #69](https://github.com/Parris-Tech-Services/JoshRS/pull/69) | [22 passing **offline** tests + SDK source hash check](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41353513958). Not real observed gameplay. |
| **ChatGPT #25**: SDK mapping/HTTP/native dispatch scaffolding | `tools/rs377-chatgpt-bridge/src/{sdk-bridge,sdk-runtime,sdk-gateway}.mjs`; [dispatch commit `f4583b2d89ba0fb5822d70e24e99cbce6e9f069c`](https://github.com/Parris-Tech-Services/JoshRS/commit/f4583b2d89ba0fb5822d70e24e99cbce6e9f069c), [HTTP commit `f8978aee9982ffb5352e56d7df911c86c857d777`](https://github.com/Parris-Tech-Services/JoshRS/commit/f8978aee9982ffb5352e56d7df911c86c857d777) | Earlier [recheck](CHATGPT_TASK_25_INDEPENDENT_COMPLETENESS_RECHECK_2026-11-02.md) predates these merges. **Incomplete**: actual pinned SDK typed integration and real disposable 377 state/action→effect proof. [PR #83](https://github.com/Parris-Tech-Services/JoshRS/pull/83) open; [PR #84](https://github.com/Parris-Tech-Services/JoshRS/pull/84) draft; do not label these merged. |
| **ChatGPT #26–30**: loopback gateway, identity/lease/tick guards, outcomes/recovery | `tools/rs377-controller-boundary/lib/{gateway,native377-transport,guard,controller,outcomes,recovery}.mjs`; [native binding `be808c4197c7c41471ec61b83d9fb929f2f923b6`](https://github.com/Parris-Tech-Services/JoshRS/commit/be808c4197c7c41471ec61b83d9fb929f2f923b6) | [Controller CI passing](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358230061); [38 offline/security tests previously passing](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358127810). TCP listener and engine HTTP fixtures were **simulated**; real disposable server login + gateway negatives remain unverified. |
| **ChatGPT #31–35**: safe companion modes, scenarios, disposable isolation and two-client assertions | `tools/rs377-companion-contract/src/{companion,session-policy,scenarios,isolation,run-integration,two-client,evaluate-capture}.mjs`; [merge `936963ff11f33d7aede3f5984848e27b34e2e050`](https://github.com/Parris-Tech-Services/JoshRS/commit/936963ff11f33d7aede3f5984848e27b34e2e050) | [29 passing offline tests](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41357762929); no live two-client evidence. |
| **ChatGPT #36**: real-gameplay acceptance *evaluator and negative tests*, not real gameplay | `tools/rs377-companion-contract/src/gameplay-acceptance.mjs`, `test/gameplay-acceptance.test.mjs`, `package.json`; [merge `5bd5d025bbd82191fe0add4481141ffb251dffb7`](https://github.com/Parris-Tech-Services/JoshRS/commit/5bd5d025bbd82191fe0add4481141ffb251dffb7) | [Main JoshRS checks success](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358284463) (including `npm test`); targeted contract tests can be run with `npm run check --prefix tools/rs377-companion-contract`. No genuine NPC/bank/XP/relog capture yet. |
| **ChatGPT #12**: bootstrap failure fixtures | `tools/rs377-agent-harness/fedora/test-bootstrap.sh` on [draft PR #76](https://github.com/Parris-Tech-Services/JoshRS/pull/76) | [Checklist #12](CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md) records Codespaces evidence. **Draft branch**, not merged to `main`; do not assign its GitHub merge to Agy. |

## Known defects and unverified gates

- **#25 — PARTIALLY COMPLETE:** normal `BotAction` mapping and native dispatch scaffolding exist; pinned RS-SDK TypeScript compile + *real* `BotWorldState` ingestion and observed action effect remain unproven. Review open PRs #83/#84 and existing source first; do not duplicate them.
- **#26 — PARTIALLY COMPLETE:** gateway security passes simulator tests; it has **not** authenticated a disposable bot in a real isolated Engine-TS world or proved lease/identity/staleness/cancel behaviour there.
- **#36 — SOURCE DELIVERABLE ONLY:** anti-synthetic NPC/object/gathering/bank/XP/persistence assertions exist. No witnessed successful gameplay passes.
- **#37–39, #41–42 — tracker remains unfinished** until a current source/test review establishes otherwise. Do not tick solely based on a nearby document or old fixture.
- **Host/world uncertainty:** Fedora `/home/josh/dev/JoshRS/` and Windows JParrisDesktop may point to *different* 377 worlds. No verified same-world Elrothiro + bot session, client Friend List, 1x XP, or save/relog proof.
- **Concurrent work:** at this checkpoint [PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59), [#62](https://github.com/Parris-Tech-Services/JoshRS/pull/62), [#76](https://github.com/Parris-Tech-Services/JoshRS/pull/76), [#83](https://github.com/Parris-Tech-Services/JoshRS/pull/83), [#84](https://github.com/Parris-Tech-Services/JoshRS/pull/84) and [#86](https://github.com/Parris-Tech-Services/JoshRS/pull/86) were open. **Refresh status before acting**: some may have merged/changed since this baseline.
- **Production safety:** do not open public ports, invent world/skills, copy private keys, send cheats/admin grants, change/save family accounts, restart the authoritative server, force-push, reset someone else's worktree or let untrusted chat execute shell commands.

## Ownership and next actions

| Who | Must do / must not delegate |
| --- | --- |
| **ChatGPT (GitHub source owner)** | Reconcile and implement **all 42 ChatGPT-owned source/research/CI tasks**, especially unfinished #25–26 and #37–39, #41–42; fix/verify tests, open/merge appropriate PRs, update this handoff. Do **not** assign source code, CI, research, docs or merges to Agy merely because source work remains. |
| **Agy (authorised local Fedora executor)** | **Only** machine-dependent read-only preflight, identification of the real Elrothiro world/server, then safely isolated disposable engine/account execution **after** reviewing permissions and source. Do not modify the family world to satisfy tests. |
| **Claude Code / Codex (whichever has GitHub/source access)** | Continue ChatGPT's incomplete independent source changes and tests, coordinate branch ownership; use Agy only for local information/proofs impossible from GitHub. |
| **Human/operator** | Explicitly approve any family-world testing, shutdown, backups/restores or deployment. |

## Next local action

**Agy's smallest safe action — one read-only Fedora preflight, no game restart or login:**

```bash
cd /home/josh/dev/JoshRS && node tools/rs377-bot-preflight/fedora-preflight.mjs
```

Its redacted output establishes current checkout SHA/branch and available listeners, **not** a shared world. Only after reviewing that result should a separate read-only world-identity check be considered. **ChatGPT's immediate independent action** is to inspect current PRs #83/#84/#86 and finish/testing remaining GitHub-only adapter and evidence work; no Agy delegation.

## Checkpoint update protocol

At **every merge, significant PR, CI failure/fix or local test result**, the active GitHub-capable agent must (1) check real `main` SHA and open PRs, (2) edit this single handoff with exact **full commits, changed file paths, passing test commands + run links, failing tests/known defects, implementation boundary and single next local action**, (3) update the 42-task checkbox **only for independently verified acceptance**, (4) run `node tools/rs377-handoff/verify.mjs` and `node --test tools/rs377-handoff/verify.test.mjs`, (5) commit and verify the file on GitHub. Never claim a CI run for a different SHA tests the new commit; label fixture tests **offline**. Do not expand this into repeated general prompts to Agy.

**Separate five-state acceptance verdicts:** GitHub source **PARTIALLY COMPLETE**; Fedora preflight on actual host **UNVERIFIED**; disposable normal #377 bot session **UNVERIFIED**; same-world Elrothiro bot **UNVERIFIED**; fully autonomous playable bot **UNVERIFIED**.

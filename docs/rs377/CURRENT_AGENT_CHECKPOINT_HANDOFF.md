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

## Fedora workstation checkpoint — user-supplied terminal output, 2 Nov 2026

**Evidence classification:** Actual local Fedora process output **provided by the operator**; it is not a repository CI run and does not establish that a real server, player or bot logged in. The source test commands were executed in an independent shallow clone; existing Agy/game worktrees were not modified by them.

| Observed fact | Exact result |
| --- | --- |
| Machine/environment | `AVANCE-WS7`, Fedora 44 KDE, Node **v26.5.0**, npm **11.17.0**, Git **2.56.0**, Java **25.0.4.1**, Gradle wrapper **9.2.0**, Agy on PATH |
| Clean test checkout | `/home/josh/joshrs-test-L5aVBQ/JoshRS`, `main` **`9c3f9e8ebf07d4174f7cf1f52b9ea9ba952af43b`** (actual operator output) |
| Separate Agy checkout (read-only observed) | `/home/josh/dev/JoshRS-rssdk-harness`, branch `agy/rs377-rssdk-fedora`, **`4d87f95f97fdc733907be944df0558dedc7622d5`**, no tracked changes reported |
| SDK protocol/adapter | `npm run check --prefix tools/rs377-chatgpt-bridge` — **33 passed, 0 failed** on Fedora clone |
| Controller boundary/security/evidence | `npm run check --prefix tools/rs377-controller-boundary` — **48 passed, 0 failed** on Fedora clone |
| Companion and gameplay evidence contracts | `npm run check --prefix tools/rs377-companion-contract` — **34 passed, 0 failed** on Fedora clone |
| **Total** | **115/115 passing source/fixture tests**; includes simulated TCP/gameplay tests, **no** verified real game |
| Listener observation | None seen on Fedora ports `52402,8888,8898,45099,43500,43501,53402,8988`; no server running on any *checked* port at that moment, not proof none elsewhere |
| Game source paths reported present | `/home/josh/dev/JoshRS/lostcity377`, `/home/josh/lostcity377`; the old Fedora world may contain valuable saves — **never start/overwrite it to satisfy disposable testing** |
| Safe temporary test profile | `/tmp/joshrs-377-disposable-kVlUAJ/manifest.json`, world `isolated-e4ae1c84bf29`, test ports `53402/8988/53500/55099/53501`, account placeholder `HarnessTest`; `prepared_no_game_started` |
| Network | `eno1` default interface; no Tailscale interface detected in the reported Fedora preflight |

**Meaning:** The **Fedora read-only environment diagnostic** and the three **Fedora offline test suites** are now *verified by operator output*, not merely Linux CI. The **actual disposable 377 engine/server, normal bot login, native adapter, SDK action effect, two Java clients, same-world Elrothiro/Sylvie and persistent autonomous gameplay are still unverified**. There is no JParris Desktop access at this checkpoint; Fedora, ThinkPad and ProBook are available.

**Immediate safe next command on Fedora (verify existing generated manifest, not create another checkout):**

```bash
cd /home/josh/joshrs-test-L5aVBQ/JoshRS
node tools/rs377-companion-contract/src/run-integration.mjs --verify /tmp/joshrs-377-disposable-kVlUAJ/manifest.json
```

If the temporary directory no longer exists, a new `--prepare` may be needed; do not claim that the world ever started. Next, **inspect** the existing local engine paths, services and configuration *names only* before deciding how to create a new isolated engine checkout. Do not run the historic `start-server.sh` against its potentially valuable saves.

## Fedora installation identity checkpoint — operator output, 2 Nov 2026

**Verified by supplied terminal output (read-only; no game started):**
- `/home/josh/dev/JoshRS` **is not a Git repository**. It is a mixed working/game directory containing `engine/`, `content/` and `lostcity377/`, archives and large local files. `git rev-parse` there fails correctly; the JoshRS GitHub preflight script is not at that directory's root. **Do not `git init`, `git clean`, reset or replace this folder.**
- `/home/josh/lostcity377` is a **symlink** to `/home/josh/dev/JoshRS/lostcity377`: these are **one installation, not two isolated worlds**.
- The installed engine at `/home/josh/dev/JoshRS/lostcity377/engine` reports Git HEAD abbreviated **`8901ddaa`**. This is **not the pinned upstream revision** `b5ac859b47915afb545e60e4c1208f25d43cb3fb` in `deploy/jparris-windows/upstreams.json`; whether this reflects custom commits, different branch or pin divergence remains unverified until inspecting the full Git SHA/status. Do not switch to upstream SHA before checking working changes and saves.
- On Fedora, `ss -ltnp` showed no listening game/web ports `52402` or `8888`, and `ps -eo pid,comm` found no `node`/`java`/`gradle` processes at that instant. **This does not say anything definitive about remote JParris Desktop.**
- Installed scripts `start-server.sh` and `status-joshrs.sh` and `engine/package.json` exist. The local launch script contents have **not** been reviewed; running `start-server.sh` may load real local saves and is **not authorised** as an isolated test.
- The already-prepared profile at `/tmp/joshrs-377-disposable-kVlUAJ/manifest.json` **passed `--verify`** with result `isolated_manifest_verified_no_game_started`, world `isolated-e4ae1c84bf29`, test ports game `53402`, web `8988`, login `53500`, Friends `55099`, logger `53501`, placeholder account `HarnessTest`. **No actual game instance or player account exists merely because the manifest passed.**
- User has Fedora, ThinkPad and ProBook available now, **not** JParris Desktop. Java two-client acceptance can be attempted with the laptops later only after the separate disposable server and bot actually work.

**Next local action: read-only installation/source identity inspection; no additional clones or repeat tests.**

```bash
BASE="$HOME/dev/JoshRS/lostcity377"
echo "Canonical installation: $(readlink -f "$BASE")"
echo "Alias: $(readlink -f "$HOME/lostcity377")"
for part in engine content client-java; do
  dir="$BASE/$part"
  echo "=== $part ==="
  if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$dir" rev-parse HEAD
    git -C "$dir" branch --show-current
    git -C "$dir" status --short --untracked-files=no
  else
    echo "Not a Git worktree: $dir"
  fi
done
echo "=== Existing server status (read-only diagnostic) ==="
bash "$BASE/status-joshrs.sh"
```

**Do not** print `.env`, passwords, private keys, raw SQLite/player saves or service secrets; avoid starting `start-server.sh` until the source and data isolation are proven. GitHub-only agent work to implement/check real adapter, compile and CI remains ChatGPT/Claude/Codex responsibility; do not delegate that to Agy.

## Installed 377 engine/content source checkpoint — 2 Nov 2026

**Evidence: operator's actual AVANCE-WS7 Fedora terminal output, no game launched.** Current installation root `/home/josh/dev/JoshRS/lostcity377` is a non-Git wrapper directory; `/home/josh/lostcity377` is a symlink to it. `/home/josh/dev/JoshRS` is also a non-Git source container, **not** where `tools/rs377-*` can be run. The dedicated tools clone at `/home/josh/dev/JoshRS-tools` was verified clean on `main` commit `b665681e5917727eb0d903777cb5a063c37b95` (historical snapshot).

| Actual local source | Exact HEAD | Tracked status from operator | Safety |
| --- | --- | --- | --- |
| `lostcity377/engine` | `8901ddaa7e83f366383002f4b7a7e8ef2af0a0f2` | `377-wip...origin/377-wip [ahead 32]`, no tracked modifications shown | **Preserve 32 local commits**; do not reset to upstream pin or modify original |
| `lostcity377/content` | `9d636cf42280fb324c53f54e9fd79c3763a07b35` | `377-wip...origin/377-wip [ahead 2]`, no tracked modifications shown | **Preserve 2 local commits**, including scripts/customisations |
| Separate older `/home/josh/dev/JoshRS/engine` | `1d25566cb53e7af1b1cb18ade8af996316c19614` | Branch/dirty status unknown | Do not substitute |
| Separate older `/home/josh/dev/JoshRS/content` | `65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe` | Branch/dirty status unknown | Do not substitute |

**Actual read-only status output:** `status-joshrs.sh` reported game TCP `52402` absent, web `8888` absent, update web `8898` absent, no server/client PID files and HTTP response unavailable. This proves only that this **Fedora installation was not running at that moment**. It is **not** a reason to launch the potentially save-bearing existing world; JParris Desktop remains inaccessible.

**Strong isolated CI evidence that already exists:** [native build + real connected disposable bot/engine observer, passing run 41358968679](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41358968679) is documented in [genuine observation subtask report](TASK25_GENUINE_ISOLATED_377_OBSERVATION_PROOF_2026-11-02.md): real 377 engine, TCP login, 21 skills/XP, inventory/equipment, nearby NPCs, dialogue flags and advancing ticks. **This was performed on GitHub's disposable CI runner, NOT Fedora or the family world**. Newer probe source `tools/rs377-chatgpt-bridge/probe-real-isolated377.mjs` additionally attempts normal SDK `walkTo` action, real position delta, server save and TCP relog. **Do not call these newer goals passed until the matching updated native workflow run has completed successfully.** Full RS-SDK state remains intentionally incomplete; live Java two-client proof is still absent.

**Smallest safe next local action:** a read-only review of `lostcity377/start-server.sh`, `lostcity377/status-joshrs.sh`, the two local commit ranges and location of executable build scripts *without printing secrets*; only then prepare fully independent disposable source copies (no shared saves/DB, no production ports) and test boot. Never run `start-server.sh` from the existing installation to meet a test. No extra repo clone or repeat of 115 already-passing Node tests is needed.

```bash
BASE="$HOME/dev/JoshRS/lostcity377"
for component in engine content; do
  echo "=== $component local commits only ==="
  git -C "$BASE/$component" log --format='%h %s' --no-merges "origin/377-wip..HEAD" | head -45
done
echo "=== Startup script (review only, redact any secrets before sharing) ==="
sed -n '1,180p' "$BASE/start-server.sh"
```

## Verified real isolated #377 SDK movement and save/relogin — CI checkpoint

**Direct evidence (GitHub Actions output, not a fixture):**
- [Native CI run 41360490093 — SUCCESS](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41360490093), commit `0be21cb186f0ee7acdbb5bee20ba554592bd1c44`. The log reports: `verified=isolated_real_377_engine_observation`, real `HarnessProbe` TCP login, advancing engine ticks, 21 skills, inventory/equipment, five genuinely visible NPCs, `genuineSdkGatewayAction=true`, `genuineSdkWebSocketAction=true`, `walkObserved=true`, `saveRelogVerified=true`, `familyWorldTouched=false`, `sdkStateComplete=false`.
- [Native CI run 41360678635 — SUCCESS](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41360678635), commit `84945d23f80e878752c47a7eacb0a653852d871a`. Same positive real isolated-engine action/save/relogin results, 4 observed visible NPCs. These facts are verified from the completed native workflow job logs, **not** just code or documentation.
- [Task-26 branch CI 41360523443 — FAILURE](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41360523443) at commit `1e288ddcfa06671c0ae2bc9f52429bbf076b760c`: real security fixture asserted 403 for forged Host but Node `fetch` supplied a normalised Host and got 200. Parent [PR #98](https://github.com/Parris-Tech-Services/JoshRS/pull/98) subsequently changed this probe to raw `http.request`, which can send a genuinely forged Host header; CI success on that **specific updated commit** must be confirmed independently before calling the additional task-26 negatives passed.
- A duplicate fix PR [#99](https://github.com/Parris-Tech-Services/JoshRS/pull/99) was **closed without merging** when the equivalent correction was found already on PR #98, to avoid conflicting overlapping code.
- **New verified task-26 disposable-world security run:** [CI 41360849867 — SUCCESS](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41360849867) on PR #98 commit `61d8cb577695f7b98fb6d1c09a51a91e6d592d44`. The actual engine log includes `task26RealBoundaryVerified=true`, `task26NoPacketAfterLogout=true`, authenticated read-only observations, wrong bearer/world/player denial, real forged Host + origin rejection, controller lease races, allowlisted normal movement, replay/rate guards, scope isolation, cancellation and post-stop refusal; still **NOT MERGED to main** as of the checkpoint, and not Fedora/family-world acceptance.


**What this actually proves:** The GitHub disposable *pinned engine* can authenticate a normal bot, transmit a genuine SDK/WebSocket-linked movement action over TCP, observe a changed coordinate, save and relog with the position retained. This is a significant integration milestone. It **does not** verify the Fedora-customised engine `8901ddaa`, complete upstream `BotWorldState`, normal NPC actions or multi-client follow/chat, or any family-world login or production deployment.

**Current five gates:** GitHub source **PARTIALLY COMPLETE**; Fedora tools/115 offline tests **VERIFIED from operator output**; disposable #377 bot **VERIFIED in isolated GitHub CI only for login/walk/save/relog**; same-world Elrothiro **NOT VERIFIED**; full autonomous companion **NOT VERIFIED**.

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

**Read-only local commit and startup inspection**, not another clone or preflight. Agy should not repeat ChatGPT-owned source/CI work. The installed engine is 32 commits ahead and content 2 commits ahead; learn how the startup script handles saves, database, ports and process ownership before *any* disposable build.

```bash
BASE="$HOME/dev/JoshRS/lostcity377"
git -C "$BASE/engine" log -n 35 --oneline "origin/377-wip..HEAD"
git -C "$BASE/content" log -n 5 --oneline "origin/377-wip..HEAD"
sed -n '1,180p' "$BASE/start-server.sh"
```

No `start-server.sh`, `git reset`, `git clean`, credentials, saves, or production services should be executed/touched during this inspection. The already-verified Fedora offline tests and disposable **manifest** are not yet actual server runtime proof. GitHub-only SDK + CI integration remains ChatGPT/other GitHub coding-agent responsibility.

## Checkpoint update protocol

At **every merge, significant PR, CI failure/fix or local test result**, the active GitHub-capable agent must (1) check real `main` SHA and open PRs, (2) edit this single handoff with exact **full commits, changed file paths, passing test commands + run links, failing tests/known defects, implementation boundary and single next local action**, (3) update the 42-task checkbox **only for independently verified acceptance**, (4) run `node tools/rs377-handoff/verify.mjs` and `node --test tools/rs377-handoff/verify.test.mjs`, (5) commit and verify the file on GitHub. Never claim a CI run for a different SHA tests the new commit; label fixture tests **offline**. Do not expand this into repeated general prompts to Agy.

**Separate five-state acceptance verdicts:** GitHub source **PARTIALLY COMPLETE**; Fedora preflight and 115 offline tests **VERIFIED from operator output**; disposable isolated normal #377 bot login, SDK/WebSocket walk and save/relogin **VERIFIED ON GITHUB CI ONLY (not Fedora)**; same-world Elrothiro bot **UNVERIFIED**; fully autonomous playable bot **UNVERIFIED**.

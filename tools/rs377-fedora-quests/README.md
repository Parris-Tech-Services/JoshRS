# Fedora: original RS-SDK quest campaign for JoshRS revision 377

**State:** Fedora source/installer and quest-runner implementation. **NOT 104 completed quests.** Designed for the user's Fedora 44 workstation and a **new, isolated** revision-377 world. Windows family saves are not accessed.

The complete, unmodified [MaxBittker/rs-sdk](https://github.com/MaxBittker/rs-sdk) is pinned at `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`. JoshRS already maps 39 RS-SDK action types, but mapping does **not** equal 39 gameplay-verified actions. The old `~/dev/JoshRS-source/rs-sdk` checkout hosted a **revision-225 world**, **not** the 377 family world or an approved substitute for this runner.

## 1. Fedora installation and read-only quest queue

From the actual JoshRS repository (usually `/home/josh/dev/JoshRS-source`):

```bash
cd ~/dev/JoshRS-source
git pull --ff-only
bash tools/rs377-fedora-quests/setup-fedora.sh --check
bash tools/rs377-fedora-quests/setup-fedora.sh --install
export RS377_UPSTREAM_SDK_HOME="$HOME/.local/share/joshrs/rs-sdk-db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb"
bun tools/rs377-fedora-quests/run.ts --plan
```

**Precise behaviour:** `--check` does not download anything. `--install` requires Fedora, Node, Git and Bun, clones SDK into an independent new directory, checks pinned commit, runs `bun install --frozen-lockfile --ignore-scripts`, and refuses to overwrite existing/modified SDK source. It never starts or touches either `~/dev/JoshRS/lostcity377` or `~/lostcity377`, old saved accounts, live databases or game services. It does **not** install Bun or configure root/system services.

`--plan` builds a dependency-aware queue of **104 historical rev377 quests + 7 miniquests**, newest-first by release date when prerequisites allow. It reports source status but **zero verified real quest completions**. Use `--only legends`, `--oldest`, `--no-miniquests` to scope an audit.

## 2. Actual SDK-driven playtesting — isolated world ONLY

`--run` does **not** create a server or obtain credentials. First boot a **separate disposable** 377 game and its *authenticated loopback SDK WebSocket gateway*, using the existing `tools/rs377-chatgpt-bridge`/native observer. In the existing CI reference, `content-factory/smoke_377.py` and `probe-real-isolated377.mjs` prove a genuine session on a separate, temporary database. **Never repoint the family server**, and do not use the existing revision-225 RS-SDK gateway on ports 8888/7780.

The gateway must be created with normal revision-377 session authentication, the opted-in engine observer and isolated 377 world fingerprint. The `RS377_SDK_TOKEN` is a **distinct, private 32+-byte one-time SDK gateway token**, not a player's password; don't put it in GitHub or shell history.

Use your Fedora terminal to supply the authenticated, *already running* disposable controller environment:

```bash
export RS377_UPSTREAM_SDK_HOME="$HOME/.local/share/joshrs/rs-sdk-db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb"
export RS377_SDK_GATEWAY_URL='ws://127.0.0.1:18883/gateway'
export RS377_SDK_BOT_USERNAME='HarnessQuest'
export RS377_SDK_WORLD_ID='isolated-joshrs-quests-377'
# RS377_SDK_TOKEN must come from the actual disposable gateway, not invented here.
export JOSHRS_QUEST_CAMPAIGN_APPROVED='DISPOSABLE_ONLY'
bun tools/rs377-fedora-quests/run.ts --run --all
```

The port, username and world ID above are **example configuration**, not evidence that a matching gateway is already running. They must match the actual temporary gateway and accepted bot session; otherwise the command fails closed.

`--run --all` iterates every listed quest **one at a time** (including optional miniquests), waits for genuine SDK state, checks available **native bot-owned** quest varps, blocks unsatisfied dependencies, executes only reviewed scenario files in `playbooks/`, and checkpoints results atomically under:

`~/.local/state/joshrs-quests/campaign-<timestamp>-<random>.json`

That folder and its files are user-private. Reports contain no passwords, raw inventory, account names, private cache or save DB. Each row says whether a native game action was corroborated; there is no fabricated "quest completed" flag.

### One-command real disposable Fedora 377 smoke

After installing the pinned SDK, the optional sandbox clones the exact
377 engine and content into a **new** directory under
`~/.cache/joshrs-disposable-quests/`, packs the temporary game and runs the
existing real-engine SDK smoke including the 111 quest classifications.

```bash
bash tools/rs377-fedora-quests/sandbox-fedora.sh --check
export JOSHRS_QUEST_CAMPAIGN_APPROVED=DISPOSABLE_ONLY
bash tools/rs377-fedora-quests/sandbox-fedora.sh --run
```

Only free isolated loopback ports 15402/18880/18881 are used, never the
family port 52402. No existing game, save, login or older revision-225 SDK
is read or changed. This command needs Fedora, Node, npm, Bun, Git, Python,
network and disk for pinned upstream clones. It launches and stops a real
throwaway server; it does not demonstrate completed quests. Actual execution
on the physical Fedora workstation remains unverified until run there.

## 3. Coverage, exact limits and proof

| Feature | Current support |
| --- | --- |
| All 104 historical quests + 7 miniquests enumerated | **Source/plan checked** |
| Dependency-aware newest-first queue | **Implemented** |
| Unmodified pinned upstream `BotSDK` and `BotActions` | **Integrated** |
| Native 377 normal-player packet adapter | Existing 39-type action contract, each effect still requires proof |
| Native bot-owned quest progress varps | **Observer extended** to 104+7 reference varp names; actual packed IDs may be missing and are explicitly omitted |
| First quest scenario | `playbooks/cook.ts` tests Cook NPC Talk-to **only if currently visible**, not the full egg/milk/flour quest |
| Source-only or missing playbook scenarios | **BLOCKED**, not automatically marked complete |
| Full quest and 4-QP / stage/reward/save-relog acceptance | **NOT VERIFIED**; separate full scripts + real-client checks required |
| RS3 / post-377 OSRS quests | **Not in rev377**; require modern profile and separate suite |
| Existing family characters | **Never targeted** by this runner |

**Important:** A multi-varp stage observation is a numeric record of a real persistent variable, **not proof of correct quest implementation or completion**. The game client draws some UI that server-only telemetry cannot see. The queue marks blocked/unknown rather than creating placeholder interactions. Add each exact quest playbook only after verifying its authentic stage graph and the named NPCs/objects/items; the playbook must use normal SDK actions, not `setVarp`, direct account DB updates, XP grants, teleports or admin completions.

A real quest is `VERIFIED_PLAYABLE` only after full native-client traversal, exact rewards once, valid player prereqs, logout/relogin and independent server-state proof. **No existing playbook can claim that status yet.**

## 4. Automated tests and cloud acceptance

- `node --test tools/rs377-fedora-quests/campaign.test.mjs` — real 104+7 metadata, ordering, and deliberately false/uncorroborated action rejection. These are **fixture tests**, not game playthrough.
- `bash -n tools/rs377-fedora-quests/setup-fedora.sh`
- [Fedora 44 source tests](../../.github/workflows/fedora-rssdk-quests.yml) — actual Fedora Linux container, no game accounts.
- [Native 377 compile/game smoke](../../.github/workflows/377-native-compile.yml) — ephemeral real 377 engine + unmodified upstream SDK. `live-botsdk.client.ts` now classifies all 111 quests against this authenticated real-world SDK state, and emits `RS_SDK_REAL_QUEST_CAMPAIGN`; this does **not** mean they have been played.

## 5. Next full-playthrough engineering requirements

Complete the client/observer for dialogue choices, map navigation, combat state, bank/shop and quest-completion contract per stage; build at least one genuine start-to-finish rev377 quest script, with post-relog reward-once verification. Then iteratively add and re-run the remaining 103 historical quests and 7 miniquests in isolated worlds. Do not import the older revision-225 `rs-sdk-quests` scripts as if they were already tested on 377.

**Status words:** `BLOCKED_NO_REVIEWED_PLAYBOOK` = no exact scenario; `BLOCKED_NATIVE_QUEST_STATE_NOT_OBSERVED` = missing real varp; `PARTIAL_NORMAL_GAMEPLAY_OBSERVED` = normal packet effect corroborated; `VERIFIED_PLAYABLE` = reserved for future complete, evidence-backed playthroughs (not generated by this harness).

# AVANCE-WS7 Fedora 44 — single-entrypoint RS-SDK harness setup for Agy

**Owner: Agy now.** This workstation had a working custom JoshRS 377 environment on 30 October 2026, but its *current* runtime and Agy sessions have not been remotely inspected. This document is grounded in the user's older JoshRS Fedora conversations, not the Windows JParrisDesktop installation.

## Previously confirmed local environment

- **Host:** AVANCE-WS7, Fedora Linux 44; controller with an HP ProDesk 400 G6 Mini (i5-10500T, 24 GB RAM).
- **Existing repository:** `/home/josh/dev/JoshRS`. **Game install:** `/home/josh/dev/JoshRS/lostcity377/engine` and `/home/josh/dev/JoshRS/lostcity377/client-java`. Older second tree: `/home/josh/lostcity377`. Don't guess which is active: check the processes' current working directories.
- Previously used and tested helper scripts: `start-joshrs.sh`, `start-server.sh`, `start-client.sh`, `status-joshrs.sh`, in the Fedora game checkout. **These are not committed at JoshRS repo root**, so don't tell the user to run them in the wrong directory.
- **Previously working:** Node v26.5.0, Java 25.0.4.1, Gradle wrapper upgraded from 8.11.1 to 9.2.0 to support Java 25; real 377 world ready, client start/login/movement/save/relogin reported successful.
- Game TCP `52402`, HTTP/update `8888`, auxiliary `8898`; client offset `8808`. The Windows desktop also uses some of these numbers, **but it is a different machine/world**.
- Local agent command previously seen: `agy`; no bypass-permissions flag is required for this safe setup. If the CLI is not on PATH, launch Agy through its installed desktop application or inspect the existing installation first.
- All work must be **isolated from any active #377 engine** on Fedora, from Windows family-world players, and from work/Avance business systems.

## Copy/paste on the Fedora terminal — one command (only if the existing repository is there)

This fetches the harness branch into the **Git object store only** (it does not change the currently checked-out branch), creates a separate worktree at `/home/josh/dev/JoshRS-rssdk-harness`, runs offline test gates and clones pinned upstream RS-SDK into a **gitignored reference directory**:

```bash
cd /home/josh/dev/JoshRS && git fetch origin '+refs/heads/feature/rs377-rssdk-claude-harness-20261102:refs/remotes/origin/feature/rs377-rssdk-claude-harness-20261102' && bash -o pipefail -c 'git show origin/feature/rs377-rssdk-claude-harness-20261102:tools/rs377-agent-harness/fedora/bootstrap.sh | bash'
```

The script **does not** stop or start the server, install system packages, change game configuration or read passwords. It will stop rather than overwrite an existing worktree, conflicted Git branch or dirty SDK reference checkout. It is safe to rerun if the dedicated worktree exists; existing changes are preserved, **no automatic pull/rebase/reset is performed**.

After it reports tests passing, start the active worker:

```bash
cd /home/josh/dev/JoshRS-rssdk-harness
agy
```

In Agy, ask it to follow `docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md`, starting at Phase A and continuing through genuine RS-SDK integration in a disposable test world. The repository also has `CLAUDE.md` for later, but **Claude Code and Codex are not required now**.

### If Git detects missing local paths

First check `pwd` and `git rev-parse --show-toplevel`. Do **not** install a replacement clean JoshRS game or initialise a new repository over your customised engine. Agy should locate the existing Git checkout and then run the same single command from that root.

### If Agy needs a quick read-only health check

```bash
bash /home/josh/dev/JoshRS-rssdk-harness/tools/rs377-agent-harness/fedora/setup.sh --doctor
```

This enumerates tool availability, discovered engine/client directory and listening port numbers only. It deliberately **does not** open `.env`, player saves, databases or GitHub tokens.

## What Agy must implement (not included in bootstrap)

1. Build a **fresh isolated** #377 engine/content instance and disposable account. Do not simply point the harness at TCP 52402; that may be a real user session. Choose unused ports and assert separate DB/save paths, real tick, XP and identity.
2. Use `research-checkouts/rs-sdk` pinned to `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`, with `sdk/types.ts`, `sdk/index.ts`, `sdk/actions.ts`, `server/gateway/types.ts`, and `mcp/server.ts` as references. Do not change JoshRS to RS-SDK's 274-based/modified game engine.
3. Adapt legitimate #377 protocol actions (our `fred-george-family-client.mjs` is only a narrow initial RSA/ISAAC login + walk reference) and real read-only observations to `BotWorldState` and `BotAction` via one bot-locked adapter.
4. Verify actual `BotSDK` receives state and controls walking, NPC dialogue and one woodcutting action with genuine inventory/XP; then confirm logout/relog persistence. Offline fixture tests **cannot** prove this.
5. Enforce loopback-only bound gateway, authentication/lease, no privileged actions, no arbitrary `execute_code` on an unsandboxed work PC, no bot credentials in Git or logs, no access to Avance work systems. Honour the existing Agy 1/2/3 shared-file ownership.
6. Save exact test outputs, source SHAs, safe logs, known blockers and stop before any production deployment. When Claude Code/Codex become available they continue the same worktree/PR.

## Verification categories

- **VERIFIED NOW IN GITHUB:** source files committed/read back, harness Node guard/translator tests passing on GitHub-hosted Ubuntu runner.
- **TO VERIFY ON FEDORA:** one-command bootstrap, location/version discovery, Node 26 compatibility, upstream RS-SDK checkout and 377 disposable runtime.
- **BLOCKED until Agy implementation:** working game-state/action bridge, live RS-SDK MCP controller, real world actions, saved XP/quests and deployment approval.

**Never** reuse Elrothiro, Sylvie, Luna, Fred or George's live saves or credentials for these tests.

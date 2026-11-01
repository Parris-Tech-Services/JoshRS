# JoshRS — coding agent entrypoint (Agy first, Claude Code/Codex later)

**CURRENT WORKER: Agy (Antigravity).** Until Tuesday/Wednesday 3–4 November 2026, implement with Agy rather than waiting for Claude Code, Codex or ChatGPT Work. When those tools return, they should continue the same branch and proof ledger.

## First read — do not skip

1. [Agy RS-SDK harness handoff](docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md).
2. [Harness scaffold and tests](tools/rs377-agent-harness/README.md).
3. [Existing local agent ownership and save safety](docs/rs377/PARALLEL_AGENT_HANDOFF_2026-10-31.md).
4. [Pinned upstream configuration](deploy/jparris-windows/upstreams.json).
5. [All outstanding JoshRS work](docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md), [strict George test PR #59](https://github.com/Parris-Tech-Services/JoshRS/pull/59).

## Current assigned mission

Implement an **RS-SDK-compatible, LLM-controllable, no-cheat adapter for a disposable normal revision-377 character** using the existing JoshRS engine, not an unrelated game clone. The first observed actions are walk, NPC dialogue, then legitimate level-one woodcutting with actual inventory/XP changes. The full Cook's Assistant acceptance follows only when these pass.

**Work on `feature/rs377-rssdk-claude-harness-20261102`** in an isolated worktree. Preserve uncommitted Agy source work and protect live Elrothiro/Sylvie/other accounts. Do not restart or reconfigure the production game as part of tests, don't merge on specs alone, and don't send/draft email.

Use pinned RS-SDK upstream `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb` as the actual SDK/MCP/gateway reference; don't claim the RS-SDK client is compatible with #377 merely because a test fixture passes. Do not expose upstream MCP `execute_code` on the unsandboxed desktop.

Verify **real gameplay and persistence**, not just packet dispatch. Record source commit SHA, genuine account identity category (no secrets), ordinary 600 ms tick/1x XP, exact tests/pass-fail and any unresolved bugs. Keep changes scoped to the adapter and tests until Agent 1/2 shared-file ownership is resolved.

## Offline scaffold checks

```sh
node --test tools/rs377-agent-harness/test/*.test.mjs
```

If the isolated 377 runtime is inaccessible, do as much tested source work as possible and mark real integration BLOCKED. Never swap in a clean unrelated world or fabricated observations to claim success.

# Repo-wide status — 10 November 2026

Produced by a structured read after acknowledging that earlier "where are we across the repo" claims were
inferred from file counts, not reading. Sources read for this: the master backlog
(`JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md`, 442 lines), the owner ADR
(`decisions/2026-11-08-private-rune-parity-and-risk.md`), the repository audit header, six priority
issues (#186, #324, #297, #293, #195, #181), tool/workflow inventories, and `deploy/` +
`content-factory/` listings.

**Scope of this read.** ~15 documents and inventories out of 1,818 tracked files / ~704,000 lines,
plus command output. This is a *structured survey*, not a line-by-line audit. Where I did not read
something, this document says so.

## The repo is six tracks, not one

The master backlog states the canonical split explicitly and warns against conflating them:

| Track | Where | State |
|---|---|---|
| **A. JoshRS 377** customised private Windows game | `deploy/jparris-windows`, `tools/rs377-*` (36 dirs), 33 workflows | **main effort**; 104-quest parity (#186), bot fleet, Fedora/Windows |
| **B. Original Woodlands** independent web MMO | `expansions/`, `research/` | separate product; **not** counted toward parity |
| **C. Android / browser / streaming clients** | `android-client/` (50 Kotlin), `tools/android377`, `visual` | protocol-complete, cannot render |
| **D. AI agents** | `tools/rs377-agent-*`, `content-factory/` | automation; 111-item checklist in backlog |
| **E. Historical-source content** | `content-patches/`, `content-factory/` | patches + factory pipeline |
| **F. Hosting / rights** | `deploy/`, `docs/FREE_SELF_HOSTING_RESEARCH.md` | gates, not built |

The **274 phone world** (`~/lc274`) is not a track in the backlog; it is a local installation that
happens to serve the owner today.

## Owner decision that governs everything (ADR, 8 Nov)

- Exact-as-possible **Jagex-authored** parity is the private product goal; **invented substitutes do not
  count**, and unavailable content must be marked MISSING / RIGHTS_REVIEW / BLOCKED rather than
  replaced.
- Risk tolerance recorded, but **no licence granted**; assets must not be published.
- Preserve existing saves and progress.
- The 274 revision lock remains a **historical baseline for its own exercise**, not the parity target.

**This is why the 274 quest port is a dead end for the stated goal**: it recreates 2005 content inside a
2004 revision and always requires substitutions — precisely what the ADR says does not satisfy parity.

## Verified vs claimed across tracks

| Claim | Reality |
|---|---|
| "104 rev377 quests verified" (#186) | **not met**; the issue defines a per-quest gate requiring dated sources, stage evidence, rewards and a real playthrough **×104** |
| "ported quests playable on 274" (#324) | **0 of 26**; content does not pack (my round-30 record) |
| "Android client playable" | **no**; 19 test files, auth/cache/definitions proven, **no renderer**, never installed |
| "Bots play alongside Elrothiro" | issue #181 lists **28 outstanding** RS-SDK actions; not proven |
| "Party chest fixed" (#52) | open; earlier register says items lost |
| Windows/Fedora one-click installs | code exists (`deploy/`, 13 workflows), **not verified by me** |

The repo's own register already says the rule: *"A merged PR is not proof a feature works"* — the same
conclusion I reached the hard way.

## What is genuinely strong here

- **Verification infrastructure**: 61 workflows, 548 tool scripts, three self-check layers built this week
- **Documentation discipline**: 3,243 lines of docs, an evidence-first backlog, an ADR that separates
  risk tolerance from rights
- **Save protection**: Elrothiro's save has survived every session incident (858 bytes, untouched)
- **Content pipeline**: `content-factory/` with 122 files of discovery/audit/conversion

## What is weak, repo-wide

1. **Nothing is proven playable.** Across all tracks the recurring failure is code-without-playtest.
2. **Open work outweighs merged work**: 12 open issues, 10 open PRs, most WIP drafts.
3. **Agents duplicate each other** — three sessions edited the same `tools/questops` files this week,
   producing conflicts and one commit of conflict markers to `main`.
4. **Track A is starved while side tracks absorb effort.** The 377 game with 104 quests is the product;
   the last week went to a 274 port that the ADR says cannot meet the goal.

## Not read (so not claimed)

`content-factory/` internals, `deploy/` scripts, 250 files in `reports/`, 59 in `research/`, 536 of 548
tools, 59 of 61 workflows, 6 of 12 open issues beyond the six summarised, 9 of 10 open PRs, and all of
`expansions/` and `integrations/`.

## Recommended order of work

1. **Protect** the live worlds and saves; no unapproved restarts (`PROMOTION_PLAN` governs 274).
2. **Prove one quest on the target track** (377) end to end — build, static, server playtest, client
   check, save/reload. One is worth more than 26 unproven.
3. **Park** the 274 port; keep its tooling and records as a reusable harness.
4. **Close or reframe** #324 against the ADR: porting 2005 content into 274 cannot satisfy exact parity.
5. Only then scale any of it.

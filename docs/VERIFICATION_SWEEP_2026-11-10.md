# Verification sweep — 10 November 2026

A full re-run of every claim this session has made, from scratch, against the live content
rather than against my notes. Written because three separate errors were caught *only* by
looking a second time.

## Result

| Check | Result |
|---|---|
| Runtime claims (world serving, engine alive, reward code present) | **11 / 11 pass** |
| 274 patches applied together to a pristine `HEAD` worktree | **3 / 3 apply**, all three effects present |
| 377 patches applied together to a pristine `HEAD` worktree | **2 / 2 apply** (verified previous round) |
| `check-completion-paths` | **64 quests, 0 failures** |
| `quest-status` | **88 targets, 62 present, 22 bot-verified, 26 absent** |
| `audit-quests` | **64 audited, 63 structurally complete** |

Every number matches what was previously published. Nothing drifted.

## What was actually re-checked

**Runtime**
- `http://10.8.0.1:8888/rs2.cgi` returns 200
- the engine process is alive

**Reward implementations, read out of the live content**
- Legends' lamp grants `stat_advance($stat, 76500)` — the tenths form of 7,650
- completion gives exactly 4 lamps
- all 7 disallowed skills route to a refusal
- `%sheepspun` is set in the wool case of the spinning wheel
- Sheep Shearer adds `stat_advance(crafting, 500)`
- Sea Slug grants `71750` in 274
- Priest in Peril stays correct at `14060` in 274

**Patches**
- all three 274 patches apply as a set to a clean checkout, and the resulting files contain the
  expected lines
- the two 377 patches do the same

## The three errors that motivated this

1. **`head -5` truncation** hid Fight Arena's XP and nearly produced a false gap report.
2. **Queue-block-only extraction** reported zero rewards for Shades of Mort'ton.
3. **An unfiltered `git diff`** put a second quest's fix inside the Sea Slug patch, which would
   have conflicted on application.

All three were caught by re-running a check after the work looked finished. None were caught by
being more careful the first time. The practical lesson: treat "done" as a claim to re-test, not
a state to move on from.

## What this sweep does NOT establish

This is the important part.

| Claim | Status after the sweep |
|---|---|
| Any quest is playable end to end | **still unverified** |
| Rewards are actually granted in-game | **still unverified** — the code is present, not executed |
| The APK installs or launches | **still unverified** |
| Two devices can play together | **still unverified** |
| Windows / macOS / Linux work | **still unverified** |

The sweep proves the *repo and content* match their documentation. It says nothing about
behaviour, because nothing here has been played. Three of the five patches change reward code
that has never run.

## Standing rule

A structural or textual check can only ever contradict a claim about files. Claims about
behaviour — "the quest completes", "the lamp pays out", "the app runs" — require a playthrough
and must stay marked unverified until one happens.

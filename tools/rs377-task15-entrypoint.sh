#!/usr/bin/env bash
# One command from the existing JoshRS checkout. No sudo, resets, game starts or save access.
set -euo pipefail
REF='feature/rs377-rssdk-claude-harness-20261102'
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo 'BLOCKED: run inside JoshRS Git checkout' >&2; exit 2; }
[[ "$(pwd -P)" == "$ROOT" ]] || { echo 'BLOCKED: run from JoshRS checkout root' >&2; exit 2; }
origin="$(git remote get-url origin 2>/dev/null || true)"
case "$origin" in
  https://github.com/Parris-Tech-Services/JoshRS|https://github.com/Parris-Tech-Services/JoshRS.git|git@github.com:Parris-Tech-Services/JoshRS.git) ;;
  *) echo 'BLOCKED: unexpected origin remote' >&2; exit 2 ;;
esac
command -v git >/dev/null || { echo 'BLOCKED: git missing' >&2; exit 2; }
echo "Fetching only Agy feature ref; active branch and tracked/untracked files remain untouched."
git fetch --no-tags origin "+refs/heads/$REF:refs/remotes/origin/$REF"
script="$ROOT/tools/rs377-agent-harness/fedora/bootstrap.sh"
if [[ -f "$script" ]]; then
  bash "$script" --no-sdk
else
  # Bootstrap is on the feature ref, not necessarily on main. Read from Git object without checkout.
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  git show "refs/remotes/origin/$REF:tools/rs377-agent-harness/fedora/bootstrap.sh" > "$tmp"
  bash "$tmp" --no-sdk
fi
echo 'NEXT REAL TASK: implement a native revision-377 inbound world-state observer and verify isolated two-client gameplay.'
echo 'WORK ORDER: docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md'
echo 'WORKTREE: ${JOSHRS_HARNESS_WORKTREE:-$HOME/dev/JoshRS-rssdk-harness}'

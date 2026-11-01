#!/usr/bin/env bash
# Run from an existing JoshRS clone after fetching the feature branch.
# Never edits, checks out or resets the active JoshRS branch.
set -euo pipefail
REF="feature/rs377-rssdk-claude-harness-20261102"
LOCAL="agy/rs377-rssdk-fedora"
TARGET="${JOSHRS_HARNESS_WORKTREE:-$HOME/dev/JoshRS-rssdk-harness}"
SOURCE="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo 'BLOCKED: run from /home/josh/dev/JoshRS Git repository.' >&2; exit 2
}
origin="$(git -C "$SOURCE" remote get-url origin || true)"
case "$origin" in
  *Parris-Tech-Services/JoshRS|*Parris-Tech-Services/JoshRS.git) ;;
  *) echo 'BLOCKED: current repository is not Parris-Tech-Services/JoshRS.' >&2; exit 2 ;;
esac
if ! git -C "$SOURCE" show-ref --verify --quiet "refs/remotes/origin/$REF"; then
  printf 'BLOCKED: fetch origin/%s before bootstrapping.\n' "$REF" >&2
  exit 2
fi
if [[ -e "$TARGET" ]]; then
  if ! git -C "$TARGET" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "BLOCKED: target exists but is not a Git worktree: $TARGET" >&2; exit 2
  fi
  target_root="$(git -C "$TARGET" rev-parse --show-toplevel)"
  if [[ "$(realpath -m "$target_root")" != "$(realpath -m "$TARGET")" ]]; then
    echo 'BLOCKED: target is a subdirectory of another worktree.' >&2; exit 2
  fi
  t_origin="$(git -C "$TARGET" remote get-url origin || true)"
  case "$t_origin" in
    *Parris-Tech-Services/JoshRS|*Parris-Tech-Services/JoshRS.git) ;;
    *) echo 'BLOCKED: target points to a different Git remote.' >&2; exit 2 ;;
  esac
  echo "Reusing existing worktree WITHOUT pull/checkout/reset: $TARGET"
else
  if git -C "$SOURCE" show-ref --verify --quiet "refs/heads/$LOCAL"; then
    echo "BLOCKED: $LOCAL branch exists; inspect before reusing." >&2; exit 2
  fi
  mkdir -p "$(dirname "$TARGET")"
  git -C "$SOURCE" worktree add -b "$LOCAL" "$TARGET" "refs/remotes/origin/$REF"
  echo "Created isolated worktree: $TARGET"
fi
if [[ ! -f "$TARGET/tools/rs377-agent-harness/fedora/setup.sh" ]]; then
  echo 'BLOCKED: worktree does not contain Fedora harness setup; refusing to alter it.' >&2
  exit 2
fi
echo 'Running safe Fedora checks and separate RS-SDK source checkout.'
bash "$TARGET/tools/rs377-agent-harness/fedora/setup.sh" --prepare --fetch-sdk "$@"
printf '\nFor Agy (not the production server):\n  cd %q && agy\n' "$TARGET"
echo 'Agy: read the Fedora work order in docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md'

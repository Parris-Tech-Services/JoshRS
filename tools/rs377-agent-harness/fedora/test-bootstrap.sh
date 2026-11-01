#!/usr/bin/env bash
# Local/offline integration regression for Fedora worktree bootstrap. Never touches a live checkout.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/source/tools"
cp -R "$ROOT/tools/rs377-agent-harness" "$TMP/source/tools/"
git -C "$TMP/source" init -q -b main
git -C "$TMP/source" config user.name "Harness CI"
git -C "$TMP/source" config user.email "harness-ci@example.invalid"
git -C "$TMP/source" add tools/
git -C "$TMP/source" commit -qm 'isolated bootstrap fixture'
git -C "$TMP/source" remote add origin https://github.com/Parris-Tech-Services/JoshRS.git
git -C "$TMP/source" update-ref refs/remotes/origin/feature/rs377-rssdk-claude-harness-20261102 HEAD
(
  cd "$TMP/source"
  JOSHRS_HARNESS_WORKTREE="$TMP/harness" bash "$TMP/source/tools/rs377-agent-harness/fedora/bootstrap.sh" --no-sdk
)
[[ -f "$TMP/harness/tools/rs377-agent-harness/fedora/setup.sh" ]]
[[ ! -e "$TMP/harness/research-checkouts/rs-sdk" ]]
printf '\n# personal uncommitted work must survive rerun\n' >> "$TMP/harness/tools/rs377-agent-harness/README.md"
(
  cd "$TMP/source"
  JOSHRS_HARNESS_WORKTREE="$TMP/harness" bash "$TMP/source/tools/rs377-agent-harness/fedora/bootstrap.sh" --no-sdk
)
grep -q 'personal uncommitted work must survive rerun' "$TMP/harness/tools/rs377-agent-harness/README.md"
[[ "$(git -C "$TMP/source" symbolic-ref --short HEAD)" == main ]]
# --doctor must never perform a network fetch or checkout.
if bash "$TMP/harness/tools/rs377-agent-harness/fedora/setup.sh" --doctor --fetch-sdk >"$TMP/doctor.out" 2>&1; then
  echo 'FAIL: doctor unexpectedly accepted fetch-sdk' >&2; exit 1
fi
grep -q 'read-only' "$TMP/doctor.out"
[[ ! -e "$TMP/harness/research-checkouts/rs-sdk" ]]
# Reject SDK symlink even when it points at a valid repository.
mkdir -p "$TMP/harness/research-checkouts"
ln -s "$TMP/source" "$TMP/harness/research-checkouts/rs-sdk"
if bash "$TMP/harness/tools/rs377-agent-harness/fedora/setup.sh" --doctor --fetch-sdk >"$TMP/symlink.out" 2>&1; then
  echo 'FAIL: doctor accepted fetch-sdk with SDK symlink' >&2; exit 1
fi
[[ -L "$TMP/harness/research-checkouts/rs-sdk" ]]
grep -q 'personal uncommitted work must survive rerun' "$TMP/harness/tools/rs377-agent-harness/README.md"
echo 'PASS: Fedora bootstrap preserved worktrees and edits; doctor cannot fetch SDK.'

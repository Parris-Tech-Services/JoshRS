#!/usr/bin/env bash
# Offline negative regression fixtures. Never access a real server or checkout.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/source/tools"
cp -R "$ROOT/tools/rs377-agent-harness" "$TMP/source/tools/"
git -C "$TMP/source" init -q -b main
git -C "$TMP/source" config user.name 'Fixture Test'
git -C "$TMP/source" config user.email 'fixture@example.invalid'
git -C "$TMP/source" add tools
git -C "$TMP/source" commit -qm fixture
git -C "$TMP/source" remote add origin https://github.com/Parris-Tech-Services/JoshRS.git
git -C "$TMP/source" update-ref refs/remotes/origin/feature/rs377-rssdk-claude-harness-20261102 HEAD
BOOT="$TMP/source/tools/rs377-agent-harness/fedora/bootstrap.sh"
fail() { if "$@" >"$TMP/output" 2>&1; then echo "FAIL: unexpectedly succeeded: $*" >&2; exit 1; fi; }
# Wrong working directory / nonexistent repository must not create a worktree.
(cd "$TMP"; fail env JOSHRS_HARNESS_WORKTREE="$TMP/harness" bash "$BOOT" --no-sdk)
[[ ! -e "$TMP/harness" ]]
# Existing non-Git target must be preserved.
mkdir "$TMP/harness"
echo preserve > "$TMP/harness/marker"
(cd "$TMP/source"; fail env JOSHRS_HARNESS_WORKTREE="$TMP/harness" bash "$BOOT" --no-sdk)
grep -qx preserve "$TMP/harness/marker"
rmdir "$TMP/harness" 2>/dev/null || true
rm "$TMP/harness/marker"
rmdir "$TMP/harness"
# Missing Node/npm in prepare must fail without modifying source.
mkdir "$TMP/empty-bin"
ln -s "$(command -v bash)" "$TMP/empty-bin/bash"
(cd "$TMP/source"; fail env PATH="$TMP/empty-bin" bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --prepare)
# SDK checkout with unexpected origin must be refused, not modified.
mkdir -p "$TMP/source/research-checkouts/rs-sdk"
git -C "$TMP/source/research-checkouts/rs-sdk" init -q
git -C "$TMP/source/research-checkouts/rs-sdk" remote add origin https://example.invalid/other.git
(cd "$TMP/source"; fail bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --doctor --fetch-sdk)
# A wrong SDK commit must never be silently accepted.
test ! -f "$TMP/source/research-checkouts/rs-sdk/.git/HEAD.mutated"
echo 'PASS: negative fixtures preserve source and reject unsafe setup'

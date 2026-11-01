#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/source/tools"
cp "$ROOT/tools/rs377-task15-entrypoint.sh" "$TMP/source/tools/"
git -C "$TMP/source" init -q -b main
git -C "$TMP/source" config user.name 'Fixture'
git -C "$TMP/source" config user.email 'fixture@example.invalid'
git -C "$TMP/source" add .
git -C "$TMP/source" commit -qm fixture
git -C "$TMP/source" remote add origin https://example.invalid/other.git
if (cd "$TMP/source" && bash tools/rs377-task15-entrypoint.sh) >"$TMP/log" 2>&1; then echo 'FAIL: foreign remote accepted' >&2; exit 1; fi
grep -q 'unexpected origin remote' "$TMP/log"
echo 'PASS: foreign repo rejected without network or worktree changes'

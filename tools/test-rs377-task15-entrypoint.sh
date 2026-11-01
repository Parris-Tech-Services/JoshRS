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
# A local bare remote provides a fully offline end-to-end bootstrap fixture.
git init -q --bare "$TMP/remote.git"
git -C "$TMP/source" remote set-url origin "$TMP/remote.git"
git -C "$TMP/source" push -q origin main
git -C "$TMP/source" checkout -qb feature/rs377-rssdk-claude-harness-20261102
mkdir -p "$TMP/source/tools/rs377-agent-harness/fedora"
cat >"$TMP/source/tools/rs377-agent-harness/fedora/bootstrap.sh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
git worktree add -q -b fixture-isolated "$JOSHRS_HARNESS_WORKTREE" refs/remotes/origin/feature/rs377-rssdk-claude-harness-20261102
echo 'OFFLINE CHECKS PASSED'
MOCK
git -C "$TMP/source" add .
git -C "$TMP/source" commit -qm 'feature fixture'
git -C "$TMP/source" push -q origin HEAD
git -C "$TMP/source" checkout -q main
git -C "$TMP/source" remote set-url origin https://github.com/Parris-Tech-Services/JoshRS.git
mkdir -p "$TMP/bin"
cat >"$TMP/bin/git" <<'WRAP'
#!/usr/bin/env bash
if [[ "${1:-}" == fetch ]]; then
  shift
  exec /usr/bin/git fetch --no-tags "$JOSHRS_FIXTURE_REMOTE" "${@:3}"
fi
exec /usr/bin/git "$@"
WRAP
chmod +x "$TMP/bin/git"
printf 'preserve local edits\n' >"$TMP/source/untracked-local.txt"
(cd "$TMP/source" && PATH="$TMP/bin:$PATH" JOSHRS_FIXTURE_REMOTE="$TMP/remote.git" JOSHRS_HARNESS_WORKTREE="$TMP/worktree" bash tools/rs377-task15-entrypoint.sh) >"$TMP/success.log" 2>&1
grep -q 'OFFLINE CHECKS PASSED' "$TMP/success.log"
grep -q 'NEXT REAL TASK' "$TMP/success.log"
grep -Fq "WORKTREE: $TMP/worktree" "$TMP/success.log"
[[ -f "$TMP/worktree/tools/rs377-agent-harness/fedora/bootstrap.sh" ]]
[[ "$(git -C "$TMP/source" branch --show-current)" == main ]]
grep -q 'preserve local edits' "$TMP/source/untracked-local.txt"
echo 'PASS: offline clean fixture fetched branch, made separate worktree, ran checks, printed next task and preserved source'

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
(cd "$TMP/source"; fail bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --prepare --fetch-sdk)
# Failed fetch: force an invalid SDK commit in a local fixture with no network.
# A mock git executable fails fetch while delegating other commands.
mkdir -p "$TMP/mockbin"
REAL_GIT="$(command -v git)"
cat > "$TMP/mockbin/git" <<EOF
#!/usr/bin/env bash
if [[ "\$1" == "-C" && "\$3" == "fetch" ]]; then exit 37; fi
exec "$REAL_GIT" "\$@"
EOF
chmod +x "$TMP/mockbin/git"
# Use an expected upstream URL, but no pinned commit exists in this empty repository.
git -C "$TMP/source/research-checkouts/rs-sdk" remote set-url origin https://github.com/MaxBittker/rs-sdk.git
 git -C "$TMP/source/research-checkouts/rs-sdk" config user.name Fixture
 git -C "$TMP/source/research-checkouts/rs-sdk" config user.email fixture@example.invalid
 git -C "$TMP/source/research-checkouts/rs-sdk" commit -qm wrong-pin --allow-empty
(cd "$TMP/source"; fail env PATH="$TMP/mockbin:$PATH" bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --prepare --fetch-sdk)
[[ "$(git -C "$TMP/source/research-checkouts/rs-sdk" rev-parse --is-inside-work-tree)" == true ]]
# A local checkout at the wrong commit must not be accepted as pinned.
[[ "$(git -C "$TMP/source/research-checkouts/rs-sdk" rev-parse HEAD 2>/dev/null || true)" != db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb ]]
echo 'PASS: negative fixtures preserve source and reject unsafe setup'

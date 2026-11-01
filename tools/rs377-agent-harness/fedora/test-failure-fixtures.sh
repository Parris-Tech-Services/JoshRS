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
(cd "$TMP/source"; fail bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --prepare --fetch-sdk)
# A clean but wrong SDK commit must not be silently accepted. Deny network
# fetch using a local git wrapper, then verify the checkout remains untouched.
git -C "$TMP/source/research-checkouts/rs-sdk" remote set-url origin https://github.com/MaxBittker/rs-sdk.git
git -C "$TMP/source/research-checkouts/rs-sdk" config user.name 'Fixture Test'
git -C "$TMP/source/research-checkouts/rs-sdk" config user.email 'fixture@example.invalid'
git -C "$TMP/source/research-checkouts/rs-sdk" commit --allow-empty -qm wrong-pin
before="$(git -C "$TMP/source/research-checkouts/rs-sdk" rev-parse HEAD)"
mkdir -p "$TMP/wrapped-bin"
cat > "$TMP/wrapped-bin/git" <<'WRAPPER'
#!/usr/bin/env bash
if [[ " $* " == *" fetch "* ]]; then
  echo 'fixture: SDK network fetch denied' >&2
  exit 73
fi
exec /usr/bin/git "$@"
WRAPPER
chmod +x "$TMP/wrapped-bin/git"
(cd "$TMP/source"; fail env PATH="$TMP/wrapped-bin:$PATH" bash "$TMP/source/tools/rs377-agent-harness/fedora/setup.sh" --prepare --fetch-sdk)
after="$(git -C "$TMP/source/research-checkouts/rs-sdk" rev-parse HEAD)"
[[ "$before" == "$after" ]] || { echo 'FAIL: wrong-pin fixture mutated checkout' >&2; exit 1; }
# The refusal must be from a real attempted fetch, not an earlier guard.
grep -q 'fixture: SDK network fetch denied' "$TMP/output" || { echo 'FAIL: did not reach SDK pin fetch' >&2; exit 1; }
echo 'PASS: negative fixtures preserve source and reject unsafe setup'

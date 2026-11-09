#!/usr/bin/env bash
# Verify the project's documented state. Fails loudly and exits non-zero on any check.
#
# Background: throughout development, several checks silently passed while wrong, because the
# failure was piped into `head` or because a relative path resolved somewhere unexpected. A check
# that cannot report failure is worse than no check, so this script:
#   - uses `set -o pipefail`
#   - never pipes a command's exit status through another command
#   - prints the failing output instead of swallowing it
#
# Usage:
#   tools/verify-all.sh                 # verify the live phone world
#   WORLD=/path/to/world tools/verify-all.sh
#
# Exit codes: 0 all checks passed, 1 one or more failed.
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
world="${WORLD:-$HOME/lc274}"
url="${JOSHRS_URL:-http://10.8.0.1:8888/rs2.cgi}"

pass=0
fail=0
failures=()

check() {
  local name="$1"; shift
  local out
  if out="$("$@" 2>&1)"; then
    printf 'PASS  %s\n' "$name"
    pass=$((pass + 1))
  else
    printf 'FAIL  %s\n' "$name"
    printf '      %s\n' "$out" | head -5
    fail=$((fail + 1))
    failures+=("$name")
  fi
}

# --- content-dependent checks are skipped, not silently passed, when content is absent --------
if [[ -d "$world/content/scripts/quests" ]]; then
  have_world=true
else
  have_world=false
  echo "NOTE  no content at $world — skipping content checks (set WORLD=... to include them)"
fi

# --- playable world ---------------------------------------------------------------------------
if [[ -n "${JOSHRS_SKIP_NETWORK:-}" ]]; then
  echo "NOTE  JOSHRS_SKIP_NETWORK set — skipping world reachability"
else
  check "world serves the client page" curl -sf -o /dev/null --max-time 5 "$url"
fi

if $have_world; then
  check "elrothiro save present" test -s "$world/engine/data/players/main/elrothiro.sav"

  check "structural audit matches documented 66 of 90" \
    bash -c "cd '$repo' && node tools/questops/audit-quests.mjs '$world/content' | grep -q '66 structurally complete'"

  check "every quest has a completion path" \
    bash -c "cd '$repo' && node tools/questops/check-completion-paths.mjs '$world/content' | grep -q '0 failures'"

  check "target status matches documented 72 / 22 / 16" \
    bash -c "cd '$repo' && node tools/questops/quest-status.mjs --content '$world/content' --log '$HOME/elrothiro.md' | grep -q 'present=72 verified=22 absent=16'"
fi

# --- patch inventory --------------------------------------------------------------------------
check "3 rev-274 patches present" test "$(ls -1 "$repo"/content-patches/rs274/patches/*.patch 2>/dev/null | wc -l)" -eq 3
check "2 rev-377 quest patches present" test "$(ls -1 "$repo"/content-patches/rs377/patches/quest_*.patch 2>/dev/null | wc -l)" -eq 2

# --- repository hygiene -----------------------------------------------------------------------
check "working tree is clean" test -z "$(git -C "$repo" status --porcelain)"
check "nothing unpushed" test -z "$(git -C "$repo" log origin/main..HEAD --oneline 2>/dev/null)"

echo
printf 'TOTAL pass=%d fail=%d\n' "$pass" "$fail"
if (( fail > 0 )); then
  printf 'FAILED: %s\n' "${failures[*]}"
  exit 1
fi

#!/usr/bin/env bash
# Port revision-377 quest content into a revision-274 world.
#
# Why this works at all: the 377 and 274 content share the same ReScript engine and the same
# symbol naming, so quest directories written for 377 pack into 274 without changes. Verified by
# booting a 274 engine with 26 ported quests and reaching "World ready".
#
# Why it is not the whole story: a quest that *packs* may still fail when played, because it can
# reference NPCs, items, objects or maps that exist in 377 but not in 274. Packing proves syntax
# and symbol syntax, not runtime availability. Treat every ported quest as UNPLAYED.
#
# A completeness gate is enforced: quests without a `send_quest_complete` call are refused,
# because shipping a quest that cannot be finished is worse than leaving it absent.
#
# Usage:
#   port-377-quests.sh <377-content-dir> <274-world-dir> [--dry-run]
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
src="${1:-}"; world="${2:-}"; dry=false
[[ "${3:-}" == "--dry-run" ]] && dry=true
[[ -n "$src" && -n "$world" ]] || { echo "usage: port-377-quests.sh <377-content> <274-world> [--dry-run]" >&2; exit 2; }

srcdir="$src/scripts/quests"
dstdir="$world/content/scripts/quests"
[[ -d "$srcdir" ]] || { echo "BLOCKED: no quests in $src" >&2; exit 2; }
[[ -d "$dstdir" ]] || { echo "BLOCKED: no quests in $world" >&2; exit 2; }

# Quests that pack but have no completion path. Refused rather than shipped.
REFUSED=(
  quest_100 quest_fever quest_mm quest_mourning2 quest_rd
  # quest_mortton also exists in 274 with local fixes; never overwrite it.
  quest_mortton
)

is_refused() { local q="$1"; for r in "${REFUSED[@]}"; do [[ "$q" == "$r" ]] && return 0; done; return 1; }

copied=0; skipped=0
for path in "$srcdir"/quest_*/; do
  q="$(basename "$path")"
  if is_refused "$q"; then
    echo "skip    $q (refused: no completion path, or 274 has local fixes)"
    skipped=$((skipped+1)); continue
  fi
  if [[ -e "$dstdir/$q" ]]; then
    echo "skip    $q (already present)"
    skipped=$((skipped+1)); continue
  fi
  if grep -rq "send_quest_complete" "$path" 2>/dev/null; then
    if $dry; then echo "would copy $q"; else cp -a "$path" "$dstdir/"; echo "copied  $q"; fi
    copied=$((copied+1))
  else
    echo "skip    $q (no send_quest_complete)"
    skipped=$((skipped+1))
  fi
done

echo
echo "copied=$copied skipped=$skipped"
$dry || echo "restart the world to repack, then run tools/questops/check-completion-paths.mjs"

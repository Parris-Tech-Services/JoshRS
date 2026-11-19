#!/usr/bin/env bash
# Restore missing map regions into a world from a newer content revision.
#
# Why: ported quests reference places that did not exist in revision 274. Uzer (region 54,48, used by
# The Golem) is the clearest case - the 274 map set has no m54_48.jm2, so teleporting there renders a
# black world. The revision-377 content has 660 maps against 274's 483.
#
# Map files ARE game assets. They are copied between local worlds only and must never be committed to
# the public repository; this script is the reproducible record, not the data.
#
# The `.jm2` format is text with a stable `==== MAP ====` header across both revisions, so a map can
# usually be dropped in unchanged. Verify by booting the engine and checking for parse errors.
#
# Every copied map is recorded in <target-content>/imported-maps.txt ("<name>.jm2 <sha256>", one per
# line). That manifest is the only record of which maps came from the source revision: native 274 maps
# share names with 377 maps, and checking those against the 377 packs reports false mismatches.
#
# Usage:
#   restore-maps.sh <source-content-dir> <target-content-dir> [--dry-run]
set -Eeuo pipefail

src="${1:-}"; dst="${2:-}"; dry="${3:-}"
[[ -n "$src" && -n "$dst" ]] || { echo "usage: restore-maps.sh <source-content> <target-content> [--dry-run]" >&2; exit 2; }

smaps="$src/maps"; dmaps="$dst/maps"
[[ -d "$smaps" ]] || { echo "BLOCKED: no maps in $src" >&2; exit 2; }
[[ -d "$dmaps" ]] || { echo "BLOCKED: no maps in $dst" >&2; exit 2; }

manifest="$dst/imported-maps.txt"
copied=0; skipped=0
for f in "$smaps"/*.jm2; do
  base="$(basename "$f")"
  if [[ -e "$dmaps/$base" ]]; then
    skipped=$((skipped+1)); continue
  fi
  if [[ "$dry" == "--dry-run" ]]; then
    echo "would copy $base"
  else
    cp -p "$f" "$dmaps/$base"
    printf '%s %s\n' "$base" "$(sha256sum "$f" | cut -d' ' -f1)" >> "$manifest"
  fi
  copied=$((copied+1))
done

# imported-maps.txt above is the ONLY authoritative manifest. Never regenerate the
# old maps/imported-from-377.json: it incorrectly included native 274 regions
# and was written even during --dry-run.


echo
echo "copied=$copied skipped=$skipped"
[[ "$dry" == "--dry-run" ]] || echo "manifest: $manifest"
echo "target maps now: $(ls -1 "$dmaps"/*.jm2 2>/dev/null | wc -l)"
[[ "$dry" == "--dry-run" ]] || echo "restart the world to repack; watch the log for map parse errors"

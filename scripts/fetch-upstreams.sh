#!/usr/bin/env bash
set -euo pipefail

# OPTIONAL developer-only source checkout. Not part of the deployed game.
# Upstream repositories are large and may contain third-party game resources.
# The JoshRS repo does not redistribute their source or proprietary assets.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${ROOT}/research-checkouts"
if ! command -v git >/dev/null 2>&1; then echo "Git is required." >&2; exit 1; fi
mkdir -p "$DEST"
fetch() {
  local name="$1" url="$2" branch="$3"
  if [[ -e "$DEST/$name" ]]; then echo "Skipping $name: directory already exists"; return; fi
  echo "Cloning $name ($branch)..."
  git clone --filter=blob:none --depth=1 --single-branch --branch "$branch" "$url" "$DEST/$name"
}
echo "This fetches third-party source for private research ONLY."
echo "These checkouts are not required to play JoshRS and are NOT integrated into this app."
echo "Some repositories are very large; review licences before redistribution."
fetch lostcity-server https://github.com/LostCityRS/Server.git main
fetch lostcity-engine https://github.com/LostCityRS/Engine-TS.git 274
# No Content checkout: its README explicitly excludes Jagex game assets from MIT.
fetch openrsc https://github.com/Open-RSC/Core-Framework.git develop
fetch 2009scape https://github.com/summerdevs/2009Scape.git development
echo "Source review checkouts created in: $DEST"
echo "For complete upstream game setup, follow each upstream README."

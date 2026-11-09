#!/usr/bin/env bash
# Start a FRESH, loopback-only, phone-local revision-377 engine for client testing.
#
# Never reads or writes a production JParris Desktop world, an existing save, or an
# account database. It clones pinned MIT sources into a NEW directory of your choosing
# and refuses to reuse an existing target.
#
# Usage:
#   run-local-377-server.sh [target-dir]
#
# Default target: $HOME/js377
# Requires: git, node, npm, python3.
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
target="${1:-$HOME/js377}"
engine="$target/engine"
content="$target/content"

fail() { echo "BLOCKED: $*" >&2; exit 2; }

for cmd in git node npm python3; do
  command -v "$cmd" >/dev/null || fail "$cmd is required"
done
[[ "$target" = /* ]] || fail "target must be an absolute path"

node_major="$(node -p 'process.versions.node.split(".")[0]')"
(( node_major >= 24 )) || fail "Node 24+ required; found $(node --version)"

mkdir -p -- "$target"

if [[ ! -d "$engine/.git" ]]; then
  echo "Cloning pinned MIT 377 engine into NEW directory: $engine"
  git clone --depth 1 --branch 377-wip https://github.com/LostCityRS/Engine-TS.git "$engine"
else
  echo "Reusing existing engine checkout: $engine"
fi

if [[ ! -d "$content/.git" ]]; then
  git clone --depth 1 --branch 377-wip https://github.com/LostCityRS/Content.git "$content"
else
  echo "Reusing existing content checkout: $content"
fi

# Close every non-loopback listener BEFORE the server can start.
python3 -I "$repo/tools/android377-phone/loopback_bind.py" "$engine"

if [[ ! -d "$engine/node_modules" ]]; then
  ( cd "$engine" && npm install --no-audit --no-fund )
fi

# First boot packs the cache (~90 s on a Galaxy A55). Later boots are much faster.
echo "Starting 377 engine on 127.0.0.1 (game 43594, web 8898). Logs: $target/server.log"
cd "$engine"
exec node --import tsx src/app.ts 2>&1 | tee "$target/server.log"

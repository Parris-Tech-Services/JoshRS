#!/usr/bin/env bash
# Run a PLAYABLE revision-274 RuneScape world on this phone, playable in any browser.
#
# Why 274: it is the one revision where Lost City ships a complete, MIT-licensed
# BROWSER client inside the engine repository (engine/public/client/client.js).
# That means no APK to install, no cache to source and no Jagex assets to ship —
# the engine serves everything from 127.0.0.1.
#
# This is a SEPARATE world. It never reads or writes the JoshRS 377 production
# world, its account database or any player save.
#
# Usage:
#   start-playable-274.sh [target-dir]     # default ~/lc274
#   start-playable-274.sh --stop
#   start-playable-274.sh --status
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
target="${1:-$HOME/lc274}"
log="$target/server.log"
url="http://127.0.0.1:8888/rs2.cgi"

fail() { echo "BLOCKED: $*" >&2; exit 2; }

running() { pgrep -f "tsx src/app.ts" >/dev/null 2>&1; }

case "${1:-}" in
  --stop)
    pkill -f "tsx src/app.ts" && echo "stopped" || echo "not running"
    exit 0
    ;;
  --status)
    if running; then
      echo "running; players: $url"
      curl -s -o /dev/null -w "http %{http_code}\n" "$url" || true
    else
      echo "not running"
    fi
    exit 0
    ;;
esac

for cmd in git node npm python3; do
  command -v "$cmd" >/dev/null || fail "$cmd is required"
done
[[ "$target" = /* ]] || fail "target must be an absolute path"

mkdir -p -- "$target"

if [[ ! -d "$target/engine/.git" ]]; then
  echo "Cloning MIT revision-274 engine + content into NEW directory: $target"
  git clone --depth 1 --branch 274 https://github.com/LostCityRS/Engine-TS.git "$target/engine"
  git clone --depth 1 --branch 274 https://github.com/LostCityRS/Content.git "$target/content"
fi

# Keep every listener on loopback so this world is never exposed to the LAN.
python3 -I "$repo/tools/android377-phone/loopback_bind.py" "$target/engine"

if [[ ! -d "$target/engine/node_modules" ]]; then
  ( cd "$target/engine" && npm install --no-audit --no-fund )
fi

# Android may kill Termux when the screen sleeps; keep the world alive.
command -v termux-wake-lock >/dev/null && termux-wake-lock || true

if running; then
  echo "already running: $url"
  exit 0
fi

cd "$target/engine"
nohup npx tsx src/app.ts > "$log" 2>&1 &

echo "Booting. First run packs the cache (~60-90s on a Galaxy A55)."
for _ in $(seq 1 60); do
  if grep -q "World ready" "$log" 2>/dev/null; then
    echo "READY: $url"
    command -v termux-open >/dev/null && termux-open "$url" || true
    exit 0
  fi
  sleep 3
done

echo "Did not reach 'World ready' in time. Last log lines:" >&2
tail -5 "$log" >&2
exit 1

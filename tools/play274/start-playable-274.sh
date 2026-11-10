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
#   start-playable-274.sh [target-dir]     # default ~/lc274, loopback only
#   start-playable-274.sh --lan [ip]       # bind a PRIVATE address so family devices join
#   start-playable-274.sh --stop
#   start-playable-274.sh --status
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
# Only treat the first argument as a directory when it is not a flag.
if [[ "${1:-}" == --* ]]; then target="$HOME/lc274"; else target="${1:-$HOME/lc274}"; fi
log="$target/server.log"
url="http://127.0.0.1:8888/rs2.cgi"

fail() { echo "BLOCKED: $*" >&2; exit 2; }

running() { pgrep -f "tsx src/app.ts" >/dev/null 2>&1; }

LAN_HOST=""
LAN_MODE=false
if [[ "${1:-}" == "--lan" ]]; then
  LAN_MODE=true
  LAN_HOST="${2:-}"
  shift || true
  [[ $# -gt 0 ]] && shift
  target="${1:-$HOME/lc274}"
fi

case "${1:-}" in
  --stop)
    pkill -f "tsx src/app.ts" && echo "stopped" || echo "not running"
    exit 0
    ;;
  --status)
    if running; then
      # Prefer the allowlisted origin from world.json, since a LAN-bound world does not
      # answer on loopback at all.
      cfg="$target/engine/data/config/world.json"
      origin=""
      [[ -f "$cfg" ]] && origin="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("web",{}).get("allowedOrigin",""))' "$cfg" 2>/dev/null)"
      probe="${origin:+$origin}/rs2.cgi"
      [[ -z "$origin" ]] && probe="$url"
      echo "running; players: $probe"
      curl -s -o /dev/null -w "http %{http_code}\n" "$probe" || true
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



# Discover the phone's own address without Android tools: a UDP socket that is never
# used to send anything still resolves which interface the default route would use.
detect_lan_ip() {
  python3 -c 'import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8",53)); print(s.getsockname()[0]); s.close()'
}

is_private_ipv4() {
  python3 -c 'import ipaddress,sys; a=ipaddress.ip_address(sys.argv[1]); sys.exit(0 if a.is_private and not a.is_loopback and not a.is_link_local else 1)' "$1"
}

# The game web server may bind a chosen private address. Default stays 127.0.0.1 so an
# accidental `--lan` typo can never widen exposure. Idempotent.
patch_web_bind() {
  local web="$1/src/web.ts"
  [[ -f "$web" ]] || fail "engine source not found: $web"
  grep -q "JOSHRS_BIND_HOST" "$web" && return 0
  python3 - "$web" <<'PATCH'
import sys
path = sys.argv[1]
src = open(path).read()
old = "await fastify.listen({ port: Environment.web.port, host: '127.0.0.1' });"
new = ("const host: string = process.env.JOSHRS_BIND_HOST ?? '127.0.0.1';\n"
       "    await fastify.listen({ port: Environment.web.port, host });")
if old not in src:
    sys.exit("web-bind patch did not match upstream source; refusing to guess")
open(path, "w").write(src.replace(old, new, 1))
PATCH
  echo "web bind made configurable"
}

# Android Chrome throttles background tabs to roughly one timer per minute. The upstream
# engine logs a player out after 30s without a connection and force-logs after 60s, so
# switching tabs ends the session. Expose both as env vars and default them high for a
# private world. Idempotent: the upstream defaults are preserved on the public repo.
patch_idle_timeouts() {
  local world="$1/src/engine/World.ts"
  [[ -f "$world" ]] || fail "engine source not found: $world"
  grep -q "JOSHRS_IDLE_LOGOUT_TICKS" "$world" && return 0
  python3 - "$world" <<'PATCH'
import sys
path = sys.argv[1]
src = open(path).read()
old = ("    private static readonly TIMEOUT_NO_CONNECTION: number = 50;"
       " // 30s with no connection (16 ticks in osrs)\n"
       "    private static readonly TIMEOUT_NO_RESPONSE: number = 100;"
       " // 60s without any response")
new = ("    // JoshRS: Android Chrome throttles background tabs; raise for a private world.\n"
       "    private static readonly TIMEOUT_NO_CONNECTION: number ="
       " Number(process.env.JOSHRS_IDLE_LOGOUT_TICKS ?? 50);"
       " // 30s with no connection (16 ticks in osrs)\n"
       "    private static readonly TIMEOUT_NO_RESPONSE: number ="
       " Number(process.env.JOSHRS_FORCE_LOGOUT_TICKS ?? 100);"
       " // 60s without any response")
if old not in src:
    sys.exit("idle-timeout patch did not match upstream source; refusing to guess")
open(path, "w").write(src.replace(old, new))
PATCH
  echo "idle timeouts made configurable"
}

# Keep every listener on loopback so this world is never exposed to the LAN.
python3 -I "$repo/tools/play274/loopback_bind.py" "$target/engine"

if $LAN_MODE; then
  if [[ -z "$LAN_HOST" ]]; then
    LAN_HOST="$(detect_lan_ip)"
    echo "detected private address: $LAN_HOST"
  fi
  is_private_ipv4 "$LAN_HOST" || fail "$LAN_HOST is not a private IPv4 address; refusing to expose the world"
  patch_web_bind "$target/engine"

  # The allowlist must be written to world.json: Engine-TS reads env vars only from a
  # legacy .env file, and its default allowedOrigin of '' disables the check entirely.
  cp "$repo/tools/play274/set-allowed-origin.ts" "$target/engine/set-allowed-origin.ts"
  ( cd "$target/engine" && ORIGIN_TO_ALLOW="http://$LAN_HOST:8888" npx tsx set-allowed-origin.ts )
  export JOSHRS_BIND_HOST="$LAN_HOST"
  url="http://$LAN_HOST:8888/rs2.cgi"
  echo "bind host: $LAN_HOST (management port stays on loopback)"
fi

if [[ ! -d "$target/engine/node_modules" ]]; then
  ( cd "$target/engine" && npm install --no-audit --no-fund )
fi

# Android may kill Termux when the screen sleeps; keep the world alive.
command -v termux-wake-lock >/dev/null && termux-wake-lock || true

patch_idle_timeouts "$target/engine"

if running; then
  echo "already running: $url"
  exit 0
fi

# 600ms per tick. A closed tab must release the character quickly (otherwise a reload
# reports "already logged in"), while a backgrounded tab keeps its socket open and is
# covered by the no-response timeout. 50 ticks = 30s after the socket actually closes.
export JOSHRS_IDLE_LOGOUT_TICKS="${JOSHRS_IDLE_LOGOUT_TICKS:-50}"
export JOSHRS_FORCE_LOGOUT_TICKS="${JOSHRS_FORCE_LOGOUT_TICKS:-14400}"

cd "$target/engine"
setsid nohup npx tsx src/app.ts > "$log" 2>&1 < /dev/null &
disown || true

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

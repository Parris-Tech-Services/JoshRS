#!/usr/bin/env bash
# Standalone Android (Termux -> Debian proot) RS-SDK experiment for JoshRS.
# Operates ONLY inside the Debian container at $HOME/rs-sdk-android-only.
# Never reads, stops or modifies ~/lc274, ~/dev274, ~/js377 or family saves.
set -Eeuo pipefail

readonly WORK="$HOME/rs-sdk-android-only"
readonly HTTP_PORT=18988
readonly GAME_PORT=14594
readonly GATEWAY_PORT=17780
readonly MANAGEMENT_PORT=18998
readonly HISCORES_PORT=18889
readonly REPO='https://github.com/MaxBittker/rs-sdk.git'

say() { printf '[JoshRS Android RS-SDK] %s\n' "$*"; }
fail() { printf '[BLOCKED] %s\n' "$*" >&2; exit 2; }

require_debian() {
  [[ -f /etc/debian_version ]] || fail 'Run this INSIDE proot-distro login debian (not the Termux host).'
  [[ "$(uname -m)" == aarch64 || "$(uname -m)" == arm64 ]] || fail 'Requires 64-bit ARM Debian on Android.'
  [[ "$WORK" = "$HOME/rs-sdk-android-only" && "$WORK" != / && ! -L "$WORK" ]] || fail 'Unsafe sandbox path.'
  for p in "$HOME/lc274" "$HOME/dev274" "$HOME/js377"; do
    [[ "$WORK" != "$p" ]] || fail 'Refusing to use an existing JoshRS world.'
  done
}

# A port bound on any local interface conflicts with a listener; do not stop it.
port_free() {
  python3 - "$1" <<'PY'
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(('0.0.0.0', int(sys.argv[1])))
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

ports_free() {
  local label p
  for label in "web:$HTTP_PORT" "game:$GAME_PORT" "gateway:$GATEWAY_PORT" "management:$MANAGEMENT_PORT" "hiscores:$HISCORES_PORT"; do
    p="${label##*:}"
    if port_free "$p"; then say "free: $label"; else fail "Port $label is occupied. Leaving the existing service untouched."; fi
  done
}

export_environment() {
  export WEB_PORT="$HTTP_PORT" NODE_PORT="$GAME_PORT"
  export AGENT_PORT="$GATEWAY_PORT" WEB_MANAGEMENT_PORT="$MANAGEMENT_PORT"
  export HISCORES_WEB_PORT="$HISCORES_PORT"
  export GATEWAY_URL="ws://127.0.0.1:$GATEWAY_PORT"
  export GATEWAY_HOSTNAME=127.0.0.1 GATEWAY_PUBLIC_PORT=0
  export WEB_TRANSPORT_WORKER=true
  export WEB_ALLOWED_ORIGIN="http://127.0.0.1:$HTTP_PORT"
  export LOGIN_SERVER=false FRIEND_SERVER=false LOGGER_SERVER=false
  export NODE_TICKRATE=400 TELEMETRY=false
  export PATH="$HOME/.bun/bin:$PATH"
}

require_checkout() {
  [[ -d "$WORK/.git" ]] || fail "Not installed. Run: bash $0 install"
  [[ ! -L "$WORK" ]] || fail 'Sandbox path is a symlink.'
  local origin
  origin="$(git -C "$WORK" remote get-url origin)" || fail 'Cannot identify checkout remote.'
  [[ "$origin" == "$REPO" ]] || fail "Refusing unexpected checkout remote: $origin"
}

# Fail-closed changes only inside the disposable RS-SDK checkout.
# Upstream deliberately defaults to public listeners. We restrict all enabled services to loopback.
patch_bindings() {
  python3 - "$WORK" <<'PY'
from pathlib import Path
import os, sys
root = Path(sys.argv[1]).resolve()
patches = {
    'server/engine/src/web/WebTransportServer.ts': (
        "hostname: options.hostname ?? '0.0.0.0', port: options.port,",
        "hostname: options.hostname ?? '127.0.0.1', port: options.port,"
    ),
    'server/engine/src/server/tcp/TcpServer.ts': (
        "this.tcp.listen(Environment.node.port, '0.0.0.0', () => {});",
        "this.tcp.listen(Environment.node.port, '127.0.0.1', () => {});"
    ),
    'server/engine/src/setup.ts': (
        "server.listen(Environment.web.managementPort, '0.0.0.0', () => resolve());",
        "server.listen(Environment.web.managementPort, '127.0.0.1', () => resolve());"
    ),
    'server/engine/src/web/index.ts': (
        "hostname: offThread ? '127.0.0.1' : '0.0.0.0',",
        "hostname: '127.0.0.1',"
    ),
    'server/engine/src/web/hiscoresServer.ts': (
        'port: Environment.HISCORES_WEB_PORT,',
        "port: Environment.HISCORES_WEB_PORT, hostname: '127.0.0.1',"
    ),
}
# Validate the entire patch set first: don't leave half-modified listeners after upstream drift.
updates = {}
for rel, (old, new) in patches.items():
    path = root / rel
    if path.is_symlink() or not path.is_file() or root not in path.resolve().parents:
        sys.exit(f'BLOCKED: unsafe/missing upstream file {rel}')
    current = path.read_text()
    if current.count(old) == 1 and new not in current:
        updates[path] = current.replace(old, new, 1)
    elif current.count(new) == 1 and current.count(old) == (1 if old in new else 0):
        continue  # already patched
    else:
        sys.exit(f'BLOCKED: upstream changed listener in {rel}; no files modified')
for path, value in updates.items():
    tmp = path.with_suffix(path.suffix + '.phone-tmp')
    tmp.write_text(value)
    os.replace(tmp, path)
print(f'Loopback listener patches verified ({len(patches)} paths; {len(updates)} changed).')
PY
}

check_bindings() {
  local f
  for f in \
    server/engine/src/web/WebTransportServer.ts \
    server/engine/src/server/tcp/TcpServer.ts \
    server/engine/src/setup.ts \
    server/engine/src/web/index.ts \
    server/engine/src/web/hiscoresServer.ts; do
    [[ -f "$WORK/$f" ]] || fail "Missing $f"
  done
  grep -Fq "hostname: options.hostname ?? '127.0.0.1'" "$WORK/server/engine/src/web/WebTransportServer.ts" || fail 'Web transport not loopback-only'
  grep -Fq "this.tcp.listen(Environment.node.port, '127.0.0.1'" "$WORK/server/engine/src/server/tcp/TcpServer.ts" || fail 'TCP game port not loopback-only'
  grep -Fq "server.listen(Environment.web.managementPort, '127.0.0.1'" "$WORK/server/engine/src/setup.ts" || fail 'Management port not loopback-only'
  grep -Fq "hostname: '127.0.0.1'," "$WORK/server/engine/src/web/index.ts" || fail 'Web listener not loopback-only'
  grep -Fq "port: Environment.HISCORES_WEB_PORT, hostname: '127.0.0.1'" "$WORK/server/engine/src/web/hiscoresServer.ts" || fail 'Hiscores not loopback-only'
}

setup() {
  require_debian
  [[ ! -e "$WORK" || -d "$WORK/.git" ]] || fail "The sandbox path already exists and is not our checkout: $WORK"
  say 'Installing Debian dependencies (no changes to the Termux live worlds).'
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y git curl unzip ca-certificates python3 openssl
  if ! command -v bun >/dev/null 2>&1 && [[ ! -x "$HOME/.bun/bin/bun" ]]; then
    say 'Installing official Linux ARM64 Bun into Debian home.'
    local install_script
    install_script="$(mktemp)"
    curl -fsSL https://bun.com/install -o "$install_script" || fail 'Bun download failed'
    bash "$install_script"
    rm -f "$install_script"
  fi
  export_environment
  bun --version || fail 'Bun cannot run in this Android Debian environment.'
  bun -e 'console.log("bun-runtime-ok", process.arch, process.platform)' || fail 'Bun execution failed.'
  if [[ ! -e "$WORK" ]]; then
    git clone --depth 1 "$REPO" "$WORK"
  fi
  require_checkout
  say "RS-SDK upstream commit: $(git -C "$WORK" rev-parse HEAD)"
  say 'Applying fail-closed loopback listeners in the isolated checkout.'
  patch_bindings
  check_bindings
  say 'Installing locked RS-SDK dependencies (may require several GB of free space).'
  ( cd "$WORK" && PUPPETEER_SKIP_DOWNLOAD=1 bun install --frozen-lockfile )
  ( cd "$WORK/server/engine" && HUSKY=0 bun install --frozen-lockfile )
  ( cd "$WORK/server/webclient" && bun install --frozen-lockfile )
  say 'Installed source and dependencies. Actual Android game startup remains UNVERIFIED.'
  say "Next: bash $0 doctor  ; then bash $0 build"
}

# Explicit build step: never silently starts another server or migrates saves.
build() {
  require_debian; require_checkout; export_environment; check_bindings
  ( cd "$WORK/server/webclient" && bun run build )
  ( cd "$WORK/server/engine" && bun run build )
  say 'Build completed (not proof of phone login or quest playability).'
}

doctor() {
  require_debian
  say "sandbox: $WORK"
  [[ -d "$WORK/.git" ]] && { require_checkout; check_bindings; say "upstream: $(git -C "$WORK" rev-parse --short HEAD)"; } || say 'Not installed yet.'
  [[ -x "$HOME/.bun/bin/bun" ]] && "$HOME/.bun/bin/bun" --version || say 'Bun not installed in Debian home.'
  ports_free
  say 'Checks passed. The isolated listener ports are currently free.'
}

start_component() {
  local component="$1"
  require_debian; require_checkout; export_environment; check_bindings
  command -v bun >/dev/null || fail 'Bun missing; run install first.'
  case "$component" in
    engine)
      for p in "$HTTP_PORT" "$GAME_PORT" "$MANAGEMENT_PORT" "$HISCORES_PORT"; do
        port_free "$p" || fail "Port $p busy. Never stop or reuse an existing world."
      done
      say "Game on http://127.0.0.1:$HTTP_PORT/rs2.cgi once ready; Ctrl+C stops only this command."
      cd "$WORK/server/engine"; exec bun run start ;;
    gateway)
      port_free "$GATEWAY_PORT" || fail "Gateway port $GATEWAY_PORT busy."
      cd "$WORK/server/gateway"; exec bun run gateway ;;
    web)
      cd "$WORK/server/webclient"; exec bun run watch ;;
    *) fail 'Internal invalid component' ;;
  esac
}

create_bot() {
  require_debian; require_checkout; export_environment
  local name="${1:-}"
  [[ "$name" =~ ^[a-zA-Z0-9]{1,12}$ ]] || fail 'Bot name must be 1-12 letters/numbers.'
  [[ ! -e "$WORK/bots/$name" ]] || fail 'Bot already exists; refusing to overwrite credentials.'
  (cd "$WORK" && bun bots/create-bot.ts "$name" --no-chat)
  local envfile="$WORK/bots/$name/bot.env"
  [[ -f "$envfile" ]] || fail 'Bot credentials file was not generated.'
  python3 - "$envfile" "$HTTP_PORT" "$GATEWAY_PORT" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
if p.is_symlink(): sys.exit('Unsafe bot.env symlink')
lines = p.read_text().splitlines()
updates = {'SERVER': f'localhost:{sys.argv[2]}', 'GATEWAY_URL': f'ws://127.0.0.1:{sys.argv[3]}', 'SHOW_CHAT': 'false'}
lines = [x for x in lines if x.split('=', 1)[0] not in updates]
lines.extend(f'{k}={v}' for k,v in updates.items())
p.write_text('\n'.join(lines) + '\n')
p.chmod(0o600)
PY
  say "Bot '$name' created locally. Credentials remain in Debian sandbox; not committed."
}

run_bot() {
  require_debian; require_checkout; export_environment
  local mode="$1" name="${2:-}"
  [[ "$name" =~ ^[a-zA-Z0-9]{1,12}$ ]] || fail 'Give a valid existing bot name.'
  [[ -f "$WORK/bots/$name/bot.env" ]] || fail "Create bot first: bash $0 create-bot $name"
  grep -Fxq "SERVER=localhost:$HTTP_PORT" "$WORK/bots/$name/bot.env" || fail 'Bot points to a different server; refusing.'
  grep -Fxq "GATEWAY_URL=ws://127.0.0.1:$GATEWAY_PORT" "$WORK/bots/$name/bot.env" || fail 'Bot points to a different gateway; refusing.'
  case "$mode" in
    client) cd "$WORK/server/webclient"; exec bun src/lite/runner.ts "$name" ;;
    bot) cd "$WORK"; exec bun "bots/$name/script.ts" ;;
  esac
}

usage() {
  cat <<'TXT'
JoshRS Android-only RS-SDK (isolated Debian/Termux experiment)
  bash phone.sh install             Install Debian Bun + isolated RS-SDK source and dependencies
  bash phone.sh doctor              Read-only safety / free-port check
  bash phone.sh build               Compile upstream browser client + engine content
  bash phone.sh engine              Start engine (separate foreground Termux/Debian session)
  bash phone.sh gateway             Start bot gateway (separate session)
  bash phone.sh web                 Start browser-client watcher (separate session)
  bash phone.sh create-bot phonebot Create bot with local-only credentials
  bash phone.sh client phonebot     Start attached headless client (separate session)
  bash phone.sh bot phonebot        Run one bot script (separate session)

Phone URL (only once your isolated engine is running):
  http://127.0.0.1:18988/rs2.cgi
Stop foreground components with Ctrl+C in their own session.
No server is ever auto-stopped/restarted, and no production save is imported.
TXT
}

case "${1:-help}" in
  install) setup ;;
  doctor) doctor ;;
  build) build ;;
  engine|gateway|web) start_component "$1" ;;
  create-bot) create_bot "${2:-}" ;;
  client|bot) run_bot "$1" "${2:-}" ;;
  help|-h|--help) usage ;;
  *) usage; fail "Unknown command: $1" ;;
esac

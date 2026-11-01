#!/usr/bin/env bash
# Disposable Fedora 377 launcher. No changes to installed game or Agy worktree.
set -Eeuo pipefail
if (( $# != 2 )); then echo "Usage: $0 prepare|start|status MANIFEST.json" >&2; exit 2; fi
cmd="$1"; manifest="$2"
case "$cmd" in prepare|start|status) ;; *) exit 2;; esac
source_root="$HOME/dev/JoshRS-source"
installed="$HOME/dev/JoshRS/lostcity377"
guard="$source_root/tools/rs377-companion-contract/src/run-integration.mjs"
test -f "$guard" || { echo "Missing isolation manifest checker" >&2; exit 1; }
test -d "$installed/engine/.git" && test -d "$installed/content/.git" || { echo "Installed source not found" >&2; exit 1; }
node "$guard" --verify "$manifest"
test -f "$manifest" && test ! -L "$manifest" || exit 1
root="$(cd "$(dirname "$manifest")" && pwd -P)"
test "$manifest" = "$root/manifest.json" || { echo "Use absolute canonical manifest path" >&2; exit 1; }
case "$root" in /tmp/joshrs-377-disposable-*) ;; *) echo "Unsafe root" >&2; exit 1;; esac
eval "$(python3 - "$manifest" <<'PY'
import json,shlex,sys
m=json.load(open(sys.argv[1]))
for n in ('game','web','login','friends','logger'):
 print('port_'+n+'='+shlex.quote(str(m['ports'][n])))
print('world='+shlex.quote(m['worldId']))
PY
)"
management=8989
check_ports() {
  for port in "$port_game" "$port_web" "$port_login" "$port_friends" "$port_logger" "$management"; do
    if ss -H -ltn "sport = :$port" | grep -q .; then
      echo "BLOCKED: port $port already listening" >&2
      return 1
    fi
  done
}
if [[ "$cmd" == status ]]; then
  echo "World: $world; root: $root"
  for port in "$port_game" "$port_web" "$port_login" "$port_friends" "$port_logger" "$management"; do
    ss -H -ltnp "sport = :$port" || true
  done
  [[ -f "$root/ready-for-first-start" ]] && echo "Prepared" || echo "Not prepared"
  exit 0
fi
if [[ "$cmd" == prepare ]]; then
  check_ports
  if [[ -e "$root/engine" || -L "$root/engine" || -e "$root/content" || -L "$root/content" ]]; then
    echo "BLOCKED: disposable source already exists; create a new manifest" >&2
    exit 1
  fi
  if [[ -n "$(git -C "$installed/engine" status --porcelain --untracked-files=no)" || -n "$(git -C "$installed/content" status --porcelain --untracked-files=no)" ]]; then
    echo "BLOCKED: installed source has tracked changes" >&2
    exit 1
  fi
  git clone --no-hardlinks "$installed/engine" "$root/engine"
  git clone --no-hardlinks "$installed/content" "$root/content"
  python3 - "$root/engine" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['src/server/tcp/TcpServer.ts','src/server/login/LoginServer.ts',
       'src/server/friend/FriendServer.ts','src/server/logger/LoggerServer.ts','src/web.ts']
for name in files:
 p=root/name
 if not p.is_file(): raise SystemExit('Missing expected listener: '+name)
 old=p.read_text()
 new=old.replace("'0.0.0.0'","'127.0.0.1'").replace('"0.0.0.0"','"127.0.0.1"')
 if new==old and "127.0.0.1" not in old: raise SystemExit('Unknown listener: '+name)
 p.write_text(new)
 print('Loopback-only:', name)
remaining=[str(p.relative_to(root)) for p in (root/'src').rglob('*.ts') if '0.0.0.0' in p.read_text(errors='replace')]
if remaining: raise SystemExit('Unreviewed public listener: '+', '.join(remaining))
PY
  [[ ! -e "$root/engine/.env" && ! -e "$root/engine/db.sqlite" ]] || { echo "BLOCKED: unexpected cloned private data" >&2; exit 1; }
  cat > "$root/engine/.env" <<EOF
EASY_STARTUP=true
NODE_PROFILE=$world
NODE_ID=71
NODE_PORT=$port_game
WEB_PORT=$port_web
WEB_MANAGEMENT_PORT=$management
LOGIN_SERVER=true
LOGIN_HOST=127.0.0.1
LOGIN_PORT=$port_login
FRIEND_SERVER=true
FRIEND_HOST=127.0.0.1
FRIEND_PORT=$port_friends
LOGGER_SERVER=true
LOGGER_HOST=127.0.0.1
LOGGER_PORT=$port_logger
DB_BACKEND=sqlite
NODE_XPRATE=1
NODE_PRODUCTION=false
WEBSITE_REGISTRATION=true
BUILD_SRC_DIR=../content
RS377_OBSERVER_ENABLED=false
EOF
  chmod 600 "$root/engine/.env"
  cd "$root/engine"
  npm ci --no-audit --no-fund
  npm run build
  npm run sqlite:migrate
  [[ -f "$root/engine/db.sqlite" && ! -L "$root/engine/db.sqlite" && ! -e "$root/db/db.sqlite" ]] || { echo "BLOCKED: isolated DB not created" >&2; exit 1; }
  mv "$root/engine/db.sqlite" "$root/db/db.sqlite"
  ln -s "$root/db/db.sqlite" "$root/engine/db.sqlite"
  mkdir -p "$root/engine/data"
  [[ ! -e "$root/engine/data/players" && ! -L "$root/engine/data/players" ]] || { echo "BLOCKED: save directory already exists" >&2; exit 1; }
  ln -s "$root/saves" "$root/engine/data/players"
  printf 'world=%s\nengine=%s\ncontent=%s\n' "$world" \
    "$(git -C "$root/engine" rev-parse HEAD)" "$(git -C "$root/content" rev-parse HEAD)" > "$root/reports/source-fingerprint.txt"
  touch "$root/ready-for-first-start"
  echo "PREPARED: disposable build, DB and saves ready; no server started."
  exit 0
fi
[[ -f "$root/ready-for-first-start" ]] || { echo "BLOCKED: run prepare first" >&2; exit 1; }
[[ -L "$root/engine/db.sqlite" && "$(readlink -f "$root/engine/db.sqlite")" == "$root/db/db.sqlite" ]] || { echo "DB isolation mismatch" >&2; exit 1; }
[[ -L "$root/engine/data/players" && "$(readlink -f "$root/engine/data/players")" == "$root/saves" ]] || { echo "Save isolation mismatch" >&2; exit 1; }
check_ports
echo "Starting isolated world $world on game port $port_game and web port $port_web"
echo "Press Ctrl+C to stop. This is not the family world."
cd "$root/engine"
exec npm run quickstart

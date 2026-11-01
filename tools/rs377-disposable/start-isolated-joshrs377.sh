#!/usr/bin/env bash
# Disposable Fedora 377 launcher. No changes to installed game or Agy worktree.
set -Eeuo pipefail
if (( $# != 2 )); then echo "Usage: $0 prepare|resume|start|status MANIFEST.json" >&2; exit 2; fi
cmd="$1"; manifest="$2"
case "$cmd" in prepare|resume|start|status) ;; *) exit 2;; esac
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
# Keep large source clones, npm dependencies and generated pack/cache on the
# disk-backed home filesystem, not Fedora's usually RAM-backed /tmp.
build_parent="$HOME/dev/JoshRS-disposable-worlds"
build="$build_parent/$world"
check_ports() {
  for port in "$port_game" "$port_web" "$port_login" "$port_friends" "$port_logger" "$management"; do
    if ss -H -ltn "sport = :$port" | grep -q .; then
      echo "BLOCKED: port $port already listening" >&2
      return 1
    fi
  done
}
if [[ "$cmd" == status ]]; then
  echo "World: $world; manifest: $root; disk-backed build: $build"
  for port in "$port_game" "$port_web" "$port_login" "$port_friends" "$port_logger" "$management"; do
    ss -H -ltnp "sport = :$port" || true
  done
  [[ -f "$root/ready-for-first-start" ]] && echo "Prepared" || echo "Not prepared"
  exit 0
fi
if [[ "$cmd" == prepare || "$cmd" == resume ]]; then
  check_ports
  if [[ "$cmd" == prepare ]]; then
    if [[ -e "$build" || -L "$build" ]]; then
      echo "BLOCKED: disposable source exists. Use 'resume' ONLY for partial listener-patch stage." >&2
      exit 1
    fi
  else
    [[ -d "$build" && ! -L "$build" && -d "$build/engine/.git" &&
       -d "$build/content/.git" && ! -L "$build/engine" && ! -L "$build/content" ]] || {
      echo "BLOCKED: cannot resume without original disposable Git clones" >&2; exit 1;
    }
    [[ ! -e "$build/engine/.env" && ! -e "$build/engine/db.sqlite" &&
       ! -e "$root/ready-for-first-start" ]] || {
      echo "BLOCKED: resume only supported before config/build/db; never overwrite existing state" >&2; exit 1;
    }
    [[ "$(git -C "$build/engine" rev-parse HEAD)" == "$(git -C "$installed/engine" rev-parse HEAD)" &&
       "$(git -C "$build/content" rev-parse HEAD)" == "$(git -C "$installed/content" rev-parse HEAD)" ]] || {
      echo "BLOCKED: disposable commits differ from installed source" >&2; exit 1;
    }
    [[ -z "$(git -C "$build/content" status --porcelain --untracked-files=all)" &&
       -z "$(git -C "$build/engine" ls-files --others --exclude-standard)" &&
       -z "$(git -C "$build/engine" diff --cached --name-only)" ]] || {
      echo "BLOCKED: unexpected source changes in partial disposable copy" >&2; exit 1;
    }
    while IFS= read -r changed; do
      case "$changed" in
        src/server/tcp/TcpServer.ts|src/server/login/LoginServer.ts|src/server/friend/FriendServer.ts|src/server/logger/LoggerServer.ts|src/web.ts) ;;
        *) echo "BLOCKED: unexpected modified file $changed" >&2; exit 1 ;;
      esac
    done < <(git -C "$build/engine" diff --name-only)
  fi
  if [[ -n "$(git -C "$installed/engine" status --porcelain --untracked-files=no)" || -n "$(git -C "$installed/content" status --porcelain --untracked-files=no)" ]]; then
    echo "BLOCKED: installed source has tracked changes" >&2
    exit 1
  fi
  [[ ! -L "$build_parent" ]] || { echo "BLOCKED: disposable build parent must not be a symlink" >&2; exit 1; }
  mkdir -p "$build_parent"
  if [[ "$cmd" == prepare ]]; then
    mkdir -m 700 "$build"
    git clone --no-hardlinks "$installed/engine" "$build/engine"
    git clone --no-hardlinks "$installed/content" "$build/content"
  else
    echo "RESUMING verified partial isolated clones; original installed game remains untouched."
  fi
  python3 - "$build/engine" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['src/server/tcp/TcpServer.ts','src/server/login/LoginServer.ts',
       'src/server/friend/FriendServer.ts','src/server/logger/LoggerServer.ts',
       'src/web.ts','src/app.ts']
for name in files:
 p=root/name
 if not p.is_file(): raise SystemExit('Missing expected listener: '+name)
 old=p.read_text()
 new=old.replace('0.0.0.0','127.0.0.1')
 if new==old and "127.0.0.1" not in old and name!='src/app.ts':
  raise SystemExit('Unknown listener: '+name)
 p.write_text(new)
 print('Loopback-only:', name)
remaining=[str(p.relative_to(root)) for p in (root/'src').rglob('*.ts') if '0.0.0.0' in p.read_text(errors='replace')]
if remaining: raise SystemExit('Unreviewed public listener: '+', '.join(remaining))
PY
  [[ ! -e "$build/engine/.env" && ! -e "$build/engine/db.sqlite" ]] || { echo "BLOCKED: unexpected cloned private data" >&2; exit 1; }
  cat > "$build/engine/.env" <<EOF
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
  chmod 600 "$build/engine/.env"
  cd "$build/engine"
  npm ci --no-audit --no-fund
  npm run build
  npm run sqlite:migrate
  [[ -f "$build/engine/db.sqlite" && ! -L "$build/engine/db.sqlite" && ! -e "$root/db/db.sqlite" ]] || { echo "BLOCKED: isolated DB not created" >&2; exit 1; }
  mv "$build/engine/db.sqlite" "$root/db/db.sqlite"
  ln -s "$root/db/db.sqlite" "$build/engine/db.sqlite"
  mkdir -p "$build/engine/data"
  [[ ! -e "$build/engine/data/players" && ! -L "$build/engine/data/players" ]] || { echo "BLOCKED: save directory already exists" >&2; exit 1; }
  ln -s "$root/saves" "$build/engine/data/players"
  printf 'world=%s\nengine=%s\ncontent=%s\n' "$world" \
    "$(git -C "$build/engine" rev-parse HEAD)" "$(git -C "$build/content" rev-parse HEAD)" > "$root/reports/source-fingerprint.txt"
  touch "$root/ready-for-first-start"
  echo "Build on disk: $build"
  echo "PREPARED: disposable build, DB and saves ready; no server started."
  exit 0
fi
[[ -f "$root/ready-for-first-start" ]] || { echo "BLOCKED: run prepare first" >&2; exit 1; }
[[ -L "$build/engine/db.sqlite" && "$(readlink -f "$build/engine/db.sqlite")" == "$root/db/db.sqlite" ]] || { echo "DB isolation mismatch" >&2; exit 1; }
[[ -L "$build/engine/data/players" && "$(readlink -f "$build/engine/data/players")" == "$root/saves" ]] || { echo "Save isolation mismatch" >&2; exit 1; }
check_ports
echo "Starting isolated world $world from disk-backed $build on game port $port_game and web port $port_web"
echo "Press Ctrl+C to stop. This is not the family world."
cd "$build/engine"
exec npm run quickstart

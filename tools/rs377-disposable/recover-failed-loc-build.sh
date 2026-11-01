#!/usr/bin/env bash
# Resume an interrupted *disposable* Fedora 377 build after an expected .loc CRC
# mismatch. Never edits the installed family game, its DB, saves, or Agy's tree.
set -Eeuo pipefail
if (( $# != 1 )); then
  echo "Usage: bash $0 /tmp/joshrs-377-disposable-XXXXXX/manifest.json" >&2
  exit 2
fi
manifest="$1"
source_root="$HOME/dev/JoshRS-source"
installed="$HOME/dev/JoshRS/lostcity377"
guard="$source_root/tools/rs377-companion-contract/src/run-integration.mjs"
[[ -f "$guard" && -d "$installed/engine/.git" && -d "$installed/content/.git" ]] || {
  echo "BLOCKED: source verifier or original repositories unavailable" >&2; exit 1;
}
node "$guard" --verify "$manifest"
[[ -f "$manifest" && ! -L "$manifest" ]] || exit 1
root="$(cd "$(dirname "$manifest")" && pwd -P)"
[[ "$manifest" == "$root/manifest.json" && "$root" == /tmp/joshrs-377-disposable-* ]] || {
  echo "BLOCKED: invalid manifest location" >&2; exit 1;
}
world="$(python3 - "$manifest" <<'PY'
import json,sys
print(json.load(open(sys.argv[1]))['worldId'])
PY
)"
build_parent="$HOME/dev/JoshRS-disposable-worlds"
build="$build_parent/$world"
engine="$build/engine"
content="$build/content"
[[ -d "$build" && ! -L "$build_parent" && ! -L "$build" &&
   -d "$engine/.git" && -d "$content/.git" &&
   ! -L "$engine" && ! -L "$content" ]] || {
  echo "BLOCKED: expected disk-backed disposable clones are absent or unsafe" >&2; exit 1;
}
[[ -f "$engine/.env" && ! -L "$engine/.env" &&
   ! -e "$engine/db.sqlite" && ! -e "$root/db/db.sqlite" &&
   ! -e "$root/ready-for-first-start" &&
   ! -e "$engine/data/players" && ! -L "$engine/data/players" ]] || {
  echo "BLOCKED: not an incomplete pre-database build; no existing state will be overwritten" >&2; exit 1;
}
[[ "$(git -C "$engine" rev-parse HEAD)" == "$(git -C "$installed/engine" rev-parse HEAD)" &&
   "$(git -C "$content" rev-parse HEAD)" == "$(git -C "$installed/content" rev-parse HEAD)" ]] || {
  echo "BLOCKED: installed and disposable source commit fingerprints differ" >&2; exit 1;
}
[[ -z "$(git -C "$content" status --porcelain)" &&
   -z "$(git -C "$engine" ls-files --others --exclude-standard)" &&
   -z "$(git -C "$engine" diff --cached --name-only)" ]] || {
  echo "BLOCKED: unexpected source changes in disposable clones" >&2; exit 1;
}
while IFS= read -r changed; do
  case "$changed" in
    src/server/tcp/TcpServer.ts|src/server/login/LoginServer.ts|src/server/friend/FriendServer.ts|src/server/logger/LoggerServer.ts|src/web.ts|src/app.ts|tools/pack/config/PackShared.ts) ;;
    *) echo "BLOCKED: unexpected modified source file: $changed" >&2; exit 1;;
  esac
done < <(git -C "$engine" diff --name-only)
python3 - "$manifest" "$engine" <<'PY'
from pathlib import Path
import json,sys
m=json.load(open(sys.argv[1]))
engine=Path(sys.argv[2])
cfg={}
for raw in (engine/'.env').read_text().splitlines():
    if not raw or raw.startswith('#'): continue
    if '=' not in raw: raise SystemExit('BLOCKED: malformed disposable .env')
    k,v=raw.split('=',1)
    if k in cfg: raise SystemExit('BLOCKED: duplicate disposable .env key '+k)
    cfg[k]=v
expected={'NODE_PROFILE':m['worldId'],'NODE_PORT':str(m['ports']['game']),
          'WEB_PORT':str(m['ports']['web']),'LOGIN_PORT':str(m['ports']['login']),
          'FRIEND_PORT':str(m['ports']['friends']),
          'LOGGER_PORT':str(m['ports']['logger']),
          'WEB_MANAGEMENT_PORT':'8989','DB_BACKEND':'sqlite',
          'EASY_STARTUP':'true','NODE_XPRATE':'1','NODE_PRODUCTION':'false',
          'BUILD_SRC_DIR':'../content'}
for k,v in expected.items():
    if cfg.get(k)!=v: raise SystemExit('BLOCKED: disposable .env mismatch: '+k)
for fname in ('src/server/tcp/TcpServer.ts','src/server/login/LoginServer.ts',
              'src/server/friend/FriendServer.ts','src/server/logger/LoggerServer.ts',
              'src/web.ts','src/app.ts'):
    s=(engine/fname).read_text()
    if '0.0.0.0' in s: raise SystemExit('BLOCKED: wildcard binding remains: '+fname)
p=engine/'tools/pack/config/PackShared.ts'
s=p.read_text()
needle='!validate(client.dat, server.dat)'
loc_guard="!(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && "
if 'JOSHRS_CUSTOM_LOCS' not in s:
    if s.count(needle)!=1: raise SystemExit('BLOCKED: cannot uniquely locate original CRC check')
    p.write_text(s.replace(needle,loc_guard+needle))
    print('Applied scoped .loc CRC exception ONLY in disposable engine.')
elif loc_guard in s:
    print('Existing custom .loc CRC guard present in disposable engine.')
else:
    raise SystemExit('BLOCKED: unrecognised existing custom loc guard')
print('Other checksum verification stays enabled (BUILD_VERIFY=true).')
PY
mapfile -t reserved_ports < <(python3 - "$manifest" <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
print(*m['ports'].values(),8989,sep='\n')
PY
)
for port in "${reserved_ports[@]}"; do
  if ss -H -ltn "sport = :$port" | grep -q .; then
    echo "BLOCKED: test service port $port is already occupied" >&2
    exit 1
  fi
done
cd "$engine"
echo "Rebuilding disposable content, with ONLY custom .loc reference CRC allowed."
BUILD_VERIFY=true JOSHRS_CUSTOM_LOCS=true npm run build
[[ -s data/pack/server/script.dat && -s data/pack/server/script.idx ]] || {
  echo "BLOCKED: compiled server script pack is missing or empty" >&2; exit 1;
}
echo "Creating separate disposable SQLite DB."
npm run sqlite:migrate
[[ -f "$engine/db.sqlite" && ! -L "$engine/db.sqlite" && ! -e "$root/db/db.sqlite" ]] || {
  echo "BLOCKED: fresh database missing or already exists" >&2; exit 1;
}
mv "$engine/db.sqlite" "$root/db/db.sqlite"
ln -s "$root/db/db.sqlite" "$engine/db.sqlite"
mkdir -p "$engine/data"
[[ ! -e "$engine/data/players" && ! -L "$engine/data/players" ]] || {
  echo "BLOCKED: unexpectedly existing save directory" >&2; exit 1;
}
ln -s "$root/saves" "$engine/data/players"
printf 'world=%s\nengine=%s\ncontent=%s\n' "$world" \
  "$(git -C "$engine" rev-parse HEAD)" "$(git -C "$content" rev-parse HEAD)" \
  > "$root/reports/source-fingerprint.txt"
touch "$root/ready-for-first-start"
echo "PREPARED: disposable build, SQLite DB and saves ready; no server started."
echo "Use the existing launcher 'start' command to start the isolated server."

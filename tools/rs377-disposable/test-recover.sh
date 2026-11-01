#!/usr/bin/env bash
# Offline fixture exercise for recovery of a partial disposable Fedora build.
set -Eeuo pipefail
source_repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
fakehome="$(mktemp -d)"
trap 'rm -rf "$fakehome"' EXIT
mkdir -p "$fakehome/dev/JoshRS/lostcity377/engine" "$fakehome/dev/JoshRS/lostcity377/content"
ln -s "$source_repo" "$fakehome/dev/JoshRS-source"
installed="$fakehome/dev/JoshRS/lostcity377"
for kind in engine content; do
  git -C "$installed/$kind" init --quiet
  git -C "$installed/$kind" config user.email test@example.invalid
  git -C "$installed/$kind" config user.name CI
done
printf '.env\ndb.sqlite\ndata/\n' > "$installed/engine/.gitignore"
cat > "$installed/engine/package.json" <<'EOF'
{
  "name":"disposable-fixture","version":"0.0.1","scripts":{
    "build":"node -e \"const fs=require('fs');if(process.env.BUILD_VERIFY!=='true'||process.env.JOSHRS_CUSTOM_LOCS!=='true'||!fs.readFileSync('tools/pack/config/PackShared.ts','utf8').includes(\\\"extension === '.loc'\\\"))process.exit(12);fs.mkdirSync('data/pack/server',{recursive:true});fs.writeFileSync('data/pack/server/script.dat','fake');fs.writeFileSync('data/pack/server/script.idx','fake')\"",
    "sqlite:migrate":"node -e \"require('fs').writeFileSync('db.sqlite','disposable-fixture')\""
  }
}
EOF
mkdir -p "$installed/engine/tools/pack/config" \
  "$installed/engine/src/server/tcp" "$installed/engine/src/server/login" \
  "$installed/engine/src/server/friend" "$installed/engine/src/server/logger"
echo "if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {}" > "$installed/engine/tools/pack/config/PackShared.ts"
for f in src/server/tcp/TcpServer.ts src/server/login/LoginServer.ts \
    src/server/friend/FriendServer.ts src/server/logger/LoggerServer.ts \
    src/web.ts src/app.ts; do
  echo "const listenAddress = '0.0.0.0';" > "$installed/engine/$f"
done
echo "fixture" > "$installed/content/README.md"
for kind in engine content; do
  git -C "$installed/$kind" add .
  git -C "$installed/$kind" commit -qm "source fixture"
done
manifest_output="$(HOME="$fakehome" node "$source_repo/tools/rs377-companion-contract/src/run-integration.mjs" --prepare)"
manifest="$(node -p "JSON.parse(process.argv[1]).manifest" "$manifest_output")"
world="$(node -p "JSON.parse(process.argv[1]).worldId" "$manifest_output")"
build="$fakehome/dev/JoshRS-disposable-worlds/$world"
mkdir -p "$build"
git clone -q --no-hardlinks "$installed/engine" "$build/engine"
git clone -q --no-hardlinks "$installed/content" "$build/content"
python3 - "$build/engine" "$manifest" <<'PY'
import json,sys
from pathlib import Path
eng=Path(sys.argv[1]); m=json.load(open(sys.argv[2]))
for p in (eng/'src').rglob('*.ts'):
 p.write_text(p.read_text().replace('0.0.0.0','127.0.0.1'))
lines={
 'NODE_PROFILE':m['worldId'],
 'NODE_PORT':m['ports']['game'],'WEB_PORT':m['ports']['web'],
 'LOGIN_PORT':m['ports']['login'],'FRIEND_PORT':m['ports']['friends'],
 'LOGGER_PORT':m['ports']['logger'],'WEB_MANAGEMENT_PORT':8989,
 'DB_BACKEND':'sqlite','EASY_STARTUP':'true','NODE_XPRATE':1,
 'NODE_PRODUCTION':'false','BUILD_SRC_DIR':'../content'
}
(eng/'.env').write_text(''.join(f'{k}={v}\n' for k,v in lines.items()))
PY
echo '=== Recovering partial build with only a scoped .loc checksum exception ==='
HOME="$fakehome" bash "$source_repo/tools/rs377-disposable/recover-failed-loc-build.sh" "$manifest"
test -s "$build/engine/data/pack/server/script.dat"
test -s "$build/engine/data/pack/server/script.idx"
test -L "$build/engine/db.sqlite"
test -L "$build/engine/data/players"
test -f "$(dirname "$manifest")/ready-for-first-start"
test -z "$(git -C "$installed/engine" status --porcelain)"
test -z "$(git -C "$installed/content" status --porcelain)"
if HOME="$fakehome" bash "$source_repo/tools/rs377-disposable/recover-failed-loc-build.sh" "$manifest" > /tmp/joshrs-resume-reject.log 2>&1; then
  echo 'ERROR: recovery should refuse to overwrite prepared state' >&2
  exit 1
fi
grep -q 'not an incomplete pre-database build' /tmp/joshrs-resume-reject.log
echo 'PASS: narrow checksum recovery, fresh DB and saves, idempotent refusal, original repos unchanged'

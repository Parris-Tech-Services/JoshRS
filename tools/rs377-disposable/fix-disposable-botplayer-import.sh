#!/usr/bin/env bash
# Repair eager BotPlayer import only in a stopped disposable Fedora world.
set -Eeuo pipefail
[[ $# == 1 ]] || { echo "Usage: bash $0 /tmp/joshrs-377-disposable-XXXXXX/manifest.json" >&2; exit 2; }
manifest="$1"
verifier="$HOME/dev/JoshRS-source/tools/rs377-companion-contract/src/run-integration.mjs"
[[ -f "$verifier" ]] || { echo "BLOCKED: isolation verifier missing" >&2; exit 1; }
node "$verifier" --verify "$manifest"
[[ -f "$manifest" && ! -L "$manifest" ]] || { echo 'BLOCKED: invalid manifest' >&2; exit 1; }
root="$(cd -- "$(dirname -- "$manifest")" && pwd -P)"
[[ "$manifest" == "$root/manifest.json" && "$root" == /tmp/joshrs-377-disposable-* ]] || { echo 'BLOCKED: unexpected manifest root' >&2; exit 1; }
mapfile -t params < <(python3 - "$manifest" <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
print(m['worldId'])
for name in ('game','web','login','friends','logger'):
 print(m['ports'][name])
PY
)
world="$(head -n 1 <<< "$params")"
build_parent="$HOME/dev/JoshRS-disposable-worlds"
engine="$build_parent/$world/engine"
original="$HOME/dev/JoshRS/lostcity377/engine"
[[ -d "$engine/.git" && ! -L "$build_parent" && ! -L "$build_parent/$world" && ! -L "$engine" ]] || { echo 'BLOCKED: disposable engine not safe' >&2; exit 1; }
[[ "$(git -C "$engine" rev-parse HEAD)" == "$(git -C "$original" rev-parse HEAD)" ]] || { echo 'BLOCKED: source fingerprint mismatch' >&2; exit 1; }
[[ -f "$root/ready-for-first-start" &&
   -L "$engine/db.sqlite" && "$(readlink -f "$engine/db.sqlite")" == "$root/db/db.sqlite" &&
   -L "$engine/data/players" && "$(readlink -f "$engine/data/players")" == "$root/saves" ]] || { echo 'BLOCKED: isolated DB or saves unverified' >&2; exit 1; }
for port in 53402 8988 8989 53500 55099 53501; do
 if ss -H -ltn "sport = :$port" | grep -q .; then
   echo "BLOCKED: isolated port $port listening. Stop this test server first." >&2; exit 1;
 fi
done
python3 - "$engine" "$root" <<'PY'
from pathlib import Path
import sys
engine,root=map(Path,sys.argv[1:])
app=engine/'src/app.ts'
bot=engine/'src/engine/entity/BotPlayer.ts'
world=engine/'src/engine/World.ts'
for f in (app,bot,world):
 if not f.is_file() or f.is_symlink(): raise SystemExit('BLOCKED: invalid source file '+str(f))
src=app.read_text()
early="import '#/engine/entity/BotPlayer.js';"
if src.count(early)!=1:
 raise SystemExit('BLOCKED: expected exactly one eager BotPlayer import in app.ts')
if 'extends Player' not in bot.read_text() or 'registerBotPlayerClass(BotPlayer)' not in bot.read_text():
 raise SystemExit('BLOCKED: BotPlayer inheritance/registration unexpected')
if "await import('#/engine/entity/BotPlayer.js')" not in world.read_text():
 raise SystemExit('BLOCKED: lazy registration in World.start missing')
if 'World.start()' not in src:
 raise SystemExit('BLOCKED: app.ts World startup unexpected')
backup=root/'reports'/'app-before-botplayer-import-fix.ts'
if backup.exists(): raise SystemExit('BLOCKED: backup already exists; do not reapply')
backup.write_text(src)
app.write_text(src.replace(early+'\n','',1))
print('PATCHED: removed eager BotPlayer import from disposable app.ts ONLY')
print('World.start keeps deferred BotPlayer registration; prior app.ts backed up:',backup)
PY
echo 'Patch source changed only; still requires real runtime verification.'

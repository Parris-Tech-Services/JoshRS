#!/usr/bin/env bash
# Repair World -> BotPlayer -> Player -> World cycle ONLY in disposable Fedora #377.
set -Eeuo pipefail
[[ $# == 1 ]] || { echo "Usage: $0 MANIFEST.json" >&2; exit 2; }
manifest="$1"
installed="$HOME/dev/JoshRS/lostcity377/engine"
verifier="$HOME/dev/JoshRS-source/tools/rs377-companion-contract/src/run-integration.mjs"
[[ -f "$verifier" && -d "$installed/.git" ]] || { echo "BLOCKED: missing source verifier" >&2; exit 1; }
node "$verifier" --verify "$manifest"
[[ -f "$manifest" && ! -L "$manifest" ]] || { echo "BLOCKED: invalid manifest" >&2; exit 1; }
root="$(cd "$(dirname "$manifest")" && pwd -P)"
[[ "$manifest" == "$root/manifest.json" && "$root" == /tmp/joshrs-377-disposable-* ]] || { echo "BLOCKED: unsafe manifest root" >&2; exit 1; }
mapfile -t settings < <(python3 - "$manifest" <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
print(m['worldId'])
for k in ('game','web','login','friends','logger'):print(m['ports'][k])
PY
)
world="${settings[0]}"
parent="$HOME/dev/JoshRS-disposable-worlds"
engine="$parent/$world/engine"
[[ -d "$engine/.git" && ! -L "$parent" && ! -L "$parent/$world" && ! -L "$engine" ]] || { echo "BLOCKED: unsafe disposable engine" >&2; exit 1; }
[[ "$(git -C "$engine" rev-parse HEAD)" == "$(git -C "$installed" rev-parse HEAD)" ]] || { echo "BLOCKED: source fingerprint mismatch" >&2; exit 1; }
[[ -f "$root/ready-for-first-start" &&
 -L "$engine/db.sqlite" && "$(readlink -f "$engine/db.sqlite")" == "$root/db/db.sqlite" &&
 -L "$engine/data/players" && "$(readlink -f "$engine/data/players")" == "$root/saves" ]] || { echo "BLOCKED: isolated SQLite/saves not verified" >&2; exit 1; }
for port in "${settings[@]:1}" 8989; do
 if ss -H -ltn "sport = :$port" | grep -q .; then
  echo "BLOCKED: test port $port still listening; stop ONLY disposable server first" >&2; exit 1
 fi
done
[[ -z "$(git -C "$engine" diff -- src/engine/World.ts)" &&
 -z "$(git -C "$engine" diff --cached -- src/engine/World.ts)" ]] || { echo "BLOCKED: World.ts has uncommitted changes" >&2; exit 1; }
python3 - "$engine" "$root" <<'PY'
from pathlib import Path
import re,sys
engine,root=map(Path,sys.argv[1:])
world=engine/'src/engine/World.ts'
player=engine/'src/engine/entity/Player.ts'
bot=engine/'src/engine/entity/BotPlayer.ts'
for p in (world,player,bot):
 if not p.is_file() or p.is_symlink():raise SystemExit('BLOCKED: missing or symlinked '+str(p))
src=world.read_text()
old="import BotPlayer from '#/engine/entity/BotPlayer.js';"
new="import type BotPlayer from '#/engine/entity/BotPlayer.js';"
if src.count(old)!=1 or src.count(new):
 raise SystemExit('BLOCKED: expected exactly one static BotPlayer import')
if "from '#/engine/World.js'" not in player.read_text():
 raise SystemExit('BLOCKED: Player import topology unexpected')
if "from '#/engine/entity/Player.js'" not in bot.read_text() or 'extends Player' not in bot.read_text():
 raise SystemExit('BLOCKED: BotPlayer inheritance unexpected')
pattern=r'\basync\s+start\s*\([^)]*\)\s*(?::\s*Promise<void>)?\s*\{'
if len(list(re.finditer(pattern,src)))!=1 or src.count('export default new World();')!=1 or 'BotPlayerRuntime' in src:
 raise SystemExit('BLOCKED: unexpected World.start or existing patch')
instances=src.count('instanceof BotPlayer')
created=src.count('new BotPlayer(')
if instances<1 or created!=1:
 raise SystemExit('BLOCKED: unexpected BotPlayer class value uses')
patched=src.replace(old,new).replace('instanceof BotPlayer','instanceof BotPlayerRuntime').replace('new BotPlayer(','new BotPlayerRuntime(')
match=re.search(pattern,patched)
patched=patched[:match.end()]+"\n        BotPlayerRuntime = (await import('#/engine/entity/BotPlayer.js')).default;"+patched[match.end():]
patched=patched.replace('export default new World();',
 'let BotPlayerRuntime: typeof BotPlayer;\n\nexport default new World();')
if patched.count("await import('#/engine/entity/BotPlayer.js')")!=1 or old in patched:
 raise SystemExit('BLOCKED: invalid transformed World.ts')
backup=root/'reports'/'World-before-botplayer-lazy-import.ts'
if backup.exists() or backup.is_symlink():
 raise SystemExit('BLOCKED: backup already exists; refusing repeat patch')
backup.write_text(src)
world.write_text(patched)
print('PATCHED: disposable World.ts lazy-loads BotPlayer in World.start; no restart')
print(f'Converted {instances} instanceof uses, {created} constructor call; backup: {backup}')
PY

#!/usr/bin/env bash
# Offline, no-real-world test of BotPlayer import-cycle repair guardrails.
set -Eeuo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
home="$tmp/fakehome"
orig="$home/dev/JoshRS/lostcity377/engine"
mkdir -p "$orig/src/engine/entity" "$orig/src/engine" "$home/dev/JoshRS-source/tools/rs377-companion-contract/src"
ln -s "$repo/tools/rs377-companion-contract/src/run-integration.mjs" "$home/dev/JoshRS-source/tools/rs377-companion-contract/src/run-integration.mjs"
cat > "$orig/src/app.ts" <<'EOF'
import World from '#/engine/World.js';
import '#/engine/entity/BotPlayer.js';
await World.start();
EOF
cat > "$orig/src/engine/entity/BotPlayer.ts" <<'EOF'
import Player, {registerBotPlayerClass} from '#/engine/entity/Player.js';
class BotPlayer extends Player {}
registerBotPlayerClass(BotPlayer);
EOF
cat > "$orig/src/engine/World.ts" <<'EOF'
async start() { if (!getBotPlayerClass()) await import('#/engine/entity/BotPlayer.js'); }
EOF
cat > "$orig/.gitignore" <<'EOF'
.env
db.sqlite
data/
EOF
git -C "$orig" init -q
git -C "$orig" config user.email test@example.invalid
git -C "$orig" config user.name CI
git -C "$orig" add .
git -C "$orig" commit -qm 'eager-import source fixture'
out="$(HOME="$home" node "$repo/tools/rs377-companion-contract/src/run-integration.mjs" --prepare)"
manifest="$(node -p 'JSON.parse(process.argv[1]).manifest' "$out")"
world="$(node -p 'JSON.parse(process.argv[1]).worldId' "$out")"
root="$(dirname "$manifest")"
dest="$home/dev/JoshRS-disposable-worlds/$world"
mkdir -p "$dest"
git clone -q --no-hardlinks "$orig" "$dest/engine"
mkdir -p "$dest/engine/data"
touch "$root/db/db.sqlite" "$root/ready-for-first-start"
ln -s "$root/db/db.sqlite" "$dest/engine/db.sqlite"
ln -s "$root/saves" "$dest/engine/data/players"
echo '=== Applying guarded fix to isolated fixture ==='
HOME="$home" bash "$repo/tools/rs377-disposable/fix-disposable-botplayer-import.sh" "$manifest"
if grep -q "^import '#/engine/entity/BotPlayer.js';" "$dest/engine/src/app.ts"; then
 echo "FAIL: early import still present" >&2; exit 1
fi
grep -q "await import('#/engine/entity/BotPlayer.js')" "$dest/engine/src/engine/World.ts"
grep -q "import '#/engine/entity/BotPlayer.js';" "$orig/src/app.ts"
test -f "$root/reports/app-before-botplayer-import-fix.ts"
if HOME="$home" bash "$repo/tools/rs377-disposable/fix-disposable-botplayer-import.sh" "$manifest" > "$tmp/blocked.log" 2>&1; then
 echo "FAIL: second application accepted" >&2; exit 1
fi
grep -q "BLOCKED:" "$tmp/blocked.log"
echo 'PASS: only disposable app.ts patched, original intact, duplicate refused'

#!/usr/bin/env bash
# Offline source fixture: reproduce World.ts -> BotPlayer.ts -> Player.ts cycle.
set -Eeuo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
work="$(mktemp -d)"
root=''
trap 'rm -rf "$work" "$root"' EXIT
home="$work/home"
orig="$home/dev/JoshRS/lostcity377/engine"
source="$home/dev/JoshRS-source/tools/rs377-companion-contract/src"
mkdir -p "$orig/src/engine/entity" "$source"
cat > "$source/run-integration.mjs" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';
const [,,mode,file]=process.argv;
const m=JSON.parse(fs.readFileSync(file,'utf8'));
if(mode!=='--verify'||m.schema!==1||m.mode!=='isolated'||m.revision!==377||
 m.worldId!=='isolated-a1b2c3d4e5f6'||m.account!=='HarnessTest'||
 path.dirname(file)!==m.root)process.exit(2);
EOF
printf '%s\n' '.env' 'data/' 'db.sqlite' > "$orig/.gitignore"
cat > "$orig/package.json" <<'EOF'
{"name":"cycle-fixture","type":"module","imports":{"#/*":"./src/*"}}
EOF
cat > "$orig/src/engine/World.ts" <<'EOF'
import Player from '#/engine/entity/Player.js';
import BotPlayer from '#/engine/entity/BotPlayer.js';
class World {
    async start(skipMaps = false, startCycle = true): Promise<void> {
        console.log('Starting world');
    }
    check(p: Player): boolean {
        return p instanceof BotPlayer;
    }
    spawnDevelopmentBots(force: boolean = false): BotPlayer | undefined {
        const instance = new BotPlayer('HarnessTest',0n,0n);
        if (instance instanceof BotPlayer) return instance;
        return undefined;
    }
}
export default new World();
EOF
cat > "$orig/src/engine/entity/Player.ts" <<'EOF'
import World from '#/engine/World.js';
export default class Player {
    constructor(public username: string,public username37: bigint,public hash64: bigint) {}
    readonly world=World;
}
EOF
cat > "$orig/src/engine/entity/BotPlayer.ts" <<'EOF'
import Player from '#/engine/entity/Player.js';
export default class BotPlayer extends Player {}
EOF
git -C "$orig" init -q
git -C "$orig" config user.name CI
git -C "$orig" config user.email test@example.invalid
git -C "$orig" add .
git -C "$orig" commit -qm 'fake cyclic modules'
world="isolated-a1b2c3d4e5f6"
root="$(mktemp -d /tmp/joshrs-377-disposable-XXXXXX)"
manifest="$root/manifest.json"
python3 - "$root" "$world" <<'PY'
import json,sys,pathlib
r=pathlib.Path(sys.argv[1]); world=sys.argv[2]
for d in ('db','saves','reports','cache'):(r/d).mkdir(mode=0o700)
(r/'manifest.json').write_text(json.dumps({
 'schema':1,'mode':'isolated','revision':377,'account':'HarnessTest','worldId':world,
 'root':str(r),'ports':{'game':53402,'web':8988,'login':53500,'friends':55099,'logger':53501}
}))
PY
target="$home/dev/JoshRS-disposable-worlds/$world/engine"
mkdir -p "$(dirname "$target")"
git clone -q --no-hardlinks "$orig" "$target"
mkdir -p "$target/data"
touch "$root/db/db.sqlite" "$root/ready-for-first-start"
ln -s "$root/db/db.sqlite" "$target/db.sqlite"
ln -s "$root/saves" "$target/data/players"
HOME="$home" bash "$repo/tools/rs377-disposable/fix-disposable-world-botplayer-cycle.sh" "$manifest"
grep -q "import type BotPlayer from" "$target/src/engine/World.ts"
grep -q 'instanceof BotPlayerRuntime' "$target/src/engine/World.ts"
grep -q 'new BotPlayerRuntime(' "$target/src/engine/World.ts"
grep -q "import BotPlayer from" "$orig/src/engine/World.ts"
[[ -f "$root/reports/World-before-botplayer-lazy-import.ts" ]]
if HOME="$home" bash "$repo/tools/rs377-disposable/fix-disposable-world-botplayer-cycle.sh" "$manifest" >"$work/repeat.log" 2>&1; then
 echo 'FAIL: second patch should refuse' >&2; exit 1
fi
grep -q 'BLOCKED:' "$work/repeat.log"
if command -v tsc >/dev/null 2>&1; then
 cat > "$target/tsconfig.json" <<'EOF'
{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","baseUrl":".","paths":{"#/*":["src/*"]},"strict":true,"noEmit":true},"include":["src/**/*.ts"]}
EOF
 (cd "$target" && tsc -p tsconfig.json)
 echo 'PASS: TypeScript compiled the lazy class import'
fi
echo 'PASS: only the disposable World.ts changed; installed source unchanged; duplicate refused'

#!/usr/bin/env bash
# A disposable, authentic rev377 engine + full upstream RS-SDK check on Fedora.
# Never interacts with any pre-existing JoshRS engine, saves, family accounts or
# the old rev225 SDK gateway. No sudo, no root, no background daemon.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "$0")/../.." && pwd -P)"
SDK_PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb'
SDK="$HOME/.local/share/joshrs/rs-sdk-$SDK_PIN"
MODE='--check'
if (( $# > 0 )); then MODE="$1"; fi
if [[ "$MODE" != '--check' && "$MODE" != '--run' ]]; then
  echo 'Usage: sandbox-fedora.sh [--check|--run]' >&2; exit 2
fi
(( EUID != 0 )) || { echo 'Never run this on Fedora as root' >&2; exit 2; }
source /etc/os-release
[[ "$ID" == 'fedora' ]] || { echo 'Fedora OS required' >&2; exit 2; }
for tool in python3 git node npm bun; do
  command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 2; }
done
[[ -f "$ROOT/deploy/jparris-windows/upstreams.json" ]] || { echo 'Full JoshRS checkout missing' >&2; exit 2; }
[[ -d "$SDK/.git" ]] || { echo 'Run setup-fedora.sh --install first' >&2; exit 2; }
[[ "$(git -C "$SDK" rev-parse HEAD)" == "$SDK_PIN" ]] || { echo 'SDK pin mismatch' >&2; exit 2; }
[[ -z "$(git -C "$SDK" status --porcelain --untracked-files=no)" ]] || { echo 'SDK source not clean' >&2; exit 2; }
if [[ "$MODE" == '--check' ]]; then
  echo 'SOURCE_PREFLIGHT_PASSED, 0 game accounts touched'
  echo "Next: bash '$ROOT/tools/rs377-fedora-quests/sandbox-fedora.sh' --run"
  exit 0
fi
[[ "${JOSHRS_QUEST_CAMPAIGN_APPROVED:-}" == 'DISPOSABLE_ONLY' ]] || {
  echo 'Set JOSHRS_QUEST_CAMPAIGN_APPROVED=DISPOSABLE_ONLY first (new isolated world only)' >&2
  exit 2
}
# 15402 is an intentionally separate native game port, NOT household 52402.
# Refuse any other process on our 3 disposable ports.
python3 - <<'PY'
import socket
for port in (15402,18880,18881,18882,18883):
    s=socket.socket()
    try:
        if s.connect_ex(('127.0.0.1',port)) == 0:
            raise SystemExit('Refusing in-use isolated port '+str(port))
    finally:
        s.close()
PY
BASE="$HOME/.cache/joshrs-disposable-quests"
mkdir -p -- "$BASE"
chmod 700 "$BASE"
WORK="$(mktemp -d "$BASE/377-run-XXXXXXXX")"
chmod 700 "$WORK"
echo "Disposable world directory: $WORK"
# No trap to delete the temporary evidence; it remains under the private
# directory for diagnosing real failures, never copied into public GitHub.
python3 "$ROOT/content-factory/native377.py" --output "$WORK/native377"
python3 - "$ROOT/deploy/jparris-windows/upstreams.json" "$WORK" <<'PY'
import json,sys,subprocess
from pathlib import Path
manifest=json.loads(Path(sys.argv[1]).read_text())
root=Path(sys.argv[2])
for key in ('engine','content'):
    item=manifest[key]
    folder=root/key
    subprocess.run(['git','clone','--depth','1','--single-branch',
                    '--branch',item['branch'],item['url'],str(folder)],check=True)
    actual=subprocess.check_output(['git','-C',str(folder),'rev-parse','HEAD'],text=True).strip()
    if actual!=item['commit']:
        subprocess.run(['git','-C',str(folder),'fetch','--depth','1','origin',item['commit']],check=True)
        subprocess.run(['git','-C',str(folder),'checkout','--detach',item['commit']],check=True)
    if subprocess.check_output(['git','-C',str(folder),'rev-parse','HEAD'],text=True).strip()!=item['commit']:
        raise SystemExit('Immutable '+key+' revision mismatch')
    print(key+' pinned and isolated')
PY
python3 "$ROOT/content-factory/patch_377_haunted.py" --content "$WORK/content"
python3 "$ROOT/content-factory/patch_377_haunted.py" --content "$WORK/content" --apply
python3 "$ROOT/content-factory/prepare_377_overlay.py" --source "$WORK/native377" --dest "$WORK/content"
python3 "$ROOT/content-factory/patch_377_npc_crc.py" --engine "$WORK/engine"
cp -- "$ROOT/tools/rs377-bot-bench/engine-patch/src/web.ts" "$WORK/engine/src/web.ts"
python3 "$ROOT/content-factory/patch_377_sdk_trace.py" --engine "$WORK/engine" --fedora-disposable
(
 cd "$WORK/engine"
 npm ci --no-audit --no-fund
 BUILD_SRC_DIR="$WORK/content" BUILD_VERIFY=true BUILD_VERIFY_PACK=true JOSHRS_CUSTOM_NPCS=true npm run build
 [[ -s data/pack/server/script.dat && -s data/pack/server/script.idx ]] || exit 1
 DB_BACKEND=sqlite npm run sqlite:migrate
)
# SDK gateway uses local ws package from JoshRS test harness. It is distinct
# from the game's normal TCP/Web endpoints and is never publicly exposed.
npm --prefix "$ROOT/tools/rs377-chatgpt-bridge" install --omit=dev --ignore-scripts --no-audit --no-fund --no-package-lock
(
 cd "$ROOT"
 RS377_OBSERVER_PROBE=true RS377_LIVE_BOT_PROBE=true \
 RS377_PINNED_UPSTREAM="$SDK" \
 DB_BACKEND=sqlite EASY_STARTUP=true LOGIN_SERVER=true FRIEND_SERVER=true \
 LOGGER_SERVER=true NODE_PROFILE=joshrs_ci_377 NODE_PORT=15402 WEB_PORT=18880 \
 WEB_MANAGEMENT_PORT=18881 BUILD_SRC_DIR="$WORK/content" \
 python3 content-factory/smoke_377.py --engine "$WORK/engine" \
  --game-port 15402 --web-port 18880 --timeout 120
)
echo 'DISPOSABLE_NATIVE_377_CAMPAIGN_SMOKE_FINISHED; see logs for genuine SDK proof.'
echo 'No family account/save or port 52402 was used.'

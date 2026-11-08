#!/usr/bin/env bash
# Install a BRAND-NEW, private, phone-local JoshRS 377 engine inside Termux Debian.
# This never reads/writes the JParris Desktop world, account DB, or save files.
# One-time Internet connection needed to fetch pinned sources and npm packages.
# Requires a Termux proot Debian shell with Git, Python 3, npm and Node 24.
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
overlay="$repo/content-patches/rs377"
target="${JOSHRS_PHONE_HOME:-$HOME/joshrs377-phone}"
fail() { echo "BLOCKED: $*" >&2; exit 2; }

[[ -d "$overlay/patches" && -d "$overlay/scripts/quests" ]] || fail "run this from a complete JoshRS repository checkout"
for cmd in git python3 node npm sha256sum; do command -v "$cmd" >/dev/null || fail "$cmd is required"; done
[[ "$(node --version)" == v24.* ]] || fail "Node.js 24 required for pinned engine; found $(node --version)"
[[ "$target" = /* ]] || fail "installation target must be an absolute path"
[[ ! -e "$target" && ! -L "$target" ]] || fail "target already exists: $target (never overwrite saves)"
parent="$(dirname "$target")"
[[ -d "$parent" ]] || fail "parent directory does not exist: $parent"
[[ -w "$parent" ]] || fail "cannot write parent directory"
tmp="$(mktemp -d "$parent/.joshrs377-install.XXXXXXXX")"
finished=false
cleanup() {
  if [[ "$finished" != true ]]; then
    echo "Installation failed. Removing new temporary tree; no existing world was touched." >&2
    rm -rf -- "$tmp"
  fi
}
trap cleanup EXIT

engine="$tmp/engine"
content="$tmp/content"
echo "Cloning pinned 377 sources into a NEW temporary tree..."
git clone --depth 1 --branch 377-wip https://github.com/LostCityRS/Engine-TS.git "$engine"
git clone --depth 1 --branch 377-wip https://github.com/LostCityRS/Content.git "$content"
pin_repo() {
  local dir="$1" pin="$2"
  if [[ "$(git -C "$dir" rev-parse HEAD)" != "$pin" ]]; then
    git -C "$dir" fetch --depth 1 origin "$pin"
    git -C "$dir" checkout --detach "$pin"
  fi
  [[ "$(git -C "$dir" rev-parse HEAD)" == "$pin" ]] || fail "pinned source mismatch: $dir"
}
pin_repo "$engine" b5ac859b47915afb545e60e4c1208f25d43cb3fb
pin_repo "$content" 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50

# The upstream engine opens six TCP/HTTP/WS listeners on all network adapters.
# Phone-local use must close that exposure BEFORE any server is started.
python3 -I "$repo/tools/android377-phone/loopback_bind.py" "$engine"

shopt -s nullglob
patches=("$overlay"/patches/[0-9][0-9][0-9][0-9]-*.patch)
shopt -u nullglob
[[ "${#patches[@]}" -eq 28 ]] || fail "expected 28 reviewed revision-377 patches, found ${#patches[@]}"
for ((i = 0; i < 28; i++)); do
  n="$(printf %04d "$((i+1))")"
  [[ "$(basename "${patches[i]}")" == "$n-"* ]] || fail "patch order mismatch $n"
  git -C "$content" apply --check "${patches[i]}"
  git -C "$content" apply "${patches[i]}"
done

quests=(quest_fenkenstrain quest_rag quest_soulbane quest_swansong quest_myreque
  quest_ics quest_mdaughter quest_hauntedmine quest_losttribe quest_makinghistory
  quest_handsand quest_feud quest_elid quest_osf quest_dwarfrock quest_tog
  quest_zogre quest_giantdwarf quest_forget quest_garden quest_twocats
  quest_wanted quest_deal quest_agrith)
for q in "${quests[@]}"; do
  dest="$content/scripts/quests/$q"
  [[ -d "$overlay/scripts/quests/$q" && ! -e "$dest" ]] || fail "missing/conflicting quest $q"
  cp -R "$overlay/scripts/quests/$q" "$dest"
done

extras=(
  scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2
  scripts/quests/quest_mortton/configs/quest_mortton.varp
  scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2
  scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2
  scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2
)
for rel in "${extras[@]}"; do
  [[ -f "$overlay/$rel" && ! -e "$content/$rel" ]] || fail "missing/conflicting file: $rel"
  mkdir -p "$(dirname "$content/$rel")"
  cp "$overlay/$rel" "$content/$rel"
done

echo "Validating all real quest sources against pinned engine..."
FENK_CONTENT="$content" FENK_QUEST_DIR="$content/scripts/quests/quest_fenkenstrain" python3 -I "$overlay/tools/check_fenk_symbols.py"
for checker in check_fenk_map.py check_morytania_batch.py check_swansong_wall_map.py check_rag_npc_drops.py check_cooks_range.py; do
  python3 -I "$overlay/tools/$checker" --content "$content"
done

cat > "$engine/.env" <<'ENV'
EASY_STARTUP=true
NODE_PROFILE=joshrs_phone_377
NODE_PORT=52402
WEB_PORT=8888
WEB_MANAGEMENT_PORT=8898
NODE_ID=10
NODE_MEMBERS=true
DB_BACKEND=sqlite
LOGIN_SERVER=true
FRIEND_SERVER=true
LOGGER_SERVER=true
WEBSITE_REGISTRATION=true
BUILD_SRC_DIR=../content
NODE_DEBUG_SOCKET=false
NODE_XPRATE=1
ENV

echo "Installing native Node dependencies and compiling original 377 scripts..."
(
  cd "$engine"
  npm ci --no-audit --no-fund
  BUILD_SRC_DIR="$content" BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build
  test -s data/pack/server/script.dat
  test -s data/pack/server/script.idx
  npm run sqlite:migrate
)

# Final, fail-closed bind audit before any live engine launch.
python3 -I "$repo/tools/android377-phone/loopback_bind.py" "$engine" --verify

cat > "$tmp/start-local.sh" <<'START'
#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/engine"
test -s data/pack/server/script.dat
test -s data/pack/server/script.idx
echo 'Starting REAL 377 world on 127.0.0.1; use Ctrl+C to stop.'
echo 'A native compatible Android gameplay client is still required.'
exec npm run quickstart
START
chmod 700 "$tmp/start-local.sh"
mv -- "$tmp" "$target"
finished=true
echo "INSTALLED_ENGINE_ONLY: $target"
echo "Start it with: bash '$target/start-local.sh'"
echo "This proves the engine was compiled locally; Android login/3D gameplay is NOT yet verified."

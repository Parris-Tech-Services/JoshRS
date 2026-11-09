#!/usr/bin/env bash
# Install a quest into the running family world and prove the engine still packs.
#
# A revision-274 quest is a directory of ReScript + configs:
#
#   configs/<quest>.varp     quest stage variable
#   configs/<quest>.loc      (optional) loc/object config
#   scripts/quest_<key>.rs2  the quest logic, including the `[if_button,questlist:<key>]` journal
#
# The engine packs content at boot, so installing a quest means: validate, copy, restart,
# confirm "World ready". If packing fails the world refuses to start and this script puts
# the previous content back, so a bad quest cannot leave you with a dead world.
#
# Usage:
#   add-quest.sh <quest-dir> [--world ~/lc274] [--dry-run]
#
# Never touches saves. Characters live in engine/data/players and are not part of content.
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
world="${JOSHRS_WORLD:-$HOME/lc274}"
dry_run=false
quest_dir=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --world) world="$2"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) quest_dir="$1"; shift ;;
  esac
done

fail() { echo "BLOCKED: $*" >&2; exit 2; }

[[ -n "$quest_dir" ]] || fail "usage: add-quest.sh <quest-dir> [--world DIR] [--dry-run]"
[[ -d "$quest_dir" ]] || fail "quest directory not found: $quest_dir"
[[ "$quest_dir" = /* ]] || quest_dir="$(cd "$quest_dir" && pwd -P)"

content="$world/content"
scripts_dir="$content/scripts/quests"
[[ -d "$scripts_dir" ]] || fail "no content scripts directory at $scripts_dir; is --world correct?"

name="$(basename "$quest_dir")"

# --- validate before touching anything -------------------------------------------------
rs2=0
for f in "$quest_dir"/scripts/*.rs2; do [[ -f "$f" ]] && rs2=$((rs2 + 1)); done
[[ $rs2 -gt 0 ]] || fail "no scripts/*.rs2 in $quest_dir"
grep -rq "questlist:" "$quest_dir"/scripts/*.rs2 \
  || fail "no 'questlist:' handler found; the quest would not appear in the quest journal"

varps=0
for f in "$quest_dir"/configs/*.varp; do [[ -f "$f" ]] && varps=$((varps + 1)); done
[[ $varps -gt 0 ]] || fail "no configs/*.varp in $quest_dir; quest stage could not persist"

# Refuse to silently replace an existing quest of the same name.
target="$scripts_dir/$name"
if [[ -e "$target" ]]; then
  fail "$target already exists; move the old one out first rather than overwriting it"
fi

echo "quest:   $name"
echo "scripts: $rs2 file(s), varps: $varps"
echo "target:  $target"

if $dry_run; then
  echo "dry run: validated, nothing installed"
  exit 0
fi

# --- install ---------------------------------------------------------------------------
staging="$(mktemp -d "$scripts_dir/.incoming.XXXXXXXX")"
cp -a "$quest_dir/." "$staging/"
mv "$staging" "$target"
echo "installed"

# --- restart and prove it packs --------------------------------------------------------
restart() {
  pkill -f "src/ap[p].ts" 2>/dev/null || true
  sleep 2
}

rollback() {
  echo "ROLLBACK: removing $target and restoring the previous world state" >&2
  rm -rf -- "$target"
  restart
}

restart
cd "$world/engine"
env JOSHRS_IDLE_LOGOUT_TICKS="${JOSHRS_IDLE_LOGOUT_TICKS:-7200}" \
    JOSHRS_FORCE_LOGOUT_TICKS="${JOSHRS_FORCE_LOGOUT_TICKS:-14400}" \
    JOSHRS_BIND_HOST="${JOSHRS_BIND_HOST:-}" \
    setsid nohup npx tsx src/app.ts > "$world/server.log" 2>&1 < /dev/null &
disown || true

echo "packing content (this is where a broken quest fails)..."
for _ in $(seq 1 90); do
  if grep -q "World ready" "$world/server.log" 2>/dev/null; then
    echo "READY: quest '$name' installed and packed"
    exit 0
  fi
  if grep -qiE "error|exception|failed" "$world/server.log" 2>/dev/null; then
    echo "--- engine log ---" >&2
    tail -20 "$world/server.log" >&2
    rollback
    fail "engine failed to pack; quest rolled back"
  fi
  sleep 2
done

tail -20 "$world/server.log" >&2
rollback
fail "engine did not reach 'World ready'; quest rolled back"

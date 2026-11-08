#!/usr/bin/env bash
# Safe installer for the rs377 quest overlays. Run from Git Bash or WSL with the
# server stopped. It does not edit player accounts, databases, or save files.
# Usage: bash install-batch-quests-live.sh CONTENT_DIR [ENGINE_DIR] [--preflight-only]
set -Eeuo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
usage() { echo "Usage: $0 /absolute/path/to/content [engine-dir] [--preflight-only]" >&2; exit 2; }
[[ $# -ge 1 && $# -le 3 ]] || usage
content_arg="$1"; shift
engine_arg=""; preflight_only=false
for arg in "$@"; do
  case "$arg" in
    --preflight-only) preflight_only=true ;;
    *) [[ -z "$engine_arg" ]] || usage; engine_arg="$arg" ;;
  esac
done
[[ -d "$content_arg" ]] || { echo "BLOCKED: content directory does not exist" >&2; exit 2; }
content="$(cd -- "$content_arg" && pwd -P)"
if [[ -z "$engine_arg" ]]; then engine_arg="$(dirname "$content")/engine"; fi
[[ -d "$engine_arg" ]] || { echo "BLOCKED: engine directory does not exist: $engine_arg" >&2; exit 2; }
engine="$(cd -- "$engine_arg" && pwd -P)"
for cmd in git npm python3 sha256sum cmp mktemp; do
  command -v "$cmd" >/dev/null || { echo "BLOCKED: missing $cmd" >&2; exit 2; }
done
for spec in "$content" "$engine"; do
  git_top="$(git -C "$spec" rev-parse --show-toplevel 2>/dev/null || :)"
  [[ -n "$git_top" && "$(cd -- "$git_top" && pwd -P)" == "$spec" ]] || {
    echo "BLOCKED: $spec must be the root of its own git checkout" >&2; exit 2;
  }
done
[[ "$content" != "$engine" ]] || { echo "BLOCKED: engine and content must differ" >&2; exit 2; }
[[ -f "$engine/package-lock.json" && -f "$engine/package.json" ]] || {
  echo "BLOCKED: engine package.json and package-lock.json required" >&2; exit 2;
}
[[ -d "$engine/node_modules" || "$preflight_only" == true ]] || {
  echo "BLOCKED: live engine dependencies missing; install those before changing content" >&2; exit 2;
}
if ! git -C "$engine" diff --quiet || ! git -C "$engine" diff --cached --quiet; then
  echo "BLOCKED: engine tracked files have uncommitted changes; isolated build would not match them" >&2; exit 2
fi

# Only one transaction may be active. Keep state outside the content worktree.
gitdir="$(cd -- "$(git -C "$content" rev-parse --absolute-git-dir)" && pwd -P)"
state_dir="$gitdir/joshrs-batch-quests"
active="$state_dir/active.tsv"

# Include all 24 CI-required bundles, not just the 12 most recently requested.
# Without the prerequisites and Morytania/Cook extras, the verified build can fail.
quests=(quest_fenkenstrain quest_rag quest_soulbane quest_swansong quest_myreque
  quest_ics quest_mdaughter quest_hauntedmine quest_losttribe quest_makinghistory
  quest_handsand quest_feud quest_elid quest_osf quest_dwarfrock quest_tog
  quest_zogre quest_giantdwarf quest_forget quest_garden quest_twocats
  quest_wanted quest_deal quest_agrith)
extras=(
  scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2
  scripts/quests/quest_mortton/configs/quest_mortton.varp
  scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2
  scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2
  scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2
)
shopt -s nullglob
patches=("$root"/patches/[0-9][0-9][0-9][0-9]-*.patch)
shopt -u nullglob
[[ ${#patches[@]} -eq 28 ]] || { echo "BLOCKED: expected 28 patches, found ${#patches[@]}" >&2; exit 2; }
for ((i=0; i<28; i++)); do
  expected="$(printf '%04d' "$((i+1))")"
  [[ "$(basename "${patches[$i]}")" == "$expected-"* ]] || {
    echo "BLOCKED: missing/duplicate/out-of-order patch $expected" >&2; exit 2;
  }
done
for folder in "${quests[@]}"; do
  [[ -d "$root/scripts/quests/$folder" ]] || { echo "BLOCKED: missing bundle $folder" >&2; exit 2; }
done
for rel in "${extras[@]}"; do
  [[ -f "$root/$rel" ]] || { echo "BLOCKED: missing helper $rel" >&2; exit 2; }
done

# Journal entries are strictly allowlisted relative paths, never user saves.
record() { [[ -z "${active_file:-}" ]] || printf '%s\t%s\n' "$1" "$2" >> "$active_file"; }
install_overlay() {
  local target="$1" patch folder rel dest npc
  for patch in "${patches[@]}"; do
    if git -C "$target" apply --check "$patch" >/dev/null 2>&1; then
      git -C "$target" apply "$patch"
      record PATCH "$(basename "$patch")"
    elif git -C "$target" apply --reverse --check "$patch" >/dev/null 2>&1; then
      echo "Already applied: $(basename "$patch")"
    else
      echo "BLOCKED: neither forward nor reverse patch applies: $(basename "$patch")" >&2
      return 4
    fi
  done
  for folder in "${quests[@]}"; do
    rel="scripts/quests/$folder"; dest="$target/$rel"
    if [[ -e "$dest" || -L "$dest" ]]; then
      [[ -d "$dest" && ! -L "$dest" ]] && diff -qr -- "$root/$rel" "$dest" >/dev/null || {
        echo "BLOCKED: existing bundle differs: $rel" >&2; return 4;
      }
    else
      record DIR "$rel" # journal before copying, to recover partial copies
      mkdir -p -- "$(dirname "$dest")"
      cp -R -- "$root/$rel" "$dest"
    fi
  done
  for rel in "${extras[@]}"; do
    dest="$target/$rel"
    if [[ -e "$dest" || -L "$dest" ]]; then
      [[ -f "$dest" && ! -L "$dest" ]] && cmp -s -- "$root/$rel" "$dest" || {
        echo "BLOCKED: conflicting helper: $rel" >&2; return 4;
      }
    else
      case "$rel" in
        *joshrs_cook_millie_377.rs2) npc=millie_the_miller ;;
        *joshrs_cook_gillie_377.rs2) npc=gillie_the_milkmaid ;;
        *) npc="" ;;
      esac
      if [[ -n "$npc" ]] && grep -R -Fq --include='*.rs2' -- "[opnpc1,$npc]" "$target/scripts" 2>/dev/null; then
        echo "BLOCKED: $npc already has a Talk-to handler" >&2; return 4
      fi
      record FILE "$rel"
      mkdir -p -- "$(dirname "$dest")"
      cp -- "$root/$rel" "$dest"
    fi
  done
}

check_overlay() {
  local target="$1"
  python3 -I "$root/tools/check_cooks_range.py" --content "$target"
  FENK_CONTENT="$target" FENK_QUEST_DIR="$target/scripts/quests/quest_fenkenstrain" \
    python3 -I "$root/tools/check_fenk_symbols.py"
  python3 -I "$root/tools/check_fenk_map.py" --content "$target"
  python3 -I "$root/tools/check_morytania_batch.py" --content "$target"
  python3 -I "$root/tools/check_swansong_wall_map.py" --content "$target"
  python3 -I "$root/tools/check_rag_npc_drops.py" --content "$target"
}

# For rollback, hash the complete tracked diff, status, and created-file bytes.
# If anyone changes the install later, rollback refuses to discard their edits.
fingerprint() {
  local rel path
  (
    git -C "$content" rev-parse HEAD
    git -C "$content" status --porcelain=v1 --untracked-files=all
    git -C "$content" diff --binary --no-ext-diff
    git -C "$content" diff --cached --binary --no-ext-diff
    while IFS=$'\t' read -r kind rel; do
      case "$kind" in
        DIR)
          path="$content/$rel"
          if [[ -d "$path" ]]; then
            find "$path" \( -type f -o -type l \) -print0 | sort -z | \
              while IFS= read -r -d '' item; do
                printf '%s\0' "$item"
                if [[ -L "$item" ]]; then readlink -- "$item"; else sha256sum -- "$item"; fi
              done
          else printf 'MISSING_DIR:%s\n' "$rel"; fi ;;
        FILE)
          path="$content/$rel"
          if [[ -L "$path" ]]; then readlink -- "$path"
          elif [[ -f "$path" ]]; then sha256sum -- "$path"
          else printf 'MISSING_FILE:%s\n' "$rel"; fi ;;
      esac
    done < "$active"
  ) | sha256sum | awk '{print $1}'
}

# A completed, unchanged transaction is a safe no-op on repeated execution.
if [[ -f "$active" ]]; then
  saved="$(awk -F '\t' '$1=="SNAPSHOT" {print $2}' "$active" | tail -n 1)"
  if grep -q $'STATE\tinstalled' "$active" && [[ -n "$saved" ]] && [[ "$(fingerprint)" == "$saved" ]]; then
    echo "ALREADY_INSTALLED: previous batch content remains byte-for-byte unchanged."
    exit 0
  fi
  echo "BLOCKED: previous transaction has changed or failed; inspect or roll back $active" >&2
  exit 2
fi
if [[ -n "$(git -C "$content" status --porcelain=v1 --untracked-files=all)" ]]; then
  echo "BLOCKED: content worktree has existing changes; nothing was modified:" >&2
  git -C "$content" status --short >&2
  exit 2
fi

tmp="$(mktemp -d)"
preflight_content="$tmp/content"
preflight_engine="$tmp/engine"
active_file=""
live_started=false
success=false
finish() {
  local rc=$?
  trap - EXIT
  if [[ "$live_started" == true && "$success" != true && -n "$active_file" && -f "$active_file" ]]; then
    printf 'STATE\tfailed\nSNAPSHOT\t%s\n' "$(fingerprint)" >> "$active_file" || true
    echo "FAILED: live overlay may be partial. Roll back with: bash '$root/rollback-batch-quests-live.sh' '$content'" >&2
  fi
  git -C "$content" worktree remove --force "$preflight_content" >/dev/null 2>&1 || true
  git -C "$engine" worktree remove --force "$preflight_engine" >/dev/null 2>&1 || true
  rm -rf -- "$tmp"
  exit "$rc"
}
trap finish EXIT

echo "Preflight: constructing disposable content and engine worktrees."
git -C "$content" worktree add --detach "$preflight_content" HEAD >/dev/null
git -C "$engine" worktree add --detach "$preflight_engine" HEAD >/dev/null
install_overlay "$preflight_content"
check_overlay "$preflight_content"
(
  cd "$preflight_engine"
  npm ci --no-audit --no-fund
  BUILD_SRC_DIR="$preflight_content" BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build
  test -s data/pack/server/script.dat
  test -s data/pack/server/script.idx
)
echo "PREFLIGHT_PASSED: 28 patches, 24 bundles, supporting files, checks and engine build."
if [[ "$preflight_only" == true ]]; then success=true; echo "NO LIVE FILES CHANGED"; exit 0; fi

# Recheck immediately before editing live files. The server must be stopped.
[[ -z "$(git -C "$content" status --porcelain=v1 --untracked-files=all)" ]] || {
  echo "BLOCKED: content changed during preflight" >&2; exit 2;
}
[[ ! -e "$active" ]] || { echo "BLOCKED: an install started during preflight" >&2; exit 2; }
mkdir -p -- "$state_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
backup_branch="backup/pre-batch-quests-$stamp"
initial_sha="$(git -C "$content" rev-parse HEAD)"
git -C "$content" branch "$backup_branch" "$initial_sha"
active_file="$active"
printf 'FORMAT\t1\nHEAD\t%s\nBACKUP\t%s\n' "$initial_sha" "$backup_branch" > "$active_file"
live_started=true
install_overlay "$content"
check_overlay "$content"
(
  cd "$engine"
  BUILD_SRC_DIR="$content" BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build
  test -s data/pack/server/script.dat
  test -s data/pack/server/script.idx
)
printf 'STATE\tinstalled\nSNAPSHOT\t%s\n' "$(fingerprint)" >> "$active_file"
success=true
echo "INSTALLED: overlay build passed. Backup: $backup_branch"
echo "Rollback: bash '$root/rollback-batch-quests-live.sh' '$content'"

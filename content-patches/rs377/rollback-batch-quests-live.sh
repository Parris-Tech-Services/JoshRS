#!/usr/bin/env bash
# Revert only a recorded install, never player saves/accounts or unrelated edits.
# Usage: bash rollback-batch-quests-live.sh CONTENT_DIR
set -Eeuo pipefail
[[ $# -eq 1 && -d "$1" ]] || { echo "Usage: $0 /absolute/path/to/content" >&2; exit 2; }
content="$(cd -- "$1" && pwd -P)"
git_top="$(git -C "$content" rev-parse --show-toplevel 2>/dev/null || :)"
[[ -n "$git_top" && "$(cd -- "$git_top" && pwd -P)" == "$content" ]] || {
  echo "BLOCKED: content must be a git checkout root" >&2; exit 2
}
gitdir="$(cd -- "$(git -C "$content" rev-parse --absolute-git-dir)" && pwd -P)"
active="$gitdir/joshrs-batch-quests/active.tsv"
[[ -f "$active" ]] || { echo "BLOCKED: no active batch installer manifest" >&2; exit 2; }
read_field() { awk -F '\t' -v k="$1" '$1==k {print $2}' "$active" | tail -n 1; }
[[ "$(read_field FORMAT)" == 1 ]] || { echo "BLOCKED: unknown manifest format" >&2; exit 2; }
head_sha="$(read_field HEAD)"
backup_branch="$(read_field BACKUP)"
expected="$(read_field SNAPSHOT)"
[[ "$head_sha" =~ ^[[:xdigit:]]{40}$ ]] || { echo "BLOCKED: corrupt recorded SHA" >&2; exit 2; }
[[ "$backup_branch" == backup/pre-batch-quests-* ]] || { echo "BLOCKED: corrupt backup branch" >&2; exit 2; }
[[ "$expected" =~ ^[[:xdigit:]]{64}$ ]] || { echo "BLOCKED: incomplete install; snapshot missing" >&2; exit 2; }
[[ "$(git -C "$content" rev-parse HEAD)" == "$head_sha" ]] || {
  echo "BLOCKED: content HEAD changed since install" >&2; exit 2;
}
[[ "$(git -C "$content" rev-parse "$backup_branch" 2>/dev/null)" == "$head_sha" ]] || {
  echo "BLOCKED: backup branch missing or moved" >&2; exit 2;
}
created_dirs=(); created_files=()
while IFS=$'\t' read -r kind rel; do
  case "$kind" in
    DIR)
      [[ "$rel" =~ ^scripts/quests/quest_[a-z0-9_]+$ ]] || { echo "BLOCKED: invalid directory in journal" >&2; exit 2; }
      created_dirs+=("$rel") ;;
    FILE)
      case "$rel" in
        scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2|\
        scripts/quests/quest_mortton/configs/quest_mortton.varp|\
        scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2|\
        scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2|\
        scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2) : ;;
        *) echo "BLOCKED: invalid file in journal: $rel" >&2; exit 2 ;;
      esac
      created_files+=("$rel") ;;
  esac
done < "$active"
fingerprint() {
  local rel path
  (
    git -C "$content" rev-parse HEAD
    git -C "$content" status --porcelain=v1 --untracked-files=all
    git -C "$content" diff --binary --no-ext-diff
    git -C "$content" diff --cached --binary --no-ext-diff
    for rel in "${created_dirs[@]}"; do
      path="$content/$rel"
      if [[ -d "$path" ]]; then
        find "$path" \( -type f -o -type l \) -print0 | sort -z | \
          while IFS= read -r -d '' item; do
            printf '%s\0' "$item"
            if [[ -L "$item" ]]; then readlink -- "$item"; else sha256sum -- "$item"; fi
          done
      else printf 'MISSING_DIR:%s\n' "$rel"; fi
    done
    for rel in "${created_files[@]}"; do
      path="$content/$rel"
      if [[ -L "$path" ]]; then readlink -- "$path"
      elif [[ -f "$path" ]]; then sha256sum -- "$path"
      else printf 'MISSING_FILE:%s\n' "$rel"; fi
    done
  ) | sha256sum | awk '{print $1}'
}
[[ "$(fingerprint)" == "$expected" ]] || {
  echo "BLOCKED: content has changed since installation; refusing destructive rollback." >&2
  echo "Preserve your edits and inspect the journal: $active" >&2
  exit 3
}
# Only restores tracked files from the pinned backup commit; no HEAD reset.
git -C "$content" restore --source="$backup_branch" --worktree -- .
for rel in "${created_dirs[@]}"; do rm -rf -- "$content/$rel"; done
for rel in "${created_files[@]}"; do rm -f -- "$content/$rel"; done
[[ -z "$(git -C "$content" status --porcelain=v1 --untracked-files=all)" ]] || {
  echo "PARTIAL ROLLBACK: unexpected remaining content changes. Manifest preserved: $active" >&2; exit 4
}
archive="$gitdir/joshrs-batch-quests/rolledback-$(date -u +%Y%m%dT%H%M%SZ)-$$.tsv"
mv -- "$active" "$archive"
echo "CONTENT_ROLLED_BACK: original tracked content restored; journal-created paths removed."
# Build outputs belong to the separate engine repository. Recompile so the server
# does not keep running the quest scripts that were just removed from content.
engine="$(dirname "$content")/engine"
if [[ ! -f "$engine/package.json" || ! -d "$engine/node_modules" ]]; then
  echo "PARTIAL ROLLBACK: content restored, but engine dependencies unavailable. Rebuild the engine before starting the server." >&2
  exit 5
fi
if ! ( cd "$engine" && BUILD_SRC_DIR="$content" BUILD_VERIFY=true BUILD_VERIFY_PACK=true npm run build && test -s data/pack/server/script.dat && test -s data/pack/server/script.idx ); then
  echo "PARTIAL ROLLBACK: content restored, but engine rebuild failed. Do not restart the server until rebuilt." >&2
  exit 5
fi
echo "ROLLED_BACK: content and compiled engine pack restored through rebuild."
echo "Player saves, databases and accounts were not touched. Journal archived: $archive"

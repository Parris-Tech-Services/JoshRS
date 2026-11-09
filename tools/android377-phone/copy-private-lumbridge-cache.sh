#!/usr/bin/env bash
# Safely copy ONLY local private rev377 cache, NEVER account/player saves/uid.
# Dry-run by default; one USB phone required for --copy.
set -euo pipefail
mode="${1:---check}"
[[ "$mode" == "--check" || "$mode" == "--copy" ]] || { echo "Usage: bash $0 [--check|--copy]" >&2; exit 2; }
source_dir=""
for candidate in "${JOSHRS_377_CACHE_DIR:-}" /tmp/.file_store_32 \
    "$HOME/.file_store_32" "$HOME/dev/JoshRS/lostcity377/.file_store_32"; do
  [[ -n "$candidate" && -d "$candidate" ]] || continue
  if [[ -s "$candidate/main_file_cache.dat" &&
        -s "$candidate/main_file_cache.idx0" &&
        -s "$candidate/main_file_cache.idx4" ]]; then
    source_dir="$candidate"
    break
  fi
done
[[ -n "$source_dir" ]] || {
  echo "BLOCKED: no complete cache found; read-only search:" >&2
  echo "find /tmp ~ -name main_file_cache.idx4 -type f 2>/dev/null | head" >&2
  exit 3
}
for name in main_file_cache.dat main_file_cache.idx0 main_file_cache.idx4; do
  [[ -s "$source_dir/$name" && ! -L "$source_dir/$name" ]] || {
    echo "BLOCKED: empty or symlinked $name" >&2; exit 4;
  }
done
echo "PRIVATE_CACHE_READY: $source_dir (dat, idx0, idx4 only)"
if [[ "$mode" == "--check" ]]; then
  echo "READ_ONLY; use --copy for ONE USB-connected Android phone."
  exit 0
fi
command -v adb >/dev/null 2>&1 || { echo "BLOCKED: install Android adb/android-tools" >&2; exit 5; }
mapfile -t devices < <(adb devices -l | awk 'NR>1 && $2=="device" && $0 !~ /emulator-/ {print $1}')
[[ "${#devices[@]}" -eq 1 ]] || { echo "BLOCKED: exactly one authorised USB device required" >&2; exit 6; }
remote="/sdcard/Download/JoshRS377Cache"
adb -s "${devices[0]}" shell mkdir -p "$remote"
for name in main_file_cache.dat main_file_cache.idx0 main_file_cache.idx4; do
  adb -s "${devices[0]}" push "$source_dir/$name" "$remote/$name" >/dev/null
done
echo "PRIVATE_CACHE_COPIED: Android Downloads/JoshRS377Cache (dat, idx0, idx4 only)"
echo "Import all three in the JoshRS Android file picker. No account data modified."

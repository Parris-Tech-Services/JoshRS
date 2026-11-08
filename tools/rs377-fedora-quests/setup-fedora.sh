#!/usr/bin/env bash
# No sudo, no family world, save, client cache or account modification.
# Default --check is read-only. --install uses an independent pinned checkout.
set -Eeuo pipefail
PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb'
DEST="$HOME/.local/share/joshrs/rs-sdk-$PIN"
BASE="$(cd -- "$(dirname -- "$0")/../.." && pwd -P)"
MODE='--check'
if (( $# > 0 )); then MODE="$1"; fi
if [[ "$MODE" != '--check' && "$MODE" != '--install' ]]; then
  echo 'Usage: setup-fedora.sh [--check|--install]' >&2; exit 2
fi
if (( EUID == 0 )); then
  echo 'Use your regular Fedora login, never root.' >&2; exit 2
fi
if [[ ! -f /etc/os-release ]]; then echo 'Linux OS release unavailable' >&2; exit 2; fi
source /etc/os-release
if [[ "$MODE" == '--install' && "$ID" != 'fedora' ]]; then
  echo 'Install target must be Fedora; other Linux may use --check.' >&2; exit 2
fi
for bin in git node bun; do
  if ! command -v "$bin" >/dev/null; then
    echo "Missing $bin; no changes made. Install it first." >&2; exit 2
  fi
done
if [[ ! -f "$BASE/research/rs377/QUEST_QUEUE_2026-11-08.json" ]]; then
  echo 'Full JoshRS source checkout not found; no changes made.' >&2; exit 2
fi
echo "Node $(node --version); Bun $(bun --version)"
if [[ -e "$DEST" || -L "$DEST" ]]; then
  if [[ -L "$DEST" || ! -d "$DEST/.git" ]]; then
    echo 'Existing destination is not an ordinary Git checkout; refusing overwrite.' >&2
    exit 1
  fi
  actual="$(git -C "$DEST" rev-parse HEAD 2>/dev/null || true)"
  if [[ "$actual" != "$PIN" ]]; then
    echo 'Existing SDK checkout is a different revision; leaving untouched.' >&2
    exit 1
  fi
  changes="$(git -C "$DEST" status --porcelain --untracked-files=no)"
  [[ -z "$changes" ]] || { echo 'Pinned SDK has tracked modifications; refusing.' >&2; exit 1; }
  echo "VERIFIED_PINNED_SDK: $PIN"
elif [[ "$MODE" == '--install' ]]; then
  parent="$(dirname "$DEST")"
  mkdir -p -- "$parent"
  chmod 700 "$parent"
  temp="$(mktemp -d "$parent/.rs-sdk-install.XXXXXXXX")"
  cleanup(){ [[ -d "$temp" ]] && rm -rf -- "$temp"; }
  trap cleanup EXIT
  git clone --quiet --no-checkout https://github.com/MaxBittker/rs-sdk.git "$temp/upstream"
  git -C "$temp/upstream" checkout --quiet --detach "$PIN"
  actual="$(git -C "$temp/upstream" rev-parse HEAD)"
  [[ "$actual" == "$PIN" ]] || { echo 'Hash mismatch, aborting.' >&2; exit 1; }
  (cd "$temp/upstream" && bun install --frozen-lockfile --ignore-scripts)
  [[ ! -e "$DEST" && ! -L "$DEST" ]] || { echo 'Destination was concurrently created.' >&2; exit 1; }
  mv -- "$temp/upstream" "$DEST"
  echo "VERIFIED_PINNED_SDK_INSTALLED: $PIN"
else
  echo 'PINNED_SDK_NOT_INSTALLED (read-only check; no changes)'
fi
echo "export RS377_UPSTREAM_SDK_HOME='$DEST'"
echo "bun '$BASE/tools/rs377-fedora-quests/run.ts' --plan"
echo 'Running real quests additionally requires an isolated 377 gateway and disposable character.'

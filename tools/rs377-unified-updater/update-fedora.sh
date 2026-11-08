#!/usr/bin/env bash
# JoshRS rev377 offline-only updater. Never run as root or on an active world.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
if [[ "$(id -u)" == 0 ]]; then echo "BLOCKED: do not run JoshRS updater as root" >&2; exit 2; fi
if ! command -v node >/dev/null || ! command -v git >/dev/null; then
  echo "BLOCKED: Node.js and Git are required" >&2; exit 2
fi
if [[ "${1:-}" == "--help" ]]; then
  node "$ROOT/tools/rs377-unified-updater/updater.mjs" --help
  exit
fi
ARGS=("$@")
# By default this is a read-only check. --apply asks before writes.
APPLY=0
FILTERED=()
for arg in "${ARGS[@]}"; do
  if [[ "$arg" == "--apply" ]]; then APPLY=1
  elif [[ "$arg" != "--confirm-stopped" && "$arg" != "--check" ]]; then FILTERED+=("$arg")
  fi
done
node "$ROOT/tools/rs377-unified-updater/updater.mjs" --check "${FILTERED[@]}"
if [[ "$APPLY" == 0 ]]; then
  echo "READ_ONLY: use --apply once all players have logged out and the server is stopped"
  exit 0
fi
if [[ -r /etc/os-release ]]; then
  source /etc/os-release
  [[ "$ID" == "fedora" ]] || { echo "BLOCKED: this launcher only applies on Fedora" >&2; exit 2; }
else
  echo "BLOCKED: cannot establish Fedora host" >&2; exit 2
fi
[[ -t 0 ]] || { echo "BLOCKED: interactive confirmation required; no unattended apply" >&2; exit 2; }
printf "All players logged out and the JoshRS server stopped? Apply source patches and rebuild? [yes/NO] "
read -r answer
[[ "$answer" == "yes" ]] || { echo "CANCELLED: no changes made"; exit 0; }
node "$ROOT/tools/rs377-unified-updater/updater.mjs" --apply --confirm-stopped "${FILTERED[@]}"
echo "SOURCE BUILD CHECKED; authenticated client gameplay and relog remain unverified"

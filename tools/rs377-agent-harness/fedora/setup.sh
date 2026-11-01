#!/usr/bin/env bash
# Safe Fedora read-only diagnostics and OFFLINE harness tests; optional pinned SDK clone.
set -euo pipefail
PIN="db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb"
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
SDK_DIR="$ROOT/research-checkouts/rs-sdk"
MODE=prepare
FETCH_SDK=0
usage() {
  cat <<'HELP'
Usage: bash tools/rs377-agent-harness/fedora/setup.sh [--doctor|--prepare] [--fetch-sdk]
  --doctor: read-only status, no tests or downloads
  --prepare: offline node harness guards/tests (default)
  --fetch-sdk: additionally fetch pinned RS-SDK to ignored research-checkouts/
No sudo, game process restart, .env changes, save edits, or Jagex asset download.
HELP
}
while (($#)); do
  case "$1" in
    --doctor) MODE=doctor ;;
    --prepare) MODE=prepare ;;
    --fetch-sdk) FETCH_SDK=1 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done
if [[ "$MODE" == "doctor" && "$FETCH_SDK" -eq 1 ]]; then
  echo "BLOCKED: --doctor is read-only; do not combine with --fetch-sdk." >&2
  exit 2
fi
if ! command -v git >/dev/null 2>&1 || [[ "$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || true)" != "$ROOT" ]]; then
  echo "BLOCKED: setup must run inside its own JoshRS Git worktree." >&2
  exit 2
fi
printf 'JoshRS #377 Fedora RS-SDK harness preflight\nRepository: %s\n' "$ROOT"
if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  printf 'OS: %s\n' "${PRETTY_NAME:-unknown}"
fi
printf 'Architecture: %s\n' "$(uname -m)"
for cmd in git node npm bun java agy antigravity ss; do
  if command -v "$cmd" >/dev/null 2>&1; then
    printf 'Available: %s\n' "$cmd"
  else
    printf 'Not on PATH: %s\n' "$cmd"
  fi
done
if command -v node >/dev/null 2>&1; then
  printf 'Node: %s\n' "$(node --version)"
fi
if command -v java >/dev/null 2>&1; then
  java -version 2>&1 | head -n 1 || true
fi
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Worktree: %s\n' "$(git -C "$ROOT" symbolic-ref -q --short HEAD || echo 'detached HEAD')"
  if [[ -n "$(git -C "$ROOT" status --porcelain --untracked-files=no)" ]]; then
    echo 'NOTICE: uncommitted tracked changes exist and were not modified.'
  fi
fi
GAME=""
for c in "$HOME/dev/JoshRS/lostcity377" "$HOME/lostcity377" "$ROOT/lostcity377"; do
  if [[ -d "$c/engine" && -d "$c/client-java" ]]; then GAME="$c"; break; fi
done
if [[ -n "$GAME" ]]; then
  printf 'Existing #377 engine/client found (read-only): %s\n' "$GAME"
  if [[ -f "$GAME/engine/.env" ]]; then echo 'Engine .env exists; contents NOT read.'; fi
  if [[ -f "$GAME/client-java/gradlew" ]]; then echo 'Client Gradle wrapper exists; not run.'; fi
  for name in start-joshrs.sh start-server.sh start-client.sh status-joshrs.sh; do
    if [[ -f "$GAME/$name" ]]; then printf 'Existing game helper: %s\n' "$name"; fi
  done
else
  echo 'Known #377 game folders not found; no clean/replacement game installed.'
fi
if command -v ss >/dev/null 2>&1; then
  for port in 52402 8888 8898 45099 43500 53402 8988; do
    if ss -H -ltn "( sport = :$port )" 2>/dev/null | grep -q .; then
      printf 'TCP %s: listening (NOT proof of healthy game)\n' "$port"
    else
      printf 'TCP %s: no listener observed\n' "$port"
    fi
  done
fi
if [[ "$MODE" == "prepare" ]]; then
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo 'BLOCKED: Node 20+ and npm needed for harness tests.' >&2; exit 2
  fi
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( major < 20 )); then echo 'BLOCKED: Node 20+ required.' >&2; exit 2; fi
  echo 'Running isolated OFFLINE fixture tests (no engine, client or player sessions)...'
  npm run check --prefix "$ROOT/tools/rs377-agent-harness"
  npm run doctor --prefix "$ROOT/tools/rs377-agent-harness"
fi
if (( FETCH_SDK )); then
  if ! command -v git >/dev/null 2>&1; then echo 'BLOCKED: Git required.' >&2; exit 2; fi
  if [[ -e "$SDK_DIR" || -L "$SDK_DIR" ]]; then
    if [[ -L "$SDK_DIR" ]]; then echo "BLOCKED: SDK directory is a symlink." >&2; exit 2; fi
    if ! git -C "$SDK_DIR" rev-parse --git-dir >/dev/null 2>&1; then
      echo "BLOCKED: existing non-Git directory at $SDK_DIR" >&2; exit 2
    fi
    remote="$(git -C "$SDK_DIR" remote get-url origin || true)"
    case "$remote" in
      https://github.com/MaxBittker/rs-sdk|https://github.com/MaxBittker/rs-sdk.git|git@github.com:MaxBittker/rs-sdk.git) ;;
      *) echo 'BLOCKED: unexpected SDK Git remote.' >&2; exit 2 ;;
    esac
    if [[ "$(git -C "$SDK_DIR" rev-parse --show-toplevel 2>/dev/null || true)" != "$SDK_DIR" ]]; then
      echo "BLOCKED: SDK path is not the checkout root." >&2; exit 2
    fi
    if [[ -n "$(git -C "$SDK_DIR" status --porcelain)" ]]; then
      echo 'BLOCKED: SDK checkout dirty; not modifying it.' >&2; exit 2
    fi
  else
    mkdir -p "$ROOT/research-checkouts"
    git clone --filter=blob:none --no-checkout https://github.com/MaxBittker/rs-sdk.git "$SDK_DIR"
  fi
  if ! git -C "$SDK_DIR" cat-file -e "$PIN^{commit}" 2>/dev/null; then
    git -C "$SDK_DIR" fetch origin "$PIN"
  fi
  git -C "$SDK_DIR" checkout --detach "$PIN"
  [[ "$(git -C "$SDK_DIR" rev-parse HEAD)" == "$PIN" ]] || { echo 'BLOCKED: wrong SDK revision' >&2; exit 2; }
  printf 'Pinned RS-SDK available: %s\n' "$SDK_DIR"
  echo 'Do NOT launch RS-SDK own game server or unrestricted MCP on the family host.'
fi
echo 'PASS: preflight finished; no live game restart, account/save, DB, or .env changes.'
echo 'NEXT: Agy reads docs/rs377/AGY_RS_SDK_LLM_HARNESS_2026-11-02.md and builds the real isolated adapter.'

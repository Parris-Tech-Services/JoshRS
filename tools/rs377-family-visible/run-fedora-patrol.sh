#!/usr/bin/env bash
# Safe interactive Fedora launcher: never close the user's terminal on failure.
# Starts one explicitly approved normal HarnessView1 client connection only.
# No game-server restarts, save edits, updates, process kills or duplicate logins.

if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  printf 'ERROR: Run this script with bash; do not source it.\n' >&2
  return 2
fi

find_existing_bot() {
  local proc pid i script_match bot_match
  local -a argv=()
  for proc in /proc/[0-9]*/cmdline; do
    [[ -r "$proc" ]] || continue
    argv=()
    mapfile -d '' -t argv < "$proc" 2>/dev/null || continue
    ((${#argv[@]} > 1)) || continue
    case "${argv[0]##*/}" in node|nodejs) ;; *) continue ;; esac
    script_match=0 bot_match=0
    for ((i=1; i<${#argv[@]}; i++)); do
      case "${argv[i]}" in
        tools/rs377-family-visible/join.mjs|*/tools/rs377-family-visible/join.mjs)
          script_match=1 ;;
      esac
      if [[ "${argv[i]}" == '--bot' && "${argv[i+1]:-}" == 'HarnessView1' ]]; then
        bot_match=1
      fi
    done
    if ((script_match && bot_match)); then
      pid=${proc#/proc/}
      printf '%s\n' "${pid%%/*}"
    fi
  done
}

main() {
  local root port pid current=0
  root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)" || {
    printf 'ERROR: Could not locate JoshRS checkout.\n' >&2
    return 2
  }
  [[ $# -eq 0 || ( $# -eq 1 && "$1" == '--check' ) ]] || {
    printf 'Usage: bash tools/rs377-family-visible/run-fedora-patrol.sh [--check]\n' >&2
    return 2
  }
  cd -- "$root" || return 2
  printf 'JoshRS Fedora pilot preflight in %s\n' "$root"
  for port in 52402 8888; do
    if command -v ss >/dev/null 2>&1 && [[ -n "$(ss -H -ltn "sport = :$port" 2>/dev/null)" ]]; then
      printf 'Port %s: listening\n' "$port"
    else
      printf 'ERROR: Port %s is not confirmed listening; keep the game as it is.\n' "$port" >&2
      current=1
    fi
  done
  [[ -s "$HOME/dev/JoshRS/lostcity377/engine/data/players/main/harnessview1.sav" ]] || {
    printf 'ERROR: HarnessView1 native save missing/empty; no bot started.\n' >&2
    current=1
  }
  if ! command -v node >/dev/null 2>&1; then
    printf 'ERROR: Node.js not found; no bot started.\n' >&2
    current=1
  elif ! node --check tools/rs377-family-visible/join.mjs; then
    printf 'ERROR: Bot launcher syntax check failed; no bot started.\n' >&2
    current=1
  fi
  if [[ ! -f tools/rs377-family-visible/verify-patrol.mjs ]]; then
    printf 'ERROR: Position verifier is missing; no bot started.\n' >&2
    current=1
  fi
  if ((current != 0)); then
    printf 'PREFLIGHT_BLOCKED: Nothing started. Terminal remains open.\n' >&2
    return 1
  fi
  pid="$(find_existing_bot)"
  if [[ -n "$pid" ]]; then
    printf 'BOT_ALREADY_RUNNING: HarnessView1 controller PID(s): %s\n' "${pid//$'\n'/, }"
    printf 'No second login attempted; do not close JoshRS.\n'
    return 0
  fi
  if [[ "${1:-}" == '--check' ]]; then
    printf 'PREFLIGHT_OK: No existing controller. --check made no login.\n'
    return 0
  fi
  printf 'Starting one 120-second HarnessView1 patrol with saved-position verification.\n'
  printf 'Enter HarnessView1 bot-only password when prompted.\n'
  printf 'Leave the game server and Elrothiro running.\n'
  node tools/rs377-family-visible/join.mjs \
    --connect --allow-family --host 127.0.0.1 \
    --bot HarnessView1 --patrol --seconds 120 --verify-position
  current=$?
  printf 'PATROL_COMMAND_FINISHED: exit code %d. Terminal stays open.\n' "$current"
  if ((current != 0)); then
    printf 'Read JOIN_BLOCKED or POSITION_PROOF above; do not restart the game.\n' >&2
  fi
  return "$current"
}

main "$@"

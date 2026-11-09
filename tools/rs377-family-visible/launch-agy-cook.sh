#!/usr/bin/env bash
# Start the user's installed Agy CLI with an approved, tightly scoped live
# HarnessView1 Cook's Assistant objective. Never source this script.
# It does not start/stop the game, modify saves, or apply source patches.
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  printf 'HANDOFF_BLOCKED: run with bash; do not source this script.\n' >&2
  return 2
fi

find_controllers() {
  local file token i is_js is_bot
  local -a args=()
  for file in /proc/[0-9]*/cmdline; do
    [[ -r "$file" ]] || continue
    args=()
    mapfile -d '' -t args < "$file" 2>/dev/null || continue
    ((${#args[@]} >= 2)) || continue
    case "${args[0]##*/}" in node|nodejs) ;; *) continue ;; esac
    is_js=0; is_bot=0
    for ((i=1;i<${#args[@]};i++)); do
      case "${args[i]}" in
        tools/rs377-family-visible/join.mjs|*/tools/rs377-family-visible/join.mjs)
          is_js=1 ;;
      esac
      if [[ "${args[i]}" == '--bot' && "${args[i+1]:-}" == 'HarnessView1' ]]; then
        is_bot=1
      fi
    done
    if ((is_js && is_bot)); then
      token="${file#/proc/}"
      printf '%s\n' "${token%%/*}"
    fi
  done
}

is_port_listening() {
  [[ -n "$(ss -H -ltn "sport = :$1" 2>/dev/null)" ]]
}

main() {
  local root prompt_path game agy_bin pids elapsed=0 password status
  local skip_permissions=0 resume_id='' workspace='' check=0 launch_dir
  local -a agy_args=()
  root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)" || {
    printf 'HANDOFF_BLOCKED: cannot locate source worktree.\n' >&2
    return 2
  }
  prompt_path="$root/docs/rs377/AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md"
  game="$HOME/dev/JoshRS/lostcity377"
  while (( $# > 0 )); do
    case "$1" in
      --check) check=1; shift ;;
      --dangerously-skip-permissions) skip_permissions=1; shift ;;
      --resume-conversation)
        if (( $# < 2 )); then printf 'HANDOFF_BLOCKED: --resume-conversation needs a UUID.\n' >&2; return 2; fi
        resume_id="$2"; shift 2 ;;
      --workspace)
        if (( $# < 2 )); then printf 'HANDOFF_BLOCKED: --workspace needs an existing directory.\n' >&2; return 2; fi
        workspace="$2"; shift 2 ;;
      *)
        printf 'Usage: bash launch-agy-cook.sh [--check] [--dangerously-skip-permissions] [--resume-conversation UUID --workspace EXISTING_WORKTREE]\n' >&2
        return 2 ;;
    esac
  done
  if [[ -n "$resume_id" || -n "$workspace" ]]; then
    if [[ ! "$resume_id" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ || -z "$workspace" ]]; then
      printf 'HANDOFF_BLOCKED: resume requires a valid conversation UUID and an existing worktree.\n' >&2
      return 2
    fi
    case "$workspace" in
      "$HOME"/dev/JoshRS-agy-cook-*) ;;
      *) printf 'HANDOFF_BLOCKED: resume workspace must be a JoshRS-agy-cook-* worktree under ~/dev.\n' >&2; return 2 ;;
    esac
    launch_dir="$(cd -- "$workspace" 2>/dev/null && pwd -P)" || {
      printf 'HANDOFF_BLOCKED: saved Agy worktree not found.\n' >&2; return 2;
    }
    if [[ ! -e "$launch_dir/.git" || ! -f "$launch_dir/docs/rs377/AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md" ]]; then
      printf 'HANDOFF_BLOCKED: resume location is not a recognised JoshRS Agy worktree.\n' >&2
      return 2
    fi
  else
    launch_dir="$root"
  fi
  printf 'Agy Cook\x27s Assistant handoff — JoshRS rev377, HarnessView1 only.\n'
  if [[ ! -r "$prompt_path" ]]; then
    printf 'HANDOFF_BLOCKED: handoff task file missing.\n' >&2
    return 1
  fi
  if [[ ! -s "$game/engine/data/players/main/harnessview1.sav" ||
        ! -s "$game/engine/data/players/main/elrothiro.sav" ]]; then
    printf 'HANDOFF_BLOCKED: expected existing native bot/family save not found. No changes made.\n' >&2
    return 1
  fi
  if ! command -v ss >/dev/null 2>&1 ||
      ! is_port_listening 52402 || ! is_port_listening 8888; then
    printf 'HANDOFF_BLOCKED: live JoshRS ports 52402 and 8888 not both listening.\n' >&2
    return 1
  fi
  agy_bin="$(command -v agy 2>/dev/null || true)"
  if [[ -z "$agy_bin" && -x "$HOME/.local/bin/agy" ]]; then
    agy_bin="$HOME/.local/bin/agy"
  fi
  if [[ -z "$agy_bin" ]]; then
    printf 'HANDOFF_BLOCKED: agy CLI not found. Use the installed Antigravity CLI.\n' >&2
    return 1
  fi
  if (( check )); then
    pids="$(find_controllers)"
    printf 'HANDOFF_PREFLIGHT_OK: Agy CLI found, JoshRS ports listening; '
    if [[ -n "$pids" ]]; then
      printf 'existing HarnessView1 controller PID(s): %s\n' "${pids//$'\n'/, }"
    else
      printf 'no known active normal patrol controller.\n'
    fi
    printf 'No Agy process, bot login or game action started.\n'
    return 0
  fi
  pids="$(find_controllers)"
  if [[ -n "$pids" ]]; then
    printf 'HarnessView1\x27s previous time-limited patrol is running (PID %s).\n' "${pids//$'\n'/, }"
    printf 'Waiting for its normal disconnect, without stopping it or JoshRS.\n'
    while [[ -n "$pids" && "$elapsed" -lt 240 ]]; do
      sleep 3
      elapsed=$((elapsed+3))
      pids="$(find_controllers)"
    done
    if [[ -n "$pids" ]]; then
      printf 'HANDOFF_BLOCKED: controller still running (PID %s). Nothing taken over.\n' "${pids//$'\n'/, }" >&2
      return 1
    fi
  fi
  if [[ ! -t 0 ]]; then
    printf 'HANDOFF_BLOCKED: interactive Terminal required for bot-only password.\n' >&2
    return 1
  fi
  printf 'The former patrol is offline. Opening the visible Agy interactive interface.\n'
  if [[ -n "$resume_id" ]]; then
    printf 'Resuming existing Agy conversation %s with its prior worktree: %s\n' "$resume_id" "$launch_dir"
  else
    printf 'Agy prompt preview (first 12 lines):\n'
    sed -n '1,12p' "$prompt_path"
    printf 'Full task file: %s\n' "$prompt_path"
  fi
  IFS= read -r -s -p 'HarnessView1 bot-only password (hidden): ' password
  printf '\n'
  if [[ -z "$password" || "${#password}" -gt 20 ]]; then
    printf 'HANDOFF_BLOCKED: bot-only password must contain 1–20 characters.\n' >&2
    return 1
  fi
  # The secret is supplied only in this foreground child process's environment.
  # It must never be included in the prompt text, logs or shell arguments.
  if [[ -n "$resume_id" ]]; then
    agy_args=("--conversation=$resume_id")
  else
    agy_args=(-i "$(cat "$prompt_path")")
  fi
  if ((skip_permissions)); then
    agy_args+=(--dangerously-skip-permissions)
    printf 'WARNING: Agy permission bypass enabled for this session. Most commands/file writes will not ask.\n'
    printf 'Prompt instructions do not enforce save protection; do not use this on an untrusted workspace.\n'
  else
    printf 'Standard Agy permission prompts remain enabled.\n'
  fi
  printf 'Launching Agy interactive in %s.\n' "$launch_dir"
  (
    cd -- "$launch_dir" || return 2
    JOSHRS_HARNESSVIEW1_PASSWORD="$password" "$agy_bin" "${agy_args[@]}"
  )
  status=$?
  unset password
  printf 'AGY_HANDOFF_FINISHED: CLI exit %d. Check Agy\x27s live quest verification above.\n' "$status"
  if ((status != 0)); then
    printf 'Agy could not complete its CLI session; no success is assumed.\n' >&2
  fi
  return "$status"
}
main "$@"

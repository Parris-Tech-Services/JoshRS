#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/engine/logs"
mkdir -p "$LOG_DIR"

if ! ss -ltn "sport = :52402" | tail -n +2 | grep -q .; then
    nohup "$ROOT_DIR/start-server.sh" >"$LOG_DIR/server.log" 2>&1 &
    server_pid=$!
    echo "Started JoshRS #377 server launcher (PID $server_pid)."
else
    echo "JoshRS #377 game port 52402 is already listening; leaving it untouched."
fi

for _ in {1..60}; do
    if ss -ltn "sport = :52402" | tail -n +2 | grep -q . && ss -ltn "sport = :8888" | tail -n +2 | grep -q .; then
        exec "$ROOT_DIR/start-client.sh"
    fi
    sleep 1
done

echo "Timed out waiting for JoshRS #377 ports 52402 and 8888. See $LOG_DIR/server.log." >&2
exit 1

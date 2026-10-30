#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
echo "JoshRS #377 status"
echo "root: $ROOT_DIR"
for port in 52402 8888 8898; do
    if ss -ltn "sport = :$port" | tail -n +2 | grep -q .; then
        echo "port $port: LISTENING"
    else
        echo "port $port: not listening"
    fi
done

if [[ -s "$ROOT_DIR/engine/data/.josh-rs-377.pid" ]]; then
    pid="$(<"$ROOT_DIR/engine/data/.josh-rs-377.pid")"
    if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
        echo "server: running (PID $pid)"
    else
        echo "server: stale pid file"
    fi
else
    echo "server: no JoshRS pid file"
fi

if [[ -s "$ROOT_DIR/client-java/.josh-rs-377-client.pid" ]]; then
    pid="$(<"$ROOT_DIR/client-java/.josh-rs-377-client.pid")"
    if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
        echo "client: running (PID $pid)"
    else
        echo "client: stale pid file"
    fi
else
    echo "client: no JoshRS pid file"
fi

echo "HTTP root: $(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:8888/ 2>/dev/null || echo unavailable)"

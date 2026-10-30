#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$ROOT_DIR/client-java"
PID_FILE="$CLIENT_DIR/.josh-rs-377-client.pid"

if [[ -s "$PID_FILE" ]]; then
    existing_pid="$(<"$PID_FILE")"
    if [[ "$existing_pid" =~ ^[0-9]+$ ]] && kill -0 "$existing_pid" 2>/dev/null; then
        echo "JoshRS #377 client is already running (PID $existing_pid); leaving it untouched."
        exit 0
    fi
    rm -f -- "$PID_FILE"
fi

(
    set -o noclobber
    printf '%s\n' "$$" > "$PID_FILE"
) 2>/dev/null || {
    echo "JoshRS #377 client startup is already in progress; leaving it untouched." >&2
    exit 0
}

cleanup() { rm -f -- "$PID_FILE"; }
trap cleanup EXIT INT TERM

cd "$CLIENT_DIR"
./gradlew classes --no-daemon
java -cp "build/classes/java/main" jagex2.client.Client 10 8808 highmem members 32

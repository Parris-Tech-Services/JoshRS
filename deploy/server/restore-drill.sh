#!/bin/sh
# Restore a backup into a NEW, isolated Docker Compose volume, boot the game,
# and destroy that disposable volume afterwards. Never touches the source world.
set -eu
cd "$(dirname "$0")/../.."
if [ "$#" -ne 1 ]; then
  echo "Usage: sh deploy/server/restore-drill.sh BACKUP.tar.gz" >&2
  exit 2
fi
archive="$(realpath "$1")"
if [ ! -f "$archive" ] || ! tar -tzf "$archive" >/dev/null; then
  echo "Archive is missing or invalid" >&2
  exit 1
fi
# Our backup.sh produces ./db.sqlite and ./players/ inside the archive.
if ! tar -tzf "$archive" | grep -qx './db.sqlite'; then
  echo "Backup does not contain an account database" >&2
  exit 1
fi
if ! tar -tzf "$archive" | grep -qx './players/'; then
  echo "Backup does not contain the player-save directory" >&2
  exit 1
fi
if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "Unsafe archive paths" >&2
  exit 1
fi
project="joshrsrestore$(date -u +%s)$$"
restore() {
  docker compose -p "$project" -f deploy/server/compose.yaml -f deploy/server/compose.restore.yaml "$@"
}
cleanup() {
  restore down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# A separate project name guarantees a distinct volume, even on a live host.
# The shared image is already built by the normal server deployment.
restore run --rm --no-deps -T --entrypoint tar world -xzf - -C /data < "$archive"
expected="$(tar -xOzf "$archive" ./db.sqlite | sha256sum | cut -d ' ' -f1)"
actual="$(restore run --rm --no-deps -T --entrypoint sha256sum world /data/db.sqlite | cut -d ' ' -f1)"
if [ "$expected" != "$actual" ]; then
  echo "Restored SQLite file checksum mismatch" >&2
  exit 1
fi
if tar -tzf "$archive" | grep -qx './restore-probe.txt'; then
  expected="$(tar -xOzf "$archive" ./restore-probe.txt | sha256sum | cut -d ' ' -f1)"
  actual="$(restore run --rm --no-deps -T --entrypoint sha256sum world /data/restore-probe.txt | cut -d ' ' -f1)"
  if [ "$expected" != "$actual" ]; then
    echo "Restored data sentinel mismatch" >&2
    exit 1
  fi
fi
restore up -d --no-build --wait --wait-timeout 600
restore exec -T world node -e "fetch('http://127.0.0.1:8888/rs2.cgi').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
echo "PASS: isolated data-volume recovery, database checksum and server startup"
echo "This does NOT establish browser account login, quest/XP persistence or licensed public hosting."

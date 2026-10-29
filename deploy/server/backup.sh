#!/bin/sh
# Consistent snapshot: stop the world before copying SQLite and player files.
set -eu
cd "$(dirname "$0")/../.."
umask 077
mkdir -p deploy/server/backups
archive="deploy/server/backups/world-$(date -u +%Y%m%dT%H%M%SZ)-$$.tar.gz"
docker compose -f deploy/server/compose.yaml stop world
trap 'docker compose -f deploy/server/compose.yaml start world' EXIT
if docker compose -f deploy/server/compose.yaml run --rm --no-deps --entrypoint tar world -czf - -C /data . > "$archive.partial"; then
  tar -tzf "$archive.partial" >/dev/null
  mv "$archive.partial" "$archive"
  printf 'Saved %s\n' "$archive"
else
  rm -f "$archive.partial"
  exit 1
fi

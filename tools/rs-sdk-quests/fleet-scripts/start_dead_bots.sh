#!/usr/bin/env bash
cd /home/josh/dev/JoshRS-source/rs-sdk/server/webclient || exit 1
DEAD_BOTS=(
  qb135429
  qb142430
  qb142749
  qb143519
  qb144940
  qb150847
  qb155752
  qb160625
  qb161239
  qb162331
)
for b in "${DEAD_BOTS[@]}"; do
  sed -i 's/^SERVER=$/SERVER=localhost:8888/' "/home/josh/dev/JoshRS-source/rs-sdk/bots/$b/bot.env"
  GATEWAY_URL="ws://localhost:7780" bun src/lite/runner.ts "$b" >/tmp/lite-runner-"$b".log 2>&1 &
  sleep 0.2
done
wait

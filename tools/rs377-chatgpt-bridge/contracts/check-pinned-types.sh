#!/usr/bin/env bash
# Read-only upstream source retrieval + immutable SHA + REAL TypeScript check.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
SDK_SHA=db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb
TYPES_BLOB=ec59cef4f878c908481f68bd42cf698b68cdf579
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/contracts/vendor/sdk"
curl --fail --location --silent --show-error --retry 2 --max-time 35 \
  "https://raw.githubusercontent.com/MaxBittker/rs-sdk/$SDK_SHA/sdk/types.ts" \
  -o "$TMP/contracts/vendor/sdk/types.ts"
test "$(git hash-object "$TMP/contracts/vendor/sdk/types.ts")" = "$TYPES_BLOB"
# The real pinned types imports GEState, so pin the entire dependency instead
# of substituting a fake local declaration.
curl --fail --location --silent --show-error --retry 2 --max-time 35 \
  "https://raw.githubusercontent.com/MaxBittker/rs-sdk/$SDK_SHA/sdk/ge-types.ts" \
  -o "$TMP/contracts/vendor/sdk/ge-types.ts"
cp "$ROOT/contracts/sdk-contract-check.ts" "$TMP/contracts/"
cp "$ROOT/contracts/tsconfig.json" "$TMP/contracts/"
mkdir -p "$TMP/src"
cp "$ROOT/src/sdk-runtime.d.mts" "$TMP/src/"
# Declaration must remain adjacent to the actual JS implementation in the repo.
# The probe compiles the genuine upstream contract, not a search/grep stand-in.
cd "$TMP/contracts"
if command -v tsc >/dev/null 2>&1; then
  tsc --version
  tsc -p tsconfig.json
else
  echo 'TypeScript compiler (tsc) is required; no false success' >&2
  exit 2
fi
echo 'PASS: TypeScript imported pinned SDK BotAction/BotWorldState/ActionResult'

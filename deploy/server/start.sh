#!/bin/sh
set -eu
node --import tsx configure.mjs
node node_modules/prisma/build/index.js migrate deploy --schema prisma/singleworld/schema.prisma
exec node --import tsx src/app.ts

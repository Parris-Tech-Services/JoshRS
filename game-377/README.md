# JoshRS #377 integration (safe source distribution)

This directory publishes the custom JoshRS #377 work as reviewable patches and
local launcher/test material. It is intentionally isolated from the existing
JoshRS web application.

## What is included

- `patches/engine-377.patch`: the two local Engine-TS #377 commits, excluding
  runtime data and private configuration.
- `patches/content-377.patch`: the local Content #377 script/config changes.
- `patches/client-java-377.patch`: the three local Client-Java #377 commits,
  excluding the generated world-map image.
- `launcher/`: local-only start/status scripts.
- `tests/`: the public-safe candlelight and client map regression entry points.
- `NOTICE.md`: provenance, licences, and redistribution boundary.

The patches apply to the matching upstream branches at the pinned base commits
listed in `NOTICE.md`. They do not replace the upstream repositories and are
not a standalone public game distribution.

## Reconstructing a private local checkout

Obtain the matching upstream Engine-TS, Content, and Client-Java repositories
from their official repositories, check out the branches and base commits in
`NOTICE.md`, and apply the three patches in order. Keep the resulting checkout
private unless you have independently cleared all game-resource rights.

The launcher scripts expect the reconstructed directories to be siblings of
the launcher directory's parent in the original local layout. They require
Node.js 24+, Java, Gradle wrapper support, and the separately obtained runtime
resources.

## Verification

The complete source was verified in the original private checkout on 2026-10-30. See
`NOTICE.md` for the exact commands and results. The authenticated gameplay
acceptance test remains outstanding.

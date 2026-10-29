# Upstream source and runtime reality

Verified 29 October 2026 from the named projects' published README and licence files.

**These are references and research targets, not copied repositories.** No upstream code/assets are vendored into JoshRS. Each project must be operated according to its own licence and runtime instructions. This avoids accidentally publishing proprietary Jagex assets, incorrectly mixing copyleft code, or claiming a static website is an MMO server.

## Lost City / 2004Scape

- Source/bootstrap: https://github.com/LostCityRS/Server
- TypeScript engine: https://github.com/LostCityRS/Engine-TS (default branch 274 at inspection)
- Historical content: https://github.com/LostCityRS/Content (matching branch 274)
- Hosted community experience: https://2004.lostcity.rs/
- MIT licence for original project source. **Content README explicitly states Jagex assets are their intellectual property, not covered by MIT.**
- README: Node.js 24+ and Git required. Bootstrap script downloads/configures different components. Then locally play at `http://localhost/rs2.cgi`; manual engine requires matching engine/content branches and world config at `http://localhost:8898/setup`.
- The official browser client may vary with historical revision. Mobile usability is **not guaranteed** by a TypeScript engine.

## OpenRSC

- Source: https://github.com/Open-RSC/Core-Framework
- Community: https://rsc.vet/
- Licence: **GNU AGPL v3**. If modifying and serving as a network service, assess AGPL source-availability obligations.
- Project README: Java 8+, around 1–2 GB RAM and a dedicated Java client/server stack. Separate local setup guides for Windows, macOS and Linux. Repository includes an Android client source directory, but this does not prove plug-and-play modern phone compatibility.
- Not suitable as a static HTML/CSS/JS drop-in game.

## 2009Scape

- Source: https://github.com/summerdevs/2009Scape (published branch development)
- Community: https://2009scape.org/
- Licence: **CC BY-NC-SA 4.0**, with attribution, noncommercial and share-alike obligations. Do not relicense as MIT.
- Readme documents a standalone client/launcher and Java/Kotlin server components, not a mobile-browser game. Check the current community project for supported binaries.
- Not bundled in the JoshRS site.

## REA reverse-engineering research

In this context the most valuable starting point is the **open source itself**, then a sandboxed runtime study of specific player interactions. For REA (Reverse Engineer Anything), see https://github.com/morluto/rea and vet all binaries/dependencies independently.

Research procedure for a woodcutting/firemaking mechanic:

1. Download an approved upstream **code-only** checkout and read README/licences.
2. Trace interaction path (selection, server command validation, action timing, XP, item rewards, persistence) in the matching branch.
3. Independently observe behaviour where you are authorised to run the upstream game.
4. Compare a documented state machine with JoshRS's original `core.mjs`; implement your own art, terminology and code.
5. Add deterministic tests and a mobile/desktop gameplay smoke test before claiming parity.

Do not copy credentials, proprietary game resources, RuneScape branding or unlicensed sounds. No external upstream site availability is guaranteed by JoshRS.

# JoshRS — Full 2004Scape launcher and Woodlands demo

A **launch hub for the actual 2004Scape reconstruction** plus an original, small mobile-first browser RPG prototype (Woodlands). The full game link opens Lost City's official website. We do not self-host the full game or capture account credentials.

**Open JoshRS:** https://joshrs.vercel.app/ — primary action launches the **real full 2004Scape** on the official Lost City website. The independently developed Woodlands demo is now at https://joshrs.vercel.app/woodlands.html, or run the files locally. **Source:** https://github.com/Parris-Tech-Services/JoshRS

This project is **not** RuneScape, the 2004Scape client/server, OpenRSC, or 2009Scape. Their full MMO server backends, client assets, accounts and worlds are not embedded or deployed here. Upstream projects have different dependencies and licences. Do not present this as a deployment of their complete games.

## Play

**Full MMO:** tap **Launch full 2004Scape** on the homepage to play at Lost City's own mobile/desktop browser site; a Lost City game account may be required. **Woodlands:** the separate original demo opens directly without login or download.
- Tap a map location to move; tap a tree, rock, fishing spot, ranger or mossling to navigate toward and interact.
- Arrow keys / WASD or on-screen movement pad; **E** to interact, **F** to light a campfire with gathered logs, **H** to eat a cooked fish.
- Walk/run toggle; quests, inventory, six skills, XP, level progression, HP, coins, combat, cooking and automatic save.
- Progress is stored only in this browser's `localStorage`; clearing browser data erases it. The New game button resets after confirmation.
- Desktop and phone-responsive UI, labelled controls, tabbed dashboard, keyboard navigation and motion preferences.

For local development use `python3 -m http.server 8000`, then open http://localhost:8000. Browsers generally restrict JavaScript modules when opening `file://` directly. No dependencies or backend needed.

Run tests: `npm test` (Node 20+).

## Architecture

- `index.html`: honest, responsive full-game launcher with official external play link and source references.\n- `launcher.css`: launcher-specific responsive styles.\n- `woodlands.html`: original mini-game with full controls, separate from the full game.
- `style.css`: responsive mobile/desktop experience.
- `core.mjs`: dependency-free game rules, deterministic map, pathfinding, skills, player state and quest validation.
- `app.mjs`: Canvas art renderer, DOM, pointer/keyboard/touch controls and save handling.
- `tests/core.test.mjs`: deterministic game-engine regression tests.
- `docs/UPSTREAM.md`: source map, licence distinctions and actual setup requirements.

## Research: historical RuneScape community reconstructions

| Project | Source | Licence (upstream software) | Can JoshRS play full upstream MMO? |
| --- | --- | --- | --- |
| Lost City / 2004Scape | https://github.com/LostCityRS/Server | MIT for code, **not** Jagex assets | **No** — requires separate compatible engine/content/client/backend deployment |
| Lost City Engine-TS + Content | https://github.com/LostCityRS/Engine-TS and https://github.com/LostCityRS/Content | MIT code; Content expressly excludes original proprietary game assets | **No** |
| OpenRSC | https://github.com/Open-RSC/Core-Framework | AGPL-3.0 | **No** — Java game server/client infrastructure |
| 2009Scape | https://github.com/summerdevs/2009Scape | CC BY-NC-SA 4.0 (repository licence) | **No** — separate Java/Kotlin-era stack and client |

Developers can optionally fetch code checkouts into a gitignored local workspace using \`bash scripts/fetch-upstreams.sh\` (large downloads; not part of production). Read [docs/UPSTREAM.md](docs/UPSTREAM.md) before reusing or modifying anything from those projects. All JoshRS Woodlands game code and procedural artwork are independently created, not reverse-engineered or copied assets. Study gameplay ideas without lifting Jagex intellectual property.

## Licence

Original JoshRS code is licensed under the MIT licence in [LICENSE](LICENSE). Upstream source remains with its own copyright owners, repository and licence. No affiliation with Jagex Ltd or the upstream communities.

## Independent full-game research setup

Use [deploy/local/README.md](deploy/local/README.md) and [deploy/local/compose.yaml](deploy/local/compose.yaml) to run a **private, local** 2004Scape 274 world via a third-party prebuilt community container. This is not running behind the JoshRS public website, and contains Jagex-owned assets outside the JoshRS repository. Review the upstream licence and rights before use; never expose an unprotected local instance to the public internet.

## Deployment

A static host can serve this portal and Woodlands demo directly (no build step). Keep `index.html`, `woodlands.html`, `launcher.css`, `style.css`, `core.mjs` and `app.mjs` at the site root. The `/play` shortcut redirects to the official full game, not a self-hosted world. See [docs/SELF_HOST.md](docs/SELF_HOST.md) for independent-server release criteria. The GitHub Actions workflow executes `node --test` on every push. A production deployment is not considered verified until its build is READY and the public link returns a usable page.

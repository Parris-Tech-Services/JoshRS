# JoshRS — Woodlands

An **original, playable, mobile-first browser RPG** and open-source MMORPG research hub.

**Play:** use the live JoshRS deployment when available, or run the files locally. **Source:** https://github.com/Parris-Tech-Services/JoshRS

This project is **not** RuneScape, the 2004Scape client/server, OpenRSC, or 2009Scape. Their full MMO server backends, client assets, accounts and worlds are not embedded or deployed here. Upstream projects have different dependencies and licences. Do not present this as a deployment of their complete games.

## Play

- Opens straight into the world, no login or download needed.
- Tap a map location to move; tap a tree, rock, fishing spot, ranger or mossling to navigate toward and interact.
- Arrow keys / WASD or on-screen movement pad; **E** to interact, **F** to light a campfire with gathered logs, **H** to eat a cooked fish.
- Walk/run toggle; quests, inventory, six skills, XP, level progression, HP, coins, combat, cooking and automatic save.
- Progress is stored only in this browser's `localStorage`; clearing browser data erases it. The New game button resets after confirmation.
- Desktop and phone-responsive UI, labelled controls, tabbed dashboard, keyboard navigation and motion preferences.

For local development use `python3 -m http.server 8000`, then open http://localhost:8000. Browsers generally restrict JavaScript modules when opening `file://` directly. No dependencies or backend needed.

Run tests: `npm test` (Node 20+).

## Architecture

- `index.html`: semantic app markup, dashboard and research library.
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

Read [docs/UPSTREAM.md](docs/UPSTREAM.md) before reusing or modifying anything from those projects. All JoshRS Woodlands game code and procedural artwork are independently created, not reverse-engineered or copied assets. Study gameplay ideas without lifting Jagex intellectual property.

## Licence

Original JoshRS code is licensed under the MIT licence in [LICENSE](LICENSE). Upstream source remains with its own copyright owners, repository and licence. No affiliation with Jagex Ltd or the upstream communities.

## Deployment

A static host can serve this project directly (no build step). Keep `index.html`, `style.css`, `core.mjs` and `app.mjs` at the site root. The GitHub Actions workflow executes `node --test` on every push. A production deployment is not considered verified until its build is READY and the public link returns a usable page.

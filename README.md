# JoshRS — Full 2004Scape launcher and Woodlands demo

A **launch hub for the actual 2004Scape reconstruction** plus an original, small mobile-first browser RPG prototype (Woodlands). The full game link opens Lost City's official website. We do not self-host the full game or capture account credentials.

**Open JoshRS:** https://joshrs.vercel.app/ — primary action launches the **real full 2004Scape** on the official Lost City website. The independently developed Woodlands demo is now at https://joshrs.vercel.app/woodlands.html, or run the files locally. **Source:** https://github.com/Parris-Tech-Services/JoshRS

This project is **not** RuneScape, the 2004Scape client/server, OpenRSC, or 2009Scape. Their full MMO server backends, client assets, accounts and worlds are not embedded or deployed here. Upstream projects have different dependencies and licences. Do not present this as a deployment of their complete games.

## Run your own revision-377 game on JParris Desktop (Windows)

**One-click Windows launcher:** download and extract this repository, then double-click **`JoshRS.cmd`**. A native control window lets you **Play JoshRS**, **Restore Fedora USB game**, **Install a clean revision-377 world**, **Back up saves**, **Check status** and view safe diagnostics. It retrieves pinned Lost City 377 sources as needed and does not need WSL, Docker or paid hosting. The existing `jparris-setup.cmd` and `jparris-play.cmd` commands still work.

**[Detailed Windows setup and USB migration guide](deploy/jparris-windows/README.md)**. The revision-377 desktop server is **not** the JoshRS public web launcher, does not automatically make your world mobile-playable, and still requires real gameplay/save restoration testing on JParris Desktop.

## Full independent classic MMORPG goal

**[Full classic MMO build and visual-fidelity checklist](docs/FULL_CLASSIC_MMO_CHECKLIST.md)** — 114 auditable tasks across 13 sections, covering the classic 3D interface, world, skills, combat, quests, multiplayer, permanent player saves, mobile UX, hosting, testing and release. The checkboxes distinguish verified existing Woodlands features from everything still required.

**BASE-02 decision: [Option A — 23 November 2004, revision 274](docs/REFERENCE_VERSION_274.md) is the adopted visual and gameplay reference**, and [the version lock](docs/REFERENCE_VERSION_LOCK.json) is checked in CI. Do not mix in 2007-derived OSRS interfaces, modern OSRS features, or later era content without an explicit version-change decision. We are reproducing the historically recognisable *structure and feel* using original/cleared assets, not treating Jagex-owned art as open source.

Important: **2004Scape (November 2004)** and **official Old School RuneScape (2007-derived)** are distinct historical versions. Original game software being MIT-licensed does not license Jagex-owned artwork, music, names, quest content or branding. The checklist therefore differentiates *exact historical asset reproduction requiring rights* from an independent original game that faithfully evokes the classic feel. No additional hosting purchase or asset rights are assumed.

See also [multiplayer work tracker #5](https://github.com/Parris-Tech-Services/JoshRS/issues/5) and [self-hosting gate #3](https://github.com/Parris-Tech-Services/JoshRS/issues/3).

## Revision 377 — opt-in autonomous player bot

**[One real server-side woodcutter and safe installer](docs/377_ONE_BOT_WOODCUTTER.md)**. This is a **separate experimental 377-wip feature**, not an alteration to the locked November 2004 reference. The bot is disabled by default, does not require a second Java client, and was tested in a disposable 377 server: it appeared in an ordinary player slot, selected a real tree, gained a log and Woodcutting XP. It has **not** been installed on Josh's Fedora host; banking, quests, trading and persistent bot saves are later work.

## Play

**Full MMO:** tap **Launch full 2004Scape** on the homepage to play at Lost City's own mobile/desktop browser site; a Lost City game account may be required. **Woodlands:** the separate original demo opens directly without login or download.
- Tap a map location to move; tap a tree, rock, fishing spot, ranger or mossling to navigate toward and interact.
- Arrow keys / WASD or on-screen movement pad; **E** to interact, **F** to light a campfire with gathered logs, **H** to eat a cooked fish.
- Walk/run toggle; quests, inventory, six skills, XP, level progression, HP, coins, combat, cooking and automatic save.
- Progress is stored only in this browser's `localStorage`; clearing browser data erases it. The New game button resets after confirmation.
- **Portable saves:** Open the Guide tab and use Export save file to download a JSON backup. Import save file restores it on another browser/device after confirmation; this is not automatic cloud sync.
- **Oakvale town:** Banker Fern stores/returns gathered resources. Merchant Mira buys supplies and sells cooked fish. Both require standing beside the correct NPC.
- **Repeatable deliveries:** After Forest Apprentice, bring 2 logs, 1 ore and 1 cooked fish to Mira for coins and bonus skill XP. Progress survives local saves.
- Desktop and phone-responsive UI, labelled controls, tabbed dashboard, keyboard navigation and motion preferences.

For local development use `python3 -m http.server 8000`, then open http://localhost:8000. Browsers generally restrict JavaScript modules when opening `file://` directly. No dependencies or backend needed.

Run tests: `npm test` (Node 20+).

## Architecture

- `index.html`: honest, responsive full-game launcher with official external play link and source references.\n- `launcher.css`: launcher-specific responsive styles.\n- `woodlands.html`: original mini-game with full controls, separate from the full game.
- `style.css`: responsive mobile/desktop experience.
- `core.mjs`: dependency-free game rules, deterministic map, pathfinding, skills, player state and quest validation.
- `app.mjs`: Canvas art renderer, DOM, pointer/keyboard/touch controls and save handling.
- `tests/core.test.mjs`: deterministic game-engine tests, trading rules, bank conservation, deliveries and save compatibility.
- `tests/woodlands-local-browser.mjs`: starts a local static server and verifies bank, export/reset/import and merchant gameplay on desktop and mobile Chromium.
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

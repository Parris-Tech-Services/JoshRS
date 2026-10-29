# Independent full 2004Scape server — implementation and release gates

## Why JoshRS currently launches the official world

The genuine game is already playable on desktop and mobile at https://2004.lostcity.rs/detail .
On 29 Oct 2026, real Chromium tests showed the official detail/world selection pages return **X-Frame-Options: SAMEORIGIN**, and https://www.lostcitylabs.com/play returns **CSP frame-ancestors 'self'**. Cross-origin iframe embedding is intentionally blocked. JoshRS will not bypass this with a credential-intercepting reverse proxy.

## The correct self-hosted technical architecture

1. **One compatible revision:** LostCityRS/Engine-TS branch `274`, LostCityRS/Client-TS branch `274`, and LostCityRS/Content branch `274`. Do **not** mix revisions or engines from OpenRSC and 2009Scape.
2. **Local research environment:** start with https://github.com/LostCityRS/Server and its official Node.js 24+ setup script. Validate a local world and browser client at `http://localhost/rs2.cgi`.
3. **Rights review before public hosting:** LostCityRS/Content states Jagex owns historical game assets and they are excluded from the MIT code licence. A public JoshRS service cannot treat those assets as open source. Obtain suitable rights or replace assets with lawfully reusable originals before publishing them from our own host.
4. **Persistent server:** use a long-running container host supporting WebSocket connections, Node.js 24+, TLS, full-duplex routing, persistent database and character-save volume. A static site (GitHub Pages) is unsuitable; serverless request functions alone are unsuitable.
5. **Accounts:** do not proxy users' Discord tokens or credentials to JoshRS. Use the upstream-supported self-hosted registration flow and secrets on the private server, protecting moderation/admin endpoints.
6. **Reliability:** automatic backups of SQLite and player files, restore test, health checks, crash recovery, rate limits and connection monitoring.
7. **Mobile acceptance:** Android portrait and landscape, tap/hold/right-click alternatives, drag camera, on-screen keyboard and reconnect; desktop mouse/keyboard and multiple browser engines.
8. **Launch requirements:** licensed assets, authenticated real game account creation, completed in-game tutorial, inventory/skills/quests/combat, save/relogin persistence, and actual public browser verification. A deployment merely marked READY is not enough.

## Optional private local setup

The community Docker distribution at https://github.com/mserajnik/lost-city-rs-deploy currently provides a prebuilt image tagged `ghcr.io/mserajnik/lost-city-rs:274` that starts one SQLite-backed world and browser client on port 8888. The image and bundled assets are **not** included in JoshRS. Its published instructions use Docker Compose, persistent database/player directories, `LOST_CITY_RS_DEPLOY_VERSION`, and world setup. That distribution documents private, noncommercial use and is AGPL-3.0-or-later for its wrapper code.

Do not expose a private instance to the public internet without following its licence, security and asset-rights requirements. This is not the deployment running at JoshRS today.

## Current acceptance status

- **Pass:** The original JoshRS Woodlands demo is independently deployed and tested on mobile and desktop.
- **Pass:** The authentic upstream game is directly accessible from JoshRS via a clearly labelled official external link.
- **Pass:** Browser tests confirm that transparent cross-origin embedding cannot work.
- **Not done:** Independent full-game hosting under the JoshRS domain, provisioned persistent storage, licensing clearance and real account/login/playthrough testing.

The project is not considered a self-hosted full MMORPG until all the above production acceptance tests pass.

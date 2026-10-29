# Pinned independent world — private deployment candidate

This builds the actual revision 274 engine and content, with the browser bundle shipped in that engine commit. It is not the Woodlands demo. It is not the service at joshrs.vercel.app. No container image or proprietary assets are committed to JoshRS.

## Start on an existing Docker host

From the repository root:

```sh
docker compose -f deploy/server/compose.yaml up --build -d --wait
```

Open http://localhost:8888/rs2.cgi after the world reports ready. Creating a new character uses the upstream game login flow. Use a unique game password.

The world uses authenticated SQLite accounts, ordinary player privileges, disabled debug routes, one persistent volume for accounts and player saves, and a 90-second graceful shutdown allowance. Only web port 8888 is published, bound to the host loopback. Management is bound to container loopback. Never publish login/friend/logger/management ports.

Engine: `1d25566cb53e7af1b1cb18ade8af996316c19614`
Content: `65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe`

## Private mobile/desktop access over Tailscale

On a personal host, install Tailscale and enable **Serve**, not public Funnel. For example, proxy the private HTTPS hostname to `http://127.0.0.1:8888`, and install Tailscale on each client device. Confirm the hostname from Tailscale itself, not an example.

```sh
tailscale serve --bg http://127.0.0.1:8888
JOSHRS_ORIGIN=https://YOUR-REAL-HOSTNAME.ts.net docker compose -f deploy/server/compose.yaml up -d --force-recreate --wait
```

Replace the example with the exact URL (scheme + hostname, and port only if present). No trailing slash, path, query or credentials. `JOSHRS_ORIGIN` is interpolated by Docker Compose when creating/recreating the container. Export it again for subsequent Compose recreations, or keep it in a private root-level `.env` file (never commit that file). Access requires a device authorised on your private tailnet. The game and its assets are **not** published by this configuration.

Do not use a school/client computer without the owner's authorisation. Keep the host awake, allow sufficient disk for saves, and verify HTTPS + game WebSocket traffic over mobile data. Private transport does not resolve the third-party game-assets permissions issue.

## Persistence and tested recovery

The named `world-data` volume holds `db.sqlite` and `players/`. Never run `docker compose down -v` against live saves. A consistent backup briefly stops and restarts the source world:

```sh
sh deploy/server/backup.sh
```

The snapshot is written under `deploy/server/backups/`, outside Git. Copy it to encrypted storage on another trusted device; no automatic schedule or off-site destination has been provisioned.

To rehearse restoration **without touching the original volume**, on a host where the image has already been built:

```sh
sh deploy/server/restore-drill.sh deploy/server/backups/YOUR-ARCHIVE.tar.gz
```

The drill uses an isolated, disposable Compose project, no published host port, and a newly created volume. It checks the account DB checksum and boots the recovered server, then deletes **only its own disposable volume**. Requires Docker Compose 2.24.4+ for `!reset` support. A green drill does **not** prove account login, XP, inventory, quest state or saved progress after reconnect; those require real gameplay acceptance testing.

## Verification and release restrictions

The workflow `.github/workflows/full-world.yml` builds the image, checks protected routes, renders a desktop/mobile client, and rehearses restoring the data volume. It does not host a world continuously. Historical assets are owned by third parties and are **not** covered by the code licence. Do not launch a public independent world until permissions, complete gameplay/save acceptance, secure ingress and off-site backups are resolved.

See `../../docs/SELF_HOST.md`, `../../docs/FREE_SELF_HOSTING_RESEARCH.md` and `../../docs/INDEPENDENT_WORLD_CHECKPOINT.md` for full acceptance criteria.

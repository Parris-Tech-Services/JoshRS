# Pinned independent world — private deployment candidate

This builds the actual revision 274 engine and content, with the browser bundle
shipped in that engine commit. It is not the Woodlands demo. It is not yet the
service at joshrs.vercel.app. No container image or proprietary assets are
committed to JoshRS.

## Start on a Docker host

From the repository root:

```sh
docker compose -f deploy/server/compose.yaml up --build -d
```

Open http://localhost:8888/rs2.cgi after the world reports ready. Creating a new
character uses the upstream game login flow. Use a unique game password.

The world uses authenticated SQLite accounts, ordinary player privileges,
disabled debug routes, one persistent volume for accounts and player saves, and
a 90-second graceful shutdown allowance. Only the web port is published, bound
to host loopback. Management is bound to container loopback. Login/friend/logger
ports must never be published or routed from the Internet.

Engine: `1d25566cb53e7af1b1cb18ade8af996316c19614`
Content: `65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe`

## Persistence and backups

`world-data` contains `db.sqlite` and `players/`. Never run Compose with `down -v`
against saves you want to keep. To make a consistent backup (brief downtime):

```sh
sh deploy/server/backup.sh
```

Backups are private, gitignored archives. Copy them to a separate trusted device.
For a restore drill, stop an isolated test world and extract the archive into
its **new, empty** data volume. Start that world and verify the account, inventory,
position and progress before replacing any live volume. A readable tar archive
alone does not prove game restoration. No automatic schedule or off-site backup
has been provisioned.

## Private mobile hosting

A durable host still needs to be selected. Do not publish this localhost setup
as-is. Use HTTPS with WebSocket upgrades on the web port, a private access layer,
and set JOSHRS_ORIGIN to the exact browser origin. Test phone access, passwords,
save/relogin and restart recovery before changing the JoshRS Play link.

The code licence does not grant rights to all historical assets; see
../../docs/SELF_HOST.md and the upstream Content licence.

## Verification limits

On 30 October 2026 the pinned engine was built and run directly with Node 24:
10,938 scripts and 7,322 static NPCs loaded; SQLite migration succeeded; the
client page returned 200 and the debug data route returned 404. The local test
used loopback web bindings because this execution environment restricts network
interface enumeration. This is not a Docker build test or a mobile playthrough.
See the implementation checkpoint for outstanding acceptance checks.

# JoshRS private 2004Scape world — runnable local server

This is a real **game server configuration**, not the Woodlands demo and not a static website. It uses the independently maintained container image documented at [mserajnik/lost-city-rs-deploy](https://github.com/mserajnik/lost-city-rs-deploy), which packages matching Lost City revision 274 engine and content. The public JoshRS website does **not** run this container.

**For private, noncommercial research only.** The wrapper is AGPL-3.0-or-later, Lost City engine and original scripts are MIT, and historical artwork/maps/models are Jagex intellectual property excluded from that code licence. The external image may contain those assets. Do not redistribute them through JoshRS or host a public world without the appropriate rights. Review the upstream release notes and terms yourself.

## Requirements

- Docker Engine + the Compose plugin; a machine with enough RAM/storage to run the image.
- A computer that can run Docker and download `ghcr.io/mserajnik/lost-city-rs:274`.
- No account or paid hosting required for the local server. The first startup downloads a large third-party Docker image.
- On Linux, edit `LOST_CITY_RS_UID`/`LOST_CITY_RS_GID` to the owner of the local storage folders if your UID or GID is not 1000.

## Start

From the **JoshRS repository root**:

```sh
docker compose -f deploy/local/compose.yaml config -q
docker compose -f deploy/local/compose.yaml up -d
docker compose -f deploy/local/compose.yaml logs -f app
```

When the log reports that the world is ready, open **http://localhost:8888/rs2.cgi** on the Docker host. The first startup can take several minutes; see the image documentation if migrations/cache setup fail.

## Progress and data safety

- SQLite database stored in `deploy/local/storage/database/`.
- Character saves stored in `deploy/local/storage/data/players/`.
- Both folders are ignored by Git. Never commit accounts, passwords, databases or saves.
- Back up those folders before upgrades; don't swap image revision tags against an existing database.
- Test logging out and back in to confirm progress is persisted.
- On updates compare [breaking changes](https://github.com/mserajnik/lost-city-rs-deploy/blob/master/docs/breaking-changes.md), run `docker compose -f deploy/local/compose.yaml run --rm check-deploy-version`, then start the updated image.
- Stop with `docker compose -f deploy/local/compose.yaml down`. Avoid `-v` if you want to keep data.

**Network security:** The Compose port binds to `127.0.0.1`, so other computers and phones cannot reach it by default. Do not simply expose port 8888 on the public internet. A local-device/mobile setup needs a deliberately secured LAN or VPN path and careful WebSocket/TLS routing. The public upstream game at https://2004.lostcity.rs/detail is the safe, ready-to-play mobile option.

## Production promotion criteria

See [../../docs/SELF_HOST.md](../../docs/SELF_HOST.md). Independently hosting a full game on JoshRS requires lawful game assets, sustained hosting, authentication, a persistent volume, WebSockets, backups and tested mobile/desktop logins. This local Compose file alone does not meet those criteria.

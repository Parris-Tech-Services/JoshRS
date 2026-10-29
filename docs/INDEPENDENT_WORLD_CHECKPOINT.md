# Independent world checkpoint — 30 October 2026

Status: partially implemented; public launch blocked.

## Verified in this session

- Checked out matching revision 274 engine/content and installed engine dependencies.
- Packed cache, loaded 10,938 scripts and 7,322 static NPCs.
- Ran SQLite migration and started engine/login/friend/logger services.
- HTTP client endpoint returned 200; debug data endpoint returned 404.
- Config generation tested twice, with authenticated login, non-admin player
  privileges, persistent-path symlinks and refusal to overwrite existing data.
- Direct login-service test created an account with staffmodlevel 0 and rejected
  its wrong password (responses 4 and 1 respectively). This is not browser login.
- Nine existing JoshRS unit tests passed; shell scripts passed syntax checks.

## Added

`deploy/server/` contains a pinned Docker source build, authenticated world
configuration, persistent SQLite/player volume, private management binding,
healthcheck, graceful shutdown and an offline consistent-backup command.
GitHub Actions builds the container, checks HTTP routes, renders desktop/mobile
clients, snapshots and restarts. These checks do not prove completed gameplay.

## Still required

- Successful Docker CI and browser run; the local environment has no Docker and
  Chromium cannot create its required socket here.
- Browser account/login flow, tutorial, skills/inventory/combat,
  saved progress after reconnect and process restart, and a real restore drill.
- Durable hosting with verified billing constraints, HTTPS/WebSocket routing,
  private access controls and scheduled off-site backups.
- Asset-rights resolution before an independently hosted public distribution.

The connected Railway project has only an offline unrelated service, no active
server or attached volume. The connector does not establish the account's plan
or available credits. No billable resources were provisioned. Render requires
workspace selection before it can list services. No live JoshRS link changed.

Automatic approval review rejected a direct main-branch push; work is being
submitted through a separate branch for review. Do not interpret this checkpoint
as a deployment or completed game acceptance.

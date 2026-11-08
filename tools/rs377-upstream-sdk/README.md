# Full upstream RS-SDK integration for JoshRS rev377

This is the **actual unmodified upstream RS-SDK**, not a rewritten "RS-SDK-like" toy API. The full [MaxBittker/rs-sdk](https://github.com/MaxBittker/rs-sdk) source is pinned to commit `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`. RS-SDK is distributed under its own MIT licence; retain upstream copyright/licence notices. The code is installed locally as a **private optional dependency** rather than copying its enhanced rev225 server/client and replacing JoshRS rev377.

## What ships

- `JoshRS-Install-RSSDK.cmd` launches PowerShell 5.1 installer.
- `deploy/jparris-windows/Install-RSSDK377.ps1` verifies the existing JoshRS runtime, requires Git/Bun, fetches EXACT pinned upstream source into a **new isolated** `runtime/jparris-377/upstream-rs-sdk-<SHA>` folder, installs dependencies with lifecycle scripts disabled, and never touches content, engine, client, saves or account databases. Existing checkout is never overwritten. `-CheckOnly` is strictly read-only.
- `run-isolated.ts` dynamically imports the full upstream `BotSDK` and `BotActions` classes from the local pinned checkout. `--check` is offline; `--observe`, `--walk x z` and `--script /absolute/path/to/agent.ts` require the authenticated loopback gateway and a disposable `Harness...` account.
- `live-botsdk.client.ts` runs in GitHub Actions against an **actual disposable native 377 server and session**, not synthetic state. It confirms authenticated full-state streaming and an ordinary packet action using the real unmodified upstream class. An independent native observer rechecks the result and the existing probe validates save/relogin.

## Installation

Download **only** [`JoshRS-Install-RSSDK.cmd`](../../JoshRS-Install-RSSDK.cmd) to Windows Downloads or Desktop and double-click it. The launcher locates your existing `C:\\JoshRS-Launcher\\JoshRS-main` installation and downloads the missing PowerShell helper from a **fixed, reviewed Git commit** after checking its exact Git blob hash. It will not overwrite an existing helper. It first runs read-only checks, asks permission, and keeps the result visible. Git for Windows and Bun must be present. If either is missing, it reports exactly that and changes nothing. **Do not delete the JoshRS runtime to install the SDK.**

Read-only source check after installation from the JoshRS source directory:

```powershell
$env:RS377_UPSTREAM_SDK_HOME = 'C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\upstream-rs-sdk-db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb'
bun .\tools\rs377-upstream-sdk\run-isolated.ts --check
```

The SDK will **not** connect to your family game merely by being installed. To connect an isolated test bot, first configure the separate native 377 observer and gateway described in `tools/rs377-chatgpt-bridge/README.md`, and supply its ephemeral token through `RS377_SDK_TOKEN` in the local process environment. Do not print or commit tokens or save files.

For authorised local isolated testing only:

```powershell
$env:RS377_SDK_GATEWAY_URL = 'ws://127.0.0.1:18883/gateway'
$env:RS377_SDK_BOT_USERNAME = 'HarnessProbe'
$env:RS377_SDK_WORLD_ID = 'isolated-joshrs-ci-377'
# Obtain RS377_SDK_TOKEN from your separate local disposable gateway; never post it here.
bun .\tools\rs377-upstream-sdk\run-isolated.ts --observe
```

The server needs to be **actually running in isolated profile** with the corresponding local loopback port and one-time token. Without that, `--observe` refuses. The family port (52402) and several reserved server ports are explicitly blocked. `--script` exposes the real upstream `sdk` and `bot` API to an explicitly selected local agent module exporting `async function run({sdk,bot})`.

## Acceptance and limits

The SDK's upstream source and classes are complete. **JoshRS's rev377 adapter does not yet support every upstream action.** Only the native observer/allowlisted rev377 packet actions are admitted; unsupported SDK operations return a failure rather than directly invoking server scripts, writing account saves or pretending to perform a quest. Some upstream features (Grand Exchange, advanced UI, routefinding, full combat) are specific to its modified game and need independently grounded 377 adapters.

Full autonomous Alfred Grimhand Barcrawl (ten pubs, card, final hand-in and true relog) remains an **explicit further acceptance test**. Never equate a source audit, compilation, SDK import, packet send or movement with Barcrawl completion. Never use private family accounts as test fixtures.

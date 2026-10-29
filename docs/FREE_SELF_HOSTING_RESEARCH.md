# JoshRS free self-hosting research
Researched 30 October 2026 (Australia/Sydney). Prices/quotas are provider-published, not guarantees. No hosting purchased or provisioned.

## Decision

**Best technical route: an existing, always-on personal computer, Docker, a persistent local disk, and Tailscale Personal + Serve.** It avoids a hosting subscription and gives private mobile/desktop access. Electricity, internet and hardware are not literally free. No suitable host has yet been identified or connected.

**Best cloud candidate: Oracle OCI Always Free A1.** Its current documented non-paid allowance is **2 OCPUs / 12 GB RAM**, not the widely repeated 4 / 24. Availability and reclamation are significant limitations. ARM compatibility of this exact JoshRS build still needs testing.

Neither route resolves permission to use Jagex assets. Infrastructure feasibility and asset permission are separate questions.

## What this game actually needs

The merged implementation runs Node 24, an ongoing world simulation, browser HTTP/WebSocket traffic, login/friend/logger workers, SQLite accounts and binary character files. A single authoritative process must own world state. Durable data is `/data/db.sqlite` plus `/data/players/`.

An object bucket, SQL database, static website, or temporary CI runner alone cannot replace that process. Moving only accounts to a hosted database leaves character saves vulnerable. The existing engine supports SQLite/MySQL; plugging in Postgres is not a configuration-only change.

Observed locally: cache packing and world startup succeeded, 10,938 scripts and 7,322 NPCs loaded. Installed engine checkout including dependencies/cache was about 452 MB; content checkout about 122 MB. These are disk measurements, **not RAM measurements or Docker image size**. No sustained RAM/CPU benchmark or player-capacity test has been completed.

For a home trial, reserve **4 GB RAM and 10 GB free SSD space** as a conservative engineering starting point, not an upstream minimum. Measure startup peak, idle usage and multi-player load before reducing resources.

## Hosting comparison

| Option | Ongoing free suitability | Persistence / limitations | Decision |
|---|---|---|---|
| Existing home computer | No provider subscription; power/internet remain | Real local disk; uptime depends on sleep, power and connectivity | First choice if suitable hardware already exists |
| OCI Always Free A1 | Documented ongoing allowance | Home-region capacity; idle reclamation; ARM build untested | Best cloud candidate, conditional |
| Google Compute Engine free tier | Narrow eligible VM/storage allowance | US regions; free outbound allowance excludes Australia | Poor fit for Josh in Dubbo |
| Railway Free | $1/month resource credit; 0.5 GB RAM and 0.5 GB volume limits | No demonstrated 24/7 budget or memory fit | Not a verified free solution |
| Render Free | Free web process, but sleeps after inactivity | Local SQLite/saves lost on restart; no free persistent disk | Reject for current storage design |
| Vercel Hobby | Suitable for the launcher | Functions are bounded; not an unchanged persistent world host | Keep launcher only |
| Fly.io trial | 2 VM-hours or 7 days | Ends; then payment needed | Trial, not durable free hosting |
| AWS new-customer free plan | Up to six months / credits | Time/credit limited | Trial, not indefinitely free |
| Cloudflare/Tailscale tunnel | Networking layer, not compute | Requires another computer to run the world | Complement a host |
| GitHub Actions | Temporary build/test execution | Not durable game hosting | Use for verification only |

Sources: [OCI](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Google](https://docs.cloud.google.com/free/docs/free-cloud-features), [Railway pricing](https://railway.com/pricing), [Railway resource pricing](https://docs.railway.com/pricing), [Render](https://render.com/docs/free), [Vercel limits](https://vercel.com/docs/functions/limitations), [Fly trial](https://docs.fly.io/about/free-trial), [AWS](https://aws.amazon.com/free/free-tier-faqs/).

Railway's separate “free VM” offer is a 60-minute build window with 24 hours to claim; unclaimed files are deleted. Its preview initially works only from the creating IP. It does not solve ongoing hosting. [Official offer](https://railway.com/free-vm)

## Home-hosting architecture and procedure

Phone/desktop → Tailscale private HTTPS hostname → Serve proxy → host loopback port 8888 → Docker world → persistent volume.

Tailscale Personal currently lists $0, six users and unlimited user devices. Serve offers private HTTPS access; access rules still apply. Use a personal plan, not an unexamined business trial. [Pricing](https://tailscale.com/pricing), [Serve](https://tailscale.com/docs/features/tailscale-serve), [CLI](https://tailscale.com/docs/reference/tailscale-cli/serve).

1. Identify an existing personally owned host and its OS, RAM, free disk and uptime. Do not use a school/client computer without its owner's authorisation.
2. Install Docker Engine/Compose on Linux, or check Docker Desktop suitability/licensing on the chosen OS. Build the merged `deploy/server/compose.yaml`.
3. Keep only `127.0.0.1:8888` published. Do not forward router ports or expose login, friends, logger or management ports.
4. Install Tailscale on host and phone; join the same personal tailnet. Enable HTTPS as prompted.
5. Run `tailscale serve --bg http://127.0.0.1:8888`. Record its real HTTPS hostname.
6. Change `JOSHRS_ORIGIN` in the Compose environment to that exact HTTPS origin, without a trailing slash/path; recreate the world. The current Compose file hardcodes localhost, so merely exporting a shell variable will **not** change it.
7. Open `https://ACTUAL-HOSTNAME/rs2.cgi` on the phone with Tailscale connected. Verify game WebSocket upgrade, login and reconnect over mobile data, not only home Wi-Fi.
8. Disable host sleep while serving; verify automatic restart after host reboot. Stop the world gracefully before maintenance.
9. Keep the Vercel launcher. Once accepted, give its Play action the private HTTPS game URL. The server would be independently operated, although the URL differs from joshrs.vercel.app. Do not proxy the whole game through Vercel merely to hide that distinction.

Serve is private; Funnel publishes publicly. Do not confuse them. A public launcher link does not grant tailnet access. VPN access does not establish asset rights.

Monthly incremental electricity estimate: measured extra watts × 24 × 30 ÷ 1000 × household price per kWh. Existing always-on hardware may have a smaller incremental cost than a dedicated old desktop.

Cloudflare Quick Tunnels have changing hostnames and no uptime guarantee; their own docs designate them for testing/development. A permanent tunnel still needs a host and appropriate DNS/access setup. [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

## OCI alternative

Use one A1 instance within **2 OCPUs / 12 GB total**, with a 50 GB boot disk in the account's home region. Oracle documents 200 GB combined free boot/block storage and five volume backups. Verify current console eligibility before creation; do not rely on old tutorials or trial credits.

An account normally needs identity/phone/card verification. Oracle says the card is not charged unless upgraded. Keep the account on the free plan; do not upgrade to PAYG just to chase capacity. Capacity errors can require waiting. Idle instances can be reclaimed, so independent backups are necessary. Do not manufacture CPU load to defeat reclamation.

Run the same private Tailscale architecture, initially without public game ingress. Validate the ARM image/compiler, startup and gameplay before choosing it over an existing x86 host.

[Resource rules](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [account/trial rules](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm).

## Corrections to common advice

- Vercel WebSockets became generally available on **20 October 2026**. “Vercel cannot do WebSockets” is outdated. Hobby Functions still have a documented 300-second maximum under Fluid compute; connections follow invocation limits. This does not provide durable SQLite/files or an unchanged always-running world. [Announcement](https://vercel.com/changelog/websocket-support-is-now-generally-available), [limits](https://vercel.com/docs/functions/limitations).
- Vercel Daemons initially offer neither persistent filesystem storage nor incoming HTTP serving. They are not a drop-in solution either. [Daemons](https://vercel.com/daemons).
- Render's free database expires after 30 days; it is not a permanent persistence workaround. [Render](https://render.com/docs/free).
- Google lists free e2-micro usage only in selected US regions and excludes Australia from the stated outbound allowance. “Free VM” is not “free delivery to Australia”. [Google](https://docs.cloud.google.com/free/docs/free-cloud-features).
- Railway's $1 credit is a budget, not unlimited compute. At its published $10/GB-month RAM rate, an illustrative 0.5 GB used continuously costs $5/month for memory alone, before other resources. This is arithmetic, not a measurement of JoshRS. [Pricing](https://docs.railway.com/pricing).

## Asset rights: what research actually established

The pinned LostCity Content README explicitly separates MIT-licensed source from Jagex-owned assets. The engine/code licence cannot grant permission for assets owned by someone else. [Upstream README](https://github.com/LostCityRS/Content/blob/65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe/README.md).

Jagex's current Fan Content Policy (version 1.4, 29 September 2026), section 6.1.3, excludes private game servers using its property. Section 14 describes seeking a separate agreement. Therefore free, private, non-commercial hosting and attribution are **not evidence of permission**. This is a reading of published policy, not a jurisdiction-specific legal opinion. [Policy](https://legal.jagex.com/docs/policies/fan-content-policy).

Available routes: obtain a suitable written permission; replace protected assets/content with independently created or appropriately licensed material and audit provenance; or keep the upstream external play link. A replacement-content project would not be the complete authentic historical game Josh requested. We have neither obtained permission nor completed such a replacement. No request/email has been sent.

## Gameplay, persistence and restore acceptance

Existing [successful CI](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/40951856065) proves Docker build/start, protected HTTP routes, visible desktop/mobile canvas without page errors, and backup/restart. It does **not** prove tutorial completion, gameplay or restored character progress.

Run the following on the selected durable host, record commit/image digest, device/browser, timestamps and expected/actual results:

1. Create a unique test account through browser login. Reject a wrong password and confirm ordinary privileges.
2. Complete tutorial using normal gameplay; verify NPC dialogue, inventory, equipment, movement and a quest step.
3. Earn a known item and XP increment; record item/count, skill XP, quest state, coordinates and bank contents.
4. Log out/relogin; repeat on desktop and real Android portrait/landscape. Check keyboard, touch actions, camera and inventory.
5. Disconnect network then reconnect. Verify no duplicate login, duplicated rewards, lost items or stranded session.
6. Log out, gracefully stop/restart the container, then verify the recorded account state.
7. Back up using `sh deploy/server/backup.sh`; encrypt/copy the archive to a separate existing storage destination. Never commit account databases or saves.
8. Restore into a **new empty volume and separate test instance**. Check SQLite integrity, account login and all recorded state. Compare with source backup. Do not test by overwriting the live volume.
9. Reboot the host and repeat login. Separately test abrupt process failure on disposable test data; document recovery/loss window.
10. Test two concurrent accounts, monitor CPU/RAM/disk for a full session, and verify a 24-hour idle/restart cycle.
11. Only then replace the primary JoshRS Play target.

Proposed operation: nightly consistent backups with brief announced downtime, retain seven daily and four weekly copies, keep one encrypted off-host copy, and repeat restore monthly. These are proposed settings, not an installed schedule. Choose retention after measuring archive size and available storage.

## Current outcome and next dependency

PR #1 is merged at `86d7f3eccc565ce4863061d928fa1aea0ef489fe`. The free-host research is complete; independent durable hosting and full acceptance remain incomplete. No new billing arrangement, public game service, private-device access or asset permission was created.

The next concrete infrastructure dependency is access to a suitable existing personal host, or an eligible OCI account with available capacity. A connected Railway account and a Vercel launcher are not that host. The asset-permission question remains separate.

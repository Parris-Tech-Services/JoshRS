# JoshRS real host evidence — read-only capture (2 Nov 2026)

**Purpose:** distinguish GitHub Linux/Windows CI from actual Fedora AVANCE-WS7 and Windows JParris Desktop machine facts. Never claim game login or shared world based solely on TCP ports or hashes.

These commands do not install, start, stop, restart, update, migrate, alter a firewall, read a player save/database/private key or supply game credentials. Do not share raw logs, environment files, passwords, account saves or private keys.

## A. Fedora AVANCE-WS7

In the actual Fedora terminal (not GitHub Actions or the Windows VM):

~~~bash
cd /home/josh/dev/JoshRS || exit 1
node tools/rs377-bot-preflight/fedora-preflight.mjs
~~~

If the checkout differs, run the same committed script from the actual JoshRS checkout; do not use Git reset, clean, pull or check out an agent's live worktree simply to get the diagnostic. It prints OS/tool versions, Git branch+SHA+tracked dirty flag, source hashes, process-owner visibility and listener categories. It does not test network connectivity or bot login. Review any local paths before sharing.

## B. Windows JParris Desktop

Open PowerShell on JParris Desktop itself, not the Windows 11 virtual machine. Use the following download-then-run command:

~~~powershell
$p=Join-Path $env:TEMP 'joshrs-windows-readonly.ps1'
Invoke-WebRequest 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/tools/rs377-host-evidence/windows-readonly.ps1' -OutFile $p
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $p
~~~

If the configured launcher is not at C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json, pass the correct file with -ActiveStatePath 'C:\...\active.json'. The script will not scan drives or guess a source world.

Output is JSON with timestamp, computer name, Windows version, local interface addresses, listening PIDs/process names on ports 52402, 8888, 8898, 53402 and 8988, and hashes for explicitly configured checked-in source files. It never reads .env, command-line arguments, saves or SQLite.

These are a snapshot of the Windows host. Running the command inside the VM reports the VM instead and does not prove JParris Desktop's identity.

## C. Read-only private network check from Fedora

Read the current JParris Desktop LAN IPv4 from step B (it may have changed). If Fedora and the Windows host have a permitted private route:

~~~bash
cd /home/josh/dev/JoshRS || exit 1
node tools/rs377-net-doctor/doctor.mjs --host CURRENT_WINDOWS_LAN_IPV4 --port 52402 --json
~~~

The optional --handshake sends only a two-byte initial probe; a response is not an authenticated login or proof of the correct world. Do not change firewall or public router settings to make this test pass. If there is no safe private route, record NETWORK UNREACHABLE and use existing approved Tailscale connectivity only if configured.

## D. Human visual observations — different from a bot

With the already-running JoshRS game:

1. Record date/time and screenshots from Elrothiro's real Java client and Sylvie's real Java client after both log in.
2. Stand at the same location, observe each other's character, make one ordinary walk, and confirm the movement appears on the opposite client's screen.
3. Optional, with consent: one innocuous public-chat message and an online/offline Friends status check.

This can establish two human clients in one active world, not that an autonomous bot exists or works. It does not require a server restart or game files being changed.

To verify an actual bot, obtain a separately authorised disposable bot account and genuine normal #377 authentication + authenticated native observations, then collect independent Elrothiro/bot Java-client evidence and real action/tick changes using the acceptance format in tools/rs377-companion-contract/README.md. No cheat/admin actions or direct save edits. The current published gateway has no verified live deployed adapter; do not assume one exists.

## What to provide back for assessment

- Fedora read-only preflight output, after reviewing local paths.
- Windows read-only JSON output, after reviewing local IPv4 addresses.
- If accessible, the Fedora private net-doctor JSON.
- Timestamped screenshots or logs from the actual clients documenting what really happened, with irrelevant names/chat redacted.

Do not provide passwords, tokens, private keys, full .env, player .sav files, database files or unsanitised console logs.

## Strict verdict distinctions

| Gate | Pass evidence |
| --- | --- |
| GitHub CI | Workflow jobs passed at the exact commit SHA |
| Fedora machine preflight | Actual AVANCE-WS7 command output with UTC/local timestamp + source SHA |
| Windows machine preflight | Actual JParris Desktop read-only JSON + process listeners |
| Fedora-to-Windows reachability | Net-doctor's outbound private TCP probe |
| Shared world for two human players | Independent visible-client login/movement observations |
| Disposable native bot login | A real isolated #377 engine/normal account login and real observer (not simulated fixture) |
| Same-world Elrothiro bot | The authorised bot appears in Elrothiro's actual authoritative world with matching identity/tick and independent Java-client proof |
| Playable autonomous bot | No-cheat movement/interactions/XP/inventory/dialogue/persistence verified as observed deltas, not merely packets sent |

All gates except GitHub CI are UNVERIFIED until their specific actual-host outputs have been obtained and reviewed.

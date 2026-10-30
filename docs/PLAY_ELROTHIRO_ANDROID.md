# Play the real Elrothiro on Android — no separate game world

JoshRS 377 is a personalised **Windows Java client and local server**, with player data under the active engine's `data/players/main`. The `joshrs.vercel.app` Woodlands page is not that engine and does not have the live Elrothiro save.

## Free, practical interim option: LAN stream from Windows

This uses [Sunshine](https://app.lizardbyte.dev/Sunshine/) (free, open-source host) and [Moonlight](https://moonlight-stream.org/) (free streaming client). It is **remote video + mouse/keyboard control of the real Java client**, not a new browser-based 377 client and not a migration of the account.

1. Make a verified offline Elrothiro backup first using `JoshRS-Backup-Elrothiro.cmd` while the server is stopped.
2. On JParris Desktop, in the current full JoshRS repository, double-click `JoshRS-Play-Android.cmd`. It checks the ACTIVE 377 save's native CRC before offering to install Sunshine via the official Windows `winget` source. Installing Sunshine requires an explicit Y choice and Windows approval. No paid service.
3. Configure Sunshine on **that desktop only** at `https://localhost:47990`. Create a strong local password.
4. Install the official Moonlight client on Android. Pair your phone and Windows host on the **same trusted home Wi-Fi**, using the one-time pairing PIN shown in the Sunshine interface.
5. On JParris Desktop start the **existing JoshRS launcher and Java client**, using the existing account and active server. Stream the desktop from Moonlight and control that same session. Keep the desktop switched on during play.

### Security and limitations

- Don't open router port forwarding or publish Sunshine's pairing/admin interface to the internet. Stick to the LAN until a separate secure remote-access audit.
- Sunshine must be able to capture the Windows desktop and may need administrator privileges for initial installation. User-controlled pairing and permission grants cannot be automated from GitHub.
- A valid Elrothiro `.sav` is **not enough**: the matching account/login record in the ACTUAL host's SQLite DB must also work. If missing, don't overwrite it with an older empty database.
- This does not prove movement, chat, inventory or mobile touch usability. A real user session on the host and phone is required for that.
- No Elrothiro files, account tables or passwords are copied to Vercel, Sunshine's GitHub repository or the public JoshRS project.
- Experimental native browser support remains in `tools/web377-bridge`. It is still transport-only; the Apollo/Lost City login/ISAAC/RSA/cache compatibility is not yet established. We do not call this playable browser-377.

For Windows diagnostic-only mode without optional install:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy\jparris-windows\mobile-existing-game.ps1 -CheckOnly
```

Only `-InstallSunshine` triggers the standard Windows package install; no account creation, game migration, exposed network ports or router edits are performed by the script.

# See a JoshRS bot inside Elrothiro's existing World 1

**Target:** the current JParrisDesktop Windows revision-377 world, usually game TCP 52402 and cache web 8888. **Status:** normal network-client visibility prototype, **not** a full RS-SDK AI quest agent and not yet live-verified on family accounts.

This is **not** the Fedora sandbox. Players in an isolated Fedora disposable world can never appear in JParrisDesktop's already-running game.

## Fedora AVANCE-WS7: the existing local game (9 November 2026)

**Important correction:** AVANCE-WS7 also has its *own* JoshRS rev377
installation at `~/dev/JoshRS/lostcity377`. On 9 November, the operator
backed up the existing `elrothiro.sav` and ran `start-joshrs.sh`, which
returned a launcher PID. **A launcher PID is not proof the TCP/HTTP server
actually started**, and the latest supplied log has no post-launch listener
check.

When intending to see a bot beside the **Fedora** Elrothiro, do not use
Windows PowerShell syntax: Fedora Bash has no `$env:USERPROFILE`, and paths
to source files must use forward slashes. There is already a full checkout at
`~/dev/JoshRS-quest-runner`; there is no reason to clone another copy inside
the live game directory.

**Step 1 — read-only check from a fresh Fedora terminal:**

~~~bash
cd ~/dev/JoshRS-quest-runner || exit 1
git pull --ff-only
bash ~/dev/JoshRS/lostcity377/status-joshrs.sh
node tools/rs377-net-doctor/doctor.mjs --host 127.0.0.1 --port 52402 --json
node tools/rs377-net-doctor/doctor.mjs --host 127.0.0.1 --port 8888 --json
~~~

Verify the **actual intended Fedora family world** is the one listening at
127.0.0.1:52402 and its matching HTTP cache service at 8888. TCP reachability
alone is not sufficient to prove identity; inspect the existing game client
and status output as well. If either port is unavailable, **do not launch the
bot** or guess a different port; investigate the Fedora server status.

**Step 2 — only after both checks pass and the intended world is confirmed:**

~~~bash
cd ~/dev/JoshRS-quest-runner || exit 1
node tools/rs377-family-visible/join.mjs --connect --allow-family --host 127.0.0.1 --bot HarnessView1 --patrol
~~~

Enter a **separate bot password** at the hidden prompt, never the family
player password. This is a normal player login trial. Watch the existing
Fedora Java client in Lumbridge at approximately (3233,3218); if the bot
spawns elsewhere, a patrol packet is not proof of arrival. Ctrl+C stops
the client. A successful login still does **not** mean upstream RS-SDK AI
is attached.

An earlier Windows-command mistake created a second clone with a literal
name `:USERPROFILE\\JoshRS-bot-tools` under the Fedora installation.
This is not where the new tool lives. Leave it alone until its contents
have been inspected; never use an unreviewed recursive deletion command
inside a game/save directory.

## Fastest live test — directly on JParrisDesktop

Do not stop/restart the family server. Open a separate PowerShell or Terminal on that **same Windows PC**. In the JoshRS source checkout containing the new file, with Node 24 or later:

~~~powershell
cd C:\JoshRS-Launcher\JoshRS-main
git pull --ff-only
node tools/rs377-net-doctor/doctor.mjs --host 127.0.0.1 --port 52402 --json
node tools/rs377-family-visible/join.mjs --connect --allow-family --host 127.0.0.1 --bot HarnessView1 --patrol
~~~

If the checkout has uncommitted game modifications, **do not reset/clean/force-pull**. Use a separate source clone rather than changing the active game.

You will enter a separate bot-only password privately (no terminal echo). This sends normal rev377 RSA/ISAAC login and ordinary 377 keepalive/walk packets, not database changes, quest varp writes or teleports. The bot remains for a bounded 120 seconds; stop sooner with Ctrl+C. It uses the public RSA key hardcoded in the pinned real 377 Java client, not the server's private key.

In Elrothiro's Java client, stand around **Lumbridge 3233,3218** and look for HarnessView1. It requests a few small Lumbridge patrol steps. **If a fresh bot spawns on Tutorial Island or another region, the patrol may be unreachable**; no game-state decoding exists yet to detect that. A successful TCP login is NOT independent proof of the bot's location or client rendering. Please share what you can actually see, not an account password or private save.

## Fedora AVANCE-WS7 to existing JParrisDesktop

Fedora is at work and the active world is on Windows elsewhere. A home LAN IP from an old conversation may be stale and is normally **not reachable from an unrelated work network**. Use a confirmed same-LAN connection or existing authorised private VPN/Tailscale tunnel; never open your home router or game port to the public internet.

~~~bash
cd ~/dev/JoshRS-quest-runner
git pull --ff-only
node tools/rs377-net-doctor/doctor.mjs --host CURRENT_PRIVATE_WINDOWS_IP --port 52402 --json
node tools/rs377-net-doctor/doctor.mjs --host CURRENT_PRIVATE_WINDOWS_IP --port 8888 --json
~~~

If **both TCP checks pass** and that private IP is the actual authoritative JParrisDesktop server, run:

~~~bash
node tools/rs377-family-visible/join.mjs --connect --allow-family --host CURRENT_PRIVATE_WINDOWS_IP --bot HarnessView1 --patrol
~~~

Do not attempt to connect to an IP merely because it falls in a private range: verify it belongs to your own PC. CRC download refuses redirects and checks the exact 40-byte length. The account name is restricted to a fresh Harness-prefixed identity, not Elrothiro or Sylvie. No existing account password is read.

## Verified and unverified capabilities

| Gate | Result |
| --- | --- |
| Pinned 377 public RSA, action packet framing, isolated normal login | Existing code/CI evidence; same-world variant unit-tested |
| Target real Windows world through opt-in private IP | Source implemented, actual Fedora/Windows route NOT VERIFIED |
| Bot logged into your family World 1 | NOT VERIFIED |
| Bot visible walking beside Elrothiro | NOT VERIFIED |
| Persistent quest / bank / rewards | NOT VERIFIED |
| True MaxBittker RS-SDK controller | NOT CONNECTED to live family world |
| Full historical quest automation | NOT IMPLEMENTED / NOT VERIFIED |

The script deliberately uses JoshRS's normal Session377 transport rather than claiming to be the full RS-SDK AI. The latter requires live authoritative BotWorldState stream, server-side account observer and quest action playbooks. That existing bridge is restricted to a disposable loopback world and must not be blindly pointed at family port 52402. Once this one-bot visual test passes, implement and validate the real shared-world SDK observer without replacing the family engine or touching old player saves.

## Why not launch the old Fred/George network file?

The previous prototype uses a static plaintext password, has fixed 127.0.0.1 host assumptions, blindly sends movement packets and reconnects forever. This trial uses separate private account authentication, a bounded session, safe stop, no automatic retries, no server restart and no privileged packets.

## Fedora sandbox error fixed separately

The error "only immutable disposable GitHub runner engine is permitted" is the protective CI-only trace patch. The Fedora sandbox script now creates an isolated private directory with a marker and invokes a separately scoped Fedora trace mode. The patch will still **refuse family game directories**, so it should not risk Elrothiro or Sylvie. This lets the disposable test continue; it doesn't join the live Windows game.

## Evidence needed for promotion

S1 private route and native login, S2 visible bot in real Java client, S3 matched account/player server tick and clean save, S4 SDK controller actions confirmed through the real observer, S5 actual full quest/relogin. Source tests and simulated CI cannot substitute for S2–S5.

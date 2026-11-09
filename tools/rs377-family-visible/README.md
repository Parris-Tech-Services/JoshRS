# See a JoshRS bot inside Elrothiro's existing World 1

**Target:** the current JParrisDesktop Windows revision-377 world, usually game TCP 52402 and cache web 8888. **Status:** normal network-client visibility prototype, **not** a full RS-SDK AI quest agent and not yet live-verified on family accounts.

This is **not** the Fedora sandbox. Players in an isolated Fedora disposable world can never appear in JParrisDesktop's already-running game.

## 9 Nov: fewer Agy permission prompts and resuming Cook's Assistant

Agy CLI 1.5.3 accepts the exact flag
`--dangerously-skip-permissions` for interactive sessions. It auto-approves
ordinary tool permission requests, **not a guarantee that commands are safe**.
Some built-in protected operations may still require review; do not interpret
this flag as a safety mechanism. The flag is **opt-in for this one handoff**,
not a persistent global change to Antigravity.

The previously interrupted Agy Cook's Assistant session can resume using
its original conversation ID and original worktree (which may contain
uncommitted, useful changes to `protocol.mjs`). Do not create a new game
character or run a second bot connection. From a **fresh clean source
worktree containing this script**, invoke:

```bash
bash tools/rs377-family-visible/launch-agy-cook.sh \
  --resume-conversation ed46254e-75c9-411b-9d31-7d048c0fe8dd \
  --workspace "$HOME/dev/JoshRS-agy-cook-2CQGiwsR" \
  --dangerously-skip-permissions
```

The launcher validates the saved worktree location, real Fedora game
ports and bot save, waits for any known normal patrol connection to
finish, then prompts privately for the dedicated bot's password.
It resumes Agy with `--conversation=<ID>` **from that original worktree**
and appends `--dangerously-skip-permissions` rather than creating a new
conversation with `-i`. It never pulls/reset-cleans the user's dirty repo,
logs into Elrothiro, restarts the server or edits a save itself. Agy may
still run unsafe commands independently if allowed: protect private
credentials, review unexpected output and avoid using this mode with
untrusted code, chat or downloaded instructions.

For a **new** Cook's Assistant Agy conversation, omit the resume flags
and supply only `--dangerously-skip-permissions`. For normal approvals
omit the dangerous flag entirely. Use `--check` for no-login preflight.

## Handoff to local Antigravity (Agy): HarnessView1 attempts Cook's Assistant

The operator has authorised **Agy to play the dedicated HarnessView1 account
in the already running AVANCE-WS7 Fedora rev377 world**. This is not a
claim that the current patrol, SDK observer or original `rs-jimmy` rev225
integration has completed the quest. The 120-second native patrol cannot
be recontrolled after launch; its TCP session must disconnect first.

Agy needs the installed, authenticated `agy` CLI on Fedora; this GitHub
connector cannot itself operate the local desktop or start that process.

**Interactive UI:** Earlier PR #211 launched `agy -p`, which is headless
and may show no terminal output while it processes the task. The handoff now
prints the task preview and opens `agy -i` with the full prompt already
supplied, showing the normal interactive agent UI and permission requests.
If an earlier headless `agy -p` task is still running, **do not launch a second
copy**; finish/cancel the old task first. No source update edits the live
world or logs into HarnessView1 on its own.

To protect the uncommitted changes in the main JoshRS-quest-runner checkout,
use a **fresh Git worktree** and a foreground handoff:

```bash
repo="$HOME/dev/JoshRS-quest-runner"
work="$(mktemp -d "$HOME/dev/JoshRS-agy-cook-XXXXXXXX")"
git -C "$repo" fetch origin main && git -C "$repo" worktree add --detach "$work" origin/main && bash "$work/tools/rs377-family-visible/launch-agy-cook.sh"
```

This child script does not close the parent Terminal, edit saves, restart
the game or change engine files. It checks local JoshRS TCP/web listeners,
the dedicated bot save and Agy installation. It waits for an existing
HarnessView1 **native join.mjs** controller to disconnect normally
(never kills it), then prompts privately for the **bot-only** password.
The password is provided to this one Agy child process via
`JOSHRS_HARNESSVIEW1_PASSWORD` and must never be printed or stored.

The work instructions are
[AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md](../../docs/rs377/AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md).
Agy must implement an actual native rev377 observation/control path,
run the quest via ordinary NPC/item/dialogue interactions, and verify
its actual quest stage and saved account. If the only installed observer
requires a restart of the live family world, **do not restart it**:
report the exact blocker rather than falsely declaring quest success.
If Agy has no authenticated CLI, or relevant tools are unavailable,
the script fails clearly. It does not secretly run in the background.

Read-only preflight, without a password or AI action:

```bash
bash tools/rs377-family-visible/launch-agy-cook.sh --check
```

## Fedora: safe one-command bot patrol (does not close Terminal)

If a previous command closed your interactive Terminal, the shell command
`|| exit` was wrong: a failed `cd` or `git pull` causes Bash to exit the
current interactive session. The safe commands below **never use `exit` in
the interactive shell**.

Keep JoshRS, its server and Elrothiro running. In a new Fedora Terminal:

```bash
cd ~/dev/JoshRS-quest-runner && git pull --ff-only origin main && bash tools/rs377-family-visible/run-fedora-patrol.sh
```

The child script checks the exact existing Fedora JoshRS ports, the dedicated
bot save and JavaScript syntax. It detects an already-running HarnessView1
controller and refuses a second login instead of producing an auth-code-5
error. If no session is active, it asks for the **bot's own** password, runs
a bounded 120-second ordinary walking pilot, and reports native saved-position
evidence via `POSITION_PROOF`. An unverified result is **not** full RS-SDK
autonomy. It does not restart the game, change a save, kill a process or
run `git pull` internally.

If `git pull` fails, the command stops **without closing Terminal**; copy
the Git error for diagnosis. If the launcher blocks or fails, the parent
Terminal remains available and shows the error. Run the read-only preflight
on its own via `bash tools/rs377-family-visible/run-fedora-patrol.sh --check`.

The earlier commands containing `cd ... || exit 1` are historical examples
and should **not** be pasted into an interactive Terminal.

## Make HarnessView1 add Elrothiro as a friend

The normal 377 client opcode is `FRIENDLIST_ADD=120` with exactly eight
big-endian bytes of the recipient's canonical base-37 name. The pinned engine
decodes it with `g8()` and routes the authenticated bot's normal add-friend
request through its Friends worker. No edits to any player save or account
database are made by this script.

**From AVANCE-WS7 Fedora** with your normal JoshRS server already running,
the bot logged out from its previous timed session, and the bot save now in
Lumbridge:

~~~bash
cd ~/dev/JoshRS-quest-runner || exit 1
git pull --ff-only || exit 1
node tools/rs377-family-visible/join.mjs --connect --allow-family --host 127.0.0.1 --bot HarnessView1 --add-friend Elrothiro --seconds 30
~~~

Enter the separate bot's password privately at the terminal prompt.
This starts one ordinary `HarnessView1` session and dispatches the friends
packet **once**, after the game login. Look for:

`FRIEND_ADD_DISPATCHED: HarnessView1 -> Elrothiro`

**Not a completion receipt:** `Session377` does not decode incoming social
response packets, and the game may have its Friends service disabled.
The line above means the request was dispatched on the authenticated TCP
session, not that the relationship is persisted or Elrothiro shows Online.

To check backend readiness without modifying data, on Fedora:
`ss -ltn '( sport = :45099 )'` shows if the default Friends listener exists.
This listener check does not verify that the game process is registered with
it. If the listener is missing, **do not restart the current live game** to
fix it: preserve Elrothiro's session and inspect the existing server's
FRIEND_SERVER/EASY_STARTUP settings after players log out.

Adding Elrothiro as a friend **from HarnessView1** is directional. The user
has already added HarnessView1 in Elrothiro's client. Friends-only private
chat status additionally requires the friend backend to be active and both
players' chat/privacy settings to allow presence. Never report success from
packet dispatch alone.

## Fix confirmed on 9 November: HarnessView1 was on Tutorial Island

The real user-provided revision-377 save reports **3094,3106,level 0**.
The pinned upstream `Player` constructor spawns at exactly 3094,3106.
Therefore repeated walk packets for Lumbridge 3233,3218 were only **dispatched**;
none proved movement. The previous instructions to search the castle were wrong.

**Immediate optional visibility diagnostic:** a fresh `HarnessView1` bot can be
placed near Elrothiro using a reversible, *bot-only setup fixture*. It is not
legitimate completion of the game's tutorial, not a quest acceptance result
and not the eventual autonomous tutorial playbook. The exact historical
377 server checks varp `tutorial` (ID 281) against `tutorial_complete=1000`
on login; setting coordinates alone is insufficient.

The fixture is read-only unless `--apply --bot-offline` are both supplied.
It verifies save v7 magic, exact original 3094,3106 spawn, no tutorial
progress, original CRC32, ordered permanent varp records, and the bot's
exclusive filename `harnessview1.sav`. It safely creates a private,
timestamped backup of the original bot save, writes atomically and verifies
the modified save. **Never** run against an online bot. It does not read,
modify or rename Elrothiro or Sylvie, does not restart the game, and will
refuse unexpected version/coordinates/tutorial progress.

On **AVANCE-WS7**, after the previous two-minute bot login has finished:

~~~bash
cd ~/dev/JoshRS-quest-runner || exit 1
git pull --ff-only || exit 1
python3 tools/rs377-family-visible/prepare_lumbridge.py
# Only for a partial tutorial (0 < stage < 1000) on HarnessView1:
python3 tools/rs377-family-visible/prepare_lumbridge.py --apply --bot-offline --allow-progressed-tutorial
node tools/rs377-family-visible/join.mjs --connect --allow-family --host 127.0.0.1 --bot HarnessView1 --patrol --seconds 600
~~~

The first Python command only reports what would be changed, including the
**actual saved tutorial progress value**. Earlier versions refused nonzero
values outright; the user has now confirmed this bot is **in progress**, so a
separate `--allow-progressed-tutorial` flag is required before overwriting its
tutorial stage. This is strictly a temporary visibility fixture; it does not
count as playing or completing Tutorial Island. **Check that the displayed
account, source position, and checksum are correct before the second command.**
The second command refuses every other filename and any completed/unexpected
tutorial state, creates a timestamped bot-only backup, validates CRC32, and
does not change other permanent variables. For a genuinely untouched
`tutorial=0` bot, use `--apply --bot-offline` without the extra flag. The last command starts the normal bot and asks for the
separate bot password privately. In Elrothiro's Java client, look near the
Lumbridge castle courtyard (3233,3218). Remain logged into the same world.

If the first command refuses (CRC, source position, tutorial progress or
missing bot file), **do not force it**, reset anything or edit the character
save manually. If `BOT_ONLY_TEST_FIXTURE_APPLIED` prints but the player is
still not visible, the next defect is player-update parsing/rendering or
server session state—not navigation. Record the outcome and investigate
those packets rather than falsely claiming multiplayer success.

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

## Verify bot's actual persisted movement (Fedora only)

Only one `HarnessView1` login can be active at a time. After any
existing patrol has finished, in a **new Fedora Terminal** run:

```bash
cd ~/dev/JoshRS-quest-runner && git pull --ff-only
node tools/rs377-family-visible/join.mjs --connect --allow-family --host 127.0.0.1 --bot HarnessView1 --patrol --seconds 120 --verify-position
```

Enter the existing dedicated HarnessView1 password (not Elrothiro's).
The controller sends ordinary #377 walking requests, disconnects normally
after two minutes and waits briefly for the *server* to save the account.
It does not edit a save or restart the server.

**9 Nov 2026 correction:** The original 120-second patrol dispatched 21 walk
requests and its last requested destination (3233,3217) exactly matched the
bot's initial saved tile (3233,3217). Therefore a final unchanged save could
be a genuine round trip **or** ignored movement. The pilot now records
`POSITION_PROOF_PLAN` and holds a waypoint different from the starting tile
for its last 30 seconds. The only accepted evidence remains a changed,
server-persisted native save after the bot disconnects. No position change is
still `UNVERIFIED`; it is not proof that the client or server ignored packets.
Do not restart the world or directly alter any save to force a passing result.

`POSITION_PROOF` with `PERSISTED_POSITION_CHANGED` means the server
persisted a different real coordinate in Lumbridge. If the result says
`UNVERIFIED`, the bot might not have moved; the command will not claim
success from a sent packet alone. Even a changed saved position is not
proof of visual rendering, individual walking steps or RS-SDK autonomy.

If a patrol is **still active** with a known PID, you can alternatively
monitor it without another login (replace the PID with the current one):

```bash
node tools/rs377-family-visible/verify-patrol.mjs --pid 794093 --watch
```

The watcher must start before the bot disconnects. It never alters or
kills any process and only reads HarnessView1's own native save.

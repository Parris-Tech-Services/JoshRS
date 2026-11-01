# JoshRS 377 cross-host network doctor — ChatGPT task 14/42

**Purpose:** distinguish *DNS resolution*, *selection of a private target*, *outbound TCP connection*, an optional *initial rev-377 login-hello response*, and the higher **unproven** gates of authenticated game login and same-world identity. This is a safe diagnostic, **not a bot client or an account-login test**.

From the Fedora worktree (Node 20+):

```sh
node tools/rs377-net-doctor/doctor.mjs --host YOUR_PRIVATE_SERVER_HOST --port 52402 --json
# Optional only when checking the game's first login-hello response:
node tools/rs377-net-doctor/doctor.mjs --host YOUR_PRIVATE_SERVER_HOST --port 52402 --handshake --json
node --test tools/rs377-net-doctor/test/*.test.mjs
```

Use the actual private DNS name/IP of the host where Elrothiro plays. For a Tailscale IP, use the peer's 100.64.0.0/10 address. No hostname/IP is presumed from past conversations. The tool intentionally refuses exclusively public DNS targets and never opens a listening socket, changes firewall rules, reads saves or passwords, asks for player credentials, launches a game client, or sends a login packet. It resolves a DNS name once and connects to the selected **private IP directly** to reduce DNS-rebinding risk. It reports only a count of resolved addresses and an eligible private IP.

Default mode: DNS + TCP probe, close immediately. The **opt-in** `--handshake` sends exactly two initial bytes, `[14,0]`, as observed in `tools/rs377-bot-bench/fred-george-family-client.mjs` on `main`. It collects up to 17 response bytes, then closes. An observed 17-byte response is **NOT** proof it is the correct revision-377 engine, that the same world is connected, or that a player could log in. No further authentication bytes are ever sent.

Results are intentionally layered:

| Result | What it proves | What it does NOT prove |
| --- | --- | --- |
| DNS RESOLVED | Name resolves to one or more addresses | Network route or game process |
| PRIVATE_TARGET_SELECTED | Chosen IP belongs to private, loopback or Tailscale ranges | Peer is really a Tailscale identity or correct game host |
| TCP CONNECTED | A listener accepted outbound TCP | RuneScape listener is healthy / authenticated |
| RESPONSE_OBSERVED_UNVERIFIED | The initial `[14,0]` probe received 17 bytes | Server revision, same world, credentials or game login |
| worldIdentity UNVERIFIED | Deliberate gate: no secure world fingerprint available to this doctor | No game/world conclusion may be drawn |
| actualPlayerLogin NOT_TESTED | No credentials, login or gameplay actions were sent | Login failure/success cannot be inferred |
| sameWorldAsElrothiro UNVERIFIED | No two-client shared-world observation | Nothing about companion visibility |

To **actually** verify those last gates, an authorised operator/Agy must identify the active authoritative server through its local process config, session/world ID and engine source revision; establish a normal *disposable bot account* login in an isolated game first; independently verify the bot's server identity and movement in the **same** world as Elrothiro from two actual Java clients; then test safe logout/relogin. Those are separate acceptance tests, not something DNS/TCP/handshake can certify.

Security/scope: all sockets are **outbound**; the only listener is a 127.0.0.1 ephemeral mock in automated tests. IPv4 loopback/RFC1918/link-local/100.64.0.0/10 and IPv6 loopback/ULA/link-local are accepted; use a VPN/private route rather than expose gameplay or management ports publicly. No untrusted public DNS addresses are contacted. This script uses no external dependencies, sudo, privileged ports, server restarts, firewall changes or account credentials.

**Evidence:** `node --test tools/rs377-net-doctor/test/*.test.mjs` (offline mock and policy regression). Passing tests prove only script behaviour; Fedora connectivity and live world remain unverified until run there.
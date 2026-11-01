# Task 5: Network topology

Source-backed design: a Fedora bot controller uses an ordinary revision-377 client connection to the same authoritative game world as the human player. The controller is not itself necessarily the game server.

GitHub configuration: deploy/jparris-windows/upstreams.json declares gameplay port 52402 and web port 8888 and pins Engine-TS, Content and Client-Java. These are configuration values, not observations of running processes.

Historical Fedora evidence: AVANCE-WS7 previously used /home/josh/dev/JoshRS. Current checkout, service ownership, route and world identity are unverified.

Historical Windows evidence: a 1 November diagnostic identified a JoshRS launcher and a web listener but did not show a gameplay listener. Current state is unverified.

Unknown current facts: the authoritative host and process, whether the game listener is active, Fedora-to-server reachability, bot authentication, matching world identity, mutual visibility and persistence.

Proposed flow:

Fedora controller -> guarded SDK adapter -> normal 377 bot client -> authoritative game world <- normal human game client.

Verification order: identify the authoritative process without disruption; establish private connectivity; perform ordinary bot authentication; verify both clients share the same world; observe normal movement and interactions; verify reconnect and persistence. A TCP port, test fixture, or second server is insufficient proof.

Responsibilities: ChatGPT maintains source notes and offline tests; the local operator verifies actual processes and two-client gameplay. Do not change production services, accounts or saves or publish sensitive details during this mapping task.

Status: topology documentation complete; live-world verification belongs to later tasks and remains unknown.

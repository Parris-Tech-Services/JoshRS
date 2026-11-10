# Android revision-274 family portals — isolated integration

**Status: PARTIALLY COMPLETE — source adapter + tests. NOT INSTALLED ON PHONE, NOT VERIFIED PLAYABLE.**

Created 10 November 2026 as a version-aware starting port of the Fedora/home revision-377 fast-travel convenience feature. It is NOT the 377 Java world-map overlay, not Jagex-original content and not evidence of physical portal models. No copyrighted cache, map or player save is included.

## What exists

- Named travel destinations: Lumbridge, Varrock portal hub, Falador, Draynor, Al Kharid, Edgeville, Port Sarim, Seers' Village, Ardougne and Catherby.
- In-game chat commands: **::destinations**, **::destinations fal** (filter), **::ft lumbridge**, **::hub**, **::back**, **::lasttele**, **::portal** (list) or **::portal draynor** (travel). These are 274-only custom convenience commands.
- Engine-authoritative teleport via the real 274 player.teleJump with the engine map-zone checks and explicit success/failure verification. Only allowlisted IDs, never client-supplied coordinates. Per-session return position, 1.5-second cooldown, blocking when busy or logging out.
- **Disabled by default** and gated by BOTH JOSHRS_PORTALS274_ENABLED=1 and an explicit comma-separated JOSHRS_PORTALS274_USERS allowlist. A public tunnel alone does not enable travel.
- Safe **dry-run first** installer: no world starts, stops, rebuilds, credentials, data or saves. --apply --disposable must be explicit. It refuses the canonical ~/lc274 live world and checks upstream handler anchors. Creates a backup of modified SOURCE (not a player-save backup).

## Related source evidence

- [Fedora 377 travel functionality](../../../docs/fedora-377/FEDORA_377_LOCAL_README.md): world map, search, categories, favourites/recent, dangerous-travel confirmation and Varrock portal hub. The 377 client disabled a legacy purple teleport animation due to an invisible-player regression.
- [377 command integration](../../rs377-bot-bench/engine-patch/src/network/game/client/handler/ClientCheatHandler.ts): tele_dest, hub, back, lasttele, destinations. The 377 TeleportNetwork dependency is **not in public JoshRS**. This 274 adapter is NOT a byte-for-byte port.
- [274 launch mechanism](../start-playable-274.sh); [machine boundaries](../../../START_HERE.md); [274 quest-port build blockers](../../../docs/quests/PORT_STATUS_2026-11-10.md).

The destination tiles are **provisional town-centre coordinates, NOT verified walkable portal landing tiles**. Each must be tested in a disposable client for collision, scene and region rebuild, safe spawn and quests. Do not add dangerous/gated destinations without research and permissions.

## Check and install only in a separate, idle disposable 274 engine

From the JoshRS checkout on the **Android phone in Termux**. Use the actual isolated engine at ~/dev274/engine (or a similarly named isolated checkout) and NEVER ~/lc274.

Run these independently:

    node --test tools/play274/portal-network/PortalNetwork274.test.mjs

    python3 tools/play274/portal-network/install.py --engine ~/dev274/engine

    python3 tools/play274/portal-network/install.py --engine ~/dev274/engine --apply --disposable

Do not run this while another agent is editing the same handler. Preserve local dirty changes first. The installer only changes disposable source and never starts/restarts the game.

For an isolated **manual** dev-server test, set:

    export JOSHRS_PORTALS274_ENABLED=1
    export JOSHRS_PORTALS274_USERS='your-disposable-test-username'

Run a real 274 compile/pack and the isolated server using approved, separate ports, database and player files. Never point the tests at ~/lc274 or a family account. The 10 November ~/dev274 quest imports currently block builds; fix or quarantine that issue before attempting gameplay verification.

## Acceptance — do not infer success from source tests

- [x] Source adapter and opt-in ACL/coordinate allowlist implemented
- [x] Unit tests supplied for permissions, back/lasttele, cooldown, failed jump and guarded installer
- [ ] CI and actual rev274 build/pack in a real disposable engine
- [ ] Normal logged-in 274 browser client invokes the commands successfully
- [ ] Validate every landing tile for walkability, scene load, proximity and quest gating
- [ ] Two-player travel/return isolation, logout/relogin and restart persistence
- [ ] Adapt **touch-friendly map/selector and physical portal objects** for 274 separately; the 377 Java overlay cannot be pasted into a browser client
- [ ] Owner-approved promotion with backups and rollback plan

**This branch is not a live Android deployment.** Do not claim a finished portal system until genuine in-world travel has been proven. Keep independent from Claude's home rev377 quest work and the 26 attempted Android quest imports.

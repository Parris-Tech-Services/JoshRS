# JoshRS Windows Agent Manager (isolated rev377 prototype)

Purpose: create and control disposable native RuneScape 377 network agents on JParrisDesktop, without Fedora or editing RS-SDK files.

Status: local UI, profile management, goal selection, native TCP bridge and pause/resume/stop are implemented. Windows/Linux CI tests use synthetic adapters. Real disposable-world dual-client acceptance is separately tracked in native 377 PR #126. This manager is NOT certified for the family world or complete upstream RS-SDK questing.

## Easy Windows launch

From a full JoshRS source checkout, double-click JoshRS-Agent-Manager.cmd, or run this PowerShell 5.1 script from C:\JoshRS-Launcher\JoshRS-main:

    & '.\deploy\jparris-windows\Start-JoshRSAgentManager.ps1'

Open http://127.0.0.1:18886 on the same desktop. The web server is strictly loopback-only and validates a same-origin anti-CSRF secret.

Create a HarnessA-style profile. Goals available now are Idle and Explore. Starting a bot requests its separate disposable account password. The password is used only in memory for that session; it is not written to the profile, log or GitHub. A profile is not a game account: the server must accept a normal login or account registration.

Explore moves via an authenticated, legal rev377 ISAAC game packet and counts a successful move only if the real engine observer later reports the matching coordinates. Pause stops new actions. Stop requests an orderly TCP disconnect, not a server kill. The manager reports save verification as incomplete until a normal relog.

Profiles contain only bot name and selected goal, saved locally under ignored runtime/jparris-377/agent-manager. The manager never edits an account SQLite database or the player's native save file.

## Mandatory separate world

The manager refuses the family world. It uses active.json to resolve an existing separate native 377 engine without modifying it. It requires:

- A profile such as NODE_PROFILE=joshrs_ci_377 or isolated-test with normal NODE_XPRATE=1.
- RS377_OBSERVER_ENABLED=true and RS377_OBSERVER_ISOLATED=true.
- A strongly authenticated loopback RS377_OBSERVER_TOKEN, RS377_OBSERVER_WORLD set to an isolated world fingerprint, and RS377_OBSERVER_SOURCE_SHA pinned to the engine.
- RS377_OBSERVER_BOTS explicitly listing permitted disposable Harness accounts, up to four, and WEB_MANAGEMENT_PORT.
- Separate private game/web ports. The family TCP port 52402 and profile main are rejected.

Do not enable these flags on the live family server merely to make the manager start. Running in production must wait for a fully reviewed and backed-up deployment.

## What is verified and what is missing

The native rev377 packet/observer/SDK-shaped action bridge already has real isolated-world movement and save/relog evidence. The actual upstream MaxBittker BotSDK class has been verified with a synthetic-state WebSocket gateway (PR #123). The observer still cannot supply all client-side UI dialogue labels, quest, bank, shop and combat fields required to claim a full BotWorldState. The current manager uses the typed rev377 subset, not the full upstream quest API.

The remaining work is complete native client/UI decoding, fully grounded SDK state, real upstream SDK controllers in the same world, observed quest and skills, proper credential lifecycle, and an independently verified opt-in family-world rollout. No bot should be described as completing a quest until actual game state confirms it.

CI includes Windows and Linux source parsing, isolated config guards, two synthetic agent lifecycles, observed movement, pause and stop, and rejection of family-world ports and account names. All these are separate from genuine JParrisDesktop gameplay verification.

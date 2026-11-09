# Live-family RS-SDK quest integration (Fedora AVANCE-WS7)

Operator approval: **9 November 2026** the owner authorised one controlled
server restart and bot-only SDK integration, preserving Elrothiro, Sylvie and
all existing progression. Do not ask for this same approval again. It does
NOT authorise resetting saves/DB, destructive cleaning, or deploying to
other accounts.

**Current status: SOURCE CANDIDATE ONLY, NOT LIVE DEPLOYED.** GitHub has no
terminal/shell connection to AVANCE-WS7. A source push does not start a
server or prove an in-world quest. The locally running Agy/Fedora agent
must install and genuinely verify the integration.

## Components

- The family-capable observer/SDK bridge is opt-in and restricted to
  HarnessView1 with fingerprint family-joshrs-377. Default remains
  strictly disposable-only. A live engine must serve genuine passive
  observations for its authenticated normal network bot.
- run-fedora.mjs logs in as HarnessView1, uses genuine 377 RSA/CRC/ISAAC
  network packets, validates a token-protected loopback native observer,
  and exposes a single-controller loopback upstream BotSDK gateway.
- The first Cook's Assistant playbook tries the entire normal dialogue,
  egg, cow milk, wheat, windmill, flour and hand-in sequence. Every real
  step must produce independently observed game-state evidence.
- The historic 104 quests + seven miniquests are a catalogue, NOT 111
  executable or verified full quest scripts.

## Local deployment checklist — authorised, preservation first

1. Fetch JoshRS main into a fresh detached Git worktree. The existing
   ~/dev/JoshRS-quest-runner checkout has local modifications; NEVER
   reset, clean or force-pull it.
2. Read-only inspect the ACTUAL server source, current process launch method,
   database/backing files and existing env variable NAMES, never paste tokens.
   Confirm a single live world on 52402 and real config at 8888/8898.
3. Stage exact source changes in an isolated private build directory, not the
   running engine. Review the customised Player.ts, World.ts and web.ts.
   Port ONLY the limited hooks from:
   - tools/rs377-bot-bench/engine-patch/src/engine/observer/Native377Trace.ts
   - tools/rs377-bot-bench/engine-patch/src/web.ts (observer route only)
   - content-factory/patch_377_sdk_trace.py (consult exact matching anchors).
   This last patcher intentionally REFUSES touching a live world. Preserve it.
   Do NOT overwrite the whole custom live web.ts or start a second world.
   Rebuild and test the staged engine before touching live sources.
4. Have Elrothiro and Sylvie log out cleanly. Stop ONLY the actual server
   using its original known service method, not an arbitrary Node PID.
   Take a private, fully verified, consistent offline backup of all accounts,
   the active DB, engine source/config, content scripts, and original launcher.
   Check checksums and prepare an exact rollback. Never commit or upload backups.
5. Install only staged, reviewed, compiling changes. Preserve existing
   live content and original server startup method. Configure deliberate
   opt-in environment gates:
   ~~~text
   RS377_OBSERVER_ENABLED=true
   RS377_OBSERVER_FAMILY=true
   RS377_OBSERVER_ISOLATED=false
   RS377_OBSERVER_FAMILY_APPROVED=HarnessView1@2026-11-09
   RS377_OBSERVER_BOT=HarnessView1
   RS377_OBSERVER_WORLD=family-joshrs-377
   RS377_OBSERVER_SOURCE_SHA=<real checked 40-hex engine source revision>
   RS377_OBSERVER_TOKEN=<private random 32+-byte value>
   NODE_PORT=52402
   WEB_PORT=8888
   WEB_MANAGEMENT_PORT=8898
   NODE_XPRATE=1
   ~~~
   Preserve every other live env setting. The observed route must require
   a real active normal HarnessView1 login, long private token, actual 600ms
   ticks and 1x XP. It must bind to 127.0.0.1 only; no LAN/public exposure.
6. Start the real server once via its ORIGINAL launcher. Check normal player
   logins, world integrity, inventory, bank, quests, QP and saves for both
   family accounts. Roll back immediately upon any unexpected data change.
7. In the fresh worktree, install/check pinned original RS-SDK:
   ~~~bash
   bash tools/rs377-fedora-quests/setup-fedora.sh --install
   export JOSHRS_FAMILY_SDK_APPROVED=HarnessView1
   export RS377_FAMILY_SERVER_INSTRUMENTED=true
   bun tools/rs377-live-quest-bridge/run-fedora.mjs --check
   bun tools/rs377-live-quest-bridge/run-fedora.mjs --run
   ~~~
   The runner prompts PRIVATELY for the live observer token and separate
   HarnessView1 password; do not paste secrets in any chat or terminal args.
   It owns only temporary loopback port 18883, no daemon or restart.
8. Validate real Cook dialogue and all three ingredients, 300 Cooking XP,
   stage 2, the 1 QP reward, legitimate network logout/relogin, and no
   duplicate reward. Check the actual Java client and replay evidence.
   If any genuine interaction fails, diagnose its source. Do not mark
   it complete from an SDK fixture or packet dispatch.

## Safety

Never use production data in disposable tests. No direct save/varp edits,
teleports, admin completions or command shortcuts. No other player's
credentials or full data are given to the bot. Only one HarnessView1
controller/login at a time. CI success is not an in-world playthrough.
A missing source anchor, inability to stop safely, invalid backup or
incomplete observer means BLOCKED rather than guessing.

## Read-only preliminary commands

~~~bash
git -C ~/dev/JoshRS-quest-runner fetch origin main
git -C ~/dev/JoshRS/lostcity377/engine status --short
ps -eo pid,lstart,args | grep -E '[l]ostcity377/engine|[s]tart-server'
ss -lntp | grep -E ':(52402|8888|8898|18883)\b'
~~~

These commands do not restart or change the world. The actual server
deployment cannot be claimed until Agy/the Fedora host has run and
verified the steps above.

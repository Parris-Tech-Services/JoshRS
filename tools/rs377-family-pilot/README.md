# Fedora same-world companion visibility pilot

This pilot is **not yet full RS-SDK autonomy**. It reuses the authentic
JoshRS #377 client session / native packet library to connect a **separate**
ordinary account named `HarnessScout` to the **already running family game**
on `127.0.0.1:52402`. It sends ordinary fixed Lumbridge walk inputs **only when a dedicated bot save is already confirmed in the nearby Lumbridge patrol region**. The
SDK-equivalent observation/quest features still need a reviewed engine
integration. It does **not** edit the family engine, restart the server or
modify Elrothiro's save.

Only run while your Fedora JoshRS server and Elrothiro are already playing.
This script does not handle Tutorial Island. An account must first complete that tutorial through normal in-game actions, and be saved in Lumbridge. It never uses Elrothiro's login password.

## Easy launch on Fedora (separate Terminal; keep the game open)

```bash
cd ~/dev/JoshRS-quest-runner && git pull --ff-only origin main
node tools/rs377-family-pilot/pilot.mjs --check
read -rsp 'New HarnessScout bot password: ' JOSHRS_BOT_PASSWORD; echo
JOSHRS_FAMILY_PILOT_APPROVED=YES JOSHRS_BOT_PASSWORD="$JOSHRS_BOT_PASSWORD" node tools/rs377-family-pilot/pilot.mjs --run
unset JOSHRS_BOT_PASSWORD
```

If `--check` says `TUTORIAL_ISLAND`, **stop there**: the bot must complete
its normal Tutorial Island course first. A walking packet toward Lumbridge
cannot bypass the island. The existing Fred/George `tickTutorialIsland`
code is a distinct server-side engine integration, not this network client.
Do not alter any .sav coordinates or quest flags to move the bot.

If `--check` says `LUMBRIDGE_PATROL_AREA` and `--run` says
`NORMAL_BOT_CONNECTED`, add `HarnessScout` to Elrothiro's
Friends list and look near Lumbridge. Printed walk dispatch alone does **not**
prove movement. Verify that Elrothiro actually sees and can interact with the
new player. The script does not fabricate any gameplay success. Stop with
Ctrl+C in the bot Terminal, **not** by closing or restarting JoshRS.

If login is rejected, copy only the error reason (never passwords or keys).
A new normal account may need to be registered first; this pilot will not
modify accounts in the SQLite database or spawn privileged players.

## Scope and limitations

- Loopback only, explicit `JOSHRS_FAMILY_PILOT_APPROVED=YES`, name pinned
  to `HarnessScout`. No automatic reconnect or remote server.
- Reads existing Elrothiro save existence only. Reads the server PEM locally
  solely to derive the corresponding **public key**; does not upload a key.
- Reads only the dedicated HarnessScout save's position for safe routing;
  normal gameplay remains the only way to move or progress the bot. 
  Does not open or change any other player's save.
- Does not use upstream `BotSDK`, a live observer, AI planning, quests or
  verified save/relog. This pilot is a stepping stone, not task completion.
- Can reconnect an existing **dedicated** HarnessScout account only with its
  correct bot-only password and only if it has legitimately reached Lumbridge.
  It cannot launch on Tutorial Island, elsewhere, or when the bot save is missing.
- No unattended or family-world login occurs in CI. Tests are offline.

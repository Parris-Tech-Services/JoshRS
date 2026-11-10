# rs377-quest-playtest

`dialogue_test.mjs` plays NPC conversations and quests over the real revision-377 protocol, against an **isolated** world only. It refuses port 52402, web port 8888 and any path under `JoshRS-Launcher`.

What it does:
- logs in (RSA + ISAAC), sends `::cheats` (the isolated world runs with `NODE_PRODUCTION=false`, so test accounts get dev cheats);
- `talk`: spawns a temporary copy of the NPC on the tester's tile (`::npcadd`, so wandering villagers behind fences don't break tests), then Talk-to (`OPNPC1`);
- answers dialogue: "continue" (`RESUME_PAUSEBUTTON`) or a menu option (`IF_BUTTON` on `multiN:com_k`);
- records every line shown (`IF_SETTEXT`) and game message (`MESSAGE_GAME`);
- tracks NPCs from `NPC_INFO`, and varps sent to the client (`VARP_SMALL`/`VARP_LARGE`);
- logs out, waits for the save, and reads quest varps and items back from the `.sav`.

```powershell
$env:ISO_ENGINE_DIR='...\iso377\engine'; $env:ISO_PORT='52502'; $env:ISO_WEB_PORT='8990'
node tools/rs377-quest-playtest/dialogue_test.mjs expansions/joshrs-quests/the-peace-shirt/evidence/playtest_full.json
node tools/rs377-quest-playtest/dialogue_test.mjs tools/rs377-quest-playtest/burgh_voices_smoke.json
```

Steps: `tele`, `cheat`, `wait`, `talk` (+`choices`), `relog`, `expectText`, `expectNoText`, `expectInLastTalk`, `expectSaved {varp,value}`, `expectSavedItem {obj,count}`, `expectVarpSent {varp,value}`.

`burgh_voices_smoke.json` talks to all 25 Burgh de Rott characters and works through every topic. Last run: 49/50. The one "failure" is by design: Radu's third topic leads into the quest offer, and declining it ends the conversation.

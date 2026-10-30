# JoshRS 377 — one autonomous server-side woodcutter (experimental)

**Status:** opt-in source patch for **LostCityRS/Engine-TS `377-wip`**. **Verified in disposable GitHub Actions world:** compiled, started, active virtual player slot 1, selected real APLOC tree at 3099,3242, and gained a log plus 250 internal Woodcutting XP. [Full workflow evidence](https://github.com/Parris-Tech-Services/JoshRS/actions/runs/41004614145). **Not installed or personally play-tested on Josh's Fedora server.** Existing human game saves and public JoshRS launcher are unchanged.

## What this first bot does

- Creates exactly **one** non-network `Player` named **oakwalker** in Draynor, visible to nearby real users through the ordinary player list.
- Supplies a bronze axe in its own **ephemeral** inventory.
- Searches nearby *real* revision-377 world locations for an ordinary level-1 tree with the server-defined `Chop down` interaction.
- Walks and invokes the **native** APLOC woodcutting RuneScript, not a fake movement animation or directly awarded XP/logs.
- Respects active scripts, movement and delays; retries every 15 ticks.
- Stops when its inventory is full. **Banking, talking, trading, farming, quest completion, long-distance navigation, character persistence and recovery are NOT implemented in this first slice.**
- Has no bot password, external network client, third-party service or ongoing AI API fees.
- Remains disabled by default and does not launch until explicitly enabled.

**Safety:** An artificial `Player` has no login-thread account. The patch excludes this single synthetic object from account autosaves/logout writes. It never changes human player saves. It must still be tested after a local restart, preferably with a backup and test world first.

## Installation on your own Fedora game server

Find your **actual** existing branch-377 Engine-TS directory; recent experiments have used `~/lostcity377/engine`, but your newer JoshRS working copy may be under `/home/josh/dev/JoshRS/`. Inspect the actual layout first and do not assume either path.

If this JoshRS repo is checked out at `/home/josh/dev/JoshRS`, run:

```bash
cd /home/josh/dev/JoshRS
git pull --ff-only
node scripts/install-lostcity377-woodcutter.mjs /path/to/your/377-wip/engine
```

The first command is a **dry run**. It validates the upstream branch, source anchors and destination without touching anything. If validation passes, install:

```bash
node scripts/install-lostcity377-woodcutter.mjs /path/to/your/377-wip/engine --apply
cd /path/to/your/377-wip/engine
npx tsc --noEmit
```

Backups of all modified source files are stored under `engine/.joshrs-bot-backups/<timestamp>/`. Do **not** run this against a modified source if patch validation fails; review differences instead of force-overwriting files.

When you're ready for a controlled world restart, make a backup of actual player saves, stop the 377 server gracefully, then start it from the verified engine directory:

```bash
JOSHRS_WOODCUTTER=1 npm run quickstart
```

`npm run quickstart` avoids the extra `npm install` performed by `npm start`. The bot's own startup log should report **one woodcutter queued**. Look for `oakwalker` in Draynor and watch whether it actually approaches a tree, receives logs and Woodcutting XP.

To disable, restart normally *without* setting `JOSHRS_WOODCUTTER=1`. Removing the patch completely requires restoring the backed-up `src/app.ts` and `src/engine/World.ts` and deleting `src/engine/bot/WoodcutterBot.ts` after taking a fresh copy of any local source edits.

## Fedora live acceptance (not yet verified)

1. Server starts on its existing ports with `JOSHRS_WOODCUTTER=1`; exactly one `oakwalker` appears, no duplicates after restarts.
2. Second real client logs in independently and **sees** oakwalker in Draynor (not a fake NPC).
3. Oakwalker finds a real ordinary tree, walks to it and chops using the actual engine.
4. Logs appear only through native game mechanisms; Woodcutting XP changes appropriately. There is no arbitrary resource award.
5. Existing human account bank, XP, inventory and quest progress remain unchanged after server restart.
6. Without the flag the bot does **not** spawn; when it reaches a full inventory it stops and reports why.
7. Observe process memory/CPU and logs for at least 15 minutes. No world tick crashes or duplicate wood.

**This is experimental source integration, not a claim of working production gameplay.** The upstream 377-wip branch is still a work in progress; scripts or assets may behave differently than expected. It is intended only for a self-operated development game with appropriate content permissions.

## Next improvement once the above passes

Implement real bank interactions (not silent inventory transfers), persistent bot character state, controlled re-logins, logging/health metrics, and finally quest/social/trade behaviours in separate individually tested slices. Don't install five copies or scale this prototype before the first bot passes the seven acceptance checks.

Source inspected: `LostCityRS/Engine-TS` branch `377-wip`, including `World.ts`, `PlayerLoading.ts`, `OpLocHandler.ts`, `Player.ts`, `PathingEntity.ts`, `Zone.ts` and `LocType.ts`.

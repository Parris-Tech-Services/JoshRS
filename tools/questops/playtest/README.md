# Server-side playtest harness (revision 274)

This harness lets an agent check its own quest work without the game client. It starts the real Lost
City engine in-process on the **dev** world and logs in a test player that has no network connection.
It then calls the same server functions that client clicks reach: walking up to and talking to an NPC,
dialogue buttons, varps, and save/reload. Ticks run back-to-back, so a scenario finishes in seconds.

It reports what it finds as plain text, one `PASS`/`FAIL` line per step. A `FAIL` names what was
expected and what was actually there:

```
PASS  3 expectNpcNear {"npc":"lost_tribe_sigmund","radius":5}
FAIL  4 talk {"npc":"lost_tribe_sigmund"}
    talking to lost_tribe_sigmund produced no dialogue after 30 ticks
```

## Run

```sh
cd ~/dev274/engine          # the dev world's engine, already packed (start it once if not)
npx tsx ~/joshrs/tools/questops/playtest/run.ts ~/joshrs/tools/questops/playtest/scenarios/lost-tribe-start.json
npx tsx ... run.ts <scenario.json> --dump    # also print every dialogue line and option after each step
```

The harness refuses to run in `~/lc274`. It never writes a save file: on save/reload it removes the
pending logout save before the login thread can write it. Stop the dev server first, because both use
the same ports.

## Scenario steps

| step | fields | checks |
|---|---|---|
| `teleport` | `x z [level]` | |
| `expectNpcNear` | `npc [radius x z level]` | the NPC (debugname) is within `radius` (default 3) of the player or of x/z |
| `talk` | `npc [op]` | Talk-to (op 1) produces dialogue within 30 ticks |
| `continue` | `[times]` | presses "Click here to continue" |
| `continueAll` | | continues until a choice appears or the dialogue ends |
| `choose` | `option` | presses the one option containing this text (case-insensitive) |
| `expectDialogue` | `text` | text was seen since the last `talk` |
| `setVar` / `expectVar` | `varp value` | |
| `expectPerm` | `varp` | varp is `scope=perm`, so `Player.save()` writes it |
| `saveReload` | | save, remove the player, load the save, continue on the reloaded player |
| `ticks` | `n` | |
| `dump` | | print the current dialogue screen |

Write a scenario by running `talk` and `dump`, then turning the printed options into `choose` steps.

## Static check that goes with it

`node tools/questops/check-quest-points.mjs <content>` finds each quest's stage variable, which is the
one its scripts compare with `^..._complete`. It fails when:

- the stage variable isn't `scope=perm`, or it is a varbit whose base varp isn't. Progress is then lost
  at logout.
- the quest is missing from `[proc,count_questpoints]`. `%qp` is recalculated from that list at every
  login, so the quest's points vanish at the next login.

Stock 274 content passes with no problems.

## Limits

- This is the server only. It can't show a missing model, a black map region, or a broken interface;
  those need the client.
- `harness.ts` uses engine internals (`World.process*`, `removePlayer`, `logoutRequests`). If the engine
  version changes, boot fails with a message naming the missing function.

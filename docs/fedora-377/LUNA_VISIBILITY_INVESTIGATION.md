# Luna visibility investigation — 2026-10-30

Status: **BLOCKED for live activation and visual acceptance.** Local timeout
repair is tested but not deployed. Luna is not verified visible or following.

## Existing session evidence

- Live server PID 3801491 started at 16:57:52; client PID 3818040 started at
  17:00:56. Both remained running during this investigation. No restart,
  relaunch, injected command, or debugger attachment was used.
- `/tmp/joshrs-luna-current-session.png` is a capture of the existing client
  window. It shows Elrothiro but no identifiable Luna beside the player.
  This fails visual acceptance; it is not a successful bot screenshot.
- The live log records an earlier Luna position of 3213,3372,0 beside a
  player position of 3212,3372,0. These are historical, not current coordinates.
- Luna's save timestamp is 16:58:56, exactly one minute after the logged spawn
  at 16:57:56. This is consistent with the forced timeout below, but is not
  direct inspection of present world membership.
- Current coordinates, planes, slots, world membership, received Luna packets,
  decoded appearance and model state were not directly measured in the live
  process. Management exposes metrics, not a player-inspection endpoint. Its
  zero-valued player gauge also has zero world histogram observations, so it
  was not used as evidence that the world is empty.

## Concrete server lifetime defect

`World.processLogouts` applied both socket-response deadlines to `BotPlayer`.
Only `NetworkPlayer.decodeIn` refreshes those timestamps; Luna has no socket.
After 100 ticks, the no-response branch sets `loggingOut` and forces logout,
even though her combat/logout lock is effectively infinite. The existing
socketless-player exception did not guard this earlier forced-logout branch.

The local patch exempts `BotPlayer` from both network deadlines, preserving
human-player deadlines and world shutdown. No follow, teleport or skill
behaviour was changed.

## Source pipeline traced, not live rendering proof

1. `spawnDevelopmentBots` assigns a world player slot, adds the player to
   `playerLoop`, calls `rsbuf.addPlayer`, enters the map zone and queues login.
2. `BotPlayer.tickBot` uses `teleJump` to reach the target. `teleJump` and
   `PathingEntity.teleport` update zone presence, movement flags and appearance.
   This direct path does not call `spotanim`; the default spot animation is -1.
   The prior local-player teleport appearance workaround does not prove that
   Luna's remote model renders, nor rule out animation/model issues elsewhere.
3. `World.processInfo` sends coordinates, slot, plane, activity, masks and
   generated appearance into `rsbuf.computePlayer`.
4. `PlayerInfoEncoder` filters visibility/range/plane, emits additions and
   subsequent movement, and attaches appearance update blocks. The earlier
   player-add field-order correction matches `Client.getPlayerNewVis`.
5. The Java client builds remote `ClientPlayer` objects, applies appearance
   with `method574`, and inserts visible players through `pushNpcs(false)`
   (despite that method's misleading name). `ClientPlayer.method239` returns
   no model without decoded appearance or if body model construction fails;
   the scene also suppresses duplicate occupants of a centered tile.

These are source traces. None establish Luna's actual received player slot,
appearance or non-null model in the user's current session.

## Verification performed

- `tsx tools/test/BotLifetimeRegression.ts`: four checks passed. A socketless
  bot survives sampled deadlines through one hour of virtual ticks; a
  responsive human stays online; human response and connection timeouts still
  apply; world shutdown still marks the bot for logout. Runs in an isolated
  process without listeners or save writes.
- `npm run lint -- --quiet`: passed.
- `tsc --noEmit`: passed.
- Earlier full appearance/speech packet decoder checks and 11 teleport suites
  passed. They do not satisfy live visual acceptance.

## Exact blocker and remaining acceptance

The live process runs `tsx src/app.ts`, without automatic code reload. It
still contains the old timeout logic. Bots spawn at world startup, and there
is no existing supported runtime bot respawn/inspection API. Loading the fix
and recreating Luna through the normal path requires a server restart, which
the user explicitly prohibits. Do not bypass this by injecting runtime code,
restarting either process, or replacing the bot with a different implementation.

After an explicitly authorized maintenance window: load the tested fix,
inspect both world members and their client state, capture both characters
together in the real client, then verify following, plane/region changes and
continued visibility beyond the old 60-second deadline. Until those checks
pass, report Luna as BLOCKED or PARTIALLY COMPLETE, never working.

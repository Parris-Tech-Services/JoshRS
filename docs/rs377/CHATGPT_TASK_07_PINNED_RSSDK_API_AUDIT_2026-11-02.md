# Task 7 — Pinned RS-SDK API audit

Source pin: MaxBittker/rs-sdk commit db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb.

## Verified API contracts

- sdk/index.ts: BotSDK provides getState and raw action dispatch; dispatch does not prove gameplay effect.
- sdk/actions.ts: BotActions provides higher-level effect-observing operations.
- sdk/types.ts: BotWorldState requires tick, inGame, player, skills, inventory, equipment, nearby NPCs/players/locations, ground items, messages, dialogue, interfaces, shop, bank, combat events and prayers. A position-only fixture is insufficient.
- sdk/types.ts: BotAction includes walkTo, interactNpc, interactLoc, pickupItem, useInventoryItem, useItemOnLoc, clickDialogOption and wait. JoshRS draft PR 62 translates these eight types but has no complete native transport.
- sdk/types.ts: ActionResult.phase distinguishes validation, routing, dispatch, observation and completion.
- server/gateway/types.ts: bot sends connected, state and actionResult; SDK sends sdk_connect and sdk_action; gateway sends sdk_state and sdk_action_result. actionId correlates requests.
- server/gateway/gateway.ts: gateway routes bot and SDK WebSocket sessions and stores last state.
- mcp/server.ts: exposes execute_code, disconnect_bot, list_bots and market access. Arbitrary execution must be sandboxed, not enabled on the production host.

## Important compatibility gaps

1. SDK uses a different game client; connecting its headless client directly to revision 377 will not work.
2. NPC type ID differs from NPC world index; loc plane and dialogue page guards must be validated.
3. BotWorldState.revision is a publication cursor, not the RuneScape protocol revision.
4. Upstream observe mode can still send chat; enforce truly read-only JoshRS observations.
5. Existing native377 login and walking code in draft PR 62 does not decode incoming world state.
6. A successful raw action acknowledgement must never be reported as a completed movement, resource collection or quest.

## Adapter design

BotSDK connects to a private authenticated WebSocket gateway. An isolated sidecar translates allowlisted actions into normal revision-377 client packets. A separate bot-scoped read-only observer supplies genuine server ticks, position, skills, inventory, nearby entities and UI state. The gateway correlates actionId, refuses stale states and prevents competing controllers. Verify effects after real ticks and save/relogin.

## Status

Source API audit complete. Real SDK integration, Fedora execution and live gameplay remain unverified and are separate tasks.

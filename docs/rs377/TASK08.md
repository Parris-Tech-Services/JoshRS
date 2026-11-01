# Task 8 — RS-SDK and 377 capability matrix

| Capability | Status | Evidence |
|---|---|---|
| Normal login | needs live validation | PR62 native377/client.mjs, codec.mjs |
| Movement | needs live validation | opcode 28 MOVE_GAMECLICK in native377/client.mjs |
| Keepalive | supported | opcode 40 NO_TIMEOUT in native377/client.mjs |
| Wait | supported offline | PR62 harness.mjs, rssdk-actions.mjs |
| NPC option | needs source implementation | RS-SDK interactNpc; PR62 action mapping only |
| Loc option | needs source implementation | RS-SDK interactLoc; PR62 mapping only |
| Ground pickup | needs source implementation | RS-SDK pickupItem; PR62 mapping only |
| Inventory option | needs source implementation | RS-SDK useInventoryItem; mapping omits interfaceId |
| Item on loc | needs source implementation | RS-SDK useItemOnLoc; mapping only |
| Dialogue | needs source implementation | RS-SDK clickDialogOption; guarded pageId rejected |
| Public chat | needs source implementation | RS-SDK say; no native sender |
| Private message | needs source implementation | RS-SDK privateMessage; engine MessagePrivateHandler.ts |
| Player interaction | needs source implementation | RS-SDK interactPlayer; engine OpPlayerHandler.ts |
| Bank and shop | needs source implementation | RS-SDK bankDeposit, bankWithdraw, shopBuy, shopSell |
| Combat, spells, prayer | needs source implementation | RS-SDK spellOnNpc, togglePrayer |
| Player coordinates and tick | needs source implementation | BotWorldState.player and tick; native client hasWorldState=false |
| Skills, XP, inventory, equipment | needs source implementation | BotWorldState.skills, inventory, equipment |
| Nearby NPC, player, loc and items | needs source implementation | BotWorldState.nearbyNpcs, nearbyPlayers, nearbyLocs, groundItems |
| Dialogue and chat observations | needs source implementation | BotWorldState.dialog, gameMessages |
| Friends presence | not supported | absent from BotWorldState; separate social preflight |
| Action result observation | needs source implementation | ActionResult.phase; harness fixture only |
| SDK WebSocket gateway | needs source implementation | server/gateway/types.ts; native client is TCP |
| Privileged state mutation | not supported | PR62 guard.mjs |

Source pins: MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb sdk/types.ts, sdk/actions.ts and server/gateway/types.ts; JoshRS draft PR62 tools/rs377-agent-harness/src and test; JoshRS main tools/rs377-bot-bench. These are code-level classifications, not observed live gameplay. Eight mapped action shapes are not eight working packets. The harness snapshot differs from SDK BotWorldState and requires a versioned adapter. Incoming game packets are not decoded; do not equate dispatch with observed movement. Derive missing packet IDs from pinned 377 sources, never guess. No runtime tests were run for this document.

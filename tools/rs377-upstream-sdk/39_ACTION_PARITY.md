# JoshRS revision 377 — complete 39-action RS-SDK boundary

**Exact upstream:** [MaxBittker/rs-sdk](https://github.com/MaxBittker/rs-sdk/tree/db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb) at `db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb`, `sdk/types.ts`, original MIT licence. The *same* full upstream SDK remains installed separately; we adapt its actions to pinned native-377 packets rather than replacing the user's game server.

**Precise statuses:** `native` = source-grounded client-to-server 377 action; `guarded` = real packet only when the bot's native UI/client confirms the target; `read` = actual bot-observed state without a packet; `client` = requires enhanced client-local input and is not an authenticated server action; `absent` = feature not implemented by pinned 377. None of these labels means a full game playthrough or relog has passed.

| # | Upstream BotAction | Mapping in JoshRS 377 | Source/UI requirement and limitation |
|---|---|---|---|
| 1 | `none` | Read-only | Confirm no-op; no packet |
| 2 | `wait` | Read-only | Waits for authoritative native tick count, no packet |
| 3 | `talkToNpc` | Native | Visible NPC slot, OPNPC1 |
| 4 | `interactNpc` | Native | Visible NPC slot, OPNPC1–5 |
| 5 | `interactPlayer` | Native | Actually visible other-player slot, OPPLAYER1–5 |
| 6 | `clickDialogOption` | Guarded | Matching current suspended PAUSEBUTTON component/page |
| 7 | `clickComponent` | Guarded | Must be in actually open UI's observed options, IF_BUTTON |
| 8 | `clickComponentWithOption` | Guarded | Visible inventory/bank/shop component and item slot, INV_BUTTON / OPHELD |
| 9 | `acceptCharacterDesign` | Client | Unavailable without a grounded Java design screen; IDK_SAVEDESIGN requires real body-kit/colour state |
| 10 | `randomizeCharacterDesign` | Client | Requires enhanced native client/local design state |
| 11 | `walkTo` | Native | Bounded ordinary ISAAC MOVE_GAMECLICK; a real destination change is required for success |
| 12 | `useInventoryItem` | Native | Actual backpack slot and observed inventory component |
| 13 | `useEquipmentItem` | Guarded | Observed worn item plus actual `wornitems:wear` component; never guesses component from wornitems:worn |
| 14 | `dropItem` | Native | OPHELD5 `[opheld5,_]`; special quest drop handlers still run |
| 15 | `pickupItem` | Native | Valid ground object visible to bot and normal OPOBJ1 |
| 16 | `interactGroundItem` | Native | Visible ground object, options 1–5 |
| 17 | `interactLoc` | Native | Visible native location and options 1–5 |
| 18 | `shopBuy` | Native | Real opened shop stock; 1, 5, 10 only via INV_BUTTON2–4, component 3900 |
| 19 | `shopSell` | Native | Real opened shop and player item; 1, 5, 10 only, component 3823 |
| 20 | `closeShop` | Native | Only when the shop modal is actually open; CLOSE_MODAL |
| 21 | `closeModal` | Native | Only when a native modal is genuinely open |
| 22 | `setCombatStyle` | Guarded | Requires known combat style plus observed component ID; otherwise refuses |
| 23 | `useItemOnItem` | Native | Two distinct observed backpack items, OPHELDU |
| 24 | `useItemOnLoc` | Native | Observed item and visible location, OPLOCU |
| 25 | `useItemOnNpc` | Native | Observed item and NPC slot, OPNPCU |
| 26 | `say` | Native | Original native rev377 WordPack encoder, MESSAGE_PUBLIC; max 80 characters, no lossy input |
| 27 | `privateMessage` | Native | Native 64-bit name37 + WordPack, MESSAGE_PRIVATE; only valid 377 names/messages |
| 28 | `spellOnNpc` | Guarded | Actual visible magic component and NPC, OPNPCT |
| 29 | `spellOnPlayer` | Guarded | Actual visible magic component and player, OPPLAYERT |
| 30 | `spellOnItem` | Guarded | Actual visible magic component and backpack item, OPHELDT |
| 31 | `spellOnGroundItem` | Guarded | Actual visible magic component and ground object, OPOBJT |
| 32 | `setTab` | Client | TUT_CLICKSIDE is merely a server notification; no native 377 client UI change proven |
| 33 | `bankDeposit` | Native | Real opened bank and item; 1, 5, 10 or entire stack, INV_BUTTON1–4 on component 2006 |
| 34 | `bankWithdraw` | Native | Real opened bank and item; 1, 5, 10 or entire stack, INV_BUTTON1–4 on component 5382 |
| 35 | `searchGE` | Absent | Grand Exchange feature does not exist in this historical 377 content |
| 36 | `submitCountDialog` | Guarded | Must observe actual current-tick numeric count modal before sending RESUME_P_COUNTDIALOG |
| 37 | `scanNearbyLocs` | Read-only | Authoritative bot-owned current-plane nearby locs, radius 1–16, no mutation |
| 38 | `scanGroundItems` | Read-only | Authoritative bot-visible ground items, radius 1–16, no mutation |
| 39 | `togglePrayer` | Native | Actual observed prayer state/points/level, original prayer IF_BUTTON components 5609–5623 |

**Source proof:** `verify-native-action-sources.py` checks original 377 `ClientGameProt` IDs, shop/bank scripts, `[opheld5,_]` drop and 15 prayer components. `verify-upstream39.mjs` compares this exact 39-variant manifest against the immutable upstream `sdk/types.ts`, not a copied test list.

**Effect proof:** The native SDK WebSocket gateway sends only allowlisted player packets. After dispatch it observes subsequent authenticated server state and only returns successful completion when the requested effect is corroborated (inventory/stock/bank changes, prayer change, dialogue/page advancement, real chat acknowledgment, quest varp, etc.). If effect cannot be proven before the deadline, it reports **failure with `observation_timeout`**, never a fabricated success. Some actions with no observable client state will remain blocked.

**Quantity boundary:** Original 377 bank `X` requires a separate *server-originated count dialog*. Until the client bridge can observe that dialog and its native tick, arbitrary amounts other than 1, 5, 10 or all remain explicitly unsupported rather than issuing a speculative second packet. Shops only expose 1,5,10.

**Further work still OPEN:** exact-payload real 377 live acceptance for all mapped opcodes, enhanced client-local actions (design/tab), and the full autonomous Barcrawl (10 ordinary pub interactions, guard hand-in, save/relog) in a disposable world. The family world, Elrothiro/Sylvie saves and active custom content must not be altered by CI or SDK tests. Mapping **does not close** issue #181.

# Agy task: HarnessView1 completes Cook's Assistant beside Elrothiro (JoshRS 377, Fedora)

**User authorisation (9 Nov 2026):** Agy may control the user's dedicated
`HarnessView1` bot account and use ordinary gameplay to complete
**Cook's Assistant** in the **existing Fedora JoshRS rev377 world**.
Do it end-to-end within your current CLI session wherever technically possible.
Do not stop at a plan, GitHub PR or packet-dispatch message.
No additional user confirmation is needed for routine in-game decisions.

## Exact target, source and current facts
- Josh's Fedora host: AVANCE-WS7, local game installation
  `/home/josh/dev/JoshRS/lostcity377`.
- Existing game TCP: **127.0.0.1:52402**; web/cache **127.0.0.1:8888**.
- Human account **Elrothiro** is logged into the same world near Lumbridge;
  **never log into, control, log out or edit Elrothiro**, Sylvie or any family account.
- The normal authenticated player `HarnessView1` was **visually confirmed**
  beside Elrothiro at Lumbridge. Its previous `join.mjs` patrol was
  a time-limited 120-second native 377 client. The outer launcher must wait
  for that controller to exit before starting Agy.
- You are working in a **separate Git worktree** to protect uncommitted changes
  in `/home/josh/dev/JoshRS-quest-runner/tools/rs377-chatgpt-bridge/src/protocol.mjs`.
  Never stash/reset/clean/checkout that original working tree.
- An older `rs-jimmy` MCP server and rs-sdk bot target rev **225**. DO NOT use
  it as a bridge into this rev377 world, reuse Jimmy's saves or change its port.
- All controller credentials are for `HarnessView1` **only**. The launcher
  provides `JOSHRS_HARNESSVIEW1_PASSWORD` in the child environment. Read
  it without logging the value, writing it to files, including it in shell
  history, sending it to web services, or committing it to Git.

## Completion contract
1. **One controller / no disruption.** First check read-only whether a
   HarnessView1 session remains connected, whether live ports match the above
   real world, and whether the normal 377 player save exists. Never launch a
   duplicate account controller or force logout. Do not restart/replace the
   family engine, client, account database, Content build, or any world
   process while Elrothiro plays.
2. **Own the actual native rev377 session.** Use one normal authenticated
   `Session377` controller with native game packets. Existing source:
   `tools/rs377-chatgpt-bridge/src/{session,protocol}.mjs`,
   `tools/rs377-family-visible/{join,verify-patrol}.mjs`.
   The visible fixed-waypoint patrol is NOT autonomy and has no world decoder.
   You cannot attach to its old TCP session retroactively. Give Agy the
   controller after that client disconnects. Do not use `rs-jimmy`.
3. **Ground the state before actions.** Investigate the actual running
   revision-377 engine, logs, packet state, client UI and any already-installed
   read-only observer. A full SDK observer exists in separate **isolated**
   test code but is NOT automatically installed in the current family world.
   Do not falsely map isolated telemetry to the live world or invent NPC
   indices, item/loc IDs, dialogue labels or inventory. If read-only state
   isn't accessible, implement and verify a genuinely safe local client-side
   observation/controller integration, and test it in a separate world first.
   Never introduce an unauthenticated TCP/WebSocket gateway.
4. **Play Cook's Assistant legitimately.** Consult installed historical
   content scripts to identify the correct quest stage and NPC/objects for
   this exact 377 server, then carry out its true game sequence with
   ordinary normal-player interactions: talk to the Lumbridge Castle cook;
   obtain an egg, a bucket of milk and a pot of flour by normal game actions;
   return and give the ingredients; complete dialogue and reward. No
   privileged teleport, item grant, skill/XP grant, quest-varp edit,
   direct invocation of quest scripts, fabricated UI packet, or save editing.
   It is fine to reason about actions but a sent packet isn't success.
5. **Verify outcome from the actual live account.** Capture a pre-action
   snapshot, post-action stage/journal, reward/XP, and a saved state after
   legitimate bot logout/relogin if feasible. Keep observations confined to
   HarnessView1. Compare against exact historical content script values.
   `Cook's Assistant COMPLETE` may only be claimed if an authoritative
   quest-complete event or stage is observed (not just XP or three items).
   Distinguish PASS, PARTIAL and BLOCKED.
6. **If capability is missing, build it.** Implement the smallest safe,
   opt-in normal-377 controller/observation route, test it offline and
   in an isolated disposable 377 engine first, then validate against the
   live bot without interrupting other players. Keep secrets and native
   saves private. If a family server restart would be required, do not
   do it while Elrothiro is playing; report precisely what's blocked and
   any safe alternative using only the current client.
7. **Keep source changes.** Run syntax/automated regression tests; commit
   only reviewed non-secret source changes on a separate branch, push and
   merge after CI passes when permitted. Do not reset an agent's changes.
   Do not report merged or deployed until verified.
8. **Final report:** concise status `VERIFIED COMPLETE` only for a truly
   completed live quest; otherwise `PARTIALLY COMPLETE` or `BLOCKED`.
   Include exact live observations, any source PR/commit/tests, what the bot
   actually did, and one immediately executable Fedora next step only if
   unavoidable. Do not hand the user vague future work.

## Local tools / pitfalls
- Normal rev377 player action packet types in
  `tools/rs377-chatgpt-bridge/src/protocol.mjs`: `walk`, `npc`,
  `loc`, `ground`, `inventory`, `item_on_loc`, `dialog_resume`, etc.
  These are packet encoders, **not** a complete client or proof of effect.
- The existing full SDK runtime and observer are restricted to a separate
  disposable world by design. Never bypass their safeguards by editing only
  a flag. Agy may implement a reviewed, explicitly authorised narrow
  rev377-family interface only with demonstrable correct account/world
  identity, actual observations and one controller.
- Do not ask Josh to hand-play the quest; the objective is autonomous
  gameplay. If a genuine GUI/MCP/access permission is necessary, report
  the exact missing permission rather than pretending Agy can see the screen.
- No `rm -rf`, no `git reset --hard`, no forced checkout/clean, no
  destructive source patch on the running engine, no public game ports.
- Work is done in the current *Agy CLI foreground session*, not a
  supposedly unattended background task. Respect normal CLI permissions,
  spend limits and explicit error statuses.

**Do the implementation and the real run now.**

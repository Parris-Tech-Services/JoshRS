# The eight architecture proof-of-concept experiments

**Cutoff:** 2026-11-08. **Status:** SPECIFIED, NOT EXECUTED. All experiments use synthetic accounts and original/cleared assets in a disposable world. Zero production data writes.

## POC-01 — 377 restore and offline login (JR-001..010)

**Input:** Read-only inventory of active Windows world, exact pinned source/pack hashes and independent DB snapshot. **Build:** no new gameplay features. **Test:** restore into fresh directory, bind loopback, boot with WAN disabled, normal client login, walk/XP/item change, graceful save/relog. **Pass:** restored copy boots and exact inventory/bank/quest hashes match; unknown original data untouched. **Blocker:** Windows host inaccessible through repository connector.

## POC-02 — Household LAN session (JR-011..020)

**Build:** local parent approval token, device enrolment, 2 independently authenticated disposable accounts, separate clients on one Wi-Fi/LAN. **Test:** both view movement from same tick; trade one item with atomic ledger; kill internet connectivity; reconnect. **Pass:** both retained progress, outsider denied and no public chat/WAN. **Dependency:** POC-01 safe copy.

## POC-03 — New modern client / rule profile (JR-021..030,043..054)

**Build:** tiny original town with 20 walkable tiles, a tree, miner, bank, NPC, quest journal and two avatars. **Protocol:** `client_hello {protocol_version, mode_id, capabilities, device_id}`; server authorises mode/identity, sends own schema and session token; `Intent {seq, world_id, verb, target_id, expected_tick}`; `AuthoritativeDelta {tick, event_id, snapshot_revision, changes}`. **Test:** perform action, disconnect/relog and measure FPS. **Pass:** modern client never sends 377 packet opcodes, server rejects spoofed XP/item state, original textures/characters only.

## POC-04 — Single original multistage quest (JR-024,029,052,070)

**Build:** 4-stage "Help the Harbour" original quest (talk, gather, repair, celebrate) with one optional branch, two NPCs, two object actions and item/XP reward. **Test:** no item, wrong prereq, repeated click, death/disconnect during stage, finish twice, log out and back in. **Pass:** correct unlock, stage progress and one-time reward; child can follow hints.

## POC-05 — Ship/port persistence (JR-055,061..067)

**Build:** raft with hull, helm, mast and one optional facility; a local sea mesh with safe dock, 2 passengers and salvage task. **Test:** collision, boarding, travel, upgrade, quit mid-water, reconnect on both clients; full cargo and concurrent loot. **Pass:** boat cannot cross land; position, upgrades, inventory and passenger state consistent.

## POC-06 — RS3-style ability and combat mode isolation (JR-051,079..084)

**Build:** 3 original abilities (basic attack, defensive action, high-cost threshold), 2 statuses, adrenaline and cooldowns. **Test:** same tick concurrent ability requests, no adrenaline, stunned character, illegal target/range, reconnect and distinct OSRS-style character. **Pass:** server dictates resource spend; combat mode and action bar appear only in RS3 profile; no cross-save contamination.

## POC-07 — Family duo dungeon and NPC companion (JR-056,063,073,074,086)

**Build:** 3-room generated dungeon with a puzzle, combat optional boss and a clearly labelled scripted helper companion. **Test:** solo entry, 2-player entry, player disconnect, role switch, gated rewards, defeat retry. **Pass:** duo works without third-party players and without griefing/death loss in child mode.

## POC-08 — All-up validation and rollback (JR-030,097..100)

**Build:** disposable suite with genuine client/session, source+asset provenance, status dashboard and offline installer. **Test:** WAN-off installation, permission denials, snapshot/hash recovery, schema rollback, injected packet duplicates, crash mid-banking and client frame time. **Pass:** 25 family acceptance tests where applicable, 0 confirmed item dupes/loss, no unauthorized networking or proprietary public repo uploads.

## Experiment recording contract

For each record: date, reviewer, requirement IDs, game mode, repo SHA, client/server pack SHAs, deterministic test world seed, synthetic account identities, environment/ports, exact command, test logs, before/action/after state hashes, game-capture/video reference if available, error count, crash/restore proof, physical target hardware and status `PROPOSED | SOURCE_TESTED | ISOLATED_REAL_ENGINE | VERIFIED_FAMILY_WORLD | BLOCKED`.

**Do not publish** literal passwords, raw accounts, personal save snapshots, WAN addresses, Windows login names or child-identifying files.

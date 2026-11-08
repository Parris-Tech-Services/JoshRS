# Family-world acceptance tests (real gameplay proof required)

**Status:** test protocol, not completed execution. Run in a disposable isolated copy first, only then on approved family world. Never publish player identities, family device addresses, screenshots with private data, DBs or credentials.

| Test ID | Scenario | Real acceptance | Required proof |
| --- | --- | --- | --- |
| FAM-01 | Offline first boot | Installed game launches when WAN fully disconnected | Process/network trace, exact build |
| FAM-02 | Local-only default | No internet/public interface listener, no port forwarding | Network config, socket scan |
| FAM-03 | Parent account login | Valid local parent profile authenticates | Native login and observed character ID |
| FAM-04 | Child separate login | Distinct player save and inventory | Two independent native accounts |
| FAM-05 | Unknown LAN device | Join fails without parent device enrolment | Negative login and firewall audit |
| FAM-06 | Two-device presence | Both clients see each other's true position at same server ticks | Paired movement/video or redacted logs |
| FAM-07 | Solo after other exits | Remaining player keeps moving and collecting resources | Client input + server state |
| FAM-08 | Child PvP blocked | Server rejects attack/steal packet targeting family account | Forged legal-format negative packet |
| FAM-09 | Parent mode combat works | Explicit parent mode can use standard combat rules | Normal client HP/XP/drops |
| FAM-10 | Gentle NPC mode | Non-frightening encounters and NPC routines, no unavoidable horror | Parent settings and client proof |
| FAM-11 | Readability | Adjustable text/controls/clear hints at child profile | Usability test across input devices |
| FAM-12 | Quest states | Real choices, goals, unlock and completion reward exactly once | Before→action→after and relog |
| FAM-13 | Resource loop | Gather, craft, equip/use and store item | Source, skill XP and item balance |
| FAM-14 | Bank transaction | Full inventory, note conversion and withdrawing exact items | Atomic server ledger and relog |
| FAM-15 | Shop transaction | Currency and item quantity consistent | Native UI + authoritative account delta |
| FAM-16 | Full cargo | Ship salvage rejected/reported safely without item loss | Normal client + ledger |
| FAM-17 | Lost connection | Disconnect mid-quest and restart after a safe checkpoint | State identical/no duplicate rewards |
| FAM-18 | Server crash | Simulated abrupt process stop during bank/trade | Recovery journal and no duplication/loss |
| FAM-19 | Save rollback | Backup restores into **different test directory** | SHA manifest + world start + checks |
| FAM-20 | Content permissions | No external downloads/chat/ads, only approved assets | Network trace and provenance pack manifest |
| FAM-21 | Solo Sailing | Boat moves, docks and inventory/cargo persist | Client+server tick and save/relog |
| FAM-22 | Two-player voyage | Both board same server-owned boat; view movement and disembark | Two distinct clients and authoritative ship |
| FAM-23 | Combat style isolation | RS3 ability does not leak to OSRS character or 377 profile | Cross-mode negative test |
| FAM-24 | Character mode isolation | Same numeric item/NPC/quest IDs in different eras remain distinct | DB and runtime crosswalk test |
| FAM-25 | Recovery after bad update | Prior working world starts with unchanged saves after rollback | Restore drill and build-hash comparisons |

## Proof levels

**Fixture test:** useful for development only. **Disposable actual server:** real engine and packet/client login, but does not prove family deployment. **Family live world:** authorised local on-device test with *backups first*, redacted evidence and verified no progress loss.

Every FAM record must include: test world fingerprint; game profile; client, content and server SHAs; OS build; test character synthetic ID; initial state digest; action sequence; final authoritative state digest; logout/relog digest; result and limitations. Do not record secrets or real child personal data.

## Acceptance priority

Pass FAM-01–09, 12–15, 17–20 and 25 **before promoting modern content into a family profile**. Sailing and RS3-specific tests apply to corresponding future modern profiles.

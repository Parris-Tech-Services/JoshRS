# Quests 66–70 — verification batch: all five genuinely absent

| # | Quest | Released | In content? | Evidence |
|---|---|---|---|---|
| 66 | Throne of Miscellania | 29 Nov 2004 | ❌ absent | no `vargas` anywhere; no `quest_miscellania*` |
| 67 | Monkey Madness I | 6 Dec 2004 | ❌ absent | `narnode` appears only in Grand Tree scripts (that NPC predates this quest) |
| 68 | Haunted Mine | 21 Dec 2004 | ❌ absent | `zealot` appears only in the music player; no `quest_hauntedmine*` |
| 69 | Troll Romance | 5 Jan 2005 | ❌ absent | no `quest_trollromance*`; `ug` matches only test fixtures |
| 70 | In Search of the Myreque | 10 Jan 2005 | ❌ absent | no `vanstrom`; no `quest_myreque*` |

Every one of these postdates revision 274 (roughly May 2004). Their absence is **era-correct**,
not a content defect — the same reason Big Chompy (May 2004) is the last in-era quest.

## How absence was established

Not by directory listing alone — five rounds of alias errors taught that much. Each was checked
by searching the whole `scripts` tree for a signature NPC that only that quest introduces:

- Throne of Miscellania → King Vargas
- Monkey Madness I → King Narnode (name collision with Grand Tree, resolved by file path)
- Haunted Mine → the Zealot
- Troll Romance → Ug
- In Search of the Myreque → Vanstrom Klause

No implementation surfaced for any of them.

## Why this matters for the backlog

The target list has 88 quests. This batch confirms the cut is real and mostly chronological:

- **62 present** in this content (from the status table)
- **26 absent**, of which the in-era exceptions are Shilo Village only

Reaching the remaining 26 means **a later revision's content**, not patching what exists. That
is the product decision flagged in the reconciliation document — port content forward, or move
the playable target to a later revision. It cannot be solved by auditing.

## Running tally, quests 1–70

| Result | Count |
|---|---|
| Rewards verified against wiki | **55** |
| Confirmed gaps | **3** (Sheep Shearer; Sea Slug — fixed; Legends' ~120,000) |
| Unresolved discrepancies | **2** (Watchtower 50 XP; Troll Stronghold Agility) |
| Post-era but incomplete | **1** (Tai Bwo Wannai Trio) |
| Absent — post-era, expected | **5** (this batch) |
| Absent — in-era, real hole | **1** (Shilo Village) |
| Resolved era questions | **5** |
| Defects found in 377 content | **2** |

## Still unverified

Dialogue order, item reachability and NPC behaviour for all 65 present quests. Reward
correctness remains the narrowest slice of "fully working", and five batches in a row of it
being right is not the same as five batches of play.

# JoshRS Family World — offline-only parent/child sandbox architecture

**Prepared:** 8 November 2026. **Status:** proposed architecture and acceptance tests; **not installed or verified in a running desktop game**.  
**Applies to:** a separate, original-content family expansion track; do not confuse it with the existing historical 274 reference, private 377 world, or public Woodlands launcher.

## Product promise

A parent and young child should be able to play an engaging fantasy exploration game **at home, alone or together, without strangers**, and enjoy long-term character progress. There must be **no public players, public chat, direct messages, account discovery, paid game currency, intrusive offers, griefing or dependence on a third-party game service**. The software should be fun even when the parent is not actively playing, and offer choices about combat, scary content and challenge.

## System diagram (conceptual)

```text
 [Parent device / local player]                  [Child device / local player]
        |  local IPC or LAN (explicit consent)          |
        +---------------------+--------------------------+
                              |
               Family session gateway (no WAN)
               - only enrolled local profiles/devices
               - no public registration / presence / chat
               - rate limits, local auth, per-action permissions
                              |
                  Authoritative game server
                  - world tick, NPC actions, combat/peace
                  - inventory, quests, XP, crafting, shops
                  - local cooperative events / AI companions
                              |
                        Data store
                  - separate character records
                  - append-only audit / transaction integrity
                  - local backed-up world state
                              |
                      Offline media cache
                  - independently licensed game content only
                  - no runtime CDN or live internet requirement
```

### Legacy compatibility boundary

The desktop revision-377 host is historically pinned and contains potentially irreplaceable custom progress. **Do not reset, overwrite or migrate its files** to prototype Family World. Compare the value of (A) a carefully opt-in 377-compatible add-on and (B) a separate fully original game runtime and client; modern UI/protocol/skills may make (B) more maintainable. **Feature-equivalence goals do not imply copying Jagex quest scripts, models, map files, dialogue or music.**

Recommended first implementation: stand up an isolated, original-data **Family World slice** with deterministic saves and a parent/child co-op demo. Only then consider connecting supported mechanics to a safe 377 adapter. Never claim the desktop world is protected until a real backup and restore drill passes.

## 1. Local isolation and security requirements

| Concern | Required behaviour | Verification |
| --- | --- | --- |
| Default network | Bind exclusively to `127.0.0.1`, with no public DNS service or WAN | Network scanner sees no accessible listener beyond loopback |
| Optional two-device play | Parent approves one local interface and authorises household devices/accounts | From approved LAN device: login succeeds; unknown LAN device: rejected |
| Public exposure | Do not configure router port forwarding, UPnP, NAT-PMP, tunnels or cloud relays | Inspect local config, Windows firewall and router; external access fails |
| No strangers | Disable public registration, world list, cross-server chat, trade and player discovery | Anonymous registration, friend requests and public chat endpoints unavailable |
| Identity | Distinct local character IDs, salted password/PIN hashes or secure token equivalents, parent admin authentication | Replay/expired/forged/cross-user tokens denied |
| Permission controls | Server—not UI alone—enforces restrictions on PvP, dropping, deleting and shared storage | Crafted forbidden network command rejected and logged |
| Content supply | Local content pack only; no unapproved downloadable user-made maps or remote scripts | WAN-offline boot uses only vetted offline media |
| Data privacy | No telemetry, marketing or ads; no usernames/PINs/saves in GitHub or diagnostic logs | Network trace shows zero external requests after offline installation |
| Updates | Separate deliberate parent-initiated update with diff, backup, rollback and offline archive | Offline version remains playable and unchanged without update |
| Shutdown | Clean database flush and checksum/backup validation | Hard shutdown recovery test avoids rollbacks, duplication or lost quest rewards |

For a single device, LAN networking should remain entirely off. For two devices, **offline** means no internet/WAN is required; both devices still share a trusted local network.

## 2. Player and character model

- One parent-controlled local world, distinct player profiles, no account discovery.
- A child profile cannot change family settings, switch to public servers, spend real money or accept external chat invitations.
- Include a visible **Family World — Offline / Only local players** status (it must reflect actual socket/network state, not a cosmetic label).
- Support two simultaneous independent avatars with shared presence, proximity, trades limited to permitted family members, shared tasks with individual XP/progress and opt-in shared building permissions.
- A child may interact with NPCs, but **NPCs never impersonate or claim to be a real person online**. Scripted AI companions must be predictable, non-threatening, pausable and clearly presented as game characters.
- Support solo play and companion AI when the other human is unavailable.

## 3. Gentle mode and age-appropriate defaults

**Default on a child profile:**
- No PvP, theft from another player, skulls, lost gear on death, aggressive random player encounters, gambling or real-world purchases.
- Combat optional; peaceful exploration, resource collecting, farming, cooking, crafting, pets, sailing and puzzles available without fighting.
- Reframe defeat as retreat/recovery with a clear retry point; difficulty adjustable by the parent. No permanent character deletion on failure.
- Content warnings for horror, corpses, gore, disturbing monsters, occult/demonic themes and more mature storylines. Parent can gate specific categories or adapt them through **original** quest content.
- No surprise time-limited daily-pressure mechanics, manipulative streaks or forced subscriptions.
- Accessible large buttons, readable fonts, clear objectives and hints with adjustable frequency, simple controls and easy return-to-home.
- NPCs greet briefly, have ordinary purposeful routines and never crowd the child, follow endlessly or trap doorways.

## 4. Game design modules (incremental original implementations)

| Module | Minimum meaningful playable slice | Later progression |
| --- | --- | --- |
| World exploration | Village, beach, forest, safe interiors, readable map, working doors | Large regions, underwater/sea and mountain travel |
| Gathering | Trees, rocks, fish and wild crops with distinct tools and XP | Skill tiers, seasonal and rare nodes |
| Crafting | Make a useful item from gathered resources, no admin spawn | Production chains, upgraded stations and item quality |
| Farming/gardening | Plant seed, return later, harvest and cook | Crops, animals, greenhouse, family garden |
| Building | Personal small home and shared family room | Furniture craft, permissions and decoration |
| Wildlife | Track, observe, befriend or safely capture friendly creatures | Habitat care, pet progression, collections |
| Boats/sea | Embark, navigate and dock with one or two players | Crew roles, voyages, maritime crafting, islands |
| Quests | Three entirely original quests, branching choices, dialogue and persistent rewards | Story arcs, world changes, replayable family missions |
| Combat (opt-in) | Simple readable encounter with clear healing/retreat | Bosses, modes, abilities, companion actions |
| Dungeons | Three room types, clues and puzzle/reward | Procedural floors and co-op scaling |
| Exploration log | Tracks places, recipes, creatures and completed quests | Achievements, diaries and collection book |
| Helpers | One kind friendly town NPC, one helper companion | Schedules, contextual hints and non-creepy AI |
| Economy | Offline NPC merchant with safe prices, bank and bag | More traders, original currencies and craft markets |
| Player safety | Solo/local sessions, child permissions, safe save | Parent dashboard, accessibility presets, local co-op |

Modern RuneScape is a **reference for the breadth and coherence of these mechanics**, not a specification to reproduce named proprietary characters, plots or media.

## 5. Persistence contract and test cases

Every state transition uses server authority: `character_id`, `world_id`, `event_id`, `server_tick`, `quest_version`, `inventory_revision`, `expected_previous_revision`. A quest completion must be idempotent and grant rewards only once even if a request is retried after disconnection. A trade must commit both sides atomically. A craft must consume ingredients and create output in the same transaction. Keep all currency movements as recorded deltas. For parenting purposes, prefer **recoverable** state over punishing irreversible death.

**Run the following with disposable characters first:** login/logout; two clients; a child without WAN; server crash mid-trade; forced disconnect after item use; full bag; lost network; duplicated quest reward packet; two simultaneous clicks on one ground item; bank and shop stock; restoration of an old snapshot; migration rollback; parent restriction on/off; unapproved LAN client denial.

**No live 377 changes before:** verified backup of all relevant files + DB WAL; client/engine/content/pack hashes; user approval of host-specific downtime; ability to restore a copy without touching production; all disposable acceptance tests passing.

## 6. Parent-facing Windows controls

One launcher entry named **Play Family World**: (1) confirm offline state, (2) select Parent/Child local profile, (3) Start Solo or Start Household LAN, (4) show current approved participants, (5) Stop World Safely. Separate **Back Up / Check Backup / Restore to Isolated Copy** controls. Prevent the "Start household LAN" action from enabling WAN access or a public lobby.

A **Parent Settings** panel holds threat/peace levels, optional combat, user-created content, quest-age categories, who may trade, max play session reminders, accessibility and whether a child may delete items or world changes. Do not add surveillance features or covert behaviour monitoring.

## 7. Concrete acceptance definition for the first family release

1. Parent launches in airplane/offline mode, moves, gathers, crafts, banks, completes a quest and relogs with progress unchanged.
2. Child joins from a second approved device on trusted LAN with no internet; both can see movement in the same world and complete a cooperative task.
3. Unauthorised player cannot register/join, and there is no public chat, online player discovery or paid transaction route.
4. Child cannot attack or steal another player; NPCs are approachable and do not overcrowd doors.
5. Quest progress, inventory, equipment and shared building remain consistent after a server process restart and a disconnect test.
6. Original content pack runs without external CDN; all included assets have recorded licences.
7. Parent can export a complete world backup and demonstrate restoration to a **new isolated test world** without changing the original.
8. No claim of a production/desktop release until actual testing evidence is captured from the relevant machine.

## Related

[Research findings](RESEARCH_FINDINGS_2026-11-08.md) · [104 historical quest rows](data/rev377_104_quest_source_crosswalk_2026-11-08.csv) · [673 NPC triage candidates](data/rev377_673_npc_talkto_candidates_2026-11-08.csv) · [30-skill reference matrix](data/skill_systems_union_2026-11-08.csv).

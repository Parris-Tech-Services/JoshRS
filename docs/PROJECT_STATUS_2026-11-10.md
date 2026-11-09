# JoshRS status — 10 November 2026

One page, scored against the objective rather than against effort. Every claim links to where its
evidence lives. Where something has never been played, it says so.

---

## The objective, item by item

| Requirement | State | Evidence |
|---|---|---|
| Audit Android code, server, protocol, cache, open-source clients | **VERIFIED** | `docs/ANDROID377_LICENSING_AND_REUSE_AUDIT_2026-11-09.md`, code audit of 25 Kotlin files |
| Reuse licensed components, minimise custom code | **PARTIAL** | MIT `Engine-TS` ported as spec; no rev-377 client exists that is accurate, Android-ready **and** licensed |
| Real server authentication | **VERIFIED** | Native Kotlin logs into the real engine in CI; login status 2 |
| Multiplayer | **PARTIAL** | LAN bind + origin allowlist verified; **two devices never connected** |
| Movement, combat, skills, inventory, banking, trading, chat | **BLOCKED** | Not implemented in the native client |
| Terrain, models, animations, NPCs, interfaces, audio | **BLOCKED** | Definitions decode; **nothing renders** |
| Rendering, touch controls | **BLOCKED** | No renderer written |
| Quests | **PARTIAL** | 62 present, 55 rewards verified, 3 rewards implemented — **none played** |
| Persistence / no save loss | **VERIFIED** | `elrothiro.sav` intact (`0x2004` v7, Lumbridge 3218,3218); isolated worlds only |
| Offline / LAN play | **VERIFIED** (LAN) | `http://10.8.0.1:8888/rs2.cgi` serves 200; origin allowlist rejects foreign origins |
| Reconnection | **PARTIAL** | Idle timeout raised to 72 min; no client-side reconnect logic |
| Build / install / test the APK on the A55 | **BLOCKED** | APK builds in CI; **never installed or launched** — needs a human tap |
| Commit verified changes to `main` | **VERIFIED** | Every merge listed in git history; CI green each time |
| Installable APK + instructions | **PARTIAL** | 31 MB private debug APK published; instructions in `PLAY_WITH_SYLVIE.md`; not launched |
| Progress log with statuses | **VERIFIED** | This file plus `docs/quests/` and the native-client log |

## What is genuinely working

**A playable RuneScape world you can open in a browser right now.**

```
http://10.8.0.1:8888/rs2.cgi
```

Revision 274, served from the phone, HTTP-served browser client, LAN-bound, origin-locked,
72-minute idle tolerance. Elrothiro's character persists. This is the only part of the objective
that is *playable* rather than *verified in tests*.

**A native client that speaks the real protocol.** Kotlin passes 105 tests and authenticates
against a live pinned 377 engine in CI: handshake, RSA login block, ISAAC framing, post-login
read loop, cache bootstrap, item definitions (7,956, real names), NPC definitions (3,852, all
consumed), and an end-to-end jagfile→definitions pipeline.

**Quest content that is auditable and mostly correct.** 64 quest directories; 63 of 64
structurally complete; every non-miniquest has a completion path; 55 reward sets match the wiki.
Three real defects found and three needs fixed (Sea Slug, Legends' reward, Sheep Shearer bonus).

## What is not working, stated plainly

**The native app cannot draw a pixel.** There is no renderer. It cannot be played.

**Nothing has been playtested.** Not one quest, not one reward, not one login *by a human*.
55 reward sets are verified on paper; three were implemented this session and **none has
executed**. The gap between "the code is present" and "the reward is granted" is unmeasured.

**Two devices have never connected.** The single most valuable unknown for the actual goal —
playing with Sylvie — is untested.

**The APK has never been installed.** It builds, it is signed, it is downloadable. Nobody has
tapped it.

## Real defects found this session

| Defect | State |
|---|---|
| Priest in Peril paid 140 XP instead of 1,406 (377 branch only) | patch written, **not applied**; Elrothiro already took the 140 |
| Sea Slug paid no Fishing XP while the UI promised 7,175 | **fixed in both revisions** |
| Legends' Quest paid nothing | **implemented** (four 7,650 XP lamps); not played |
| Sheep Shearer missing +50 spin bonus | **implemented**; not played |
| `Jagfile377` enum shadowing the jagfile reader | **fixed** |
| 377 Sea Slug patch secretly contained a second fix | **fixed and re-verified** |
| Missing offset table in `obj.dat` assumption | caught by real-data validation |
| Opcode 106 mis-sized in `npc.dat` | caught by instrumenting the engine |

## The honest distance left

The native client needs, in order: **a renderer** (the largest single piece), models, animations,
interfaces, audio, movement, then every gameplay system. That is months of work and it is the
bulk of the original objective.

The playable browser world needs none of that. It needs **testing with a second device** and
**decisions about which revision to target** for the 22 quests absent for era reasons.

## What I would do with the next hour, if it were mine

Play Cook's Assistant. Fifteen minutes, checklist in `docs/quests/QUEST_001_COOKS_ASSISTANT.md`.
Every claim in this document about quest correctness rests on code inspection and wiki comparison.
One playthrough would tell us whether that approach has been worth anything.

Then get Sylvie's device onto the LAN URL. That single test closes three unknowns at once.

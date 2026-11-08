# External emulator/framework reuse: engineering and licence research

**As of:** 8 November 2026. **Evidence level:** project repository descriptions and published GitHub/GitLab metadata, not a full pinned-code audit. **Decision:** borrow architecture lessons; never automatically mix code, client caches or copyrighted content into the public JoshRS repo. Licence varies by repository, branch and file.

| Project | Reference | Architecture insight for JoshRS | Rights, compatibility and maturity caveat |
| --- | --- | --- | --- |
| Lost City / 2004Scape | https://github.com/LostCityRS/Engine-TS and https://github.com/LostCityRS/Content | TS historical world/tick scripting; direct existing 274/377 pinned relationship | Historical client Java is separate; code MIT claims not licence for Jagex cache/quests; exact 274 vs 377 source identity critical |
| 2009Scape | https://github.com/2009scape ; https://github.com/Kingo64/2009Scape | Kotlin rewrite and historical content decomposition, multi-contributor quest production | Project is GitLab-migrated; old GitHub forks may lag. AGPL-3.0 terms may require derivative source obligations; independently check branch/file and client licences |
| 2011Scape | https://github.com/2011Scape | RuneTek-5 emulator architecture and cross-era item/quest data modelling | Group claims BSD-3-Clause for newer Game Server; its archived rsmod-667 has Apache-2.0. No single umbrella licence applies to every client/source module |
| Darkan | https://darkan.org/ and https://github.com/Rune-Status/titandino-darkan-game-client | Multiple worlds/lobby, large-scale 2012 game reimplementation, richer pre-EoC client support | Deobfuscated 2012 client is materially different from independently authored engine; do not redistribute without proven rights |
| OpenRSC | https://github.com/Rune-Status/Open-RSC-Single-Player | Offline/single-player edition as a design precedent; older turn/tick and simple memory model | Public single-player repo GPL-3.0; exact upstream/asset grants and client provenance to inspect |
| RSMod (Tomm0017) | https://github.com/Tomm0017/rsmod | Plugin-first Kotlin modular engine and packet/region approaches | **Archived 25 Aug 2025**; redirects to https://github.com/rsmod/rsmod. The archived Tomm0017 repo reports **Apache-2.0**, not automatically the licence of its successor or assets |
| AlterRSPS/Alter | https://github.com/AlterRSPS/Alter | Modular world plugins, region/cache integration, modern OSRS-compatible architecture | GitHub reports **BSD-2-Clause**. README describes an OSRS-compatible client/RSProx setup at revision 228.2 and user-provided client keys; it is not a ready-made RS3 solution nor an approved cache licence |

## Reuse decisions

**Already integrated/pinned:** LostCityRS 377 engine/content/client are an explicitly version-locked dependency of private 377, but the installed runtime and provenance need audit. Do not pull unpinned main over local modifications.

**Research-only references:** RSMod, Alter, OpenRSC, 2009Scape, 2011Scape, Darkan provide ideas for module boundaries, packet decoding, procedural quest content, server-state rules, world-grid and standalone hosting. Include title and verified source reference in design notes.

**Potential code dependency:** require exact immutable SHA, licence/SPDX per file (including contributions), all submodules and transitive dependencies, client and proprietary data separation, generated-asset rights, third-party obligations, tests and compatibility proof. No raw importing of GPL/AGPL quest implementations into MIT code without a designed compatible licensing route.

**Not cleared:** Official RuneScape/OSRS/RS3 client binaries, deobfuscated game clients, Jagex caches, animations, music, dialogue, maps, quest prose, models and artwork. No permissive emulator framework is permission for these.

## Why this changes the architecture recommendation

The mature examples mostly target *different RuneTek revisions with era-specific client/packet/content pipelines*. Choosing AlterRSPS/RSMod as the universal replacement would immediately privilege modern OSRS packet compatibility and still leave RS3 EoC, modern graphics, original content rights and legacy 377 saves unresolved. Hybrid with clean profile boundaries is therefore the more reversible path.

## Verification backlog

1. Pin current successor RSMod SHA/license and compare to Tomm0017 archived API, including dependencies.
2. Review 2009Scape GitLab active server copyright/provenance (the GitHub listing points away from current source).
3. Identify 2011Scape game-server vs archived rsmod-667 code ancestry and precise licence.
4. Review OpenRSC single-player isolation and data packaging licence.
5. Check Darkan source/protocol/asset chain separately; no cache/client import.
6. Compare one small benign quest or skill **design architecture** through legally reviewed documentation, reimplement with independent code.
7. Invalidate all licence conclusions when the reference SHA changes.

References: [Tomm0017 archived RSMod](https://github.com/Tomm0017/rsmod), [Alter readme](https://github.com/AlterRSPS/Alter), [2011Scape org](https://github.com/2011Scape), [2009Scape org](https://github.com/2009scape), [OpenRSC single player](https://github.com/Rune-Status/Open-RSC-Single-Player), [Darkan](https://darkan.org/), [Jagex policy](https://legal.jagex.com/docs/policies/fan-content-policy).

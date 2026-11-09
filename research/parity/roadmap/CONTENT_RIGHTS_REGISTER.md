# JoshRS software, content provenance and rights register

**Date:** 2026-11-08. **Classification:** technical/legal issue tracking, **not legal advice or a statement that any project has infringed**. Accepting risk does not grant rights. Public JoshRS repo must remain free of secrets and protected assets lacking redistribution permission.

## Owner's recorded risk acceptance versus actual rights

**Product direction:** [the 8 November 2026 owner decision](../../../docs/decisions/2026-11-08-private-rune-parity-and-risk.md) expressly records the desire for **faithful Jagex-authored RuneScape, OSRS and RS3 content in a private, offline, family-only game**, with rejection of invented/inspired-by substitutes as satisfying parity. The owner expressly accepted **"maximal legal risk"**, i.e. communicated a willingness to bear personal consequences from that aim.

**Legal interpretation:** This is a documentation of the owner's stated risk tolerance, **not** an executed legal indemnity, licence, signed assumption-of-liability agreement, statutory exemption or release; no person can conclusively assign all third-party or contributor liability through this repository statement. The project is not authorised to publish protected game content merely because its owner accepts risk. Keep the aspirational fidelity target and the content-rights clearance state in **separate records**. Do not downgrade the goal to an invented substitute, and do not bypass rights gates or auto-copy proprietary assets.

**Two independently recorded outcomes:**
- `fidelity_status`: EXACT_TARGET, PARTIAL, MISSING or VERIFIED_IN_GAME; must be grounded in the correct original game version and live evidence.
- `rights_status`: LICENSED, REVIEW_REQUIRED, BLOCKED or NOT_APPLICABLE; requires provenance and permission evidence where necessary.

| Asset / source category | Observed research context | Reuse gate | Acceptance |
| --- | --- | --- | --- |
| JoshRS independently authored original Woodlands code | `README.md`, `package.json`; original browser RPG | Verify exact contribution/source licence | Authorship/license file documented |
| LostCityRS Engine-TS | pinned versions in `upstreams.json` and 274 lock; code described as MIT | Verify pinned commit `LICENSE`, files and third-party transitive dependencies | NOTICE + provenance tracked for permitted source reuse |
| LostCityRS Content source | specific 377/274 engine-independent content source | **Per-file rights**; scripts may embody protected quest/world expression | Do not assume code licence licenses NPC dialogue, plots, map data or cache files |
| LostCityRS Client-Java | pinned original-client research/deobfuscated source | High client/IP provenance concern; legal review | No public redistribution absent appropriate rights |
| Jagex cache/maps/models/sprites/textures | Protected source game art/data | Rights authorization required for copying | No unlicensed cache or asset bundles in repo |
| RuneScape music, sound and dialogue text | Protected authored expression | Rights authorization required | Link to references; do not copy transcripts/recordings |
| OSRS/RS3 quest plots and named distinctive characters | Protected literary and audiovisual expression may apply | Rights clearance for exact reproduction; original story alternative | Per-quest metadata allowed for research; no verbatim copied text |
| Engine-agnostic generic gameplay mechanics | Skill XP/loot/quests/combat as independent concepts | Clean-room, independently implemented rules and art | Tests against functional requirements, not copied program code/assets |
| 2009Scape, OpenRSC, etc | Different upstream licences including AGPL/GPL and variants | Review precise commit licences and derivative obligations | Do not silently import copyleft code into MIT-labelled project |
| RSMod/Alter framework code | Kotlin modular server tools and cache/client requirements | Verify specific source, licence, third-party modules, assets | Cross-repo dependency and licence manifest |
| Wiki data metadata | Quest names, dates, IDs and categories used in audit | Attribute, respect site terms/API access, avoid bulk text copyright | Source URL, timestamp, extraction notes |
| Community uploaded content | Future mods/assets | Only explicit rights-allowed moderated original packs | No remote scripts or untrusted game cache imports |
| Local household account/save DB | Private character, session, household details | **Never commit/publicate**, even redacted raw DB | Private local storage and secure backup |
| Agent-generated quests/media | AI generated original content | Inspect similarity, licence/provenance, safety | Human review and test before release |

## High-priority legal sources

- [Jagex Fan Content Policy §6.1.3](https://legal.jagex.com/docs/policies/fan-content-policy) explicitly prohibits creating private game servers or game software using Jagex property without separate permission.
- [Australian Copyright Act 1968](https://www.legislation.gov.au/C1968A00063/latest/text) protects expression and contains specific software exceptions; there is **no broad exemption** merely because a game is private and noncommercial.
- Open-source software licences cover specified copyright holders' original contributions, not every dependency/resource needed to run a reverse-engineered client or engine.

## Required provenance manifest fields

`asset_id`, `mode`, `relative_path`, `upstream_url`, `upstream_commit`, `author`, `copyright_holder`, `licence_spdx`, `distribution_scope`, `source_hash`, `third_party_dependencies`, `human_reviewer`, `review_date`, `permission_evidence`, `decision` (ALLOW, METADATA_ONLY, RIGHTS_REVIEW, BLOCK) and `notes`.

## Non-disruptive policy

Don't delete working personal files merely because this register identifies risk. Determine provenance, public distribution and consent before making changes. Maintain separate metadata and original asset packs, and only propose a permissioned exact-content reproduction. Do not equate "open repo" or "no donations" with permission.

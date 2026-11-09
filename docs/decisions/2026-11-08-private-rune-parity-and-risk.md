# ADR-JR-FAMILY-EXACT-PARITY-001 — Owner decision on private RuneScape fidelity and legal risk

**Decision made:** 8 November 2026 (Australia/Sydney).
**Recorded in repository:** 9 November 2026.
**Status:** OWNER-APPROVED PRODUCT DIRECTION; LEGAL RIGHTS NOT GRANTED OR VERIFIED.
**Applies to:** the owner's **private, offline-first, family** JoshRS game development programme — historical RuneScape 377, and researched Old School RuneScape (OSRS) and RuneScape 3 (RS3) fidelity targets.
**Does not change:** the public JoshRS launcher, independently original Woodlands demo, third-party licences, the existing local game/runtime, or any game's authoritative saves.

## 1. Owner's explicit decision — accurately recorded, not a legal instrument

In the 8 November 2026 conversations (approximately **4:58 pm AEDT** and **5:26 pm AEDT**), the owner:

1. **Explicitly accepted "maximal legal risk"** in pursuing a private, family-only, offline RuneScape reproduction. The owner expressed willingness to take personal responsibility for the consequences of this development choice. This is a record of the owner's expressed risk tolerance and intent, **not a signed indemnity, transfer of liability, waiver, copyright licence, legal defence, or release of Jagex's rights**.
2. Chose **as-exact-as-possible parity with actual Jagex-authored RuneScape content**, including the content and gameplay of **both OSRS and RS3**, alongside the historical RuneScape releases already being studied. The ambition is systematic coverage of authentic quests, NPCs, dialogue trees, item identities, maps/world locations, stories, skills, combat, interactions, models/presentation, music/audio and progression — not a merely recognisable approximation.
3. **Rejected original/inspired-by substitutes, speculative invented NPCs, placeholder quest stories, and "random AI vibe-coded" filler as satisfying the parity goal.** Preserve source-version identity and research provenance. If faithful content is unavailable or permissions are unresolved, mark the feature **MISSING / RIGHTS_REVIEW / BLOCKED**, not "complete" because an unrelated original alternative was generated.
4. Specified **private, offline-first family play**, especially to play with the owner's daughter, without stranger interactions, public chat, griefing, paid monetisation, or reliance on public online accounts. Only enrolled family devices/characters should share the private game.
5. Wanted the existing private historical JoshRS game, player progress and other ongoing work **preserved**, not deleted or silently replaced in response to risk concerns.

These are faithful **paraphrases of decisions made in conversation**, except for the short quoted phrases above; this record is not a signature or a legal acknowledgment issued by a lawyer or by Jagex.

## 2. Product fidelity versus technical architecture

**Highest-priority private-product direction:** accurately reproduce *the original content*, with version-by-version research and real interaction/playthrough evidence. Original Woodlands-style content is a **separate independent product**, not a substitute counted toward exact RuneScape parity.

The earlier **30 October 2026 revision-274 reference lock** remains the 2004 historical reference baseline for its own design exercise. The **revision-377 game** remains a separate existing local world with separate player saves. OSRS and RS3 have distinct historical eras, quest flags, skills and combat rules. A practical architecture can keep these editions as separate profiles or rule sets, **but must not redefine the owner's requested content fidelity down to "inspired by" or "OSRS-like" solely because it is technically easier**.

The ambition to cover *everything* is a **target**, not a statement that all content has been implemented, compiled, installed, tested, licensed or playably reproduced.

## 3. Legal and distribution boundary — acceptance of risk is not permission

The owner's acceptance of substantial legal risk does **not**:

- grant a right to copy, host, modify or distribute any Jagex-owned protected work;
- transfer liability away from developers, contributors, hosts or others, nor guarantee that the owner alone is legally responsible;
- override copyright, trade marks, contractual restrictions, third-party terms, or the upstream repositories' applicable licences;
- create a blanket Australian "private use" or noncommercial exemption, nor permission to operate a private game server;
- authorise publishing protected models, assets, caches, source content, game clients, quests, dialogue, maps or audio to this **public repository**, a public site, an automated artefact, a CI log or a distributable build.

**Implementation boundary:** maintain accurate source and rights metadata, use lawfully reusable code/assets where permission is documented, and obtain appropriate rights/authorisation before reproducing protected content when required. Do not automate unlawful copying or redistribute protected binaries/content merely because the owner acknowledges risk. If a required exact asset/content element lacks rights clearance, preserve it as a fidelity target and a **separate rights blocker** — do not misrepresent a substitute as equivalent.

A technical design specification can describe what should match the reference game without itself embedding protected content. Any actual private deployment or distribution decision needs its own legal and operational review.

See [the provenance and rights register](../../research/parity/roadmap/CONTENT_RIGHTS_REGISTER.md) and [Jagex's published Fan Content Policy](https://legal.jagex.com/docs/policies/fan-content-policy). This file is a **project decision record, not legal advice**.

## 4. Instructions for every future agent and contributor

1. Read **this ADR before designing, estimating, editing or reporting JoshRS parity**. In disputes about the *owner's intended product*, this 8 November decision **supersedes earlier statements framing an inspired-by/original substitute as the requested private product**. It does **not** supersede applicable law, licence conditions or safeguarding of existing personal saves.
2. Preserve individual editions and specific original content identity in audits. Never rewrite "RuneScape content fidelity" as "roughly similar feel" without the owner's new explicit decision.
3. Keep **two independent fields**: `fidelity_status` (EXACT_TARGET / PARTIAL / MISSING / VERIFIED_IN_GAME) and `rights_status` (LICENSED / REVIEW_REQUIRED / BLOCKED / NOT_APPLICABLE). No green "complete" based on a source stub, a simulated test, a generated substitute, or risk acceptance alone.
4. Keep original/experimental games such as Woodlands distinct from the private RuneScape parity product. Existing original-content creation and the public website retain their own release/rights constraints; they are **not instructions to lower the private fidelity requirement**.
5. Never delete, reset or overwrite any live world, bot, character or save; retain private backups. Never commit private accounts/passwords or proprietary cache binaries to GitHub.
6. When a legal clearance, exact source, or runtime proof is missing, describe the specific blocker truthfully; do not claim it was authorised or implemented.
7. Provide working, source-grounded results and separately report compilation, disposable-world checks and actual in-client saved progression. **No verified gameplay until real game evidence exists**.

## 5. Related decisions and reconciliation

| Existing document | Interpretation after this decision |
| --- | --- |
| [README](../../README.md) | Public launcher/Woodlands description remains accurate; the **private family fidelity goal** is a different, explicit owner choice. |
| [Agent contract](../../AGENTS.md) | Implementation/rights restrictions remain; agents must use this ADR as the source of truth for the *private product goal*. |
| [274 reference brief](../REFERENCE_VERSION_274.md) | Historical snapshot lock still applies *to its own 274 reference*, not to an OSRS/RS3 parity cap. |
| [Classic MMO checklist](../FULL_CLASSIC_MMO_CHECKLIST.md) | Original-game work remains tracked separately. Exact-private target does not turn unlicensed assets into publicly distributable ones. |
| [8 Nov parity research](../../research/parity/RESEARCH_FINDINGS_2026-11-08.md) | Already correctly describes actual-content parity; this ADR adds the **explicit owner risk decision**. |
| [Parity roadmap](../../research/parity/roadmap/README.md) and [executive assessment](../../research/parity/roadmap/EXECUTIVE_ASSESSMENT.md) | Version-isolation recommendations are technical only; original/"-like" content packs are not accepted as fulfilling private exact-content parity. |
| [Content rights register](../../research/parity/roadmap/CONTENT_RIGHTS_REGISTER.md) | Tracks rights independently of fidelity and the owner's willingness to bear risk. |

**Recorded by:** project documentation update at the owner's express request (9 November 2026). The owner's 8 November statements are incorporated as decisions; **this document does not impersonate an individually executed legal waiver or establish Jagex's consent**.

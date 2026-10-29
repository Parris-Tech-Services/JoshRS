# JoshRS historical reference design brief — BASE-02

**Decision:** Option A — **RuneScape 2, 23 November 2004, client revision 274** (Lost City / 2004Scape era).  
**Status:** **ADOPTED as the JoshRS project reference baseline** on 30 October 2026, under the owner's instruction to complete BASE-02.  
**Applies to:** JoshRS original game's *visual language, screen composition, gameplay rules and reference testing*, plus compatible, **research-only** upstream engine/client/content checkouts.  
**Does not mean:** JoshRS currently implements this historical game, or that 2004Scape assets can be redistributed. The public single-player Woodlands game is an interim original experience.  
**Canonical machine-readable lock:** [`REFERENCE_VERSION_LOCK.json`](REFERENCE_VERSION_LOCK.json). Subsequent agents must read this brief and lock before designing gameplay, choosing assets or upgrading a reference engine.

## 1. Why this version is locked

1. JoshRS already researches **revision 274** with a pinned, boot-tested Lost City engine and matching content; see [deploy/server/Dockerfile](../deploy/server/Dockerfile) and [deploy/server/README.md](../deploy/server/README.md). This choice uses verified project history rather than resetting work.
2. The reference is **November 2004 RuneScape 2**, not 2007 OSRS or today's OSRS. Jagex's official OSRS launched in 2013 from a **2007** backup, and has since evolved: [Jagex overview](https://www.jagex.com/runescape).
3. Lost City explicitly positions the reconstructed game in this historical period. Compare [2004Scape's version research](https://2004.lostcity.rs/news/215) and the [historical-content project](https://github.com/LostCityRS/Content/blob/main/README.md). Use independently observed client behaviour and branch-specific source, not memories of newer RuneScape releases.

**Decision owner:** JoshRS project, acting on the owner's explicit instruction to pick and lock one of the two offered baselines. This is a recorded project decision, *not* permission from Jagex to use its intellectual property.

## 2. Frozen technical reference identity

| Property | Locked reference |
| --- | --- |
| Edition and era | RuneScape 2, **23 November 2004** |
| Client/cache revision | **274** |
| Historical study | Lost City / 2004Scape, matching revision `274` |
| Reference engine | `LostCityRS/Engine-TS` branch 274, commit `1d25566cb53e7af1b1cb18ade8af996316c19614` |
| Reference content | `LostCityRS/Content` branch 274, commit `65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe` |
| Reference client | **The browser client built into the pinned engine checkout**; if standalone `Client-TS` is ever used, pin an independently verified **compatible** revision 274 commit and test protocol/cache parity first |
| Official reference experience | [Lost City's hosted game](https://2004.lostcity.rs/) — an external comparative reference, not a JoshRS dependency to disguise as self-hosting |
| JoshRS public gameplay | [Original Woodlands](https://joshrs.vercel.app/woodlands.html), currently an independent single-player RPG, **not yet version-274 equivalent** |

**Version discipline:** No mixing branch 274 server with 2007 data, modern OSRS APIs, 2009Scape assets or other incompatible versions. The above pins identify **research provenance**, not production assets or production architecture. Locking the target does *not* require using Lost City as JoshRS's future runtime; we may implement a lawful original game with compatible *feel*.

## 3. Historical visual direction — precisely what to match

**Primary goal:** A person familiar with the *2004* era should recognise the composition, flow and low-poly aesthetic. Build it from JoshRS-owned or clearly reusable assets; do **not** trace/redistribute game models, item icons, maps, textures, art, sounds or logos from Jagex.

| Visual area | What to design/measure against the revision-274 reference | JoshRS acceptance |
| --- | --- | --- |
| Game viewport | Fixed-era desktop composition with **low-poly 3D** world, ground-height variation, distant props, visible characters, and era-appropriate animation cadence | Original WebGL scene occupies the main gameplay area and supports camera movement/collision |
| Right interface | **Circular minimap at the top**, stone-framed icon tabs and sidebar panel, clear switch between equipment, backpack, skills, quests and combat | On desktop, panel hierarchy matches the chosen *era*; screen-reader and touch alternatives exist |
| Bottom panel | Parchment/scroll-like **chat message box** under the viewport, with interaction status and period-appropriate channel controls | Can read logs, chat and system messages without blocking play |
| Inventory | Compact grid, recognisable item silhouettes, quantity labels and item-use/equip flows | Items are selectable, examinable, movable/used; responsive mobile layout preserves access |
| Menus and modal UI | Pointer/right-click **Choose Option**, Talk-to, Use, Examine, Walk-here interactions; NPC dialogues, bank/shop windows and notification layers | Desktop right-click, mobile long-press and accessible keyboard alternative resolve to the same engine action |
| Typography/colour | Small bitmap-like text, subdued medieval earth/stone/parchment palette, original iconography and legible HUD text | Consistent original style at usable contrast, scale and phone layouts |
| Maps/animations/audio | Recognisable category cues and pacing (walking, resource gathering, combat, maps, inventory/skill feedback), **not** the same proprietary data | Original assets and audio audited; speed and action timing backed by historical observations |

**Reference screenshots to study, not copy into shipped assets:**

- [Lost City 2004Scape historical in-world and item interface](https://lostcity.rs/t/adventures-of-04chunker/15558) — low-poly interior, circular minimap, chat, right-side inventory.
- [Lost City context menu, game world and chat window](https://lostcity.rs/t/earendils-flashback-and-progress-in-2004/13020) — in-world interaction hierarchy and screen composition.
- [Lost City progress and skills interface](https://lostcity.rs/t/2004-scape-progression-thread-scarecrow/15550) — character skill tab and small-text visual treatment.

Those community screenshots may have been captured **after** the reconstructed reference release. They are *navigation and comparison examples*, **not independently certified exact 23 November 2004 screenshots**. BASE-03 must verify every historical nuance against the pinned build, record page/date/provenance and create annotated comparisons. Do not measure exact pixels from these links and declare historical parity without that verification.

**No pixel-for-pixel copying** of Jagex's artwork under the assumption that a historical client is “open source”.

## 4. Historical gameplay scope — a single era, not a grab bag

**Core period-appropriate reference behaviours to investigate:** movement and pathfinding; click-to-walk; camera and minimap orientation; inventory, equip/use/drop/examine; NPC dialogue; fishing, mining, woodcutting, firemaking and other era-verified skills; run/energy rules; tick-based combat; melee/ranged/magic; prayer; banks, shops and item stacks; skill XP/level progression; quest conditions; multiplayer chat, trade and death/recovery.

**These are acceptance candidates, not statements that JoshRS already implements them.** For each behaviour, capture the exact revision-274 state machine, then implement and test an independently owned equivalent.

### Exclusions unless the reference-version decision is formally amended

- **2007-based OSRS user interface** and modern OSRS resizable/mobile desktop frame or plugin overlays used as the *desktop* fidelity reference.
- Skills, items, prayers, spells, quests, buildings, NPCs, bosses, equipment tabs, raids and economies **introduced after 23 November 2004**. Examples to keep out of scope include the later skills **Slayer, Farming, Construction and Hunter**, and significantly newer features such as modern raids, Grand Exchange, seasonal modes and RuneScape 3 mechanics.
- Mechanic changes copied from modern wikis without documenting whether they existed in 274.
- Assets or data extracted from later snapshots to “fill gaps” without rights and compatibility review.

**Allowed adaptations:** 2026 security, accessibility, touch/long-press control equivalents, responsive phone framing, reconnect handling and safety/moderation. These adaptations must preserve the 2004 **gameplay semantics** and be labelled as modern *interaction accommodations*, not falsely presented as historical mechanics.

**Deferred:** The **exact revision-274 skill roster, numeric rules, spellbook, prayer list, quest list and UI tab order** must be enumerated and source-backed in BASE-03/BASE-04. Avoid invented counts or importing a 2007 list by habit.

## 5. Legal release mode

**Chosen independently shippable implementation:** an **original game inspired by the 2004 visual and mechanical patterns**, using original or properly licensed art/audio/lore/geometry. We can study MIT-licensed community engine source subject to its licence; this does not confer rights to the game's branded/copyrighted content.

**Exact historical replica** (identical models, original textures, Jagex map/quests/music/branding): **BLOCKED for public self-hosting** unless we have specific written rights covering every relevant asset and use. Lost City's Content README says assets are Jagex intellectual property outside its MIT source licence; [Jagex's published Fan Content Policy](https://legal.jagex.com/docs/policies/fan-content-policy) §6.1.3 excludes making a game/private server using Jagex property. “Private”, “free”, and “non-commercial” do not alone clear those rights.

## 6. Enforcement and change control

- The file [`REFERENCE_VERSION_LOCK.json`](REFERENCE_VERSION_LOCK.json) is the machine-readable source of truth. A CI test checks that this brief, the master checklist, matching engine/content revision pins and README remain consistent.
- Reference screenshots and any derived research must declare **version 274** or **not yet verified**. This decision must not be silently expanded to 2007 or modern OSRS.
- To change eras in future, create a separate decision proposal explaining why, update both upstream source pins *if applicable*, re-baseline every visual/gameplay test, re-audit licences and land one reviewed PR that updates this document, the lock, checklist and affected tests together.
- Any agent encountering incompatible evidence must open a scope exception or issue rather than swapping references in code.
- A **successful design lock does not imply a game implementation milestone, screenshot research completion or a playable full MMO**.

## 7. BASE-02 completion / next steps

- [x] One selected era, date and revision identified without ambiguity (**Option A, revision 274**).
- [x] Version/repo/commit compatibility declared; 2007 and post-2004 scope explicitly excluded.
- [x] Gameplay and visual rules established; mobile adaptations separated from source-era behaviours.
- [x] Asset/IP boundary and historical screenshot provenance limitations documented.
- [x] Checklist and README cross-reference this brief; CI guards accidental revision drift.
- [ ] **BASE-03** Capture and verify 30–50 annotated, **revision-specific** screenshots and interaction observations.
- [ ] **BASE-04** Enumerate exact historical features, skills, UI tab order and implementation gaps.
- [ ] Implement a newly licensed/original **classic-frame UI and low-poly 3D viewport** as separate, tested game milestones.

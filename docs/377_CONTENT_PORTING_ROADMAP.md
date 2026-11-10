# JoshRS Content Porting Roadmap & Licensing Architecture

**Target engine:** RuneScape 2, revision 377 (private 377 world workstream)
**JoshRS license:** MIT (original code only — Jagex-owned assets, dialogue, names, and branding are never covered by it)
**Document status:** v1.0 — Operational plan for incremental Quest / NPC / Object / Location imports

---

## 0. Governing Principles (Read Before Any Port)

These five rules override everything else in this document. Every PR must be able to answer "yes" to all of them.

1. **License ≠ Rights to Assets.** An MIT- or BSD-licensed *emulator codebase* never licenses Jagex-owned artwork, music, names, quest dialogue, or branding. Lost City's own license states this explicitly: source code is MIT, assets within remain Jagex IP. Therefore even "direct port" sources contribute **mechanics and structure**, not dialogue strings or assets.
2. **Copyleft is a one-way door.** GPL-3.0 / AGPL-3.0 code (2009scape, OpenRSC, osrsbox) can never be copied, blended, transpiled wholesale, or "laundered" into the MIT JoshRS tree. It is consulted as a *mechanical reference* only, and only through the clean-room protocol in Section 4.
3. **No blanket automated DB dumps.** Revision ID spaces (RSC ↔ 377 ↔ 530/508 ↔ modern OSRS) share nothing. Every entity mapping is a reviewed, recorded decision — automation proposes, humans confirm.
4. **A merged PR is not proof a feature works.** Consistent with JoshRS's own pipeline rules: nothing is called "playable" until compiled and tested inside the real custom 377 world.
5. **Pinned sources only.** Every external reference is pinned to an exact commit hash recorded in `provenance.yaml`. Floating `main` references are prohibited.

---

## 1. Source Classification & Strategy Matrix

### 1.1 Master matrix

| Project | Engine / Revision Era | Verified License | Permissibility Level | Integration Method for JoshRS |
|---|---|---|---|---|
| **Lost City / 2004Scape** (LostCityRS `Server`, `Engine-TS`, `Content`) | RS2, May 2004 → Nov 2004 (branches per revision: 254 = 2004-09-07, 274 = 2004-11-23) | **MIT for code**; Jagex assets & reconstructed dialogue expressly excluded | **Direct Port (code/mechanics)** — the only direct-port source | Pin exact branch/commit; port script structure, quest state machines, and NPC logic into JoshRS RuneScript with notices intact; re-author all dialogue text |
| **OpenRSC** (`Core-Framework`) | RuneScape Classic (2001–2003) | **AGPL-3.0** | **Clean-Room Mechanical Reference Only** | Read to understand RSC-era quest logic (Captain Rovin, Nurmof, King Arthur chains) and pre-RS2 dialogue trees; re-implement from a written neutral spec; zero code or text copied |
| **2009scape** (GitLab main repo) | RS2 HD, rev 530 (Jan 2009 content) | **AGPL-3.0** (older forks show CC BY-NC-SA 4.0 — treat any mirror as at least this restrictive) | **Clean-Room Mechanical Reference Only** | Use as reference for quest step ordering, varp/state semantics, and boss combat definitions; bridge 530→377 entity gaps via the mapping layer (Section 2); re-implement in JoshRS RuneScript |
| **OSRSBox** (`osrsbox-api`, `osrsbox-db`) | Modern OSRS | **GPL-3.0** (code); wiki-derived metadata is **CC BY-NC-SA 3.0** | **Data/Metadata Only — verification, never wholesale import** | Use as an oracle to verify combat levels, stat blocks, and item/NPC relationships. Individual *facts* (an NPC's combat level) are not copyrightable, but the compiled JSON datasets are licensed — query, don't copy the dataset into the repo |
| **RuneLite** (+ Quest Helper / OpenOSRS forks) | Modern OSRS client | **BSD-2-Clause** (permissive) | **Permissive but structurally alien** — reference for quest-step models only | Port the *idea* of the `Quest.java` enum / quest-step checklist structure (re-expressed, BSD notice if any code is genuinely reused); never port client-side OSRS logic into a 377 server; use quest-step definitions to build JoshRS test checklists |

### 1.2 Permissibility ladder (how to classify any new source)

```
TIER 0  Native 377 / JoshRS-authored ......... full freedom
TIER 1  MIT / BSD-2 / Apache-2.0 code ......... direct port allowed, notices kept,
                                               (Lost City, RuneLite)             dialogue/assets still re-authored
TIER 2  GPL-3.0 / LGPL / CC BY-SA ............ reference only, clean-room required
                                               (osrsbox, some tools)
TIER 3  AGPL-3.0 ............................. reference only, clean-room required,
                                               (2009scape, OpenRSC)              heightened audit logging
TIER 4  CC BY-NC-SA / ND / proprietary ....... facts may be read, nothing copied,
                                               (OSRS Wiki text, Jagex assets)     never redistributed
```

**Rule:** when a project has multiple licenses across its history (2009scape forks range from CC BY-NC-SA to AGPL-3.0), classify at the **most restrictive** license ever attached to the content you are reading, and record that in provenance.

### 1.3 The Jagex-content overlay (applies to every tier)

Even Tier 1 direct ports must strip or re-author:

- Quest and NPC **dialogue text** (Jagex copyright — write functionally equivalent original dialogue, or paraphrase beyond recognition; do not copy Lost City's reconstructed strings either, since those reconstructions are Jagex-derived)
- **Examine text**, item names where they are verbatim Jagex copy (names as short functional identifiers are generally fine; exact examine/description strings are not)
- Map object placements copied from extracted caches beyond what fair-use preservation norms and your own risk appetite allow — JoshRS's stated policy is original/cleared assets, so treat cache-extracted placement data as *reference* and re-derive placements from your own 377 cache inspection

---

## 2. ID Mapping & Translation Schema

### 2.1 The core problem

RSC, 274, 377, 530, and modern OSRS ID spaces are **completely disjoint**. There is no transpilation formula — only *evidence-based joins*. The design below makes every join explicit, reviewable, and reversible.

### 2.2 Architecture: three layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: JOSHRS CANONICAL REGISTRY (revision-agnostic)      │
│  Stable slugs + properties. e.g. npc:captain-rovin           │
│  The ONLY thing game content is authored against.            │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: REVISION BINDINGS (per-revision ID tables)         │
│  binding:377 → { npc: 647, loc: {...}, items: [...] }        │
│  binding:274, binding:530, binding:osrs → same slug,         │
│  their IDs. Each binding row carries a confidence + evidence. │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: TRANSLATION MANIFESTS (per external source)        │
│  external_id → slug, with method + confidence + reviewer.    │
│  Feeds the mapper that converts external data to slugs,      │
│  then Layer 2 resolves slugs to live 377 IDs at build time.  │
└─────────────────────────────────────────────────────────────┘
```

Content (quests, NPC behavior, object interactions) is written **only against slugs**. If a 377 cache update renumbers NPCs, you fix one binding table, not fifty quest files.

### 2.3 Canonical registry entry (Layer 1)

```yaml
# registry/npc/captain-rovin.yaml
slug: npc:captain-rovin
kind: npc
canonical_name: "Captain Rovin"          # display name (see 1.3 on names)
properties:
  role: quest_npc
  quests: [quest:shield-of-arrav]        # slugs, never IDs
  default_location: loc:varrock-castle-northwest-tower
  combat: { enabled: false }
notes: >
  Dialogue is JoshRS-authored original text (Jagex-derived text
  prohibited). Behaviour spec sourced clean-room from OpenRSC
  (AGPL) — see provenance: PR #<n>, spec doc specs/0042-rovin.md.
```

### 2.4 Revision binding (Layer 2)

```yaml
# bindings/377/npc/captain-rovin.yaml
slug: npc:captain-rovin
revision: 377
npc_id: 647                     # from YOUR 377 cache decode, verified
evidence:
  method: cache_decode          # cache_decode | manual_review | fuzzy_auto
  source: "cache/377/npc_def.json#647"
  verified_by: "josh"
  verified_at: "2026-11-08"
  confidence: 1.0
  checks:                       # machine-checkable corroboration
    name_match: "Captain Rovin"
    examine_absent: true        # 377 npcs often lack examine; fine
    spawn_region: 12852         # cross-checked against map decode
status: bound                   # bound | unbound | tombstoned
```

**Varp/Varbit handling (377-specific):** revision 377 has **varps only** — the varbit system did not exist yet. External sources (2009scape, OSRS) express quest state via varps *and* varbits. The binding layer therefore needs a varp allocator:

```yaml
# bindings/377/varp/allocations.yaml
# JoshRS-owned varp space for quest state. 377-era quests used
# specific Jagex varps; where a historical varp is known (from
# your 377 cache/config decode), bind it. Otherwise allocate
# from the JoshRS free range 2000-2999 and record it.
allocations:
  - slug: quest:shield-of-arrav.state
    varp: 146        # historical, decoded from 377 config archive
  - slug: quest:demon-slayer.state
    varp: 147
  - slug: quest:custom-joshrs-quest-01.state
    varp: 2001       # JoshRS free range — never collides with engine vars
```

### 2.5 Translation manifest (Layer 3) — per external source

```yaml
# translations/openrsc/npc.yaml   (source pinned in provenance.yaml)
source: openrsc/Core-Framework
source_commit: <exact-sha>
license_class: TIER3-AGPL          # triggers clean-room gate in CI
entries:
  - external_id: "rsc_npc:197"    # OpenRSC's internal ID
    external_name: "Captain Rovin"
    maps_to: npc:captain-rovin
    method: name+location+role     # the evidence used for the join
    confidence: 0.95
    review: { required: true, status: approved, by: "josh" }
  - external_id: "rsc_npc:212"
    external_name: "Nurmof"
    maps_to: npc:nurmof
    method: name+location+role
    confidence: 0.95
    review: { required: true, status: pending }
```

### 2.6 Mapper pseudocode (evidence-based join, automation proposes)

```python
def propose_mapping(external_entity, registry, bindings_377):
    """Suggest slug bindings for an external entity. Never auto-commits."""
    candidates = []
    for slug, entry in registry.items():
        if entry.kind != external_entity.kind:
            continue
        score = 0.0
        score += 0.40 * fuzzy_name(external_entity.name, entry.canonical_name)
        score += 0.15 * location_proximity(external_entity.spawn,
                                           entry.default_location)
        score += 0.15 * role_match(external_entity, entry)          # quest role, shop, combat
        score += 0.10 * stat_block_similarity(external_entity.combat,
                                              bindings_377[slug].combat)
        score += 0.10 * graph_context(external_entity, entry)       # neighbours, quest membership
        score += 0.10 * era_proximity(external_entity.revision, 377)
        candidates.append((slug, score))
    best = max(candidates, key=lambda c: c[1])
    if best[1] >= 0.85:
        return Verdict(best, "auto_candidate", needs_review=True)
    if best[1] >= 0.60:
        return Verdict(best, "ambiguous", needs_review=True, alternatives=candidates[:3])
    return Verdict(None, "no_match", needs_review=True)
```

Key property: **the mapper never writes**. It produces a review queue; a human binds the slug; CI refuses unbound or `pending` slugs in any compiled quest batch.

### 2.7 Entity missingness (things that exist upstream but not in 377)

When an external quest/NPC/item has **no 377 counterpart**, the binding is `tombstoned` and one of four dispositions is chosen:

```yaml
# bindings/377/item/tombstone-example.yaml
slug: item:god-book-saradomin
revision: 377
status: tombstoned
reason: "Entity did not exist in 377 era (introduced later)."
disposition: omit            # omit | substitute | defer | custom
substitute: null             # e.g. slug of closest 377-era equivalent
```

| Disposition | Meaning | Example |
|---|---|---|
| `omit` | Entity and any quest steps depending on it are cut from the 377 version | Post-377 quest rewards |
| `substitute` | A documented 377-era stand-in is bound; the substitution is visible in the quest spec and to players where fairness demands it | A later-era item replaced by its 377 ancestor |
| `defer` | Valid future content; parked in the backlog with the tombstone as its ticket | Later-era bosses |
| `custom` | JoshRS authors an original entity (new slug, Tier 0) to fill the gap — the preferred route where gameplay needs it | Your retired NPC-seller work showed this must be evidence-driven |

**Quest-level missingness:** a quest that post-dates 377 (e.g. most 2009scape HD quests) is not ported at all — the 104-quest historical target is the scope fence. Quests that *existed* in the 377 era but reference 2009-era reworks are ported from the **era-correct version of the mechanics**, using OpenRSC/2009scape only to disambiguate unclear steps.

### 2.8 The 274 → 377 bridge (Lost City specifics)

Lost City's newest public branches decode 2004 revisions (254, 274). JoshRS targets 377. Even the Tier 1 direct-port source therefore flows through the same mapping layer:

1. Pin the Lost City branch nearest 377 (currently the 274 / Nov 2004 line).
2. Run the mapper in **274→377 mode**: same fuzzy join, but with `era_proximity` weighted high, since 274 and 377 share most entity *identities* (if not IDs).
3. Diffs that fail the join (entities added or removed between 274 and 377) are routed to the missingness workflow in 2.7.
4. Mechanics port directly (MIT, notices kept); every ID reference inside ported scripts is rewritten slug→binding at build time by the compiler — no raw IDs in JoshRS quest source, ever.

---

## 3. Incremental / Phased Porting Workflow

### 3.0 Phase 0 — Foundation (before any content lands)

| Task | Exit criteria |
|---|---|
| Decode and freeze the 377 cache reference (NPC, item, object, map, config archives) | `cache/377/*.json` snapshots committed; checksums recorded |
| Stand up the three-layer registry (Section 2) with tooling | `joshrs-map` CLI can validate bindings, list unbound slugs, detect collisions |
| Allocate the JoshRS varp free-range and quest-state varp table | `bindings/377/varp/allocations.yaml` seeded with known historical quest varps |
| Create `provenance.yaml` + CI license gates (Section 4) | CI fails on: unknown license, unpinned source, Tier 2/3 file-touch, missing provenance entry |
| Define the RuneScript authoring conventions for quests (slug-only references, state machine pattern, dialogue module pattern) | Template quest committed (`quest:hello-joshrs` or similar Tier 0 demo) |

### 3.1 Phase 1 — Native 377 & MIT Upstream (direct port lane)

**Scope:** Lost City content, pinned and bridged.

Workflow per batch (one quest, or one geographic cluster of NPCs/objects, per PR):

```
1. PIN     Lock LostCityRS/Engine-TS + Content at exact commits;
           record hashes in provenance.yaml (source: TIER1-MIT).
2. SELECT  Choose the quest/batch from the era-correct quest list.
3. BRIDGE  Run mapper in 274→377 mode; human-review every binding;
           tombstone + disposition anything unbindable.
4. PORT    Translate Lost City script structure to JoshRS RuneScript:
           - keep: state machines, step ordering, trigger conditions,
             stat/XP math, item requirements, movement/interaction flow
           - replace: all dialogue text (re-authored), all raw IDs
             (slug bindings), any 274-only engine calls (377 equivalents)
           - keep: upstream MIT notice in the file header + NOTICE file
5. AUTHOR  Write original dialogue in the JoshRS voice (Section 1.3).
6. TEST    Golden-path + branch-path quest tests (Section 4.4).
7. SHIP    PR with provenance block; not "playable" until verified
           in the live custom 377 world per JoshRS pipeline rules.
```

Batch sizing guidance: **1 quest or ≤ ~10 related NPCs/objects per PR.** Never a mixed-source batch.

### 3.2 Phase 2 — Mechanical Porting & Clean-Room Transpilation (reference lane)

**Scope:** OpenRSC (AGPL), 2009scape (AGPL), and any GPL source — plus the Jagex-dialogue problem which affects *all* sources.

The clean-room protocol (two-role, can be one person wearing two hats with time separation, but the artifacts must exist):

```
┌──────────────┐   reads AGPL/GPL source   ┌──────────────────┐
│ SPEC WRITER  │ ───────────────────────►  │ NEUTRAL SPEC     │
│ (role A)     │   writes behavior only:   │ specs/NNNN-*.md  │
└──────────────┘   inputs, states, steps,  └────────┬─────────┘
                   rewards, edge cases —            │
                   NO code, NO dialogue,            ▼
                   NO variable names        ┌──────────────────┐
┌──────────────┐                            │ SPEC REVIEW      │
│ IMPLEMENTER  │ ◄──────────────────────────┤ (3rd pair of eyes│
│ (role B)     │   implements spec only —   │  or A after time │
└──────────────┘   never opens the AGPL    │  separation)     │
                   repo for this feature    └──────────────────┘
```

Neutral spec format (what Role A is allowed to write):

```markdown
# specs/0042-captain-rovin-behavior.md
Entity: npc:captain-rovin (slug only — no external IDs in specs)
Trigger: player Talk-to while quest:shield-of-arrav.state == 0
Behavior:
  1. NPC offers dialogue option "Ask about the shield" [AUTHOR: write original text]
  2. If player has item:armour-key in inventory → step 3, else step 5
  3. NPC sets quest state flag A; unlocks interaction with object:armour-cabinet
  4. ...
Rewards / state transitions: quest varp 0 → 1 on completion of step 7
Edge cases: player drops key mid-dialogue → state unchanged, dialogue exits cleanly
Provenance: derived from behavior observed in <source, commit> (TIER3) — no code copied
```

Transpilation to JoshRS RuneScript is then a **Tier 0 authoring act** against the spec — the implementer never has the reference repo open. The `.rs2` / `.npc` outputs follow the existing JoshRS native integration patterns (as already used for the Woodland Guide and Yrsa wardrobe work).

### 3.3 Phase 3 — Metadata Structuring (verification lane)

**Scope:** OSRSBox (GPL data, CC BY-NC-SA wiki text), RuneLite (BSD-2), OSRS Wiki.

Uses that are safe and valuable:

- **Quest step checklists:** derive JoshRS test checklists from RuneLite `Quest`/Quest Helper step structures — re-expressed as JoshRS test fixtures (BSD notice if code was genuinely reused; normally it's a re-expression, no code).
- **Verification oracle:** query OSRSBox for NPC combat levels / stat blocks to sanity-check your 377-era numbers *where the entity existed in both eras* — remembering that OSRS numbers reflect modern rebalances, so they are a sanity check, not a source of truth. Record queries as evidence in bindings, don't vendor the dataset.
- **Disambiguation:** when two 377 NPCs share a name, OSRS Wiki / OSRSBox context (location, quest association) helps pick the right binding.

Hard boundaries in this phase:

- No OSRSBox JSON files committed into JoshRS (GPL dataset).
- No wiki text pasted into specs or dialogue (CC BY-NC-SA).
- No modern OSRS interfaces, varbits, or client behavior assumed to exist in 377 — the JoshRS version-lock discipline already forbids this.

### 3.4 Phase 4 — Hardening & Automation (continuous)

- Regression harness grows with every ported quest (Section 4.4) — every new quest adds its golden-path test to the permanent suite.
- Mapper confidence thresholds are periodically re-tuned using review outcomes (how many auto-candidates were rejected by humans).
- Quarterly license re-audit: re-check pinned upstreams for license changes (the 2009scape fork history — CC BY-NC-SA ↔ AGPL — shows this happens), re-verify NOTICE files, re-run the forbidden-source hash scan.

### 3.5 Roadmap sequencing (suggested order)

| Wave | Content | Lane | Why first/next |
|---|---|---|---|
| 1 | Tier 0 demo quest + 2–3 Lost City starter quests (Cook's Assistant–class) | Phase 1 | Exercises the whole pipeline on low-risk, well-documented content |
| 2 | Free-to-play starter NPC clusters (Lumbridge/Varrock: Rovin, Nurmof-class) | Phase 1 + 2 | Builds the slug registry mass needed for later quests |
| 3 | Shield of Arrav / Demon Slayer–class state-heavy quests | Phase 2 (OpenRSC clean-room) | RSC-era logic is the era-correct reference for these |
| 4 | Object/location batches (doors, levers, cabinets, quest rooms) | Phase 1/2 | Quests depend on object bindings existing first |
| 5 | Remaining 104-quest historical target, batched by region | mixed | Steady-state cadence |

---

## 4. Verification & Clean-Room Provenance Logging

### 4.1 `provenance.yaml` (repo root, append-only, one entry per batch)

```yaml
- id: batch-2026-11-08-001
  pr: 87
  content: [quest:cooks-assistant, npc:cook-lumbridge, npc:milkmaid]
  sources:
    - role: ported                 # code/mechanics directly ported
      project: LostCityRS/Content
      commit: <sha>
      branch: "274"
      license: MIT
      files_touched: [quests/cooks-assistant/*.rs2]
      notice: "MIT notice retained in headers; NOTICE.upstream.md updated"
    - role: clean_room_reference   # consulted, nothing copied
      project: Open-RSC/Core-Framework
      commit: <sha>
      license: AGPL-3.0
      spec: specs/0011-cooks-assistant.md
      spec_author: josh            # role A
      implementer: josh            # role B (time-separated) or other
      attestation: >
        Implementer did not open the referenced repository while writing
        the implementation; no code, identifiers, or text were copied.
    - role: metadata_verification  # queried, not vendored
      project: osrsbox/osrsbox-db
      commit: <sha>
      license: GPL-3.0 (code) / CC BY-NC-SA 3.0 (wiki-derived data)
      usage: "API queries for stat-block sanity checks; no files committed"
  dialogue:
    policy: original_authorship     # always, for every source tier
    author: josh
  testing:
    quest_tests: passed
    golden_path: passed
    live_world_verification: pending   # must flip to passed before "playable"
  license_check: ci-green
```

### 4.2 CI gates (automated, blocking)

```yaml
# .github/workflows/license-gate.yml (pseudocode)
steps:
  - name: Forbid copyleft file provenance
    run: |
      # Diff-scan every changed file; for each, find its provenance entry.
      # FAIL if: file has no provenance entry,
      #          entry says ported but source license is not Tier 1,
      #          source commit is missing or unpinned.
  - name: Forbidden-source hash scan
    run: |
      # Maintain blocklist file-hashes of known AGPL/GPL source files
      # (2009scape, OpenRSC, osrsbox repos at pinned commits).
      # FAIL if any JoshRS file byte-matches or near-matches (shingle
      # similarity > 0.8) a blocklisted file. Catches accidental copies.
  - name: Dialogue originality scan
    run: |
      # Compare all new dialogue strings against a corpus of extracted
      # upstream dialogue (Lost City Content, OpenRSC, 2009scape).
      # FAIL on high similarity — flags copy-paste of Jagex-derived text.
  - name: Binding completeness
    run: |
      # Compile all quest/NPC/object content; FAIL on any slug that is
      # unbound, pending review, or tombstoned-without-disposition.
  - name: Varp collision check
    run: joshrs-map varps --check-collisions
```

### 4.3 PR audit template (paste into every content PR)

```markdown
## Content Provenance Audit — PR #<n>

**Batch:** <quest(s) / NPC cluster / objects>
**Lane:** [ ] Phase 1 direct port  [ ] Phase 2 clean-room  [ ] Phase 3 metadata  [ ] Tier 0 original

### Sources
| Source | Commit | License | Role (ported / reference / verification) |
|---|---|---|---|

### Clean-room attestation (Phase 2 only)
- [ ] Spec written from reference without copying code/identifiers/dialogue: specs/<n>.md
- [ ] Implementation authored against spec only; reference repo not open during implementation
- [ ] Spec review completed (by other person, or time-separated self-review)

### Dialogue & assets
- [ ] All dialogue is original JoshRS authorship (no Jagex-derived text from any source)
- [ ] No cache-extracted or upstream assets added
- [ ] Names/examine text reviewed against Section 1.3 rules

### Mapping
- [ ] Every entity slug bound to 377 with evidence + reviewer, or tombstoned with disposition
- [ ] Varp allocations recorded; no collisions
- [ ] Mapper auto-candidates all human-confirmed (list rejected candidates)

### Testing
- [ ] Quest state unit tests (varp transitions, branch conditions) — link to run
- [ ] Golden-path walkthrough test green
- [ ] Branch/edge-case tests (missing items, interrupted dialogue) green
- [ ] Verified in live custom 377 world: [ ] yes  [ ] pending (content NOT labeled playable until yes)

### Notices
- [ ] Upstream MIT/BSD notices retained where applicable; NOTICE.upstream.md updated
- [ ] provenance.yaml entry appended
```

### 4.4 Quest/NPC testing procedures (revision-377 bounds)

Three test tiers, all headless, all committed alongside the content:

**1. State-machine unit tests** — every quest is a varp-driven state machine; test it as one.

```pseudo
test cooks_assistant_golden_path:
  player = fresh_test_player()
  assert quest_state(player, quest:cooks-assistant) == 0
  talk(player, npc:cook-lumbridge)                 # via scripted client, headless
  assert has_item(player, item:bucket) or quest_flag(player, started)
  give(player, [item:egg, item:pot-of-flour, item:bucket-of-milk])
  talk(player, npc:cook-lumbridge)
  assert quest_state(player, quest:cooks-assistant) == 2   # complete
  assert xp_awarded(player, skill:cooking) == 300

test cooks_assistant_edge_interrupt:
  player = fresh_test_player()
  start_quest(player)
  drop(player, item:egg)                           # mid-quest item loss
  talk(player, npc:cook-lumbridge)
  assert quest_state(player, quest:cooks-assistant) == 1   # still in progress, no crash
  assert dialogue_offers(player, "hint_about_missing_item") # graceful handling
```

**2. Dialogue-tree exhaustiveness** — walk every dialogue node; assert no dead ends, no orphan options, and that all options are reachable under some state combination. This is where the RuneLite-derived quest-step checklist (Phase 3) becomes the assertion source: every checklist step must correspond to at least one reachable game state.

**3. Live-world verification** — the existing JoshRS rule stands: a human (or the 377 bot workstream, using normal-gameplay constraints only) completes the quest in the real custom 377 world. Only then may the content be marked playable; the provenance entry's `live_world_verification` field flips to `passed`.

**NPC behavior accuracy** — spawn locations cross-checked against 377 map decode (binding evidence already records this); combat stats against 377 cache decode with OSRSBox as sanity oracle; behavior scripts tested with scripted interactions (the pattern already proven by the Yrsa Trade-interaction patch).

---

## 5. Operating Cadence & Governance

- **One batch = one PR = one provenance entry.** No mixed-lane batches (a PR is either Phase 1, 2, 3, or Tier 0 — mostly).
- **Decision log:** any license judgment call (e.g. "we classified mirror X as CC BY-NC-SA because fork history") goes in `docs/license-decisions.md` with date and reasoning, so future maintainers inherit the rationale, not just the outcome.
- **Escalation rule:** if any question arises about whether something is copyable — default to the stricter classification and the clean-room lane. Slower is fine; a copyleft or Jagex-IP contamination in an MIT repo is not recoverable by patching.
- **Backlog hygiene:** tombstoned entities with `disposition: defer` are the natural future-content backlog — they already carry their evidence and reason.

---

## Appendix A — Source Links & License Evidence

| Source | Repository | License evidence |
|---|---|---|
| Lost City / 2004Scape (MIT code, Jagex assets excluded) | https://github.com/LostCityRS/Server · https://github.com/LostCityRS/Engine-TS · https://github.com/LostCityRS/Content | Repo LICENSE files; Content README: "Source code is licensed under the MIT License… Assets within are the intellectual property of Jagex Ltd" |
| OpenRSC (AGPL-3.0) | https://github.com/Open-RSC/Core-Framework | Repo license: GNU AGPL v3.0 |
| 2009scape (AGPL-3.0; forks show CC BY-NC-SA 4.0) | https://gitlab.com/2009scape/2009scape | README: "We use the AGPL 3.0 license" |
| OSRSBox (GPL-3.0 code; CC BY-NC-SA 3.0 wiki-derived data) | https://github.com/osrsbox/osrsbox-api · https://github.com/osrsbox/osrsbox-db | LICENSE (GPL-3.0) and README license exceptions section |
| RuneLite (BSD-2-Clause) | https://github.com/runelite/runelite | LICENSE: BSD 2-Clause |
| JoshRS (MIT, target of this plan) | https://github.com/Parris-Tech-Services/JoshRS | LICENSE; README licensing and content-pipeline policy |

## Appendix B — Glossary

- **Slug** — JoshRS's stable, revision-agnostic canonical identifier (`npc:captain-rovin`). All authored content references slugs; bindings resolve them to 377 IDs at build time.
- **Binding** — the evidence-backed mapping of a slug to a concrete revision-377 cache ID (NPC/item/object/varp), with method, confidence, and reviewer.
- **Tombstone** — the record of an external entity that has no 377 counterpart, plus its disposition (omit / substitute / defer / custom).
- **Lane** — the compliance path of a batch: Phase 1 (direct port, Tier 1 sources), Phase 2 (clean-room, Tier 2/3 sources), Phase 3 (metadata/verification), Tier 0 (original).
- **Neutral spec** — a clean-room intermediate document describing behavior (states, steps, triggers, rewards) with no code, identifiers, or dialogue copied from the reference source.

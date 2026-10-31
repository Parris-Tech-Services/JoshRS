# JoshRS 377: source matching, dispatch evidence and single-harvester workflow

**31 October 2026 • Status: repository metadata and static QA, NOT live client gameplay.**
This complements [PR #38](https://github.com/Parris-Tech-Services/JoshRS/pull/38), whose \`content-factory/harvest_multi.py\` is the **only** additional multi-provider harvester. Do not introduce a second importer or a second hourly source scan.

## Implementation and responsibilities

- \`content-factory/factory.py\` remains the original source and work-order owner. Its normal GitHub scans now use **exact pinned 377 commit SHAs** for Lost City Content, Engine-TS and Client-Java instead of mutable 377-wip branch heads. A complete, untruncated pinned Content tree persists as \`generated/pinned-377-index.json\` (path and Git blob SHA only).
- \`content-factory/harvest_multi.py\`, merged earlier in PR #38, is the one public GitHub/GitLab/Hugging Face/OpenRS2 metadata collector. It keeps bounded source metadata, source revision, cursor and rights warning; no copyrighted assets are copied. \`factory.py --source-metadata\` calls this **same module**, not a competing implementation.
- \`content-factory/sources.json\` now also lists OSRSReboxed, OpenRSC and RuneWiki RS-DataAPI as **metadata_only** GitHub sources using the *existing* factory scanner.
- \`content-factory/harvest_match.py\` reads the existing factory's pinned 377 pack index, optionally the \`harvest_multi.py\` \`catalog.json\` (from a read-only run or downloaded GitHub artifact), and compares **exact path/blob identities**. It never guesses a 377 NPC or quest ID from a modern source name. Partial baselines say \`baseline_complete=false\` and carry \`unmapped_partial_inventory\`, never "missing".
- \`content-factory/harvest_match.py --proposals original.json\` also validates original NPC dialogue graph syntax, distinct greetings, branch links, exits and provenance. It rejects speculative numeric IDs; this is a **non-installable proposal** gate.
- \`content-factory/audit_dispatch.py\` is a local **read-only** source and script-pack fingerprint diagnostic for three known pinned 377 scripts: Reldo, Juliet and Romeo. It emits no dialogue text, account identifiers or private paths. Agent 1 still owns fixes; Agent 3 must establish what the real Java process has loaded.
- Existing native 377 CI tests/compiles still run in disposable checkouts. They are not a substitute for actual client and relog/persistence evidence.

## Commands

Run in a safe source checkout, NOT the active customised game directory:

\`\`\`bash
python content-factory/factory.py --live --source-metadata --source-compare
python content-factory/harvest_match.py --harvest-catalog /path/to/saved/public/catalog.json
python content-factory/audit_dispatch.py --content /path/to/disposable/377/content
python -m unittest discover -s content-factory/tests -v
\`\`\`

The first command uses the **existing** \`harvest_multi.run()\` and stores metadata at \`content-factory/generated/multi-source\`. It can be slow: source providers may be rate-limited. For one public source, use \`python content-factory/harvest_multi.py --source 2009scape-gitlab\` or one of the existing registered source keys.

\`harvest_match.py\` needs a source scan from **exact pinned Content commit** first; without it, it returns \`blocked_no_pinned_inventory\`. If \`generated/pinned-377-index.json\` exists for that SHA, the comparator uses that complete path inventory, not a 500-file scan cursor. Results always set \`missing_confirmed=0\` and \`client_verified=0\` until actual external QA evidence is separately established.

## One hourly schedule, separate coordination

PR #38's [.github/workflows/verify-harvest-metadata.yml](../../../.github/workflows/verify-harvest-metadata.yml) already runs at **minute 13 UTC every hour**, publishing short-lived public metadata artifacts. This branch keeps the original full content factory's **daily** schedule unchanged. Do not double its source harvesting at another hourly minute. The separate ChatGPT hourly content contributor should read the latest saved artefact and current issues, then produce one small verified research or validation handoff.

## First live regression investigation: generic NPC greetings

Pinned Content \`44eab09081ef0f6c5f3eaabd1897a588ad7d9e50\` already has:
- \`scripts/areas/area_varrock/scripts/reldo.rs2\`, \`[opnpc1,reldo]\`
- \`scripts/areas/area_varrock/scripts/juliet.rs2\`, \`[opnpc1,juliet_multi_visible]\`
- \`scripts/areas/area_varrock/scripts/romeo.rs2\`, \`[opnpc1,romeo]\`

These are **existing source scripts**, not three confirmed broken NPCs. Source-trace metadata is in [Varrock ledger](VARROCK_NPC_SOURCE_TRACE_2026-10-31.json). Agent 4's headless reports show script-runner routing for some named NPCs, but this is not actual Java client playback. Agent 1 should inspect the active \`OPNPC1\` -> morph/multinpc/category script dispatch -> fallback and loaded \`script.dat/script.idx\`; Agent 3 should first checksum/backup the active state, then verify real click/quest branch and logout/relog on a disposable account. If the pack is stale, correct loading before writing replacement dialogue.

## Source/legal limits

- GitHub historical scripts: commit/tree/blob identities only until source and rights review. Exact SHA, source path, area and target era must accompany each claim.
- GitLab [2009Scape](https://gitlab.com/2009scape/2009scape): later-era AGPL source, metadata and independent behavioural test ideas only; cannot be dropped into the MIT project.
- [OpenRS2](https://archive.openrs2.org/api): cache identifier 2696 provenance only, not a game completion percentage; no archive/model/map binaries.
- [Hugging Face knowledge dataset](https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data): dataset card, file listing and schema relationships, not its game data.
- [OSRSReboxed](https://github.com/RSPSApp/osrsreboxed-db), [OpenRSC](https://github.com/Open-RSC/Core-Framework), [RuneWiki](https://github.com/RuneWiki/RS-DataAPI): source/documentation references, not executable 377 IDs or copied dialogue.
- User's personal Drive 377 snapshot: metadata and comparison stay private. No Drive IDs, account names, saves, credentials or raw scripts in public GitHub.
- [Jagex Fan Content Policy §6.1.3](https://legal.jagex.com/docs/policies/fan-content-policy) excludes derivative game software and private servers from its standard permission. These components do not grant rights to distribute third-party game assets.

## Reusable hourly acceptance contract

One geographic hub, at most three source-verified NPCs or a single quest/region issue. Check latest #35/#36 and ownership. Source discovery -> 377 exact-pin comparison -> gap/rights review -> if proven, original proposal -> static validation -> isolated compile -> Agent 1 implementation -> Agent 3 real Java-client and persistence verification. Preserve existing trading, bank, jewellery, rune, quest and shop behaviour. No auto merges into the active game, no speculative extra vendors and no false "playable" labels.

**Blocked:** no direct access to actual JParris Windows running process here, no validated live 377 pack fingerprint, and no NPC names or IDs specifically tied to the observed universal greeting. Therefore this repository work does not fix the live symptom; it creates safer diagnostics and stops duplicate content proposals.

# JoshRS 377 gameplay implementation & rights audit

## What is and is not a missing feature

The pinned 377 runtime is `LostCityRS/Engine-TS@b5ac859` and `LostCityRS/Content@44eab090`, installed **outside** the public JoshRS launcher. Its scripts are already part of that upstream world and must not appear as unimplemented work simply because GitHub discovered their filenames. An upstream source listing is not proof that a given interaction is working on Elrothiro's customised world.

The factory uses exact revision and Git blob identities to classify candidate paths:

| Stage | Meaning | Automatic action |
|---|---|---|
| `already_in_pinned_source` | File is already in the pinned source; or identical byte-for-byte to a historical branch file | Catalogue it; do not assign a duplicate port |
| `manual_port_required` | Other-era code or incompatible engine; source requires code/rights review and real 377 port | Queue as reference only |
| `rights_review_required` | Potential proprietary configuration or cache-related types | Never fetch, redistribute or compile automatically |
| `blocked_reference_only` | Reference with uncertain/incompatible software licence | Metadata only |
| `portable_spec_only_not_compiled` | Original structured NPC/item/quest specification | Run explicit native adapter and compiler |

The live runner writes `content-factory/generated/rights-and-compatibility.json`, the rolling `agent-work-orders.json` and public-source manifests. They are **not** proof of completed feature ports. Third-party content remains untrusted.

## Existing features checked before implementing new ones

The exact pinned Content SHA is `44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`. Its `pack/obj.pack` already defines `lawrune`, `naturerune`, `amulet_mould` and `chisel`. Its `scripts/skill_crafting/scripts/jewellery/jewellery.rs2` already implements amulet-crafting interaction handlers. Latest upstream branch search also shows shops, monster drops and existing equipment mechanics, but latest-branch source is not automatically part of a pinned local installation.

**Correction, 31 October 2026:** Seven unrequested JoshRS trade NPCs were speculative rather than proven missing functionality. The game may already provide the same items through its native shops, drops and crafting. They have been removed from the generated native gameplay addon; only the original optional Woodland Guide remains. The initial barter drafts are not playable enhancements. A gated migration removes only those explicitly named temporary JoshRS NPC registry entries and backs up the original registry. No existing vanilla items, shops or saves are removed.

`content-factory/gap_audit.py` must check existing game definitions and mechanics against the pinned content before any new NPC is accepted. A new gameplay feature needs evidence of a *specific broken or absent interaction*, not simply an item identifier, file discovered on GitHub or compiler success. Source confirmation and in-game user-world verification are reported separately.

## What counts as verified

- **Native source generated**: Python input schema and hash tests passed, source files available in repository.
- **Compiler verified**: GitHub Actions `Verify native 377 content pack` cloned exact pins and produced nonempty server `script.dat` / `script.idx`, with scoped NPC checksum handling and other `BUILD_VERIFY` gates preserved.
- **Gameplay verified**: Only when JParris Desktop starts the user's private runtime, the NPCs appear correctly, the guide interaction works, the inventory stays consistent, and Elrothiro can log out and resume safely.

The second stage does not imply the third. Check the current Actions result before claiming the second stage. Elrothiro's local world and player saves are not accessible on the GitHub-hosted runner.

## Incremental feature conversion

Future reviewed mechanics must follow the same pattern: confirm missing behaviour (not just a discovered file), verify code licence and separately verify asset rights, implement in a local 377-compatible adapter, add negative/inventory tests, compile against pinned 377, then conduct a backed-up real-world test. **No third-party scripts, caches, models, songs or map files are silently copied into JoshRS.**

The automated source scanner can classify large numbers of candidates and rotate work orders, but legal provenance and in-game validation cannot be reduced to filename matching or an arbitrary AI decision. Track those as separate gates.

## Candidate-level rights/compilation ledger

`content-factory/generated/candidate-evidence.json` is a readable summary/index; its `shards[]` field links to small files under `content-factory/generated/candidate-evidence-shards/`, each containing individual immutable source fingerprints and review statuses for every *currently indexed* candidate. The index verifies the SHA-256 hash, candidate count and source label of every shard and rejects invented rights/playtest approvals. Identical file blobs across historical branches deduplicate by repository/path/blob SHA; counts therefore differ from the raw discovery totals. `repository_software_license` is accompanied by the licence-file URL, **not** marked as independent permission for dialogue, maps, textures, caches, music or game assets. No third-party candidate is marked individual-rights-approved, compiled as a new gameplay port, or player-tested without further evidence.

The per-source scan batch has increased from 100 to 500 eligible paths per run (up to 1,000 supported), with a capped retained inventory of 12,000 per source. Do not mistake those limits for an exhaustive audit of all historical RuneScape content. A live client interaction and save restoration in the owner's local Windows world are required before claiming any feature playable for Elrothiro.

The `Verify native 377 content pack` workflow now compiles original source against the exact pinned 377 commits, performs a disposable SQLite schema migration and boots the resulting game and web servers, checking that both listeners accept connections. **Listener success is not a player login or interaction test.**

## Work-order deduplication

Historical branches can contain the same script path at several revisions. The per-file provenance ledger retains every distinct blob for review, but the implementation queue now creates **one work item per upstream repository/path**, choosing the latest historical content revision as the starting reference rather than assigning an identical gameplay feature several times. The work queue reports `candidate_pool` (unique tasks), `raw_reference_versions` (all queued source-version records), and `deduplicated_reference_versions` (how many duplicate branch entries were removed). This is task deduplication, **not** proof that the feature has been ported, permitted or playtested.


## Live follow-up checklist

- [#28 — cross-project historical gameplay completeness](https://github.com/Parris-Tech-Services/JoshRS/issues/28) separates source entries, quest end-state traces and player-verified completion.
- [#29 — player-observed 377 interaction gaps](https://github.com/Parris-Tech-Services/JoshRS/issues/29) must reproduce a broken interaction before approving a port or replacement NPC.
- [#30 — local desktop/VM gameplay and Elrothiro save tests](https://github.com/Parris-Tech-Services/JoshRS/issues/30) remains unverified by GitHub-only checks.

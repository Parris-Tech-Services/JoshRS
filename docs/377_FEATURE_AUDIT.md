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

## Implemented original gameplay source

The native generator now includes eight original JoshRS NPCs (seven server-authoritative inventory trades), with fixed code-reviewed recipes rather than untrusted scripts:

| NPC | Interaction | Rules |
| --- | --- | --- |
| Woodland Guide | Talk-to and original welcome dialogue | No item rewards |
| Timber Buyer | Sells three ordinary logs | Receive twelve coins |
| Ore Buyer | Sells two copper ores | Receive eight coins |
| Trail Provisioner | Purchases one cooked meat | Pay four coins; requires free inventory slot |
| Law Rune Vendor | Purchases one law rune | Pay 35 coins; requires free inventory slot |
| Nature Rune Vendor | Purchases one nature rune | Pay 20 coins; requires free inventory slot |
| Crafting Supplier | Purchases one amulet mould | Pay 25 coins; requires free inventory slot |
| Tool Supplier | Purchases one chisel | Pay five coins; requires free inventory slot |

These trades refer only to existing pinned 377 item identifiers. The generated files are native text-only `.npc` / `.rs2` source, not copyrighted cache data or client assets. The trading NPCs are manually spawnable for private game testing, not persistent map additions. User account/save changes are explicitly excluded.

## What counts as verified

- **Native source generated**: Python input schema and hash tests passed, source files available in repository.
- **Compiler verified**: GitHub Actions `Verify native 377 content pack` cloned exact pins and produced nonempty server `script.dat` / `script.idx`, with scoped NPC checksum handling and other `BUILD_VERIFY` gates preserved.
- **Gameplay verified**: Only when JParris Desktop starts the user's private runtime, the NPCs appear correctly, all seven trade paths work, the inventory stays consistent, and Elrothiro can log out and resume safely.

The second stage does not imply the third. Check the current Actions result before claiming the second stage. Elrothiro's local world and player saves are not accessible on the GitHub-hosted runner.

## Incremental feature conversion

Future reviewed mechanics must follow the same pattern: confirm missing behaviour (not just a discovered file), verify code licence and separately verify asset rights, implement in a local 377-compatible adapter, add negative/inventory tests, compile against pinned 377, then conduct a backed-up real-world test. **No third-party scripts, caches, models, songs or map files are silently copied into JoshRS.**

The automated source scanner can classify large numbers of candidates and rotate work orders, but legal provenance and in-game validation cannot be reduced to filename matching or an arbitrary AI decision. Track those as separate gates.

## Candidate-level rights/compilation ledger

`content-factory/generated/candidate-evidence.json` is a readable summary/index; its `shards[]` field links to small files under `content-factory/generated/candidate-evidence-shards/`, each containing individual immutable source fingerprints and review statuses for every *currently indexed* candidate. The index verifies the SHA-256 hash, candidate count and source label of every shard and rejects invented rights/playtest approvals. Identical file blobs across historical branches deduplicate by repository/path/blob SHA; counts therefore differ from the raw discovery totals. `repository_software_license` is accompanied by the licence-file URL, **not** marked as independent permission for dialogue, maps, textures, caches, music or game assets. No third-party candidate is marked individual-rights-approved, compiled as a new gameplay port, or player-tested without further evidence.

The per-source scan batch has increased from 100 to 500 eligible paths per run (up to 1,000 supported), with a capped retained inventory of 12,000 per source. Do not mistake those limits for an exhaustive audit of all historical RuneScape content. A live client interaction and save restoration in the owner's local Windows world are required before claiming any feature playable for Elrothiro.

The `Verify native 377 content pack` workflow now compiles original source against the exact pinned 377 commits, performs a disposable SQLite schema migration and boots the resulting game and web servers, checking that both listeners accept connections. **Listener success is not a player login or interaction test.**

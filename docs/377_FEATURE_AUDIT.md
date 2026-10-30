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

The native generator includes these four original JoshRS NPCs, with fixed trade rules rather than untrusted executable content:

| NPC | Interaction | Rules |
| --- | --- | --- |
| Woodland Guide | Talk-to and original welcome dialogue | No item rewards |
| Timber Buyer | Sells three ordinary logs | Receive twelve coins |
| Ore Buyer | Sells two copper ores | Receive eight coins |
| Trail Provisioner | Purchases one cooked meat | Pay four coins; requires free inventory slot |

These trades refer only to existing pinned 377 item identifiers. The generated files are native text-only `.npc` / `.rs2` source, not copyrighted cache data or client assets. The trading NPCs are manually spawnable for private game testing, not persistent map additions. User account/save changes are explicitly excluded.

## What counts as verified

- **Native source generated**: Python input schema and hash tests passed, source files available in repository.
- **Compiler verified**: GitHub Actions `Verify native 377 content pack` cloned exact pins and produced nonempty server `script.dat` / `script.idx`, with scoped NPC checksum handling and other `BUILD_VERIFY` gates preserved.
- **Gameplay verified**: Only when JParris Desktop starts the user's private runtime, the NPCs appear correctly, all three trade paths work, the inventory stays consistent, and Elrothiro can log out and resume safely.

The second stage does not imply the third. Check the current Actions result before claiming the second stage. Elrothiro's local world and player saves are not accessible on the GitHub-hosted runner.

## Incremental feature conversion

Future reviewed mechanics must follow the same pattern: confirm missing behaviour (not just a discovered file), verify code licence and separately verify asset rights, implement in a local 377-compatible adapter, add negative/inventory tests, compile against pinned 377, then conduct a backed-up real-world test. **No third-party scripts, caches, models, songs or map files are silently copied into JoshRS.**

The automated source scanner can classify large numbers of candidates and rotate work orders, but legal provenance and in-game validation cannot be reduced to filename matching or an arbitrary AI decision. Track those as separate gates.

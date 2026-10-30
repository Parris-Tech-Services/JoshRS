# JoshRS 377 content factory

## Status and target

This pipeline inventories candidate code and community knowledge for RuneScape revision 377 and earlier/later projects available before 30 October 2026, with priority on the 377-wip Lost City runtime on JParris Desktop. It does not upgrade the revision-377 binary client into modern RuneScape or guarantee current-era features can run on the old protocol.

GitHub Actions is configured daily at 03:21 UTC, on manual dispatch and for relevant code pushes. Schedules can run late or be disabled by GitHub. Hosted runners do not require keeping your PC running or buying an API subscription. The runner writes catalogues and original specs into the repo when allowed by branch permissions.

## Pipeline

1. Read content-factory/sources.json: seeded public sources and explicit refs, eras and rights policies.
2. Use public GitHub tree metadata to identify source paths and immutable blob hashes. Process 40 eligible paths per source per run, using a rolling cursor in generated/state.json.
3. Discover further public repositories with bounded searches. New finds remain untrusted metadata-only; their code is never executed or automatically licenced.
4. Stage generated/packs/<source>.json: source permalink, blob/tree SHA, risk/status. These are research/integration *queues*, not playable native game packs.
5. Convert only strictly user-authored JSON records from intake into generated/original-content-specs.json. This structured specification is not a .dat/.idx cache, .rs2 script or compiled quest.
6. Rank candidate paths into generated/agent-work-orders.json, with explicit permissions and runtime-verification steps. These are work orders, not installed content.
7. Test all converters/safety guards before the workflow commits the generated files. Agy, Codex and Claude Code can then implement candidates in the actual private 377 content checkout.

## Rights and compatibility

- Lost City code can be MIT-licensed, but historical RuneScape textures, models, maps, sprites and songs belong to Jagex. Code licences do not license these game assets.
- 2006Scape's GPL-3.0 code must not be automatically blended into MIT JoshRS. Decompiled clients require further rights review.
- Never fetch/commit caches, original client binaries, copyrighted dialogue, model files, proprietary texture maps, credentials or modern OSRS assets.
- .npc, .obj, .loc, .seq and .pack files are flagged rights_review_required, even if source code nearby is under MIT.
- Later-game features require new IDs, scripts, protocol and UI/client compatibility, packer checks, client login and gameplay testing.

## How to run

Offline tests: python3 -m unittest discover -s content-factory/tests -v

Original-content conversion without internet: python3 content-factory/factory.py

Live public-source inventory: python3 content-factory/factory.py --live --discover

The live inventory can hit GitHub API rate limits; supply GH_TOKEN with public read rights if needed. See AGENTS.md for what an implementation agent must do with each record.

The actual personalised JoshRS 377 game and saves remain in your private local runtime, not in this public repo. A GitHub runner cannot test Elrothiro or the customised client without a safely connected test environment.

## Status meanings

- agent_review_required: 377 source-code candidate; no code copied or tested.
- manual_port_required: another-era code requiring a 377-compatible rewrite.
- rights_review_required: config/asset metadata must pass rights review.
- blocked_reference_only: source or rights blocked from direct import.
- portable_spec_only_not_compiled: original user-authored record in portable JSON, awaiting a real runtime adapter.

The catalogue's candidate_total counts staged file paths, not playable gameplay features or all RuneScape updates.

## Limits

Truncated API trees, GitHub rate limiting and full inventory caps can stop exploration. The script fails closed on unreliable data. This is an actual rolling source-discovery and portable-specification factory, not a universal automated remake of every RuneScape release.

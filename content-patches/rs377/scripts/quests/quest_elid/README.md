# Spirits of the Elid — JoshRS revision-377 original quest port

This port uses existing revision-377 cache-backed NPC, item and location debugnames, with entirely JoshRS-original dialogue. Quest progress and golem/channel flags persist in the original `%elid_main` varp; there is no permission to access player saves from GitHub CI.

Implemented progression: Mayor start; Ghaslor's ballad; Shiratti's guidance; actual shrine cupboard torn robes and needle/thread repair; ancestral key retrieved using actual rune inventory and item-on-shrine (not the historical Telekinetic Grab cast); river root/rope entry; key+robes check; three map-backed golem door encounters; stage updates only after actual NPC combat death credited to player; three independent ranged/mining/thieving channel actions; spirits' direction; mayor's shoes and knife-on-shoes; actual crevice rope use; genie's sole-for-statuette trade; real shrine plinth item hand-in; once-only quest completion XP/QP.

**Historical fidelity and gameplay blockers (not complete):**
- River waterfall rope entrance, cave entry tile and genie cavern teleport coordinates are reconstruction approximations; verify in the normal client and correct unreachable/misaligned destinations against live map.
- Key retrieval uses a genuine item-on-shrine rune requirement rather than the native Telekinetic Grab spell packet, which still requires wiring.
- Repaired robes and water channels need visual, animation, projectile, collision and door validation. The ranged channel checks an equipped shortbow and bronze arrow rather than the normal ranged attack packet.
- NPC colour-specific attack vulnerability, cave exits, light-source check and mayor shoes ground pickup not yet implemented. Normal-player combat, rewards and relog test still required.
- Source compiles and disposable server boot only if the CI passes; this is not a deployed Windows patch.

**Safety:** No existing family player, saves, accounts, assets, credentials or copyrighted dialogue are committed or accessed.

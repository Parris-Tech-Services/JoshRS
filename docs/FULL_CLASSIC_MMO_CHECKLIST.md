# JoshRS: full classic RuneScape-style MMORPG checklist

Last checked: 30 October 2026 (Australia/Sydney). Owner: JoshRS project. Status: **PARTIALLY COMPLETE — NOT a full independent MMORPG**.

This is the authoritative feature-by-feature acceptance register for transforming JoshRS into a **full-featured, independent, free-to-play, desktop/mobile, classic RuneScape-style MMORPG**. It is a checklist of desired outcomes, not a claim that they are all implemented. A completed feature must have a link to evidence and pass actual gameplay acceptance before checking its box.

## 0. Define exactly which historical target

- [x] **BASE-01** Identify the established technical research target: Lost City / 2004Scape **revision 274, November 23, 2004**. The local research-only pinned engine and content builds are separate from the published JoshRS game. Evidence: deploy/server/README.md, docs/SELF_HOST.md.
- [ ] **BASE-02** Lock one *visual/gameplay reference version* in an approved design brief: (A) November 2004 rev 274, or (B) a particular 2007-era OSRS snapshot. These are **different games/interfaces**. Do not silently mix 2004, modern OSRS and post-2007 features.
- [ ] **BASE-03** Record 30–50 reference interactions and annotated screenshots: first login, spawn, walking, camera, minimap, bank, shop, inventory, skills, dialogues, combat, prayer, magic, quest, login/logout, mobile navigation. Use screenshots strictly for **comparison and analysis**, not as reusable game assets.
- [ ] **BASE-04** Produce a feature-by-feature reference matrix (reference / JoshRS / test / status / gap) and assign each feature an issue. Specify exact historical skill roster for the chosen snapshot—no invented “all OSRS skills” count.
- [ ] **BASE-05** Define the release target: independent **original** game inspired by classic play, or *licensed* historically exact recreation. The latter cannot be assumed to be licensed by an MIT engine repository.
- [ ] **BASE-06** Freeze a measurable definition of “full game”, “early-access MMO” and “historical parity” before marketing. The “full” label requires all release gates in section 13, not just a visible login screen.

### Important rights boundary — release blocker

- [x] **RIGHTS-01** Verify code versus asset licensing: LostCityRS Engine-TS and Client-TS code are MIT; LostCityRS Content explicitly says Jagex-owned assets **are not** covered by MIT. Jagex Fan Content Policy §6.1.3 excludes private servers using Jagex property. Evidence: https://github.com/LostCityRS/Content/blob/main/README.md and https://legal.jagex.com/docs/policies/fan-content-policy.
- [ ] **RIGHTS-02** If pursuing exact RuneScape sprites, models, textures, terrain, quest scripts, icons, audio, map, characters, trademarks or names, **obtain written permission** covering the precise intended hosting/distribution. Until then, these remain blocked for public JoshRS.
- [ ] **RIGHTS-03** Otherwise create/license **original** low-polygon meshes, UI textures, sounds, environments, maps, names, quests and items with documented provenance. “Looks classic” is a target; reproducing Jagex assets pixel-for-pixel without permission is not.
- [ ] **RIGHTS-04** Maintain an asset manifest (source URL, author, actual licence, modification, attribution, redistributed path, review) and automated check blocking unknown assets in production.
- [ ] **RIGHTS-05** Audit all dependencies for code licences and attribution obligations; preserve MIT notices and any additional requirements (e.g., copyleft code if adopted). Separate engine licence from historical game content.
- [ ] **RIGHTS-06** Confirm site wording, title, logos and advertisements do not imply affiliation or official endorsement.

## 1. Visual fidelity: get the actual *classic-game feel*, not a dashboard

**Current:** Woodlands uses original, flat top-down Canvas art with a sidebar dashboard. It does **not** yet look like historical RuneScape, which used a low-polygon 3D world and a fixed game frame.

- [ ] **VIS-01** Create an original low-poly WebGL 3D world scene with tilting/rotating camera, terrain heights, water, shading, buildings and animated characters (historical reference, not copied models).
- [ ] **VIS-02** Implement the familiar *composition*: 3D gameplay viewport, circular minimap in upper right, icon-tab panel at right, parchment-like chat strip below the viewport, classic action menus and modal overlays; original art.
- [ ] **VIS-03** Design a fixed-aspect desktop frame and a properly reflowed mobile layout rather than shrinking desktop hit targets; handle portrait, landscape and notched screens.
- [ ] **VIS-04** Implement original hand-crafted stone/wood/parchment-style interface borders, panel art, backgrounds, readable bitmap-like typography and textured button states with rights-cleared assets.
- [ ] **VIS-05** Implement classic item-grid slots with stack counts, hover/tap descriptions, drag-select and equipment icons.
- [ ] **VIS-06** Add main tabs for inventory, stats, quests, equipment, combat style, prayer, magic, friends, settings, emotes and logout, limited by chosen historical version.
- [ ] **VIS-07** Build minimap with compass, landmarks, NPC/player markers, destination flag and click/tap navigation.
- [ ] **VIS-08** Create context menus with click/hold/right-click support and historically familiar ordering (“Walk”, “Talk”, “Use”, “Examine”, etc.), while preserving accessible alternatives.
- [ ] **VIS-09** Add chat system with channel selectors, history scrollback, timestamps/options as historically appropriate, name colouring, filtering and moderation.
- [ ] **VIS-10** Include 3D character customisation and appearance preview with original hair, body, clothing, equipment and animations.
- [ ] **VIS-11** Add interface animations: opening bank/shop/dialogue/quest windows, XP drops/level notifications, health bars, damage splats, item-ground labels and progress feedback.
- [ ] **VIS-12** Create an annotated side-by-side **reference/own implementation** screenshot-review suite (desktop 1280x720, phone portrait/landscape, varied zoom) with manual visual sign-off; never reuse screenshots as assets.

**Visual acceptance gate:** An uninformed tester identifies the classic 2004-era visual structure and interactions without needing a guide, while every shipped asset is legally reusable. **Visually faithful is not “pixel-identical to Jagex-owned artwork”.**

## 2. Traversable 3D world and camera

- [ ] **WORLD-01** Implement server-authoritative coordinates, collision and map boundaries on a streamed/chunked original world (not an extracted Gielinor map).
- [ ] **WORLD-02** Click/tap-to-walk with actual shortest-path routing, interrupted actions, movement queues and precise destination feedback.
- [ ] **WORLD-03** Diagonal movement/turning, run energy and stamina rules matched to approved design, not browser-button shortcuts.
- [ ] **WORLD-04** Camera rotation/zoom/occlusion, indoor rendering, stairs/ladders, floors, doors, gateways and portals.
- [ ] **WORLD-05** Build multiple connected regions: starter village, towns, forests, mine, river/coast, farms, dungeons and dangerous wilderness-like region with **original** names/geography.
- [ ] **WORLD-06** Populate static and moving NPCs, roaming enemies, resource nodes, interactable doors/chests, shops, banks and transport.
- [ ] **WORLD-07** Add multi-level interiors, day/night only if approved for the chosen design, weather/ambient variation and footstep/environment ambience.
- [ ] **WORLD-08** Real map and minimap coordinate consistency; no clicks through obstructing walls; 30-minute traversal without getting stuck.
- [ ] **WORLD-09** Resource spawns/despawns and timers stored in authoritative world state; avoid client-side duplications.
- [ ] **WORLD-10** Measure map rendering and camera performance on an actual midrange Android device, including thermal and battery use.

## 3. Character, equipment, inventory, storage and progression

- [x] **CHAR-01** Original Woodlands has local character state, limited HP/coins, six skills, XP, inventory, local save, banker and merchant. Evidence: core.mjs, tests/core.test.mjs; PR #4.
- [ ] **CHAR-02** Implement permanent authenticated character identities stored on **our** service and protected session tokens; do not reuse Lost City/OSRS credentials.
- [ ] **CHAR-03** Implement historical character appearance, equipment slots, worn item visuals, equipment bonuses and clothing/armour variation using original assets.
- [ ] **CHAR-04** Implement finite slot-based inventory, item metadata, stackability, weight, examine text, splitting/combining, wield/use/drop and grounded items.
- [ ] **CHAR-05** Preserve item transaction invariants (no item minting via sell/deposit/transfer/reconnect), with deterministic tests and transaction logs.
- [ ] **CHAR-06** Full historical-style bank: tabs/notes only if present in chosen version, deposit/withdraw quantities, scroll, item search where appropriate, reliable persistence, capacity and permissions.
- [ ] **CHAR-07** Skill progression with chosen version's XP curve, level thresholds, skill-specific unlocks and milestone feedback. Target the historical **level 1–99** experience where appropriate.
- [ ] **CHAR-08** Persistent player stats, equipment, inventory, bank, appearance, location, quest variables, membership-like feature flags if used, settings and friend preferences.
- [ ] **CHAR-09** Character death and recovery/respawn rules with lost/retrievable items, gravestones only if historically appropriate; repeatable and abuse-tested.
- [ ] **CHAR-10** Profile export/delete, recoverable backups, privacy statement and account reset/recovery mechanism.

## 4. Skills, resources, crafting, trade economy

- [x] **SKILL-01** Woodlands supports basic woodcutting, firemaking, mining, fishing, cooking and combat with deterministic tests. These are **not** complete historical mechanics.
- [ ] **SKILL-02** Record the exact chosen-revision skill roster; implement each skill's interface, equipment, resource/recipe loops, XP, success probabilities, timing and dependencies.
- [ ] **SKILL-03** Woodcutting/log varieties, axes, tree depletion/regrowth and firemaking fuel/ignition.
- [ ] **SKILL-04** Mining ore tiers, pickaxes, mine respawn, smelting and smithing item production.
- [ ] **SKILL-05** Fishing spots, equipment/bait, fish tiers; cooking fires/ranges, burn rules and food healing.
- [ ] **SKILL-06** Crafting, runecrafting and other relevant production/processing chains with actual item requirements and outputs.
- [ ] **SKILL-07** Agility/thieving/farming/slayer and other era-appropriate skill content **only if available in the chosen historical version**; never indiscriminately splice later OSRS systems into 2004.
- [ ] **SKILL-08** In-world merchants: prices, stock, buy/sell limits, currency sinks and transaction integrity.
- [ ] **SKILL-09** Player-to-player trade with two-sided lock/confirm, same-item revision checks, disconnect rollback and prevention of dupes/scams.
- [ ] **SKILL-10** Balancing: no infinite money from starter shops, no duplicate XP from clicks, no negative inventory, no market exploit under concurrent requests.
- [ ] **SKILL-11** Add at least one compelling **30-minute self-sustaining gameplay loop** using several interconnected skills, including meaningful rewards and progression.

## 5. Combat, monsters, magic and prayer

- [ ] **COMBAT-01** Server-authoritative tick/turn timing, target range, line of sight, attack speed, hit accuracy, armour and combat levels.
- [ ] **COMBAT-02** Melee styles and equipment stats; ranged weapons/ammo; magic spellbooks, mana/runes and spell requirements, as appropriate to target version.
- [ ] **COMBAT-03** NPC threat/aggro/leashing, wandering, patrols, attack animations, drops, recovery and boss phases.
- [ ] **COMBAT-04** Prayer resource/activation/drain and altar recovery; consistent stacking effects.
- [ ] **COMBAT-05** Food, potions, protection and poison/status effects where era appropriate.
- [ ] **COMBAT-06** Loot generation, ownership timers, rare-drop odds, abuse-resistant drop tables and inventory capacity rules.
- [ ] **COMBAT-07** PvP areas/duels if included; safe-zone boundaries, death risk disclosure, anti-griefing and disconnect handling.
- [ ] **COMBAT-08** Multi-user encounters and damage/reward attribution with server logs and deterministic replay tests.

## 6. Quests, dialogue, narrative and activity depth

- [x] **QUEST-01** Woodlands has a small original “Forest Apprentice” quest and repeatable supply orders, saved locally. Evidence: core.mjs and tests/core.test.mjs; PR #4.
- [ ] **QUEST-02** NPC conversations with branching choices, conditions, inventories, quest variables and ability to return after interruption.
- [ ] **QUEST-03** At least 10 genuinely different, start-to-finish original quests with objectives, story, branching progression, XP/reward outcomes and completion journal.
- [ ] **QUEST-04** A coherent starter tutorial with optional skip, camera, movement, combat, inventory, bank, quest, map, chat and logout/reconnect.
- [ ] **QUEST-05** Three dungeons/activities with unique mechanics, traversal puzzles and rewarding objectives.
- [ ] **QUEST-06** Narratively original villages, landmarks, factions and lore; do not publish recreated copyrighted quests or copyrighted location assets without clearance.
- [ ] **QUEST-07** NPC/shop/dialogue/world changes persist and remain consistent after reboot.
- [ ] **QUEST-08** Quest acceptance suite records completion, failure, wrong-order actions, repeated rewards and safe recovery after disconnect.

## 7. Multiplayer: the difference between a demo and an MMORPG

- [ ] **NET-01** Build an authoritative game server independent of Lost City's online service. State-changing commands are validated on the server.
- [ ] **NET-02** Multiple separately authenticated accounts can join the same world concurrently and *see each other move*, with names/appearance correctly attached.
- [ ] **NET-03** Public/local chat, private messages, player status, block/mute/report and anti-spam rules.
- [ ] **NET-04** Bank and shop operations, quests and combat are isolated per account; no cross-account item/XP bleed.
- [ ] **NET-05** Real two-player trade handshake, cancellation, network loss rollback, atomic save.
- [ ] **NET-06** Co-op combat, parties and shared activities with correct credit/loot distribution.
- [ ] **NET-07** Reconnection after Wi-Fi/mobile handoff, mobile screen lock, page refresh and server sleep without duplicates or lost state.
- [ ] **NET-08** WebSocket authentication, rate limits, message validation, origin enforcement, sanitised text and audit logs.
- [ ] **NET-09** Scalable interest management: send only nearby actors/events; no runaway per-player CPU/memory.
- [ ] **NET-10** Two-player *real device* end-to-end session on desktop and Android covering trading, chat, movement, quests and saved relogin.

## 8. Offline save to online persistence migration

- [x] **SAVE-01** Woodlands supports local autosave and a manually exportable/importable JSON save with confirmation and invalid-file rejection. Verified desktop/mobile CI. This is not shared online persistence.
- [ ] **SAVE-02** Design versioned canonical server-side character schema and migration procedure from the current Woodlands save.
- [ ] **SAVE-03** Separate client UI data from trusted server state; never trust an arbitrary uploaded JSON file to award live XP/gold/items.
- [ ] **SAVE-04** Implement secure server account registration, login and one-time, validated old-save migration with replay prevention and safe rollback.
- [ ] **SAVE-05** Persist and reload character appearance, location, inventory, bank, levels/XP, equipment and quest flags; all fields tested.
- [ ] **SAVE-06** Atomic state changes under crashes/concurrent requests; optimistic transactions, uniqueness constraints and idempotent reward/payment operations.
- [ ] **SAVE-07** Daily encrypted off-host backups, retention/restore and owner-controlled recovery. No credentials/character databases committed to GitHub.
- [ ] **SAVE-08** Prove complete state recovery on fresh server, after sudden process termination, hibernation, deployed-code upgrade and mobile disconnect.

## 9. Truly free, durable hosting — prove before provisioning

- [x] **HOST-01** JoshRS's static launcher and original Woodlands demo are live on Vercel; historical-game Play links to Lost City. Evidence: production deploy + browser tests in GitHub Actions.
- [x] **HOST-02** A pinned *research* Docker build of the historical engine can start, back up and pass an isolated restore/HTTP/client rendering CI check. This is **not a licensed public deployment or full gameplay acceptance**. Evidence: deploy/server/README.md, PR #2.
- [ ] **HOST-03** Identify the concrete chosen server runtime: an existing owner-controlled computer + private Tailscale Serve; eligible Oracle Always Free for a persistent Node game; **or** a separately implemented game state architecture on Cloudflare Workers Free + SQLite-backed Durable Objects. These are alternatives, not drop-in equivalents.
- [ ] **HOST-04** Verify *the actual connected account* is on a non-billable/free tier and that limits hard-fail rather than generate charges; billing-read permissions may need owner action. No payment, upgrade, card, or billable resources authorised.
- [ ] **HOST-05** Container/worker build, durable database, HTTPS and WebSocket gameplay accessible on mobile outside home Wi-Fi.
- [ ] **HOST-06** Persistence across deploy, process crash and host restart, with off-host backup and independent restore.
- [ ] **HOST-07** Measure per-player CPU, RAM, storage, WebSocket message counts and quota budget; enforce limits and visible warnings before exhaustion.
- [ ] **HOST-08** 24-hour uptime/reconnection test and a several-player stress test on the actual free environment.
- [ ] **HOST-09** Establish documented, safe rollback and disaster recovery. Never replace the working live Woodlands site until the new game passes all gates.

## 10. Desktop/mobile UX, accessibility and safety

- [x] **UX-01** Existing single-player Woodlands has keyboard, click/tap movement, touch D-pad and responsive layout, with live desktop/mobile browser checks. This is **not** a complete classic RuneScape control system.
- [ ] **UX-02** Implement mobile-friendly tap/hold context menus, accessible inventory drag/drop alternatives, pinch/rotate or buttons for camera, onscreen keyboard handling.
- [ ] **UX-03** Test Android portrait/landscape, low-end device, desktop Firefox/Chrome/Safari equivalents where possible, browser zoom and reduced motion.
- [ ] **UX-04** Ensure no unreadable text, overlapping controls, clipped minimap, accidental scroll, keyboard traps or unreachable buttons.
- [ ] **UX-05** Support colour contrast, labels, focus order, screen reader fallback status and adjustable UI scale/font size.
- [ ] **UX-06** Make login, reconnect, export/restore, updates and error states understandable without technical knowledge.
- [ ] **UX-07** Build realistic moderation/privacy policy for shared chat and player reports; prevent exposing private details.

## 11. Test coverage and true feature acceptance

- [x] **TEST-01** Current unit tests cover starter gameplay, basic economy and save import/export; live site has desktop/mobile DOM/rendering checks.
- [ ] **TEST-02** Each major gameplay feature needs an automated *interactive* browser test, not only a button-present assertion.
- [ ] **TEST-03** Reference behaviour matrix for every approved classic feature: expected inputs, state transitions, failure modes, XP/item changes.
- [ ] **TEST-04** Two independent browser contexts for real trade, chat, co-op, invalid command, concurrent save and disconnect.
- [ ] **TEST-05** Property-based economy and quest tests: no duplicate rewards, negative stock, teleporting, item creation or bypass of prerequisites.
- [ ] **TEST-06** Load and performance tests on selected free backend with measured peak and sustained usage.
- [ ] **TEST-07** Browser screenshots/video traces on desktop/mobile and human acceptance of actual UI matching the signed-off *original-art* reference.
- [ ] **TEST-08** Automated production smoke tests run after each deploy and verify account/login, movement, inventory, persistence and a genuinely working game loop.
- [ ] **TEST-09** No serious security, data loss, inaccessible interface, or licensing issues open at launch.

## 12. Recommended delivery sequence (build slices, not vague promises)

1. **S1 — Reference & rights brief.** Lock 2004 vs 2007 target; 30 screenshots/interactions; audited asset list and clearly original production art direction. Gate: rights-approved UI reference doc.
2. **S2 — Classic shell.** New original UI: game frame, minimap, parchment chat, tabs, right-click menu, mobile controls. Connect it to *existing Woodlands* interactions. Gate: phone and desktop live screenshot regression passes.
3. **S3 — 3D proof.** Replace one small area with functioning original low-poly 3D scene, rotating camera, pathfinding and NPC/resource nodes. Gate: complete 15-minute playable loop on Android/desktop.
4. **S4 — Identity & persistence.** Implement validated accounts and server-owned state using free-verified hosting, plus trusted migration from existing browser save. Gate: logout/relogin and crash/restoration tested.
5. **S5 — Two-player world.** WebSocket presence, movement, chat, items, banking, real trade and reconnect. Gate: two independent real players on phone and desktop; no dupes/data loss.
6. **S6 — Six-skill depth.** Fully flesh out Woodlands' existing professions with items, tiers, tool requirements and repeatable loops. Gate: connected multi-skill progression over 60 minutes.
7. **S7 — Combat, quests, regions.** Implement tiered combat, multiple towns/dungeons and substantial original quests. Gate: full tutorial + 10 meaningful quests + co-op encounter end-to-end.
8. **S8 — Historical-system completeness.** Close gaps for approved snapshot's other skills, prayer/magic/equipment, PvP (if chosen), interfaces, world density and economy. Gate: documented parity matrix passes feature-by-feature.
9. **S9 — Production release.** Full audit, original/approved assets, backup restore, load/uptime, mobile acceptance and rollback. Gate: release criteria below, not a “READY” dashboard.

Each slice should be a small issue/PR with code changes, CI, real browser verification, screenshots when relevant, deploy verification, and explicit **VERIFIED COMPLETE / PARTIALLY COMPLETE / BLOCKED** reporting.

## 13. Release definitions (non-negotiable)

**Playable independent RPG (CURRENT):** standalone original Woodlands adventure on Vercel; one browser's local save; six basic skills; very small world; no real-time player interaction. The site must label this as an original independent browser game, not a full OSRS clone.

**Playable online multiplayer alpha (NOT DONE):** at least two accounts in a shared authoritative world; chat + movement + 1 co-op mechanic + secure saves through reconnect/restart; permitted art; phone/desktop live play.

**Full classic RuneScape-style MMORPG (NOT DONE):** rights-approved visual design; complete classic frame/camera/map/navigation; chosen-era skill roster with substantial progression; full inventory/equipment/bank/economy; magic/prayer/combat; original quest lines and multiple populated regions; trade/parties/social; permanent independently managed accounts; proven load/backup/restore; real mobile and desktop acceptance. A “full historical replica” additionally requires exact scope and **explicit rights** to anything protected.

**Never claim:** a launcher redirect, static mockup, Docker build-only check, login canvas, or multi-user chat lobby equals a full MMORPG.

## Source references and linked work

- [JoshRS live original RPG](https://joshrs.vercel.app/woodlands.html) and [JoshRS repository](https://github.com/Parris-Tech-Services/JoshRS)
- [Main multiplayer infrastructure issue #5](https://github.com/Parris-Tech-Services/JoshRS/issues/5); [historical server release blocker #3](https://github.com/Parris-Tech-Services/JoshRS/issues/3)
- [Lost City engine](https://github.com/LostCityRS/Engine-TS), [browser client](https://github.com/LostCityRS/Client-TS), [historical content / asset disclaimer](https://github.com/LostCityRS/Content/blob/main/README.md)
- [Jagex Fan Content Policy](https://legal.jagex.com/docs/policies/fan-content-policy), especially §6.1.3
- [OSRS wiki: classic interface structure](https://oldschool.runescape.wiki/w/Interface) and [Jagex game version explanation](https://support.runescape.com/hc/en-gb/articles/360001247349-RuneScape-and-Old-School)
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), available on free with SQLite-backed storage and hard limits; verify account/architecture before provisioning
- [Free hosting research](FREE_SELF_HOSTING_RESEARCH.md), [self-hosting release gates](SELF_HOST.md), [upstream licences](UPSTREAM.md).

**Cost constraint:** “Free” means no *additional hosting subscription* and no paid credit purchases. A privately powered home computer still costs electricity and needs internet/hardware. Free clouds may have limitations or unavailable capacity. The technical and licensing feasibility of an exact 2004Scape clone is not established by free infrastructure alone.

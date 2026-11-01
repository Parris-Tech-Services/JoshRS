# Yrsa's Accoutrements — JoshRS 377 shop fix

Evidence: On 1 November 2026, the user selected Trade Yrsa, receiving "Nothing interesting happens". Pinned Lost City Content revision-377 commit 44eab09081ef0f6c5f3eaabd1897a588ad7d9e50 has NPC ID 1301 (viking_clothing_shopkeeper), inventory ID 208 (viking_clothes_shop) and every cloak object, but lacks the inventory and Yrsa shop scripts. The later/default branch provides a 21-item inventory in scripts/areas/area_vt/configs/viking.inv. The existing 377 shop API supports ~openshop.

The patch adds one direct NPC Trade handler, restores the inventory with 11 cloak colours and 10 other clothing items, and leaves other shops and Yrsa's Talk-to dialogue untouched. This is a private-world convenience override: the historically quest-gated clothes shop opens directly with Trade.

## Install

1. Finish playing; log out both Sylvie and Elrothiro and gracefully stop the game server.
2. Update the extracted JoshRS launcher files from this repository, preserving your existing runtime folder.
3. Double-click JoshRS-Fix-Yrsa.cmd in the launcher root. The installer refuses to run while server ports are listening.
4. After successful native compilation, restart using JoshRS.cmd, return to Yrsa in Rellekka and select Trade.
5. Check that 21 stocked clothing entries appear, buy and equip a coloured cape, then log out/in and verify persistence.

Read-only preflight without changes: powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy\jparris-windows\install-yrsa377.ps1

The installer backs up the local source files, compiled pack, engine source and .env, blocks conflicting handlers/stock definitions, and rolls back if the build fails. It narrows inventory CRC exemption to .inv only with JOSHRS_CUSTOM_INVS=true; all other BUILD_VERIFY checks remain on.

This change cannot reach the live Windows runtime from GitHub. Compiler success is not gameplay verification. The running clients are never intentionally disconnected by this patch. No player saves, accounts, original USB content, or Java client files are changed. A real in-game purchase and reconnect test is required before claiming verified complete.

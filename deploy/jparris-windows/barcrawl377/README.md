# Alfred Grimhand's Barcrawl — native JoshRS 377 repair (8 November 2026)

**Target**: existing JoshRS USB-restored Windows 377 world selected by `runtime/jparris-377/active.json`. **Status**: source repair; local client completion and save persistence require verification.

The upstream pinned `LostCityRS/Content@44eab090` already has the full 10-bar inventory-card flow. This change does **not** introduce duplicate bartender handlers, proprietary assets or quest item IDs.

### What this fixes

- The outpost gate no longer teleports unfinished players through when the guard is absent or the dialogue is declined.
- A lost card can be replaced without clearing the permanent bar-completion bits. The first card and replacements require inventory room.
- Thormac rejects attempts to start Scorpion Catcher until the barcrawl has been handed in.
- Rusty Anchor correctly requires eight coins, not seven, before charging eight.
- Zambo's Ape Bite Liqueur temporarily reduces Attack and Defence, matching the existing non-permanent stat-subtraction approach.

The existing card journal, named drinks, all ten prices (208 coins altogether), first-visit flags and 377 outpost gate remain in their native source files. The script uses the existing `barcrawl` permanent varp; no new save schema.

### Windows installation

1. Log out Elrothiro and all other players and gracefully stop the local JoshRS server.
2. Download the real [JoshRS-Fix-Barcrawl.cmd](https://github.com/Parris-Tech-Services/JoshRS/blob/main/JoshRS-Fix-Barcrawl.cmd) with GitHub's **Download raw file** option, or use the Windows `.cmd` attachment in ChatGPT. **Do not run the Google Docs source-code copy.** Leave your existing `runtime/` directory untouched. The single `.cmd` works from Downloads or your installed launcher folder; it finds `C:\JoshRS-Launcher\JoshRS-main` when necessary and offers to download the pinned installer helper if it is missing.
3. Double-click that real `.cmd`. It performs read-only preflight, asks for confirmation, then backs up the selected family world before patching and compiling. The window always remains visible for error reporting, cancellation or success until you press a key.
4. Alternatively, from PowerShell in the launcher directory:
   - Read-only: `& '.\deploy\jparris-windows\Install-Barcrawl377.ps1'`
   - Apply: `& '.\deploy\jparris-windows\Install-Barcrawl377.ps1' -Apply`
5. Require output `SOURCE_INSTALLED_AND_COMPILED`, then start normally using `jparris-play.cmd`. This only proves the code compiled, not the full quest.

The installer validates the selected private runtime, the exact source text, open ports and the protected Elrothiro/family save backup. It backs up the five source files and compiled engine pack, reverts on build failure, and does **not** replace account DB, saves, maps or other quests. If your custom files differ, it refuses to edit them. A pre-existing source fix prints `SOURCE_ALREADY_PATCHED`.

### Actual in-game acceptance

1. New character with open inventory slots: the Barbarian Guard issues a card; with a full inventory he must not set progress without a card.
2. Check the card; verify all ten locations initially pending and no free bypass via the outpost gate (including guard out of range).
3. Visit Blue Moon (50), Jolly Boar (10), Rising Sun (70), Rusty Anchor (8), Karamja Spirits (7), Dead Man's Chest (15), Flying Horse (8), Forester's Arms (18), Blurberry (10), Dragon Inn (12). Pay each once, drink it, and inspect the card. No payment or mark when funds are insufficient.
4. Drop a partly completed card, obtain a replacement and ensure previous signatures remain; re-log and confirm they persist.
5. After all ten bars, hand the card back to the guard. Gate admits the player; Scorpion Catcher becomes available from Thormac.
6. Verify combat/other skills recover naturally from drink stat effects; existing unrelated quests and player saves still load.
7. Horror from the Deep's use of the Barbarian Outpost should be checked independently; its full start prerequisites are not rewritten here.

**No real-player playthrough was performed from GitHub.** `content-patches/rs377/patches/0025-...` is also compiled in an isolated, non-family 377 workflow when CI is green. The broader batch still includes incomplete original-content reconstructions and must never be copied wholesale over a customised world.

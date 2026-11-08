# Revision 377 quest parity — detailed findings (8 November 2026)

**Acceptance definition:** Exact historical-source parity means each mandatory NPC, line/branch (when independently sourced), item, object, map path, quest prerequisite, puzzle stage, fight, reward and persistent unlock has been verified *as at May 2006*. A source path or compilation cannot prove this. The previous `COMPLETE-VERIFIED` status is a structural-only label.

**Automated evidence:** `tools/rs377-quest-parity/deep_audit.py` runs after the pinned LostCity Content checkout receives all reviewed JoshRS 377 patches. It writes **104 individual quest source dossiers** with the actual NPC handler and map coordinates, local NPC/object/item events, dialogue branch counts (not copyrighted text), stage writes/checks, item references, source skill gates, combat hooks, XP and unresolved missing mechanics. The 104 per-quest JSON files and combined Markdown/CSV/JSON are retained in the `quest-104-source-accuracy-evidence` CI artifact. Both imported source and custom overlays are analysed. **The script is not a full Jagex source comparison; historical dialogue is not guaranteed to be available.**

## Confirmed historical gameplay discrepancies

### A Soul's Bane — released 3 April 2006

Historical reference: [OSRS detailed quest](https://oldschool.runescape.wiki/w/A_Soul%27s_Bane) and [RuneHQ walkthrough](https://www.runehq.com/quest/souls-bane-a). These living web pages require care about later changes; the combat/puzzle structure is concordant. Neither is authenticated as an unaltered Jagex release-day script.

| Mechanic | Historic reference | JoshRS source finding | Disposition |
|---|---|---|---|
| Quest story | Launa seeks her missing son Tolna at the rift east of Varrock | Earlier custom dialogue falsely described him as her brother | Fixed in earlier PR #182; now mother/son |
| Rewards | 500 Defence XP, 500 Hitpoints XP, 500 coins, 1 QP | Previously gave Prayer + 2,000 Defence XP | Fixed in PR #182, source regression protected |
| Anger room | Correct special anger weapons and fighting until rage threshold | Four hardcoded distinct kill flags; no independently verified weapon rack/anger meter | **NOT PARITY-VERIFIED** |
| Fear room | Search dark holes and defeat five fear reapers | Previous `^soulbane_fear_needed=3`, no full hole-search scene demonstrated | Five-kill count fixed here; **hole puzzle unverified** |
| Confusion room | Discover fake/real beasts via attacks, clear illusion/door puzzle, defeat real beast | JoshRS sets stage to next trial on one `soulbane_confu_creeper` death | **BROKEN/INCOMPLETE**; do not claim complete |
| Hopelessness room | Fight multiple hopeless creatures in progressive waves | JoshRS increments one tally across three NPC definitions, threshold three | **NOT PARITY-VERIFIED**; count and multi-phase kills missing |
| Final | Three Tolna heads defeated with actual combat, reunited family | Three death flags exist | Source wiring exists; real combat, room travel and relog still untested |

**Do not simply change all counts to match modern NPC totals.** The game has repeating phases and respawn mechanics that must be verified in the actual 377 maps and interactions.

### Shades of Mort'ton — released 18 October 2004

Historical-style reference: [LostHQ 2004 guide](https://2004.losthq.rs/?p=questguides&quest=shades) and [OSRS walkthrough](https://oldschool.runescape.wiki/w/Shades_of_Mort%27ton/Quick_guide). Exact period authenticity of the recovered guide is not independently established.

| Mechanic | Reference | JoshRS implementation | Status |
|---|---|---|---|
| Start | Search bookcase, read diary | Starter script present | Needs client evidence |
| Serum | Tarromin + ashes, use on Razmire/Ulsquire | Three/Two/One-dose script support | Needs serum/real NPC test |
| Shades | Five Loar kills, deliver remains | Real count gating exists | Needs attack/loot/hand-in playthrough |
| Temple | Shared repair percentage rises, shades can damage walls, player sanctity accumulates | Five permanently-counted repairs in a solo simplified quest; no full shared minigame | **NOT historically accurate** |
| Ritual | Light altar, sanctify olive oil, pyre logs/remains and cremation | Custom item/loc handlers added in PR #179 | Needs world object and proper sanctity check |
| Completion | Return to Ulsquire after burning a shade | Stage gate + reward implementation | Needs end-to-end proof |

**Full historical temple minigame is still missing**, regardless of successful native compilation.

### Rum Deal — released 31 October 2005

Reference: [OSRS Rum Deal](https://oldschool.runescape.wiki/w/Rum_Deal), source not guaranteed to reproduce all 2005 dialogues.

| Mechanic | Historic reference | JoshRS implementation | Status |
|---|---|---|---|
| Prerequisites | 42 Crafting, 50 Fishing, 40 Farming, 47 Prayer, 42 Slayer, Morytania entry | Custom script primarily advances by stage/inventory; levels not visibly enforced in local quest script | **REVIEW / REPAIR** |
| Blindweed | Farm and harvest on Braindeath Island | `[opheld1,deal_blindweed_seed]` instantly converts seed to blindweed anywhere | **Incorrect mechanics; must restrict to real patch and farming behaviour** |
| Fights | Island zombie/pirate and fever spider encounters | Explicitly marked NOT IMPLEMENTED in source | **Missing** |
| Brewery | Correct equipment/object interactions and staged ingredient processing | Condensed NPC dialogue advances and hands items | **Incomplete** |
| Reward | 7,000 Fishing, Farming and Prayer XP; holy wrench; 2 QP | Corrected XP in PR #182, but complete holy wrench ownership and unlock remain unverified | Source XP fixed; end-user test required |

## Required completion protocol (repeat for all 104)

1. Match source to an independently dated period guide, archived update, or other trusted historical evidence; record conflicting versions rather than silently adopting modern OSRS values.
2. Record every mandatory NPC + morph and map location; ensure Talk-to interactions, missing item branches and refusal paths are actually reachable.
3. Verify every object click/item-on-object, map collision, instance/entrance, enemy death and loot path in the installed 377 world; static evidence is not proof.
4. Verify requirement gating, accurate quest stages/journal choices, quest points and XP/item rewards, no duplicate or bypass outcomes, save/relogin and post-quest access.
5. Keep `PERIOD_SOURCE_INCOMPLETE` and `FULL_CLIENT_PLAYTHROUGH_UNVERIFIED` until proven. Test with disposable non-family accounts; never change Elrothiro/Sylvie saves.

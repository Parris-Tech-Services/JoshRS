# Alfred Grimhand's Barcrawl: verification against original sources (2026-11-08)

Oldest quest the repo customises (released 25 March 2002). Scope: the behaviour changed by
`content-patches/rs377/patches/0025-barcrawl-guard-gate-scorpion-and-price.patch`.
Source-only review; nothing here was run in a game client. **Status: NOT 100% verified**
(see "Still unverified").

## Result per behaviour

| Behaviour in patch 0025 | Original sources say | Verdict |
|---|---|---|
| Black Skull Ale needs 8 coins (`< 8`) | 8 coins (RS Classic, OSRS, RS3) | Matches. Kept. |
| Outpost gate stays shut until the Barcrawl is complete | Completion grants Outpost access (RS Classic, OSRS guard page) | Matches. Kept. |
| Lost card: guard replaces it and earlier stops still count | Progress is lost; every bar must be revisited (RS Classic, OSRS, RS3) | **Contradicts.** Reverted in 0030. |
| Thormac refuses Scorpion Catcher until Barcrawl is complete | 2007-era guide: Barcrawl is not a start requirement, only needed to enter the Outpost for the second scorpion. (Current OSRS/RS3 pages list it as required, which does not apply to the 2006 target.) | **Contradicts the period source.** Reverted in 0030. |
| Free-slot check before handing out a card | Not an original behaviour, no conflict | Kept as a safety guard (check now runs before the reset). |
| Zambo's Ape Bite Liqueur: Attack and Defence lowered via `stat_sub(.., 5, 5)` | Only the modern RS3 wiki says it lowers Attack and Defence, with no amount. The 2004/2005 guides list no drink effects at all. | **Unverified** (existence of the drain and its amount). Same formula as every other bar in the pinned content, which uses a flat 5 plus 5% of the current level (not a flat -5; earlier wording was wrong). |

## Bar list and prices (checked 2026-11-08, second pass)
All ten bars are on the card in guides dated before May 2006: a RuneHQ guide entered May 2004 (updated 2020) and a Salmoneus guide published May 2005 (updated 2011). A 2007 archive guide and a Vidyascape page agree. The bars and prices match the pinned scripts: Blue Moon 50, Jolly Boar 10, Rising Sun 70, Rusty Anchor 8, Dead Man's Chest 15, Forester's Arms 18, Karamja Spirits 7, Flying Horse 8, Dragon Inn 12, Blurberry's 10. Caveat: both older guides were edited later, so this is strong but not a May 2006 snapshot.

## Still unverified
- Whether Zambo's drink drains Attack and Defence at all in 2006, and by how much (no source gives an amount; the 2004/2005 guides list no effects).
- Per-drink damage and stat amounts for the other bars: the pinned scripts use 5 plus 5% per stat and 25% / 5% / 5% of hitpoints; one old guide says Heart Stopper costs about 15 hits, which only fits a level of roughly 60.
- Exact 2006 dialogue text. Wording follows the pinned upstream content.
- Everything in a real client: card checks, drink effects, gate behaviour, save persistence.

## Sources
- RuneScape Classic wiki, Alfred Grimhand Bar Crawl: https://classic.runescape.wiki/w/Alfred_Grimhand_Bar_Crawl
- Tip.it Scorpion Catcher guide (2007 archive, updated 2013): https://www.tip.it/runescape/quests/view/46
- OSRS wiki, Alfred Grimhand's Barcrawl: https://oldschool.runescape.wiki/w/Alfred_Grimhand%27s_Barcrawl
- OSRS wiki, Barbarian guard: https://oldschool.runescape.wiki/w/Barbarian_guard
- RuneScape wiki, Bar Crawl (miniquest): https://runescape.wiki/w/Bar_Crawl_(miniquest)
- RuneHQ, Bar Crawl (entered May 2004): https://www.runehq.com/miniquest/bar-crawl
- Salmoneus, Alfred Grimhand Barcrawl (published May 2005): https://runescape.salmoneus.net/miniquests/alfred-grimhand-barcrawl.html
- 2007RSHelp, Alfred Grimhand Barcrawl: https://2007rshelp.com/misc.php?id=2
- Vidyascape wiki, Alfred Grimhand's Barcrawl: https://vscape.wikidot.com/alfred-grimhand-s-barcrawl

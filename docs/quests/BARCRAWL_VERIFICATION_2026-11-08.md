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
| Zambo's Ape Bite Liqueur lowers Attack and Defence | Tip.it's original help page (2007 archive) and the 2004 RuneHQ guide list no stat or life-point penalty; the current OSRS table lists none either. Only RS3 says Attack and Defence. | **Contradicts the period sources.** Drain removed in 0030. |

## Bar list and prices (checked 2026-11-08, second pass)
All ten bars are on the card in guides dated before May 2006: a RuneHQ guide entered May 2004 (updated 2020) and a Salmoneus guide published May 2005 (updated 2011). A 2007 archive guide and a Vidyascape page agree. The bars and prices match the pinned scripts: Blue Moon 50, Jolly Boar 10, Rising Sun 70, Rusty Anchor 8, Dead Man's Chest 15, Forester's Arms 18, Karamja Spirits 7, Flying Horse 8, Dragon Inn 12, Blurberry's 10. Caveat: both older guides were edited later, so this is strong but not a May 2006 snapshot.

## Drink effects (third pass, Tip.it original help page, 2007 archive)
- Heart Stopper removes 25% of life points: matches the pinned `calc((hitpoints * 25) / 100)` (OSRS wiki says 20-30%). **Confirmed.**
- Ape Bite Liqueur: no penalty. **Confirmed, drain removed.**
- Other drains are given only as averages that vary with the player's levels (for example Liverbane about -8 Attack, -6 Defence and -5 on the other three; Fire Brandy about -11 Attack and -10 Defence; Supergrog about -8 Attack, -7 Defence, -7 Cooking, -6 Herblore and 60 Prayer points). The pinned scripts use one formula (5 plus 5% of the level) for every drink, so exact per-drink amounts remain **unverified**.
- Hitpoint damage for Fire Toad Blast and Hand of Death: sources conflict (0-4 or "up to 2" hits in one guide, about 120 life points in the Tip.it archive, RS3 scales differently). The pinned scripts use 5% of hitpoints for both. **Unverified.**

## Still unverified
- Exact per-drink stat amounts and the Fire Toad Blast and Hand of Death damage (see above). Closing this needs a May 2006 snapshot or measured values from a real 2006-era client.
- Exact 2006 dialogue text. Wording follows the pinned upstream content.
- Everything in a real client: card checks, drink effects, gate behaviour, save persistence.
- An old RuneScape wiki revision of the Karamja drinks page could not be fetched (the site blocks automated access) and a Google Sites guide required sign-in.

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
- Tip.it, Bar Crawl (2007 archive, updated 2013): https://www.tip.it/runescape/pages/view/bar_crawl.htm
- Game Guides, Barcrawl Guide: https://gguides.weebly.com/barcrawl-guide.html

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
| Zambo's Karamja rum: Attack and Defence -5 | Karamja Spirits drink lowers Attack and Defence; amount not stated by any source found. RS Classic formula for other drinks was about 5% of the level plus 4. | **Amount unverified.** Left as is. |

## Still unverified
- Whether the May 2006 card had the Karamja Spirits, Dragon Inn, Flying Horse and Blurberry's stops, and each drink's exact stat drain, damage and price at that date. The sources found are RS Classic (2002), a 2007 archive guide and today's wiki; none is a May 2006 snapshot.
- Exact 2006 dialogue text. Wording here follows the pinned upstream content.
- Everything in a real client: card checks, drink effects, gate behaviour, save persistence.

## Sources
- RuneScape Classic wiki, Alfred Grimhand Bar Crawl: https://classic.runescape.wiki/w/Alfred_Grimhand_Bar_Crawl
- Tip.it Scorpion Catcher guide (2007 archive, updated 2013): https://www.tip.it/runescape/quests/view/46
- OSRS wiki, Alfred Grimhand's Barcrawl: https://oldschool.runescape.wiki/w/Alfred_Grimhand%27s_Barcrawl
- OSRS wiki, Barbarian guard: https://oldschool.runescape.wiki/w/Barbarian_guard
- RuneScape wiki, Bar Crawl (miniquest): https://runescape.wiki/w/Bar_Crawl_(miniquest)

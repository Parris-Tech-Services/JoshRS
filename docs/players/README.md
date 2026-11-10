# Historically documented player profiles

These are **evidence records**, not account templates. They exist so that any later account work is
grounded in a primary source rather than invented.

## Rules

1. Every possession carries an `evidence` class: `DIRECT_PLAYER_STATEMENT`,
   `CONTEMPORARY_EYEWITNESS`, `LATER_ARCHIVED_IMAGE`, `HISTORICAL_WIKI_RECORD`, or `UNKNOWN`.
2. **Ownership is not placement.** Nothing here claims an item sat in a particular bank slot, was
   equipped, or was carried. Every entry records `placement: UNKNOWN`.
3. Each profile lists what is **unknown** separately. Unknown stays unknown.
4. Achievements dated after a snapshot are marked and must not be backdated.
5. A documented item that does not exist in the rev-274 registry is recorded as `rev274_item: null`
   with a note. It is **not** silently substituted.

## Profiles

| Player | Snapshot | Strongest evidence | Rev-274 representable |
|---|---|---|---|
| Zezima | 2006-04-29 | seven partyhats, **direct player statement** | 6 of 6 items exist |
| N0valyfe | 2006-03-25 | 3 shield left halves, contemporary eyewitness | **0 of 1** — `shield_left_half` absent from 274 |
| Gregechidna6 | 2006-11-25 | 8 Santa hats, 8 masks, 7 pumpkins, ~5m coins, ~155k steel arrows, eyewitness | 5 of 5 exist (masks resolve to `halloweenmask_*`) |

## Why Zezima is the strongest profile

Zezima stated his own partyhat inventory directly, and supplied his level-99 dates. That is the only
one of the three where the player is the source. He also explicitly **refused** to give a bank
screenshot, so nothing about his bank layout is knowable.

## Known gap

`shield_left_half` (N0valyfe's documented possession) is **not in rev-274**. Whatever the Dragon square
shield's release date, this content revision does not contain the item, so that possession cannot be
represented without substituting - which the rules forbid.

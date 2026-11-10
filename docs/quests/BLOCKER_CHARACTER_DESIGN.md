# Blocker: automated login stops at character design

**Status: OPEN.** This is the single thing preventing *any* quest from being marked VERIFIED
PLAYABLE. Everything else in the port is source-level coherent and measured; none of it has been seen
running.

## What happens

The visual pipeline (`tools/visual/visual-capture.mjs`) boots a real rev-274 world in CI, loads the
actual browser client in headless Chromium, clicks through the title screen and logs in. It then lands
here:

```
Welcome to RuneScape — Use the buttons below to design your player
Design Colour … Head Hair Jaw Torso … Gender Male Female
```

A **new** account is sent to character design before the world. There is no game sidebar on that
screen, so:

- the quest tab cannot be found (an earlier coordinate sweep searched a screen with no tabs on it)
- clicking the design screen advances it (observed at canvas `0.40, 0.55`) but **no save is written**
- `save count: 0` after login, even with a logout click

And the engine confirms why a save is absent:

```
src/engine/World.ts:124   PLAYER_SAVERATE = 1500  // 15-minute autosave
```

Saves happen on autosave (15 min) or logout. A design-incomplete player is not persisted.

## What has been ruled out

| Attempt | Result |
|---|---|
| OCR word-box click on a labelled confirm | no `Accept`/`Confirm`/`Continue` label is OCR-visible |
| Keyboard `Enter`, `Escape`, `Space` | does not advance |
| Coordinate sweep of the lower-centre band | advanced once at `(0.40, 0.55)`, not reproducible |
| Content-side `[login]` hook | no `[login]` trigger exists in the 274 content |
| `easyStartup` config | only bypasses the login server (`src/app.ts:30`, `LoginServer.ts:142`) |
| Interface file for the design screen | design UI is drawn client-side, not from a `.if` |

## Two viable fixes, neither attempted

### A. Seed a completed account into the CI world

The CI world is disposable and its player directory is writable before boot. A save file with
completed appearance makes login skip design entirely.

Needs: a saved player whose credentials are known. The engine creates the save at logout, so the
account must be created once interactively — or a small script must construct a `Player`, set
`username`/`password`/appearance, and call `save()`.

### B. Patch the CI-only engine to supply a default appearance

`Player.buildAppearance(inv)` only flags an appearance resend (`src/engine/entity/Player.ts:1915`).
A CI-only patch could, at first login, equip a default appearance set and call `buildAppearance` so
the client never shows the design interface.

This must live **only in the CI clone**, behind an env flag, and never in the shipped world: it
changes first-login behaviour for every player.

## Why this is not being worked around with a fake claim

The tempting shortcut is to call "structurally complete" verified. It is not: 26 quests have never
been played, no quest stage has survived a save and reload, and the two quests the owner specifically
asked about — The Golem's Uzer and The Lost Tribe's Sigmund — have correct *data* and unverified
*behaviour*. Correct data with no playtest is exactly the state that produced the current 0-of-26
count.

## What completion of this blocker unlocks

1. `::tele 0,54,48,35,18` → see Uzer ground and the broken clay golem
2. Lumbridge Castle → see Sigmund beside Duke Horacio, open his dialogue
3. Advance one quest stage → logout → login → confirm the stage persisted
4. Only then can any quest be reported VERIFIED PLAYABLE

## A third route: prove persistence without a client

Character design is only a blocker for *visual* verification. Persistence can be tested at the
library level instead:

- `src/engine/entity/PlayerLoading.ts` exposes `PlayerLoading.load(name, sav, client)` and the
  constants `SAV_MAGIC = 0x2004`, `SAV_VERSION = 7`
- `Player.save()` (`src/engine/entity/Player.ts:189`) writes the save, and the varp array is part of
  the payload

So a test could: construct a player, set a stage varp, `save()`, reload through `PlayerLoading.load`,
and assert the value survived. That proves storage and retrieval of quest stage — the exact thing
"progress survives logout and restart" claims — **without a browser**.

The obstacle is that `PlayerLoading.load` touches `World.currentTick`, so the world must be
initialised first. Booting the full world inside a unit test is heavy but not impossible; the engine's
own test setup may already do it.

This route is worth trying before more client automation, because it tests the property that matters
and does not depend on the character-design screen at all.


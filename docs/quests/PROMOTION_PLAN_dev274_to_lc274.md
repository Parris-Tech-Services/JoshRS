# Promotion plan: `~/dev274` → live `~/lc274`

**Status: NOT EXECUTED. Requires Josh's explicit approval before step 1.**

The live world `~/lc274` (serving `http://10.8.0.1:8888/rs2.cgi`) has none of the ported work. Sigmund is
absent and Uzer is black there. Everything below is what it would take to change that safely.

- Live content: `/data/data/com.termux/files/home/lc274/content`
- Live saves: `/data/data/com.termux/files/home/lc274/engine/data/players/main/`
- **Elrothiro save: `.../players/main/elrothiro.sav` — never modified, by any step, ever**
- Dev content: `/data/data/com.termux/files/home/dev274/content`

## 0. Back up first (nothing else happens until this succeeds)

```sh
mkdir -p ~/promotion-backups
tar -czf ~/promotion-backups/lc274-content-$(date +%Y%m%d-%H%M).tgz -C ~/lc274 content
tar -czf ~/promotion-backups/lc274-saves-$(date +%Y%m%d-%H%M).tgz -C ~/lc274/engine/data players
sha256sum ~/lc274/engine/data/players/main/*.sav
```

Record the hashes. After promotion, every `.sav` hash must be **identical** — saves are read by the
server, never rewritten by a promotion.

## 1. Stop the live world once, when Josh says

Only Josh chooses the moment. One stop, one start.

## 2. Copy content — only what is needed

| From dev274 | To lc274 | Rule |
|---|---|---|
| `content/imported-maps.txt` maps | `content/maps/` | **only** files listed in the manifest |
| `content/pack/{npc,loc,obj,varp}.pack` | same | merge appends; never overwrite an existing id |
| `content/scripts/_unpack/274/all.{npc,loc,obj,varp}` | same | append the ported definitions |
| `content/scripts/quests/quest_*` (ported) | same | the 26 quests |
| `content/scripts/player/interfaces/questlist.if` | same | 18 journal entries |

**Do not copy** `dev274/engine/data/players` (dev test accounts), logs, or `db.sqlite`.

Native 274 maps must not be replaced: they use 274 ids. `m50_50.jm2` is the one deliberate exception —
it gains Sigmund's spawn `1 9 19: 2079`.

## 3. Repack and check before starting

```sh
cd ~/lc274/engine && npx tsx src/app.ts   # watch for "World ready" and any map/parse error
```

If it does not reach `World ready`, roll back: restore the content backup and start the old world.

## 4. Josh's 5-minute phone checklist

Open `http://10.8.0.1:8888/rs2.cgi`:

1. **Sigmund** — walk to Lumbridge Castle first floor. Sigmund should stand next to Duke Horacio
   (world tile 3209,3219; the Duke is at 3212,3220). Talk to him: dialogue should open.
2. **Uzer** — `::tele 0,54,48,35,18`. The ground should render, with the broken clay golem visible and
   interactable. It must not be black.
3. **Quest points** — note your quest points, log out, log back in, compare. They must be unchanged.
4. **Your saves** — Elrothiro must still load with the same items, levels and position.

## 5. Rollback

```sh
tar -xzf ~/promotion-backups/lc274-content-YYYYMMDD-HHMM.tgz -C ~/lc274
```

Restart. Saves were never touched, so no save restore is needed — and none should be attempted.

## What this plan does NOT claim

Even after promotion, **no quest becomes VERIFIED PLAYABLE**. Promotion changes the data the live world
serves. Playability still needs a played quest whose stage survives a logout, and that has not happened
anywhere yet.

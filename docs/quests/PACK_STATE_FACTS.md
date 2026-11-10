# Pack state: corrected facts

Measured on `/data/data/com.termux/files/home/dev274/content` and the pinned 377 content on
10 November, after several of my own claims turned out to be wrong.

## 1. Animations are FILES on disk, not cache-only (my earlier claim was wrong)

I previously wrote that animations could not be ported because they are cache data. They are not:
`content/models/_animset` holds **336 `.anim` files** in dev274. Animations are assets like models and
are copied as files.

The pinned 377 content ships **zero** `.anim` files, so there is no upstream set to copy from — the
experiment that tried to copy them found nothing.

## 2. Every `_unpack/<revision>` folder is active, and 33 names are duplicated

| revision | definitions |
|---|---|
| 225 | 3,759 |
| 244 | 107 |
| 245 | 34 |
| 254 | 178 |
| 274 | 5,684 |

**33 names appear in more than one revision** (`lastcombat`, `com_attackanim`,
`sp_attack_impale_spotanim`, …). The packer reads all of them, so a duplicate is a live hazard — and it
also means my earlier habit of reading only `_unpack/274` was wrong in the other direction: revision 225
supplies thousands of definitions that 274 does not repeat.

This single fact explains several contradictory readings across the last ten rounds, including a
"27 non-permanent vars" figure that was really revision 225 data.

## 3. Where the build actually stands

`npm run build` still fails, one reference at a time. The error sequence this round:

```
all.loc:3130  anim=m_monkey_ape_ruler_nod      -> resolved by importing anim.pack names
all.loc:3618  param=ent,macro_ent_jungle_tree1 -> NOT resolvable: absent from BOTH trees
```

`macro_ent_jungle_tree1` is referenced by a loc definition that was imported from 377, and defined in
neither dev274 nor the 377 content. Resolving the tail therefore needs a **one-pass reference checker**
across the whole content tree, not another one-symbol-per-rebuild loop — which is what the loop already
proved: 25 iterations, no progress, no output.

## What is true right now

| | |
|---|---|
| `npm run build` | **fails** |
| Quests SCRIPT-VERIFIED | **0** |
| Quests VERIFIED PLAYABLE | **0** |
| World | `~/dev274` |
| Save | `~/lc274/engine/data/players/main/elrothiro.sav` — untouched, 858 bytes |

# Control build: pristine 274 content compiles — the sandbox breaks it

Machine: Android SM-A556E (Termux). Live world `~/lc274` (200 OK, untouched, cache from 9 Nov).
Save `~/lc274/engine/data/players/main/elrothiro.sav` — 858 bytes, untouched.

## The experiment

Built a separate control world `~/stock274` (ports 8892/8893/43596) using:

- **the same engine** as `~/dev274`
- **truly pristine content**: `git -C ~/lc274/content archive HEAD` unpacked, i.e. the committed state,
  not the working tree (which carries my patches)

## Result

```
control build exit=0
```

**Pristine 274 content compiles cleanly against this engine.**

## What that proves

1. **Not an engine/content version mismatch.** The pair builds.
2. **The sandbox failures are caused by my session's edits.** The errors appearing in *stock* area
   scripts (`bonzo.rs2:40`, `gertrude.rs2:77`) are a consequence of pack-level changes I made —
   deduplicating npc names/ids, pruning 11 varbits, stripping 207 `param=` lines, and registering
   interface ids by hand.

So my earlier "the stock content cannot be rebuilt" claim was doubly wrong: the interface gap was my
patch, and the script errors are my edits.

## Also found

`git -C ~/lc274/content status` shows the **live content directory carries uncommitted work**:

```
 M pack/varp.pack
 A quests-unbuilt/quest_agrith/...
 A quests-unbuilt/quest_deal/...
```

That is this session's quest-import material sitting uncommitted inside the live world's content tree.
It must be preserved — and per START_HERE it must not be blindly committed or cleaned.

## Correct path from here

`~/stock274` is now a **known-good baseline that builds**. The sandbox should be rebuilt *from it*, adding
one thing at a time, verifying `npm run build` after each:

1. journal `[feud]` component **with** its `interface.pack` + `interface.order` ids (my patch omitted them)
2. `legends_lamp` interface ids (same mistake)
3. varps for the ported quests
4. one quest's scripts + configs
5. maps / NPCs / objects (manifest-scoped)

Each step either keeps exit 0 or is rejected — no bulk edits, no error-string loops.

## Status

| | |
|---|---|
| Control build (pristine) | **exit 0** |
| Sandbox build | **fails** — by my edits |
| SCRIPT-VERIFIED | 0 |
| Live world / save | untouched |

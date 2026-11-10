# Incident: automated property-key stripping damaged the dev content tree

**What I did, wrongly.** `npm run build` rejected `multivar=` in a ported file. I assumed those keys were
unsupported in revision 274 and wrote a loop that deleted every line starting with the key the packer
named. Over six iterations it removed:

| key | lines removed | file |
|---|---|---|
| `multiloc=` | 3,948 | `scripts/_unpack/274/all.loc` |
| `multivar=` | 344 | `scripts/_unpack/274/all.loc` |
| `ldmodel=` | 24 | `scripts/_unpack/274/all.loc` |
| `multivar=` | 7 | `quest_golem/configs/golem.loc` |
| `multiloc=` | 25 | `quest_golem/configs/golem.loc` |
| `multivar=` / `multiloc=` | 1 / 2 | `_ported/configs/ported.loc` |

The next build failed differently: `Failed to find suitable loc models [misc_bookcase]` — because
`multiloc` entries carry the alternate forms of an object, so deleting them leaves objects with no
model to draw.

**Recovery.** `scripts/_unpack/274/all.loc` restored from the untouched live world
(`~/lc274/content/scripts/_unpack/274/all.loc`), verified **byte-identical** (37,639 bytes).

## Why the approach was wrong

1. **A build error names one location, not one rule.** Deleting the key everywhere is not the fix the
   error asked for.
2. **`multiloc`/`multivar`/`ldmodel` are structural**, not decoration. They are how an object has
   multiple states; removing them removes the object's model wiring.
3. **The keys arrived with my imports.** Stock 274 `all.loc` contains **zero** `multiloc`/`multivar`
   lines; the 377 definitions I imported brought thousands. The correct handling is per-definition:
   either port the loc's variants properly, or drop that definition and report the quest as needing
   work — not global deletion.

## Rule adopted

Never run a loop that edits content by matching a packer error string. A packer error identifies **one
site**; any automated fixer must produce a *reviewed plan* (as `prepack-check.mjs --apply` does) and
never delete structural properties en masse.

## State after recovery

| | |
|---|---|
| `_unpack/274/all.loc` | byte-identical to pristine 274 |
| Imported loc definitions | removed by the restore — must be re-imported deliberately |
| `npm run build` | fails |
| Save | `~/lc274/engine/data/players/main/elrothiro.sav` — untouched, 858 bytes |
| World | `~/dev274` |

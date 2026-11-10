# Checker gap: `multivar` references are not validated

Reported per the Round 27 rule: *if the build still fails, the checker missed a rule — report the exact
packer message, fix the checker, add a test, rerun. Do not patch around it by hand.*

## Exact packer message

```
Error during parsing - see ../content/scripts/_ported/configs/ported.loc:122
Invalid property key: multivar=handsand_coffee_multi
```

## What was done before it

On `~/dev274/content` (backup: `~/joshrs-recovery/dev274-content-2016.tgz`):

1. `prepack-check.mjs` read-only: **duplicates 197 · broken references 10,874 · script problems 70 ·
   pack-id issues 44**; plan: alias 3,742 refs, import 360 definitions + 25 constants, register 44 ids.
2. `--apply --copy-models`: applied, leaving only **4 alias + 3 constant** items outstanding.
3. `npm run build`: failed on `Non-unique var name found: golem_a`.
4. `repair-cross-registry-varps.py`: removed 11 colliding varps, collisions **0**.
5. `npm run build` again: failed on the `multivar` key above — **a rule the checker does not cover**.

## The gap

A `loc` may select its behaviour through a **multivar**, whose value is a varbit name. The checker
validates `param=`, `anim=`, `model=` and similar keys, but not `multivar=` against the varbit
registry, so a missing varbit only appears when the packer parses the file.

Suggested rule for the checker: for every `multivar=<name>` property, require `<name>` to exist in
`pack/varbit.pack` (and its base varp to exist), reporting `MISSING_VARBIT_REF` otherwise. A regression
test should use a one-line loc fixture with a multivar naming a non-existent varbit and assert one
finding.

## Status

| | |
|---|---|
| `npm run build` | **fails** (checker gap above) |
| Quests SCRIPT-VERIFIED | 0 |
| World | `~/dev274` |
| Save | `~/lc274/engine/data/players/main/elrothiro.sav` — untouched |

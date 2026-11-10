# Quest self-check loop (rev 274 dev world)

Run these in order after every content change. Each step reads plain text. A quest is
**SCRIPT-VERIFIED** only when steps 1-5 pass, and **VERIFIED PLAYABLE** only after Josh plays it.
Dev world only (`~/dev274`). Never `~/lc274`. Never touch an Elrothiro save.

| # | Check | Command (from the JoshRS checkout) | Passes when |
|---|---|---|---|
| 0 | Back up | `tar czf ~/joshrs-recovery/dev274-content-$(date +%H%M).tgz -C ~/dev274 content` | file exists |
| 1 | Pre-pack (static, ~1 s) | `node tools/questops/prepack-check.mjs ~/dev274/content --source <377 content> --pristine <untouched 274 content>` | 0 duplicates, 0 broken, 0 script problems |
| 1b | Fix what it can | same, plus `--apply --copy-models --strip-keys --log content-patches/rs274/SUBSTITUTIONS.md` (`--strip-keys` needs `--pristine` and the engine source) | re-check is clean; second run changes nothing |
| 2 | Build | `cd ~/dev274/engine && npm run build` | exit 0. "World ready" is NOT evidence |
| 3 | Maps and quest points | `node tools/questops/check-map-integrity.mjs ...` and `node tools/questops/check-quest-points.mjs ~/dev274/content` | no problems |
| 4 | Server playtest (layer 1) | stop the dev server, then `cd ~/dev274/engine && npx tsx <joshrs>/tools/questops/playtest/run.ts <scenario.json>` | every step PASS |
| 5 | Real client (layer 3) | `seed-account.ts qa_bot` once, then `node tools/visual/client-check.mjs <checkpoints.json> --user qa_bot` | no FAIL; attach the screenshots |

Quick questions without writing a scenario:
`node tools/questops/dev-debug/inspect.mjs map|near|var|stage --content ~/dev274/content ...`

## Start a quest from a generated scaffold
`node tools/questops/playtest/gen-scenarios.mjs ~/dev274/content --out <dir> --quest quest_x --checkpoints <dir>/cp.json`
writes a scenario (start NPC in place, talks, stage survives save/reload). Run it with `--dump`, read
the real dialogue options, and add `choose` steps. Remove `"generated": true` once you edit by hand
so the tool never overwrites it.

## Reading results
- Step 1 says `copy-model`: the source has the model. Copy locally with `--copy-models` (never commit `.ob2`).
- Step 1 says `drop-property`: the 274 cache lacks the animation frames. Cosmetic: it is commented out and logged.
- Step 1 says `blocked`: park the quest (needs a model or engine command 274 lacks) and tell Josh.
- Step 1 says `UNSUPPORTED KEYS` (`multivar`, `multiloc`, `multinpc`, `ldmodel`...): the 274 packer has no such key, so `npm run build` stops with "Invalid property key". These are 377 features (one object that changes form by a variable); importing a varbit does not help. Dropping them leaves the base form, which can break the quest, so park it unless the base form is enough. Needs the engine source beside the content (`~/dev274/engine`) or `--engine <dir>`.
- Step 1 clean but step 2 fails: the checker missed a rule. Paste the packer's message, fix the checker, add a test.
- Step 4 can't find the NPC but step 1 and 2 pass: it is placed by script or its map was not imported (`imported-maps.txt`).
- Step 5 black view: missing map region. Step 5 invisible NPC: model not packed.

## Never
Commit `.ob2` or `.anim` files or any cache data. Register an animation, model or sound *name* without the
data. Mark anything VERIFIED PLAYABLE before Josh has played it. Promote to `lc274` without his approval
(see `PROMOTION_PLAN_dev274_to_lc274.md`).

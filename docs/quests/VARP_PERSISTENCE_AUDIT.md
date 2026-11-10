# Varp persistence audit (rev-274 dev world)

**Rule, read from the engine:** `Player.save()` writes a varp only when
`scope === SCOPE_PERM && value !== 0` (`src/engine/entity/Player.ts`, the `save()` loop). Anything else
is **never stored** — no error, no warning, the value simply vanishes at logout.

Measured against `~/dev274/content` (`/data/data/com.termux/files/home/dev274/content`):

| | |
|---|---|
| varp definitions across all config files | 465 |
| with `scope=perm` | 299 |
| without | 166 |
| vars referenced by ported quests | 347 |
| referenced, defined, **but without `scope=perm`** | **27** |

## The 27, and what they look like

```
book_page, open_book            — book/interface state
damagetype, damagestyle, com_maxhit, com_attackanim, com_attacksound, com_attackdelay
action_delay                    — combat/timing scratch vars
if1, if2                        — interface slots
qp                              — quest points
journey_number                  — cutscene step
```

Most of these are **engine or interface scratch variables**, which is exactly what `scope=perm`
should *not* be used for — persisting them would carry stale UI state across sessions. They are listed
rather than "fixed".

## The part that matters

A quest **stage** varp must be permanent or the quest cannot remember itself. The stage varps
registered for ported quests were written with `scope=perm` deliberately, and this audit is the check
that they were: none of the ported stage vars appear in the 27.

Verifying that claim per-quest is the next step, and it needs a classification of which varp is the
*stage* var — which the quest scripts do not label explicitly. That classification is what a
playthrough would settle immediately and no static check can.

## Why this matters more than another structural audit

"Structurally complete" never mentioned persistence. A quest could be complete, playable end-to-end
in one session, and still reset at logout because its stage var lacked one line of config. This is the
first check in the project that tests the property the objective actually names: *progress survives
logout and restart*.

# Party Drop Chest item-safety fix — issue #52

**Status:** root cause reproduced and fixed in an isolated 377 world; **not deployed** to the live family world.

## Root cause

`partyroom_tempinv` is the per-player eight-slot offer inventory behind the Party Drop Chest. In pinned 377 `scripts/_unpack/727/all.inv` it had no `scope=` line, which defaults to `scope=temp`.

Temporary inventories are **not written to the player save** (`PlayerLoading` only persists `SCOPE_PERM`). When the chest closes, `[if_close,party_drop_chest]` runs `~moveallinv(partyroom_tempinv, inv)`. If the backpack is full, `inv_moveitem` cannot return every offer; the unreturned items stay in the temporary inventory and are destroyed on the next logout/relogin.

## Reproduction (before fix)

Disposable 377 engine/content/SQLite/profile `issue293` on ports 60001–60006; disposable account `testhero`; no live account, save, database or runtime was used.

1. Teleport to the Party Room chest at `(2729, 3470, plane 0)`.
2. Open it (`oploc1 2417`, then `oploc2 2418`).
3. Deposit one `iron_axe` (`obj 1349`) into the chest offer.
4. Fill the remaining backpack slots with `::givecrap` to 28/28.
5. Close the chest, disconnect and log in again.
6. Result: the axe was **not** in the backpack, **not** in the shared chest, and the temporary offer inventory does not survive. The item was lost.

This matches issue #52's reported empty-chest symptom without asserting that this exact sequence caused the original party.

## Fix

`tools/rs377-partychest/apply-tempinv-persist.mjs` changes only:

```ini
[partyroom_tempinv]
size=8
scope=perm
```

The eight offer slots now persist in the player save if they cannot be returned. The next time the player opens the chest, `inv_transmit(partyroom_tempinv, party_drop_chest:playerinv)` shows the retained offer, and the normal Withdraw buttons recover it.

`partyroom_dropinv` stays `scope=shared` (216 slots). No item grants, no chest resets, no save edits, and no change to accept/drag logic.

## Verification (after fix)

Same disposable account and sequence:

| Check | Result |
| --- | --- |
| Open chest and deposit `iron_axe` | temporary offer has `{ id: 1349, count: 1 }` |
| Fill backpack to 28/28, close, disconnect, relogin | offer still `{ id: 1349, count: 1 }` |
| Open chest again, free one slot, withdraw | axe returns to backpack; offer slot empties |

The separate withdrawal path was also exercised across the offer slots and moved the axe back to `inv` correctly.

## Limits / non-findings

- Pinned 377 content has **no** custom `drag-any-chest-item-to-clear` or `threshold-auto-reset` handler. Those Agy experiments were not part of this world's party chest script, so they were not modified or blamed.
- Concurrent-player and 136+ item shared-chest capacity were not exhaustively played; `partyroom_dropinv` remains 216 slots and is unchanged.
- This fix prevents destruction of unreturned offers. It does **not** create or restore missing items and makes no claim about the original incident quantity.

## Deployment

Not deployed. Requires owner-approved offline window, fresh verified backup, applying the installer to a copy of the pinned content, rebuilding packs, and restarting. The restart is the deployment event. The live `runtime/jparris-377` path is refused by the installer.

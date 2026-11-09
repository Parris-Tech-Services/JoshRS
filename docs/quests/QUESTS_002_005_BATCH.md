# Quests 2–5 — verification batch

Same rule as quest #1: **STRUCTURALLY VERIFIED** means every requirement maps to real code and
the rewards match the wiki. It does not mean anyone has played it in this 274 world.

---

## #4 Sheep Shearer — one real gap found

Wiki (OSRS): 1 QP, **150 Crafting XP**, **60 coins**, plus *"an additional 50 experience if you
make the balls of wool on a spinning wheel instead of buying it yourself."*

Content: `scripts/quests/quest_sheep/scripts/quest_sheep.rs2`

```rs
inv_del(inv, ball_of_wool, 1);
stat_advance(crafting, 1500);   // 150 XP, matches the wiki exactly
```

| Reward | Wiki | Content | Verdict |
|---|---|---|---|
| Quest points | 1 | `^sheep_questpoints = 1` | ✅ |
| Crafting XP | 150 | `stat_advance(crafting, 1500)` | ✅ |
| Coins | 60 | granted | ✅ |
| **+50 spin bonus** | **yes** | **not implemented** | ❌ **gap** |

**Why it is not fixed yet.** Adding it needs a flag set at the spinning wheel and a check at
hand-in. The OSRS wiki describes the *modern* version; I have not confirmed the bonus existed
in the 274 era, and inventing the mechanism would be a guess dressed as fidelity. Recorded as a
gap pending a historical source rather than implemented blind.

## #5 Shield of Arrav — requires two players, by design

The curator only accepts both halves together:

```rs
// scripts/areas/area_varrock/scripts/curator.rs2
if(inv_total(inv, arravshield1) > 0 & inv_total(inv, arravshield2) > 0) {
    inv_del(inv, arravshield1, 1); inv_del(inv, arravshield2, 1);
    inv_add(inv, arravcertificate, 2);
}
```

Half one comes from the **Phoenix Gang** hideout chest; half two from the **Black Arm Gang**
cupboard. A player can only join one gang, so a single account cannot complete it — the halves
must be traded.

This is **authentic**, not a defect. It also makes Shield of Arrav the single best co-op quest
for the family setup: it cannot be soloed, so it has to be done together.

Two player-visible quirks worth knowing:

- `configs/*.varp` carries `// todo: one day these two ids need to be flipped for correctness,
  we have them swapped`. Changing varp ids now would need a save migration; not attempted.
- The chest/cupboard refuse a second half if one is already held *or banked*, which prevents
  duplication but also means a partner holding a spare cannot pick one up.

## #2 Demon Slayer and #3 Romeo & Juliet

| Quest | QP const | Wiki QP | Status |
|---|---|---|---|
| Demon Slayer | `^demon_questpoints = 3` | 3 | ✅ matches |
| Romeo & Juliet | `^romeojuliet_questpoints = 5` | 5 | ✅ matches |

Both are bot-verified on the 377 world (Demon Slayer last in Elrothiro's list). Demon Slayer
still carries one `TODO` marker in its scripts, which is recorded in
[QUEST_AUDIT.md](QUEST_AUDIT.md).

## Note on the bot logs and XP rates

Elrothiro's log records Sheep Shearer as `+5,000 Crafting XP`. The wiki and the content both say
**150**. At the server's 25× rate that would be 3,750, not 5,000 — so the log figure does not
reconcile with either. Treat bot-log XP numbers as approximate unless they divide cleanly by 25
(Cook's Assistant's 7,500 = 300 × 25 does; this one does not).

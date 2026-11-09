# Jimmy-Dev Lab Log

## 1. Bedabin Nomad Fighter (`id=1239`, `bedabin_fighter`) @ `(3160, 3031, L0)`
- **Observed**: `No trigger for [opnpc1,bedabin_fighter]` / `Nothing interesting happens.`
- **Fix**: Added `[opnpc1,bedabin_fighter]` and `[proc,bedabin_fighter_options]` in `server/content/scripts/areas/area_desert/scripts/bedabin_nomad.rs2`.
- **Verified**: Tested all dialogue branches (`"What is this place?"`, `"Where is the Shantay Pass?"`, `"Okay, thanks"`) and relog in-game (`PASS`, `patches/0001-bedabin-fighter-talkto.patch`).

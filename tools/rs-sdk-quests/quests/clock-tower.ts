import {
  Ctx, Quest, has, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors, rechargePrayer, withdrawFromDraynorBank, pickupWithWait
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Clock Tower';

export async function ensureIceGloves(c: Ctx): Promise<boolean> {
  const { bot, sdk } = c;
  const hasGloves = () =>
    has(sdk, /^ice gloves$/i) ||
    (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 1580 || /^ice gloves$/i.test(e.name));

  if (hasGloves()) {
    if (has(sdk, /^ice gloves$/i)) {
      await bot.equipItem(/^ice gloves$/i);
      await sleep(400);
    }
    return true;
  }

  // Ensure pickaxe for mining the White Wolf Mountain rockslide (level 50 Mining required)
  const hasPick = () =>
    has(sdk, /pickaxe/i) ||
    (sdk.getState()?.equipment ?? []).some((e: any) => /pickaxe/i.test(e.name));
  if (!hasPick()) {
    await withdrawFromDraynorBank(c, [/pickaxe/i]);
  }
  if (!hasPick()) {
    await pickupWithWait(c, 3009, 3342, /bronze pickaxe/i, 25);
  }
  if (!hasPick()) return false;

  const climb = async (lx: number, lz: number, wx: number, wz: number, id: number, toUnderground: boolean) => {
    for (let i = 0; i < 4 && ((sdk.getState()?.player?.worldZ ?? 0) > 9000) !== toUnderground; i++) {
      await bot.walkTo(wx, wz, 1);
      const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === id && Math.hypot(l.x - lx, l.z - lz) <= 2);
      if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
      await waitCond(() => ((sdk.getState()?.player?.worldZ ?? 0) > 9000) === toUnderground, 5000, 250);
    }
    return ((sdk.getState()?.player?.worldZ ?? 0) > 9000) === toUnderground;
  };

  if ((sdk.getState()?.player?.worldZ ?? 0) < 9880) {
    await rechargePrayer(c, 35);

    // Walk to White Wolf Mountain rockslide at (2838, 3517) from the West side (2837, 3517) and mine East to (2840, 3516)
    if ((sdk.getState()?.player?.worldX ?? 0) < 2839 || (sdk.getState()?.player?.worldZ ?? 0) < 3508) {
      await bot.walkTo(2845, 3505, 3);
      await bot.walkTo(2837, 3517, 1);
      for (let i = 0; i < 5 && (sdk.getState()?.player?.worldX ?? 0) < 2839; i++) {
        const rock = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2634);
        if (rock) {
          await sdk.sendInteractLoc(rock.x, rock.z, rock.id, 2);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2839, 6000, 250);
        }
        await sleep(400);
      }
    }

    if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
      await bot.activatePrayer('protect_from_melee');
    }

    if (!(await climb(2848, 3513, 2848, 3512, 1759, true))) return false;
  }

  if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
    await bot.activatePrayer('protect_from_melee');
  }

  // Ladder chain into Ice Queen's lair (verified via exact collision-data BFS)
  if ((sdk.getState()?.player?.worldX ?? 0) < 2855) {
    if ((sdk.getState()?.player?.worldZ ?? 0) > 9000 && (sdk.getState()?.player?.worldX ?? 0) <= 2850) {
      await climb(2824, 9907, 2824, 9908, 1755, false);
    }
    if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
      if (!(await climb(2827, 3510, 2827, 3511, 1759, true))) return false;
    }
    if (!(await climb(2857, 9917, 2857, 9918, 1755, false))) return false;
    if (!(await climb(2859, 3519, 2859, 3520, 1759, true))) return false;
  }

  // Walk to Ice Queen (795 at 2866, 9956) and defeat her for Ice gloves (1580)
  for (const w of [/^silverlight$/i, /^bronze sword$/i, /^iron chainbody$/i, /^bronze med helm$/i, /^wooden shield$/i]) {
    if (has(sdk, w)) { await bot.equipItem(w); await sleep(250); }
  }
  await sdk.sendSetCombatStyle(1);
  await bot.walkTo(2866, 9956, 3);

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && !hasGloves()) {
    if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
      if (!sdk.getState()?.prayers?.protect_from_melee) {
        await bot.activatePrayer('protect_from_melee');
      }
    }
    const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 1580 || /ice gloves/i.test(i.name));
    if (g) {
      await bot.pickupItem(g);
      if (await waitCond(hasGloves, 4000, 200)) break;
    }
    const queen = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 795 || /ice queen/i.test(n.name));
    if (queen && !sdk.getState()?.player?.combat?.inCombat) {
      await bot.attack(queen);
    }
    await sleep(600);
  }

  if (has(sdk, /^ice gloves$/i)) {
    await bot.equipItem(/^ice gloves$/i);
    await sleep(400);
  }

  // Exit Ice Queen's lair via reverse ladder chain
  await climb(2859, 9919, 2859, 9920, 1755, false);
  await climb(2857, 3517, 2857, 3518, 1759, true);
  await climb(2827, 9910, 2827, 9911, 1755, false);
  await climb(2824, 3507, 2824, 3508, 1759, true);
  await climb(2848, 9913, 2848, 9912, 1755, false);

  await bot.deactivateAllPrayers();

  // Mine rockslide (2634 at 2838, 3517) from East side (2840, 3517) -> West side (2837, 3518)
  await bot.walkTo(2840, 3517, 1);
  for (let i = 0; i < 5 && (sdk.getState()?.player?.worldX ?? 9999) > 2837; i++) {
    const rock = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2634);
    if (rock) {
      await sdk.sendInteractLoc(rock.x, rock.z, rock.id, 2);
      await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2837, 6000, 250);
    }
    await sleep(400);
  }

  return hasGloves();
}

export const cog: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;

    let started = true;
    let whitePlaced = true;
    let redPlaced = true;
    let blackPlaced = false;
    let bluePlaced = false;

    const inDungeon = () => {
      const z = sdk.getState()?.player?.worldZ ?? 0;
      return z >= 9600 && z <= 9700;
    };
    const findCog = (id: number) => (sdk.getState()?.inventory ?? []).find((i: any) => i.id === id);
    const hasCog = (id: number) => !!findCog(id);
    const hasAnyCog = () => (sdk.getState()?.inventory ?? []).some((i: any) => [20, 21, 22, 23].includes(i.id));

    const climbTower = async (targetLvl: 0 | 1 | 2) => {
      for (let i = 0; i < 6 && lvl(sdk) !== targetLvl; i++) {
        const cur = lvl(sdk);
        if (cur === 0 && targetLvl > 0) {
          const w = await bot.walkTo(2571, 3240, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 2574, 3250, 3);
            await openNearbyDoors(c, 2567, 3245, 3);
            await openNearbyDoors(c, 2569, 3239, 3);
            await bot.walkTo(2571, 3240, 1);
          }
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1738);
          if (st) await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
        } else if (cur === 1) {
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1739);
          if (st) await sdk.sendInteractLoc(st.x, st.z, st.id, targetLvl > 1 ? 2 : 3);
        } else if (cur === 2 && targetLvl < 2) {
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1740);
          if (st) await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
        }
        await waitCond(() => lvl(sdk) !== cur, 4000, 250);
      }
      return lvl(sdk) === targetLvl;
    };

    const startAndBucket = () => step(c, N, 'start-and-bucket', async () => {
      if ((inDungeon() || hasAnyCog()) && has(sdk, /^bucket of water$/i)) {
        started = true;
        return true;
      }
      if (started && (has(sdk, /^bucket of water$/i) || blackPlaced)) return true;

      if (inDungeon() && (!started || (!has(sdk, /^bucket of water$/i) && !blackPlaced))) {
        await openNearbyDoors(c, 2575, 9651, 3);
        await openNearbyDoors(c, 2575, 9648, 3);
        await bot.walkTo(2566, 9642, 1);
        const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && Math.hypot(l.x - 2566, l.z - 9642) <= 2);
        if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
        await waitCond(() => !inDungeon(), 4000, 250);
      }
      if (!inDungeon() && lvl(sdk) > 0) await climbTower(0);
      if (!inDungeon()) {
        if (!(await walkToKandarin(c, 2616, 3255))) return false;
      }

      // 1. Get Bucket (1925) at (2616, 3255) and fill on Well (884) at (2612, 3254)
      if (!has(sdk, /^bucket of water$/i) && !blackPlaced) {
        if (!has(sdk, /^bucket$/i)) {
          await bot.walkTo(2616, 3255, 1);
          const deadline = Date.now() + 35_000;
          while (Date.now() < deadline && !has(sdk, /^bucket$/i)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 1925 || /^bucket$/i.test(i.name));
            if (g) {
              await bot.pickupItem(g);
              if (await waitInv(sdk, /^bucket$/i, 4000)) break;
            }
            await sleep(600);
          }
        }
        if (has(sdk, /^bucket$/i)) {
          await bot.walkTo(2612, 3254, 2);
          await bot.useItemOnLoc(/^bucket$/i, /^well$/i);
          await waitInv(sdk, /^bucket of water$/i, 5000);
        }
      }

      // 2. Talk to Brother Kojo (223) at (2570, 3249)
      if (!started) {
        const w = await bot.walkTo(2570, 3249, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 2574, 3250, 3);
          await openNearbyDoors(c, 2567, 3245, 3);
          await bot.walkTo(2570, 3249, 2);
        }
        await talk(c, /^brother kojo$/i, [/ok old monk, what can i do/i]);
        started = true;
      }

      return started;
    });

    const whiteCogStep = () => step(c, N, 'white-cog', async () => {
      if (whitePlaced) return true;

      if (!hasCog(20)) {
        if (!inDungeon()) {
          const w = await bot.walkTo(2566, 3242, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 2574, 3250, 3);
            await openNearbyDoors(c, 2567, 3245, 3);
            await bot.walkTo(2566, 3242, 1);
          }
          for (let i = 0; i < 4 && !inDungeon(); i++) {
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754 && Math.hypot(l.x - 2566, l.z - 3242) <= 2);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(inDungeon, 4000, 250);
          }
        }

        // Pick up Rat poison (24) at (2564, 9662)
        if (!has(sdk, /^rat poison$/i)) {
          const w = await bot.walkTo(2564, 9662, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 2575, 9651, 3);
            await bot.walkTo(2564, 9662, 1);
          }
          const deadline = Date.now() + 30_000;
          while (Date.now() < deadline && !has(sdk, /^rat poison$/i)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 24 || /rat poison/i.test(i.name));
            if (g) {
              await bot.pickupItem(g);
              if (await waitInv(sdk, /^rat poison$/i, 4000)) break;
            }
            await sleep(500);
          }
        }

        // Pull Lever ctlevera (33 at 2591, 9661) from north corridor (2591, 9661)
        const wl = await bot.walkTo(2591, 9661, 1);
        if (!wl?.success) {
          await openNearbyDoors(c, 2575, 9651, 3);
          await openNearbyDoors(c, 2582, 9651, 3);
          await bot.walkTo(2591, 9661, 1);
        }
        const lev = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => (l.id === 33 || l.id === 35) && l.x === 2591);
        if (lev) {
          await sdk.sendInteractLoc(lev.x, lev.z, lev.id, 1);
          await sleep(1800);
        }

        // Poison Food trough (40 at 2586, 9654) — enter rat cage via opened gate at (2595, 9657)
        await bot.walkTo(2596, 9657, 1);
        await sdk.sendWalk(2592, 9657, true);
        await sleep(2000);
        await sdk.sendWalk(2587, 9655, true);
        await sleep(2400);
        if (has(sdk, /^rat poison$/i)) {
          const poison = sdk.findInventoryItem(/^rat poison$/i);
          const trough = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 40);
          if (poison && trough) {
            await sdk.sendUseItemOnLoc(poison.slot, trough.x, trough.z, trough.id);
            await waitCond(() => !has(sdk, /^rat poison$/i), 5000, 250);
            await sleep(3500);
          }
        }

        // Go through ctratgatec (39 at 2579, 9656) and pick up White cog (20 at 2577, 9655)
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 9999) > 2578; i++) {
          await sdk.sendWalk(2580, 9656, true);
          await sleep(1500);
          const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 39);
          if (gate) {
            await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 3500, 200)) {
              await chat(c);
            }
            await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2578, 3500, 200);
          }
        }
        await sdk.sendWalk(2577, 9655, true);
        await sleep(1200);
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline && !hasCog(20)) {
          const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 20);
          if (g) {
            await bot.pickupItem(g);
            if (await waitCond(() => hasCog(20), 4000, 200)) break;
          }
          await sleep(500);
        }

        // Climb up Ladder (1755 at 2575, 9655)
        for (let i = 0; i < 4 && inDungeon(); i++) {
          await sdk.sendWalk(2576, 9655, true);
          await sleep(1000);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && l.x === 2575);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          await waitCond(() => !inDungeon(), 4000, 250);
        }
      }

      if (!hasCog(20)) return false;
      if (inDungeon()) {
        const p = sdk.getState()?.player;
        if (p && p.worldX <= 2578 && p.worldZ >= 9654 && p.worldZ <= 9658) {
          await sdk.sendWalk(2576, 9655, true);
          await sleep(1000);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && l.x === 2575);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
        } else {
          await openNearbyDoors(c, 2602, 9638, 3);
          await openNearbyDoors(c, 2598, 9648, 3);
          await openNearbyDoors(c, 2582, 9648, 3);
          await openNearbyDoors(c, 2575, 9651, 3);
          await openNearbyDoors(c, 2575, 9648, 3);
          await bot.walkTo(2566, 9642, 1);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && Math.hypot(l.x - 2566, l.z - 9642) <= 2);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
        }
        await waitCond(() => !inDungeon(), 4000, 250);
      }
      if (!(await climbTower(2))) return false;
      await bot.walkTo(2567, 3242, 1);
      const wc = findCog(20);
      const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 31);
      if (wc && pole) {
        await sdk.sendUseItemOnLoc(wc.slot, pole.x, pole.z, pole.id);
        await waitCond(() => !hasCog(20), 5000, 250);
      }
      whitePlaced = !hasCog(20);
      await climbTower(0);
      return whitePlaced;
    });

    const redAndBlackCogs = () => step(c, N, 'red-and-black-cogs', async () => {
      if (redPlaced && blackPlaced) return true;

      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }

      // 1. Red cog (23 at 2583, 9613) -> pole 29 at L0 (2568, 3243)
      if (!redPlaced) {
        if (!hasCog(23)) {
          if (!inDungeon()) {
            const w = await bot.walkTo(2566, 3242, 1);
            if (!w?.success) {
              await openNearbyDoors(c, 2574, 3250, 3);
              await openNearbyDoors(c, 2567, 3245, 3);
              await bot.walkTo(2566, 3242, 1);
            }
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754 && Math.hypot(l.x - 2566, l.z - 3242) <= 2);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(inDungeon, 4000, 250);
          }
          const wr = await bot.walkTo(2583, 9613, 1);
          if (!wr?.success) {
            await openNearbyDoors(c, 2575, 9648, 3);
            await openNearbyDoors(c, 2565, 9612, 3);
            await bot.walkTo(2583, 9613, 1);
          }
          const deadline = Date.now() + 30_000;
          while (Date.now() < deadline && !hasCog(23)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 23);
            if (g) {
              await bot.pickupItem(g);
              if (await waitCond(() => hasCog(23), 4000, 200)) break;
            }
            await sleep(500);
          }
        }
        if (inDungeon()) {
          const wl = await bot.walkTo(2566, 9642, 1);
          if (!wl?.success) {
            await openNearbyDoors(c, 2565, 9612, 3);
            await openNearbyDoors(c, 2575, 9648, 3);
            await bot.walkTo(2566, 9642, 1);
          }
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && Math.hypot(l.x - 2566, l.z - 9642) <= 2);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          await waitCond(() => !inDungeon(), 4000, 250);
        }
        await bot.walkTo(2568, 3242, 1);
        const rc = findCog(23);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 29);
        if (rc && pole) {
          await sdk.sendUseItemOnLoc(rc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !hasCog(23), 5000, 250);
        }
        redPlaced = !hasCog(23);
      }

      // 2. Black cog (21 at 2613, 9639) -> pole 30 at dungeon (2570, 9642)
      if (!blackPlaced) {
        if (!hasCog(21)) {
          if (!(await ensureIceGloves(c))) return false;
          if (!(await walkToKandarin(c, 2566, 3242))) return false;
          await rechargePrayer(c, 30);
          if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await bot.activatePrayer('protect_from_melee');
          }
          if (!inDungeon()) {
            const w = await bot.walkTo(2566, 3242, 1);
            if (!w?.success) {
              await openNearbyDoors(c, 2574, 3250, 3);
              await openNearbyDoors(c, 2567, 3245, 3);
              await bot.walkTo(2566, 3242, 1);
            }
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754 && Math.hypot(l.x - 2566, l.z - 3242) <= 2);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(inDungeon, 4000, 250);
          }
          const wb = await bot.walkTo(2613, 9639, 1);
          if (!wb?.success) {
            await openNearbyDoors(c, 2582, 9648, 3);
            await openNearbyDoors(c, 2598, 9648, 3);
            await openNearbyDoors(c, 2602, 9638, 3);
            await bot.walkTo(2613, 9639, 1);
          }
          if (has(sdk, /^ice gloves$/i)) {
            await bot.equipItem(/^ice gloves$/i);
            await sleep(400);
          }
          const deadline = Date.now() + 25_000;
          while (Date.now() < deadline && !hasCog(21)) {
            const g2 = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 21);
            if (g2) {
              await bot.pickupItem(g2);
              if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasCog(21), 4000, 200)) {
                if (sdk.getState()?.dialog?.isOpen) await chat(c);
                if (hasCog(21)) break;
              }
            }
            await sleep(500);
          }
        }
        const wp = await bot.walkTo(2570, 9641, 1);
        if (!wp?.success) {
          await openNearbyDoors(c, 2602, 9638, 3);
          await openNearbyDoors(c, 2598, 9648, 3);
          await openNearbyDoors(c, 2582, 9648, 3);
          await bot.walkTo(2570, 9641, 1);
        }
        const bc = findCog(21);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 30);
        if (bc && pole) {
          await sdk.sendUseItemOnLoc(bc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !hasCog(21), 5000, 250);
        }
        blackPlaced = !hasCog(21);

        // Climb up Ladder (1755 at 2566, 9642)
        for (let i = 0; i < 4 && inDungeon(); i++) {
          await bot.walkTo(2566, 9642, 1);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && Math.hypot(l.x - 2566, l.z - 9642) <= 2);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          await waitCond(() => !inDungeon(), 4000, 250);
        }
      }

      await bot.deactivateAllPrayers();
      return redPlaced && blackPlaced;
    });

    const blueCogAndFinish = () => step(c, N, 'blue-cog-and-finish', async () => {
      if (!bluePlaced) {
        if (!hasCog(22)) {
          if (inDungeon()) {
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(() => !inDungeon(), 4000, 250);
          }
          const w = await bot.walkTo(2566, 3228, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 2569, 3239, 3);
            await openNearbyDoors(c, 2567, 3245, 3);
            await bot.walkTo(2566, 3228, 1);
          }
          for (let i = 0; i < 4 && !inDungeon(); i++) {
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754 && Math.hypot(l.x - 2566, l.z - 3227) <= 2);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(inDungeon, 4000, 250);
          }
          await bot.walkTo(2576, 9631, 0);
          const wall = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1586);
          if (wall) {
            await sdk.sendInteractLoc(wall.x, wall.z, wall.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2575, 4000, 250);
          }
          await sdk.sendWalk(2574, 9633, true);
          await sleep(1200);
          const deadline = Date.now() + 30_000;
          while (Date.now() < deadline && !hasCog(22)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 22);
            if (g) {
              await bot.pickupItem(g);
              if (await waitCond(() => hasCog(22), 4000, 200)) break;
            }
            await sleep(500);
          }
          for (let i = 0; i < 4 && inDungeon(); i++) {
            await sdk.sendWalk(2572, 9631, true);
            await sleep(1000);
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && l.x === 2572);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(() => !inDungeon(), 4000, 250);
          }
        }
        if (!(await climbTower(1))) return false;
        await bot.walkTo(2569, 3241, 1);
        const bc = findCog(22);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 32);
        if (bc && pole) {
          await sdk.sendUseItemOnLoc(bc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !hasCog(22), 5000, 250);
        }
        bluePlaced = !hasCog(22);
        await climbTower(0);
      }

      if (!bluePlaced) return false;
      const coins0 = (sdk.getState()?.inventory ?? []).find((i: any) => /^coins$/i.test(i.name))?.count ?? 0;
      const w = await bot.walkTo(2570, 3249, 2);
      if (!w?.success) {
        await openNearbyDoors(c, 2569, 3239, 3);
        await openNearbyDoors(c, 2567, 3245, 3);
        await bot.walkTo(2570, 3249, 2);
      }
      await talk(c, /^brother kojo$/i, []);
      return await waitCond(() => {
        const coinsNow = (sdk.getState()?.inventory ?? []).find((i: any) => /^coins$/i.test(i.name))?.count ?? 0;
        return coinsNow >= coins0 + 500;
      }, 8000, 300);
    });

    if (!(await startAndBucket())) return false;
    if (!(await whiteCogStep())) return false;
    if (!(await redAndBlackCogs())) return false;
    return await blueCogAndFinish();
  },
};

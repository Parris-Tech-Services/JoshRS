import {
  Ctx, Quest, has, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Clock Tower';

export const cog: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;

    let started = false;
    let whitePlaced = false;
    let redPlaced = false;
    let blackPlaced = false;
    let bluePlaced = false;

    const inDungeon = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;

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
      if (started && (has(sdk, /^bucket of water$/i) || blackPlaced)) return true;

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
        if (!(await talk(c, /^brother kojo$/i, [/ok old monk, what can i do/i]))) return false;
        started = true;
      }

      return started;
    });

    const whiteCogStep = () => step(c, N, 'white-cog', async () => {
      if (whitePlaced) return true;

      if (!has(sdk, /^white cog$/i)) {
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

        // Pull Lever ctlevera (33 at 2591, 9661)
        const wl = await bot.walkTo(2591, 9660, 1);
        if (!wl?.success) {
          await openNearbyDoors(c, 2575, 9651, 3);
          await openNearbyDoors(c, 2582, 9651, 3);
          await bot.walkTo(2591, 9660, 1);
        }
        const lev = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 33 && l.x === 2591);
        if (lev) {
          await sdk.sendInteractLoc(lev.x, lev.z, lev.id, 1);
          await sleep(1500);
        }

        // Poison Food trough (40 at 2586, 9654)
        await bot.walkTo(2587, 9655, 1);
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
        await bot.walkTo(2580, 9656, 0);
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 39);
        if (gate) {
          await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldX ?? 9999) <= 2579, 4000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }
        await bot.walkTo(2577, 9655, 1);
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline && !has(sdk, /^white cog$/i)) {
          const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 20 || /white cog/i.test(i.name));
          if (g) {
            await bot.pickupItem(g);
            if (await waitInv(sdk, /^white cog$/i, 4000)) break;
          }
          await sleep(500);
        }

        // Climb up Ladder (1755 at 2575, 9655)
        for (let i = 0; i < 4 && inDungeon(); i++) {
          await bot.walkTo(2576, 9655, 1);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && l.x === 2575);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          await waitCond(() => !inDungeon(), 4000, 250);
        }
      }

      if (!has(sdk, /^white cog$/i)) return false;
      if (!(await climbTower(2))) return false;
      await bot.walkTo(2567, 3242, 1);
      const wc = sdk.findInventoryItem(/^white cog$/i);
      const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 31);
      if (wc && pole) {
        await sdk.sendUseItemOnLoc(wc.slot, pole.x, pole.z, pole.id);
        await waitCond(() => !has(sdk, /^white cog$/i), 5000, 250);
      }
      whitePlaced = !has(sdk, /^white cog$/i);
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
        if (!has(sdk, /^red cog$/i)) {
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
          while (Date.now() < deadline && !has(sdk, /^red cog$/i)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 23 || /red cog/i.test(i.name));
            if (g) {
              await bot.pickupItem(g);
              if (await waitInv(sdk, /^red cog$/i, 4000)) break;
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
        const rc = sdk.findInventoryItem(/^red cog$/i);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 29);
        if (rc && pole) {
          await sdk.sendUseItemOnLoc(rc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !has(sdk, /^red cog$/i), 5000, 250);
        }
        redPlaced = !has(sdk, /^red cog$/i);
      }

      // 2. Black cog (21 at 2613, 9639) -> pole 30 at L0 (2570, 9642)
      if (!blackPlaced) {
        if (!has(sdk, /^black cog$/i)) {
          if (!inDungeon()) {
            await bot.walkTo(2566, 3242, 1);
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
          const bw = sdk.findInventoryItem(/^bucket of water$/i);
          const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 21 || /black cog/i.test(i.name));
          if (bw && g) {
            await sdk.sendUseItemOnGroundItem(bw.slot, g.id, g.x, g.z);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || !has(sdk, /^bucket of water$/i), 4000, 250)) {
              if (sdk.getState()?.dialog?.isOpen) await chat(c);
            }
          }
          const deadline = Date.now() + 25_000;
          while (Date.now() < deadline && !has(sdk, /^black cog$/i)) {
            const g2 = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 21 || /black cog/i.test(i.name));
            if (g2) {
              await bot.pickupItem(g2);
              if (await waitInv(sdk, /^black cog$/i, 4000)) break;
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
        const bc = sdk.findInventoryItem(/^black cog$/i);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 30);
        if (bc && pole) {
          await sdk.sendUseItemOnLoc(bc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !has(sdk, /^black cog$/i), 5000, 250);
        }
        blackPlaced = !has(sdk, /^black cog$/i);

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
        if (!has(sdk, /^blue cog$/i)) {
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
          await bot.walkTo(2574, 9633, 1);
          const deadline = Date.now() + 30_000;
          while (Date.now() < deadline && !has(sdk, /^blue cog$/i)) {
            const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 22 || /blue cog/i.test(i.name));
            if (g) {
              await bot.pickupItem(g);
              if (await waitInv(sdk, /^blue cog$/i, 4000)) break;
            }
            await sleep(500);
          }
          for (let i = 0; i < 4 && inDungeon(); i++) {
            await bot.walkTo(2572, 9631, 1);
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && l.x === 2572);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            await waitCond(() => !inDungeon(), 4000, 250);
          }
        }
        if (!(await climbTower(1))) return false;
        await bot.walkTo(2569, 3241, 1);
        const bc = sdk.findInventoryItem(/^blue cog$/i);
        const pole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 32);
        if (bc && pole) {
          await sdk.sendUseItemOnLoc(bc.slot, pole.x, pole.z, pole.id);
          await waitCond(() => !has(sdk, /^blue cog$/i), 5000, 250);
        }
        bluePlaced = !has(sdk, /^blue cog$/i);
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

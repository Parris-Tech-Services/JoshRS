import {
  Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, combineItems
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Plague City';

// Plague City (quest_elena) — 1 QP, +60,625 Mining XP (at 25x), Ardougne teleport scroll
export const elena: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const startXp = xp(sdk, 'Mining');

    const gatherAndStart = () => step(c, N, 'gather-and-start', async () => {
      if (xp(sdk, 'Mining') > startXp + 1000) return true;

      // If east of White Wolf Mountain or need Snape grass (231), pick it up at Hobgoblin Peninsula (2906, 3297)
      if (!has(sdk, /^snape grass|hangover cure$/i)) {
        const p = sdk.getState()?.player;
        if (p && p.worldX < 2850) {
          await bot.walkTo(2660, 3365, 3);
          await bot.walkTo(2725, 3485, 3);
          await bot.walkTo(2815, 3440, 3);
          if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await bot.activatePrayer('protect_from_melee');
          }
          await bot.walkTo(2848, 3496, 3);
          await bot.walkTo(2865, 3435, 3);
          await bot.deactivateAllPrayers();
        }
        await bot.walkTo(2906, 3340, 3);
        await pickupWithWait(c, 2906, 3297, /^snape grass$/i, 20);
      }

      await walkToKandarin(c, 2615, 3293);

      // Buy Rope (954) and 4 Buckets (1925) at Ardougne General Store (2615, 3293)
      if (!has(sdk, /^rope$/i) || count(sdk, /^bucket$/i) + count(sdk, /^bucket of water$/i) < 4) {
        const w = await bot.walkTo(2615, 3293, 2);
        if (!w?.success) { await openNearbyDoors(c, 2615, 3293, 3); await bot.walkTo(2615, 3293, 2); }
        const o = await bot.openShop(/^aemad|kortan$/i);
        if (o?.success) {
          if (!has(sdk, /^rope$/i)) await bot.buyFromShop(/^rope$/i, 1);
          const needBuckets = Math.max(0, 4 - count(sdk, /^bucket$/i) - count(sdk, /^bucket of water$/i));
          if (needBuckets > 0) await bot.buyFromShop(/^bucket$/i, needBuckets);
          await bot.closeShop();
        }
      }

      // Buy Chocolate dust (1975), Bucket of milk (1927), Dwellberries (2126) from Hudo at Grand Tree Groceries (2449, 3495, L1)
      if (!has(sdk, /^hangover cure$/i) || (!has(sdk, /^dwellberries$/i) && !has(sdk, /^gas mask$/i))) {
        await bot.walkTo(2530, 3365, 3);
        await bot.walkTo(2461, 3381, 2);
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name));
        if (gate && (sdk.getState()?.player?.worldZ ?? 0) < 3383) {
          await bot.interactLoc(gate, 'Open');
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3383, 6000, 300);
        }
        await bot.walkTo(2465, 3440, 3);
        const wt = await bot.walkTo(2466, 3494, 2);
        if (!wt?.success) { await openNearbyDoors(c, 2465, 3491, 3); await bot.walkTo(2466, 3494, 2); }
        await bot.interactLoc(/^ladder$/i, 'Climb-up');
        await waitCond(() => lvl(sdk) === 1, 5000, 300);
        await bot.walkTo(2449, 3495, 2);
        const o = await bot.openShop(/^hudo$/i);
        if (o?.success) {
          if (!has(sdk, /^chocolate dust|chocolaty milk|hangover cure$/i)) await bot.buyFromShop(/^chocolate dust$/i, 1);
          if (!has(sdk, /^bucket of milk|chocolaty milk|hangover cure$/i)) await bot.buyFromShop(/^bucket of milk$/i, 1);
          if (!has(sdk, /^dwellberries|gas mask$/i)) await bot.buyFromShop(/^dwellberries$/i, 1);
          await bot.closeShop();
        }
        await bot.walkTo(2466, 3495, 2);
        await bot.interactLoc(/^ladder$/i, 'Climb-down');
        await waitCond(() => lvl(sdk) === 0, 5000, 300);
        await bot.walkTo(2465, 3440, 3);
        await bot.walkTo(2461, 3386, 2);
        const gateOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name));
        if (gateOut && (sdk.getState()?.player?.worldZ ?? 0) >= 3383) {
          await bot.interactLoc(gateOut, 'Open');
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) < 3383, 6000, 300);
        }
      }

      if (has(sdk, /^chocolate dust$/i) && has(sdk, /^bucket of milk$/i)) {
        await combineItems(c, /^chocolate dust$/i, /^bucket of milk$/i, /^chocolaty milk$/i);
      }
      if (has(sdk, /^chocolaty milk$/i) && has(sdk, /^snape grass$/i)) {
        await combineItems(c, /^snape grass$/i, /^chocolaty milk$/i, /^hangover cure$/i);
      }

      // Walk to Edmond (2568, 3334) and fill 4 Buckets of water at the sink
      await bot.walkTo(2568, 3334, 2);
      while (has(sdk, /^bucket$/i) && count(sdk, /^bucket of water$/i) < 4) {
        const before = count(sdk, /^bucket of water$/i);
        await bot.useItemOnLoc(/^bucket$/i, /^sink$/i);
        if (!(await waitCond(() => count(sdk, /^bucket of water$/i) > before, 4000, 300))) break;
      }

      await talk(c, /^edmond$/i, [/what's happened to her/i, /^yes\.$/i]);

      if (!has(sdk, /^gas mask$/i)) {
        const wa = await bot.walkTo(2573, 3333, 2);
        if (!wa?.success) { await openNearbyDoors(c, 2573, 3331, 3); await bot.walkTo(2573, 3333, 2); }
        await talk(c, /^alrena$/i);
        await waitInv(sdk, /^gas mask$/i, 4000);
      }

      if (!has(sdk, /^picture$/i)) {
        await openNearbyDoors(c, 2573, 3331, 3);
        await pickupWithWait(c, 2576, 3334, /^picture$/i, 10);
      }
      if (!has(sdk, /^spade$/i)) {
        await pickupWithWait(c, 2574, 3331, /^spade$/i, 10);
      }

      await bot.walkTo(2568, 3334, 2);
      await talk(c, /^edmond$/i);
      return has(sdk, /^gas mask$/i) && has(sdk, /^spade$/i);
    });

    const enterWestArdougne = () => step(c, N, 'enter-west-ardougne', async () => {
      if (xp(sdk, 'Mining') > startXp + 1000) return true;
      const p0 = sdk.getState()?.player;
      if (p0 && p0.worldX < 2558 && p0.worldZ < 4000) return true;

      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        await bot.walkTo(2566, 3333, 1);
        for (let i = 0; i < 4 && has(sdk, /^bucket of water$/i); i++) {
          const mud = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2531 || l.id === 2532);
          if (!mud) break;
          const b = count(sdk, /^bucket of water$/i);
          await bot.useItemOnLoc(/^bucket of water$/i, /^mud patch$/i);
          await waitCond(() => count(sdk, /^bucket of water$/i) < b, 4000, 300);
        }
        await bot.useItemOnLoc(/^spade$/i, /^mud patch$/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 8000, 300);
      }

      if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
        await bot.walkTo(2514, 9763, 2);
        const pipe = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2541);
        if (pipe) {
          await sdk.sendInteractLoc(pipe.x, pipe.z, pipe.id, 1);
          await sleep(1500);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await bot.walkTo(2517, 9758, 3);
        await talk(c, /^edmond$/i);
        if (has(sdk, /^rope$/i)) {
          await bot.walkTo(2514, 9763, 2);
          await bot.useItemOnLoc(/^rope$/i, /^pipe$/i);
          await sleep(2000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await bot.walkTo(2517, 9758, 3);
        await talk(c, /^edmond$/i);
        if (has(sdk, /^gas mask$/i)) {
          await bot.equipItem(/^gas mask$/i);
          await sleep(500);
        }
        await bot.walkTo(2514, 9763, 2);
        const pipe2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2541);
        if (pipe2) {
          await sdk.sendInteractLoc(pipe2.x, pipe2.z, pipe2.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 4000, 8000, 300);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
      }

      return (sdk.getState()?.player?.worldZ ?? 9999) < 4000 && (sdk.getState()?.player?.worldX ?? 3000) < 2558;
    });

    const rescueElena = () => step(c, N, 'rescue-elena', async () => {
      if (xp(sdk, 'Mining') > startXp + 1000) return true;

      // 1. Talk to Jethick (2540, 3305)
      if (!has(sdk, /^book$/i) && !has(sdk, /^warrant$/i) && !has(sdk, /^a small key$/i)) {
        await bot.walkTo(2539, 3305, 2);
        await talk(c, /^jethick$/i, [/yes, i'll return it for you/i, /looking for a woman/i]);
      }

      // 2. Rehnison house door (2537) at (2531, 3328)
      if (has(sdk, /^book$/i)) {
        await bot.walkTo(2531, 3327, 1);
        const rDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2537);
        if (rDoor) {
          await sdk.sendInteractLoc(rDoor.x, rDoor.z, rDoor.id, 1);
          await sleep(2000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await talk(c, /^martha rehnison|ted rehnison$/i);
        await bot.walkTo(2528, 3331, 2);
        const up = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2539);
        if (up) {
          await sdk.sendInteractLoc(up.x, up.z, up.id, 1);
          await waitCond(() => lvl(sdk) === 1, 5000, 300);
        }
        await talk(c, /^milli$/i);
        const down = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2540);
        if (down) {
          await sdk.sendInteractLoc(down.x, down.z, down.id, 1);
          await waitCond(() => lvl(sdk) === 0, 5000, 300);
        }
        const rDoorOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2537);
        if (rDoorOut && (sdk.getState()?.player?.worldZ ?? 0) >= 3329) {
          await sdk.sendInteractLoc(rDoorOut.x, rDoorOut.z, rDoorOut.id, 1);
          await sleep(1500);
        }
      }

      // 3. Try Plague house door (2535) at (2533, 3272)
      if (!has(sdk, /^warrant$/i) && !has(sdk, /^a small key$/i)) {
        await bot.walkTo(2533, 3273, 1);
        const pDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2535 && l.x === 2533 && l.z === 3272);
        if (pDoor) {
          await sdk.sendInteractLoc(pDoor.x, pDoor.z, pDoor.id, 1);
          await sleep(1500);
          if (sdk.getState()?.dialog?.isOpen) await chat(c, [/kidnap victim/i, /check anyway/i]);
        }

        // 4. Civic Office — Clerk (2528, 3317) & Bravek (2536, 3314)
        const wc = await bot.walkTo(2528, 3317, 2);
        if (!wc?.success) { await openNearbyDoors(c, 2524, 3316, 3); await bot.walkTo(2528, 3317, 2); }
        await talk(c, /^clerk$/i, [/need permission to enter a plague house/i, /who is through that door/i, /urgent though/i]);

        await bot.walkTo(2530, 3314, 1);
        const bDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2528);
        if (bDoor) {
          await sdk.sendInteractLoc(bDoor.x, bDoor.z, bDoor.id, 1);
          await sleep(1500);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await bot.walkTo(2535, 3314, 2);
        await talk(c, /^bravek$/i, [/really important though/i, /what is in the cure/i]);
        await talk(c, /^bravek$/i, [/they won't listen to me/i]);
        await sleep(2500);
        if (!has(sdk, /^warrant$/i)) {
          await talk(c, /^bravek$/i, [/really important though/i, /they won't listen to me/i]);
        }
        if ((sdk.getState()?.player?.worldX ?? 0) >= 2531) {
          const bDoorOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2528);
          if (bDoorOut) {
            await sdk.sendInteractLoc(bDoorOut.x, bDoorOut.z, bDoorOut.id, 1);
            await sleep(1500);
          }
        }
      }

      // 5. Enter Plague house at (2533, 3272) with Warrant
      await openNearbyDoors(c, 2524, 3316, 3);
      await bot.walkTo(2533, 3273, 1);
      const pDoor2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2535 && l.x === 2533 && l.z === 3272);
      if (pDoor2 && (sdk.getState()?.player?.worldZ ?? 3273) >= 3272) {
        await sdk.sendInteractLoc(pDoor2.x, pDoor2.z, pDoor2.id, 1);
        await sleep(3000);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }

      if (!has(sdk, /^a small key$/i)) {
        await bot.walkTo(2534, 3269, 1);
        const barrel = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2530);
        if (barrel) {
          await sdk.sendInteractLoc(barrel.x, barrel.z, barrel.id, 1);
          await waitInv(sdk, /^a small key$/i, 4000);
        }
      }

      await bot.walkTo(2536, 3269, 1);
      const sStairs = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2522);
      if (sStairs) {
        await sdk.sendInteractLoc(sStairs.x, sStairs.z, sStairs.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 6000, 300);
      }

      await bot.walkTo(2539, 9672, 1);
      const cellGate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2526);
      if (cellGate) {
        await sdk.sendInteractLoc(cellGate.x, cellGate.z, cellGate.id, 1);
        await sleep(1500);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }
      await talk(c, /^elena$/i);

      // Exit basement & plague house
      await bot.walkTo(2538, 9671, 2);
      const upSpooky = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2523);
      if (upSpooky) {
        await sdk.sendInteractLoc(upSpooky.x, upSpooky.z, upSpooky.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 4000, 6000, 300);
      }
      await bot.walkTo(2533, 3271, 1);
      const pDoorOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2535);
      if (pDoorOut && (sdk.getState()?.player?.worldZ ?? 0) < 3272) {
        await sdk.sendInteractLoc(pDoorOut.x, pDoorOut.z, pDoorOut.id, 1);
        await sleep(2000);
      }

      // Exit West Ardougne via Manhole (2542) at (2529, 3303)
      await bot.walkTo(2529, 3303, 1);
      const manhole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2542);
      if (manhole) {
        await sdk.sendInteractLoc(manhole.x, manhole.z, manhole.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 6000, 300);
      }
      await bot.walkTo(2565, 9733, 2);
      const mudPile = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2533);
      if (mudPile) {
        await sdk.sendInteractLoc(mudPile.x, mudPile.z, mudPile.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 4000, 6000, 300);
      }

      await bot.walkTo(2568, 3334, 2);
      await talk(c, /^edmond$/i);
      const done = await waitCond(() => xp(sdk, 'Mining') > startXp + 1000, 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return (await gatherAndStart()) && (await enterWestArdougne()) && (await rescueElena());
  },
};

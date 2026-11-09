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

      // Drop leftover quest items from completed quests to ensure plenty of inventory space
      for (const dropRe of [/^mark of hazeel$/i, /^child's blanket$/i, /^feed$/i, /^key$/i]) {
        for (const it of (sdk.getInventory() ?? []).filter((i: any) => dropRe.test(i.name))) {
          await sdk.sendDropItem(it.slot);
          await sleep(300);
        }
      }

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

      // Buy Rope (954) and Bucket (1925) at Ardougne General Store (2615, 3293) if needed
      if (!has(sdk, /^rope$/i) || (count(sdk, /^bucket$/i) + count(sdk, /^bucket of water$/i) < 1)) {
        await walkToKandarin(c, 2615, 3293);
        const w = await bot.walkTo(2615, 3293, 2);
        if (!w?.success) { await openNearbyDoors(c, 2615, 3293, 3); await bot.walkTo(2615, 3293, 2); }
        const o = await bot.openShop(/^aemad|kortan$/i);
        if (o?.success) {
          if (!has(sdk, /^rope$/i)) await bot.buyFromShop(/^rope$/i, 1);
          if (count(sdk, /^bucket$/i) + count(sdk, /^bucket of water$/i) < 1) await bot.buyFromShop(/^bucket$/i, 1);
          await bot.closeShop();
        }
      }

      // Buy Chocolate dust (1975), Bucket of milk (1927), Dwellberries (2126) from Hudo at Grand Tree Groceries (2448, 3509, L1)
      if (!has(sdk, /^hangover cure$/i) || (!has(sdk, /^dwellberries$/i) && !has(sdk, /^gas mask$/i))) {
        const pCur = sdk.getState()?.player;
        if (lvl(sdk) === 0 && pCur && pCur.worldZ <= 3383) {
          if (pCur.worldX > 2505) {
            await bot.walkTo(2558, 3337, 3);
            await bot.walkTo(2500, 3340, 3);
          }
          await bot.walkTo(2461, 3382, 1);
          for (let gTry = 0; gTry < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 3383; gTry++) {
            const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 190 || (/^gate$/i.test(l.name) && Math.hypot(l.x - 2459, l.z - 3383) <= 4));
            if (gate) {
              await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
              if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldZ ?? 0) >= 3384, 5000, 250)) {
                if (sdk.getState()?.dialog?.isOpen) {
                  await chat(c, [/sorry, i'm a bit busy/i]);
                }
              }
              await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3384, 4000, 250);
            }
          }
        }
        if (lvl(sdk) === 0 && (sdk.getState()?.player?.worldZ ?? 0) < 3493) {
          await bot.walkTo(2465, 3440, 3);
          await bot.walkTo(2465, 3491, 1);
          for (let dTry = 0; dTry < 3 && (sdk.getState()?.player?.worldZ ?? 0) < 3493; dTry++) {
            const td = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /tree door/i.test(l.name));
            if (td) {
              await sdk.sendInteractLoc(td.x, td.z, td.id, 1);
              await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3493, 4000, 250);
            }
          }
        }
        if (lvl(sdk) === 0) {
          await bot.walkTo(2466, 3495, 1);
          await bot.interactLoc(/^ladder$/i, 'Climb-up');
          await waitCond(() => lvl(sdk) === 1, 5000, 300);
        }
        await bot.walkTo(2448, 3509, 2);
        const o = await bot.openShop(/^hudo$/i);
        if (o?.success) {
          if (!has(sdk, /^chocolate dust|chocolaty milk|hangover cure$/i)) await bot.buyFromShop(/^chocolate dust$/i, 1);
          if (!has(sdk, /^bucket of milk|chocolaty milk|hangover cure$/i)) await bot.buyFromShop(/^bucket of milk$/i, 1);
          if (!has(sdk, /^dwellberries|gas mask$/i)) await bot.buyFromShop(/^dwellberries$/i, 1);
          await bot.closeShop();
        }
        await bot.walkTo(2466, 3495, 1);
        await bot.interactLoc(/^ladder$/i, 'Climb-down');
        await waitCond(() => lvl(sdk) === 0, 5000, 300);
      }

      // If currently inside Grand Tree or Tree Gnome Stronghold, exit back to East Ardougne
      if (lvl(sdk) === 1 && (sdk.getState()?.player?.worldX ?? 3000) < 2505) {
        await bot.walkTo(2466, 3495, 1);
        await bot.interactLoc(/^ladder$/i, 'Climb-down');
        await waitCond(() => lvl(sdk) === 0, 5000, 300);
      }
      if (lvl(sdk) === 0 && (sdk.getState()?.player?.worldX ?? 3000) < 2505 && (sdk.getState()?.player?.worldZ ?? 0) >= 3384) {
        if ((sdk.getState()?.player?.worldZ ?? 0) >= 3492 && (sdk.getState()?.player?.worldX ?? 0) >= 2461 && (sdk.getState()?.player?.worldX ?? 0) <= 2470) {
          await bot.walkTo(2465, 3493, 1);
          for (let dTry = 0; dTry < 3 && (sdk.getState()?.player?.worldZ ?? 3493) >= 3492; dTry++) {
            const td = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /tree door/i.test(l.name));
            if (td) {
              await sdk.sendInteractLoc(td.x, td.z, td.id, 1);
              await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3493) <= 3491, 4000, 250);
            }
          }
        }
        await bot.walkTo(2465, 3440, 3);
        await bot.walkTo(2461, 3385, 1);
        for (let gTry = 0; gTry < 3 && (sdk.getState()?.player?.worldZ ?? 3385) >= 3384; gTry++) {
          const gateOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 190 || (/^gate$/i.test(l.name) && Math.hypot(l.x - 2459, l.z - 3383) <= 4));
          if (gateOut) {
            await sdk.sendInteractLoc(gateOut.x, gateOut.z, gateOut.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3385) <= 3382, 5000, 250);
          }
        }
        await bot.walkTo(2500, 3340, 3);
        await bot.walkTo(2558, 3337, 3);
      }

      if (has(sdk, /^chocolate dust$/i) && has(sdk, /^bucket of milk$/i)) {
        await combineItems(c, /^chocolate dust$/i, /^bucket of milk$/i, /^chocolaty milk$/i);
      }
      if (has(sdk, /^chocolaty milk$/i) && has(sdk, /^snape grass$/i)) {
        await combineItems(c, /^snape grass$/i, /^chocolaty milk$/i, /^hangover cure$/i);
      }

      // Walk to Edmond (2568, 3334)
      if (!has(sdk, /^gas mask$/i) && ! (sdk.getState()?.equipment ?? []).some((e: any) => /gas mask/i.test(e.name))) {
        await bot.walkTo(2568, 3334, 2);
        await talk(c, /^edmond$/i, [/what's happened to her/i, /can i help find her/i]);

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
      return (has(sdk, /^gas mask$/i) || (sdk.getState()?.equipment ?? []).some((e: any) => /gas mask/i.test(e.name))) && has(sdk, /^spade$/i);
    });

    const enterWestArdougne = () => step(c, N, 'enter-west-ardougne', async () => {
      if (xp(sdk, 'Mining') > startXp + 1000) return true;
      const p0 = sdk.getState()?.player;
      if (p0 && p0.worldX < 2558 && p0.worldZ < 4000) return true;

      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        for (let i = 0; i < 4; i++) {
          if (!has(sdk, /^bucket of water$/i) && has(sdk, /^bucket$/i)) {
            await bot.walkTo(2602, 3336, 3);
            await bot.walkTo(2609, 3324, 1);
            await openNearbyDoors(c, 2610, 3324, 2);
            await bot.walkTo(2616, 3325, 1);
            await bot.useItemOnLoc(/^bucket$/i, /^sink$/i);
            await waitInv(sdk, /^bucket of water$/i, 4000);
          }
          if (!has(sdk, /^bucket of water$/i)) break;
          if ((sdk.getState()?.player?.worldX ?? 0) > 2600) {
            await openNearbyDoors(c, 2610, 3324, 2);
            await bot.walkTo(2602, 3336, 3);
          }
          await bot.walkTo(2566, 3333, 1);
          const beforeTick = sdk.getState()?.tick ?? 0;
          await bot.useItemOnLoc(/^bucket of water$/i, /^mud patch$/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 200)) {
            await chat(c);
          }
          const recText = (sdk.getState()?.recentDialogs ?? [])
            .filter((d: any) => (d.tick ?? 0) >= beforeTick)
            .flatMap((d: any) => d.text ?? d.lines ?? [])
            .join(' ');
          if (/soft enough/i.test(recText)) break;
        }
        await bot.walkTo(2566, 3333, 1);
        await bot.useItemOnLoc(/^spade$/i, /^mud patch$/i);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250)) {
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 6000, 250);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
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
        const wc = await bot.walkTo(2530, 3315, 1);
        if (!wc?.success) { await openNearbyDoors(c, 2524, 3316, 3); await bot.walkTo(2530, 3315, 1); }
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
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
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

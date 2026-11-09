import {
  Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, combineItems
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Murder Mystery';

interface SuspectInfo {
  name: string;
  npcRe: RegExp;
  npcCoord: [number, number, number]; // x, z, level
  barrelId: number;
  barrelCoord: [number, number, number];
  silverRe: RegExp;
  dustedRe: RegExp;
  printRe: RegExp;
  poisonLocId: number;
  poisonLocCoord: [number, number, number];
}

const SUSPECTS: Record<string, SuspectInfo> = {
  Anna: {
    name: 'Anna',
    npcRe: /^anna$/i,
    npcCoord: [2734, 3575, 0],
    barrelId: 2656,
    barrelCoord: [2733, 3575, 0],
    silverRe: /^silver necklace$/i,
    dustedRe: /^silver necklace$/i,
    printRe: /^annas?'s? print$/i,
    poisonLocId: 2650,
    poisonLocCoord: [2730, 3574, 0],
  },
  Bob: {
    name: 'Bob',
    npcRe: /^bob$/i,
    npcCoord: [2748, 3559, 0],
    barrelId: 2657,
    barrelCoord: [2733, 3578, 0],
    silverRe: /^silver cup$/i,
    dustedRe: /^silver cup$/i,
    printRe: /^bobs?'s? print$/i,
    poisonLocId: 2651,
    poisonLocCoord: [2731, 3560, 0],
  },
  Carol: {
    name: 'Carol',
    npcRe: /^carol$/i,
    npcCoord: [2734, 3581, 1],
    barrelId: 2658,
    barrelCoord: [2733, 3581, 1],
    silverRe: /^silver bottle$/i,
    dustedRe: /^silver bottle$/i,
    printRe: /^carols?'s? print$/i,
    poisonLocId: 2652,
    poisonLocCoord: [2737, 3573, 0],
  },
  David: {
    name: 'David',
    npcRe: /^david$/i,
    npcCoord: [2739, 3581, 0],
    barrelId: 2659,
    barrelCoord: [2733, 3578, 1],
    silverRe: /^silver book$/i,
    dustedRe: /^silver book$/i,
    printRe: /^davids?'s? print$/i,
    poisonLocId: 2653,
    poisonLocCoord: [2740, 3575, 1],
  },
  Elizabeth: {
    name: 'Elizabeth',
    npcRe: /^elizabeth$/i,
    npcCoord: [2746, 3581, 1],
    barrelId: 2660,
    barrelCoord: [2747, 3581, 1],
    silverRe: /^silver needle$/i,
    dustedRe: /^silver needle$/i,
    printRe: /^elizabeths?'s? print$/i,
    poisonLocId: 2654,
    poisonLocCoord: [2746, 3563, 0],
  },
  Frank: {
    name: 'Frank',
    npcRe: /^frank$/i,
    npcCoord: [2742, 3577, 0],
    barrelId: 2661,
    barrelCoord: [2747, 3577, 1],
    silverRe: /^silver pot$/i,
    dustedRe: /^silver pot$/i,
    printRe: /^franks?'s? print$/i,
    poisonLocId: 2655,
    poisonLocCoord: [2746, 3572, 0],
  },
};

export const murder: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const startXp = xp(sdk, 'Crafting');

    const ensureMansionLevel = async (targetLevel: number) => {
      if (lvl(sdk) === targetLevel) return true;
      if (targetLevel === 1) {
        const w = await bot.walkTo(2737, 3581, 1);
        if (!w?.success) {
          await openNearbyDoors(c, 2740, 3572, 4);
          await openNearbyDoors(c, 2738, 3578, 4);
          await bot.walkTo(2737, 3581, 1);
        }
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 || /ladder|stair/i.test(l.name));
        if (st) {
          await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
          await waitCond(() => lvl(sdk) === 1, 5000, 300);
        }
      } else {
        for (let attempt = 0; attempt < 3 && lvl(sdk) === 1; attempt++) {
          const p = sdk.getState()?.player;
          if (p && p.worldX >= 2743) {
            await sdk.sendWalk(2744, 3577, true);
            await sleep(1200);
            await openNearbyDoors(c, 2744, 3577, 2);
            await sdk.sendWalk(2740, 3576, true);
            await sleep(2500);
          }
          const p2 = sdk.getState()?.player;
          if (p2 && p2.worldX >= 2738) {
            await sdk.sendWalk(2736, 3576, true);
            await sleep(2000);
          }
          await openNearbyDoors(c, 2736, 3577, 2);
          await sdk.sendWalk(2737, 3581, true);
          await sleep(2000);
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746 || /ladder|stair/i.test(l.name));
          if (st) {
            await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
            if (await waitCond(() => lvl(sdk) === 0, 5000, 300)) break;
          }
        }
      }
      return lvl(sdk) === targetLevel;
    };

    const walkMansionLevel1 = async (tx: number, tz: number) => {
      await ensureMansionLevel(1);
      const p = sdk.getState()?.player;
      if (tx <= 2736) {
        if (p && p.worldX >= 2743) {
          await openNearbyDoors(c, 2744, 3577, 2);
          await sdk.sendWalk(2740, 3576, true);
          await sleep(2500);
        }
        if ((sdk.getState()?.player?.worldX ?? 2736) >= 2738) {
          await sdk.sendWalk(2736, 3576, true);
          await sleep(2000);
        }
        await openNearbyDoors(c, 2736, 3577, 2);
        await sdk.sendWalk(2736, tz, true);
        await sleep(2000);
        await openNearbyDoors(c, 2736, tz, 2);
        await sdk.sendWalk(tx, tz, true);
        await sleep(1500);
      } else if (tx >= 2744) {
        if (p && p.worldX <= 2737) {
          await openNearbyDoors(c, 2736, 3577, 2);
          await sdk.sendWalk(2740, 3576, true);
          await sleep(2500);
        }
        await sdk.sendWalk(2744, 3576, true);
        await sleep(2000);
        await openNearbyDoors(c, 2744, 3577, 2);
        await sdk.sendWalk(2744, tz, true);
        await sleep(2000);
        await openNearbyDoors(c, 2745, tz, 2);
        await sdk.sendWalk(tx, tz, true);
        await sleep(1500);
      } else {
        if (p && p.worldX <= 2737) {
          await openNearbyDoors(c, 2736, 3577, 2);
        } else if (p && p.worldX >= 2743) {
          await openNearbyDoors(c, 2744, 3577, 2);
        }
        await sdk.sendWalk(tx, tz, true);
        await sleep(2500);
      }
    };

    const fillPotOfFlour = async () => {
      if (has(sdk, /^pot of flour$/i)) return true;
      await ensureMansionLevel(0);
      const w = await bot.walkTo(2735, 3581, 2);
      if (!w?.success) { await openNearbyDoors(c, 2736, 3577, 4); await bot.walkTo(2735, 3581, 2); }
      const barrel = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2662);
      if (barrel) {
        await sdk.sendInteractLoc(barrel.x, barrel.z, barrel.id, 2);
        await waitInv(sdk, /^pot of flour$/i, 4000);
      }
      return has(sdk, /^pot of flour$/i);
    };

    const solve = () => step(c, N, 'solve-murder', async () => {
      if (xp(sdk, 'Crafting') > startXp + 1000) return true;

      // If in Ardougne Sewer (from Plague City), climb up Mud pile at (2561, 9736)
      if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
        await bot.walkTo(2561, 9736, 2);
        const mudPile = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2533 || /mud pile/i.test(l.name));
        if (mudPile) {
          await sdk.sendInteractLoc(mudPile.x, mudPile.z, mudPile.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 4000, 6000, 300);
        }
      }

      // Ensure we are on ground floor before starting or walking outside Sinclair Mansion
      await ensureMansionLevel(0);

      // Ensure we have an empty Pot (1931) — buy from Arhein at Catherby (2803, 3430) or Ardougne General Store (2615, 3293)
      if (!has(sdk, /^pot|pot of flour$/i)) {
        await walkToKandarin(c, 2803, 3430);
        const w = await bot.walkTo(2803, 3430, 2);
        if (!w?.success) { await openNearbyDoors(c, 2803, 3430, 3); await bot.walkTo(2803, 3430, 2); }
        const o = await bot.openShop(/^arhein|aemad|kortan|shopkeeper|shop assistant$/i);
        if (o?.success) {
          await bot.buyFromShop(/^pot$/i, 1);
          await bot.closeShop();
        }
      }

      if (!has(sdk, /^killers?'s? print$/i) || !has(sdk, /^criminals?'s? thread$/i) || !has(sdk, /^pungent pot$/i)) {
        // Walk to Guard outside Sinclair Mansion (2741, 3561) and start quest
        await ensureMansionLevel(0);
        await walkToKandarin(c, 2741, 3561);
        await talk(c, /^guard$/i, [/sure, i'll help/i]);

        // Enter crime scene room at (2747, 3579): pick up Criminal's dagger (1813), Pungent pot (1812), and search Window (2666)
        const wc = await bot.walkTo(2747, 3579, 1);
        if (!wc?.success) {
          await openNearbyDoors(c, 2740, 3572, 4);
          await openNearbyDoors(c, 2745, 3577, 4);
          await bot.walkTo(2747, 3579, 1);
        }
        if (!has(sdk, /^criminals?'s? dagger$/i)) {
          await pickupWithWait(c, 2746, 3578, /^criminals?'s? dagger$/i, 10);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        if (!has(sdk, /^pungent pot$/i)) {
          await pickupWithWait(c, 2747, 3579, /^pungent pot$/i, 10);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }

        const win = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2666);
        if (win) {
          await sdk.sendInteractLoc(win.x, win.z, win.id, 2);
          await sleep(2000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
      }

      // Determine candidate pair from thread colour (1808=red -> Bob/Carol, 1809=green -> Anna/David, 1810=blue -> Elizabeth/Frank)
      const inv = sdk.getInventory() ?? [];
      let pair: [SuspectInfo, SuspectInfo] = [SUSPECTS.Anna, SUSPECTS.David];
      if (inv.some((i: any) => i.id === 1808)) {
        pair = [SUSPECTS.Bob, SUSPECTS.Carol];
      } else if (inv.some((i: any) => i.id === 1810)) {
        pair = [SUSPECTS.Elizabeth, SUSPECTS.Frank];
      }

      if (!has(sdk, /^killers?'s? print$/i)) {
        // Take 4 Flypapers (1811) from Sacks (2663) at (2731, 3581)
        await openNearbyDoors(c, 2745, 3577, 4);
        const ws = await bot.walkTo(2731, 3581, 2);
        if (!ws?.success) { await openNearbyDoors(c, 2733, 3580, 4); await bot.walkTo(2731, 3581, 2); }
        while (count(sdk, /^flypaper$/i) < 4) {
          const sack = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2663);
          if (!sack) break;
          const b = count(sdk, /^flypaper$/i);
          await sdk.sendInteractLoc(sack.x, sack.z, sack.id, 2);
          await sleep(1200);
          if (sdk.getState()?.dialog?.isOpen) await chat(c, [/yes, it might be useful/i]);
          if (!(await waitCond(() => count(sdk, /^flypaper$/i) > b, 3000, 300))) break;
        }
      }

      // Dust Criminal's dagger and get Unknown print (1822)
      if (!has(sdk, /^unknown print|killers?'s? print$/i)) {
        await fillPotOfFlour();
        await bot.useItemOnItem(/^pot of flour$/i, /^criminals?'s? dagger$/i);
        await sleep(1000);
        await bot.useItemOnItem(/^flypaper$/i, /^criminals?'s? dagger$/i);
        await waitInv(sdk, /^unknown print$/i, 4000);
      }

      // Check both suspects in `pair` to see whose print matches Unknown print -> becomes Killers' print (1815)
      let culprits: SuspectInfo[] = [...pair];
      if (has(sdk, /^killers?'s? print$/i)) {
        const matched = pair.find(s => has(sdk, s.printRe) || has(sdk, s.silverRe));
        if (matched) culprits = [matched];
      }
      for (const s of pair) {
        if (has(sdk, /^killers?'s? print$/i)) break;
        if (!has(sdk, s.printRe)) {
          if (!has(sdk, s.silverRe)) {
            if (s.barrelCoord[2] === 1) {
              await walkMansionLevel1(s.barrelCoord[0], s.barrelCoord[1]);
            } else {
              await ensureMansionLevel(0);
              await bot.walkTo(s.barrelCoord[0], s.barrelCoord[1], 1);
            }
            const bLoc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === s.barrelId);
            if (bLoc) {
              await sdk.sendInteractLoc(bLoc.x, bLoc.z, bLoc.id, 2);
              await sleep(1500);
              if (sdk.getState()?.dialog?.isOpen) await chat(c);
            }
          }
          await fillPotOfFlour();
          const dustItem = sdk.findInventoryItem(s.silverRe);
          const flourItem = sdk.findInventoryItem(/^pot of flour$/i);
          if (dustItem && flourItem) {
            await sdk.sendUseItemOnItem(dustItem.slot, flourItem.slot);
            await sleep(1200);
          }
          const dustedItem = sdk.findInventoryItem(s.dustedRe);
          const paperItem = sdk.findInventoryItem(/^flypaper$/i);
          if (dustedItem && paperItem) {
            await sdk.sendUseItemOnItem(dustedItem.slot, paperItem.slot);
            await waitInv(sdk, s.printRe, 4000);
          }
        }
        const unknownPrint = sdk.findInventoryItem(/^unknown print$/i);
        const suspectPrint = sdk.findInventoryItem(s.printRe);
        if (unknownPrint && suspectPrint) {
          await sdk.sendUseItemOnItem(unknownPrint.slot, suspectPrint.slot);
          await sleep(1500);
        }
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (has(sdk, /^killers?'s? print$/i)) {
          culprits = [s];
          break;
        }
      }

      // Talk to Poison Salesman (820) at Seers' Village pub (2695, 3495)
      await ensureMansionLevel(0);
      await openNearbyDoors(c, 2740, 3572, 4);
      await walkToKandarin(c, 2695, 3495);
      const wp = await bot.walkTo(2695, 3495, 2);
      if (!wp?.success) { await openNearbyDoors(c, 2695, 3495, 4); await bot.walkTo(2695, 3495, 2); }
      await talk(c, /^poison salesman$/i, [/who did you sell poison to at the house/i]);

      // Return to Sinclair Mansion, talk to candidate culprit(s) about why they bought poison, then search their poisonLocId
      await bot.walkTo(2741, 3556, 3);
      for (const culprit of culprits) {
        if (culprit.npcCoord[2] === 1) {
          await walkMansionLevel1(culprit.npcCoord[0], culprit.npcCoord[1]);
        } else {
          await ensureMansionLevel(0);
          await bot.walkTo(culprit.npcCoord[0], culprit.npcCoord[1], 2);
        }
        await talk(c, culprit.npcRe, [/why'd you buy poison the other day/i]);

        // Search culprit's poison location
        if (culprit.poisonLocCoord[2] === 1) {
          await walkMansionLevel1(culprit.poisonLocCoord[0], culprit.poisonLocCoord[1]);
        } else {
          await ensureMansionLevel(0);
          const wl = await bot.walkTo(culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 2);
          if (!wl?.success) {
            await openNearbyDoors(c, 2740, 3572, 4);
            await openNearbyDoors(c, culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 4);
            await bot.walkTo(culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 2);
          }
        }
        const pLoc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === culprit.poisonLocId);
        if (pLoc) {
          await sdk.sendInteractLoc(pLoc.x, pLoc.z, pLoc.id, 2);
          await sleep(2500);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
      }

      // Report to Guard (812) at (2741, 3561)
      await ensureMansionLevel(0);
      await openNearbyDoors(c, 2740, 3572, 4);
      await bot.walkTo(2741, 3561, 2);
      await talk(c, /^guard$/i, [/i know who did it/i]);
      const done = await waitCond(() => xp(sdk, 'Crafting') > startXp + 1000, 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return await solve();
  },
};

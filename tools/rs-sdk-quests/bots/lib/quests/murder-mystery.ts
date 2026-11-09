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
    silverRe: /^anna's silver necklace$/i,
    dustedRe: /^anna's silver necklace$/i,
    printRe: /^anna's print$/i,
    poisonLocId: 2650,
    poisonLocCoord: [2730, 3572, 0],
  },
  Bob: {
    name: 'Bob',
    npcRe: /^bob$/i,
    npcCoord: [2748, 3559, 0],
    barrelId: 2657,
    barrelCoord: [2733, 3578, 0],
    silverRe: /^bob's silver teacup$/i,
    dustedRe: /^bob's silver teacup$/i,
    printRe: /^bob's print$/i,
    poisonLocId: 2651,
    poisonLocCoord: [2730, 3559, 0],
  },
  Carol: {
    name: 'Carol',
    npcRe: /^carol$/i,
    npcCoord: [2734, 3581, 1],
    barrelId: 2658,
    barrelCoord: [2733, 3581, 1],
    silverRe: /^carol's silver bottle$/i,
    dustedRe: /^carol's silver bottle$/i,
    printRe: /^carol's print$/i,
    poisonLocId: 2652,
    poisonLocCoord: [2736, 3573, 0],
  },
  David: {
    name: 'David',
    npcRe: /^david$/i,
    npcCoord: [2739, 3581, 0],
    barrelId: 2659,
    barrelCoord: [2733, 3578, 1],
    silverRe: /^david's silver book$/i,
    dustedRe: /^david's silver book$/i,
    printRe: /^david's print$/i,
    poisonLocId: 2653,
    poisonLocCoord: [2740, 3574, 1],
  },
  Elizabeth: {
    name: 'Elizabeth',
    npcRe: /^elizabeth$/i,
    npcCoord: [2746, 3581, 1],
    barrelId: 2660,
    barrelCoord: [2747, 3581, 1],
    silverRe: /^elizabeth's silver needle$/i,
    dustedRe: /^elizabeth's silver needle$/i,
    printRe: /^elizabeth's print$/i,
    poisonLocId: 2654,
    poisonLocCoord: [2747, 3563, 0],
  },
  Frank: {
    name: 'Frank',
    npcRe: /^frank$/i,
    npcCoord: [2742, 3577, 0],
    barrelId: 2661,
    barrelCoord: [2747, 3577, 1],
    silverRe: /^frank's silver pot$/i,
    dustedRe: /^frank's silver pot$/i,
    printRe: /^frank's print$/i,
    poisonLocId: 2655,
    poisonLocCoord: [2746, 3573, 0],
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
        const w = await bot.walkTo(2740, 3578, 2);
        if (!w?.success) { await openNearbyDoors(c, 2740, 3575, 4); await bot.walkTo(2740, 3578, 2); }
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 597);
        if (st) {
          await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
          await waitCond(() => lvl(sdk) === 1, 5000, 300);
        }
      } else {
        await bot.walkTo(2740, 3581, 2);
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 598);
        if (st) {
          await sdk.sendInteractLoc(st.x, st.z, st.id, 1);
          await waitCond(() => lvl(sdk) === 0, 5000, 300);
        }
      }
      return lvl(sdk) === targetLevel;
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

      // Ensure we have an empty Pot (1931) — buy from Catherby General Store (2803, 3431) or Ardougne General Store (2615, 3293)
      if (!has(sdk, /^pot|pot of flour$/i)) {
        await walkToKandarin(c, 2803, 3431);
        const w = await bot.walkTo(2803, 3431, 2);
        if (!w?.success) { await openNearbyDoors(c, 2803, 3431, 3); await bot.walkTo(2803, 3431, 2); }
        const o = await bot.openShop(/^shopkeeper|shop assistant$/i);
        if (o?.success) {
          await bot.buyFromShop(/^pot$/i, 1);
          await bot.closeShop();
        }
      }

      // Walk to Guard outside Sinclair Mansion (2741, 3561) and start quest
      await walkToKandarin(c, 2741, 3561);
      await talk(c, /^guard$/i, [/sure, i'll help/i]);

      // Enter crime scene room at (2746, 3578): pick up Criminal's dagger (1813), Pungent pot (1812), and search Window (2666)
      const wc = await bot.walkTo(2746, 3578, 2);
      if (!wc?.success) {
        await openNearbyDoors(c, 2740, 3572, 4);
        await openNearbyDoors(c, 2745, 3577, 4);
        await bot.walkTo(2746, 3578, 2);
      }
      if (!has(sdk, /^criminal's dagger$/i)) {
        await pickupWithWait(c, 2746, 3578, /^criminal's dagger$/i, 10);
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

      // Determine candidate pair from thread colour (1808=blue -> Elizabeth/Frank, 1809=red -> Bob/Carol, 1810=green -> Anna/David)
      const inv = sdk.getInventory() ?? [];
      let pair: [SuspectInfo, SuspectInfo] = [SUSPECTS.Anna, SUSPECTS.David];
      if (inv.some((i: any) => i.id === 1809)) {
        pair = [SUSPECTS.Bob, SUSPECTS.Carol];
      } else if (inv.some((i: any) => i.id === 1808)) {
        pair = [SUSPECTS.Elizabeth, SUSPECTS.Frank];
      }

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

      // Dust Criminal's dagger and get Unknown print (1822)
      if (!has(sdk, /^unknown print|killer's print$/i)) {
        await fillPotOfFlour();
        await bot.useItemOnItem(/^pot of flour$/i, /^criminal's dagger$/i);
        await sleep(1000);
        await bot.useItemOnItem(/^flypaper$/i, /^criminal's dagger$/i);
        await waitInv(sdk, /^unknown print$/i, 4000);
      }

      // Check both suspects in `pair` to see whose print matches Unknown print -> becomes Killer's print (1815)
      let culprit: SuspectInfo = pair[0];
      for (const s of pair) {
        if (has(sdk, /^killer's print$/i)) break;
        await ensureMansionLevel(s.barrelCoord[2]);
        const wb = await bot.walkTo(s.barrelCoord[0], s.barrelCoord[1], 2);
        if (!wb?.success) {
          await openNearbyDoors(c, s.barrelCoord[0], s.barrelCoord[1], 4);
          await bot.walkTo(s.barrelCoord[0], s.barrelCoord[1], 2);
        }
        const bLoc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === s.barrelId);
        if (bLoc) {
          await sdk.sendInteractLoc(bLoc.x, bLoc.z, bLoc.id, 2);
          await sleep(1500);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await fillPotOfFlour();
        await bot.useItemOnItem(/^pot of flour$/i, s.silverRe);
        await sleep(1000);
        await bot.useItemOnItem(/^flypaper$/i, s.dustedRe);
        await waitInv(sdk, s.printRe, 4000);
        await bot.useItemOnItem(s.printRe, /^unknown print$/i);
        await sleep(1500);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (has(sdk, /^killer's print$/i)) {
          culprit = s;
          break;
        }
      }

      // Talk to Poison Salesman (820) at Seers' Village pub (2695, 3495)
      await ensureMansionLevel(0);
      await openNearbyDoors(c, 2740, 3572, 4);
      await bot.walkTo(2740, 3555, 3);
      const wp = await bot.walkTo(2695, 3495, 2);
      if (!wp?.success) { await openNearbyDoors(c, 2695, 3495, 4); await bot.walkTo(2695, 3495, 2); }
      await talk(c, /^poison salesman$/i, [/who did you sell poison to at the house/i]);

      // Return to Sinclair Mansion, talk to `culprit` about why they bought poison, then search their `poisonLocId`
      await bot.walkTo(2740, 3555, 3);
      await ensureMansionLevel(culprit.npcCoord[2]);
      const wn = await bot.walkTo(culprit.npcCoord[0], culprit.npcCoord[1], 2);
      if (!wn?.success) {
        await openNearbyDoors(c, culprit.npcCoord[0], culprit.npcCoord[1], 4);
        await bot.walkTo(culprit.npcCoord[0], culprit.npcCoord[1], 2);
      }
      await talk(c, culprit.npcRe, [/why'd you buy poison the other day/i]);

      // Search culprit's poison location
      await ensureMansionLevel(culprit.poisonLocCoord[2]);
      const wl = await bot.walkTo(culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 2);
      if (!wl?.success) {
        await openNearbyDoors(c, culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 4);
        await bot.walkTo(culprit.poisonLocCoord[0], culprit.poisonLocCoord[1], 2);
      }
      const pLoc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === culprit.poisonLocId);
      if (pLoc) {
        await sdk.sendInteractLoc(pLoc.x, pLoc.z, pLoc.id, 2);
        await sleep(2000);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
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

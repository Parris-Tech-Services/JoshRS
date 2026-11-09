import {
  Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, ensureCoins
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Fishing Contest';

export const fishingcompo: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const startXp = xp(sdk, 'Fishing');

    const startAndPrep = () => step(c, N, 'start-and-prep', async () => {
      if (has(sdk, /^fishing trophy$/i)) return true;

      // 1. Get Fishing pass (id: 27) from Vestri (3679) at (2820, 3487) or Austri (232) at (2877, 3463)
      if (!has(sdk, /^fishing pass$/i)) {
        await walkToKandarin(c, 2820, 3487);
        await bot.walkTo(2820, 3487, 2);
        await talk(c, /^(vestri|austri)$/i, [
          /wondering what was down those stairs/i,
          /why not/i,
          /if you were my friend/i,
          /well, let's be friends/i,
          /how am i meant to do that/i,
          /fortunately i'm alright at fishing/i,
        ]);
      }

      // 2. Buy Small fishing net (303) and Fishing rod (307) from Harry (264) in Catherby (2833, 3443) and train Fishing to 10
      await walkToKandarin(c, 2833, 3443);
      if (count(sdk, /^coins$/i) < 20) {
        await bot.walkTo(2805, 3435, 3);
        await ensureCoins(c, 25);
      }
      const wh = await bot.walkTo(2833, 3443, 2);
      if (!wh?.success) { await openNearbyDoors(c, 2833, 3441, 3); await bot.walkTo(2833, 3443, 2); }
      if (!has(sdk, /^small fishing net$/i) || !has(sdk, /^fishing rod$/i)) {
        const o = await bot.openShop(/^harry$/i);
        if (o?.success) {
          if (!has(sdk, /^small fishing net$/i)) await bot.buyFromShop(/^small fishing net$/i, 1);
          if (!has(sdk, /^fishing rod$/i)) await bot.buyFromShop(/^fishing rod$/i, 1);
          await bot.closeShop();
        }
      }

      // Train Fishing to level 10 on Catherby beach (2836, 3431)
      while ((sdk.getSkill('Fishing')?.baseLevel ?? 1) < 10) {
        await bot.walkTo(2836, 3431, 3);
        const spot = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^fishing spot$/i.test(n.name) && (n.options ?? []).some((o: string) => /^net$/i.test(o)));
        if (spot) {
          await bot.interactNpc(spot, /^net$/i);
          await sleep(4000);
        } else {
          await sleep(1000);
        }
      }

      // 3. Ensure Spade (952) and Garlic (1550)
      if (!has(sdk, /^spade$/i)) {
        // Withdraw Spade from Catherby bank (2809, 3440) or East Ardougne bank (2653, 3283)
        await bot.walkTo(2809, 3440, 2);
        const ob = await bot.openBank();
        if (ob?.success) {
          await bot.withdrawItem(/^spade$/i, 1);
          await bot.withdrawItem(/^garlic$/i, 1);
          await bot.closeBank();
        }
      }

      if (!has(sdk, /^garlic$/i)) {
        // Ground spawn of Garlic (1550) in East Ardougne at (2646, 3299)
        await walkToKandarin(c, 2646, 3299);
        const wg = await bot.walkTo(2646, 3299, 2);
        if (!wg?.success) { await openNearbyDoors(c, 2646, 3299, 4); await bot.walkTo(2646, 3299, 2); }
        await pickupWithWait(c, 2646, 3299, /^garlic$/i, 15);
      }

      if (!has(sdk, /^spade$/i)) {
        // Pick up Spade in East Ardougne (2616, 3323) or Falador if needed
        const ws = await bot.walkTo(2616, 3323, 2);
        if (!ws?.success) { await openNearbyDoors(c, 2616, 3323, 4); await bot.walkTo(2616, 3323, 2); }
        await pickupWithWait(c, 2616, 3323, /^spade$/i, 8);
      }

      // 4. Dig 3 Red vine worms (id: 25) in McGrubor's Wood (squeeze railing 51 at 2662, 3500)
      if (count(sdk, /^red vine worm$/i) < 3) {
        await walkToKandarin(c, 2662, 3500);
        await bot.walkTo(2662, 3500, 1);
        const rail = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 51);
        if (rail) {
          await sdk.sendInteractLoc(rail.x, rail.z, rail.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 2665) <= 2661, 5000, 300);
        }
        await bot.walkTo(2631, 3490, 3);
        for (let i = 0; i < 6 && count(sdk, /^red vine worm$/i) < 3; i++) {
          const vine = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^vine$/i.test(l.name));
          if (vine) {
            const b = count(sdk, /^red vine worm$/i);
            await sdk.sendInteractLoc(vine.x, vine.z, vine.id, 1);
            await waitCond(() => count(sdk, /^red vine worm$/i) > b, 4000, 300);
          }
          await sleep(600);
        }
        await bot.walkTo(2661, 3500, 1);
        const railOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 51);
        if (railOut) {
          await sdk.sendInteractLoc(railOut.x, railOut.z, railOut.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 2660) >= 2662, 5000, 300);
        }
      }

      return count(sdk, /^red vine worm$/i) >= 1 && (sdk.getSkill('Fishing')?.baseLevel ?? 1) >= 10;
    });

    const winContest = () => step(c, N, 'win-and-finish', async () => {
      if (!has(sdk, /^fishing trophy$/i)) {
        // Enter Hemenster fishing contest grounds via gate at (2642, 3441)
        await walkToKandarin(c, 2643, 3441);
        await bot.walkTo(2643, 3441, 1);
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 47 || l.id === 48);
        if (gate && (sdk.getState()?.player?.worldX ?? 2645) >= 2643) {
          await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
          await sleep(2000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 2645) <= 2642, 5000, 300);
        }

        // Put Garlic (1550) in Wall Pipe (id: 41) at (2637, 3446)
        if (has(sdk, /^garlic$/i)) {
          await bot.walkTo(2638, 3446, 1);
          await bot.useItemOnLoc(/^garlic$/i, /^wall pipe$/i);
          await sleep(2000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }

        // Pay Bonzo (225) 5gp to start competition
        await bot.walkTo(2641, 3437, 2);
        await talk(c, /^bonzo$/i, [/i'll enter the competition please/i]);
        await sleep(3000);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);

        // Fish at the Sinister Stranger's spot (2637, 3444) using Bait (op1) until we catch Giant Carp -> talk to Bonzo for Trophy
        for (let i = 0; i < 6 && !has(sdk, /^raw giant carp|fishing trophy$/i); i++) {
          await bot.walkTo(2638, 3444, 2);
          const spot = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 234 || (/^fishing spot$/i.test(n.name) && Math.hypot(n.x - 2637, n.z - 3444) <= 2));
          if (spot) {
            await bot.interactNpc(spot, /^bait$/i);
            await sleep(4500);
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }

        if (!has(sdk, /^fishing trophy$/i)) {
          await bot.walkTo(2641, 3437, 2);
          await talk(c, /^bonzo$/i, [/i have this big fish/i]);
          await waitInv(sdk, /^fishing trophy$/i, 6000);
        }

        // Exit Hemenster gate (2642, 3441)
        await bot.walkTo(2642, 3441, 1);
        const gateOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 47 || l.id === 48);
        if (gateOut && (sdk.getState()?.player?.worldX ?? 2640) <= 2642) {
          await sdk.sendInteractLoc(gateOut.x, gateOut.z, gateOut.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 2640) >= 2643, 5000, 300);
        }
      }

      // Deliver Fishing trophy (26) to Vestri (3679) at (2820, 3487)
      await bot.walkTo(2820, 3487, 2);
      await talk(c, /^(vestri|austri)$/i);
      const done = await waitCond(() => xp(sdk, 'Fishing') > startXp + 1500 || !has(sdk, /^fishing trophy$/i), 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return (await startAndPrep()) && (await winContest());
  },
};

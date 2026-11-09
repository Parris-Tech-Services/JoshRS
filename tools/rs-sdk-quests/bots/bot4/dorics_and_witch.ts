import { Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step, lumbridgeStairs, openNearbyDoors, bankJunk, withdrawFromDraynorBank, exitWizardsTowerGround, runQuests } from './quest-kit';

export const hetty: Quest = {
  name: "Witch's Potion",
  async run(c: Ctx) {
    const { bot, sdk } = c;
    if (xp(sdk, 'Magic') >= 3250) return true;

    const startAndRat = () => step(c, "Witch's Potion", 'start-and-rat', async () => {
      if (xp(sdk, 'Magic') >= 3250 || has(sdk, /^rat's tail$/i)) return true;
      await exitWizardsTowerGround(c);
      if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
      await bankJunk(c, /^(coins|bronze pickaxe|bronze sword|wooden shield|rat's tail|eye of newt|onion|burnt meat|cooked meat|raw beef)$/i);
      await withdrawFromDraynorBank(c, [/^coins$/i, /^bronze pickaxe$/i, /^bronze sword$/i, /^wooden shield$/i]);
      if (has(sdk, /^bronze sword$/i)) await bot.equipItem(/^bronze sword$/i);
      if (has(sdk, /^wooden shield$/i)) await bot.equipItem(/^wooden shield$/i);

      if ((sdk.getState()?.player?.worldX ?? 0) > 3040) {
        await bot.walkTo(3035, 3236, 3);
      }
      const wh = await bot.walkTo(2968, 3205, 2);
      if (!wh?.success) { await openNearbyDoors(c, 2965, 3206, 2); await bot.walkTo(2968, 3205, 2); }
      await talk(c, /^hetty$/i, [/in search of a quest/i, /become one with my darker side/i]);
      if (xp(sdk, 'Magic') >= 3250) return true;

      const wr = await bot.walkTo(2956, 3203, 2);
      if (!wr?.success) { await openNearbyDoors(c, 2958, 3203, 2); await bot.walkTo(2956, 3203, 2); }
      const deadline = Date.now() + 45_000;
      while (Date.now() < deadline && !has(sdk, /^rat's tail$/i)) {
        const tail = sdk.findGroundItem(/^rat's tail$/i);
        if (tail) {
          await bot.pickupItem(tail);
          if (await waitInv(sdk, /^rat's tail$/i, 3000)) return true;
        }
        const rat = sdk.findNearbyNpc(/^rat$/i);
        if (rat && !sdk.getState()?.player?.combat?.inCombat) {
          await bot.attack(rat);
        }
        await sleep(800);
      }
      return has(sdk, /^rat's tail$/i);
    });

    const ingredients = () => step(c, "Witch's Potion", 'ingredients', async () => {
      if (xp(sdk, 'Magic') >= 3250) return true;

      if (!has(sdk, /^onion$/i)) {
        const wo = await bot.walkTo(2952, 3251, 2);
        if (!wo?.success) { await openNearbyDoors(c, 2955, 3251, 2); await bot.walkTo(2952, 3251, 2); }
        for (let i = 0; i < 4 && !has(sdk, /^onion$/i); i++) {
          await bot.interactLoc(/^onion$/i, 'Pick');
          if (await waitInv(sdk, /^onion$/i, 4000)) break;
        }
        if (!has(sdk, /^onion$/i)) return false;
      }

      if (!has(sdk, /^eye of newt$/i)) {
        const wb = await bot.walkTo(3014, 3259, 2);
        if (!wb?.success) { await openNearbyDoors(c, 3016, 3259, 2); await bot.walkTo(3014, 3259, 2); }
        for (let i = 0; i < 3 && !has(sdk, /^eye of newt$/i); i++) {
          const o = await bot.openShop(/^betty$/i);
          if (o?.success) {
            await bot.buyFromShop(/^eye of newt$/i, 1);
            await bot.closeShop();
          }
          await sleep(600);
        }
        if (!has(sdk, /^eye of newt$/i)) return false;
      }

      if (!has(sdk, /^burnt meat$/i)) {
        if (!has(sdk, /^raw beef|cooked meat$/i)) {
          const ww = await bot.walkTo(3014, 3204, 2);
          if (!ww?.success) { await openNearbyDoors(c, 3016, 3206, 2); await bot.walkTo(3014, 3204, 2); }
          for (let i = 0; i < 3 && !has(sdk, /^raw beef$/i); i++) {
            const o = await bot.openShop(/^wydin$/i);
            if (o?.success) {
              await bot.buyFromShop(/^raw beef$/i, 1);
              await bot.closeShop();
            }
            await sleep(600);
          }
          if (!has(sdk, /^raw beef$/i)) return false;
        }
        const wr = await bot.walkTo(2969, 3210, 2);
        if (!wr?.success) { await openNearbyDoors(c, 2966, 3210, 2); await bot.walkTo(2969, 3210, 2); }
        for (let i = 0; i < 3 && has(sdk, /^raw beef$/i); i++) {
          await bot.useItemOnLoc(/^raw beef$/i, /^range$/i);
          if (await waitCond(() => has(sdk, /^cooked meat|burnt meat$/i), 5000)) break;
        }
        for (let i = 0; i < 3 && !has(sdk, /^burnt meat$/i) && has(sdk, /^cooked meat$/i); i++) {
          await bot.useItemOnLoc(/^cooked meat$/i, /^range$/i);
          if (await waitInv(sdk, /^burnt meat$/i, 5000)) break;
        }
        if (!has(sdk, /^burnt meat$/i)) return false;
      }

      return true;
    });

    const handIn = () => step(c, "Witch's Potion", 'hand-in', async () => {
      if (xp(sdk, 'Magic') >= 3250) return true;
      const wh = await bot.walkTo(2968, 3205, 2);
      if (!wh?.success) { await openNearbyDoors(c, 2965, 3206, 2); await bot.walkTo(2968, 3205, 2); }
      if (has(sdk, /^rat's tail$/i)) {
        await talk(c, /^hetty$/i);
        if (!(await waitCond(() => !has(sdk, /^rat's tail$/i), 4000))) return false;
      }
      for (let i = 0; i < 3 && xp(sdk, 'Magic') < 3250; i++) {
        await bot.interactLoc(/^cauldron$/i, /drink/i);
        await sleep(900);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (await waitCond(() => xp(sdk, 'Magic') >= 3250, 4000)) break;
      }
      const done = xp(sdk, 'Magic') >= 3250;
      await bot.closeInterface();
      return done;
    });

    return (await startAndRat()) && (await ingredients()) && (await handIn());
  },
};

export const doric: Quest = {
  name: "Doric's Quest",
  async run(c: Ctx) {
    const { bot, sdk } = c;
    if (xp(sdk, 'Mining') >= 13000) return true;

    const mineCount = async (x: number, z: number, rockIds: number[], itemRe: RegExp, target: number) => {
      if (count(sdk, itemRe) >= target) return true;
      await bot.walkTo(x, z, 2);
      for (let tries = 0; tries < target * 6 && count(sdk, itemRe) < target; tries++) {
        const rock = (sdk.getState()?.nearbyLocs ?? []).find(
          (l: any) => rockIds.includes(l.id) && (l.options ?? []).some((o: string) => /^mine$/i.test(o))
        );
        if (!rock) { await sleep(1200); continue; }
        const before = count(sdk, itemRe);
        await bot.interactLoc(rock, 'Mine');
        await waitCond(() => count(sdk, itemRe) > before, 8000, 300);
      }
      return count(sdk, itemRe) >= target;
    };

    const prep = () => step(c, "Doric's Quest", 'prep', async () => {
      if (xp(sdk, 'Mining') >= 13000) return true;
      if (count(sdk, /^clay$/i) >= 6 && count(sdk, /^copper ore$/i) >= 4 && count(sdk, /^iron ore$/i) >= 2) return true;
      if (!has(sdk, /^bronze pickaxe$/i)) {
        await withdrawFromDraynorBank(c, [/^bronze pickaxe$/i]);
      }
      return has(sdk, /^bronze pickaxe$/i);
    });

    const mineOres = () => step(c, "Doric's Quest", 'mine-ores', async () => {
      if (xp(sdk, 'Mining') >= 13000) return true;
      if ((sdk.getState()?.player?.worldX ?? 0) > 3040) {
        await bot.walkTo(3035, 3236, 3);
      }
      if (count(sdk, /^clay$/i) < 6) {
        if (!(await mineCount(2986, 3239, [2108, 2109], /^clay$/i, 6))) return false;
      }
      if (count(sdk, /^copper ore$/i) < 4) {
        if (!(await mineCount(2977, 3247, [2090, 2091], /^copper ore$/i, 4))) return false;
      }
      if (count(sdk, /^iron ore$/i) < 2) {
        if (!(await mineCount(2969, 3240, [2092, 2093], /^iron ore$/i, 2))) return false;
      }
      return true;
    });

    const handIn = () => step(c, "Doric's Quest", 'hand-in', async () => {
      if (xp(sdk, 'Mining') >= 13000) return true;
      if ((sdk.getState()?.player?.worldZ ?? 0) < 3320) {
        await bot.walkTo(3007, 3280, 3);
        await bot.walkTo(3007, 3330, 3);
      }
      await bot.walkTo(2965, 3385, 3);
      await bot.walkTo(2946, 3415, 3);
      const w = await bot.walkTo(2951, 3451, 2);
      if (!w?.success) { await openNearbyDoors(c, 2950, 3450, 2); await bot.walkTo(2951, 3451, 2); }
      await talk(c, /^doric$/i, [/wanted to use your anvils/i, /will get you materials/i]);
      if (xp(sdk, 'Mining') < 13000 && count(sdk, /^clay$/i) >= 6) {
        await talk(c, /^doric$/i);
      }
      const done = await waitCond(() => xp(sdk, 'Mining') >= 13000, 6000);
      await bot.closeInterface();
      return done;
    });

    return (await prep()) && (await mineOres()) && (await handIn());
  },
};

await runQuests('bots/bot4', [hetty, doric]);

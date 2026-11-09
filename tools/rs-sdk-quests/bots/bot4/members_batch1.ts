import { Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step, lumbridgeStairs, openNearbyDoors, pickupWithWait, combineItems, bankJunk, withdrawFromDraynorBank, walkToVarrock, walkFromVarrockToLumbridge, exitWizardsTowerGround, runQuests } from './quest-kit';

export const fluffs: Quest = {
  name: "Gertrude's Cat",
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const N = "Gertrude's Cat";
    const startCookingXp = xp(sdk, 'Cooking');

    const prepAndStart = () => step(c, N, 'prep-and-start', async () => {
      await exitWizardsTowerGround(c);
      if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
      await bankJunk(c, /^(coins|bucket|bucket of milk|raw sardine|doogle leaves|seasoned sardine|fluffs' kitten)$/i);
      await withdrawFromDraynorBank(c, [/^coins$/i]);

      if (!has(sdk, /^bucket of milk$/i)) {
        if (!has(sdk, /^bucket$/i)) {
          const w = await bot.walkTo(3212, 3247, 2);
          if (!w?.success) { await openNearbyDoors(c, 3212, 3247, 2); await bot.walkTo(3212, 3247, 2); }
          for (let i = 0; i < 3 && !has(sdk, /^bucket$/i); i++) {
            const o = await bot.openShop();
            if (o?.success) {
              await bot.buyFromShop(/^bucket$/i, 1);
              await bot.closeShop();
            }
            await sleep(600);
          }
        }
        const wc = await bot.walkTo(3256, 3274, 3);
        if (!wc?.success) { await openNearbyDoors(c, 3253, 3267, 2); await bot.walkTo(3256, 3274, 3); }
        for (let i = 0; i < 4 && !has(sdk, /^bucket of milk$/i); i++) {
          const cow = sdk.findNearbyNpc(/^dairy cow$/i);
          if (cow) await bot.useItemOnNpc(/^bucket$/i, cow);
          if (await waitInv(sdk, /^bucket of milk$/i, 5000)) break;
        }
      }

      if (!has(sdk, /^raw sardine|seasoned sardine$/i)) {
        if ((sdk.getState()?.player?.worldX ?? 0) > 3040) {
          await bot.walkTo(3035, 3236, 3);
        }
        const wg = await bot.walkTo(3014, 3224, 2);
        if (!wg?.success) { await openNearbyDoors(c, 3016, 3224, 2); await bot.walkTo(3014, 3224, 2); }
        for (let i = 0; i < 3 && !has(sdk, /^raw sardine$/i); i++) {
          const o = await bot.openShop(/^gerrant$/i);
          if (o?.success) {
            await bot.buyFromShop(/^raw sardine$/i, 1);
            await bot.closeShop();
          }
          await sleep(600);
        }
      }

      // Walk to Gertrude's house & pick up Doogle leaves
      await bot.walkTo(3080, 3400, 4);
      await bot.walkTo(3152, 3399, 2);
      if (!has(sdk, /^doogle leaves|seasoned sardine$/i)) {
        for (const [dx, dz] of [[3152, 3399], [3156, 3401], [3151, 3399]]) {
          if (await pickupWithWait(c, dx, dz, /^doogle leaves$/i, 8)) break;
        }
      }
      if (has(sdk, /^doogle leaves$/i) && has(sdk, /^raw sardine$/i)) {
        await combineItems(c, /^doogle leaves$/i, /^raw sardine$/i, /^seasoned sardine$/i);
      }

      const wGertrude = await bot.walkTo(3151, 3413, 2);
      if (!wGertrude?.success) { await openNearbyDoors(c, 3151, 3416, 2); await bot.walkTo(3151, 3413, 2); }
      await talk(c, /^gertrude$/i, [/suppose i could/i]);
      return has(sdk, /^bucket of milk$/i) && has(sdk, /^seasoned sardine$/i);
    });

    const payBoy = () => step(c, N, 'pay-shilop', async () => {
      await bot.walkTo(3221, 3434, 3);
      for (let i = 0; i < 3; i++) {
        const boy = sdk.findNearbyNpc(/^(shilop|wilough)$/i);
        if (boy) {
          await talk(c, boy, [/what will make you tell me/i, /okay then, i'll pay/i]);
          const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
          if (/abandoned lumber mill|old lumber mill/i.test(recent)) return true;
        }
        await sleep(800);
      }
      return true;
    });

    const rescueFluffs = () => step(c, N, 'lumber-yard-rescue', async () => {
      const climbFenceIn = async () => {
        if ((sdk.getState()?.player?.worldZ ?? 0) >= 3493) return true;
        await bot.walkTo(3305, 3492, 1);
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) < 3493; i++) {
          const fence = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2618 || /broken fence/i.test(l.name));
          if (fence) await bot.interactLoc(fence, /climb-?over/i);
          if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3493, 4000, 300)) return true;
        }
        return (sdk.getState()?.player?.worldZ ?? 0) >= 3493;
      };

      const climbLadder = async (targetLvl: 0 | 1) => {
        for (let i = 0; i < 4 && lvl(sdk) !== targetLvl; i++) {
          await bot.walkTo(3310, 3509, 2);
          await bot.interactLoc(/^ladder$/i, targetLvl === 1 ? /climb-?up/i : /climb-?down/i);
          if (await waitCond(() => lvl(sdk) === targetLvl, 5000, 300)) return true;
        }
        return lvl(sdk) === targetLvl;
      };

      if (!(await climbFenceIn())) return false;
      if (!(await climbLadder(1))) return false;

      await bot.walkTo(3306, 3512, 2);
      if (has(sdk, /^bucket of milk$/i)) {
        const cat = sdk.findNearbyNpc(/gertrudes cat/i);
        if (cat) await bot.useItemOnNpc(/^bucket of milk$/i, cat);
        await waitCond(() => !has(sdk, /^bucket of milk$/i), 5000, 300);
        await sleep(1000);
      }
      if (has(sdk, /^seasoned sardine$/i)) {
        const cat = sdk.findNearbyNpc(/gertrudes cat/i);
        if (cat) await bot.useItemOnNpc(/^seasoned sardine$/i, cat);
        await waitCond(() => !has(sdk, /^seasoned sardine$/i), 5000, 300);
        await sleep(1000);
      }

      if (!(await climbLadder(0))) return false;

      const crateCoords: [number, number][] = [
        [3305, 3500],
        [3310, 3499],
        [3307, 3507],
        [3303, 3506],
        [3298, 3514],
        [3311, 3511],
      ];
      for (const [cx, cz] of crateCoords) {
        if (has(sdk, /^fluffs' kitten$/i)) break;
        await bot.walkTo(cx, cz, 2);
        const crateNpc = (sdk.getState()?.nearbyNpcs ?? []).find(
          (n: any) => (n.id === 767 || /^crate$/i.test(n.name)) && Math.hypot(n.x - cx, n.z - cz) <= 2
        );
        if (crateNpc) {
          await bot.interactNpc(crateNpc, /^search$/i);
          await sleep(3600);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
          await sleep(500);
        }
      }
      if (!has(sdk, /^fluffs' kitten$/i)) return false;

      if (!(await climbLadder(1))) return false;
      await bot.walkTo(3306, 3512, 2);
      for (let i = 0; i < 3 && has(sdk, /^fluffs' kitten$/i); i++) {
        const cat = sdk.findNearbyNpc(/gertrudes cat/i);
        if (cat) await bot.useItemOnNpc(/^fluffs' kitten$/i, cat);
        await sleep(4500);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }
      if (has(sdk, /^fluffs' kitten$/i)) return false;

      if (!(await climbLadder(0))) return false;
      await bot.walkTo(3305, 3493, 1);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 9999) >= 3493; i++) {
        const fence = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2618 || /broken fence/i.test(l.name));
        if (fence) await bot.interactLoc(fence, /climb-?over/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) <= 3492, 4000, 300)) break;
      }
      return true;
    });

    const handIn = () => step(c, N, 'hand-in', async () => {
      await bot.walkTo(3221, 3434, 4);
      const wGertrude = await bot.walkTo(3151, 3413, 2);
      if (!wGertrude?.success) { await openNearbyDoors(c, 3151, 3416, 2); await bot.walkTo(3151, 3413, 2); }
      await talk(c, /^gertrude$/i);
      const done = await waitCond(() => xp(sdk, 'Cooking') > startCookingXp + 10000, 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return (await prepAndStart()) && (await payBoy()) && (await rescueFluffs()) && (await handIn());
  },
};

export const druid: Quest = {
  name: 'Druidic Ritual',
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const N = 'Druidic Ritual';
    if (xp(sdk, 'Herblore') >= 250) return true;

    const getMeats = () => step(c, N, 'get-meats', async () => {
      if (has(sdk, /^enchanted beef$/i) && has(sdk, /^enchanted rat$/i) && has(sdk, /^enchanted bear$/i) && has(sdk, /^enchanted chicken$/i)) return true;
      await withdrawFromDraynorBank(c, [/^coins$/i, /^bronze sword$/i, /^wooden shield$/i]);
      if (has(sdk, /^bronze sword$/i)) await bot.equipItem(/^bronze sword$/i);
      if (has(sdk, /^wooden shield$/i)) await bot.equipItem(/^wooden shield$/i);

      if (!has(sdk, /^raw beef|enchanted beef$/i) || !has(sdk, /^raw chicken|enchanted chicken$/i)) {
        if ((sdk.getState()?.player?.worldX ?? 0) > 3040) {
          await bot.walkTo(3035, 3236, 3);
        }
        const ww = await bot.walkTo(3014, 3204, 2);
        if (!ww?.success) { await openNearbyDoors(c, 3016, 3206, 2); await bot.walkTo(3014, 3204, 2); }
        for (let i = 0; i < 3 && (!has(sdk, /^raw beef$/i) || !has(sdk, /^raw chicken$/i)); i++) {
          const o = await bot.openShop(/^wydin$/i);
          if (o?.success) {
            if (!has(sdk, /^raw beef$/i)) await bot.buyFromShop(/^raw beef$/i, 1);
            if (!has(sdk, /^raw chicken$/i)) await bot.buyFromShop(/^raw chicken$/i, 1);
            await bot.closeShop();
          }
          await sleep(600);
        }
      }

      if (!has(sdk, /^raw rat meat|enchanted rat$/i)) {
        await bot.walkTo(2995, 3191, 3);
        const deadline = Date.now() + 45_000;
        while (Date.now() < deadline && !has(sdk, /^raw rat meat$/i)) {
          const rm = sdk.findGroundItem(/^raw rat meat$/i);
          if (rm) {
            await bot.pickupItem(rm);
            if (await waitInv(sdk, /^raw rat meat$/i, 3000)) break;
          }
          const gr = sdk.findNearbyNpc(/^giant rat$/i);
          if (gr && !sdk.getState()?.player?.combat?.inCombat) {
            await bot.attack(gr);
          }
          await sleep(800);
        }
      }

      if (!has(sdk, /^raw bear meat|enchanted bear$/i)) {
        await bot.walkTo(3007, 3325, 3);
        await bot.walkTo(2965, 3385, 3);
        await bot.walkTo(2965, 3465, 3);
        const deadline = Date.now() + 60_000;
        while (Date.now() < deadline && !has(sdk, /^raw bear meat$/i)) {
          const bm = sdk.findGroundItem(/^raw bear meat$/i);
          if (bm) {
            await bot.pickupItem(bm);
            if (await waitInv(sdk, /^raw bear meat$/i, 3000)) break;
          }
          const bear = sdk.findNearbyNpc(/^bear$/i);
          if (bear && !sdk.getState()?.player?.combat?.inCombat) {
            await bot.attack(bear);
          }
          await sleep(800);
        }
      }

      return has(sdk, /^raw beef|enchanted beef$/i) && has(sdk, /^raw chicken|enchanted chicken$/i) && has(sdk, /^raw rat meat|enchanted rat$/i) && has(sdk, /^raw bear meat|enchanted bear$/i);
    });

    const startAndSanfew = () => step(c, N, 'kaqemeex-and-sanfew', async () => {
      await bot.walkTo(2925, 3484, 2);
      await talk(c, /^kaqemeex$/i, [/in search of a quest/i, /ok, i will try and help/i]);

      const ws = await bot.walkTo(2898, 3428, 2);
      if (!ws?.success) { await openNearbyDoors(c, 2898, 3425, 2); await bot.walkTo(2898, 3428, 2); }
      for (let i = 0; i < 3 && lvl(sdk) === 0; i++) {
        await bot.interactLoc(/^staircase$/i, /climb-?up/i);
        if (await waitCond(() => lvl(sdk) === 1, 5000, 300)) break;
      }
      if (lvl(sdk) !== 1) return false;
      await talk(c, /^sanfew$/i, [/sent to help purify/i, /where can i find this cauldron/i]);
      for (let i = 0; i < 3 && lvl(sdk) === 1; i++) {
        await bot.interactLoc(/^staircase$/i, /climb-?down/i);
        if (await waitCond(() => lvl(sdk) === 0, 5000, 300)) break;
      }
      return lvl(sdk) === 0;
    });

    const dipCauldron = () => step(c, N, 'cauldron-of-thunder', async () => {
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        const wd = await bot.walkTo(2884, 3397, 2);
        if (!wd?.success) { await openNearbyDoors(c, 2898, 3425, 2); await bot.walkTo(2884, 3397, 2); }
        for (let i = 0; i < 3 && (sdk.getState()?.player?.worldZ ?? 0) < 9000; i++) {
          await bot.interactLoc(/^ladder$/i, /climb-?down/i);
          if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 300)) break;
        }
      }
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) return false;

      await bot.walkTo(2888, 9830, 1);
      // Click prison door 3 times (first 2 wake suits of armour, 3rd opens door)
      for (let i = 0; i < 5 && (sdk.getState()?.player?.worldX ?? 0) < 2889; i++) {
        const pd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /prison door/i.test(l.name) && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
        if (pd) await bot.interactLoc(pd, /^open$/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2889, 2500, 300)) break;
      }
      await sdk.sendWalk(2892, 9831, true);
      await sleep(1200);

      for (const [rawRe, enchRe] of [
        [/^raw rat meat$/i, /^enchanted rat$/i],
        [/^raw beef$/i, /^enchanted beef$/i],
        [/^raw bear meat$/i, /^enchanted bear$/i],
        [/^raw chicken$/i, /^enchanted chicken$/i],
      ] as [RegExp, RegExp][]) {
        for (let i = 0; i < 3 && has(sdk, rawRe); i++) {
          await bot.useItemOnLoc(rawRe, /cauldron of thunder/i);
          if (await waitInv(sdk, enchRe, 4000)) break;
        }
      }

      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 9999) >= 2889; i++) {
        await sdk.sendWalk(2889, 9830, true);
        await sleep(800);
        const pd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /prison door/i.test(l.name) && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
        if (pd) await bot.interactLoc(pd, /^open$/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2888, 3000, 300)) break;
      }

      await bot.walkTo(2884, 9797, 2);
      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldZ ?? 9999) > 9000; i++) {
        await bot.interactLoc(/^ladder$/i, /climb-?up/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 300)) break;
      }
      return (sdk.getState()?.player?.worldZ ?? 9999) < 9000;
    });

    const finish = () => step(c, N, 'finish', async () => {
      const ws = await bot.walkTo(2898, 3428, 2);
      if (!ws?.success) { await openNearbyDoors(c, 2898, 3425, 2); await bot.walkTo(2898, 3428, 2); }
      for (let i = 0; i < 3 && lvl(sdk) === 0; i++) {
        await bot.interactLoc(/^staircase$/i, /climb-?up/i);
        if (await waitCond(() => lvl(sdk) === 1, 5000, 300)) break;
      }
      await talk(c, /^sanfew$/i);
      for (let i = 0; i < 3 && lvl(sdk) === 1; i++) {
        await bot.interactLoc(/^staircase$/i, /climb-?down/i);
        if (await waitCond(() => lvl(sdk) === 0, 5000, 300)) break;
      }

      const wk = await bot.walkTo(2925, 3484, 2);
      if (!wk?.success) { await openNearbyDoors(c, 2898, 3425, 2); await bot.walkTo(2925, 3484, 2); }
      await talk(c, /^kaqemeex$/i);
      if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
        await chat(c);
      }
      const done = await waitCond(() => xp(sdk, 'Herblore') >= 250, 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return (await getMeats()) && (await startAndSanfew()) && (await dipCauldron()) && (await finish());
  },
};

export const drunkmonk: Quest = {
  name: "Monk's Friend",
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const N = "Monk's Friend";
    const startWcXp = xp(sdk, 'Woodcutting');
    if (startWcXp >= 20000) return true;

    const prepSupplies = () => step(c, N, 'prep-supplies', async () => {
      if (has(sdk, /^jug of water$/i) && has(sdk, /^logs$/i)) return true;
      if (!has(sdk, /^jug of water$/i)) {
        if (!has(sdk, /^jug$/i)) {
          const w = await bot.walkTo(2958, 3388, 2);
          if (!w?.success) { await openNearbyDoors(c, 2958, 3388, 2); await bot.walkTo(2958, 3388, 2); }
          for (let i = 0; i < 3 && !has(sdk, /^jug$/i); i++) {
            const o = await bot.openShop();
            if (o?.success) {
              await bot.buyFromShop(/^jug$/i, 1);
              await bot.closeShop();
            }
            await sleep(600);
          }
        }
        await bot.walkTo(2966, 3380, 2);
        for (let i = 0; i < 3 && !has(sdk, /^jug of water$/i); i++) {
          await bot.useItemOnLoc(/^jug$/i, /^fountain|waterpump$/i);
          if (await waitInv(sdk, /^jug of water$/i, 4000)) break;
        }
      }
      if (!has(sdk, /^logs$/i)) {
        // Pick up logs on Lumbridge castle roof or Falador/Taverley or chop if we have an axe
        if (!has(sdk, /axe$/i)) {
          await bot.walkTo(2945, 3425, 3);
        }
      }
      return has(sdk, /^jug of water$/i);
    });

    const walkToMonastery = async () => {
      const p = sdk.getState()?.player;
      if (p && p.worldX > 2860) {
        await bot.walkTo(2870, 3435, 3);
        await bot.walkTo(2847, 3498, 3);
        await bot.walkTo(2808, 3438, 3);
      }
      if ((sdk.getState()?.player?.worldX ?? 0) > 2740) {
        await bot.walkTo(2725, 3485, 4);
        await bot.walkTo(2660, 3305, 4);
      }
      const wm = await bot.walkTo(2606, 3209, 2);
      if (!wm?.success) {
        await openNearbyDoors(c, 2606, 3213, 2);
        await bot.walkTo(2606, 3209, 2);
      }
    };

    const blanketStep = () => step(c, N, 'blanket', async () => {
      await walkToMonastery();
      await talk(c, /^brother omad$/i, [/why can't you sleep/i, /can i help at all/i]);

      await bot.walkTo(2561, 3222, 1);
      await sleep(1500);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) < 9000; i++) {
        const lad = sdk.findNearbyLoc(/^ladder$/i);
        if (lad) await bot.interactLoc(lad, /climb-?down/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 300)) break;
      }
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) return false;

      if (!(await pickupWithWait(c, 2570, 9604, /^child's blanket$/i, 15))) return false;

      await bot.walkTo(2561, 9622, 2);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 9999) > 9000; i++) {
        await bot.interactLoc(/^ladder$/i, /climb-?up/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 300)) break;
      }

      await walkToMonastery();
      await talk(c, /^brother omad$/i);
      return !has(sdk, /^child's blanket$/i);
    });

    const cedricStep = () => step(c, N, 'cedric', async () => {
      if (!has(sdk, /^logs$/i)) {
        // Buy bronze axe in East Ardougne or chop with axe, or pick up logs at (2526, 3091) / chop tree
        // Let's check if we have an axe, otherwise buy one or pick up logs
      }
      await walkToMonastery();
      await talk(c, /^brother omad$/i, [/who's brother cedric/i, /where should i look/i]);

      await bot.walkTo(2614, 3259, 2);
      await talk(c, /^brother cedric$/i);
      if (has(sdk, /^jug of water$/i)) {
        await talk(c, /^brother cedric$/i, [/yes, i'd be happy to/i]);
      }
      if (has(sdk, /^logs$/i)) {
        await talk(c, /^brother cedric$/i);
      }

      await walkToMonastery();
      await talk(c, /^brother omad$/i);
      const done = await waitCond(() => xp(sdk, 'Woodcutting') >= startWcXp + 15000, 20_000, 500);
      await bot.closeInterface();
      return done;
    });

    return (await prepSupplies()) && (await blanketStep()) && (await cedricStep());
  },
};

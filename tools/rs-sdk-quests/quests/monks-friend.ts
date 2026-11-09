import {
  Ctx, Quest, has, count, xp, lvl, sleep, talk, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, bankJunk, withdrawFromDraynorBank, exitWizardsTowerGround
} from '../quest-kit';

const N = "Monk's Friend";
const KEEP_RE = /^(coins|bronze axe|jug|jug of water|logs|child's blanket|law rune|silverlight|bronze sword|wooden shield|shrimps|bread|cabbage|trout|salmon|lobster)$/i;

export async function exitCarnilleanEastRoom(c: Ctx): Promise<void> {
  const { sdk } = c;
  const p = sdk.getState()?.player;
  if (!p || p.level !== 0 || p.worldX < 2570 || p.worldX > 2576 || p.worldZ < 3267 || p.worldZ > 3274) return;
  if (p.worldZ >= 3271 && p.worldX >= 2571) {
    const dOpen = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1533 && l.x === 2573 && l.z === 3271);
    if (dOpen) {
      await sdk.sendInteractLoc(dOpen.x, dOpen.z, dOpen.id, 1);
      await sleep(800);
    }
    await sdk.sendWalk(2573, 3270, true);
    await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3271) <= 3270, 3000, 200);
  }
  const p2 = sdk.getState()?.player;
  if (p2 && p2.worldZ <= 3270 && p2.worldX >= 2572) {
    const dClose = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1534 && l.x === 2573 && l.z === 3270);
    if (dClose) {
      await sdk.sendInteractLoc(dClose.x, dClose.z, dClose.id, 1);
      await sleep(800);
    }
    await sdk.sendWalk(2570, 3271, true);
    await waitCond(() => (sdk.getState()?.player?.worldX ?? 2573) <= 2571, 3500, 200);
  }
  const p3 = sdk.getState()?.player;
  if (p3 && p3.worldX >= 2570) {
    const dHall = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1533 && l.x === 2570 && l.z === 3271);
    if (dHall) {
      await sdk.sendInteractLoc(dHall.x, dHall.z, dHall.id, 1);
      await sleep(800);
    }
    await sdk.sendWalk(2569, 3272, true);
    await waitCond(() => (sdk.getState()?.player?.worldX ?? 2570) <= 2569, 3000, 200);
  }
  const dFront = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1533 && l.x === 2569 && l.z === 3273);
  if (dFront) {
    await sdk.sendInteractLoc(dFront.x, dFront.z, dFront.id, 1);
    await sleep(800);
  }
  await sdk.sendWalk(2569, 3275, true);
  await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3272) >= 3274, 3000, 200);
}

export async function walkToKandarin(c: Ctx, destX: number, destZ: number): Promise<boolean> {
  const { bot, sdk } = c;
  await exitWizardsTowerGround(c);
  await exitCarnilleanEastRoom(c);
  // If underground in Clock Tower / Kandarin dungeon (worldZ > 9000) and destZ < 9000, climb up nearest ladder
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000 && destZ < 9000) {
    await openNearbyDoors(c, 2575, 9651, 3);
    await openNearbyDoors(c, 2575, 9648, 3);
    await bot.walkTo(2566, 9642, 2);
    const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
    if (lad) {
      await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
      await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 4000, 250);
    }
  }
  const p0 = sdk.getState()?.player;
  if (!p0) return false;

  if (p0.worldX > 2860) {
    if (p0.worldX > 3040) {
      await bot.walkTo(3050, 3275, 3);
      await bot.walkTo(3007, 3330, 3);
    }
    await bot.walkTo(2965, 3385, 3);
    await bot.walkTo(2905, 3428, 3);
    await bot.walkTo(2865, 3435, 3);
    if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
      await bot.activatePrayer('protect_from_melee');
    }
    await bot.walkTo(2848, 3496, 3);
    await bot.walkTo(2815, 3440, 3);
    await bot.deactivateAllPrayers();
  }

  const p1 = sdk.getState()?.player;
  if (p1 && p1.worldX > 2700 && destX < 2700) {
    await bot.walkTo(2725, 3485, 3);
    await bot.walkTo(2660, 3365, 3);
  }
  const w = await bot.walkTo(destX, destZ, 2);
  if (!w?.success) {
    await openNearbyDoors(c, destX, destZ, 3);
    await bot.walkTo(destX, destZ, 2);
  }
  const pf = sdk.getState()?.player;
  return !!pf && Math.hypot(pf.worldX - destX, pf.worldZ - destZ) <= 6;
}

export const drunkmonk: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    if (xp(sdk, 'Woodcutting') >= 20000) return true;

    let started = false;
    let blanketReturned = false;
    let lookingCedric = false;
    let cedricFixed = false;

    const hasBlanket = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 90 || /blanket/i.test(i.name));

    const prepAndStart = () => step(c, N, 'prep-and-start-omad', async () => {
      await exitCarnilleanEastRoom(c);
      if (xp(sdk, 'Woodcutting') >= 20000 || started || blanketReturned || hasBlanket()) return true;
      await exitWizardsTowerGround(c);

      if ((sdk.getState()?.player?.worldX ?? 3100) > 2900) {
        if ((sdk.getState()?.player?.worldX ?? 3100) > 3040 && (sdk.getState()?.player?.worldZ ?? 3250) < 3350) {
          await bankJunk(c, KEEP_RE);
          await withdrawFromDraynorBank(c, [/^coins$/i, /^bronze axe$/i, /^jug$/i, /^jug of water$/i, /^logs$/i]);
        }

        if (!has(sdk, /^bronze axe$/i) && !has(sdk, /^logs$/i)) {
          while (count(sdk, /^coins$/i) < 20) {
            await bot.walkTo(3100, 3250, 4);
            const npc = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^(man|woman)$/i.test(n.name) && n.combatLevel <= 4 && n.reachable !== false);
            if (npc) await bot.pickpocketNpc(npc);
            await sleep(600);
          }
          const wb = await bot.walkTo(3230, 3203, 2);
          if (!wb?.success) { await openNearbyDoors(c, 3234, 3203, 3); await bot.walkTo(3230, 3203, 2); }
          const o = await bot.openShop(/^bob$/i);
          if (o?.success) {
            await bot.buyFromShop(/^bronze axe$/i, 1);
            await bot.closeShop();
          }
        }

        if (!has(sdk, /^jug of water$/i) && !has(sdk, /^jug$/i)) {
          // Buy Jug at Falador General Store (2958, 3388) or Lumbridge General Store (3212, 3246)
          if ((sdk.getState()?.player?.worldX ?? 3100) > 3150) {
            const wg = await bot.walkTo(3212, 3246, 2);
            if (!wg?.success) { await openNearbyDoors(c, 3212, 3246, 3); await bot.walkTo(3212, 3246, 2); }
          } else {
            await bot.walkTo(2965, 3385, 3);
            const wg = await bot.walkTo(2958, 3388, 2);
            if (!wg?.success) { await openNearbyDoors(c, 2958, 3386, 3); await bot.walkTo(2958, 3388, 2); }
          }
          const o = await bot.openShop();
          if (o?.success) {
            await bot.buyFromShop(/^jug$/i, 1);
            await bot.closeShop();
          }
        }
      }

      if (!(await walkToKandarin(c, 2604, 3209))) return false;

      if (!has(sdk, /^jug of water$/i)) {
        if (!has(sdk, /^jug$/i)) {
          // Buy Jug at Port Khazard General Store (2660, 3150)
          const wk = await bot.walkTo(2660, 3150, 2);
          if (!wk?.success) { await openNearbyDoors(c, 2660, 3150, 3); await bot.walkTo(2660, 3150, 2); }
          const o = await bot.openShop();
          if (o?.success) {
            await bot.buyFromShop(/^jug$/i, 1);
            await bot.closeShop();
          }
        }
        if (has(sdk, /^bucket of water$/i) && has(sdk, /^jug$/i)) {
          await bot.useItemOnItem(/^bucket of water$/i, /^jug$/i);
          await waitInv(sdk, /^jug of water$/i, 3000);
        }
        if (!has(sdk, /^jug of water$/i)) {
          // Fill Jug at Ardougne Monastery sink (2611, 3205) or East Ardougne sink (2617, 3325)
          const ws = await bot.walkTo(2611, 3206, 1);
          if (!ws?.success) { await openNearbyDoors(c, 2610, 3208, 3); await bot.walkTo(2611, 3206, 1); }
          await bot.useItemOnLoc(/^jug$/i, /^(sink|fountain)$/i);
          await waitInv(sdk, /^jug of water$/i, 5000);
        }
      }

      if (!has(sdk, /^logs$/i)) {
        if (!has(sdk, /^(bronze|iron|steel|black|mithril|adamant|rune) axe$/i)) {
          // Withdraw Bronze axe from East Ardougne South Bank (2653, 3283)
          await bot.walkTo(2653, 3283, 2);
          const ob = await bot.openBank();
          if (ob?.success) {
            await bot.withdrawItem(/^(bronze|iron|steel|black|mithril|adamant|rune) axe$/i, 1);
            await bot.withdrawItem(/^logs$/i, 1);
            await bot.closeBank();
          }
        }
        if (!has(sdk, /^logs$/i)) {
          await bot.walkTo(2602, 3222, 3);
          for (let i = 0; i < 4 && !has(sdk, /^logs$/i); i++) {
            await bot.chopTree(/^tree$/i);
          }
        }
      }

      const wo = await bot.walkTo(2604, 3209, 2);
      if (!wo?.success) { await openNearbyDoors(c, 2606, 3209, 3); await bot.walkTo(2604, 3209, 2); }
      if (!(await talk(c, /^brother omad$/i, [
        /why can't you sleep/i,
        /can i help at all/i,
        /who's brother cedric/i,
        /where should i look/i,
      ]))) return false;

      if ((sdk.getState()?.recentDialogs ?? []).slice(-8).some((d: any) => /cedric|sleeping well|party/i.test((d.text ?? d.lines ?? []).join(' ')))) {
        blanketReturned = true;
        lookingCedric = true;
      }

      started = true;
      return true;
    });

    const getBlanket = () => step(c, N, 'blanket-cave', async () => {
      if (xp(sdk, 'Woodcutting') >= 20000 || blanketReturned) return true;
      const inCave = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;

      if (!hasBlanket()) {
        if (!inCave()) {
          await bot.walkTo(2561, 3222, 1);
          await waitCond(() => (sdk.getState()?.nearbyLocs ?? []).some((l: any) => /ladder/i.test(l.name) && Math.hypot(l.x - 2561, l.z - 3222) <= 2), 6000, 300);
          if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await bot.activatePrayer('protect_from_melee');
          }
          for (let i = 0; i < 3 && !inCave(); i++) {
            await bot.interactLoc(/^ladder$/i, /climb-?down/i);
            if (await waitCond(() => inCave(), 5000, 300)) break;
          }
          if (!inCave()) return false;
        }

        if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0 && !sdk.isPrayerActive('protect_from_melee')) {
          await bot.activatePrayer('protect_from_melee');
        }
        await bot.walkTo(2570, 9604, 1);
        if (!(await pickupWithWait(c, 2570, 9604, /blanket/i, 15))) return false;
      }

      if (inCave()) {
        await bot.walkTo(2561, 9622, 1);
        for (let i = 0; i < 3 && inCave(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (lad) await bot.interactLoc(lad, /climb-?up/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
          if (await waitCond(() => !inCave(), 5000, 300)) break;
        }
        await bot.deactivateAllPrayers();
      }

      const wo = await bot.walkTo(2604, 3209, 2);
      if (!wo?.success) { await openNearbyDoors(c, 2606, 3209, 3); await bot.walkTo(2604, 3209, 2); }
      await talk(c, /^brother omad$/i);
      const omadAlreadyGotBlanket = () => !hasBlanket() || (sdk.getState()?.recentDialogs ?? []).slice(-8).some((d: any) => /cedric|sleeping well|party/i.test((d.text ?? d.lines ?? []).join(' ')));
      if (!(await waitCond(omadAlreadyGotBlanket, 5000, 300))) return false;
      blanketReturned = true;

      await talk(c, /^brother omad$/i, [
        /who's brother cedric/i,
        /where should i look/i,
      ]);
      lookingCedric = true;
      return true;
    });

    const cedricAndParty = () => step(c, N, 'cedric-and-party', async () => {
      if (xp(sdk, 'Woodcutting') >= 20000) return true;
      if (!lookingCedric) {
        const wo = await bot.walkTo(2604, 3209, 2);
        if (!wo?.success) { await openNearbyDoors(c, 2606, 3209, 3); await bot.walkTo(2604, 3209, 2); }
        await talk(c, /^brother omad$/i, [/who's brother cedric/i, /where should i look/i]);
        lookingCedric = true;
      }

      if (!cedricFixed) {
        await bot.walkTo(2614, 3259, 2);
        for (let i = 0; i < 4 && (has(sdk, /^jug of water$/i) || has(sdk, /^logs$/i)); i++) {
          await talk(c, /^brother cedric$/i, [/yes, i'd be happy to/i]);
          await sleep(600);
        }
        cedricFixed = !has(sdk, /^logs$/i);
      }

      const wo2 = await bot.walkTo(2604, 3209, 2);
      if (!wo2?.success) { await openNearbyDoors(c, 2606, 3209, 3); await bot.walkTo(2604, 3209, 2); }
      const wcBefore = xp(sdk, 'Woodcutting');
      await talk(c, /^brother omad$/i);
      const done = await waitCond(() => xp(sdk, 'Woodcutting') > wcBefore, 20_000, 400);
      await bot.closeInterface();
      return done;
    });

    return (await prepAndStart()) && (await getBlanket()) && (await cedricAndParty());
  },
};

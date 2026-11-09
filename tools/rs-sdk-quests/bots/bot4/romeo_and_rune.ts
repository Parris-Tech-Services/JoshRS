import { Ctx, Quest, has, sleep, talk, waitInv, waitCond, step, lvl, julietStairs, lumbridgeStairs, wizardsTowerBasement, walkToVarrock, walkFromVarrockToLumbridge, openNearbyDoors, pickupWithWait, runQuests } from './quest-kit';

export const romeojuliet: Quest = {
  name: 'Romeo & Juliet',
  async run(c: Ctx) {
    const { bot, sdk } = c;
    let alreadyComplete = false;
    let gavePotion = false;

    const berries = () => step(c, 'Romeo & Juliet', 'berries', async () => {
      if (has(sdk, /^cadava berries$/i) || has(sdk, /^cadava potion$/i)) return true;
      if (lvl(sdk) > 0 && !(await julietStairs(c, 0))) return false;
      await walkToVarrock(c, 3268, 3365);
      for (const [bx, bz] of [[3266, 3361], [3273, 3375], [3277, 3370]] as const) {
        if (await pickupWithWait(c, bx, bz, /^cadava berries$/i, 8)) return true;
      }
      return has(sdk, /^cadava berries$/i);
    });

    const juliet1 = () => step(c, 'Romeo & Juliet', 'juliet-start', async () => {
      if (has(sdk, /^message$/i) || has(sdk, /^cadava potion$/i)) return true;
      if (lvl(sdk) === 0) {
        await walkToVarrock(c, 3163, 3441);
        if (!(await julietStairs(c, 1))) return false;
      }
      const w = await bot.walkTo(3158, 3426, 2);
      if (!w?.success) { await openNearbyDoors(c, 3158, 3426, 2); await bot.walkTo(3158, 3426, 2); }
      if (!(await talk(c, /^juliet$/i, [/i guess i could find him/i, /certainly/i]))) return false;
      const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
      if (/cold crypt for ages/i.test(recent)) { alreadyComplete = true; await julietStairs(c, 0); return true; }
      if (/have you seen romeo\? he will reward you/i.test(recent)) { gavePotion = true; await julietStairs(c, 0); return true; }
      const got = await waitInv(sdk, /^message$/i, 3000);
      await julietStairs(c, 0);
      return got || /father lawrence|apothecary|potion made for you/i.test(recent);
    });

    const romeo1 = () => step(c, 'Romeo & Juliet', 'romeo-message', async () => {
      if (alreadyComplete || gavePotion || !has(sdk, /^message$/i)) return true;
      if (!(await julietStairs(c, 0))) return false;
      await bot.walkTo(3211, 3425, 3);
      if (!(await talk(c, /^romeo$/i))) return false;
      return waitCond(() => !has(sdk, /^message$/i), 4000);
    });

    const lawrence = () => step(c, 'Romeo & Juliet', 'father-lawrence', async () => {
      if (alreadyComplete || gavePotion || has(sdk, /^cadava potion$/i)) return true;
      if (!(await julietStairs(c, 0))) return false;
      const w = await bot.walkTo(3254, 3475, 3);
      if (!w?.success) { await openNearbyDoors(c, 3254, 3475, 2); await bot.walkTo(3254, 3475, 3); }
      return talk(c, /^father lawrence$/i);
    });

    const apothecary = () => step(c, 'Romeo & Juliet', 'apothecary', async () => {
      if (alreadyComplete || gavePotion || has(sdk, /^cadava potion$/i)) return true;
      if (!(await julietStairs(c, 0))) return false;
      for (let round = 0; round < 3 && !has(sdk, /^cadava potion$/i); round++) {
        const w = await bot.walkTo(3195, 3404, 2);
        if (!w?.success) { await openNearbyDoors(c, 3195, 3404, 2); await bot.walkTo(3195, 3404, 2); }
        await talk(c, /^apothecary$/i);
        await sleep(600);
      }
      return waitInv(sdk, /^cadava potion$/i, 4000);
    });

    const juliet2 = () => step(c, 'Romeo & Juliet', 'juliet-potion', async () => {
      if (alreadyComplete || gavePotion) return true;
      if (lvl(sdk) === 0) {
        await bot.walkTo(3163, 3441, 2);
        if (!(await julietStairs(c, 1))) return false;
      }
      const w = await bot.walkTo(3158, 3426, 2);
      if (!w?.success) { await openNearbyDoors(c, 3158, 3426, 2); await bot.walkTo(3158, 3426, 2); }
      if (!(await talk(c, /^juliet$/i))) return false;
      const ok = await waitCond(() => !has(sdk, /^cadava potion$/i), 4000);
      await julietStairs(c, 0);
      return ok;
    });

    const finish = () => step(c, 'Romeo & Juliet', 'finish', async () => {
      if (alreadyComplete) return true;
      if (!(await julietStairs(c, 0))) return false;
      await bot.walkTo(3211, 3425, 3);
      if (!(await talk(c, /^romeo$/i))) return false;
      const done = await waitCond(() => {
        const s = sdk.getState();
        const msgs = (s?.gameMessages ?? []).map((m: any) => m.text).join(' ');
        const recent = (s?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
        return !!s?.modalOpen || /quest complete/i.test(msgs) || /cousin and i are getting on well/i.test(recent);
      }, 6000);
      await bot.closeInterface();
      return done;
    });

    return (await juliet1()) && (await berries()) && (await romeo1()) && (await lawrence()) && (await apothecary()) && (await juliet2()) && (await finish());
  },
};

export const runemysteries: Quest = {
  name: 'Rune Mysteries',
  async run(c: Ctx) {
    const { bot, sdk } = c;
    let alreadyComplete = false;

    const enterSedridorRoom = async () => {
      if (!(await wizardsTowerBasement(c, true))) return false;
      const p = sdk.getState()?.player;
      if (!p || p.worldZ > 9575 || p.worldX > 3107) {
        let w = await bot.walkTo(3104, 9571, 2);
        if (!w?.success) {
          await bot.walkTo(3109, 9571, 2);
          await openNearbyDoors(c, 3108, 9570, 2);
          w = await bot.walkTo(3104, 9571, 2);
        }
      }
      return true;
    };

    const finish = () => step(c, 'Rune Mysteries', 'finish', async () => {
      if (alreadyComplete) return true;
      if ((sdk.getState()?.player?.worldZ ?? 0) > 3300 && (sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        if (!(await walkFromVarrockToLumbridge(c, 3109, 3167))) return false;
      }
      if (!(await enterSedridorRoom())) return false;
      if (!(await talk(c, /^sedridor$/i))) return false;
      const done = await waitCond(() => !has(sdk, /^notes$/i) && has(sdk, /^air talisman$/i), 6000);
      await bot.closeInterface();
      await wizardsTowerBasement(c, false);
      return done;
    });

    return await finish();
  },
};

await runQuests('bots/bot4', [romeojuliet, runemysteries]);

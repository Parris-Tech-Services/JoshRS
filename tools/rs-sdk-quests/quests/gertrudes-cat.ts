import {
  Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, bankJunk, withdrawFromDraynorBank,
  walkToVarrock, walkFromVarrockToLumbridge, exitWizardsTowerGround
} from '../quest-kit';

const N = "Gertrude's Cat";
const KEEP_RE = /^(coins|bucket|bucket of milk|raw sardine|doogle leaves|seasoned sardine|fluffs' kitten|kittens|silverlight|bronze sword|wooden shield|shrimps|bread|cabbage|trout|salmon|lobster)$/i;

export const fluffs: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    let started = false;
    let paidBoy = false;
    let fluffsRescued = false;
    let questComplete = false;

    const hasKitten = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 1554 || /kitten/i.test(i.name));

    const prepAndStart = () => step(c, N, 'prep-items-and-start', async () => {
      if (questComplete || fluffsRescued || paidBoy) return true;
      await exitWizardsTowerGround(c);

      if (!has(sdk, /^raw sardine|seasoned sardine$/i) || !has(sdk, /^bucket of milk$/i)) {
        if ((sdk.getState()?.player?.worldZ ?? 0) >= 3350) {
          await walkFromVarrockToLumbridge(c);
        }
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [
          /^coins$/i, /^bucket$/i, /^bucket of milk$/i, /^raw sardine$/i, /^doogle leaves$/i, /^seasoned sardine$/i,
        ]);

        while (count(sdk, /^coins$/i) < 120) {
          await bot.walkTo(3100, 3250, 4);
          const npc = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^(man|woman)$/i.test(n.name) && n.combatLevel <= 4 && n.reachable !== false);
          if (npc) await bot.pickpocketNpc(npc);
          await sleep(600);
        }

        if (!has(sdk, /^raw sardine|seasoned sardine$/i)) {
          const wg = await bot.walkTo(3014, 3224, 2);
          if (!wg?.success) { await openNearbyDoors(c, 3016, 3224, 3); await bot.walkTo(3014, 3224, 2); }
          for (let i = 0; i < 3 && !has(sdk, /^raw sardine$/i); i++) {
            const o = await bot.openShop(/^gerrant$/i);
            if (o?.success) {
              await bot.buyFromShop(/^raw sardine$/i, 1);
              await bot.closeShop();
            }
            await sleep(500);
          }
          if (!has(sdk, /^raw sardine$/i)) return false;
        }

        if (!has(sdk, /^bucket of milk$/i)) {
          if (!has(sdk, /^bucket$/i)) {
            await bot.walkTo(3216, 3291, 2);
            if (!(await pickupWithWait(c, 3216, 3291, /^bucket$/i, 15))) return false;
          }
          const wc = await bot.walkTo(3253, 3272, 2);
          if (!wc?.success) { await openNearbyDoors(c, 3253, 3266, 2); await bot.walkTo(3253, 3272, 2); }
          const cow = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^cow$/i.test(n.name));
          if (cow) {
            await bot.useItemOnNpc(/^bucket$/i, cow);
          } else {
            await bot.useItemOnLoc(/^bucket$/i, /dairy cow/i);
          }
          if (!(await waitInv(sdk, /^bucket of milk$/i, 6000))) return false;
        }
      }

      // Walk to Gertrude's house (3151, 3410)
      if ((sdk.getState()?.player?.worldZ ?? 0) < 3350) {
        if (!(await walkToVarrock(c, 3152, 3399))) return false;
      } else {
        await bot.walkTo(3152, 3399, 2);
      }

      if (!has(sdk, /^seasoned sardine$/i)) {
        if (!has(sdk, /^doogle leaves$/i)) {
          if (!(await pickupWithWait(c, 3152, 3399, /^doogle leaves$/i, 15))) return false;
        }
        const dl = sdk.findInventoryItem(/^doogle leaves$/i);
        const rs = sdk.findInventoryItem(/^raw sardine$/i);
        if (dl && rs) {
          await sdk.sendUseItemOnItem(dl.slot, rs.slot);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 3000, 250)) {
            await chat(c);
          }
          await waitInv(sdk, /^seasoned sardine$/i, 4000);
        }
        if (!has(sdk, /^seasoned sardine$/i)) return false;
      }

      const wg2 = await bot.walkTo(3151, 3410, 2);
      if (!wg2?.success) { await openNearbyDoors(c, 3151, 3412, 3); await bot.walkTo(3151, 3410, 2); }
      if (!(await talk(c, /^gertrude$/i, [/well, i suppose i could/i]))) return false;
      started = true;

      await bot.walkTo(3221, 3434, 3);
      if (!(await talk(c, /^(shilop|wilough)$/i, [/what will make you tell me/i, /okay then, i'll pay/i]))) return false;
      paidBoy = true;
      return paidBoy;
    });

    const rescueFluffs = () => step(c, N, 'lumber-yard-rescue', async () => {
      if (questComplete || fluffsRescued) return true;

      const inYard = () =>
        (sdk.getState()?.player?.worldX ?? 0) >= 3294 &&
        (sdk.getState()?.player?.worldZ ?? 0) >= 3493;

      const climbYardFence = async (enter: boolean) => {
        for (let i = 0; i < 4 && inYard() !== enter; i++) {
          if (enter) await bot.walkTo(3305, 3492, 0);
          else await bot.walkTo(3305, 3493, 0);
          const fence = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2618 || /broken fence/i.test(l.name));
          if (fence) await bot.interactLoc(fence, /climb-?over/i);
          if (await waitCond(() => inYard() === enter, 5000, 250)) break;
        }
        return inYard() === enter;
      };

      const climbYardLadder = async (targetLvl: 0 | 1) => {
        for (let i = 0; i < 4 && lvl(sdk) !== targetLvl; i++) {
          await bot.walkTo(3310, 3509, 1);
          const ladId = targetLvl === 1 ? 1747 : 1746;
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === ladId && Math.hypot(l.x - 3310, l.z - 3509) <= 2);
          if (lad) await bot.interactLoc(lad, targetLvl === 1 ? /climb-?up/i : /climb-?down/i);
          else await bot.interactLoc(/^ladder$/i, targetLvl === 1 ? /climb-?up/i : /climb-?down/i);
          if (await waitCond(() => lvl(sdk) === targetLvl, 5000, 250)) break;
        }
        return lvl(sdk) === targetLvl;
      };

      if (lvl(sdk) === 0 && !inYard()) {
        await bot.walkTo(3275, 3440, 3);
        await bot.walkTo(3305, 3492, 1);
        if (!(await climbYardFence(true))) return false;
      }

      if (has(sdk, /^bucket of milk$/i) || has(sdk, /^seasoned sardine$/i)) {
        if (!(await climbYardLadder(1))) return false;
        await bot.walkTo(3306, 3512, 2);
        const cat = () => (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 759 || /gertrude's cat/i.test(n.name));

        if (has(sdk, /^bucket of milk$/i)) {
          const ct = cat();
          if (ct) await bot.useItemOnNpc(/^bucket of milk$/i, ct);
          await waitCond(() => !has(sdk, /^bucket of milk$/i), 5000, 250);
          await sleep(800);
        }

        if (has(sdk, /^seasoned sardine$/i)) {
          const ct = cat();
          if (ct) await bot.useItemOnNpc(/^seasoned sardine$/i, ct);
          await waitCond(() => !has(sdk, /^seasoned sardine$/i), 5000, 250);
          await sleep(800);
        }

        if (!(await climbYardLadder(0))) return false;
      }

      if (!hasKitten()) {
        if (lvl(sdk) > 0) await climbYardLadder(0);
        const crateCoords: [number, number][] = [
          [3305, 3500],
          [3310, 3499],
          [3307, 3507],
          [3303, 3506],
          [3298, 3514],
          [3311, 3511],
        ];
        for (const [cx, cz] of crateCoords) {
          if (hasKitten()) break;
          await bot.walkTo(cx, cz, 1);
          const crateNpc = (sdk.getState()?.nearbyNpcs ?? [])
            .filter((n: any) => n.id === 767 && Math.hypot(n.x - cx, n.z - cz) <= 2)
            .sort((a: any, b: any) => a.distance - b.distance)[0];
          if (crateNpc) {
            await sdk.sendInteractNpc(crateNpc.index, 1);
            await waitCond(() => hasKitten() || !!sdk.getState()?.dialog?.isOpen, 5000, 300);
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }
        if (!hasKitten()) return false;
      }

      if (hasKitten()) {
        if (!(await climbYardLadder(1))) return false;
        await bot.walkTo(3306, 3512, 2);
        const ct = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 759 || /gertrude's cat/i.test(n.name));
        const kt = (sdk.getInventory() ?? []).find((i: any) => i.id === 1554 || /kitten/i.test(i.name));
        if (ct && kt) {
          await sdk.sendUseItemOnNpc(kt.slot, ct.index);
          await waitCond(() => !hasKitten(), 8000, 300);
          await sleep(4000);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        if (hasKitten()) return false;
        fluffsRescued = true;
        await climbYardLadder(0);
      }

      await climbYardFence(false);
      return fluffsRescued;
    });

    const finish = () => step(c, N, 'finish-gertrude', async () => {
      if (questComplete) return true;
      await bot.walkTo(3275, 3440, 3);
      const wg = await bot.walkTo(3151, 3410, 2);
      if (!wg?.success) { await openNearbyDoors(c, 3151, 3412, 3); await bot.walkTo(3151, 3410, 2); }
      const cookBefore = xp(sdk, 'Cooking');
      await talk(c, /^gertrude$/i, undefined, 20);
      const done = await waitCond(() => xp(sdk, 'Cooking') > cookBefore, 8000, 300);
      await bot.closeInterface();
      questComplete = done;
      return done;
    });

    return (await prepAndStart()) && (await rescueFluffs()) && (await finish());
  },
};

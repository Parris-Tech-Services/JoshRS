import { Ctx, Quest, has, count, sleep, talk, chat, waitInv, waitCond, step, openNearbyDoors } from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Sheep Herder';

const SHEEP_DEFS = [
  { id: 292, boneId: 280, startX: 2610, startZ: 3344, wps: [[2593, 3347], [2593, 3361]] as [number, number][] },
  { id: 293, boneId: 281, startX: 2622, startZ: 3367, wps: [[2606, 3367], [2593, 3366], [2593, 3362]] as [number, number][] },
  { id: 294, boneId: 282, startX: 2561, startZ: 3389, wps: [[2576, 3378], [2592, 3366], [2593, 3362]] as [number, number][] },
  { id: 295, boneId: 283, startX: 2611, startZ: 3391, wps: [[2595, 3375], [2593, 3366], [2593, 3362]] as [number, number][] },
];

function inPen(x: number, z: number): boolean {
  return x >= 2595 && x <= 2609 && z >= 3351 && z <= 3364;
}

function inGateZone(x: number, z: number): boolean {
  return x >= 2592 && x <= 2594 && z >= 3360 && z <= 3363;
}

async function crossPenGate(c: Ctx, intoPen: boolean): Promise<boolean> {
  const { bot, sdk } = c;
  for (let i = 0; i < 4; i++) {
    const p = sdk.getState()?.player;
    if (p && inPen(p.worldX, p.worldZ) === intoPen) return true;
    await bot.walkTo(intoPen ? 2593 : 2595, 3361, 1);
    const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 166 || l.id === 167);
    if (gate) {
      await bot.interactLoc(gate, /^open$/i);
      await waitCond(() => {
        const cur = sdk.getState()?.player;
        return !!cur && inPen(cur.worldX, cur.worldZ) === intoPen;
      }, 4000, 300);
      await chat(c);
    }
  }
  const p = sdk.getState()?.player;
  return !!p && inPen(p.worldX, p.worldZ) === intoPen;
}

export const sheepherder: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;

    const startAndGear = () => step(c, N, 'start-and-gear', async () => {
      await walkToKandarin(c, 2617, 3299);
      if (!has(sdk, /^feed$/i)) {
        await bot.walkTo(2617, 3299, 2);
        await talk(c, /^councillor halgrive$/i, [/what's wrong/i, /i can do that for you/i]);
      }

      const wearingSuit = () => {
        const eq = sdk.getState()?.equipment ?? [];
        return eq.some((e: any) => /^plague jacket$/i.test(e.name)) && eq.some((e: any) => /^plague trousers$/i.test(e.name));
      };

      if (!wearingSuit() && (!has(sdk, /^plague jacket$/i) || !has(sdk, /^plague trousers$/i))) {
        if (count(sdk, /^coins$/i) < 100) {
          await bot.walkTo(2615, 3332, 2);
          const ob = await bot.openBank();
          if (ob?.success) {
            const bc = sdk.findBankItem(/^coins$/i);
            if (bc) await sdk.sendBankWithdraw(bc.slot, 200);
            await sleep(500);
            await bot.closeBank();
          }
        }
        const wc = await bot.walkTo(2614, 3306, 2);
        if (!wc?.success) { await openNearbyDoors(c, 2614, 3304, 2); await bot.walkTo(2614, 3306, 2); }
        await talk(c, /^doctor orbon$/i, [/ok, i'll take it/i]);
      }

      if (has(sdk, /^plague jacket$/i)) await bot.equipItem(/^plague jacket$/i);
      if (has(sdk, /^plague trousers$/i)) await bot.equipItem(/^plague trousers$/i);

      const wearingProd = () => (sdk.getState()?.equipment ?? []).some((e: any) => /^prod$/i.test(e.name));
      if (!wearingProd() && !has(sdk, /^prod$/i)) {
        await crossPenGate(c, true);
        await bot.walkTo(2604, 3357, 2);
        for (let i = 0; i < 6 && !has(sdk, /^prod$/i); i++) {
          const g = (sdk.getState()?.groundItems ?? []).find((it: any) => it.id === 278 || /^prod$/i.test(it.name));
          if (g) {
            await bot.pickupItem(g);
            await waitInv(sdk, /^prod$/i, 3000);
          }
          await sleep(600);
        }
      }
      if (has(sdk, /^prod$/i)) await bot.equipItem(/^prod$/i);
      return wearingSuit() && wearingProd() && has(sdk, /^feed$/i);
    });

    const herdAndIncinerate = () => step(c, N, 'herd-and-incinerate', async () => {
      for (const sd of SHEEP_DEFS) {
        await crossPenGate(c, false);

        // Herd sheep into pen
        let wpIdx = 0;
        for (let iter = 0; iter < 90; iter++) {
          const inPenSheep = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
          if (inPenSheep) break;

          let sheep = (sdk.getState()?.nearbyNpcs ?? [])
            .filter((n: any) => n.id === sd.id && !inPen(n.x, n.z))
            .sort((a: any, b: any) => Math.hypot(a.x - 2593, a.z - 3361) - Math.hypot(b.x - 2593, b.z - 3361))[0];
          if (!sheep) {
            await bot.walkTo(sd.startX, sd.startZ, 3);
            await sleep(800);
            continue;
          }

          if (inGateZone(sheep.x, sheep.z)) {
            await sdk.sendInteractNpc(sheep.index, 1);
            await sleep(2500);
            await chat(c);
            const msgs = (sdk.getState()?.gameMessages ?? []).slice(-5).map((m: any) => m.text).join(' ');
            if (/already disposed/i.test(msgs)) break;
            continue;
          }

          while (wpIdx < sd.wps.length - 1 && Math.hypot(sheep.x - sd.wps[wpIdx][0], sheep.z - sd.wps[wpIdx][1]) <= 2) {
            wpIdx++;
          }
          const [tx, tz] = sd.wps[wpIdx];
          const dx = Math.sign(tx - sheep.x);
          const dz = Math.sign(tz - sheep.z);
          const bx = sheep.x - dx;
          const bz = sheep.z - dz;
          const p = sdk.getState()?.player;
          if (!p || Math.hypot(p.worldX - bx, p.worldZ - bz) > 8) {
            await bot.walkTo(bx, bz, 2);
          }
          await sdk.sendWalk(bx, bz, true);
          await sleep(950);
          const sNow = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === sheep.index) ?? sheep;
          await sdk.sendInteractNpc(sNow.index, 1);
          await sleep(1200);
          if (sdk.getState()?.dialog?.isOpen) {
            const dText = (sdk.getState()?.dialog?.options ?? []).map((o: any) => o.text).join(' ');
            await chat(c);
            if (/already disposed/i.test(dText)) break;
          }
        }

        // Poison sheep inside pen and incinerate its bones
        const inPenSheep = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
        if (inPenSheep) {
          await crossPenGate(c, true);
          for (let i = 0; i < 4; i++) {
            const target = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
            if (!target) break;
            const feed = sdk.findInventoryItem(/^feed$/i);
            if (!feed) break;
            await bot.walkTo(target.x, target.z, 1);
            await sdk.sendUseItemOnNpc(feed.slot, target.index);
            await sleep(1200);
            await chat(c);
            await sleep(2200);
          }

          for (let i = 0; i < 8 && !(sdk.getState()?.inventory ?? []).some((it: any) => it.id === sd.boneId); i++) {
            const gb = (sdk.getState()?.groundItems ?? []).find((it: any) => it.id === sd.boneId);
            if (gb) {
              await bot.pickupItem(gb);
              await sleep(1000);
            } else {
              await sleep(600);
            }
          }

          const boneInv = (sdk.getState()?.inventory ?? []).find((it: any) => it.id === sd.boneId);
          if (boneInv) {
            await bot.walkTo(2606, 3360, 2);
            const furn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 165 || /^furnace$/i.test(l.name));
            if (furn) {
              await sdk.sendUseItemOnLoc(boneInv.slot, furn.x, furn.z, furn.id);
              await waitCond(() => !(sdk.getState()?.inventory ?? []).some((it: any) => it.id === sd.boneId), 6000, 300);
            }
          }
        }
      }
      await crossPenGate(c, false);
      return true;
    });

    const finishHalgrive = () => step(c, N, 'finish-halgrive', async () => {
      const before = count(sdk, /^coins$/i);
      await bot.walkTo(2617, 3299, 2);
      await talk(c, /^councillor halgrive$/i);
      await bot.dismissBlockingUI();
      return count(sdk, /^coins$/i) >= before + 3000;
    });

    return (await startAndGear()) && (await herdAndIncinerate()) && (await finishHalgrive());
  },
};

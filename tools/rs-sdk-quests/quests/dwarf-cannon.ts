import { Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step, openNearbyDoors } from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Dwarf Cannon';

const RAILINGS: [number, number, number][] = [
  [15, 2556, 3475],
  [16, 2558, 3472],
  [17, 2557, 3464],
  [18, 2559, 3462],
  [19, 2564, 3460],
  [20, 2572, 3460],
];

export const mcannon: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const startXp = xp(sdk, 'Crafting');

    const startAndFixRailings = () => step(c, N, 'start-and-fix-railings', async () => {
      await walkToKandarin(c, 2571, 3463);
      if (!has(sdk, /^railing$/i)) {
        await bot.walkTo(2571, 3463, 2);
        await talk(c, /^dwarf commander$/i, [/yeah, i'd love to help/i]);
      }

      for (const [locId, rx, rz] of RAILINGS) {
        if (!has(sdk, /^railing$/i)) break;
        await bot.walkTo(rx, rz + 1, 1);
        for (let attempt = 0; attempt < 8 && has(sdk, /^railing$/i); attempt++) {
          const before = count(sdk, /^railing$/i);
          const rl = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === locId);
          if (!rl) break;
          await bot.interactLoc(rl, /^inspect$/i);
          await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.gameMessages ?? []).slice(-3).some((m: any) => /already fixed/i.test(m.text)), 5000, 300);
          const msgs = (sdk.getState()?.gameMessages ?? []).slice(-4).map((m: any) => m.text).join(' ');
          if (/already fixed/i.test(msgs)) break;
          await chat(c, [/try to replace the railing/i]);
          if (await waitCond(() => count(sdk, /^railing$/i) < before, 4500, 300)) break;
        }
      }

      await bot.walkTo(2571, 3463, 2);
      await talk(c, /^dwarf commander$/i);
      return true;
    });

    const watchTowerRemains = () => step(c, N, 'watch-tower-remains', async () => {
      if (!has(sdk, /^dwarf remains$/i)) {
        await bot.walkTo(2570, 3441, 2);
        for (let i = 0; i < 3 && lvl(sdk) === 0; i++) {
          const l0 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 && Math.hypot(l.x - 2570, l.z - 3441) <= 3);
          if (l0) await bot.interactLoc(l0, /climb-?up/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
          if (await waitCond(() => lvl(sdk) === 1, 4500, 300)) break;
        }
        if (lvl(sdk) !== 1) return false;

        for (let i = 0; i < 3 && lvl(sdk) === 1; i++) {
          await bot.walkTo(2570, 3443, 1);
          const l1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 && Math.hypot(l.x - 2570, l.z - 3443) <= 3);
          if (l1) await bot.interactLoc(l1, /climb-?up/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
          if (await waitCond(() => lvl(sdk) === 2, 4500, 300)) break;
        }
        if (lvl(sdk) !== 2) return false;

        await bot.walkTo(2567, 3444, 1);
        for (let i = 0; i < 6 && !has(sdk, /^dwarf remains$/i); i++) {
          const gr = (sdk.getState()?.groundItems ?? []).find((it: any) => it.id === 0 || /^dwarf remains$/i.test(it.name));
          if (gr) {
            await bot.pickupItem(gr);
            await waitInv(sdk, /^dwarf remains$/i, 3000);
          }
          await sleep(600);
        }

        for (let i = 0; i < 3 && lvl(sdk) === 2; i++) {
          await bot.walkTo(2570, 3443, 1);
          const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746);
          if (d2) await bot.interactLoc(d2, /climb-?down/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?down/i);
          if (await waitCond(() => lvl(sdk) === 1, 4500, 300)) break;
        }
        for (let i = 0; i < 3 && lvl(sdk) === 1; i++) {
          await bot.walkTo(2570, 3441, 1);
          const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746);
          if (d1) await bot.interactLoc(d1, /climb-?down/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?down/i);
          if (await waitCond(() => lvl(sdk) === 0, 4500, 300)) break;
        }
      }

      await bot.walkTo(2571, 3463, 2);
      await talk(c, /^dwarf commander$/i);
      return !has(sdk, /^dwarf remains$/i);
    });

    const rescueLollk = () => step(c, N, 'rescue-lollk', async () => {
      if (has(sdk, /^tool kit$/i)) return true;
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        await bot.walkTo(2600, 3420, 3);
        await bot.walkTo(2622, 3392, 2);
        for (let i = 0; i < 3 && (sdk.getState()?.player?.worldZ ?? 0) < 9000; i++) {
          const cave = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2 || /^cave entrance$/i.test(l.name));
          if (cave) await bot.interactLoc(cave, /^enter$/i);
          if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 300)) break;
        }
      }
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) return false;

      // Walk through cave to Lollk's crate at (2571, 9850)
      await bot.walkTo(2595, 9825, 3);
      await bot.walkTo(2571, 9850, 2);
      for (let i = 0; i < 3; i++) {
        const cr = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1);
        if (cr) {
          await bot.interactLoc(cr, /^search$/i);
          await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250);
          await chat(c);
          await sleep(2500);
          break;
        }
        await sleep(600);
      }

      // Exit cave via Mud pile at (2621, 9796)
      await bot.walkTo(2595, 9825, 3);
      await bot.walkTo(2621, 9796, 2);
      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldZ ?? 0) > 9000; i++) {
        const mud = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 13 || /^mud pile$/i.test(l.name));
        if (mud) await bot.interactLoc(mud, /climb-?over/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) < 9000, 5000, 300)) break;
      }

      await bot.walkTo(2600, 3420, 3);
      await bot.walkTo(2571, 3463, 2);
      await talk(c, /^dwarf commander$/i, [/ok, i'll see what i can do/i]);
      return has(sdk, /^tool kit$/i);
    });

    const repairCannonAndNulodion = () => step(c, N, 'repair-cannon-and-nulodion', async () => {
      await bot.walkTo(2575, 3461, 1);
      const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 4);
      if (d) { await bot.interactLoc(d, /^open$/i); await sleep(900); }
      await sdk.sendWalk(2576, 3461, true);
      await sleep(1000);

      const inspectCannon = async (want: RegExp[] = []) => {
        const can = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 5 || /^broken multicannon$/i.test(l.name));
        if (!can) return;
        await bot.interactLoc(can, /^inspect$/i);
        await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4500, 250);
        await chat(c, want);
        await sleep(2200);
      };

      // 1st inspect sets %mcannon = ^mcannon_inspected_cannon_first_time
      await inspectCannon();

      for (const partRe of [/^pipe$/i, /^barrel$/i, /^axle$/i, /^shaft$/i]) {
        for (let attempt = 0; attempt < 5; attempt++) {
          await inspectCannon([partRe]);
          const msgs = (sdk.getState()?.gameMessages ?? []).slice(-4).map((m: any) => m.text).join(' ');
          if (/manage to fix it|already fixed this part/i.test(msgs)) break;
        }
      }

      // Final inspect sets %mcannon = ^mcannon_has_repaired_cannon
      await inspectCannon([/^none$/i]);

      const dOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 4);
      if (dOut) { await bot.interactLoc(dOut, /^open$/i); await sleep(900); }
      await bot.walkTo(2571, 3463, 2);
      await talk(c, /^dwarf commander$/i, [/ok then, just for you/i]);

      // Walk to Nulodion at (3011, 3453) south of Ice Mountain
      await bot.walkTo(2605, 3420, 3);
      await bot.walkTo(2655, 3439, 3);
      await bot.walkTo(2715, 3472, 3);
      await bot.walkTo(2775, 3452, 3);
      await bot.walkTo(2820, 3436, 3);
      await bot.walkTo(2862, 3428, 3);
      await bot.walkTo(2876, 3462, 3);
      await bot.walkTo(2877, 3510, 3);
      await bot.walkTo(2905, 3512, 3);
      await bot.walkTo(2945, 3450, 3);
      await bot.walkTo(3015, 3453, 2);
      const nd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 3);
      if (nd) { await bot.interactLoc(nd, /^open$/i); await sleep(900); }
      await bot.walkTo(3012, 3453, 1);
      await talk(c, /^nulodion$/i);
      if (!has(sdk, /^ammo mould$/i)) return false;

      // Walk back to Dwarf Commander at (2571, 3463)
      const nd2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 3);
      if (nd2) { await bot.interactLoc(nd2, /^open$/i); await sleep(900); }
      await walkToKandarin(c, 2571, 3463);
      await bot.walkTo(2571, 3463, 2);
      await talk(c, /^dwarf commander$/i);
      await bot.dismissBlockingUI();
      return xp(sdk, 'Crafting') > startXp;
    });

    return (await startAndFixRailings()) && (await watchTowerRemains()) && (await rescueLollk()) && (await repairCannonAndNulodion());
  },
};

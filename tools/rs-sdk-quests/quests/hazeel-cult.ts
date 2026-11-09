import {
  Ctx, Quest, has, xp, lvl, sleep, talk, chat, waitInv, waitCond, step,
  openNearbyDoors
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Hazeel Cult';

export const hazeelcult: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    let started = false;
    let poisoned = false;
    let alomoneSpoken = false;
    let needValves = false;
    let questComplete = false;

    const inCave = () => (sdk.getState()?.player?.worldZ ?? 0) > 9600;
    const inBasement = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldZ >= 9664 && p.worldZ <= 9676 && p.worldX >= 2562 && p.worldX <= 2574;
    };

    const enterCave = async () => {
      for (let i = 0; i < 4 && !inCave(); i++) {
        await bot.walkTo(2586, 3234, 1);
        const cv = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2852);
        if (cv) await bot.interactLoc(cv, /enter/i);
        if (await waitCond(() => inCave(), 5000, 250)) break;
      }
      return inCave();
    };

    const exitCave = async () => {
      for (let i = 0; i < 4 && inCave(); i++) {
        if ((sdk.getState()?.player?.worldX ?? 2570) > 2580) {
          await bot.walkTo(2606, 9692, 1);
          const raft = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2849);
          if (raft) await bot.interactLoc(raft, /board/i);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 2606) < 2580, 5000, 250);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
        }
        await bot.walkTo(2570, 9682, 1);
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2853);
        if (st) await bot.interactLoc(st, /climb/i);
        if (await waitCond(() => !inCave(), 5000, 250)) break;
      }
      return !inCave();
    };

    const untrapCarnilleanDoor = async () => {
      const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1534 && l.x === 2573 && l.z === 3270);
      if (d) {
        await sdk.sendInteractLoc(d.x, d.z, d.id, 1);
        await sleep(1000);
      }
    };

    const startAndClivet = () => step(c, N, 'start-ceril-and-clivet', async () => {
      if (questComplete || poisoned || alomoneSpoken || has(sdk, /^poison|mark of hazeel|hazeel's mark|carnillean key|chest key|key|hazeel scroll|scroll of hazeel$/i)) return true;
      await untrapCarnilleanDoor();
      if (!(await walkToKandarin(c, 2566, 3271))) return false;
      const wc = await bot.walkTo(2566, 3271, 1);
      if (!wc?.success) {
        await openNearbyDoors(c, 2569, 3273, 1);
        await openNearbyDoors(c, 2567, 3271, 1);
        await bot.walkTo(2566, 3271, 1);
      }
      if (!(await talk(c, /^(sir )?ceril carnillean$/i, [
        /what's wrong/i,
        /yes, of course, i'd be happy to help/i,
      ], 20))) return false;
      started = true;

      if (!(await enterCave())) return false;
      await talk(c, /^clivet$/i, [
        /what do you mean/i,
        /so what would i have to do/i,
        /ok, count me in/i,
      ], 25);
      const gotPoison = await waitInv(sdk, /^poison$/i, 4000);
      await exitCave();
      return gotPoison;
    });

    const poisonAndValves = () => step(c, N, 'poison-and-valves', async () => {
      if (questComplete || alomoneSpoken || has(sdk, /^hazeel scroll|scroll of hazeel$/i) || (!needValves && has(sdk, /^mark of hazeel|hazeel's mark$/i) && has(sdk, /^chest key|carnillean key|key$/i))) return true;
      needValves = false;
      if (inCave() && !inBasement()) await exitCave();
      await untrapCarnilleanDoor();

      if (!poisoned && has(sdk, /^poison$/i)) {
        const wl = await bot.walkTo(2570, 3268, 1);
        if (!wl?.success) {
          await openNearbyDoors(c, 2569, 3273, 1);
          await openNearbyDoors(c, 2570, 3271, 1);
          await bot.walkTo(2570, 3268, 1);
        }
        for (let i = 0; i < 3 && !inBasement(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754);
          if (lad) await bot.interactLoc(lad, /climb-?down/i);
          if (await waitCond(() => inBasement(), 5000, 250)) break;
        }
        if (!inBasement()) return false;

        // Grab chest key from crate (2858 at 2571, 9669)
        if (!has(sdk, /chest key|carnillean key|^key$/i)) {
          await bot.walkTo(2571, 9670, 1);
          const cr = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2858);
          if (cr) await bot.interactLoc(cr, /search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) await chat(c);
        }

        // Pour poison on range (2859 at 2564, 9672)
        await bot.walkTo(2565, 9672, 1);
        const rng = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2859);
        if (rng) await bot.useItemOnLoc(/^poison$/i, rng);
        await waitCond(() => !has(sdk, /^poison$/i), 5000, 250);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        poisoned = !has(sdk, /^poison$/i);

        await bot.walkTo(2570, 9668, 1);
        for (let i = 0; i < 3 && inBasement(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (lad) await bot.interactLoc(lad, /climb-?up/i);
          if (await waitCond(() => !inBasement(), 5000, 250)) break;
        }
      }

      if (!has(sdk, /mark of hazeel|hazeel's mark/i)) {
        if (!(await enterCave())) return false;
        await talk(c, /^clivet$/i, undefined, 20);
        await exitCave();
      }

      // First try boarding the raft in case valves are already set
      let reachedAlomoneIsland = false;
      if (await enterCave()) {
        await bot.walkTo(2568, 9679, 1);
        const raft0 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2849);
        if (raft0) await bot.interactLoc(raft0, /board/i);
        reachedAlomoneIsland = await waitCond(() => (sdk.getState()?.player?.worldX ?? 2568) > 2595, 5000, 250);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (!reachedAlomoneIsland) {
          await exitCave();
        }
      }

      if (!reachedAlomoneIsland) {
        // Turn all 5 sewer valves
        const valves: [number, number, number, number][] = [
          [2844, 2562, 3247, 2],
          [2845, 2572, 3263, 2],
          [2846, 2585, 3245, 1],
          [2847, 2597, 3263, 2],
          [2848, 2609, 3243, 2],
        ];
        for (const [vid, vx, vz, op] of valves) {
          await bot.walkTo(vx, vz, 2);
          const vLoc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === vid);
          if (vLoc) {
            await sdk.sendInteractLoc(vLoc.x, vLoc.z, vLoc.id, op);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
              await chat(c);
            }
          }
        }

        if (!(await enterCave())) return false;
        await bot.walkTo(2568, 9679, 1);
        const raft = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2849);
        if (raft) await bot.interactLoc(raft, /board/i);
        if (!(await waitCond(() => (sdk.getState()?.player?.worldX ?? 2568) > 2595, 5000, 250))) return false;
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }

      await bot.walkTo(2607, 9672, 2);
      await talk(c, /^alomone$/i, undefined, 20);
      alomoneSpoken = true;
      await exitCave();
      return true;
    });

    const scrollAndFinish = () => step(c, N, 'scroll-and-resurrect', async () => {
      if (questComplete) return true;
      if (!has(sdk, /hazeel scroll|scroll of hazeel/i)) {
        if (inCave() && !inBasement()) await exitCave();
        if (!has(sdk, /chest key|carnillean key|^key$/i)) {
          await bot.walkTo(2570, 3267, 1);
          const ladD = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754);
          if (ladD) await bot.interactLoc(ladD, /climb-?down/i);
          await waitCond(() => inBasement(), 5000, 250);
          await bot.walkTo(2571, 9670, 1);
          const cr = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2858);
          if (cr) await bot.interactLoc(cr, /search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) await chat(c);
          await bot.walkTo(2570, 9668, 1);
          const ladU = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (ladU) await bot.interactLoc(ladU, /climb-?up/i);
          await waitCond(() => !inBasement(), 5000, 250);
        }

        if (lvl(sdk) === 0) {
          await untrapCarnilleanDoor();
          const ws = await bot.walkTo(2569, 3268, 1);
          if (!ws?.success) {
            await openNearbyDoors(c, 2569, 3273, 1);
            await openNearbyDoors(c, 2569, 3270, 1);
            await bot.walkTo(2569, 3268, 1);
          }
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1722);
          if (st) await bot.interactLoc(st, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 1, 5000, 250);
        }

        if (lvl(sdk) === 1) {
          await bot.walkTo(2572, 3270, 0);
          const wall = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2854);
          if (wall) await sdk.sendInteractLoc(wall.x, wall.z, wall.id, 1);
          const passed = await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3270) >= 3271, 4000, 250);
          if (!passed) {
            needValves = true;
            await bot.walkTo(2569, 3268, 1);
            const stD = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1723);
            if (stD) await bot.interactLoc(stD, /climb-?down/i);
            await waitCond(() => lvl(sdk) === 0, 5000, 250);
            return false;
          }
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747);
          if (lad) await bot.interactLoc(lad, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 2, 5000, 250);
        }

        if (lvl(sdk) === 2) {
          await sdk.sendWalk(2570, 3271, true);
          await sleep(1000);
          const shut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2856);
          const key = (sdk.getInventory() ?? []).find((i: any) => /chest key|carnillean key|key/i.test(i.name));
          if (shut && key) {
            await sdk.sendUseItemOnLoc(key.slot, shut.x, shut.z, shut.id);
            await waitCond(() => !!(sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2857), 5000, 250);
          }
          const openCh = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2857);
          if (openCh) {
            await sdk.sendInteractLoc(openCh.x, openCh.z, openCh.id, 1);
            await waitCond(() => has(sdk, /hazeel scroll|scroll of hazeel/i) || !!sdk.getState()?.dialog?.isOpen, 5000, 250);
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
            await waitCond(() => has(sdk, /hazeel scroll|scroll of hazeel/i), 3000, 250);
          }
          await sdk.sendWalk(2573, 3271, true);
          await sleep(800);
          const ladD = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746);
          if (ladD) await bot.interactLoc(ladD, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 1, 5000, 250);
        }

        if (lvl(sdk) === 1) {
          if ((sdk.getState()?.player?.worldZ ?? 3270) >= 3271) {
            await sdk.sendWalk(2572, 3271, true);
            await sleep(600);
            const wall = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2854);
            if (wall) await sdk.sendInteractLoc(wall.x, wall.z, wall.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 3271) <= 3270, 4000, 250);
          }
          await bot.walkTo(2569, 3268, 1);
          const stD = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1723);
          if (stD) await bot.interactLoc(stD, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 5000, 250);
        }
        if (!has(sdk, /hazeel scroll|scroll of hazeel/i)) return false;
      }

      if (!(await enterCave())) return false;
      await bot.walkTo(2568, 9679, 1);
      const raft = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2849);
      if (raft) await bot.interactLoc(raft, /board/i);
      await waitCond(() => (sdk.getState()?.player?.worldX ?? 2568) > 2595, 5000, 250);
      if (sdk.getState()?.dialog?.isOpen) await chat(c);

      await bot.walkTo(2607, 9672, 2);
      const thievBefore = xp(sdk, 'Thieving');
      await talk(c, /^alomone$/i, undefined, 32);
      const done = await waitCond(() => xp(sdk, 'Thieving') > thievBefore, 12_000, 400);
      await bot.closeInterface();
      await exitCave();
      questComplete = done;
      return done;
    });

    return (await startAndClivet()) && (await poisonAndValves()) && (await scrollAndFinish());
  },
};

import { Ctx, Quest, has, count, xp, lvl, sleep, talk, chat, waitInv, waitCond, step, lumbridgeStairs, openNearbyDoors, pickupWithWait, combineItems, bankJunk, withdrawFromDraynorBank, walkToVarrock, walkFromVarrockToLumbridge, draynorManorCrypt, exitWizardsTowerGround, runQuests } from './quest-kit';

const KEEP_RE = /^(coins|spade|fish food|poison|poisoned fish food|pressure gauge|key|rubber tube|oil can)$/i;
const FOOD_RE = /^(shrimps|bread|cooked meat|kebab|trout|salmon|cabbage)$/i;

export const haunted: Quest = {
  name: 'Ernest the Chicken',
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const N = 'Ernest the Chicken';
    let oddensteinSpoken = false;
    let questComplete = false;

    const walkInRoom = async (x: number, z: number, tol = 1, timeout = 5000) => {
      const p0 = sdk.getState()?.player;
      if (p0 && Math.hypot(p0.worldX - x, p0.worldZ - z) <= tol) return true;
      await sdk.sendWalk(x, z, true);
      return await waitCond(() => {
        const p = sdk.getState()?.player;
        return !!p && Math.hypot(p.worldX - x, p.worldZ - z) <= tol;
      }, timeout, 250);
    };

    const enterManorL0 = async () => {
      const p = sdk.getState()?.player;
      if (!p) return false;
      if (p.worldZ > 9000) return false;
      if (p.level === 0 && p.worldX >= 3097 && p.worldX <= 3122 && p.worldZ >= 3354 && p.worldZ <= 3370) {
        return true;
      }
      if (p.level === 0 && p.worldZ <= 3353) {
        await bot.walkTo(3108, 3352, 1);
        const front = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => (l.id === 134 || l.id === 135) && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
        if (front) {
          await bot.interactLoc(front, /^open$/i);
          if (await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3354, 5000, 300)) return true;
        }
      }
      const w = await bot.walkTo(3108, 3361, 2);
      if (!w?.success) {
        await openNearbyDoors(c, 3101, 3371, 2);
        await bot.walkTo(3108, 3361, 2);
      }
      return true;
    };

    const interactLocDirect = async (loc: any, optRe: RegExp) => {
      if (!loc) return false;
      const idx = (loc.optionsWithIndex ?? []).find((o: any) => optRe.test(o.text))?.opIndex ?? 1;
      await sdk.sendInteractLoc(loc.x, loc.z, loc.id, idx);
      return true;
    };

    const openDoorOnFloor = async (dx: number, dz: number) => {
      const d = (sdk.getState()?.nearbyLocs ?? []).find(
        (l: any) => Math.hypot(l.x - dx, l.z - dz) <= 1 && (l.options ?? []).some((o: string) => /^open$/i.test(o))
      );
      if (d) {
        await interactLocDirect(d, /^open$/i);
        await sleep(900);
      }
    };

    const climbManorTo = async (targetLvl: 0 | 1 | 2): Promise<boolean> => {
      for (let round = 0; round < 6 && lvl(sdk) !== targetLvl; round++) {
        const cur = lvl(sdk);
        if (cur === 0 && targetLvl > 0) {
          await enterManorL0();
          const w = await bot.walkTo(3109, 3361, 2);
          if (!w?.success) { await openNearbyDoors(c, 3109, 3358, 2); await bot.walkTo(3109, 3361, 2); }
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1730);
          await interactLocDirect(st, /(walk|climb)-?up/i);
          await waitCond(() => lvl(sdk) === 1, 6000, 350);
        } else if (cur === 1 && targetLvl === 2) {
          const p = sdk.getState()?.player;
          if (p && p.worldZ <= 3364) {
            await bot.walkTo(3109, 3366, 2);
          }
          await walkInRoom(3105, 3367, 1, 4000);
          await walkInRoom(3105, 3363, 1, 4000);
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1738);
          await interactLocDirect(st, /(walk|climb)-?up/i);
          await waitCond(() => lvl(sdk) === 2, 6000, 350);
        } else if (cur === 2 && targetLvl < 2) {
          const p = sdk.getState()?.player;
          if (p && p.worldX >= 3108) {
            await walkInRoom(3108, 3364, 1, 4000);
            await openDoorOnFloor(3108, 3364);
          }
          await walkInRoom(3105, 3364, 1, 4000);
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1740);
          await interactLocDirect(st, /(walk|climb)-?down/i);
          await waitCond(() => lvl(sdk) === 1, 6000, 350);
        } else if (cur === 1 && targetLvl === 0) {
          const p = sdk.getState()?.player;
          if (p && p.worldZ <= 3364) {
            await bot.walkTo(3109, 3366, 2);
          } else {
            await walkInRoom(3105, 3367, 1, 4000);
            await walkInRoom(3109, 3366, 1, 4000);
          }
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1731);
          await interactLocDirect(st, /(walk|climb)-?down/i);
          await waitCond(() => lvl(sdk) === 0, 6000, 350);
        }
      }
      return lvl(sdk) === targetLvl;
    };

    const pickupFishFoodL1 = async (): Promise<boolean> => {
      if (has(sdk, /^fish food|poisoned fish food|pressure gauge$/i)) return true;
      if (!(await climbManorTo(1))) return false;
      const w = await bot.walkTo(3108, 3356, 2);
      if (!w?.success) {
        await openNearbyDoors(c, 3110, 3358, 2);
        await bot.walkTo(3108, 3356, 2);
      }
      return await pickupWithWait(c, 3108, 3356, /^fish food$/i, 15);
    };

    const walkToOddensteinL2 = async () => {
      if (!(await climbManorTo(2))) return false;
      if ((sdk.getState()?.player?.worldX ?? 0) < 3108) {
        await walkInRoom(3107, 3364, 0, 4000);
        await openDoorOnFloor(3108, 3364);
      }
      await walkInRoom(3110, 3366, 2, 4000);
      return true;
    };

    const start = () => step(c, N, 'start-veronica-and-oddenstein', async () => {
      if (questComplete || oddensteinSpoken || has(sdk, /^pressure gauge|rubber tube|oil can$/i)) return true;
      await exitWizardsTowerGround(c);
      if (lvl(sdk) > 0 && (sdk.getState()?.player?.worldZ ?? 0) < 3350) await lumbridgeStairs(c, 0);
      if (lvl(sdk) === 0 && (sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        const p0 = sdk.getState()?.player;
        if (p0 && p0.worldX >= 2945 && p0.worldX <= 2956 && p0.worldZ >= 3447 && p0.worldZ <= 3454) {
          await openNearbyDoors(c, 2950, 3450, 2);
          await bot.walkTo(2965, 3385, 3);
          await bot.walkTo(3007, 3325, 3);
        }
        await bankJunk(c, KEEP_RE);
        await bot.walkTo(3110, 3330, 2);
        if (!(await talk(c, /^veronica$/i, [/aha, sounds like a quest/i]))) return false;
        const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
        if (/thank you for rescuing ernest/i.test(recent)) {
          questComplete = true;
          return true;
        }
      }
      if (!has(sdk, /^fish food|poisoned fish food|pressure gauge$/i)) {
        await pickupFishFoodL1();
      }
      if (!(await walkToOddensteinL2())) return false;
      if (!(await talk(c, /^professor oddenstein$/i, [/looking for a guy called ernest/i, /change him back this instant/i]))) return false;
      oddensteinSpoken = true;
      return true;
    });

    const gauge = () => step(c, N, 'pressure-gauge', async () => {
      if (questComplete || has(sdk, /^pressure gauge$/i)) return true;
      if (!has(sdk, /^poisoned fish food$/i)) {
        if (!has(sdk, /^fish food$/i)) {
          if (!(await pickupFishFoodL1())) return false;
        }
        if (!(await climbManorTo(0))) return false;
        if (!has(sdk, /^poison$/i)) {
          const wp = await bot.walkTo(3097, 3366, 2);
          if (!wp?.success) {
            await openNearbyDoors(c, 3103, 3363, 2);
            await openNearbyDoors(c, 3099, 3366, 2);
            await bot.walkTo(3097, 3366, 2);
          }
          if (!(await pickupWithWait(c, 3097, 3366, /^poison$/i, 15))) return false;
        }
        if (!(await combineItems(c, /^poison$/i, /^fish food$/i, /^poisoned fish food$/i))) return false;
      } else {
        if (!(await climbManorTo(0))) return false;
      }

      if (!has(sdk, /^spade|key|rubber tube$/i)) {
        const ws = await bot.walkTo(3120, 3359, 2);
        if (!ws?.success) {
          await openNearbyDoors(c, 3119, 3356, 2);
          await bot.walkTo(3120, 3359, 2);
        }
        await pickupWithWait(c, 3120, 3359, /^spade$/i, 15);
      }

      const wf = await bot.walkTo(3088, 3335, 2);
      if (!wf?.success) {
        await openNearbyDoors(c, 3123, 3360, 2);
        await openNearbyDoors(c, 3101, 3371, 2);
        await bot.walkTo(3088, 3335, 2);
      }
      if (has(sdk, /^poisoned fish food$/i)) {
        await bot.useItemOnLoc(/^poisoned fish food$/i, /^fountain$/i);
        await waitCond(() => !has(sdk, /^poisoned fish food$/i), 6000, 300);
        await sleep(3000);
      }
      for (let i = 0; i < 3 && !has(sdk, /^pressure gauge$/i); i++) {
        await bot.interactLoc(/^fountain$/i, /^search$/i);
        await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 3000, 250);
        await chat(c);
        if (await waitInv(sdk, /^pressure gauge$/i, 3000)) return true;
      }
      return has(sdk, /^pressure gauge$/i);
    });

    const tube = () => step(c, N, 'rubber-tube', async () => {
      if (questComplete || has(sdk, /^rubber tube$/i)) return true;
      if (!(await climbManorTo(0))) return false;
      if (!has(sdk, /^key$/i)) {
        if (!has(sdk, /^spade$/i)) {
          await enterManorL0();
          const ws = await bot.walkTo(3120, 3359, 2);
          if (!ws?.success) { await openNearbyDoors(c, 3119, 3356, 2); await bot.walkTo(3120, 3359, 2); }
          if (!(await pickupWithWait(c, 3120, 3359, /^spade$/i, 15))) return false;
        }
        const wc = await bot.walkTo(3086, 3361, 2);
        if (!wc?.success) {
          await openNearbyDoors(c, 3123, 3360, 2);
          await openNearbyDoors(c, 3101, 3371, 2);
          await bot.walkTo(3086, 3361, 2);
        }
        for (let i = 0; i < 3 && !has(sdk, /^key$/i); i++) {
          await bot.useItemOnLoc(/^spade$/i, /^compost heap$/i);
          if (await waitInv(sdk, /^key$/i, 5000)) break;
        }
        if (!has(sdk, /^key$/i)) return false;
      }

      await enterManorL0();
      const wd = await bot.walkTo(3107, 3367, 1);
      if (!wd?.success) {
        await openNearbyDoors(c, 3106, 3368, 2);
        await openNearbyDoors(c, 3103, 3363, 2);
        await bot.walkTo(3107, 3367, 1);
      }
      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldX ?? 0) < 3108; i++) {
        const cd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 131);
        if (cd) await bot.useItemOnLoc(/^key$/i, cd);
        if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3108, 4000, 300)) break;
      }
      if ((sdk.getState()?.player?.worldX ?? 0) < 3108) return false;

      await walkInRoom(3111, 3367, 1, 4000);
      await pickupWithWait(c, 3111, 3367, /^rubber tube$/i, 15);

      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldX ?? 0) >= 3108; i++) {
        await walkInRoom(3108, 3367, 0, 4000);
        const cd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 131);
        if (cd) await bot.useItemOnLoc(/^key$/i, cd);
        if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) <= 3107, 4000, 300)) break;
      }
      return has(sdk, /^rubber tube$/i);
    });

    const oilCan = () => step(c, N, 'oil-can', async () => {
      if (questComplete || has(sdk, /^oil can$/i)) return true;
      const inBasement = () => (sdk.getState()?.player?.worldZ ?? 0) > 9700;

      if (!inBasement()) {
        if (!(await climbManorTo(0))) return false;
        await enterManorL0();
        const p = sdk.getState()?.player;
        if (!p || p.worldX >= 3097) {
          const wb = await bot.walkTo(3098, 3358, 1);
          if (!wb?.success) {
            await openNearbyDoors(c, 3103, 3363, 2);
            await openNearbyDoors(c, 3099, 3366, 2);
            await bot.walkTo(3098, 3358, 1);
          }
          for (let i = 0; i < 3 && (sdk.getState()?.player?.worldX ?? 3098) >= 3097; i++) {
            const bc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 155 || l.id === 156);
            if (bc) await bot.interactLoc(bc, /^search$/i);
            else await bot.interactLoc(/^bookcase$/i, /^search$/i);
            if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 3098) <= 3096, 4000, 300)) break;
          }
        }
        for (let i = 0; i < 3 && !inBasement(); i++) {
          await walkInRoom(3093, 3362, 1, 4000);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 133);
          if (lad) await bot.interactLoc(lad, /climb-?down/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?down/i);
          if (await waitCond(() => inBasement(), 5000, 300)) break;
        }
      }
      if (!inBasement()) return false;

      await walkInRoom(3116, 9754, 1, 5000);
      const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 132);
      if (ladUp) {
        await bot.interactLoc(ladUp, /climb-?up/i);
        if (await waitCond(() => !inBasement(), 5000, 300)) {
          const ladDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 133);
          if (ladDown) await bot.interactLoc(ladDown, /climb-?down/i);
          await waitCond(() => inBasement(), 5000, 300);
        }
      }

      const pullLever = async (leverId: number, sx: number, sz: number) => {
        for (let i = 0; i < 3; i++) {
          await walkInRoom(sx, sz, 1, 5000);
          const beforeTick = Math.max(0, ...(sdk.getState()?.gameMessages ?? []).map((m: any) => m.observationId ?? 0));
          const lev = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === leverId);
          if (lev) await bot.interactLoc(lev, /^pull$/i);
          const clunk = await waitCond(() =>
            (sdk.getState()?.gameMessages ?? []).some((m: any) => (m.observationId ?? 0) > beforeTick && /clunk|pull lever/i.test(m.text)),
            3500, 250
          );
          if (clunk) { await sleep(400); return true; }
        }
        return false;
      };

      const passDoor = async (doorId: number, sx: number, sz: number, pred: () => boolean) => {
        for (let i = 0; i < 4 && !pred(); i++) {
          await walkInRoom(sx, sz, 0, 5000);
          const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === doorId);
          if (d) await bot.interactLoc(d, /^open$/i);
          if (await waitCond(pred, 4000, 250)) { await sleep(300); return true; }
        }
        return pred();
      };

      await pullLever(147, 3117, 9752);
      await walkInRoom(3112, 9751, 1, 5000);
      await pullLever(146, 3108, 9746);

      await walkInRoom(3108, 9753, 1, 5000);
      if (!(await passDoor(144, 3108, 9757, () => (sdk.getState()?.player?.worldZ ?? 0) >= 9758))) return false;

      await pullLever(149, 3108, 9766);

      if (!(await passDoor(139, 3105, 9760, () => (sdk.getState()?.player?.worldX ?? 9999) <= 3104))) return false;
      if (!(await passDoor(145, 3102, 9758, () => (sdk.getState()?.player?.worldZ ?? 9999) <= 9757))) return false;

      await walkInRoom(3106, 9752, 1, 5000);
      await pullLever(146, 3108, 9746);
      await walkInRoom(3112, 9751, 1, 5000);
      await pullLever(147, 3117, 9752);

      await walkInRoom(3106, 9752, 1, 5000);
      if (!(await passDoor(145, 3102, 9757, () => (sdk.getState()?.player?.worldZ ?? 0) >= 9758))) return false;
      if (!(await passDoor(140, 3100, 9760, () => (sdk.getState()?.player?.worldX ?? 9999) <= 3099))) return false;
      if (!(await passDoor(143, 3097, 9762, () => (sdk.getState()?.player?.worldZ ?? 0) >= 9763))) return false;

      await pullLever(150, 3097, 9766);
      await pullLever(151, 3097, 9765);

      if (!(await passDoor(138, 3099, 9765, () => (sdk.getState()?.player?.worldX ?? 0) >= 3100))) return false;
      if (!(await passDoor(137, 3104, 9765, () => (sdk.getState()?.player?.worldX ?? 0) >= 3105))) return false;

      await pullLever(148, 3111, 9760);

      if (!(await passDoor(137, 3105, 9765, () => (sdk.getState()?.player?.worldX ?? 9999) <= 3104))) return false;
      if (!(await passDoor(138, 3100, 9765, () => (sdk.getState()?.player?.worldX ?? 9999) <= 3099))) return false;

      await pullLever(150, 3097, 9766);

      if (!(await passDoor(138, 3099, 9765, () => (sdk.getState()?.player?.worldX ?? 0) >= 3100))) return false;
      if (!(await passDoor(142, 3102, 9763, () => (sdk.getState()?.player?.worldZ ?? 9999) <= 9762))) return false;
      if (!(await passDoor(145, 3102, 9758, () => (sdk.getState()?.player?.worldZ ?? 9999) <= 9757))) return false;
      if (!(await passDoor(141, 3100, 9755, () => (sdk.getState()?.player?.worldX ?? 9999) <= 3099))) return false;

      await walkInRoom(3093, 9755, 1, 5000);
      await pickupWithWait(c, 3092, 9755, /^oil can$/i, 15);

      await passDoor(141, 3099, 9755, () => (sdk.getState()?.player?.worldX ?? 0) >= 3100);
      await walkInRoom(3106, 9752, 1, 5000);
      await walkInRoom(3116, 9754, 1, 5000);
      for (let i = 0; i < 3 && inBasement(); i++) {
        const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 132);
        if (lad) await bot.interactLoc(lad, /climb-?up/i);
        else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
        if (await waitCond(() => !inBasement(), 5000, 300)) break;
      }
      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldX ?? 0) <= 3096; i++) {
        await walkInRoom(3096, 3357, 0, 4000);
        const lev = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 160);
        if (lev) await bot.interactLoc(lev, /^pull$/i);
        else await bot.interactLoc(/^lever$/i, /^pull$/i);
        if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3098, 5000, 300)) break;
      }

      return has(sdk, /^oil can$/i);
    });

    const handIn = () => step(c, N, 'hand-in', async () => {
      if (questComplete) return true;
      if (!(await walkToOddensteinL2())) return false;
      const coinsBefore = count(sdk, /^coins$/i);
      await talk(c, /^professor oddenstein$/i);
      if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 7000, 300)) {
        await chat(c);
      }
      const done = await waitCond(
        () => !has(sdk, /^oil can$/i) && !has(sdk, /^pressure gauge$/i) && !has(sdk, /^rubber tube$/i) && count(sdk, /^coins$/i) >= coinsBefore + 300,
        6000, 300
      );
      await bot.closeInterface();
      await climbManorTo(0);
      return done;
    });

    return (await start()) && (await gauge()) && (await tube()) && (await oilCan()) && (await handIn());
  },
};

export const vampire: Quest = {
  name: 'Vampyre Slayer',
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const N = 'Vampyre Slayer';
    let alreadyComplete = xp(sdk, 'Attack') >= 48250;

    const morgan = () => step(c, N, 'morgan-and-garlic', async () => {
      if (alreadyComplete) return true;
      await exitWizardsTowerGround(c);
      if (lvl(sdk) === 0) {
        // If inside Draynor Manor ground floor, exit via east doors first
        const p = sdk.getState()?.player;
        if (p && p.worldX >= 3097 && p.worldX <= 3122 && p.worldZ >= 3354 && p.worldZ <= 3370) {
          await openNearbyDoors(c, 3119, 3356, 2);
          await openNearbyDoors(c, 3123, 3360, 2);
          await openNearbyDoors(c, 3101, 3371, 2);
          await bot.walkTo(3109, 3348, 3);
        }
        const w = await bot.walkTo(3098, 3268, 2);
        if (!w?.success) { await openNearbyDoors(c, 3098, 3270, 2); await bot.walkTo(3098, 3268, 2); }
        if (!has(sdk, /^stake$/i)) {
          if (!(await talk(c, /^morgan$/i, [/ok, i'm up for an adventure/i]))) return false;
          const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
          if (/slain the foul creature/i.test(recent)) { alreadyComplete = true; return true; }
        }
      }
      if (!has(sdk, /^garlic$/i)) {
        for (let i = 0; i < 3 && lvl(sdk) === 0; i++) {
          await bot.walkTo(3098, 3266, 1);
          await bot.interactLoc(/^staircase$/i, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 1, 6000, 400);
        }
        if (lvl(sdk) !== 1) return false;
        await bot.walkTo(3097, 3268, 1);
        for (let i = 0; i < 3 && !has(sdk, /^garlic$/i); i++) {
          const cup = sdk.findNearbyLoc(/^cupboard$/i);
          if (cup && (cup.options ?? []).some((o: string) => /^open$/i.test(o))) {
            await bot.interactLoc(cup, /^open$/i);
            await sleep(900);
          }
          await bot.interactLoc(/^cupboard$/i, /^search$/i);
          if (await waitInv(sdk, /^garlic$/i, 2500)) break;
        }
        for (let i = 0; i < 3 && lvl(sdk) === 1; i++) {
          await bot.walkTo(3101, 3266, 1);
          await bot.interactLoc(/^staircase$/i, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 6000, 400);
        }
      }
      return has(sdk, /^garlic$/i);
    });

    const prep = () => step(c, N, 'prep', async () => {
      if (alreadyComplete) return true;
      await withdrawFromDraynorBank(c, [/^coins$/i, /^bronze sword$/i, /^wooden shield$/i, /^shrimps$/i, /^bread$/i]);
      if (has(sdk, /^bronze sword$/i)) await bot.equipItem(/^bronze sword$/i);
      if (has(sdk, /^wooden shield$/i)) await bot.equipItem(/^wooden shield$/i);
      if (!has(sdk, /^hammer$/i)) {
        const w = await bot.walkTo(3212, 3247, 2);
        if (!w?.success) { await openNearbyDoors(c, 3212, 3247, 2); await bot.walkTo(3212, 3247, 2); }
        for (let i = 0; i < 3 && !has(sdk, /^hammer$/i); i++) {
          const o = await bot.openShop();
          if (o?.success) {
            await bot.buyFromShop(/^hammer$/i, 1);
            await bot.closeShop();
          }
          await sleep(600);
        }
      }
      if (xp(sdk, 'Strength') < 2500 || xp(sdk, 'Attack') < 1500 || xp(sdk, 'Defence') < 1500) {
        const wc = await bot.walkTo(3232, 3297, 3);
        if (!wc?.success) { await openNearbyDoors(c, 3236, 3295, 2); await bot.walkTo(3232, 3297, 3); }
        const goals: [string, number, number][] = [
          ['Strength', 2500, 1],
          ['Attack', 1500, 0],
          ['Defence', 1500, 3],
        ];
        for (const [skill, targetXp, style] of goals) {
          if (xp(sdk, skill) >= targetXp) continue;
          await sdk.sendSetCombatStyle(style);
          const deadline = Date.now() + 90_000;
          while (Date.now() < deadline && xp(sdk, skill) < targetXp) {
            await bot.dismissBlockingUI();
            const chk = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^chicken$/i.test(n.name) && n.x >= 3225 && n.x <= 3236 && n.z >= 3288 && n.z <= 3301);
            if (chk && !sdk.getState()?.player?.combat?.inCombat) {
              await bot.attack(chk);
            }
            await sleep(700);
          }
        }
        await sdk.sendSetCombatStyle(1);
      }
      if (count(sdk, FOOD_RE) < 12) {
        const w = await bot.walkTo(3194, 3285, 3);
        if (!w?.success) { await openNearbyDoors(c, 3194, 3285, 2); await bot.walkTo(3194, 3285, 3); }
        for (let i = 0; i < 18 && count(sdk, FOOD_RE) < 14 && (sdk.getInventory()?.length ?? 0) < 25; i++) {
          const before = count(sdk, /^cabbage$/i);
          await bot.interactLoc(/^cabbage$/i, /^pick$/i);
          await waitCond(() => count(sdk, /^cabbage$/i) > before, 3000, 300);
        }
      }
      return has(sdk, /^hammer$/i);
    });

    const stake = () => step(c, N, 'stake', async () => {
      if (alreadyComplete || has(sdk, /^stake$/i)) return true;
      if (!(await walkToVarrock(c, 3277, 3488))) return false;
      for (let round = 0; round < 3 && !has(sdk, /^stake$/i); round++) {
        if (!has(sdk, /^beer$/i)) {
          const w = await bot.walkTo(3277, 3488, 2);
          if (!w?.success) { await openNearbyDoors(c, 3277, 3485, 2); await bot.walkTo(3277, 3488, 2); }
          await talk(c, /^bartender$/i, [/beer please/i]);
          await waitInv(sdk, /^beer$/i, 3000);
        }
        const w2 = await bot.walkTo(3277, 3491, 2);
        if (!w2?.success) { await openNearbyDoors(c, 3277, 3485, 2); await bot.walkTo(3277, 3491, 2); }
        await talk(c, /^dr harlow$/i, [/morgan needs your help/i, /ok mate/i]);
        if (await waitInv(sdk, /^stake$/i, 3000)) return true;
      }
      return has(sdk, /^stake$/i);
    });

    const slay = () => step(c, N, 'slay', async () => {
      if (alreadyComplete) return true;
      if ((sdk.getState()?.player?.worldZ ?? 0) > 3380 && (sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        if (!(await walkFromVarrockToLumbridge(c, 3123, 3362))) return false;
      }
      if (!(await draynorManorCrypt(c, true))) return false;
      await bot.walkTo(3078, 9775, 2);
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline && xp(sdk, 'Attack') < 48250) {
        await bot.dismissBlockingUI();
        const p = sdk.getState()?.player;
        if (p && p.hp <= 7) {
          const food = sdk.findInventoryItem(FOOD_RE);
          if (food) await bot.eatFood(food);
        }
        let vamp = sdk.findNearbyNpc(/^count draynor$/i);
        if (!vamp) {
          const coffin = sdk.findNearbyLoc(/^coffin$/i);
          if (coffin && (coffin.options ?? []).some((o: string) => /^open$/i.test(o))) {
            await bot.interactLoc(coffin, /^open$/i);
            await waitCond(() => !!sdk.findNearbyNpc(/^count draynor$/i), 5000, 400);
            vamp = sdk.findNearbyNpc(/^count draynor$/i);
          }
        }
        if (vamp && !sdk.getState()?.player?.combat?.inCombat) {
          await bot.attack(vamp);
        }
        await sleep(800);
      }
      const done = await waitCond(() => xp(sdk, 'Attack') >= 48250, 6000);
      await bot.closeInterface();
      await draynorManorCrypt(c, false);
      return done;
    });

    return (await morgan()) && (await prep()) && (await stake()) && (await slay());
  },
};

await runQuests('bots/bot4', [haunted, vampire]);

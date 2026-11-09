import {
  Ctx, Quest, has, count, xp, lvl, sleep, chat, talk, waitCond, step,
  openNearbyDoors
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';
import { druid } from './druidic-ritual';

const N = 'Jungle Potion';

export const junglepotion: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const herbloreXp0 = xp(sdk, 'Herblore');
    let questComplete = false;
    let stage = 0; // 0=not started, 1=snake_weed, 2=ardrigal, 3=sito_foil, 4=volencia_moss, 5=rogues_purse

    const onKaramja = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldX >= 2750 && p.worldX <= 2965 && ((p.worldZ >= 2950 && p.worldZ <= 3245) || p.worldZ >= 9450);
    };

    const sailToBrimhaven = async (): Promise<boolean> => {
      if (onKaramja()) {
        if (lvl(sdk) === 1) {
          const plank = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /gangplank/i.test(l.name));
          if (plank) {
            await bot.interactLoc(plank, /cross/i);
            await waitCond(() => lvl(sdk) === 0, 5000, 300);
          }
        }
        return onKaramja() && lvl(sdk) === 0;
      }
      if (!(await walkToKandarin(c, 2683, 3275))) return false;
      await bot.walkTo(2683, 3275, 2);
      if (!(await talk(c, /^captain barnaby$/i, [/yes please/i]))) return false;
      await waitCond(() => lvl(sdk) === 1 && (sdk.getState()?.player?.worldZ ?? 3300) < 3250, 10_000, 300);
      for (let i = 0; i < 4 && lvl(sdk) === 1; i++) {
        const plank = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /gangplank/i.test(l.name));
        if (plank) await bot.interactLoc(plank, /cross/i);
        await waitCond(() => lvl(sdk) === 0, 4000, 250);
      }
      return onKaramja() && lvl(sdk) === 0;
    };

    const sailBrimhavenToArdougne = async () => {
      if (!onKaramja() || (sdk.getState()?.player?.worldZ ?? 0) > 9000) return;
      if (count(sdk, /^coins$/i) < 30) return;
      await bot.walkTo(2772, 3227, 2);
      await talk(c, /^customs officer$/i, [/can i journey on this ship/i, /search away/i, /^ok\.?$/i]);
      await waitCond(() => lvl(sdk) === 1 && (sdk.getState()?.player?.worldZ ?? 0) > 3250, 10_000, 300);
      for (let i = 0; i < 4 && lvl(sdk) === 1; i++) {
        const plank = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /gangplank/i.test(l.name));
        if (plank) await bot.interactLoc(plank, /cross/i);
        await waitCond(() => lvl(sdk) === 0, 4000, 250);
      }
    };

    const hasItemById = (id: number) => (sdk.getInventory() ?? []).some((i: any) => i.id === id);

    const gatherAndCleanHerb = async (
      coords: [number, number][],
      locId: number,
      unidId: number,
      cleanId: number
    ): Promise<boolean> => {
      if (hasItemById(cleanId)) return true;
      for (let round = 0; round < 4 && !hasItemById(unidId) && !hasItemById(cleanId); round++) {
        const [tx, tz] = coords[round % coords.length];
        await bot.walkTo(tx, tz, 2);
        const loc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === locId);
        if (loc) {
          await sdk.sendInteractLoc(loc.x, loc.z, loc.id, 2);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasItemById(unidId), 5000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }
        await sleep(500);
      }
      if (hasItemById(unidId) && !hasItemById(cleanId)) {
        const unid = (sdk.getInventory() ?? []).find((i: any) => i.id === unidId);
        if (unid) {
          await bot.useItemOp1(unid);
          await waitCond(() => hasItemById(cleanId), 4000, 250);
        }
      }
      return hasItemById(cleanId);
    };

    const talkToTrufitus = async (choices: RegExp[]) => {
      const w = await bot.walkTo(2809, 3085, 2);
      if (!w?.success) {
        await openNearbyDoors(c, 2809, 3085, 3);
        await bot.walkTo(2809, 3085, 2);
      }
      return await talk(c, /^trufitus$/i, choices, 25);
    };

    const startAndFirstThreeHerbs = () => step(c, N, 'start-and-first-three-herbs', async () => {
      if (questComplete || stage >= 4) return true;
      if (xp(sdk, 'Herblore') === 0) {
        if (!(await druid.run(c))) return false;
      }

      if (!(await sailToBrimhaven())) return false;

      // Talk to Trufitus to start or check current stage
      if (!(await talkToTrufitus([
        /it's a nice village, where is everyone/i,
        /me\? how can i help/i,
        /sounds like just the challenge for me/i,
        /what's the clue again/i,
      ]))) return false;
      const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
      if (/communed with my gods|no more news since we last spoke/i.test(recent)) {
        questComplete = true;
        return true;
      }
      if (/rogues purse/i.test(recent)) stage = 5;
      else if (/volencia moss/i.test(recent)) stage = 4;
      else if (/sito foil/i.test(recent)) stage = 3;
      else if (/ardrigal/i.test(recent)) stage = 2;
      else stage = 1;

      if (stage >= 4) return true;

      // 1. Snake weed (unid 1525, clean 1526, loc 2575)
      if (stage === 1) {
        if (!(await gatherAndCleanHerb([[2768, 3028], [2773, 3033], [2775, 3031]], 2575, 1525, 1526))) return false;
        if (!(await talkToTrufitus([/of course/i]))) return false;
        if (hasItemById(1526)) return false;
        stage = 2;
      }

      // 2. Ardrigal (unid 1527, clean 1528, loc 2577)
      if (stage === 2) {
        if (!(await gatherAndCleanHerb([[2870, 3115], [2874, 3124], [2877, 3120]], 2577, 1527, 1528))) return false;
        if (!(await talkToTrufitus([/of course/i]))) return false;
        if (hasItemById(1528)) return false;
        stage = 3;
      }

      // 3. Sito foil (unid 1529, clean 1530, loc 2579)
      if (stage === 3) {
        if (!(await gatherAndCleanHerb([[2789, 3047], [2790, 3049], [2791, 3047]], 2579, 1529, 1530))) return false;
        if (!(await talkToTrufitus([/of course/i]))) return false;
        if (hasItemById(1530)) return false;
        stage = 4;
      }

      return stage >= 4;
    });

    const mossRoguesPurseAndFinish = () => step(c, N, 'moss-rogues-purse-and-finish', async () => {
      if (questComplete) return true;
      if (!(await sailToBrimhaven())) return false;

      // 4. Volencia moss (unid 1531, clean 1532, loc 2581)
      if (stage === 4) {
        if (!(await gatherAndCleanHerb([[2850, 3035], [2851, 3033], [2851, 3036]], 2581, 1531, 1532))) return false;
        if (!(await talkToTrufitus([/of course/i]))) return false;
        if (hasItemById(1532)) return false;
        stage = 5;
      }

      // 5. Rogue's purse (unid 1533, clean 1534, loc 2583 inside Pothole Cave 2584 at 2824, 3118)
      if (!hasItemById(1534)) {
        const inCave = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;
        if (!inCave()) {
          await bot.walkTo(2824, 3119, 2);
          if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await bot.activatePrayer('protect_from_melee');
          }
          for (let i = 0; i < 4 && !inCave(); i++) {
            const rocks = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2584 || /^rocks$/i.test(l.name));
            if (rocks) {
              await sdk.sendInteractLoc(rocks.x, rocks.z, rocks.id, 2);
              if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || inCave(), 4500, 250)) {
                if (sdk.getState()?.dialog?.isOpen) await chat(c, [/yes, i'll enter the cave/i]);
              }
            }
            await waitCond(() => inCave(), 4000, 250);
          }
          if (!inCave()) return false;
        }

        if (!(await gatherAndCleanHerb([[2830, 9492], [2829, 9493], [2831, 9500]], 2583, 1533, 1534))) return false;

        // Climb out via Hand holds (2585 at 2830, 9522)
        await bot.walkTo(2830, 9521, 2);
        for (let i = 0; i < 4 && inCave(); i++) {
          const holds = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2585 || /hand holds/i.test(l.name));
          if (holds) {
            await sdk.sendInteractLoc(holds.x, holds.z, holds.id, 1);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || !inCave(), 4500, 250)) {
              if (sdk.getState()?.dialog?.isOpen) await chat(c);
            }
          }
          await waitCond(() => !inCave(), 4000, 250);
        }
        await bot.deactivateAllPrayers();
        if (inCave()) return false;
      }

      // Hand Rogue's purse to Trufitus (2809, 3085)
      await talkToTrufitus([/of course/i]);
      const done = await waitCond(() => xp(sdk, 'Herblore') > herbloreXp0 + 500 || !!sdk.getState()?.interface?.isOpen, 8000, 300);
      await bot.closeInterface();
      await sailBrimhavenToArdougne();
      questComplete = done;
      return done;
    });

    if (!(await startAndFirstThreeHerbs())) return false;
    if (!(await mossRoguesPurseAndFinish())) return false;
    return true;
  },
};

import {
  Ctx, Quest, has, xp, lvl, sleep, talk, waitInv, waitCond, step,
  openNearbyDoors, bankJunk, withdrawFromDraynorBank, exitWizardsTowerGround
} from '../quest-kit';

const N = 'Druidic Ritual';
const KEEP_RE = /^(coins|silverlight|bronze sword|iron|steel|mithril|adamant|rune|wooden shield|raw beef|raw chicken|raw rat meat|raw bear meat|enchanted beef|enchanted chicken|enchanted rat meat|enchanted bear meat|shrimps|bread|cabbage|trout|salmon|lobster)$/i;

export const druid: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    if (xp(sdk, 'Herblore') > 0) return true;

    let started = false;
    let sanfewSpoken = false;
    let sanfewHandedIn = false;

    const hasAllEnchanted = () =>
      has(sdk, /^enchanted beef$/i) &&
      has(sdk, /^enchanted chicken$/i) &&
      has(sdk, /^enchanted rat meat$/i) &&
      has(sdk, /^enchanted bear meat$/i);

    const climbSanfew = async (targetLvl: 0 | 1) => {
      for (let i = 0; i < 4 && lvl(sdk) !== targetLvl; i++) {
        if (targetLvl === 1) {
          const w = await bot.walkTo(2898, 3427, 2);
          if (!w?.success) {
            await openNearbyDoors(c, 2897, 3428, 3);
            await bot.walkTo(2898, 3427, 2);
          }
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1738 && Math.hypot(l.x - 2898, l.z - 3428) <= 3);
          if (st) await bot.interactLoc(st, /climb-?up/i);
          else await bot.interactLoc(/^staircase$/i, /climb-?up/i);
        } else {
          const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1740 && Math.hypot(l.x - 2898, l.z - 3428) <= 3);
          if (st) await bot.interactLoc(st, /climb-?down/i);
          else await bot.interactLoc(/^staircase$/i, /climb-?down/i);
        }
        await waitCond(() => lvl(sdk) === targetLvl, 5000, 300);
      }
      return lvl(sdk) === targetLvl;
    };

    const killAndLootMeat = async (
      cx: number,
      cz: number,
      npcRe: RegExp,
      meatRe: RegExp,
      useProtectMelee = false
    ) => {
      if (has(sdk, meatRe)) return true;
      await bot.walkTo(cx, cz, 3);
      if (useProtectMelee && (sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }
      await sdk.sendSetCombatStyle(1);
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline && !has(sdk, meatRe)) {
        await bot.dismissBlockingUI();
        const g = (sdk.getState()?.groundItems ?? [])
          .filter((item: any) => meatRe.test(item.name) && item.reachable !== false && item.distance <= 12)
          .sort((a: any, b: any) => a.distance - b.distance)[0];
        if (g) {
          await bot.pickupItem(g);
          if (await waitInv(sdk, meatRe, 4000)) break;
        }
        const p = sdk.getState()?.player;
        if (p && Math.hypot(p.worldX - cx, p.worldZ - cz) > 16) {
          await bot.walkTo(cx, cz, 3);
        }
        const npc = (sdk.getState()?.nearbyNpcs ?? [])
          .filter((n: any) => npcRe.test(n.name) && !n.inCombat && n.reachable !== false && Math.hypot(n.x - cx, n.z - cz) <= 16)
          .sort((a: any, b: any) => a.distance - b.distance)[0];
        if (npc && !sdk.getState()?.player?.combat?.inCombat) {
          await bot.attack(npc);
          await waitCond(() => !sdk.getState()?.player?.combat?.inCombat || (sdk.getState()?.groundItems ?? []).some((i: any) => meatRe.test(i.name)), 10_000, 300);
        } else {
          await sleep(700);
        }
      }
      if (useProtectMelee) await bot.deactivateAllPrayers();
      return has(sdk, meatRe);
    };

    const gatherAndStart = () => step(c, N, 'gather-meats-and-start', async () => {
      if (xp(sdk, 'Herblore') > 0 || hasAllEnchanted() || sanfewHandedIn) return true;
      await exitWizardsTowerGround(c);

      if ((sdk.getState()?.player?.worldX ?? 3100) > 3000 && (sdk.getState()?.player?.worldZ ?? 3250) < 3350) {
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [/^silverlight$/i, /^bronze sword$/i, /^wooden shield$/i]);
        for (const w of [/^silverlight$/i, /^bronze sword$/i, /^wooden shield$/i]) {
          if (has(sdk, w)) { await bot.equipItem(w); await sleep(300); }
        }
      }

      // 1. Raw chicken from Falador south farm (3017, 3290)
      if (!has(sdk, /^(raw|enchanted) chicken$/i)) {
        const w = await bot.walkTo(3017, 3290, 2);
        if (!w?.success) { await openNearbyDoors(c, 3020, 3293, 3); await bot.walkTo(3017, 3290, 2); }
        if (!(await killAndLootMeat(3017, 3290, /^chicken$/i, /^raw chicken$/i))) return false;
      }

      // 2. Raw beef from Falador south farm (3032, 3305)
      if (!has(sdk, /^(raw|enchanted) beef$/i)) {
        const w = await bot.walkTo(3032, 3305, 3);
        if (!w?.success) { await openNearbyDoors(c, 3031, 3303, 3); await bot.walkTo(3032, 3305, 3); }
        if (!(await killAndLootMeat(3032, 3305, /^cow$/i, /^raw beef$/i))) return false;
      }

      // 3. Raw rat meat from Giant rat in Lumbridge Swamp (3206, 3178)
      if (!has(sdk, /^(raw|enchanted) rat meat$/i)) {
        await bot.walkTo(3206, 3178, 3);
        if (!(await killAndLootMeat(3206, 3178, /^giant rat$/i, /^raw rat meat$/i))) return false;
      }

      // 4. Raw bear meat from Black bear north of Falador (2966, 3474)
      if (!has(sdk, /^(raw|enchanted) bear meat$/i)) {
        await bot.walkTo(2965, 3385, 3);
        await bot.walkTo(2966, 3474, 3);
        if (!(await killAndLootMeat(2966, 3474, /^(black|brown) bear$/i, /^raw bear meat$/i, true))) return false;
      }

      // 5. Talk to Kaqemeex at Druids' Circle (2925, 3486)
      if (!started && !sanfewSpoken) {
        await bot.walkTo(2925, 3486, 2);
        if (!(await talk(c, /^kaqemeex$/i, [/in search of a quest/i, /ok, i will try and help/i]))) return false;
        started = true;
      }

      // 6. Talk to Sanfew in Taverley (2898, 3427 L1)
      if (!sanfewSpoken) {
        await bot.walkTo(2898, 3427, 2);
        if (!(await climbSanfew(1))) return false;
        if (!(await talk(c, /^sanfew$/i, [
          /sent to help purify|assist you with the ritual/i,
          /ok, i'll do that then|where can i find this cauldron/i,
        ]))) return false;
        sanfewSpoken = true;
        await climbSanfew(0);
      }

      return sanfewSpoken;
    });

    const dipMeats = () => step(c, N, 'cauldron-of-thunder', async () => {
      if (xp(sdk, 'Herblore') > 0 || hasAllEnchanted() || sanfewHandedIn) return true;
      const inDungeon = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;

      if (!inDungeon()) {
        if (lvl(sdk) > 0) await climbSanfew(0);
        await bot.walkTo(2884, 3398, 1);
        if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
          await bot.activatePrayer('protect_from_melee');
        }
        for (let i = 0; i < 3 && !inDungeon(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1759);
          if (lad) await bot.interactLoc(lad, /climb-?down/i);
          else await bot.interactLoc(/^ladder$/i, /climb-?down/i);
          if (await waitCond(() => inDungeon(), 5000, 300)) break;
        }
        if (!inDungeon()) return false;
      }

      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0 && !sdk.isPrayerActive('protect_from_melee')) {
        await bot.activatePrayer('protect_from_melee');
      }

      // Walk to Prison door at (2888, 9831) and click up to 4 times (2 suits of armour + 1 open)
      await bot.walkTo(2888, 9831, 1);
      for (let i = 0; i < 5 && (sdk.getState()?.player?.worldX ?? 2888) < 2889; i++) {
        await sdk.sendWalk(2888, 9831, true);
        await sleep(500);
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2143 || l.id === 2144);
        if (door) await bot.interactLoc(door, /^open$/i);
        await sleep(1000);
      }
      if ((sdk.getState()?.player?.worldX ?? 2888) < 2889) return false;

      await sdk.sendWalk(2892, 9831, true);
      await sleep(800);
      const cauldron = () => (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2142 || /cauldron of thunder/i.test(l.name));
      const pairs: [RegExp, RegExp][] = [
        [/^raw beef$/i, /^enchanted beef$/i],
        [/^raw chicken$/i, /^enchanted chicken$/i],
        [/^raw rat meat$/i, /^enchanted rat meat$/i],
        [/^raw bear meat$/i, /^enchanted bear meat$/i],
      ];
      for (const [rawRe, enchRe] of pairs) {
        if (has(sdk, enchRe)) continue;
        const cLoc = cauldron();
        if (cLoc) await bot.useItemOnLoc(rawRe, cLoc);
        else await bot.useItemOnLoc(rawRe, /cauldron of thunder/i);
        await waitInv(sdk, enchRe, 4000);
      }

      // Exit prison door back to (2888, 9831)
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 2890) >= 2889; i++) {
        await sdk.sendWalk(2889, 9831, true);
        await sleep(500);
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2143 || l.id === 2144);
        if (door) await bot.interactLoc(door, /^open$/i);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 2890) <= 2888, 3500, 250);
      }

      await bot.walkTo(2884, 9798, 2);
      for (let i = 0; i < 3 && inDungeon(); i++) {
        const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
        if (lad) await bot.interactLoc(lad, /climb-?up/i);
        else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
        if (await waitCond(() => !inDungeon(), 5000, 300)) break;
      }
      await bot.deactivateAllPrayers();
      return hasAllEnchanted();
    });

    const finish = () => step(c, N, 'sanfew-and-kaqemeex-finish', async () => {
      if (xp(sdk, 'Herblore') > 0) return true;
      if (!sanfewHandedIn && hasAllEnchanted()) {
        await bot.walkTo(2898, 3427, 2);
        if (!(await climbSanfew(1))) return false;
        await talk(c, /^sanfew$/i);
        if (!(await waitCond(() => !has(sdk, /^enchanted beef$/i), 5000, 300))) return false;
        sanfewHandedIn = true;
        await climbSanfew(0);
      }

      await bot.walkTo(2925, 3486, 2);
      await talk(c, /^kaqemeex$/i, undefined, 25);
      const done = await waitCond(() => xp(sdk, 'Herblore') > 0, 8000, 300);
      await bot.closeInterface();
      return done;
    });

    return (await gatherAndStart()) && (await dipMeats()) && (await finish());
  },
};

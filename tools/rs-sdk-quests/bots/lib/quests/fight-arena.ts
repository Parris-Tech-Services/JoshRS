import {
  Ctx, Quest, has, count, xp, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Fight Arena';

export const arena: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const thievXp0 = xp(sdk, 'Thieving');

    let started = false;
    let guardSpoken = false;
    let keysObtained = false;
    let servilsFreed = false;

    const hasHelmet = () =>
      has(sdk, /^khazard helmet$/i) ||
      (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 74 || /khazard helmet/i.test(e.name));
    const hasArmour = () =>
      has(sdk, /^khazard armour$/i) ||
      (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 75 || /khazard armour/i.test(e.name));
    const hasKeys = () =>
      has(sdk, /^khazard cell keys$/i) ||
      (sdk.getState()?.inventory ?? []).some((i: any) => i.id === 76);

    const inArena = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldX >= 2581 && p.worldX <= 2606 && p.worldZ >= 3152 && p.worldZ <= 3171;
    };
    const inPrisonCell = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldX >= 2598 && p.worldX <= 2601 && p.worldZ >= 3140 && p.worldZ <= 3142;
    };
    const inPrisonWing = () => {
      const p = sdk.getState()?.player;
      if (!p) return false;
      return (p.worldX >= 2607 && p.worldX <= 2620 && p.worldZ >= 3140 && p.worldZ <= 3171) ||
             (p.worldX >= 2585 && p.worldX <= 2616 && p.worldZ >= 3140 && p.worldZ <= 3151);
    };

    const equipDisguise = async () => {
      if (has(sdk, /^khazard helmet$/i)) { await bot.equipItem(/^khazard helmet$/i); await sleep(300); }
      if (has(sdk, /^khazard armour$/i)) { await bot.equipItem(/^khazard armour$/i); await sleep(300); }
    };

    const enterPrisonWingNorth = async () => {
      if (inPrisonWing()) return true;
      await equipDisguise();
      await bot.walkTo(2617, 3172, 0);
      const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 81 && Math.hypot(l.x - 2617, l.z - 3171) <= 2);
      if (door) {
        await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || inPrisonWing(), 4000, 250)) {
          if (sdk.getState()?.dialog?.isOpen) await chat(c, [], 15);
        }
      }
      return await waitCond(inPrisonWing, 4000, 250);
    };

    const exitPrisonWingWest = async () => {
      if (!inPrisonWing()) return true;
      const w = await bot.walkTo(2585, 3141, 0);
      if (!w?.success) {
        await openNearbyDoors(c, 2609, 3143, 3);
        await openNearbyDoors(c, 2613, 3150, 3);
        await bot.walkTo(2585, 3141, 0);
      }
      const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 81 && Math.hypot(l.x - 2585, l.z - 3141) <= 2);
      if (door) {
        await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
      }
      return await waitCond(() => !inPrisonWing(), 4000, 250);
    };

    const startAndArmour = () => step(c, N, 'start-and-armour', async () => {
      if (xp(sdk, 'Thieving') > thievXp0 || servilsFreed || inArena() || inPrisonCell()) return true;
      if (hasHelmet() && hasArmour() && (guardSpoken || has(sdk, /^khali brew$/i) || hasKeys())) return true;

      if (!(await walkToKandarin(c, 2566, 3199))) return false;

      while (count(sdk, /^coins$/i) < 5) {
        await bot.walkTo(2605, 3296, 4);
        const m = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^(man|woman)$/i.test(n.name));
        if (m) await bot.pickpocketNpc(m);
        await sleep(600);
      }

      if (!started && (!hasHelmet() || !hasArmour())) {
        await bot.walkTo(2566, 3199, 2);
        if (!(await talk(c, /^lady servil$/i, [/can i help you/i]))) return false;
        started = true;
      }

      if (!hasHelmet() || !hasArmour()) {
        const w = await bot.walkTo(2613, 3190, 1);
        if (!w?.success) {
          await openNearbyDoors(c, 2609, 3191, 3);
          await bot.walkTo(2613, 3190, 1);
        }
        for (let i = 0; i < 6 && (!hasHelmet() || !hasArmour()); i++) {
          const ch = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 75 || l.id === 76);
          if (ch) await sdk.sendInteractLoc(ch.x, ch.z, ch.id, 1);
          else await bot.interactLoc(/^chest$/i, /open|search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (hasHelmet() && hasArmour()), 3000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
          await sleep(300);
        }
      }

      await equipDisguise();
      return hasHelmet() && hasArmour();
    });

    const brewAndKeys = () => step(c, N, 'brew-and-keys', async () => {
      if (xp(sdk, 'Thieving') > thievXp0 || servilsFreed || inArena() || inPrisonCell() || hasKeys() || keysObtained) return true;
      await equipDisguise();

      // 1. Speak to drunk guard (arena_guard2, id 254 at 2615, 3141)
      if (!guardSpoken && !has(sdk, /^khali brew$/i)) {
        if (!(await enterPrisonWingNorth())) return false;
        const w = await bot.walkTo(2615, 3142, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 2613, 3150, 3);
          await openNearbyDoors(c, 2609, 3143, 3);
          await bot.walkTo(2615, 3142, 2);
        }
        const guard = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 254);
        if (!guard) return false;
        await bot.talkTo(guard);
        await chat(c, [], 20);
        guardSpoken = true;
      }

      // 2. Buy Khali brew from Khazard barman (id 259 at 2566, 3140)
      if (!has(sdk, /^khali brew$/i)) {
        await exitPrisonWingWest();
        const wb = await bot.walkTo(2566, 3141, 2);
        if (!wb?.success) {
          await openNearbyDoors(c, 2569, 3150, 3);
          await bot.walkTo(2566, 3141, 2);
        }
        if (!(await talk(c, /^khazard barman$/i, [/khali brew please/i]))) return false;
        if (!(await waitInv(sdk, /^khali brew$/i, 4000))) return false;
      }

      // 3. Give Khali brew to arena_guard2 (id 254 at 2615, 3141) -> Khazard cell keys (76)
      if (!inPrisonWing()) {
        await bot.walkTo(2584, 3141, 0);
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 81 && Math.hypot(l.x - 2585, l.z - 3141) <= 2);
        if (door) {
          await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || inPrisonWing(), 4000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c, [], 15);
          }
        }
      }
      const wg = await bot.walkTo(2615, 3142, 2);
      if (!wg?.success) {
        await openNearbyDoors(c, 2609, 3143, 3);
        await openNearbyDoors(c, 2613, 3150, 3);
        await bot.walkTo(2615, 3142, 2);
      }
      const guard = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 254);
      if (!guard) return false;
      await bot.talkTo(guard);
      await chat(c, [], 30);
      keysObtained = hasKeys();
      return keysObtained;
    });

    const arenaBattles = () => step(c, N, 'arena-battles', async () => {
      if (xp(sdk, 'Thieving') > thievXp0 || servilsFreed) return true;

      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }
      for (const w of [/^silverlight$/i, /^bronze sword$/i, /^wooden shield$/i]) {
        if (has(sdk, w)) { await bot.equipItem(w); await sleep(250); }
      }
      await sdk.sendSetCombatStyle(1);

      // Free Jeremy Servil (265 at 2616, 3168) using Khazard cell keys on Prison Door (80 at 2617, 3167)
      if (!inArena() && !inPrisonCell()) {
        if (!inPrisonWing()) await enterPrisonWingNorth();
        const wj = await bot.walkTo(2617, 3167, 1);
        if (!wj?.success) {
          await openNearbyDoors(c, 2613, 3150, 3);
          await openNearbyDoors(c, 2609, 3143, 3);
          await bot.walkTo(2617, 3167, 1);
        }
        const keyItem = (sdk.getState()?.inventory ?? []).find((i: any) => i.id === 76 || /cell keys/i.test(i.name));
        const jDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 80);
        if (keyItem && jDoor) {
          await sdk.sendUseItemOnLoc(keyItem.slot, jDoor.x, jDoor.z, jDoor.id);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
            await chat(c, [], 25);
          }
          await waitCond(inArena, 20_000, 400);
        }
      }

      const deadline = Date.now() + 240_000;
      while (Date.now() < deadline && !servilsFreed) {
        if (sdk.getState()?.dialog?.isOpen) {
          await chat(c, [], 25);
          const recent = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
          if (/pleasure of killing you myself|not cowardly enough to make false promises|indeed they are now free/i.test(recent)) {
            servilsFreed = true;
            break;
          }
        }

        if (inPrisonCell()) {
          const hengrad = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 263 || /hengrad/i.test(n.name));
          if (hengrad) {
            await sdk.sendInteractNpc(hengrad.index, 1);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
              await chat(c, [], 30);
            }
            await waitCond(inArena, 25_000, 400);
          }
          await sleep(500);
          continue;
        }

        const boss = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) =>
          [269, 270, 271].includes(n.id) &&
          n.x >= 2581 && n.x <= 2606 && n.z >= 3152 && n.z <= 3171
        );
        if (boss) {
          if (!sdk.getState()?.player?.combat?.inCombat) {
            await bot.attack(boss);
          }
          await sleep(600);
          continue;
        }

        const khazard = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) =>
          n.id === 258 && n.x >= 2581 && n.x <= 2606 && n.z >= 3152 && n.z <= 3171
        );
        if (khazard && khazard.inCombat) {
          servilsFreed = true;
          break;
        }

        await sleep(500);
      }

      await bot.deactivateAllPrayers();
      return servilsFreed;
    });

    const escapeAndFinish = () => step(c, N, 'escape-and-finish', async () => {
      if (xp(sdk, 'Thieving') > thievXp0) return true;

      if (inArena()) {
        await bot.walkTo(2605, 3153, 1);
        const door2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 82);
        if (door2) await sdk.sendInteractLoc(door2.x, door2.z, door2.id, 1);
        await waitCond(() => !inArena(), 6000, 250);
      }

      if (inPrisonWing()) {
        await bot.walkTo(2617, 3171, 0);
        const door1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 81 && Math.hypot(l.x - 2617, l.z - 3171) <= 2);
        if (door1) await sdk.sendInteractLoc(door1.x, door1.z, door1.id, 1);
        await waitCond(() => !inPrisonWing(), 4000, 250);
      }

      await bot.walkTo(2566, 3199, 2);
      await talk(c, /^lady servil$/i, []);
      return await waitCond(() => xp(sdk, 'Thieving') > thievXp0, 8000, 300);
    });

    if (!(await startAndArmour())) return false;
    if (!(await brewAndKeys())) return false;
    if (!(await arenaBattles())) return false;
    return await escapeAndFinish();
  },
};

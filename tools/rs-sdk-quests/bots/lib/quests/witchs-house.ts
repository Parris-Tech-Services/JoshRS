import {
  Ctx, Quest, has, xp, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors, bankJunk, withdrawFromDraynorBank, exitWizardsTowerGround
} from '../quest-kit';

const N = "Witch's House";
const KEEP_RE = /^(coins|silverlight|bronze sword|iron|steel|mithril|adamant|rune|wooden shield|leather gloves|gloves|cheese|door key|magnet|key|ball|shrimps|bread|cabbage|trout|salmon|lobster)$/i;

export const ball: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const hpXp0 = xp(sdk, 'Hitpoints');

    let started = false;
    let doorUnlocked = false;

    const hasGloves = () =>
      has(sdk, /^(leather )?gloves$/i) ||
      (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 1059 || /gloves/i.test(e.name));

    const hasShedKey = () =>
      (sdk.getState()?.inventory ?? []).some((i: any) => i.id === 2411);

    const hasDoorKey = () =>
      (sdk.getState()?.inventory ?? []).some((i: any) => i.id === 2409) || has(sdk, /^door key$/i);

    const inBasement = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;
    const inGarden = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldX >= 2900 && p.worldX <= 2933 && p.worldZ >= 3459 && p.worldZ <= 3472 &&
        !(p.worldX <= 2907 && p.worldZ >= 3466);
    };
    const inShed = () => {
      const p = sdk.getState()?.player;
      return !!p && p.worldX >= 2934 && p.worldX <= 2937 && p.worldZ >= 3459 && p.worldZ <= 3467;
    };

    const startAndPrep = () => step(c, N, 'start-and-prep', async () => {
      if (has(sdk, /^ball$/i) || inShed() || inGarden() || doorUnlocked) return true;
      await exitWizardsTowerGround(c);

      if ((sdk.getState()?.player?.worldX ?? 3100) > 3000 && (sdk.getState()?.player?.worldZ ?? 3250) < 3350) {
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [/^silverlight$/i, /^bronze sword$/i, /^wooden shield$/i, /^(leather )?gloves$/i, /^cheese$/i]);
        for (const w of [/^silverlight$/i, /^bronze sword$/i, /^wooden shield$/i, /^(leather )?gloves$/i]) {
          if (has(sdk, w)) { await bot.equipItem(w); await sleep(300); }
        }
      }

      // 1. Pick up Cheese (1985) in Aggie's house in Draynor (3083, 3260) if needed
      if (!has(sdk, /^cheese$/i) && !has(sdk, /^magnet$/i) && !hasShedKey()) {
        const w = await bot.walkTo(3083, 3260, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 3085, 3258, 3);
          await bot.walkTo(3083, 3260, 2);
        }
        const deadline = Date.now() + 35_000;
        while (Date.now() < deadline && !has(sdk, /^cheese$/i)) {
          const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 1985 || /^cheese$/i.test(i.name));
          if (g) {
            await bot.pickupItem(g);
            if (await waitInv(sdk, /^cheese$/i, 4000)) break;
          }
          await sleep(600);
        }
      }

      // 2. Pick up Leather gloves (1059) in Edgeville (3097, 3486) if needed
      if (!hasGloves() && !has(sdk, /^magnet$/i) && !hasShedKey()) {
        await bot.walkTo(3097, 3486, 2);
        const deadline = Date.now() + 35_000;
        while (Date.now() < deadline && !hasGloves()) {
          const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 1059 || /gloves/i.test(i.name));
          if (g) {
            await bot.pickupItem(g);
            if (await waitCond(hasGloves, 4000, 250)) break;
          }
          await sleep(600);
        }
        if (has(sdk, /^(leather )?gloves$/i)) {
          await bot.equipItem(/^(leather )?gloves$/i);
          await sleep(300);
        }
      }

      // 3. Talk to Boy (895) at (2928, 3456)
      if (!started) {
        await bot.walkTo(2928, 3456, 2);
        if (!(await talk(c, /^boy$/i, [/what's the matter/i, /ok, i'll see what i can do/i]))) return false;
        started = true;
      }

      // 4. Search Potted plant (2867) at (2900, 3474) for Door key (2409)
      if (!hasDoorKey()) {
        await bot.walkTo(2900, 3473, 1);
        for (let i = 0; i < 4 && !hasDoorKey(); i++) {
          const pot = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2867);
          if (pot) await sdk.sendInteractLoc(pot.x, pot.z, pot.id, 1);
          else await bot.interactLoc(/potted plant/i, /look|search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasDoorKey(), 4000, 250)) {
            await chat(c);
          }
        }
      }

      return hasDoorKey();
    });

    const getMagnetAndUnlockGarden = () => step(c, N, 'get-magnet-and-unlock-garden', async () => {
      if (has(sdk, /^ball$/i) || inShed() || inGarden() || doorUnlocked) return true;

      // Enter front door (2861 at 2901, 3473) if outside
      if (!inBasement() && (sdk.getState()?.player?.worldX ?? 0) <= 2900) {
        await bot.walkTo(2900, 3473, 0);
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2861);
        if (door) await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2901, 4000, 250);
      }

      // Get Magnet (2410) from basement cupboard if needed
      if (!has(sdk, /^magnet$/i)) {
        if (!inBasement()) {
          const w = await bot.walkTo(2906, 3476, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 2902, 3474, 2);
            await bot.walkTo(2906, 3476, 1);
          }
          for (let i = 0; i < 4 && !inBasement(); i++) {
            const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1754);
            if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
            else await bot.interactLoc(/^ladder$/i, /climb-?down/i);
            await waitCond(inBasement, 5000, 250);
          }
        }
        if (!inBasement()) return false;

        if (has(sdk, /^(leather )?gloves$/i)) {
          await bot.equipItem(/^(leather )?gloves$/i);
          await sleep(400);
        }

        // Open iron gate (2865/2866 at 2902, 9873) into west room (worldX <= 2901)
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 9999) >= 2902; i++) {
          await bot.walkTo(2903, 9873, 1);
          const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2865 || l.id === 2866);
          if (gate) await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
          else await bot.interactLoc(/^gate$/i, /open/i);
          if (await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2901 || !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }

        // Open and search cupboard (2868/2869 at 2898, 9873)
        await bot.walkTo(2899, 9873, 1);
        for (let i = 0; i < 6 && !has(sdk, /^magnet$/i); i++) {
          const cb = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2868 || l.id === 2869);
          if (cb) await sdk.sendInteractLoc(cb.x, cb.z, cb.id, 1);
          else await bot.interactLoc(/^cupboard$/i, /open|search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || has(sdk, /^magnet$/i), 3000, 250)) {
            await chat(c);
          }
          await sleep(300);
        }

        // Exit iron gate back to east room (worldX >= 2902)
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 0) <= 2901; i++) {
          await bot.walkTo(2901, 9873, 1);
          const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2865 || l.id === 2866);
          if (gate) await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
          else await bot.interactLoc(/^gate$/i, /open/i);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2902, 4000, 250);
        }

        // Climb up ladder (1755 at 2907, 9876)
        for (let i = 0; i < 4 && inBasement(); i++) {
          await bot.walkTo(2907, 9875, 1);
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          else await bot.interactLoc(/^ladder$/i, /climb-?up/i);
          await waitCond(() => !inBasement(), 5000, 250);
        }
      }

      if (inBasement() || !has(sdk, /^magnet$/i)) return false;

      // Walk to Mouse hole (2870 at 2903, 3466)
      for (let i = 0; i < 4; i++) {
        const p = sdk.getState()?.player;
        if (p && Math.hypot(p.worldX - 2902, p.worldZ - 3466) <= 2 && p.worldZ <= 3467) break;
        const w = await bot.walkTo(2902, 3466, 1);
        if (!w?.success) {
          await openNearbyDoors(c, 2902, 3474, 2);
          await openNearbyDoors(c, 2902, 3468, 2);
        }
      }

      // Use Cheese on Mouse hole (2870 at 2903, 3466) and Magnet on Mouse (901)
      const cheeseItem = sdk.findInventoryItem(/^cheese$/i);
      const hole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2870);
      if (cheeseItem && hole) {
        await sdk.sendUseItemOnLoc(cheeseItem.slot, hole.x, hole.z, hole.id);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.nearbyNpcs ?? []).some((n: any) => n.id === 901 || /^mouse$/i.test(n.name)), 5000, 200)) {
          await chat(c, [], 15);
        }
      }
      const magnetItem = sdk.findInventoryItem(/^magnet$/i);
      const mouse = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 901 || /^mouse$/i.test(n.name));
      if (magnetItem && mouse) {
        await sdk.sendUseItemOnNpc(magnetItem.slot, mouse.index);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || !has(sdk, /^magnet$/i), 5000, 200)) {
          await chat(c, [], 20);
        }
      }

      if (!has(sdk, /^magnet$/i)) {
        doorUnlocked = true;
      }
      return doorUnlocked;
    });

    const gardenAndExperiment = () => step(c, N, 'garden-and-experiment', async () => {
      if (has(sdk, /^ball$/i)) return true;

      // Open back door (2862 at 2901, 3465) into garden if inside mouse room
      if (!inGarden() && !inShed()) {
        await bot.walkTo(2901, 3466, 0);
        const backDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2862);
        if (backDoor) await sdk.sendInteractLoc(backDoor.x, backDoor.z, backDoor.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) <= 3465, 4000, 250);
      }

      // Helper: wait until Nora T. Hagg (896) is safely away from target x range
      const waitNoraSafe = async (pred: (nx: number) => boolean, maxMs = 15_000) => {
        const deadline = Date.now() + maxMs;
        while (Date.now() < deadline) {
          const nora = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 896 || /nora/i.test(n.name));
          if (!nora || pred(nora.x)) return true;
          await sleep(300);
        }
        return true;
      };

      // 1. Get Shed key (2411) from Fountain (2864 at 2909, 3470)
      if (!hasShedKey() && !inShed()) {
        await waitNoraSafe((nx) => nx >= 2914);
        await bot.walkTo(2909, 3471, 1);
        for (let i = 0; i < 4 && !hasShedKey(); i++) {
          const ftn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2864);
          if (ftn) await sdk.sendInteractLoc(ftn.x, ftn.z, ftn.id, 2);
          else await bot.interactLoc(/^fountain$/i, /check|search/i);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasShedKey(), 4000, 250)) {
            await chat(c, [], 15);
          }
        }
      }

      if (!hasShedKey() && !inShed()) return false;

      // 2. Walk to Shed door (2863 at 2934, 3463) along z=3463 when Nora is west
      if (!inShed()) {
        await bot.walkTo(2901, 3463, 1);
        await waitNoraSafe((nx) => nx <= 2915);
        await bot.walkTo(2933, 3463, 0);
        const keyItem = (sdk.getState()?.inventory ?? []).find((i: any) => i.id === 2411);
        const shedDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2863);
        if (keyItem && shedDoor) {
          await sdk.sendUseItemOnLoc(keyItem.slot, shedDoor.x, shedDoor.z, shedDoor.id);
          await waitCond(inShed, 5000, 250);
        }
      }

      if (!inShed()) return false;

      // 3. Defeat all 4 forms of Witch's experiment and take Ball (2407)
      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }
      await sdk.sendSetCombatStyle(1);

      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline && !has(sdk, /^ball$/i)) {
        await bot.dismissBlockingUI();
        const exp = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) =>
          [897, 898, 899, 900].includes(n.id) || /experiment|shapeshifter|spider|bear|wolf/i.test(n.name)
        );
        if (exp) {
          if (!sdk.getState()?.player?.combat?.inCombat) {
            await bot.attack(exp);
          }
          await sleep(600);
          continue;
        }
        const ballGround = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === 2407 || /^ball$/i.test(i.name));
        if (ballGround) {
          await bot.pickupItem(ballGround);
          await sleep(900);
        } else {
          await sleep(500);
        }
      }

      await bot.deactivateAllPrayers();
      return has(sdk, /^ball$/i);
    });

    const returnBall = () => step(c, N, 'return-ball', async () => {
      if (xp(sdk, 'Hitpoints') > hpXp0) return true;
      if (!has(sdk, /^ball$/i)) return false;

      // Exit shed (2863 at 2934, 3463)
      if (inShed()) {
        await bot.walkTo(2934, 3463, 0);
        const shedDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2863);
        if (shedDoor) await sdk.sendInteractLoc(shedDoor.x, shedDoor.z, shedDoor.id, 1);
        await waitCond(() => !inShed(), 4000, 250);
      }

      // Walk from garden back through mouse room (2862 at 2901, 3465) and front door (2861 at 2901, 3473)
      if (inGarden()) {
        await bot.walkTo(2901, 3465, 0);
        const backDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2862);
        if (backDoor) await sdk.sendInteractLoc(backDoor.x, backDoor.z, backDoor.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3466, 4000, 250);
      }

      if ((sdk.getState()?.player?.worldX ?? 9999) >= 2901 && (sdk.getState()?.player?.worldX ?? 9999) <= 2907 && (sdk.getState()?.player?.worldZ ?? 0) >= 3466) {
        const w = await bot.walkTo(2901, 3473, 0);
        if (!w?.success) {
          await openNearbyDoors(c, 2902, 3468, 2);
          await openNearbyDoors(c, 2902, 3474, 2);
          await bot.walkTo(2901, 3473, 0);
        }
        const frontDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2861);
        if (frontDoor) await sdk.sendInteractLoc(frontDoor.x, frontDoor.z, frontDoor.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2900, 4000, 250);
      }

      await bot.walkTo(2928, 3456, 2);
      await talk(c, /^boy$/i, []);
      return await waitCond(() => xp(sdk, 'Hitpoints') > hpXp0, 8000, 300);
    });

    if (!(await startAndPrep())) return false;
    if (!(await getMagnetAndUnlockGarden())) return false;
    if (!(await gardenAndExperiment())) return false;
    return await returnBall();
  },
};

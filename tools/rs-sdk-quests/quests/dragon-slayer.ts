import {
  Ctx, Quest, has, count, xp, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors, lumbridgeStairs, walkToVarrock, walkFromVarrockToLumbridge,
  pickupWithWait, rechargePrayer, eatIfLow
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Dragon Slayer';

export const dragon: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const strXp0 = xp(sdk, 'Strength');
    const defXp0 = xp(sdk, 'Defence');

    let oziachSpoken = false;
    let guildmasterQuestionsAsked = false;
    let oracleSpoken = false;
    let shipBought = false;
    let shipRepaired = false;
    let nedGivenMap = false;

    const hasShield = () =>
      has(sdk, /^anti-dragon shield$/i) ||
      (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 1540 || /anti-dragon shield/i.test(e.name));
    const hasPart = (id: number) => (sdk.getState()?.inventory ?? []).some((i: any) => i.id === id);
    const hasFullMap = () =>
      has(sdk, /^crandor map$/i) ||
      (sdk.getState()?.inventory ?? []).some((i: any) => i.id === 1538);

    const startGuildmasterAndOziach = () => step(c, N, 'start-guildmaster-and-oziach', async () => {
      if (xp(sdk, 'Strength') > strXp0 || hasFullMap() || nedGivenMap) return true;
      if (guildmasterQuestionsAsked && (has(sdk, /^maze key$/i) || hasPart(1535))) return true;

      if ((sdk.getState()?.player?.worldX ?? 0) < 2820) {
        await bot.walkTo(2815, 3439, 3);
        if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
          await bot.activatePrayer('protect_from_melee');
        }
        await bot.walkTo(2845, 3505, 3);
        await bot.walkTo(2865, 3435, 3);
        await bot.deactivateAllPrayers();
      }

      // 1. Start at Guildmaster (id 198 at 3190, 3359) inside Champions' Guild
      if (!oziachSpoken && !has(sdk, /^maze key$/i)) {
        await bot.walkTo(3191, 3363, 1);
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1805);
        if (door) {
          await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) <= 3362, 4000, 250);
        }
        await bot.walkTo(3190, 3359, 2);
        await talk(c, /^guildmaster$/i, [
          /can i have a quest/i,
          /what is this place/i,
          /yes/i,
        ]);

        // Exit Champions' Guild
        if ((sdk.getState()?.player?.worldZ ?? 0) <= 3362) {
          const dOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1805);
          if (dOut) {
            await sdk.sendInteractLoc(dOut.x, dOut.z, dOut.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3363, 4000, 250);
          }
        }

        // 2. Speak to Oziach (id 747 at 3068, 3517) in Edgeville
        const w = await bot.walkTo(3068, 3517, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 3071, 3515, 3);
          await bot.walkTo(3068, 3517, 2);
        }
        await talk(c, /^oziach$/i, [
          /can you sell me a rune platebody/i,
          /the guildmaster of the champions' guild told me/i,
          /i thought you were going to give me a quest/i,
          /a dragon, that sounds like fun/i,
        ]);
        oziachSpoken = true;
      }

      // 3. Return to Guildmaster (3190, 3359) and ask all required questions + get Maze key (1542)
      await bot.walkTo(3191, 3363, 1);
      if ((sdk.getState()?.player?.worldZ ?? 9999) >= 3363) {
        const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1805);
        if (door) {
          await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) <= 3362, 4000, 250);
        }
      }
      await bot.walkTo(3190, 3359, 2);
      await talk(c, /^guildmaster$/i, [
        /i talked to oziach/i,
        /how can i find the route to crandor/i,
        /where is melzar's map piece/i,
        /where is thalzar's map piece/i,
        /where is lozar's map piece/i,
        /where can i find the right ship/i,
        /how can i protect myself from the dragon's breath/i,
      ]);
      // Ask any remaining questions if dialogue closed after Maze key
      for (const q of [
        /where is thalzar's map piece/i,
        /where is lozar's map piece/i,
        /where can i find the right ship/i,
        /how can i protect myself from the dragon's breath/i,
      ]) {
        await talk(c, /^guildmaster$/i, [
          /about my quest to kill the dragon/i,
          /how can i find the route to crandor/i,
          q,
        ]);
      }
      if ((sdk.getState()?.player?.worldZ ?? 0) <= 3362) {
        const dOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1805);
        if (dOut) {
          await sdk.sendInteractLoc(dOut.x, dOut.z, dOut.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3363, 4000, 250);
        }
      }

      guildmasterQuestionsAsked = has(sdk, /^maze key$/i) || hasPart(1535);
      return guildmasterQuestionsAsked;
    });

    const shieldAndPrepItems = () => step(c, N, 'shield-and-prep-items', async () => {
      if (xp(sdk, 'Strength') > strXp0 || hasFullMap() || nedGivenMap) return true;

      // 1. Claim Anti-dragon shield (1540) from Duke Horacio on L1 of Lumbridge Castle
      if (!hasShield()) {
        await bot.walkTo(3205, 3209, 2);
        if (!(await lumbridgeStairs(c, 1))) return false;
        await openNearbyDoors(c, 3207, 3222, 2);
        await bot.walkTo(3210, 3220, 2);
        await talk(c, /^duke horacio$/i, [
          /i seek a shield that will protect me from dragonbreath/i,
          /elvarg/i,
        ]);
        await lumbridgeStairs(c, 0);
        if (has(sdk, /^anti-dragon shield$/i)) {
          await bot.equipItem(/^anti-dragon shield$/i);
          await sleep(400);
        }
      }

      // 2. Silk (950) from Silk trader (539 at 3299, 3204) in Al Kharid
      if (!has(sdk, /^silk$/i) && !hasPart(1537)) {
        await bot.walkTo(3267, 3227, 1);
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2882 || l.id === 2883);
        if (gate) {
          await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldX ?? 0) >= 3268, 4000, 200)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c, [/yes, ok/i], 15);
            await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3268, 4000, 200);
          }
        }
        await bot.walkTo(3299, 3204, 3);
        await talk(c, /^silk trader$/i, [/3 coins/i, /ok, 3 coins sounds good/i]);
        await bot.walkTo(3268, 3227, 1);
        const gateOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2882 || l.id === 2883);
        if (gateOut) {
          await sdk.sendInteractLoc(gateOut.x, gateOut.z, gateOut.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldX ?? 9999) < 3268, 4000, 200)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c, [/yes, ok/i], 15);
            await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) < 3268, 4000, 200);
          }
        }
      }

      // 3. Lobster pot (301) from Gerrant (558 at 3014, 3224) in Port Sarim
      if (!has(sdk, /^lobster pot$/i) && !hasPart(1537)) {
        await bot.walkTo(3014, 3224, 2);
        await openNearbyDoors(c, 3016, 3224, 2);
        await bot.openShop(/gerrant/i);
        await sleep(500);
        await bot.buyFromShop(/lobster pot/i, 1);
        await sleep(400);
        if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
      }

      // 4. Unfired bowl (1791): mine Clay at Rimmington (2986, 3239), wet at (2956, 3214), shape at Barbarian Village (3087, 3410)
      if (!has(sdk, /^unfired bowl$/i) && !hasPart(1537)) {
        if (!has(sdk, /pickaxe/i) && !(sdk.getState()?.equipment ?? []).some((e: any) => /pickaxe/i.test(e.name))) {
          await pickupWithWait(c, 2963, 3216, /bronze pickaxe/i, 25);
        }
        if (!has(sdk, /^soft clay$/i)) {
          if (!has(sdk, /^clay$/i)) {
            await bot.walkTo(2986, 3239, 2);
            for (let i = 0; i < 6 && !has(sdk, /^clay$/i); i++) {
              const rock = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2108 || l.id === 2109);
              if (rock) await bot.mineRock(rock);
              await sleep(600);
            }
          }
          if (!has(sdk, /^bucket of water$/i)) {
            if (!has(sdk, /^bucket$/i)) {
              await pickupWithWait(c, 2958, 3215, /^bucket$/i, 25);
            }
            await bot.walkTo(2956, 3214, 2);
            await bot.useItemOnLoc(/^bucket$/i, /^well$/i);
            await waitInv(sdk, /^bucket of water$/i, 5000);
          }
          const cl = sdk.findInventoryItem(/^clay$/i);
          const bw = sdk.findInventoryItem(/^bucket of water$/i);
          if (cl && bw) {
            await sdk.sendUseItemOnItem(cl.slot, bw.slot);
            await waitInv(sdk, /^soft clay$/i, 4000);
          }
        }
        if (has(sdk, /^soft clay$/i)) {
          const w = await bot.walkTo(3086, 3410, 1);
          if (!w?.success) {
            await openNearbyDoors(c, 3084, 3409, 2);
            await bot.walkTo(3086, 3410, 1);
          }
          const sc = sdk.findInventoryItem(/^soft clay$/i);
          const wheel = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2642 || /potter/i.test(l.name));
          if (sc && wheel) {
            await sdk.sendUseItemOnLoc(sc.slot, wheel.x, wheel.z, wheel.id);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 200)) {
              await chat(c, [/bowl/i], 10);
            }
            await waitInv(sdk, /^unfired bowl$/i, 5000);
          }
        }
      }

      // 5. Wizard's mind bomb (1907) from Emily/Kaylee at Falador Rising Sun Inn (2956, 3370)
      if (!has(sdk, /^wizard's mind bomb$/i) && !hasPart(1537)) {
        const w = await bot.walkTo(2956, 3370, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 2956, 3374, 3);
          await bot.walkTo(2956, 3370, 2);
        }
        await talk(c, /^(emily|kaylee)$/i, [/wizard's mind bomb/i]);
        await waitInv(sdk, /^wizard's mind bomb$/i, 4000);
      }

      return hasShield();
    });

    const threeMapPieces = () => step(c, N, 'three-map-pieces', async () => {
      if (xp(sdk, 'Strength') > strXp0 || hasFullMap() || nedGivenMap) return true;

      // 1. Thalzar's map piece (mappart3, id 1537): Oracle (3013, 3501) -> Dwarven Mine magic door (3049, 9840)
      if (!hasPart(1537)) {
        if (!oracleSpoken) {
          await bot.walkTo(3013, 3501, 2);
          await talk(c, /^oracle$/i, [/i seek a piece of the map to the isle of crandor/i]);
          oracleSpoken = true;
        }
        await bot.walkTo(3019, 3450, 1);
        const ladDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1759 && Math.hypot(l.x - 3019, l.z - 3450) <= 2);
        if (ladDown) {
          await sdk.sendInteractLoc(ladDown.x, ladDown.z, ladDown.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
        }
        await bot.walkTo(3048, 9840, 1);
        const mDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2595);
        if (mDoor) {
          await sdk.sendInteractLoc(mDoor.x, mDoor.z, mDoor.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3050, 5000, 250);
        }
        await bot.walkTo(3055, 9841, 1);
        for (let i = 0; i < 4 && !hasPart(1537); i++) {
          const ch = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2603 || l.id === 2604);
          if (ch) await sdk.sendInteractLoc(ch.x, ch.z, ch.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasPart(1537), 3500, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
          await sleep(400);
        }
        await bot.walkTo(3050, 9840, 1);
        const mDoorOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2595);
        if (mDoorOut) {
          await sdk.sendInteractLoc(mDoorOut.x, mDoorOut.z, mDoorOut.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 3049, 5000, 250);
        }
        await bot.walkTo(3019, 9850, 1);
        const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 && Math.hypot(l.x - 3019, l.z - 9850) <= 2);
        if (ladUp) {
          await sdk.sendInteractLoc(ladUp.x, ladUp.z, ladUp.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 250);
        }
      }

      // 2. Lozar's map piece (mappart2, id 1536): Wormbrain (id 745 at 3014, 3189) in Port Sarim Jail
      if (!hasPart(1536)) {
        // Ensure 10,000 coins to buy the map piece directly in dialogue (or if less, smith & sell steel platebodies)
        while (count(sdk, /^coins$/i) < 10_000) {
          // Mine 5 Iron + 10 Coal -> 5 Steel bars -> 1 Steel platebody (sells for 800+ gp) or pickpocket/sell
          if (!has(sdk, /^hammer$/i)) await pickupWithWait(c, 2966, 3212, /^hammer$/i, 20);
          await bot.walkTo(3019, 3450, 1);
          const ladDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1759);
          if (ladDown) {
            await sdk.sendInteractLoc(ladDown.x, ladDown.z, ladDown.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
          }
          while (count(sdk, /^iron ore$/i) < 5) {
            await bot.walkTo(3033, 9826, 2);
            const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2092 || l.id === 2093);
            if (r) await bot.mineRock(r);
            await sleep(500);
          }
          while (count(sdk, /^coal$/i) < 10) {
            await bot.walkTo(3045, 9822, 2);
            const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2096 || l.id === 2097);
            if (r) await bot.mineRock(r);
            await sleep(500);
          }
          await bot.walkTo(3019, 9850, 1);
          const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (ladUp) {
            await sdk.sendInteractLoc(ladUp.x, ladUp.z, ladUp.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 250);
          }
          await bot.walkTo(2975, 3369, 2);
          while (count(sdk, /^iron ore$/i) > 0 && count(sdk, /^coal$/i) >= 2) {
            await bot.smeltAtFurnace({ orePattern: /^iron ore$/i });
            await sleep(400);
          }
          await bot.walkTo(2950, 3451, 2);
          await openNearbyDoors(c, 2948, 3450, 2);
          await bot.smithAtAnvil('steel platebody', { barPattern: /^steel bar$/i });
          await bot.walkTo(2958, 3385, 2);
          await bot.openShop(/shop keeper|shop assistant/i);
          await sleep(400);
          await bot.sellToShop(/^steel platebody$/i, 1);
          await sleep(400);
          if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
        }
        await bot.walkTo(3014, 3190, 2);
        const wb = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 745 || /wormbrain/i.test(n.name));
        if (wb) {
          await sdk.sendInteractNpc(wb.index, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 5000, 250)) {
            await chat(c, [
              /i believe you've got a piece of map that i need/i,
              /i suppose i could pay you for the map piece/i,
              /alright then, 10,000 it is/i,
            ], 25);
          }
        }
      }

      // 3. Melzar's Maze map piece (mappart1, id 1535): Melzar's Maze (2941, 3248)
      if (!hasPart(1535)) {
        await rechargePrayer(c, 35);
        for (const w of [/^silverlight$/i, /^bronze sword$/i, /^anti-dragon shield$/i]) {
          if (has(sdk, w)) { await bot.equipItem(w); await sleep(250); }
        }
        await sdk.sendSetCombatStyle(1);
        await bot.walkTo(2941, 3248, 1);
        const mk = sdk.findInventoryItem(/^maze key$/i);
        const mDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2595);
        if (mk && mDoor) {
          await sdk.sendUseItemOnLoc(mk.slot, mDoor.x, mDoor.z, mDoor.id);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2940, 5000, 250);
        }

        const killForKey = async (npcId: number, x: number, z: number, keyId: number, doorId: number, dx: number, dz: number) => {
          if (!(sdk.getState()?.inventory ?? []).some((i: any) => i.id === keyId)) {
            await bot.walkTo(x, z, 2);
            const deadline = Date.now() + 60_000;
            while (Date.now() < deadline && !(sdk.getState()?.inventory ?? []).some((i: any) => i.id === keyId)) {
              const g = (sdk.getState()?.groundItems ?? []).find((i: any) => i.id === keyId);
              if (g) {
                await bot.pickupItem(g);
                if (await waitCond(() => (sdk.getState()?.inventory ?? []).some((i: any) => i.id === keyId), 3500, 200)) break;
              }
              const target = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === npcId);
              if (target && !sdk.getState()?.player?.combat?.inCombat) {
                await bot.attack(target);
              }
              await sleep(500);
            }
          }
          await bot.walkTo(dx, dz, 1);
          const keyItem = (sdk.getState()?.inventory ?? []).find((i: any) => i.id === keyId);
          const door = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === doorId && Math.hypot(l.x - dx, l.z - dz) <= 2);
          if (keyItem && door) {
            await sdk.sendUseItemOnLoc(keyItem.slot, door.x, door.z, door.id);
            await sleep(1500);
          }
        };

        // L0 Giant rat (748 at 2930, 3252) -> Red key (1543) -> reddoor (2596 at 2926, 3253) -> climb up 1747 at (2928, 3256)
        await killForKey(748, 2930, 3252, 1543, 2596, 2926, 3253);
        await bot.walkTo(2928, 3256, 1);
        const l0Up = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 && Math.hypot(l.x - 2928, l.z - 3256) <= 2);
        if (l0Up) {
          await sdk.sendInteractLoc(l0Up.x, l0Up.z, l0Up.id, 1);
          await waitCond(() => lvl(sdk) === 1, 4000, 250);
        }

        // L1 Ghost (749 at 2926, 3254) -> Orange key (1544) -> orangedoor (2597 at 2931, 3253) -> climb up 1747 at (2934, 3254)
        await killForKey(749, 2926, 3254, 1544, 2597, 2930, 3253);
        await bot.walkTo(2934, 3254, 1);
        const l1Up = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 && Math.hypot(l.x - 2934, l.z - 3254) <= 2);
        if (l1Up) {
          await sdk.sendInteractLoc(l1Up.x, l1Up.z, l1Up.id, 1);
          await waitCond(() => lvl(sdk) === 2, 4000, 250);
        }

        // L2 Skeleton (750 at 2923, 3251) -> Yellow key (1545) -> yellowdoor (2598 at 2924, 3249) -> down (2940, 3240) -> down (2937, 3240) -> down (2932, 3240)
        await killForKey(750, 2923, 3251, 1545, 2598, 2924, 3249);
        await bot.walkTo(2940, 3240, 1);
        const l2Down = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746 && Math.hypot(l.x - 2940, l.z - 3240) <= 2);
        if (l2Down) {
          await sdk.sendInteractLoc(l2Down.x, l2Down.z, l2Down.id, 1);
          await waitCond(() => lvl(sdk) === 1, 4000, 250);
        }
        await bot.walkTo(2937, 3240, 1);
        const l1Down = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746 && Math.hypot(l.x - 2937, l.z - 3240) <= 2);
        if (l1Down) {
          await sdk.sendInteractLoc(l1Down.x, l1Down.z, l1Down.id, 1);
          await waitCond(() => lvl(sdk) === 0, 4000, 250);
        }
        await bot.walkTo(2932, 3240, 1);
        const bDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2605);
        if (bDown) {
          await sdk.sendInteractLoc(bDown.x, bDown.z, bDown.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
        }

        // Basement: Zombie (751 at 2932, 9642) -> Blue key (1546) -> bluedoor (2599 at 2931, 9643)
        await killForKey(751, 2932, 9642, 1546, 2599, 2932, 9643);
        // Melzar the Mad (753 at 2929, 9649) -> Magenta key (1547) -> magentadoor (2600 at 2929, 9652)
        await killForKey(753, 2929, 9649, 1547, 2600, 2929, 9651);
        // Lesser demon (752 at 2936, 9650) -> Green key (1548) -> greendoor (2601 at 2936, 9655)
        if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
          await bot.activatePrayer('protect_from_melee');
        }
        await killForKey(752, 2936, 9650, 1548, 2601, 2936, 9655);
        await bot.deactivateAllPrayers();

        // Open and search Chest (2603/2604 at 2935, 9657) -> mappart1 (1535)
        await bot.walkTo(2935, 9656, 1);
        for (let i = 0; i < 4 && !hasPart(1535); i++) {
          const ch = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2603 || l.id === 2604);
          if (ch) await sdk.sendInteractLoc(ch.x, ch.z, ch.id, 1);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasPart(1535), 3500, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
          await sleep(400);
        }

        // Climb up 1755 at (2939, 9657) and exit funexit (2602 at 2938, 3252)
        await bot.walkTo(2939, 9656, 1);
        const bUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
        if (bUp) {
          await sdk.sendInteractLoc(bUp.x, bUp.z, bUp.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 250);
        }
        await bot.walkTo(2938, 3252, 1);
        const exitDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2602);
        if (exitDoor) {
          await sdk.sendInteractLoc(exitDoor.x, exitDoor.z, exitDoor.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2939, 4000, 250);
        }
      }

      // 4. Combine all 3 map parts (1535, 1536, 1537) into Crandor map (1538)
      if (!hasFullMap() && hasPart(1535) && hasPart(1536) && hasPart(1537)) {
        const p1 = (sdk.getState()?.inventory ?? []).find((i: any) => i.id === 1535);
        const p2 = (sdk.getState()?.inventory ?? []).find((i: any) => i.id === 1536);
        if (p1 && p2) {
          await sdk.sendUseItemOnItem(p1.slot, p2.slot);
          if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || hasFullMap(), 4000, 250)) {
            if (sdk.getState()?.dialog?.isOpen) await chat(c);
          }
        }
      }

      return hasFullMap();
    });

    const shipAndSailToCrandor = () => step(c, N, 'ship-and-sail-to-crandor', async () => {
      if (xp(sdk, 'Strength') > strXp0) return true;

      // 1. Ensure 90 Steel nails (1539), 3 Planks (960), Hammer (2347), and 2,000 Coins
      if (!shipRepaired && !nedGivenMap) {
        if (!has(sdk, /^hammer$/i)) await pickupWithWait(c, 2966, 3212, /^hammer$/i, 20);
        while (count(sdk, /^steel nails|nails$/i) < 90) {
          await bot.walkTo(3019, 3450, 1);
          const ladDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1759);
          if (ladDown) {
            await sdk.sendInteractLoc(ladDown.x, ladDown.z, ladDown.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
          }
          while (count(sdk, /^iron ore$/i) < 6) {
            await bot.walkTo(3033, 9826, 2);
            const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2092 || l.id === 2093);
            if (r) await bot.mineRock(r);
            await sleep(500);
          }
          while (count(sdk, /^coal$/i) < 12) {
            await bot.walkTo(3045, 9822, 2);
            const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2096 || l.id === 2097);
            if (r) await bot.mineRock(r);
            await sleep(500);
          }
          await bot.walkTo(3019, 9850, 1);
          const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755);
          if (ladUp) {
            await sdk.sendInteractLoc(ladUp.x, ladUp.z, ladUp.id, 1);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 250);
          }
          await bot.walkTo(2975, 3369, 2);
          while (count(sdk, /^iron ore$/i) > 0 && count(sdk, /^coal$/i) >= 2) {
            await bot.smeltAtFurnace({ orePattern: /^iron ore$/i });
            await sleep(400);
          }
          await bot.walkTo(2950, 3451, 2);
          await openNearbyDoors(c, 2948, 3450, 2);
          while (count(sdk, /^steel bar$/i) > 0 && count(sdk, /^steel nails|nails$/i) < 90) {
            await bot.smithAtAnvil('steel nails', { barPattern: /^steel bar$/i });
            await sleep(400);
          }
        }

        // Gather 3 Planks at Graveyard of Shadows (3148, 3671 / 3154, 3659) or Kandarin
        while (count(sdk, /^plank$/i) < 3) {
          await pickupWithWait(c, 3148, 3671, /^plank$/i, 15);
          if (count(sdk, /^plank$/i) < 3) await pickupWithWait(c, 3154, 3659, /^plank$/i, 15);
          if (count(sdk, /^plank$/i) < 3) await pickupWithWait(c, 3154, 3670, /^plank$/i, 15);
        }

        // Buy Lady Lumbridge from Klarense (744 at 3047, 3205) for 2,000 coins
        if (!shipBought) {
          await bot.walkTo(3047, 3205, 2);
          await talk(c, /^klarense$/i, [
            /i'd like to buy her/i,
            /yep, sounds good/i,
            /i'm sure/i,
          ]);
          shipBought = true;
        }

        // Board Lady Lumbridge (2593 at 3047, 3204), climb down ladder (2590 at L1 3049, 3208), repair shiphole (2596/2597/2589) 3 times
        await bot.walkTo(3047, 3204, 1);
        const plankOn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2593);
        if (plankOn) {
          await sdk.sendInteractLoc(plankOn.x, plankOn.z, plankOn.id, 1);
          await waitCond(() => lvl(sdk) === 1, 5000, 250);
        }
        const shipLad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2590);
        if (shipLad) {
          await sdk.sendInteractLoc(shipLad.x, shipLad.z, shipLad.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
        }
        for (let i = 0; i < 3 && count(sdk, /^plank$/i) > 0; i++) {
          const pl = sdk.findInventoryItem(/^plank$/i);
          const hole = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /hole/i.test(l.name) || l.id === 2589);
          if (pl && hole) {
            await sdk.sendUseItemOnLoc(pl.slot, hole.x, hole.z, hole.id);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 250)) {
              await chat(c);
            }
          }
          await sleep(400);
        }
        shipRepaired = true;

        // Climb up dragonshipladder (2591) and disembark (2594)
        const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2591);
        if (ladUp) {
          await sdk.sendInteractLoc(ladUp.x, ladUp.z, ladUp.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 9999) < 9000, 5000, 250);
        }
        const plankOff = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2594);
        if (plankOff) {
          await sdk.sendInteractLoc(plankOff.x, plankOff.z, plankOff.id, 1);
          await waitCond(() => lvl(sdk) === 0, 5000, 250);
        }
      }

      // 2. Hire Ned in Draynor Village (3097, 3257) with Crandor map (1538)
      if (!nedGivenMap && hasFullMap()) {
        const w = await bot.walkTo(3097, 3257, 2);
        if (!w?.success) {
          await openNearbyDoors(c, 3100, 3257, 2);
          await bot.walkTo(3097, 3257, 2);
        }
        await talk(c, /^ned$/i, [
          /you're a sailor\? could you take me to crandor/i,
        ]);
        nedGivenMap = !hasFullMap();
      }

      // 3. Board Lady Lumbridge (3047, 3204), climb down dragonshipladdertop (2590) -> L3 (3047, 9640), speak to Captain Ned -> Crandor!
      await rechargePrayer(c, 40);
      await bot.walkTo(3047, 3204, 1);
      const plankOn2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2593);
      if (plankOn2) {
        await sdk.sendInteractLoc(plankOn2.x, plankOn2.z, plankOn2.id, 1);
        await waitCond(() => lvl(sdk) === 1, 5000, 250);
      }
      const shipLad2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2590);
      if (shipLad2) {
        await sdk.sendInteractLoc(shipLad2.x, shipLad2.z, shipLad2.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
      }
      await talk(c, /^(captain )?ned$/i, [/yep lets go/i]);
      await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) < 2900 && (sdk.getState()?.player?.worldZ ?? 9999) < 4000, 15_000, 400);
      if (sdk.getState()?.dialog?.isOpen) await chat(c, [], 15);

      return (sdk.getState()?.player?.worldX ?? 9999) < 2900;
    });

    const slayElvarg = () => step(c, N, 'slay-elvarg', async () => {
      if (xp(sdk, 'Strength') > strXp0) return true;

      for (const w of [/^anti-dragon shield$/i, /^silverlight$/i, /^bronze sword$/i]) {
        if (has(sdk, w)) { await bot.equipItem(w); await sleep(300); }
      }
      await sdk.sendSetCombatStyle(1);

      // Disembark wrecked Lady Lumbridge on Crandor via dragonshipladdertop2 (2592 at L1 2849, 3236)
      if (lvl(sdk) === 1) {
        const ladOff = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2592);
        if (ladOff) {
          await sdk.sendInteractLoc(ladOff.x, ladOff.z, ladOff.id, 1);
          await waitCond(() => lvl(sdk) === 0, 5000, 250);
        }
      }

      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }

      // Enter Crandor dungeon via crandor_rock_opening (2591 at 2834, 3256) -> (2833, 9658)
      if ((sdk.getState()?.player?.worldZ ?? 0) < 9000) {
        await bot.walkTo(2834, 3255, 1);
        const opening = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2591);
        if (opening) {
          await sdk.sendInteractLoc(opening.x, opening.z, opening.id, 1);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) > 9000, 5000, 250);
        }
      }

      // Unlock secret Karamja wall (2606 at 2836, 9600) just in case, then enter Elvarg's gate (2607/2608 at 2847, 9636)
      await bot.walkTo(2846, 9636, 1);
      const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2607 || l.id === 2608);
      if (gate) {
        await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 2847, 5000, 250);
      }

      // Fight Elvarg (id 742)
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline && xp(sdk, 'Strength') === strXp0) {
        await eatIfLow(c);
        if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
          if (!sdk.getState()?.prayers?.protect_from_melee) {
            await bot.activatePrayer('protect_from_melee');
          }
        }
        const elvarg = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === 742 || /elvarg/i.test(n.name));
        if (elvarg && !sdk.getState()?.player?.combat?.inCombat) {
          await bot.attack(elvarg);
        }
        await sleep(600);
      }

      await bot.deactivateAllPrayers();
      return xp(sdk, 'Strength') > strXp0 && xp(sdk, 'Defence') > defXp0;
    });

    if (!(await startGuildmasterAndOziach())) return false;
    if (!(await shieldAndPrepItems())) return false;
    if (!(await threeMapPieces())) return false;
    if (!(await shipAndSailToCrandor())) return false;
    return await slayElvarg();
  },
};

import {
  Ctx, Quest, has, count, xp, lvl, sleep, chat, talk, waitInv, waitCond, step,
  openNearbyDoors, pickupWithWait, walkToVarrock, walkFromVarrockToLumbridge
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';
import { elena } from './plague-city';

const N = 'Biohazard';

export const biohazard: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const thievingXp0 = xp(sdk, 'Thieving');
    let questComplete = false;
    let pigeonsReleased = false;
    let stewPoisoned = false;
    let givenDistillator = false;
    let spokenGuidor = false;
    let reportedElena = false;

    const inWestArdougne = () => (sdk.getState()?.player?.worldX ?? 3000) <= 2557;
    const hasDistillator = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 420 || /distillator/i.test(i.name));
    const hasPlagueSample = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 418 || /plague sample/i.test(i.name));
    const hasTouchPaper = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 419 || /touch paper/i.test(i.name));
    const hasEthenea = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 415 || /ethenea/i.test(i.name));
    const hasLiquidHoney = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 416 || /liquid honey/i.test(i.name));
    const hasSulphuricBroline = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 417 || /sulphuric broline/i.test(i.name));
    const wearingDoctorGown = () => (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 430 || /doctor's gown/i.test(e.name));
    const wearingPriestTop = () => (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 428);
    const wearingPriestBottom = () => (sdk.getState()?.equipment ?? []).some((e: any) => e.id === 426);

    const startAndDistract = () => step(c, N, 'start-and-distract-watchtower', async () => {
      if (questComplete || inWestArdougne() || hasDistillator() || hasPlagueSample() || givenDistillator) return true;

      // Ensure Plague City is completed first
      if ((sdk.getSkill('Mining')?.experience ?? 0) < 60_000) {
        if (!(await elena.run(c))) return false;
      }

      if ((sdk.getState()?.player?.worldX ?? 3200) > 2860) {
        if (!(await walkToKandarin(c, 2592, 3336))) return false;
      }

      const scroll = sdk.findInventoryItem(/^a magic scroll$/i);
      if (scroll) {
        await sdk.sendUseItem(scroll.slot, 1);
        await sleep(1000);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }

      for (const dropRe of [/^bucket$/i, /^picture$/i, /^warrant$/i, /^a small key$/i, /^a magic scroll$/i, /^mark of hazeel$/i, /^child's blanket$/i, /^feed$/i, /^key$/i, /^spade$/i]) {
        for (const it of (sdk.getInventory() ?? []).filter((i: any) => dropRe.test(i.name))) {
          await sdk.sendDropItem(it.slot);
          await sleep(300);
        }
      }

      // 1. Talk to Elena (2592, 3336)
      const we = await bot.walkTo(2592, 3336, 2);
      if (!we?.success) {
        await openNearbyDoors(c, 2592, 3335, 3);
        await bot.walkTo(2592, 3336, 2);
      }
      if (!(await talk(c, /^elena$/i, [/try to retrieve it for you/i]))) return false;
      const recentE = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
      if (/let me know when you hear from king lathas/i.test(recentE)) {
        questComplete = true;
        return true;
      }
      if (/go see king lathas immediately|need to see the king of east ardougne/i.test(recentE)) {
        reportedElena = true;
        givenDistillator = true;
        spokenGuidor = true;
        return true;
      }

      // 2. Talk to Jerico (2612, 3324)
      const wj = await bot.walkTo(2612, 3324, 2);
      if (!wj?.success) {
        await openNearbyDoors(c, 2612, 3324, 3);
        await bot.walkTo(2612, 3324, 2);
      }
      await talk(c, /^jerico$/i, [/messenger pigeons to distract them/i]);

      // 3. Get Birdfeed (422) from Jerico's cupboard (2612, 3326)
      if (!has(sdk, /^bird ?feed$/i) && !pigeonsReleased) {
        await bot.walkTo(2612, 3326, 2);
        for (let i = 0; i < 4 && !has(sdk, /^bird ?feed$/i); i++) {
          const cb = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^cupboard$/i.test(l.name) && Math.hypot(l.x - 2612, l.z - 3326) <= 3);
          if (cb) {
            const opt = (cb.options ?? []).find((o: string) => /^(open|search)$/i.test(o)) ?? 'Open';
            await bot.interactLoc(cb, new RegExp(`^${opt}$`, 'i'));
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || has(sdk, /^bird ?feed$/i), 3500, 250)) {
              if (sdk.getState()?.dialog?.isOpen) await chat(c);
            }
          }
          await sleep(400);
        }
      }

      // 4. Pick up Pigeon cage (424) behind Jerico's house at (2618, 3325)
      if (!(sdk.getInventory() ?? []).some((i: any) => i.id === 424) && !pigeonsReleased) {
        const wp = await bot.walkTo(2618, 3325, 2);
        if (!wp?.success) {
          await openNearbyDoors(c, 2615, 3325, 3);
          await bot.walkTo(2618, 3325, 2);
        }
        await pickupWithWait(c, 2618, 3325, /^pigeon cage$/i, 15);
      }

      // 5. Talk to Omart at south end of wall (2559, 3266)
      await bot.walkTo(2559, 3266, 2);
      await talk(c, /^omart$/i, [/ok, lets do it/i]);
      if (inWestArdougne()) return true;

      // 6. Use Birdfeed on Watchtower (loc_2067 at 2563, 3302) and release Pigeons (424) at (2563, 3302)
      await bot.walkTo(2563, 3302, 1);
      const feed = (sdk.getInventory() ?? []).find((i: any) => i.id === 422 || /^bird ?feed$/i.test(i.name));
      const tower = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => (l.id === 2067 || /^watchtower$/i.test(l.name)) && l.x === 2563 && l.z === 3302)
        ?? (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2067 || /^watchtower$/i.test(l.name));
      if (feed && tower) {
        await sdk.sendUseItemOnLoc(feed.slot, tower.x, tower.z, tower.id);
        await waitCond(() => !has(sdk, /^bird ?feed$/i), 5000, 300);
      }
      const cage = (sdk.getInventory() ?? []).find((i: any) => i.id === 424 || (/^pigeon cage$/i.test(i.name) && (i.options ?? []).some((o: string) => /open/i.test(o))));
      if (cage) {
        await sdk.sendUseItem(cage.slot, 1);
        await waitCond(() => !(sdk.getInventory() ?? []).some((i: any) => i.id === 424 || (/^pigeon cage$/i.test(i.name) && (i.options ?? []).some((o: string) => /open/i.test(o)))), 6000, 300);
        pigeonsReleased = true;
      }

      // 7. Return to Omart (2559, 3266) and climb over wall into West Ardougne
      await bot.walkTo(2559, 3266, 2);
      await talk(c, /^omart$/i, [/ok, lets do it/i]);
      await waitCond(() => inWestArdougne(), 8000, 300);
      return inWestArdougne();
    });

    const retrieveDistillator = () => step(c, N, 'retrieve-distillator', async () => {
      if (questComplete || hasPlagueSample() || givenDistillator) return true;

      if (!inWestArdougne() && !hasDistillator()) {
        await bot.walkTo(2559, 3266, 2);
        await talk(c, /^omart$/i, [/ok, lets do it/i]);
        if (!(await waitCond(() => inWestArdougne(), 8000, 300))) return false;
      }

      if (!hasDistillator()) {
        // 1. Pick up Rotten apple (1984) at (2535, 3333) and poison Cauldron (2043) at (2543, 3332)
        if (!stewPoisoned) {
          if (!has(sdk, /^rotten apple$/i)) {
            await pickupWithWait(c, 2535, 3333, /^rotten apple$/i, 15);
          }
          await bot.walkTo(2542, 3331, 1);
          const fence = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^fence$/i.test(l.name) && (l.options ?? []).some((o: string) => /squeeze/i.test(o)));
          if (fence) {
            await bot.interactLoc(fence, /squeeze/i);
            await sleep(2200);
          }
          const apple = (sdk.getInventory() ?? []).find((i: any) => i.id === 1984 || /^rotten apple$/i.test(i.name));
          const cauldron = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2043 || /^cauldron$/i.test(l.name));
          if (apple && cauldron) {
            await sdk.sendUseItemOnLoc(apple.slot, cauldron.x, cauldron.z, cauldron.id);
            await waitCond(() => !has(sdk, /^rotten apple$/i), 6000, 300);
            stewPoisoned = true;
          }
          const fenceOut = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^fence$/i.test(l.name) && (l.options ?? []).some((o: string) => /squeeze/i.test(o)));
          if (fenceOut && (sdk.getState()?.player?.worldX ?? 0) >= 2542) {
            await bot.interactLoc(fenceOut, /squeeze/i);
            await sleep(2200);
          }
        }

        // 2. Get Doctor's gown (430) from Nurse Sarah's cupboard at (2518, 3276) and equip it
        if (!wearingDoctorGown() && !has(sdk, /^doctor's gown$/i)) {
          const wn = await bot.walkTo(2518, 3275, 2);
          if (!wn?.success) {
            await openNearbyDoors(c, 2517, 3273, 3);
            await bot.walkTo(2518, 3275, 2);
          }
          for (let i = 0; i < 4 && !has(sdk, /^doctor's gown$/i); i++) {
            const cb = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^cupboard$/i.test(l.name) && Math.hypot(l.x - 2518, l.z - 3276) <= 3);
            if (cb) {
              const opt = (cb.options ?? []).find((o: string) => /^(open|search)$/i.test(o)) ?? 'Open';
              await bot.interactLoc(cb, new RegExp(`^${opt}$`, 'i'));
              await sleep(900);
            }
          }
        }
        if (has(sdk, /^doctor's gown$/i) && !wearingDoctorGown()) {
          await bot.equipItem(/^doctor's gown$/i);
          await sleep(400);
        }

        // 3. Enter Mourner HQ at (2551, 3320)
        if (lvl(sdk) === 0) {
          await bot.walkTo(2551, 3320, 1);
          for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 3320; i++) {
            const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^door$/i.test(l.name) && Math.hypot(l.x - 2551, l.z - 3320) <= 2);
            if (d) {
              await bot.interactLoc(d, /^open$/i);
              if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldZ ?? 0) >= 3321, 3500, 250)) {
                if (sdk.getState()?.dialog?.isOpen) await chat(c);
              }
            }
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3321, 2500, 250);
          }
          // Climb stairs/ladder at (2549, 3325) to L1
          await bot.walkTo(2549, 3324, 2);
          const up = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /(staircase|ladder)/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?up/i.test(o)));
          if (up) {
            await bot.interactLoc(up, /climb-?up/i);
            await waitCond(() => lvl(sdk) === 1, 5000, 300);
          }
        }

        // 4. On L1: kill sick Mourner (mournerstew2) for Key (423), open Gate, search Crate (mournercrateup)
        if (lvl(sdk) === 1 && !hasDistillator()) {
          const hasKey = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 423);
          if (!hasKey()) {
            await openNearbyDoors(c, 2549, 3325, 4);
            const mourner = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^mourner$/i.test(n.name));
            if (mourner) {
              const wep = sdk.findInventoryItem(/sword|scimitar|axe|mace|dagger/i);
              if (wep) {
                await bot.equipItem(wep);
                await sleep(400);
              }
              if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
                await bot.activatePrayer('protect_from_melee');
              }
              await sdk.sendSetCombatStyle(1);
              const deadline = Date.now() + 60_000;
              while (Date.now() < deadline && !hasKey()) {
                await bot.dismissBlockingUI();
                const m = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^mourner$/i.test(n.name));
                if (m && !sdk.getState()?.player?.combat?.inCombat) {
                  await bot.attack(m);
                }
                await sleep(600);
              }
              await bot.deactivateAllPrayers();
            }
          }

          // Open gate at (2554, 3326) and search Crate at (2554, 3327)
          for (let i = 0; i < 5 && !hasDistillator(); i++) {
            const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name) && Math.hypot(l.x - 2554, l.z - 3326) <= 3);
            if (gate && (sdk.getState()?.player?.worldX ?? 0) < 2554) {
              await bot.interactLoc(gate, /^open$/i);
              await sleep(1200);
            }
            const crate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^crate$/i.test(l.name) && Math.hypot(l.x - 2554, l.z - 3327) <= 3 && (l.options ?? []).some((o: string) => /^search$/i.test(o)));
            if (crate) {
              await bot.interactLoc(crate, /^search$/i);
              await waitCond(() => hasDistillator(), 4500, 300);
            }
          }
        }
      }

      // Climb down to L0 if on L1
      if (lvl(sdk) === 1) {
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name) && Math.hypot(l.x - 2554, l.z - 3326) <= 3);
        if (gate && (sdk.getState()?.player?.worldX ?? 0) >= 2554) {
          await bot.interactLoc(gate, /^open$/i);
          await sleep(1000);
        }
        const down = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /(staircase|ladder)/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o)));
        if (down) {
          await bot.interactLoc(down, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 5000, 300);
        }
      }

      // Return across wall via Kilron at (2556, 3266)
      if (inWestArdougne()) {
        if ((sdk.getState()?.player?.worldZ ?? 0) >= 3321 && (sdk.getState()?.player?.worldX ?? 0) >= 2547) {
          await openNearbyDoors(c, 2551, 3320, 3);
        }
        await bot.walkTo(2556, 3266, 2);
        await talk(c, /^kilron$/i, [/yes i do/i]);
        await waitCond(() => !inWestArdougne(), 8000, 300);
      }

      // Ensure at least 5 free inventory slots before talking to Elena
      for (const dropRe of [/^pigeon cage$/i, /^key$/i, /^rotten apple$/i, /^bucket$/i, /^picture$/i, /^warrant$/i, /^a small key$/i, /^a magic scroll$/i, /^mark of hazeel$/i, /^child's blanket$/i, /^feed$/i, /^spade$/i]) {
        for (const it of (sdk.getInventory() ?? []).filter((i: any) => dropRe.test(i.name))) {
          await sdk.sendDropItem(it.slot);
          await sleep(300);
        }
      }

      // Hand Distillator to Elena (2592, 3336)
      const we2 = await bot.walkTo(2592, 3336, 2);
      if (!we2?.success) {
        await openNearbyDoors(c, 2592, 3335, 3);
        await bot.walkTo(2592, 3336, 2);
      }
      await talk(c, /^elena$/i, [/lost some of the stuff/i]);
      givenDistillator = hasPlagueSample();
      return givenDistillator;
    });

    const chemistGuidorAndFinish = () => step(c, N, 'chemist-guidor-and-finish', async () => {
      if (questComplete) return true;

      if (!spokenGuidor && !reportedElena) {
        // 1. Walk to Chemist in Rimmington (2933, 3210)
        if (!hasTouchPaper()) {
          if ((sdk.getState()?.player?.worldX ?? 2600) < 2860) {
            await bot.walkTo(2655, 3285, 3);
            await bot.walkTo(2750, 3420, 3);
            await bot.walkTo(2845, 3430, 3);
            await bot.walkTo(2866, 3430, 3);
          }
          await bot.walkTo(2933, 3210, 2);
          await openNearbyDoors(c, 2933, 3210, 3);
          await talk(c, /^chemist$/i, [
            /it's ok, i'm elena's friend/i,
            /just need some touch paper for a guy called guidor/i,
          ]);
          if (!hasTouchPaper()) return false;
        }

        // 2. Give vials to Errand Boys outside Chemist's house (2930, 3214)
        await bot.walkTo(2930, 3214, 3);
        if (hasSulphuricBroline()) {
          await talk(c, /^hops$/i, [/vial of sulphuric broline/i]);
        }
        if (hasEthenea()) {
          await talk(c, /^da vinci$/i, [/vial of ethenea/i]);
        }
        if (hasLiquidHoney()) {
          await talk(c, /^chancy$/i, [/vial of liquid honey/i]);
        }

        // 3. Walk to SE Varrock Gate (3262, 3405) and pass guard search
        if (!(await walkToVarrock(c, 3262, 3405))) return false;
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 0) < 3263; i++) {
          const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name) && Math.hypot(l.x - 3263, l.z - 3405) <= 3);
          if (gate) {
            await bot.interactLoc(gate, /^open$/i);
            if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldX ?? 0) >= 3263, 4000, 250)) {
              if (sdk.getState()?.dialog?.isOpen) await chat(c);
            }
          }
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3263, 3000, 250);
        }

        // 4. Collect vials from Hops, Da Vinci, and Chancy in the Dancing Donkey Inn (3273, 3389)
        const wd = await bot.walkTo(3273, 3389, 2);
        if (!wd?.success) {
          await openNearbyDoors(c, 3274, 3390, 3);
          await bot.walkTo(3273, 3389, 2);
        }
        if (!hasSulphuricBroline()) await talk(c, /^hops$/i);
        if (!hasEthenea()) await talk(c, /^da vinci$/i);
        if (!hasLiquidHoney()) await talk(c, /^chancy$/i);

        // 5. Buy Priest gown top (428) and bottom (426) from Asyff (3281, 3398) and equip both
        if (!wearingPriestTop() || !wearingPriestBottom()) {
          const wa = await bot.walkTo(3281, 3398, 2);
          if (!wa?.success) {
            await openNearbyDoors(c, 3280, 3397, 3);
            await bot.walkTo(3281, 3398, 2);
          }
          const o = await bot.openShop(/^asyff$/i);
          if (o?.success) {
            if (!wearingPriestBottom() && !(sdk.getInventory() ?? []).some((i: any) => i.id === 426)) {
              await bot.buyFromShop(426, 1);
              await sleep(300);
            }
            if (!wearingPriestTop() && !(sdk.getInventory() ?? []).some((i: any) => i.id === 428)) {
              await bot.buyFromShop(428, 1);
              await sleep(300);
            }
            await bot.closeShop();
          }
          const botGown = (sdk.getInventory() ?? []).find((i: any) => i.id === 426);
          if (botGown) { await bot.equipItem(botGown); await sleep(300); }
          const topGown = (sdk.getInventory() ?? []).find((i: any) => i.id === 428);
          if (topGown) { await bot.equipItem(topGown); await sleep(300); }
        }

        // 6. Enter Guidor's bedroom at (3283, 3382) and talk to Guidor
        const wg = await bot.walkTo(3282, 3382, 2);
        if (!wg?.success) {
          await openNearbyDoors(c, 3280, 3385, 3);
          await bot.walkTo(3282, 3382, 2);
        }
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldX ?? 0) < 3283; i++) {
          const gd = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^door$/i.test(l.name) && Math.hypot(l.x - 3283, l.z - 3382) <= 2);
          if (gd) await bot.interactLoc(gd, /^open$/i);
          await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) >= 3283, 2500, 250);
        }
        if (!(await talk(c, /^guidor$/i, [
          /come to ask your assistance in stopping a plague/i,
          /sent by your old pupil elena|no! well, yes/i,
          /why elena wanted you to do it|what does that mean/i,
        ]))) return false;
        spokenGuidor = true;
      }

      // 7. Walk back to East Ardougne, report to Elena (2592, 3336), then King Lathas (L1 2578, 3293)
      if ((sdk.getState()?.player?.worldX ?? 3200) > 2860) {
        if ((sdk.getState()?.player?.worldX ?? 0) >= 3263 && (sdk.getState()?.player?.worldZ ?? 0) <= 3406) {
          await bot.walkTo(3264, 3405, 1);
          const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^gate$/i.test(l.name) && Math.hypot(l.x - 3263, l.z - 3405) <= 3);
          if (gate) { await bot.interactLoc(gate, /^open$/i); await sleep(1200); }
        }
        await walkFromVarrockToLumbridge(c, 3100, 3250);
        if (!(await walkToKandarin(c, 2592, 3336))) return false;
      }

      if (!reportedElena) {
        const we3 = await bot.walkTo(2592, 3336, 2);
        if (!we3?.success) {
          await openNearbyDoors(c, 2592, 3335, 3);
          await bot.walkTo(2592, 3336, 2);
        }
        await talk(c, /^elena$/i);
        reportedElena = true;
      }

      // Climb stairs in Ardougne Castle (2572, 3296) to L1 and talk to King Lathas
      if (lvl(sdk) === 0) {
        const wc = await bot.walkTo(2574, 3296, 2);
        if (!wc?.success) {
          await openNearbyDoors(c, 2582, 3296, 4);
          await bot.walkTo(2574, 3296, 2);
        }
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^staircase$/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?up/i.test(o)));
        if (st) {
          await bot.interactLoc(st, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 1, 5000, 300);
        }
      }

      await openNearbyDoors(c, 2578, 3293, 4);
      await talk(c, /^king lathas$/i, [/i don't understand/i]);
      const done = await waitCond(() => xp(sdk, 'Thieving') > thievingXp0 || !!sdk.getState()?.interface?.isOpen, 8000, 300);
      await bot.closeInterface();
      if (lvl(sdk) === 1) {
        const stDown = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /^staircase$/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o)));
        if (stDown) {
          await bot.interactLoc(stDown, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 5000, 300);
        }
      }
      questComplete = done;
      return done;
    });

    if (!(await startAndDistract())) return false;
    if (!(await retrieveDistillator())) return false;
    if (!(await chemistGuidorAndFinish())) return false;
    return true;
  },
};

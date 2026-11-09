import {
  Ctx, Quest, has, count, log, sleep, talk, chat, waitInv, waitCond, step, lvl,
  bankJunk, withdrawFromDraynorBank, openNearbyDoors, pickupWithWait,
  walkToVarrock, walkFromVarrockToLumbridge, exitWizardsTowerGround, ensureCoins
} from '../quest-kit';

const N = 'Demon Slayer';
const KEEP_RE = /^(coins|bucket|bucket of water|bones|key|silverlight|bronze sword|iron dagger|steel|mithril|adamant|rune|shrimps|anchovies|bread|cooked meat|cooked chicken|pie|cake|trout|salmon|lobster)$/i;

export const demon: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    await exitWizardsTowerGround(c);

    let questComplete = false;
    let keyHuntStarted = false;
    let traibornStarted = false;

    const hasKey1 = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 2399);
    const hasKey2 = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 2400);
    const hasKey3 = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 2401);
    const hasSilverlight = () =>
      (sdk.getInventory() ?? []).some((i: any) => i.id === 2402 || /^silverlight$/i.test(i.name)) ||
      (sdk.getEquipment() ?? []).some((i: any) => i.id === 2402 || /^silverlight$/i.test(i.name));

    const climbWizardsTower = async (targetLevel: number) => {
      for (let g = 0; g < 6 && lvl(sdk) !== targetLevel; g++) {
        const cur = lvl(sdk);
        const dir = targetLevel > cur ? /climb-?up/i : /climb-?down/i;
        if (cur === 0 && targetLevel > 0) {
          const p = sdk.getState()?.player;
          if (!p || p.worldX < 3104 || p.worldX > 3107 || p.worldZ < 3158 || p.worldZ > 3163) {
            await bot.walkTo(3109, 3168, 2);
            const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3109, l.z - 3166) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
            if (d2) { await bot.interactLoc(d2, /^open$/i); await sleep(900); }
            await sdk.sendWalk(3108, 3164, true);
            await sleep(1400);
            const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3107, l.z - 3162) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
            if (d1) { await bot.interactLoc(d1, /^open$/i); await sleep(900); }
            await sdk.sendWalk(3105, 3160, true);
            await sleep(1400);
          }
        } else if (cur === 1 && targetLevel === 0) {
          const p = sdk.getState()?.player;
          if (p && p.worldX >= 3108) {
            await openNearbyDoors(c, 3109, 3161, 4);
            await sdk.sendWalk(3105, 3160, true);
            await sleep(1400);
          }
        }
        const st = (sdk.getState()?.nearbyLocs ?? [])
          .filter((l: any) => /stair/i.test(l.name) && Math.hypot(l.x - 3104, l.z - 3160) <= 4 && (l.options ?? []).some((o: string) => dir.test(o)))
          .sort((a: any, b: any) => a.distance - b.distance)[0];
        if (st) {
          await bot.interactLoc(st, dir);
          await waitCond(() => lvl(sdk) !== cur, 5000, 250);
        }
        await sleep(600);
      }
      return lvl(sdk) === targetLevel;
    };

    const reachTraibornRoom = async () => {
      for (let i = 0; i < 4; i++) {
        const p = sdk.getState()?.player;
        if (p && p.level === 1 && p.worldX >= 3110 && p.worldZ >= 3159 && p.worldZ <= 3166) return true;
        await openNearbyDoors(c, 3109, 3161, 4);
        const w = await bot.walkTo(3111, 3162, 1);
        if (w?.success && (sdk.getState()?.player?.worldX ?? 0) >= 3110) return true;
        await sdk.sendWalk(3111, 3162, true);
        await sleep(1400);
      }
      return (sdk.getState()?.player?.worldX ?? 0) >= 3110;
    };

    const climbPalaceNW = async (targetLevel: number) => {
      for (let g = 0; g < 6 && lvl(sdk) !== targetLevel; g++) {
        const cur = lvl(sdk);
        const dir = targetLevel > cur ? /climb-?up/i : /climb-?down/i;
        const st = (sdk.getState()?.nearbyLocs ?? [])
          .filter((l: any) => [1738, 1739, 1740].includes(l.id) && Math.hypot(l.x - 3202, l.z - 3497) <= 5 && (l.options ?? []).some((o: string) => dir.test(o)))
          .sort((a: any, b: any) => a.distance - b.distance)[0];
        if (!st) {
          if (cur === 0) {
            const w = await bot.walkTo(3203, 3496, 2);
            if (!w?.success) {
              await openNearbyDoors(c, 3203, 3488, 3);
              await openNearbyDoors(c, 3206, 3494, 3);
              await bot.walkTo(3203, 3496, 2);
            }
          }
          await sleep(600);
          continue;
        }
        await bot.interactLoc(st, dir);
        await waitCond(() => lvl(sdk) !== cur, 5000, 250);
        await sleep(600);
      }
      return lvl(sdk) === targetLevel;
    };

    const start = () => step(c, N, 'start-aris-and-prysin', async () => {
      if (questComplete || keyHuntStarted || hasKey1() || hasKey2() || hasKey3() || hasSilverlight()) return true;

      if ((sdk.getState()?.player?.worldZ ?? 0) < 3350) {
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [/^coins$/i, /^bucket$/i, /^bucket of water$/i, /^bones$/i]);
        if (count(sdk, /^coins$/i) < 1) {
          await ensureCoins(c, 50);
        }
        if (!has(sdk, /^bucket|bucket of water$/i)) {
          await bot.walkTo(3216, 3291, 2);
          await pickupWithWait(c, 3216, 3291, /^bucket$/i, 15);
        }
      }

      if (!(await walkToVarrock(c, 3203, 3424))) return false;
      if (count(sdk, /^coins$/i) < 1) {
        await ensureCoins(c, 50);
      }
      await bot.walkTo(3203, 3424, 2);
      if (!(await talk(c, /^gypsy$/i, [
        /ok, here you go/i,
        /what does that aaargh bit mean|are you alright/i,
        /who's delrith/i,
        /how am i meant to fight|where is he\? i'll kill him/i,
        /what is the magical incantation/i,
        /where can i find silverlight/i,
        /okay, thanks\. i'll do my best|well i'd better press on/i,
      ], 26))) return false;

      const recentAris = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
      if (/you're a hero now|good bit of demonslaying/i.test(recentAris)) {
        questComplete = true;
        return true;
      }
      if (/found sir prysin/i.test(recentAris)) {
        keyHuntStarted = true;
        return true;
      }

      await bot.walkTo(3212, 3472, 2);
      const wp = await bot.walkTo(3204, 3472, 2);
      if (!wp?.success) {
        await openNearbyDoors(c, 3207, 3473, 3);
        await bot.walkTo(3204, 3472, 2);
      }
      if (!(await talk(c, /^sir prysin$/i, [
        /gypsy aris said i should come/i,
        /i need to find silverlight/i,
        /crystal ball seems to think|he's back and unfortunately/i,
        /so give me the keys/i,
        /can you give me your key/i,
        /so what does the drain lead to/i,
        /where can i find captain rovin/i,
        /where does the wizard live/i,
        /well i'd better go key hunting|i'm still looking/i,
      ], 26))) return false;

      const recentPrysin = (sdk.getState()?.recentDialogs ?? []).flatMap((d: any) => d.text ?? []).join(' ');
      if (/heard you stopped the demon/i.test(recentPrysin)) {
        questComplete = true;
        return true;
      }
      if (/sorted out that demon yet/i.test(recentPrysin)) {
        if (!hasSilverlight()) {
          await talk(c, /^sir prysin$/i, [/afraid i've lost silverlight/i]);
          await waitCond(() => hasSilverlight(), 4000);
        }
        return hasSilverlight();
      }
      keyHuntStarted = true;
      return true;
    });

    const rovinAndDrain = () => step(c, N, 'rovin-and-drain-keys', async () => {
      if (questComplete || hasSilverlight() || (hasKey2() && hasKey3())) return true;
      const inSewer = () => (sdk.getState()?.player?.worldZ ?? 0) > 9800;

      if (!inSewer() && (sdk.getState()?.player?.worldZ ?? 0) < 3380) {
        if (!(await walkToVarrock(c, 3212, 3465))) return false;
      }

      if (!hasKey2() && !inSewer()) {
        if (!(await climbPalaceNW(2))) return false;
        await talk(c, /^captain rovin$/i, [
          /yes,? i know, but this is important/i,
          /there's a demon who wants to invade/i,
        ]);
        if (!(await waitCond(() => hasKey2(), 5000, 250))) return false;
        await climbPalaceNW(0);
      }

      if (!hasKey3()) {
        if (lvl(sdk) > 0) await climbPalaceNW(0);
        if (!inSewer()) {
          // Check if Manhole is already open or drain already flushed
          await bot.walkTo(3236, 3458, 1);
          const alreadyOpen = (sdk.getState()?.nearbyLocs ?? []).some((l: any) => l.id === 882);
          if (!alreadyOpen) {
            if (!has(sdk, /^bucket of water$/i)) {
              if (!has(sdk, /^bucket$/i)) {
                // Climb up palace NE stairs at (3212, 3473) to pick up Bucket at L1 (3221, 3497)
                await bot.walkTo(3212, 3472, 2);
                const stUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1722);
                if (stUp) {
                  await bot.interactLoc(stUp, /climb[- ]?up/i);
                  await waitCond(() => lvl(sdk) === 1, 5000);
                }
                if (lvl(sdk) === 1) {
                  const wb = await bot.walkTo(3221, 3496, 2);
                  if (!wb?.success) { await openNearbyDoors(c, 3219, 3492, 3); await bot.walkTo(3221, 3496, 2); }
                  await pickupWithWait(c, 3221, 3497, /^bucket$/i, 15);
                  await bot.walkTo(3212, 3475, 2);
                  const stDn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1723);
                  if (stDn) {
                    await bot.interactLoc(stDn, /climb[- ]?down/i);
                    await waitCond(() => lvl(sdk) === 0, 5000);
                  }
                }
              }
              if (!has(sdk, /^bucket$/i)) return false;
              await bot.walkTo(3218, 3465, 2);
              await bot.useItemOnLoc(/^bucket$/i, /^fountain$/i);
              if (!(await waitInv(sdk, /^bucket of water$/i, 5000))) return false;
            }

            await bot.walkTo(3225, 3496, 1);
            await bot.useItemOnLoc(/^bucket of water$/i, /^drain$/i);
            if (!(await waitInv(sdk, /^bucket$/i, 5000))) return false;
            await sleep(2500);
          }

          await bot.walkTo(3236, 3458, 1);
          for (let i = 0; i < 4 && !inSewer(); i++) {
            const mhClosed = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 881);
            if (mhClosed) {
              await sdk.sendInteractLoc(mhClosed.x, mhClosed.z, mhClosed.id, 1);
              await sleep(1200);
            }
            const mhOpen = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 882);
            if (mhOpen) {
              await sdk.sendInteractLoc(mhOpen.x, mhOpen.z, mhOpen.id, 1);
              if (await waitCond(() => inSewer(), 5000, 250)) break;
            }
            await sleep(600);
          }
          if (!inSewer()) return false;
        }

        await bot.walkTo(3237, 9866, 2);
        await bot.walkTo(3229, 9882, 2);
        await bot.walkTo(3225, 9897, 2);
        if (!(await pickupWithWait(c, 3225, 9897, /^key$/i, 15)) || !hasKey3()) return false;

        await bot.walkTo(3229, 9882, 2);
        await bot.walkTo(3237, 9859, 2);
        for (let i = 0; i < 4 && inSewer(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1755 || /^ladder$/i.test(l.name));
          if (lad) await sdk.sendInteractLoc(lad.x, lad.z, lad.id, 1);
          if (await waitCond(() => !inSewer(), 5000, 250)) break;
        }
      }

      return hasKey2() && hasKey3();
    });

    const traibornKey = () => step(c, N, 'traiborn-bones-key', async () => {
      if (questComplete || hasSilverlight() || hasKey1()) return true;

      if ((sdk.getState()?.player?.worldZ ?? 0) > 3350) {
        if (!(await walkFromVarrockToLumbridge(c, 3231, 3298))) return false;
      }

      if ((sdk.getInventory()?.length ?? 0) - count(sdk, /^bones$/i) > 3) {
        await bankJunk(c, /^(coins|bones|key|silverlight|bronze sword|iron dagger|steel|mithril|adamant|rune)$/i);
        await withdrawFromDraynorBank(c, [/^bones$/i]);
      }

      for (let trip = 0; trip < 3 && !hasKey1(); trip++) {
        // Collect 25 bones at East Lumbridge Chicken Coop (3231, 3298 - 9 chickens) before climbing Wizards' Tower
        for (let iter = 0; iter < 90 && (sdk.getInventory()?.length ?? 0) < 28 && count(sdk, /^bones$/i) < 25; iter++) {
          const p = sdk.getState()?.player;
          if (!p || p.worldX < 3225 || p.worldX > 3236 || p.worldZ < 3295 || p.worldZ > 3301) {
            const wc = await bot.walkTo(3231, 3298, 2);
            if (!wc?.success) {
              await bot.walkTo(3237, 3295, 2);
              await openNearbyDoors(c, 3236, 3295, 3);
              await bot.walkTo(3231, 3298, 2);
            }
          }
          const gBone = (sdk.getState()?.groundItems ?? [])
            .filter((g: any) => /^bones$/i.test(g.name) && g.reachable !== false && g.distance <= 8 && g.x >= 3225 && g.x <= 3236 && g.z >= 3295 && g.z <= 3301)
            .sort((a: any, b: any) => a.distance - b.distance)[0];
          if (gBone) {
            const before = count(sdk, /^bones$/i);
            await bot.pickupItem(gBone);
            await waitCond(() => count(sdk, /^bones$/i) > before, 3000, 250);
            continue;
          }
          const chk = (sdk.getState()?.nearbyNpcs ?? [])
            .filter((n: any) => /^chicken$/i.test(n.name) && !n.inCombat && n.reachable !== false && n.x >= 3225 && n.x <= 3236 && n.z >= 3295 && n.z <= 3301)
            .sort((a: any, b: any) => a.distance - b.distance)[0];
          if (chk) {
            await bot.attack(chk);
            await waitCond(() => (sdk.getState()?.groundItems ?? []).some((g: any) => /^bones$/i.test(g.name) && g.distance <= 3), 5000, 250);
          } else {
            await sleep(600);
          }
        }

        await bot.walkTo(3109, 3168, 2);
        if (!(await climbWizardsTower(1))) return false;
        if (!(await reachTraibornRoom())) return false;

        if (!traibornStarted) {
          if (!(await talk(c, /^traiborn$/i, [
            /need to get a key given to you by sir prysin/i,
            /well, have you got any keys knocking around/i,
            /i'll get the bones for you/i,
          ], 20))) return false;
          traibornStarted = true;
          await sleep(800);
        }

        if (count(sdk, /^bones$/i) > 0 && !hasKey1()) {
          if (!(await reachTraibornRoom())) return false;
          await talk(c, /^traiborn$/i);
          // Wait for Traiborn's 1-bone-per-tick loop to finish and open the completion or "I still need more" dialog
          await sleep(1500);
          await waitCond(() => !!sdk.getState()?.dialog?.isOpen || count(sdk, /^bones$/i) === 0, 24000, 400);
          await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 4000, 300);
          if (sdk.getState()?.dialog?.isOpen) {
            await chat(c);
          }
          await waitCond(() => hasKey1(), 5000, 250);
          if (sdk.getState()?.dialog?.isOpen) {
            await chat(c);
          }
        }

        await climbWizardsTower(0);
        await exitWizardsTowerGround(c);
      }

      return hasKey1();
    });

    const slayDelrith = () => step(c, N, 'silverlight-and-delrith', async () => {
      if (questComplete) return true;
      if ((sdk.getState()?.player?.level ?? 0) > 0 && Math.hypot((sdk.getState()?.player?.worldX ?? 0) - 3106, (sdk.getState()?.player?.worldZ ?? 0) - 3162) < 15) {
        await climbWizardsTower(0);
      }
      await exitWizardsTowerGround(c);

      if (!hasSilverlight()) {
        if (!(await walkToVarrock(c, 3204, 3472))) return false;
        const wp = await bot.walkTo(3204, 3472, 2);
        if (!wp?.success) {
          await openNearbyDoors(c, 3207, 3473, 3);
          await bot.walkTo(3204, 3472, 2);
        }
        await talk(c, /^sir prysin$/i, [/afraid i've lost silverlight/i]);
        if (!(await waitCond(() => hasSilverlight(), 6000, 250))) return false;
      }

      if (has(sdk, /^silverlight$/i)) {
        await bot.equipItem(/^silverlight$/i);
        await sleep(600);
      }

      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) < 20) {
        const wa = await bot.walkTo(3254, 3483, 2);
        if (!wa?.success) { await openNearbyDoors(c, 3254, 3480, 3); await bot.walkTo(3254, 3483, 2); }
        await bot.interactLoc(/^altar$/i, /pray/i);
        await sleep(1200);
      }

      if (!(await walkToVarrock(c, 3228, 3369))) return false;
      await bot.walkTo(3228, 3369, 2);
      if ((sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await bot.activatePrayer('protect_from_melee');
      }

      for (let i = 0; i < 40; i++) {
        const msgs = (sdk.getState()?.gameMessages ?? []).map((m: any) => m.text).join(' ');
        if (/completed the\s*demon slayer quest/i.test(msgs) || sdk.getState()?.interface?.isOpen) {
          await bot.closeInterface();
          questComplete = true;
          return true;
        }
        const dlg = sdk.getState()?.dialog;
        if (dlg?.isOpen) {
          await chat(c, [/carlem aber camerinthum purchai gabindo/i]);
          const done = await waitCond(() => {
            const m = (sdk.getState()?.gameMessages ?? []).map((x: any) => x.text).join(' ');
            return /completed the\s*demon slayer quest/i.test(m) || !!sdk.getState()?.interface?.isOpen;
          }, 6000, 300);
          if (done) {
            await bot.closeInterface();
            questComplete = true;
            return true;
          }
          continue;
        }
        if (sdk.findNearbyNpc(/^weakened delrith$/i)) {
          await sleep(600);
          continue;
        }
        const del = sdk.findNearbyNpc(/^delrith$/i);
        if (del) {
          await bot.attack(del);
          await waitCond(() => !!sdk.getState()?.dialog?.isOpen || !!sdk.findNearbyNpc(/^weakened delrith$/i) || !sdk.getState()?.player?.combat?.inCombat, 6000, 250);
        } else {
          await sleep(1000);
        }
      }
      return questComplete;
    });

    return (await start()) && (await rovinAndDrain()) && (await traibornKey()) && (await slayDelrith());
  },
};

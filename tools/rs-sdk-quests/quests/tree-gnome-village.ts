import {
  Ctx, Quest, has, count, xp, lvl, log, sleep, talk, chat, waitInv, waitCond, step,
  bankJunk, withdrawFromDraynorBank, openNearbyDoors, pickupWithWait
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Tree Gnome Village';
const KEEP_RE = /^(coins|logs|orb of protection|orbs of protection|gnome amulet|bronze axe|iron axe|steel axe|mithril axe|adamant axe|rune axe|blurite sword|silverlight|bronze|iron|steel|mithril|adamant|rune|wooden shield|shrimps|anchovies|sardine|herring|trout|salmon|tuna|lobster|swordfish|bread|cooked meat|cooked chicken|cake|slice of cake|chocolate cake|meat pie)$/i;

export const tree: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const baseAtkXp = xp(sdk, 'Attack');
    let questComplete = false;
    let started = false;
    let montaiDone = false;
    let ballistaFired = false;
    let firstOrbReturned = false;

    const hasFirstOrb = () =>
      has(sdk, /^orb of protection$/i) ||
      (sdk.getInventory() ?? []).some((i: any) => i.id === 587);
    const hasSecondOrbs = () =>
      has(sdk, /^orbs of protection$/i) ||
      (sdk.getInventory() ?? []).some((i: any) => i.id === 588);
    const hasAxe = () =>
      has(sdk, /axe$/i) ||
      (sdk.getEquipment() ?? []).some((i: any) => /axe$/i.test(i.name));

    const enterVillage = async () => {
      // If already near King Bolren (2541, 3170), we're inside
      const p = sdk.getState()?.player;
      if (p && Math.hypot(p.worldX - 2541, p.worldZ - 3170) <= 12) return true;

      // Try Elkoy outside maze at (2505, 3192) first if quest started
      await bot.walkTo(2505, 3192, 3);
      const elkoy = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^elkoy$/i.test(n.name));
      if (elkoy) {
        await talk(c, /^elkoy$/i, [/yes please/i]);
        await sleep(800);
      }

      // If Elkoy teleported us to (2515, 3160), squeeze through Loose Railing (2186) at (2515, 3161) to (2515, 3159)
      const p2 = sdk.getState()?.player;
      if (p2 && Math.hypot(p2.worldX - 2515, p2.worldZ - 3160) <= 4) {
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 3160; i++) {
          const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
          if (r) await bot.interactLoc(r, /squeeze-?through/i);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3159, 4000, 250);
        }
        await bot.walkTo(2541, 3170, 2);
        return Math.hypot((sdk.getState()?.player?.worldX ?? 0) - 2541, (sdk.getState()?.player?.worldZ ?? 0) - 3170) <= 10;
      }

      // Otherwise walk through the maze manually from outside (2515, 3193) -> (2515, 3162) -> Squeeze Loose Railing -> (2541, 3170)
      await bot.walkTo(2515, 3162, 2);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 3161; i++) {
        const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
        if (r) await bot.interactLoc(r, /squeeze-?through/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3160, 4000, 250);
      }
      // Squeeze a second time if at z===3160 to reach 3159
      if ((sdk.getState()?.player?.worldZ ?? 0) === 3160) {
        const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
        if (r) await bot.interactLoc(r, /squeeze-?through/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3159, 4000, 250);
      }
      await bot.walkTo(2541, 3170, 2);
      return Math.hypot((sdk.getState()?.player?.worldX ?? 0) - 2541, (sdk.getState()?.player?.worldZ ?? 0) - 3170) <= 10;
    };

    const leaveVillage = async () => {
      const p = sdk.getState()?.player;
      if (p && p.worldZ >= 3190) return true;
      await bot.walkTo(2515, 3160, 2);
      for (let i = 0; i < 3 && (sdk.getState()?.player?.worldZ ?? 0) <= 3159; i++) {
        const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
        if (r) await bot.interactLoc(r, /squeeze-?through/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3160, 4000, 250);
      }
      const elkoy = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^elkoy$/i.test(n.name));
      if (elkoy) {
        await talk(c, /^elkoy$/i, [/yes please|show me out/i]);
        await sleep(800);
      }
      if ((sdk.getState()?.player?.worldZ ?? 0) < 3190) {
        await bot.walkTo(2505, 3192, 3);
      }
      return (sdk.getState()?.player?.worldZ ?? 0) >= 3190;
    };

    // Step 1: Prep & talk to King Bolren
    const startBolren = () => step(c, N, 'start-bolren', async () => {
      if (questComplete || started || hasFirstOrb() || hasSecondOrbs()) return true;

      if ((sdk.getState()?.player?.worldX ?? 0) > 2900) {
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [
          /^coins$/i, /^logs$/i, /axe$/i, /^blurite sword$/i, /^silverlight$/i,
        ]);
        if (!hasAxe()) {
          // Pick up Bronze axe in Lumbridge chicken coop (3232, 3295) or Bob's Axes
          await bot.walkTo(3232, 3295, 3);
          await pickupWithWait(c, 3232, 3295, /^bronze axe$/i, 10);
        }
      }

      if (!(await walkToKandarin(c, 2605, 3209))) return false;
      // Restore Prayer at Ardougne Monastery altar (2605, 3209)
      await bot.walkTo(2605, 3209, 2);
      const altar = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /altar/i.test(l.name));
      if (altar) {
        await bot.interactLoc(altar, /pray/i);
        await sleep(1200);
      }

      await bot.walkTo(2515, 3192, 3);
      if (!(await enterVillage())) return false;
      if (!(await talk(c, /^king bolren$/i, [
        /can i help at all/i,
        /i would be glad to help/i,
      ]))) return false;
      await sleep(800);
      if (sdk.getState()?.dialog?.isOpen) await chat(c);
      started = true;
      return true;
    });

    // Step 2: Gather 6 logs & talk to Commander Montai 3 times
    const helpMontai = () => step(c, N, 'commander-montai-and-logs', async () => {
      if (questComplete || montaiDone || ballistaFired || hasFirstOrb() || hasSecondOrbs()) return true;
      await leaveVillage();

      // Chop normal trees until we have 6 logs (id 1511)
      const countNormalLogs = () =>
        (sdk.getInventory() ?? []).filter((i: any) => i.id === 1511 || /^logs$/i.test(i.name)).length;
      if (!hasAxe() && countNormalLogs() < 6) {
        // Pick up iron/bronze axe or chop if equipped
        await bot.walkTo(2618, 3305, 3);
      }
      const deadline = Date.now() + 3 * 60_000;
      while (countNormalLogs() < 6 && Date.now() < deadline) {
        await bot.walkTo(2510, 3202, 4);
        const treeLoc = (sdk.getState()?.nearbyLocs ?? [])
          .filter((l: any) => /^tree$/i.test(l.name) && (l.options ?? []).some((o: string) => /chop/i.test(o)) && l.distance <= 15)
          .sort((a: any, b: any) => a.distance - b.distance)[0];
        if (treeLoc) {
          const before = countNormalLogs();
          await bot.interactLoc(treeLoc, /chop/i);
          await waitCond(() => countNormalLogs() > before, 7000, 300);
        } else {
          await sleep(600);
        }
      }
      if (countNormalLogs() < 6) return false;

      // Talk to Commander Montai (2528, 3209)
      await bot.walkTo(2528, 3209, 2);
      // 1st talk: "Ok, I'll gather some wood."
      await talk(c, /^commander montai$/i, [/ok, i'll gather some wood/i]);
      await sleep(500);
      // 2nd talk: hand in 6 logs
      if (countNormalLogs() >= 6) {
        await talk(c, /^commander montai$/i);
        await sleep(500);
      }
      // 3rd talk: "I'll try my best."
      await talk(c, /^commander montai$/i, [/i'll try my best/i]);
      await sleep(500);

      montaiDone = countNormalLogs() < 6;
      return montaiDone;
    });

    // Step 3: Fire Ballista (2181 at (2508, 3210)) with coordinates 0004, 0003, 0005 & retrieve 1st Orb
    const breachAndGetFirstOrb = () => step(c, N, 'ballista-and-first-orb', async () => {
      if (questComplete || hasFirstOrb() || firstOrbReturned || hasSecondOrbs()) return true;

      if (!ballistaFired) {
        await bot.walkTo(2509, 3211, 2);
        const bal = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2181 || /ballista/i.test(l.name));
        if (!bal) return false;
        await bot.interactLoc(bal, /^fire$/i);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 5000, 250)) {
          // Sequence the 3 coordinate prompts: 0004 -> 0003 -> 0005
          const seq = [/0004/, /0003/, /0005/];
          let seqIdx = 0;
          for (let i = 0; i < 20; i++) {
            const d = sdk.getState()?.dialog;
            if (!d?.isOpen) {
              await sleep(300);
              if (!sdk.getState()?.dialog?.isOpen) break;
              continue;
            }
            const opts = d.options ?? [];
            if (opts.length >= 5 && seqIdx < seq.length) {
              const targetRe = seq[seqIdx++];
              const match = opts.find((o: any) => targetRe.test(o.text));
              await sdk.sendClickDialog(match ? match.index : 0);
            } else {
              await sdk.sendClickDialog(0);
            }
            await sleep(450);
          }
        }
        await sleep(1500);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        ballistaFired = true;
      }

      // Walk to Crumbled wall (2185 at (2509, 3253))
      await bot.walkTo(2509, 3252, 1);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 3253; i++) {
        const wall = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2185 || /crumbled wall/i.test(l.name));
        if (wall) await bot.interactLoc(wall, /climb-?over/i);
        if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen, 2500, 250)) await chat(c);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 3254, 6000, 300);
      }
      await sleep(3500); // wait if Khazard commander cutscene triggers

      // Open interior door (1530 at (2505, 3256)) and climb Ladder (1747 at (2503, 3252)) to L1
      for (let i = 0; i < 5 && lvl(sdk) === 0; i++) {
        const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 2505, l.z - 3256) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
        if (d) { await bot.interactLoc(d, /^open$/i); await sleep(800); }
        await sdk.sendWalk(2503, 3253, true);
        await sleep(1200);
        const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1747 || (/ladder/i.test(l.name) && Math.hypot(l.x - 2503, l.z - 3252) <= 3));
        if (lad) {
          await bot.interactLoc(lad, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 1, 5000, 250);
        }
      }
      if (lvl(sdk) !== 1) return false;

      // Open & search Closed chest (2183 / 2182 at (2506, 3259) L1)
      await bot.walkTo(2506, 3258, 1);
      for (let i = 0; i < 4 && !hasFirstOrb(); i++) {
        const closed = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2183);
        if (closed) {
          await bot.interactLoc(closed, /^open$/i);
          await sleep(1000);
        }
        const open = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2182 || (/chest/i.test(l.name) && (l.options ?? []).some((o: string) => /^search$/i.test(o))));
        if (open) {
          await bot.interactLoc(open, /^search$/i);
          await waitCond(() => hasFirstOrb(), 4000, 250);
        }
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
      }

      // Climb down Ladder (1746 at (2503, 3252) L1) and exit stronghold via front door (2184 at (2502, 3250))
      for (let i = 0; i < 4 && lvl(sdk) === 1; i++) {
        await bot.walkTo(2503, 3253, 1);
        const ladDn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1746 || /ladder/i.test(l.name));
        if (ladDn) {
          await bot.interactLoc(ladDn, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 5000, 250);
        }
      }
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 3251; i++) {
        await sdk.sendWalk(2502, 3251, true);
        await sleep(1000);
        const exitDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2184 || (/door/i.test(l.name) && Math.hypot(l.x - 2502, l.z - 3250) <= 2));
        if (exitDoor) {
          await bot.interactLoc(exitDoor, /^open$/i);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3250, 4000, 250);
        }
      }

      return hasFirstOrb();
    });

    // Step 4: Return 1st Orb to King Bolren, defeat Khazard Warlord (2456, 3301), and complete quest
    const defeatWarlordAndFinish = () => step(c, N, 'warlord-and-finish', async () => {
      if (questComplete || xp(sdk, 'Attack') > baseAtkXp) return true;

      if (hasFirstOrb() && !firstOrbReturned) {
        if (!(await enterVillage())) return false;
        await talk(c, /^king bolren$/i, [/i will find the warlord and bring back the orbs/i]);
        await sleep(800);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        firstOrbReturned = !hasFirstOrb();
      }

      if (!hasSecondOrbs()) {
        await leaveVillage();
        // Equip best weapon
        for (const w of [/^rune/i, /^adamant/i, /^mithril/i, /^blurite sword$/i, /^silverlight$/i, /^steel/i, /^iron/i]) {
          if (has(sdk, w)) { await bot.equipItem(w); await sleep(300); }
        }
        // Walk to Khazard warlord at (2456, 3301)
        await bot.walkTo(2456, 3301, 4);
        // Enable Protect from Melee (prayer index 14) if Prayer level >= 43 and prayerPoints > 0
        const pr = sdk.getState()?.prayers;
        if ((pr?.prayerLevel ?? 0) >= 43 && (pr?.prayerPoints ?? 0) > 0 && !pr?.activePrayers?.[14]) {
          await sdk.sendTogglePrayer(14);
          await sleep(400);
        }

        const deadline = Date.now() + 3 * 60_000;
        while (!hasSecondOrbs() && Date.now() < deadline) {
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
          // Re-enable Protect from Melee if it turned off and we have points
          const curPr = sdk.getState()?.prayers;
          if ((curPr?.prayerLevel ?? 0) >= 43 && (curPr?.prayerPoints ?? 0) > 0 && !curPr?.activePrayers?.[14]) {
            await sdk.sendTogglePrayer(14);
          }
          const wl = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^khazard warlord$/i.test(n.name));
          if (wl && !sdk.getState()?.player?.combat?.inCombat) {
            await bot.attack(wl);
          }
          await sleep(1000);
        }
        // Turn off Protect from Melee after fight
        if (sdk.getState()?.prayers?.activePrayers?.[14]) {
          await sdk.sendTogglePrayer(14);
        }
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (!hasSecondOrbs()) return false;
      }

      // Return Orbs of protection to King Bolren
      if (!(await enterVillage())) return false;
      const beforeXp = xp(sdk, 'Attack');
      await talk(c, /^king bolren$/i);
      await waitCond(() => xp(sdk, 'Attack') > beforeXp, 15_000, 400);
      await sleep(1500);
      if (sdk.getState()?.dialog?.isOpen) await chat(c);
      if (sdk.getState()?.modalOpen) await bot.closeInterface();
      questComplete = xp(sdk, 'Attack') > beforeXp || has(sdk, /^gnome amulet$/i);
      return questComplete;
    });

    if (!(await startBolren())) return false;
    if (!(await helpMontai())) return false;
    if (!(await breachAndGetFirstOrb())) return false;
    if (!(await defeatWarlordAndFinish())) return false;
    return true;
  },
};

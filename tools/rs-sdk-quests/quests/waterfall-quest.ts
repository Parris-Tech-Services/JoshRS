import {
  Ctx, Quest, has, count, xp, lvl, log, sleep, talk, chat, waitInv, waitCond, step,
  bankJunk, withdrawFromDraynorBank, openNearbyDoors
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const N = 'Waterfall Quest';
const KEEP_RE = /^(coins|rope|air rune|water rune|earth rune|book on baxtorian|key|glarial's pebble|glarial's amulet|glarial's urn|shrimps|anchovies|sardine|herring|trout|salmon|tuna|lobster|swordfish|bread|cooked meat|cooked chicken|cake|slice of cake|chocolate cake|meat pie)$/i;

export const waterfall: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;
    const baseStrXp = xp(sdk, 'Strength');
    let questComplete = false;
    let startedAndReadBook = false;

    const hasBook = () =>
      (sdk.getInventory() ?? []).some((i: any) => i.id === 292 || /book on baxtorian/i.test(i.name));
    const hasPebble = () =>
      (sdk.getInventory() ?? []).some((i: any) => i.id === 294 || /glarial's pebble/i.test(i.name));
    const hasAmulet = () =>
      (sdk.getInventory() ?? []).some((i: any) => i.id === 295 || /glarial's amulet/i.test(i.name)) ||
      (sdk.getEquipment() ?? []).some((e: any) => e.id === 295 || /glarial's amulet/i.test(e.name));
    const hasUrn = () =>
      (sdk.getInventory() ?? []).some((i: any) => i.id === 296 || /glarial's urn/i.test(i.name));

    // Step 1: Prep Rope & Runes, talk to Almera, raft to Hudon, swim to Hadley's house, read Book on Baxtorian
    const startAndReadBook = () => step(c, N, 'almera-hudon-and-book', async () => {
      if (questComplete || startedAndReadBook || hasPebble() || (hasAmulet() && hasUrn())) return true;

      if ((sdk.getState()?.player?.worldX ?? 0) > 2900) {
        await bankJunk(c, KEEP_RE);
        await withdrawFromDraynorBank(c, [
          /^coins$/i, /^rope$/i, /^air rune$/i, /^water rune$/i, /^earth rune$/i,
          /^glarial's pebble$/i, /^glarial's amulet$/i, /^glarial's urn$/i,
        ]);
        // Buy Rope from Ned in Draynor (3098, 3257) if we don't have one
        if (!has(sdk, /^rope$/i) && count(sdk, /^coins$/i) >= 15) {
          const wn = await bot.walkTo(3098, 3257, 2);
          if (!wn?.success) { await openNearbyDoors(c, 3101, 3258, 3); await bot.walkTo(3098, 3257, 2); }
          await talk(c, /^ned$/i, [/other things can you make/i, /make me some rope/i, /i will buy some rope/i]);
        }
        // Buy 6 Air rune, 6 Water rune, 6 Earth rune from Betty in Port Sarim (3014, 3258) if needed
        if (
          (count(sdk, /^air rune$/i) < 6 || count(sdk, /^water rune$/i) < 6 || count(sdk, /^earth rune$/i) < 6) &&
          count(sdk, /^coins$/i) >= 100
        ) {
          await bot.walkTo(3014, 3258, 2);
          await openNearbyDoors(c, 3016, 3258, 2);
          await bot.walkTo(3014, 3258, 2);
          const ob = await bot.openShop(/^betty$/i);
          if (ob?.success) {
            if (count(sdk, /^air rune$/i) < 6) await bot.buyFromShop(/^air rune$/i, 10);
            if (count(sdk, /^water rune$/i) < 6) await bot.buyFromShop(/^water rune$/i, 10);
            if (count(sdk, /^earth rune$/i) < 6) await bot.buyFromShop(/^earth rune$/i, 10);
            await bot.closeShop();
          }
        }
      }

      if (!(await walkToKandarin(c, 2803, 3430))) return false;
      // Buy Rope from Arhein in Catherby (2803, 3430) if still missing
      if (!has(sdk, /^rope$/i)) {
        await bot.walkTo(2803, 3430, 3);
        const oa = await bot.openShop(/^arhein$/i);
        if (oa?.success) {
          await bot.buyFromShop(/^rope$/i, 1);
          await bot.closeShop();
        }
      }
      if (!has(sdk, /^rope$/i)) return false;

      // Talk to Almera (304 at (2521, 3495))
      await bot.walkTo(2521, 3495, 2);
      await openNearbyDoors(c, 2521, 3495, 3);
      await bot.walkTo(2521, 3495, 2);
      if (!(await talk(c, /^almera$/i, [/how can i help/i]))) return false;

      // Board Log raft (1987 at (2510, 3494)) -> crashes at (2512, 3481) and auto-talks to Hudon
      await bot.walkTo(2511, 3493, 2);
      await openNearbyDoors(c, 2512, 3494, 2);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) > 3485; i++) {
        const raft = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1987 || /log raft/i.test(l.name));
        if (raft) await bot.interactLoc(raft, /board/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3485, 8000, 300);
      }
      await sleep(1500);
      if (sdk.getState()?.dialog?.isOpen) await chat(c);
      // Talk to Hudon explicitly just in case
      const hudon = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^hudon$/i.test(n.name));
      if (hudon) await talk(c, /^hudon$/i);

      // Use Rope on Rock (1996 at (2512, 3468)) to swim to (2512, 3469)
      await bot.walkTo(2512, 3476, 1);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) > 3471; i++) {
        const ropeItem = sdk.findInventoryItem(/^rope$/i);
        const rock = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1996 || (/rock/i.test(l.name) && Math.hypot(l.x - 2512, l.z - 3468) <= 3));
        if (ropeItem && rock) {
          await sdk.sendUseItemOnLoc(ropeItem.slot, rock.x, rock.z, rock.id);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3471, 8000, 300);
        }
        await sleep(800);
      }

      // Click Barrel (2022 at (2512, 3463)) or swim to get washed down to (2527, 3413)
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) > 3450; i++) {
        const ropeItem = sdk.findInventoryItem(/^rope$/i);
        const tree = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2020 || /dead tree/i.test(l.name));
        if (ropeItem && tree && (sdk.getState()?.player?.worldZ ?? 0) >= 3466) {
          await sdk.sendUseItemOnLoc(ropeItem.slot, tree.x, tree.z, tree.id);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3464, 5000, 250);
        }
        const barrel = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2022 || /barrel/i.test(l.name));
        if (barrel) {
          await bot.interactLoc(barrel, /get in|board|swim/i);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3435, 6000, 300);
        } else {
          const ledgeDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2010);
          if (ledgeDoor) {
            await bot.interactLoc(ledgeDoor, /^open$/i);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3435, 6000, 300);
          }
        }
      }

      // Walk to Hadley's house (2518, 3430), climb up Staircase (2517, 3429) to L1, search Bookcase (1989 at (2520, 3427))
      await bot.walkTo(2518, 3430, 2);
      await openNearbyDoors(c, 2518, 3431, 3);
      for (let i = 0; i < 4 && lvl(sdk) === 0; i++) {
        await bot.walkTo(2518, 3430, 2);
        const st = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /stair/i.test(l.name) && Math.hypot(l.x - 2517, l.z - 3429) <= 4);
        if (st) {
          await bot.interactLoc(st, /climb-?up/i);
          await waitCond(() => lvl(sdk) === 1, 5000, 250);
        }
      }
      if (lvl(sdk) !== 1) return false;

      await bot.walkTo(2520, 3427, 2);
      for (let i = 0; i < 3 && !hasBook(); i++) {
        const bc = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1989 || /bookcase/i.test(l.name));
        if (bc) await bot.interactLoc(bc, /search/i);
        await waitCond(() => hasBook(), 4000, 250);
      }
      const bookItem = (sdk.getInventory() ?? []).find((i: any) => i.id === 292 || /book on baxtorian/i.test(i.name));
      if (bookItem) {
        await bot.useItem(/book on baxtorian/i);
        await sleep(800);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);
        if (sdk.getState()?.modalOpen) await bot.closeInterface();
      }

      // Climb back down Hadley's stairs
      for (let i = 0; i < 4 && lvl(sdk) === 1; i++) {
        await bot.walkTo(2518, 3430, 2);
        const stDn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /stair/i.test(l.name));
        if (stDn) {
          await bot.interactLoc(stDn, /climb-?down/i);
          await waitCond(() => lvl(sdk) === 0, 5000, 250);
        }
      }
      startedAndReadBook = true;
      return true;
    });

    // Step 2: Get Glarial's pebble (294) from Golrie (306) in Tree Gnome Village dungeon
    const getPebbleFromGolrie = () => step(c, N, 'golrie-pebble', async () => {
      if (questComplete || hasPebble() || (hasAmulet() && hasUrn())) return true;
      const inDungeon = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;

      if (!inDungeon()) {
        // Walk to Tree Gnome Village maze entrance (2515, 3162) -> squeeze railing -> ladder at (2533, 3155)
        await bot.walkTo(2515, 3162, 2);
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 3160; i++) {
          const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
          if (r) await bot.interactLoc(r, /squeeze-?through/i);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3159, 4000, 250);
        }
        await bot.walkTo(2533, 3156, 2);
        for (let i = 0; i < 4 && !inDungeon(); i++) {
          const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 5250 || /ladder/i.test(l.name));
          if (lad) await bot.interactLoc(lad, /climb-?down/i);
          await waitCond(() => inDungeon(), 5000, 250);
        }
      }
      if (!inDungeon()) return false;

      // Search Crate (1990 at (2548, 9565)) for Key (293)
      const hasGolrieKey = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 293);
      if (!hasGolrieKey()) {
        await bot.walkTo(2548, 9565, 2);
        for (let i = 0; i < 4 && !hasGolrieKey(); i++) {
          const cr = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1990 || (/crate/i.test(l.name) && Math.hypot(l.x - 2548, l.z - 9565) <= 3));
          if (cr) await bot.interactLoc(cr, /search/i);
          if (sdk.getState()?.dialog?.isOpen) await chat(c);
          await waitCond(() => hasGolrieKey(), 4000, 250);
        }
      }

      // Unlock Gate (1991 at (2515, 9575)) and talk to Golrie (306)
      await bot.walkTo(2514, 9574, 2);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 9575; i++) {
        const keyItem = (sdk.getInventory() ?? []).find((it: any) => it.id === 293);
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1991 || /gate/i.test(l.name));
        if (keyItem && gate) {
          await sdk.sendUseItemOnLoc(keyItem.slot, gate.x, gate.z, gate.id);
        } else if (gate) {
          await bot.interactLoc(gate, /^open$/i);
        }
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 9576, 5000, 250);
      }

      await talk(c, /^golrie$/i);
      await waitCond(() => hasPebble(), 4000, 250);

      // Exit Golrie's room and climb up ladder (2534, 9555) -> squeeze out of Tree Gnome Village
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 9576; i++) {
        const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1991 || /gate/i.test(l.name));
        if (gate) await bot.interactLoc(gate, /^open$/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 9575, 5000, 250);
      }
      await bot.walkTo(2534, 9555, 2);
      for (let i = 0; i < 4 && inDungeon(); i++) {
        const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /ladder/i.test(l.name));
        if (ladUp) await bot.interactLoc(ladUp, /climb-?up/i);
        await waitCond(() => !inDungeon(), 5000, 250);
      }
      await bot.walkTo(2515, 3159, 2);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 3161; i++) {
        const r = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2186 || /loose railing/i.test(l.name));
        if (r) await bot.interactLoc(r, /squeeze-?through/i);
        await sleep(1000);
      }
      return hasPebble();
    });

    // Step 3: Bank all equipment/runes at Seers' Village Bank (2724, 3493), enter Glarial's tomb (2559, 3444), get Amulet & Urn
    const lootGlarialTomb = () => step(c, N, 'glarial-tomb-amulet-and-urn', async () => {
      if (questComplete || (hasAmulet() && hasUrn())) return true;
      const inTomb = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;

      if (!inTomb()) {
        // Walk to Seers' Village Bank (2724, 3493), unequip all gear, and deposit everything except Glarial's pebble & food
        await bot.walkTo(2724, 3493, 2);
        for (const eq of [...(sdk.getEquipment() ?? [])]) {
          await sdk.sendUnequipItem(eq.slot);
          await sleep(400);
        }
        for (let r = 0; r < 4; r++) {
          if (!sdk.isBankOpen()) {
            const ob = await bot.openBank();
            if (!ob?.success) { await sleep(800); continue; }
            await sleep(600);
          }
          const toDep = (sdk.getInventory() ?? []).filter((i: any) => i.id !== 294 && !/^(shrimps|anchovies|sardine|herring|trout|salmon|tuna|lobster|swordfish|bread|cooked meat|cooked chicken|cake|slice of cake|meat pie)$/i.test(i.name));
          for (const it of toDep) {
            await sdk.sendBankDeposit(it.slot, it.count ?? 1);
            await sleep(400);
          }
          break;
        }
        if (sdk.isBankOpen()) await bot.closeBank();

        // Walk to Glarial's tombstone (1992 at (2559, 3444)) and use Glarial's pebble (294) on it
        await bot.walkTo(2559, 3445, 2);
        for (let i = 0; i < 4 && !inTomb(); i++) {
          const peb = (sdk.getInventory() ?? []).find((it: any) => it.id === 294);
          const stone = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1992 || /tombstone/i.test(l.name));
          if (peb && stone) {
            await sdk.sendUseItemOnLoc(peb.slot, stone.x, stone.z, stone.id);
            await waitCond(() => inTomb(), 6000, 300);
          }
        }
      }
      if (!inTomb()) return false;

      // Get Glarial's amulet (295) from Chest (1994/1995 at (2530, 9844))
      if (!hasAmulet()) {
        await bot.walkTo(2531, 9844, 2);
        for (let i = 0; i < 4 && !hasAmulet(); i++) {
          const closed = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1994);
          if (closed) {
            await bot.interactLoc(closed, /^open$/i);
            await sleep(1000);
          }
          const open = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1995 || (/chest/i.test(l.name) && (l.options ?? []).some((o: string) => /^search$/i.test(o))));
          if (open) {
            await bot.interactLoc(open, /^search$/i);
            await waitCond(() => hasAmulet(), 4000, 250);
          }
        }
      }

      // Get Glarial's urn (296) from Glarial's tomb (1993 at (2542, 9811))
      if (!hasUrn()) {
        await bot.walkTo(2542, 9813, 2);
        for (let i = 0; i < 4 && !hasUrn(); i++) {
          const tomb = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1993 || /glarial's tomb/i.test(l.name));
          if (tomb) {
            await bot.interactLoc(tomb, /^search$/i);
            await waitCond(() => hasUrn(), 4000, 250);
          }
        }
      }

      // Climb up Ladder (1757 at (2556, 9844))
      await bot.walkTo(2555, 9844, 2);
      for (let i = 0; i < 4 && inTomb(); i++) {
        const lad = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1757 || /ladder/i.test(l.name));
        if (lad) await bot.interactLoc(lad, /climb-?up/i);
        await waitCond(() => !inTomb(), 5000, 250);
      }

      return hasAmulet() && hasUrn();
    });

    // Step 4: Withdraw Rope + 6 Air/Water/Earth runes from Seers' Bank, enter Waterfall Dungeon, place runes, amulet & urn
    const completeWaterfallDungeon = () => step(c, N, 'waterfall-dungeon-chalice', async () => {
      if (questComplete || xp(sdk, 'Strength') > baseStrXp) return true;
      const inDungeon = () => (sdk.getState()?.player?.worldZ ?? 0) > 9850;

      if (!inDungeon()) {
        // Withdraw Rope, 6 Air rune, 6 Water rune, 6 Earth rune from Seers' Village Bank (2724, 3493)
        if (!has(sdk, /^rope$/i) || count(sdk, /^air rune$/i) < 6 || count(sdk, /^water rune$/i) < 6 || count(sdk, /^earth rune$/i) < 6) {
          await bot.walkTo(2724, 3493, 2);
          for (let r = 0; r < 3; r++) {
            if (!sdk.isBankOpen()) {
              const ob = await bot.openBank();
              if (!ob?.success) { await sleep(800); continue; }
              await sleep(600);
            }
            for (const pat of [/^rope$/i, /^air rune$/i, /^water rune$/i, /^earth rune$/i]) {
              const bi = sdk.findBankItem(pat);
              if (bi) {
                await sdk.sendBankWithdraw(bi.slot, bi.count ?? 1);
                await sleep(450);
              }
            }
            break;
          }
          if (sdk.isBankOpen()) await bot.closeBank();
        }

        // Equip Glarial's amulet (or keep in inventory — quest_waterfall.rs2 checks inv OR worn!)
        // Walk to Log raft (1987 at (2510, 3494)) -> Rock (1996) -> Dead tree (2020) -> Door (2010 at (2511, 3464))
        await bot.walkTo(2511, 3493, 2);
        await openNearbyDoors(c, 2512, 3494, 2);
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) > 3485; i++) {
          const raft = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1987 || /log raft/i.test(l.name));
          if (raft) await bot.interactLoc(raft, /board/i);
          await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3485, 8000, 300);
        }
        await sleep(1200);
        if (sdk.getState()?.dialog?.isOpen) await chat(c);

        await bot.walkTo(2512, 3476, 1);
        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) > 3471; i++) {
          const ropeItem = sdk.findInventoryItem(/^rope$/i);
          const rock = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1996 || (/rock/i.test(l.name) && Math.hypot(l.x - 2512, l.z - 3468) <= 3));
          if (ropeItem && rock) {
            await sdk.sendUseItemOnLoc(ropeItem.slot, rock.x, rock.z, rock.id);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3471, 8000, 300);
          }
          await sleep(800);
        }

        for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) >= 3465; i++) {
          const ropeItem = sdk.findInventoryItem(/^rope$/i);
          const tree = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2020 || /dead tree/i.test(l.name));
          if (ropeItem && tree) {
            await sdk.sendUseItemOnLoc(ropeItem.slot, tree.x, tree.z, tree.id);
            await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) <= 3464, 5000, 250);
          }
        }

        // Open Door (2010 at (2511, 3464)) while wearing/holding Glarial's amulet
        for (let i = 0; i < 4 && !inDungeon(); i++) {
          const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2010 || /door/i.test(l.name));
          if (d) await bot.interactLoc(d, /^open$/i);
          await waitCond(() => inDungeon(), 5000, 250);
        }
      }
      if (!inDungeon()) return false;

      // Enable Protect from Melee (prayer index 14) for Fire Giants / Shadow Spiders
      const pr = sdk.getState()?.prayers;
      if ((pr?.prayerLevel ?? 0) >= 43 && (pr?.prayerPoints ?? 0) > 0 && !pr?.activePrayers?.[14]) {
        await sdk.sendTogglePrayer(14);
        await sleep(300);
      }

      // Search Crate (1999 at (2589, 9888)) in east room for Key (298)
      const hasWaterfallKey = () => (sdk.getInventory() ?? []).some((i: any) => i.id === 298);
      if (!hasWaterfallKey()) {
        const w1 = await bot.walkTo(2588, 9888, 2);
        if (!w1?.success) {
          await openNearbyDoors(c, 2583, 9876, 3);
          await bot.walkTo(2588, 9888, 2);
        }
        for (let i = 0; i < 4 && !hasWaterfallKey(); i++) {
          const cr = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 1999 && Math.hypot(l.x - 2589, l.z - 9888) <= 3);
          if (cr) await bot.interactLoc(cr, /search/i);
          await waitCond(() => hasWaterfallKey(), 4000, 250);
        }
      }

      // Walk to west path and unlock Door 1 (2002 at (2568, 9893)) and Door 2 (2002 at (2566, 9901))
      await bot.walkTo(2568, 9892, 1);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 9893; i++) {
        const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2002 && Math.hypot(l.x - 2568, l.z - 9893) <= 2);
        const keyItem = (sdk.getInventory() ?? []).find((it: any) => it.id === 298);
        if (d1 && keyItem) await sdk.sendUseItemOnLoc(keyItem.slot, d1.x, d1.z, d1.id);
        else if (d1) await bot.interactLoc(d1, /^open$/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 9894, 4000, 250);
      }

      await sdk.sendWalk(2566, 9901, true);
      await sleep(1500);
      for (let i = 0; i < 4 && (sdk.getState()?.player?.worldZ ?? 0) <= 9901; i++) {
        const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => (l.id === 2002 || /door/i.test(l.name)) && Math.hypot(l.x - 2566, l.z - 9901) <= 2);
        const keyItem = (sdk.getInventory() ?? []).find((it: any) => it.id === 298);
        if (d2 && keyItem) await sdk.sendUseItemOnLoc(keyItem.slot, d2.x, d2.z, d2.id);
        else if (d2) await bot.interactLoc(d2, /^open$/i);
        await waitCond(() => (sdk.getState()?.player?.worldZ ?? 0) >= 9902, 4000, 250);
      }

      // Place 1 Air rune, 1 Earth rune, 1 Water rune on each of the 6 pillars (id 2004)
      const pillars: [number, number][] = [
        [2562, 9910], [2562, 9912], [2562, 9914],
        [2569, 9910], [2569, 9912], [2569, 9914],
      ];
      for (const [px, pz] of pillars) {
        const walkX = px === 2562 ? 2563 : 2568;
        await sdk.sendWalk(walkX, pz, true);
        await sleep(1000);
        for (const rRe of [/^air rune$/i, /^earth rune$/i, /^water rune$/i]) {
          const rItem = sdk.findInventoryItem(rRe);
          if (rItem) {
            await sdk.sendUseItemOnLoc(rItem.slot, px, pz, 2004);
            await sleep(700);
          }
        }
      }

      // Unequip Glarial's amulet if worn so it's in inventory to place on Statue of Glarial (2006 at (2563, 9916))
      const wornAm = (sdk.getEquipment() ?? []).find((e: any) => e.id === 295 || /glarial's amulet/i.test(e.name));
      if (wornAm) {
        await sdk.sendUnequipItem(wornAm.slot);
        await sleep(500);
      }

      await sdk.sendWalk(2564, 9915, true);
      await sleep(1000);
      const amItem = (sdk.getInventory() ?? []).find((i: any) => i.id === 295 || /glarial's amulet/i.test(i.name));
      const glarialStatue = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2006);
      if (amItem && glarialStatue) {
        await sdk.sendUseItemOnLoc(amItem.slot, glarialStatue.x, glarialStatue.z, glarialStatue.id);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 0) > 2590, 8000, 300);
      }

      // Use Glarial's urn (296) on Chalice of Eternity (2014 at (2604, 9911))
      await bot.walkTo(2604, 9910, 2);
      const urnItem = (sdk.getInventory() ?? []).find((i: any) => i.id === 296 || /glarial's urn/i.test(i.name));
      const chalice = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2014 || /chalice/i.test(l.name));
      if (urnItem && chalice) {
        await sdk.sendUseItemOnLoc(urnItem.slot, chalice.x, chalice.z, chalice.id);
        await waitCond(() => xp(sdk, 'Strength') > baseStrXp, 10_000, 300);
      }
      await sleep(1500);
      if (sdk.getState()?.dialog?.isOpen) await chat(c);
      if (sdk.getState()?.modalOpen) await bot.closeInterface();
      if (sdk.getState()?.prayers?.activePrayers?.[14]) {
        await sdk.sendTogglePrayer(14);
      }
      questComplete = xp(sdk, 'Strength') > baseStrXp;
      return questComplete;
    });

    if (!(await startAndReadBook())) return false;
    if (!(await getPebbleFromGolrie())) return false;
    if (!(await lootGlarialTomb())) return false;
    if (!(await completeWaterfallDungeon())) return false;
    return true;
  },
};

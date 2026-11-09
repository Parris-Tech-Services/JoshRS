import { runScript } from '../../sdk/runner';
import { appendFileSync } from 'fs';

const REPORT_PATH = '/home/josh/dev/jimmy-sandbox/REPORT.md';
const LOG_PATH = '/home/josh/dev/jimmy-sandbox/rs-sdk/bots/jimmy-dev/lab_log.md';

function logResult(line: string) {
  console.log(line);
  appendFileSync(LOG_PATH, line + '\n');
}

function reportLine(line: string) {
  console.log('REPORT:', line);
  appendFileSync(REPORT_PATH, line + '\n');
}

const visitedIds = new Set<number>([
  376, 377, 378, 380, 381,
  574, 571, 569, 570, 844, 350, 887,
  710, 714, 28, 1469, 479, 470, 473, 474, 485, 469, 472, 471, 1526, 223,
  885, 886, 888, 890, 891, 892, 893, 894,
]);

async function sweepHere(bot: any, sdk: any, label: string, maxNpcs: number = 6) {
  await bot.dismissBlockingUI();
  if (sdk.getState()?.dialog?.isOpen) await sdk.sendCloseModal();

  const npcs = sdk.getNearbyNpcs();
  let count = 0;
  for (const npc of npcs) {
    if (count >= maxNpcs) break;
    if (visitedIds.has(npc.id)) continue;
    const opts = (npc.optionsWithIndex || []).map((o: any) => o.text);
    const hasTalk = opts.some((t: string) => /^talk-to$/i.test(t));
    const hasTrade = opts.some((t: string) => /^trade$/i.test(t));
    if (!hasTalk && !hasTrade) continue;
    if (npc.dist > 16) continue;
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|guard dog|wolf|scorpion|monkey|snake|jungle spider|pirate|thief|highwayman|mugger|jogre|ogre|tribesman|paladin|knight of ardougne|hero|warrior woman)$/i.test(npc.name)) continue;

    visitedIds.add(npc.id);
    count++;

    const live = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id);
    if (!live) continue;

    console.log(`\n--- [${label}] Testing ${live.name} (id=${live.id}) @ (${live.x},${live.z}) opts=${opts.join(',')} ---`);

    let talkStatus = 'N/A';
    let talkDetail = '';
    if (hasTalk) {
      const beforeTick = sdk.getState()?.tick || 0;
      const res = await bot.talkTo(live);
      await sdk.waitForTicks(2);
      const d = sdk.getDialog();
      const recentChat = (sdk.getChat() || []).filter((c: any) => c.tick >= beforeTick);
      const chatText = recentChat.map((c: any) => c.text).join(' | ');

      if (d?.isOpen) {
        talkStatus = 'OK';
        talkDetail = `Dialog: "${(d.text || d.title || '').replace(/\n/g, ' ')}"`;
        for (let step = 0; step < 5; step++) {
          const cur = sdk.getDialog();
          if (!cur?.isOpen) break;
          if (cur.options && cur.options.length > 0) {
            const opt = cur.options[0];
            await sdk.sendClickDialog(opt.index ?? 1);
          } else {
            await sdk.sendClickDialog(0);
          }
          await sdk.waitForTicks(2);
        }
        if (sdk.getState()?.dialog?.isOpen) await sdk.sendCloseModal();
      } else if (chatText) {
        if (/nothing interesting happens|no trigger/i.test(chatText)) {
          talkStatus = 'FAIL';
        } else {
          talkStatus = 'OK';
        }
        talkDetail = `Chat: "${chatText}"`;
      } else {
        talkStatus = res.success ? 'OK' : 'WARN';
        talkDetail = res.message || 'No dialog/chat';
      }
    }

    let tradeStatus = 'N/A';
    let tradeDetail = '';
    if (hasTrade) {
      const live2 = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id);
      if (live2) {
        const beforeTick = sdk.getState()?.tick || 0;
        const shopRes = await bot.interactNpc(live2, /^trade$/i);
        await sdk.waitForTicks(3);
        const st = sdk.getState();
        const recentChat = (sdk.getChat() || []).filter((c: any) => c.tick >= beforeTick).map((c: any) => c.text).join(' | ');
        if (st?.shop?.isOpen) {
          tradeStatus = 'OK';
          tradeDetail = `Shop "${st.shop.title}" (${st.shop.SellItems?.length || 0} items)`;
          await bot.closeShop();
          await sdk.waitForTicks(1);
        } else if (st?.dialog?.isOpen) {
          tradeStatus = 'OK';
          tradeDetail = `Trade opened dialog: "${(st.dialog.text || '').replace(/\n/g, ' ')}"`;
          await sdk.sendCloseModal();
        } else if (recentChat) {
          tradeStatus = /nothing interesting happens|no trigger/i.test(recentChat) ? 'FAIL' : 'OK';
          tradeDetail = `Chat: "${recentChat}"`;
        } else {
          tradeStatus = shopRes.success ? 'OK' : 'WARN';
          tradeDetail = shopRes.message || 'No shop opened';
        }
      }
    }

    const overall = (talkStatus === 'FAIL' || tradeStatus === 'FAIL') ? 'FAIL' : 'OK';
    logResult(`- ${overall} | ${live.id} (${live.name}) @ (${live.x}, ${live.z}, L${sdk.getState()?.player?.level}) [${label}] | Talk: ${talkStatus} (${talkDetail}) | Trade: ${tradeStatus} (${tradeDetail})`);
    reportLine(`| ${live.id} | ${live.name} (${label} ${live.x},${live.z}) | ${overall} | Talk: ${talkDetail} / Trade: ${tradeDetail} | - |`);
  }
}

await runScript(async ({ bot, sdk }) => {
  const s0 = sdk.getState();
  console.log(`Starting at (${s0?.player?.worldX}, ${s0?.player?.worldZ}, L${s0?.player?.level})`);

  // If on Brimhaven ship (L1 around 2775, 3234), step off the gangplank first!
  if ((sdk.getState()?.player?.level ?? 0) === 1 && (sdk.getState()?.player?.worldX ?? 0) > 2700) {
    const plankOff = sdk.findNearbyLoc(/gangplank/i);
    if (plankOff) {
      await bot.interactLoc(plankOff, /cross/i);
      await sdk.waitForTicks(3);
    }
  }

  // If on Karamja (x > 2700), talk to Customs officer (380) at (2772, 3225) to sail to Ardougne!
  if ((sdk.getState()?.player?.worldX ?? 0) > 2700) {
    await bot.walkTo(2772, 3225, 2);
    const officer = sdk.findNearbyNpc(/customs officer/i);
    if (officer) {
      console.log('Sailing Brimhaven -> Ardougne via Customs officer...');
      await bot.talkTo(officer);
      for (let i = 0; i < 20; i++) {
        await sdk.waitForTicks(2);
        const d = sdk.getDialog();
        if (!d?.isOpen) {
          if ((sdk.getState()?.player?.worldX ?? 2772) < 2700) break;
          continue;
        }
        const opts = d.options || [];
        if (opts.length > 0) {
          const pick = opts.find((o: any) => /journey|search away|ok/i.test(o.text)) || opts[0];
          await sdk.sendClickDialog(pick.index ?? 1);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sdk.waitForTicks(5);
      if (sdk.getState()?.dialog?.isOpen) {
        await sdk.sendClickDialog(0);
        await sdk.waitForTicks(2);
      }
      if ((sdk.getState()?.player?.level ?? 0) === 1 && (sdk.getState()?.player?.worldX ?? 2772) < 2700) {
        const plank2 = sdk.findNearbyLoc(/gangplank/i);
        if (plank2) {
          await bot.interactLoc(plank2, /cross/i);
          await sdk.waitForTicks(3);
        }
      }
    }
  }

  const p = sdk.getState()?.player;
  console.log(`Now in Kandarin at (${p?.worldX}, ${p?.worldZ}, L${p?.level})`);
  if ((p?.worldX ?? 3000) > 2700 || (p?.level ?? 0) !== 0) {
    console.log('Did not reach Kandarin L0! Stopping.');
    return;
  }

  const kandarinWaypoints = [
    // East Ardougne
    { x: 2662, z: 3305, label: 'Ardougne Market Fur & Spice' },
    { x: 2654, z: 3286, label: 'Ardougne Zenesha Platebody Shop' },
    { x: 2615, z: 3298, label: 'Ardougne Church & Halgrive' },
    { x: 2612, z: 3293, label: 'Ardougne Jerico House' },
    { x: 2592, z: 3336, label: 'Ardougne Elena House' },
    { x: 2574, z: 3323, label: 'Ardougne Adventurer Store' },
    // Hemenster, Ranging Guild, Catherby
    { x: 2638, z: 3441, label: 'Hemenster Fishing Contest' },
    { x: 2658, z: 3439, label: 'Ranging Guild Entrance' },
    { x: 2804, z: 3433, label: 'Catherby Docks & Arhein' },
    { x: 2821, z: 3442, label: 'Catherby Hickton & Shops' },
    { x: 2797, z: 3440, label: 'Catherby Candle Maker & Caleb' },
    // Tree Gnome Stronghold (Brimstail & Gnomeball)
    { x: 2403, z: 3419, label: 'Brimstail Cave Entrance' },
    { x: 2394, z: 3488, label: 'Gnomeball Field' },
    // Tracker Gnomes & Observatory
    { x: 2501, z: 3261, label: 'Tracker Gnome 1' },
    { x: 2524, z: 3256, label: 'Tracker Gnome 2' },
    { x: 2497, z: 3234, label: 'Tracker Gnome 3' },
    { x: 2556, z: 3299, label: 'Kilron Outside Tree Gnome Village' },
    { x: 2440, z: 3158, label: 'Observatory Reception' },
    // Port Khazard, Yanille, Watchtower, Feldip Hills
    { x: 2664, z: 3160, label: 'Port Khazard Docks' },
    { x: 2567, z: 3140, label: 'Khazard Bar' },
    { x: 2606, z: 3092, label: 'Yanille East Magic Guild & Shops' },
    { x: 2570, z: 3095, label: 'Yanille Center' },
    { x: 2553, z: 3080, label: 'Yanille Dragon Inn' },
    { x: 2547, z: 3113, label: 'Watchtower Ground' },
    { x: 2630, z: 2981, label: 'Feldip Hills Rantz' },
  ];

  for (const wp of kandarinWaypoints) {
    console.log(`\n=== Walking to ${wp.label} (${wp.x}, ${wp.z}) ===`);
    const w = await bot.walkTo(wp.x, wp.z, 4);
    if (!w.success) {
      console.log(`Walk to ${wp.label} returned: ${w.message}`);
      await bot.openDoor();
      await bot.walkTo(wp.x, wp.z, 5);
    }
    await sweepHere(bot, sdk, wp.label, 6);

    if (wp.label === 'Brimstail Cave Entrance') {
      const cave = sdk.findNearbyLoc(/cave entrance/i);
      if (cave && cave.dist <= 10) {
        await bot.interactLoc(cave, /enter/i);
        await sdk.waitForTicks(3);
        await sweepHere(bot, sdk, 'Brimstail Cave Inside', 4);
        const exit = sdk.findNearbyLoc(/cave exit|tunnel/i);
        if (exit) {
          await bot.interactLoc(exit);
          await sdk.waitForTicks(3);
        }
      }
    }

    if (wp.label === 'Watchtower Ground') {
      const l0 = sdk.findNearbyLoc(/ladder/i);
      if (l0 && l0.dist <= 8) {
        await bot.interactLoc(l0, /climb-up/i);
        await sdk.waitForTicks(3);
        await sweepHere(bot, sdk, 'Watchtower L1', 4);
        const l1 = sdk.findNearbyLoc(/ladder/i);
        if (l1) {
          await bot.interactLoc(l1, /climb-up/i);
          await sdk.waitForTicks(3);
          await sweepHere(bot, sdk, 'Watchtower L2', 4);
          const d2 = sdk.findNearbyLoc(/ladder/i);
          if (d2) {
            await bot.interactLoc(d2, /climb-down/i);
            await sdk.waitForTicks(3);
          }
        }
        const d1 = sdk.findNearbyLoc(/ladder/i);
        if (d1) {
          await bot.interactLoc(d1, /climb-down/i);
          await sdk.waitForTicks(3);
        }
      }
    }

    if (wp.label === 'Feldip Hills Rantz') {
      const cave = sdk.findNearbyLoc(/cave entrance/i);
      if (cave && cave.dist <= 12) {
        await bot.interactLoc(cave, /enter/i);
        await sdk.waitForTicks(3);
        await sweepHere(bot, sdk, 'Rantz Cave Inside', 4);
        const exit = sdk.findNearbyLoc(/cave exit|tunnel/i);
        if (exit) {
          await bot.interactLoc(exit);
          await sdk.waitForTicks(3);
        }
      }
    }
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

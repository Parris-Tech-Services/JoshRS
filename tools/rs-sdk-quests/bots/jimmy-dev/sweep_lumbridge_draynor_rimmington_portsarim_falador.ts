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
  // Already in REPORT.md for these towns
  456, // Father Aereck
  519, // Bob
  918, // Ned
  755, // Morgan
  915, // Leela
  970, // Diango
  917, // Jail guard
  922, // Aggie
  285, // Veronica
  606, // Squire
  583, // Betty
  559, // Brian (Port Sarim)
  734, // Bartender (Rusty Anchor)
  375, // Redbeard Frank
  744, // Klarense
  657, // Monk of Entrana
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
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost)$/i.test(npc.name)) continue;

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

  // 1. Lumbridge Castle L0 & L1 (Hans, Cook, Duke Horacio)
  await bot.walkTo(3222, 3218, 2);
  await sweepHere(bot, sdk, 'Lumbridge Courtyard', 5);
  await bot.walkTo(3208, 3214, 2);
  await sweepHere(bot, sdk, 'Lumbridge Kitchen', 4);
  await bot.walkTo(3206, 3209, 2);
  const stairsUp = sdk.findNearbyLoc(/staircase/i);
  if (stairsUp) {
    await bot.interactLoc(stairsUp, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.walkTo(3210, 3220, 2);
    await sweepHere(bot, sdk, 'Lumbridge Castle L1', 4);
    await bot.walkTo(3206, 3209, 2);
    const stairsDown = sdk.findNearbyLoc(/staircase/i);
    if (stairsDown) {
      await bot.interactLoc(stairsDown, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 2. Lumbridge General Store & Fred the Farmer & Father Urhney
  const waypoints = [
    { x: 3212, z: 3246, label: 'Lumbridge General Store' },
    { x: 3189, z: 3273, label: 'Fred the Farmer' },
    { x: 3166, z: 3306, label: 'Millie Miller Windmill' },
    { x: 3147, z: 3175, label: 'Lumbridge Swamp Urhney' },
    { x: 3085, z: 3250, label: 'Draynor Market' },
    { x: 3093, z: 3244, label: 'Draynor Bank' },
    { x: 3108, z: 3362, label: 'Draynor Manor Ground' },
    { x: 3014, z: 3224, label: 'Port Sarim Fishing Shop' },
    { x: 3014, z: 3204, label: 'Port Sarim Food Store' },
    { x: 3018, z: 3246, label: 'Port Sarim Jewellery Shop' },
    { x: 3027, z: 3218, label: 'Port Sarim Seamen' },
    { x: 3000, z: 3145, label: 'Mudskipper Point Thurgo' },
    { x: 2968, z: 3205, label: 'Rimmington Hetty' },
    { x: 2956, z: 3204, label: 'Rimmington Archery' },
    { x: 2948, z: 3216, label: 'Rimmington Crafting' },
    { x: 2933, z: 3210, label: 'Rimmington Chemist' },
    { x: 2933, z: 3285, label: 'Crafting Guild' },
    { x: 2916, z: 3322, label: 'Makeover Mage' },
    { x: 2957, z: 3370, label: 'Falador Rising Sun Inn' },
    { x: 2946, z: 3368, label: 'Falador West Bank' },
    { x: 2955, z: 3388, label: 'Falador Flynn Mace Shop' },
    { x: 2975, z: 3383, label: 'Falador Cassie Shield Shop' },
    { x: 2941, z: 3340, label: 'Falador Herquin Gems' },
    { x: 2972, z: 3313, label: 'Falador Wayne Chainmail' },
    { x: 3026, z: 3379, label: 'Falador Park Wyson' },
    { x: 3052, z: 3490, label: 'Edgeville Monastery' },
    { x: 3078, z: 3425, label: 'Barbarian Village' },
  ];

  for (const wp of waypoints) {
    console.log(`\n=== Walking to ${wp.label} (${wp.x}, ${wp.z}) ===`);
    const w = await bot.walkTo(wp.x, wp.z, 3);
    if (!w.success) {
      console.log(`Walk to ${wp.label} returned: ${w.message}`);
      await bot.openDoor();
      await bot.walkTo(wp.x, wp.z, 4);
    }
    await sweepHere(bot, sdk, wp.label, 6);
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

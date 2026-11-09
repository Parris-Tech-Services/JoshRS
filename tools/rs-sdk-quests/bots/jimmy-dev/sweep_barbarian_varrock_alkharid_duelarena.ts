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
  538, // Peksa
  801, // Abbot Langley
  803, // Monk
  636, // Phillipa
  639, // Romeo
  882, // Gypsy
  546, // Zaff
  547, // Baraek
  781, // Shilop
  783, // Wilough
  548, // Thessalia
  522, // Shop keeper
  523, // Shop assistant
  641, // Tramp
  551, // Shop keeper
  552, // Shop assistant
  645, // Jonny the beard
  550, // Lowe
  549, // Horvik
  553, // Aubury
  368, // Guard
  640, // Father Lawrence
  731, // Jolly Boar Bartender
  756, // Dr Harlow
  647, // Reldo
  648, // King Roald
  883, // Sir Prysin
  638, // Apothecary
  646, // Curator
  780, // Gertrude
  540, // Gem trader
  539, // Silk trader
  170, // Gnome pilot
  524, // Shop keeper
  525, // Shop assistant
  542, // Louie legs
  544, // Ranael
  923, // Hassan
  924, // Osman
  541, // Zeke
  836, // Shantay
  925, // Border Guard
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
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|barbarian woman|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost|scorpion|al-kharid warrior)$/i.test(npc.name)) continue;

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

  // 1. Gunthor the brave (3079, 3420)
  await bot.walkTo(3079, 3420, 3);
  await sweepHere(bot, sdk, 'Barbarian Village Longhall', 4);

  // 2. Juliet's house (3158, 3426, L1)
  await bot.walkTo(3156, 3435, 3);
  const julietStairs = sdk.findNearbyLoc(/staircase/i);
  if (julietStairs && julietStairs.dist <= 8) {
    await bot.interactLoc(julietStairs, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.walkTo(3158, 3426, 2);
    await sweepHere(bot, sdk, 'Juliet House L1', 4);
    await bot.walkTo(3156, 3435, 2);
    const down = sdk.findNearbyLoc(/staircase/i);
    if (down) {
      await bot.interactLoc(down, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 3. Varrock Palace NW Tower Captain Rovin (3205, 3497, L2)
  await bot.walkTo(3206, 3496, 3);
  const ladder0 = sdk.findNearbyLoc(/ladder/i);
  if (ladder0 && ladder0.dist <= 8) {
    await bot.interactLoc(ladder0, /climb-up/i);
    await sdk.waitForTicks(3);
    await sweepHere(bot, sdk, 'Varrock Palace Tower L1', 3);
    const ladder1 = sdk.findNearbyLoc(/ladder/i);
    if (ladder1) {
      await bot.interactLoc(ladder1, /climb-up/i);
      await sdk.waitForTicks(3);
      await sweepHere(bot, sdk, 'Varrock Palace Tower L2', 4);
      const down2 = sdk.findNearbyLoc(/ladder/i);
      if (down2) {
        await bot.interactLoc(down2, /climb-down/i);
        await sdk.waitForTicks(3);
      }
    }
    const down1 = sdk.findNearbyLoc(/ladder/i);
    if (down1) {
      await bot.interactLoc(down1, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 4. Katrine, Straven, Blue Moon Inn, Champions' Guild, Al Kharid, Duel Arena
  const waypoints = [
    { x: 3185, z: 3385, label: 'Varrock Black Arm Gang' },
    { x: 3178, z: 3395, label: 'Varrock Phoenix Gang' },
    { x: 3226, z: 3399, label: 'Varrock Blue Moon Inn' },
    { x: 3191, z: 3364, label: 'Champions Guild' },
    { x: 3275, z: 3191, label: 'Al Kharid Tannery' },
    { x: 3273, z: 3180, label: 'Al Kharid Kebab Shop' },
    { x: 3321, z: 3194, label: 'Al Kharid Crafting Shop' },
    { x: 3315, z: 3235, label: 'Duel Arena Entrance' },
    { x: 3362, z: 3268, label: 'Duel Arena Hospital' },
    { x: 3372, z: 3268, label: 'Duel ArenaSpectator' },
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

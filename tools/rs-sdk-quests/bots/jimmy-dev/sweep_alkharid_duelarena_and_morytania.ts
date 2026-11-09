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
  925, // Border Guard
  926, // Border Guard
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
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost|scorpion|al-kharid warrior|leech|ghoul)$/i.test(npc.name)) continue;

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
  await bot.dismissBlockingUI();
  if (sdk.getState()?.dialog?.isOpen) await sdk.sendCloseModal();

  const s0 = sdk.getState();
  console.log(`Starting at (${s0?.player?.worldX}, ${s0?.player?.worldZ}, L${s0?.player?.level})`);

  // Walk north around the Al Kharid fence (3260, 3328 -> 3282, 3330)
  await bot.walkTo(3260, 3280, 3);
  await bot.walkTo(3260, 3328, 3);
  await bot.walkTo(3282, 3330, 3);

  const alkharidWaypoints = [
    { x: 3315, z: 3235, label: 'Duel Arena Entrance' },
    { x: 3362, z: 3268, label: 'Duel Arena Hospital' },
    { x: 3372, z: 3268, label: 'Duel Arena Walkway' },
    { x: 3355, z: 3275, label: 'Duel Arena Bank' },
    { x: 3321, z: 3194, label: 'Al Kharid Crafting Shop' },
    { x: 3275, z: 3191, label: 'Al Kharid Tannery' },
    { x: 3273, z: 3180, label: 'Al Kharid Kebab Shop' },
  ];

  for (const wp of alkharidWaypoints) {
    console.log(`\n=== Walking to ${wp.label} (${wp.x}, ${wp.z}) ===`);
    const w = await bot.walkTo(wp.x, wp.z, 3);
    if (!w.success) {
      console.log(`Walk to ${wp.label} returned: ${w.message}`);
      await bot.openDoor();
      await bot.walkTo(wp.x, wp.z, 4);
    }
    await sweepHere(bot, sdk, wp.label, 6);
  }

  // Walk north from Al Kharid (3282, 3330) to Paterdomus (3405, 3488)
  console.log('\n=== Walking to Paterdomus (3405, 3488) ===');
  await bot.walkTo(3300, 3260, 4);
  await bot.walkTo(3285, 3335, 4);
  await bot.walkTo(3320, 3420, 4);
  await bot.walkTo(3405, 3488, 3);
  await sweepHere(bot, sdk, 'Paterdomus Temple', 4);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

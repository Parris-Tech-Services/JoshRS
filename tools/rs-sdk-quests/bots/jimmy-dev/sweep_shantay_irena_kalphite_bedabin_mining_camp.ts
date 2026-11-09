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
  1239, 836, 923, 924, 925, 926,
]);

async function sweepHere(bot: any, sdk: any, label: string, maxNpcs: number = 6) {
  await bot.dismissBlockingUI();
  if (sdk.getState()?.dialog?.isOpen) await sdk.sendCloseModal();

  const npcs = sdk.getNearbyNpcs();
  console.log(`  [${label}] Pos=(${sdk.getState()?.player?.worldX},${sdk.getState()?.player?.worldZ},L${sdk.getState()?.player?.level}) Nearby NPCs:`, npcs.map((n: any) => `${n.name}(${n.id})@(${n.x},${n.z})`).join(', '));

  let count = 0;
  for (const npc of npcs) {
    if (count >= maxNpcs) break;
    if (visitedIds.has(npc.id)) continue;
    const opts = (npc.optionsWithIndex || []).map((o: any) => o.text);
    const hasTalk = opts.some((t: string) => /^talk-to$/i.test(t));
    const hasTrade = opts.some((t: string) => /^trade$/i.test(t));
    if (!hasTalk && !hasTrade) continue;
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost|scorpion|ugthanki|camel)$/i.test(npc.name)) continue;

    visitedIds.add(npc.id);
    count++;

    let live = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id);
    if (!live) continue;
    if (!live.reachable) {
      await bot.openDoor();
      await sdk.waitForTicks(2);
      live = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id);
      if (!live) continue;
    }

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

  // 1. Walk to Al Kharid (3295, 3195) and pickpocket Man for 10gp
  await bot.walkTo(3295, 3195, 2);
  for (let i = 0; i < 15; i++) {
    if ((sdk.findInventoryItem(/coins/i)?.count ?? 0) >= 10) break;
    const man = sdk.findNearbyNpc(/^man$/i);
    if (man) await bot.pickpocketNpc(man);
    else await bot.walkTo(3295, 3195, 2);
    await sdk.waitForTicks(1);
  }

  // 2. Walk to Shantay Pass (3304, 3120), buy a Shantay pass, and go through!
  await bot.walkTo(3304, 3120, 2);
  const shantay = sdk.findNearbyNpc(/shantay/i);
  if (shantay && !sdk.findInventoryItem(/shantay pass/i)) {
    await bot.openShop(shantay);
    await bot.buyFromShop(/shantay pass/i, 1);
    await bot.closeShop();
  }
  const passGate = sdk.findNearbyLoc(/shantay pass/i);
  if (passGate) {
    await bot.interactLoc(passGate, /go-through/i);
    for (let i = 0; i < 8; i++) {
      await sdk.waitForTicks(2);
      if ((sdk.getState()?.player?.worldZ ?? 3120) < 3116) break;
      const d = sdk.getDialog();
      if (d?.isOpen) {
        if (d.options && d.options.length > 0) {
          await sdk.sendClickDialog(d.options[0].index ?? 1);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
    }
  }
  console.log(`Pos after Shantay Pass: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  // 3. Test Irena (835 at 3304, 3112)
  await bot.walkTo(3304, 3112, 2);
  await sweepHere(bot, sdk, 'Shantay Pass South Irena', 4);

  // 4. Test Weird Old Man (1152 at 3227, 3106)
  await bot.walkTo(3227, 3106, 3);
  await sweepHere(bot, sdk, 'Kalphite Lair Outside', 4);

  // 5. Test Bedabin Camp (832 Al Shabim, 833 Bedabin Nomad, 834 Bedabin Nomad Guard at 3169, 3036)
  await bot.walkTo(3169, 3036, 3);
  await sweepHere(bot, sdk, 'Bedabin Camp', 6);
  await bot.walkTo(3159, 3042, 3);
  await sweepHere(bot, sdk, 'Bedabin Camp West', 4);

  // 6. Test Desert Mining Camp (830 Mercenary Captain, 828/829 Mercenary at 3272, 3029)
  await bot.walkTo(3272, 3029, 3);
  await sweepHere(bot, sdk, 'Desert Mining Camp Gate', 6);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

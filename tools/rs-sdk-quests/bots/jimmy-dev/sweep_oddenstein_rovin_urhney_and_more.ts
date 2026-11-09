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
  0, 278, 456, 519, 520, 521, 758, 741,
  300, 881, 706, 707, 1263,
  918, 755, 915, 970, 917, 922, 285, 919, 916, 920,
  538, 801, 803,
  636, 642, 644, 733, 546, 847,
  618, 619, 613, 620, 615, 616, 617,
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
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|barbarian woman|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost|scorpion|monk of zamorak)$/i.test(npc.name)) continue;

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

async function ensureGroundFloor(bot: any, sdk: any) {
  for (let tries = 0; tries < 5 && (sdk.getState()?.player?.level ?? 0) > 0; tries++) {
    const downLoc = sdk.getNearbyLocs().find((l: any) => /ladder|stair/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-down/i.test(o.text)));
    if (downLoc) {
      if (!downLoc.reachable) await bot.openDoor();
      await bot.interactLoc(downLoc, /climb-down/i);
      await sdk.waitForTicks(3);
    } else {
      await bot.openDoor();
      await sdk.waitForTicks(2);
    }
  }
}

await runScript(async ({ bot, sdk }) => {
  const s0 = sdk.getState();
  console.log(`Starting at (${s0?.player?.worldX}, ${s0?.player?.worldZ}, L${s0?.player?.level})`);

  // 1. Draynor Manor L2 (Professor Oddenstein 286) from (3108, 3354, L0)
  console.log('\n=== 1. Draynor Manor L2 (Professor Oddenstein) ===');
  await sdk.sendWalk(3109, 3357, true);
  await sdk.waitForTicks(2);
  await bot.openDoor();
  await sdk.waitForTicks(2);
  await sdk.sendWalk(3109, 3360, true);
  await sdk.waitForTicks(3);
  const stairs0 = sdk.getNearbyLocs().find((l: any) => /stair/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-up/i.test(o.text)));
  if (stairs0) {
    console.log(`Found Draynor Manor stairs: ${stairs0.name} at (${stairs0.x}, ${stairs0.z})`);
    await bot.interactLoc(stairs0, /climb-up/i);
    await sdk.waitForTicks(3);
    await sdk.sendWalk(3105, 3363, true);
    await sdk.waitForTicks(3);
    const ladder1 = sdk.getNearbyLocs().find((l: any) => /ladder|stair/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-up/i.test(o.text)));
    if (ladder1) {
      console.log(`Found Draynor Manor L1 ladder: ${ladder1.name} at (${ladder1.x}, ${ladder1.z})`);
      await bot.interactLoc(ladder1, /climb-up/i);
      await sdk.waitForTicks(3);
      await bot.openDoor();
      await sdk.waitForTicks(2);
      await sdk.sendWalk(3109, 3365, true);
      await sdk.waitForTicks(3);
      await sweepHere(bot, sdk, 'Draynor Manor L2', 4);
      const down2 = sdk.getNearbyLocs().find((l: any) => /ladder|stair/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-down/i.test(o.text)));
      if (down2) {
        await bot.interactLoc(down2, /climb-down/i);
        await sdk.waitForTicks(3);
      }
    }
    await sdk.sendWalk(3109, 3364, true);
    await sdk.waitForTicks(3);
    const down1 = sdk.getNearbyLocs().find((l: any) => /stair/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-down/i.test(o.text)));
    if (down1) {
      await bot.interactLoc(down1, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }
  // Exit Draynor Manor via east back door (3123, 3360)
  await bot.walkTo(3125, 3360, 2);

  // 2. Varrock Palace NW Tower L2 (Captain Rovin 649)
  console.log('\n=== 2. Varrock Palace Tower L2 (Captain Rovin) ===');
  await bot.walkTo(3212, 3472, 2);
  await bot.openDoor();
  await bot.walkTo(3203, 3476, 2);
  await bot.openDoor();
  await bot.walkTo(3203, 3494, 2);
  await bot.openDoor();
  await sdk.sendWalk(3206, 3495, true);
  await sdk.waitForTicks(3);
  const palLadder0 = sdk.getNearbyLocs().find((l: any) => /ladder/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-up/i.test(o.text)));
  if (palLadder0) {
    await bot.interactLoc(palLadder0, /climb-up/i);
    await sdk.waitForTicks(3);
    await sweepHere(bot, sdk, 'Varrock Palace Tower L1', 4);
    const palLadder1 = sdk.getNearbyLocs().find((l: any) => /ladder/i.test(l.name) && (l.optionsWithIndex || []).some((o: any) => /climb-up/i.test(o.text)));
    if (palLadder1) {
      await bot.interactLoc(palLadder1, /climb-up/i);
      await sdk.waitForTicks(3);
      await sweepHere(bot, sdk, 'Varrock Palace Tower L2', 4);
    }
    await ensureGroundFloor(bot, sdk);
  }
  await bot.openDoor();
  await sdk.sendWalk(3203, 3490, true);
  await sdk.waitForTicks(3);

  // 3. Lumbridge Swamp Father Urhney (3206, 3150 via graveyard 3242, 3190 -> 3220, 3155 -> 3207, 3152)
  console.log('\n=== 3. Lumbridge Swamp Father Urhney (3206, 3150) ===');
  await bot.walkTo(3242, 3190, 3);
  await bot.walkTo(3220, 3155, 3);
  await bot.walkTo(3207, 3152, 2);
  await bot.openDoor();
  await sdk.sendWalk(3206, 3150, true);
  await sdk.waitForTicks(3);
  await sweepHere(bot, sdk, 'Lumbridge Swamp Urhney', 4);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

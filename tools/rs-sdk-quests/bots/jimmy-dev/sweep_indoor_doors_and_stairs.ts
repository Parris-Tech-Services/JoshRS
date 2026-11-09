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
  0, 278, 456, 519, 520, 521, 758,
  300, 881, 706, 1263,
  918, 755, 915, 970, 917, 922, 285,
  538, 801, 803,
  636, 642, 733,
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
    if (npc.dist > 20) continue;
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

await runScript(async ({ bot, sdk }) => {
  const s0 = sdk.getState();
  console.log(`Starting at (${s0?.player?.worldX}, ${s0?.player?.worldZ}, L${s0?.player?.level})`);

  // 1. Wizards' Tower L1 (Wizard Grayzag 707)
  console.log('\n=== 1. Wizards Tower L1 ===');
  await bot.walkTo(3105, 3160, 1);
  const wizStairsUp = sdk.findNearbyLoc(/staircase/i);
  if (wizStairsUp) {
    await bot.interactLoc(wizStairsUp, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.openDoor();
    await sweepHere(bot, sdk, 'Wizards Tower L1', 4);
    const wizStairsDown = sdk.findNearbyLoc(/staircase/i);
    if (wizStairsDown) {
      await bot.interactLoc(wizStairsDown, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 2. Draynor Market (Fortunato, Olivia, Miss Schism) & Draynor Jail (Prince Ali)
  console.log('\n=== 2. Draynor Market & Jail ===');
  await bot.walkTo(3085, 3251, 2);
  await sweepHere(bot, sdk, 'Draynor Wine & Market', 6);
  await bot.walkTo(3128, 3244, 2);
  await sweepHere(bot, sdk, 'Draynor Jail', 4);

  // 3. Lumbridge Swamp Father Urhney (3147, 3175)
  console.log('\n=== 3. Lumbridge Swamp Father Urhney ===');
  await bot.walkTo(3147, 3174, 1);
  await bot.openDoor();
  await sweepHere(bot, sdk, 'Lumbridge Swamp Urhney', 4);

  // 4. Lumbridge Castle L1 (Duke Horacio 741)
  console.log('\n=== 4. Lumbridge Castle L1 (Duke Horacio) ===');
  await bot.walkTo(3206, 3208, 1);
  const lumStairsUp = sdk.findNearbyLoc(/staircase/i);
  if (lumStairsUp) {
    await bot.interactLoc(lumStairsUp, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.openDoor();
    await sweepHere(bot, sdk, 'Lumbridge Castle L1', 4);
    const lumStairsDown = sdk.findNearbyLoc(/staircase/i);
    if (lumStairsDown) {
      await bot.interactLoc(lumStairsDown, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 5. Varrock SE Phoenix Gang (Straven 644 at 3247, 3383)
  console.log('\n=== 5. Varrock SE Phoenix Gang (Straven) ===');
  await bot.walkTo(3244, 3383, 1);
  const phoenixLadder = sdk.findNearbyLoc(/ladder/i);
  if (phoenixLadder && phoenixLadder.dist <= 6) {
    await bot.interactLoc(phoenixLadder, /climb-down/i);
    await sdk.waitForTicks(3);
    await sweepHere(bot, sdk, 'Varrock Phoenix Gang Basement', 4);
    const ladderUp = sdk.findNearbyLoc(/ladder/i);
    if (ladderUp) {
      await bot.interactLoc(ladderUp, /climb-up/i);
      await sdk.waitForTicks(3);
    }
  }

  // 6. Juliet's House L1 (3156, 3435 -> L1)
  console.log('\n=== 6. Juliet House L1 ===');
  await bot.walkTo(3156, 3435, 1);
  const julietStairs = sdk.findNearbyLoc(/staircase/i);
  if (julietStairs) {
    await bot.interactLoc(julietStairs, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.openDoor();
    await sweepHere(bot, sdk, 'Juliet House L1', 4);
    const julietDown = sdk.findNearbyLoc(/staircase/i);
    if (julietDown) {
      await bot.interactLoc(julietDown, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 7. Varrock Palace NW Tower L2 (Captain Rovin 649)
  console.log('\n=== 7. Varrock Palace Tower L2 (Captain Rovin) ===');
  await bot.walkTo(3206, 3496, 1);
  const palLadder0 = sdk.findNearbyLoc(/ladder/i);
  if (palLadder0) {
    await bot.interactLoc(palLadder0, /climb-up/i);
    await sdk.waitForTicks(3);
    await sweepHere(bot, sdk, 'Varrock Palace Tower L1', 4);
    const palLadder1 = sdk.findNearbyLoc(/ladder/i);
    if (palLadder1) {
      await bot.interactLoc(palLadder1, /climb-up/i);
      await sdk.waitForTicks(3);
      await sweepHere(bot, sdk, 'Varrock Palace Tower L2', 4);
      const palDown2 = sdk.findNearbyLoc(/ladder/i);
      if (palDown2) {
        await bot.interactLoc(palDown2, /climb-down/i);
        await sdk.waitForTicks(3);
      }
    }
    const palDown1 = sdk.findNearbyLoc(/ladder/i);
    if (palDown1) {
      await bot.interactLoc(palDown1, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }

  // 8. Draynor Manor L2 (Professor Oddenstein 286)
  console.log('\n=== 8. Draynor Manor L2 (Professor Oddenstein) ===');
  await bot.walkTo(3108, 3360, 1);
  const manorStairs = sdk.findNearbyLoc(/staircase/i);
  if (manorStairs) {
    await bot.interactLoc(manorStairs, /climb-up/i);
    await sdk.waitForTicks(3);
    await bot.openDoor();
    const manorLadder = sdk.findNearbyLoc(/ladder/i);
    if (manorLadder) {
      await bot.interactLoc(manorLadder, /climb-up/i);
      await sdk.waitForTicks(3);
      await bot.openDoor();
      await sweepHere(bot, sdk, 'Draynor Manor L2', 4);
    }
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

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
  0, 278, 456, 458, 519, 520, 521, 758, 741,
  300, 881, 706, 707, 1263,
  918, 755, 915, 970, 917, 922, 285, 919, 916, 920,
  538, 801, 803,
  636, 642, 644, 647, 648, 883, 884, 733, 546, 847,
  618, 619, 613, 620, 615, 616, 617,
  307, 530, 531, 585, 367, 336, 338, 340,
  583, 559, 734, 375, 744, 657, 558, 557, 556, 376, 377, 378, 604,
  780, 781, 783, 522,
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
    if (/^(man|woman|rat|spider|goblin|cow|chicken|imp|ram|sheep|guard|dwarf|barbarian|barbarian woman|thief|highwayman|mugger|dark wizard|skeleton|zombie|ghost|scorpion|monk of zamorak|warrior woman|pirate|jail guard)$/i.test(npc.name)) continue;

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

  // 1. Port Sarim Jail (Wormbrain 745 at 3014, 3186)
  console.log('\n=== 1. Port Sarim Jail (Wormbrain 745) ===');
  await bot.walkTo(3013, 3189, 2);
  await bot.openDoor();
  await sweepHere(bot, sdk, 'Port Sarim Jail', 4);

  // 2. Lumbridge West Adventurer Camp (Warrior 650, Archer 649, Wizard 652, Monk 651 at 3146, 3201)
  console.log('\n=== 2. Lumbridge West Adventurer Camp (3146, 3201) ===');
  await bot.walkTo(3146, 3201, 2);
  await sweepHere(bot, sdk, 'Lumbridge Adventurer Camp', 6);

  // 3. Ice Mountain Dwarf Cannon Engineer (Nulodion 209 at 3011, 3453)
  console.log('\n=== 3. Ice Mountain Nulodion (3011, 3453) ===');
  await bot.walkTo(3012, 3453, 2);
  await bot.openDoor();
  await sweepHere(bot, sdk, 'Ice Mountain Nulodion', 4);

  // 4. Barbarian Village Gunthor the brave (199 at 3081, 3444)
  console.log('\n=== 4. Barbarian Village Gunthor (3081, 3444) ===');
  await bot.walkTo(3081, 3442, 2);
  await sweepHere(bot, sdk, 'Barbarian Village North', 4);

  // 5. Gertrude's House (Philop 782 & Kanel 784 at 3152, 3406)
  console.log('\n=== 5. Gertrude House Kids (3152, 3406) ===');
  await bot.walkTo(3152, 3406, 2);
  await bot.openDoor();
  await sweepHere(bot, sdk, 'Gertrude House', 4);

  // 6. Varrock General Store Assistant (523 at 3217, 3411)
  console.log('\n=== 6. Varrock General Store (3217, 3414) ===');
  await bot.walkTo(3217, 3414, 2);
  await sweepHere(bot, sdk, 'Varrock General Store', 4);

  // 7. Kalphite Lair Weird Old Man (1152 at 3227, 3106) & Bedabin Camp (832 Al Shabim, 833 Bedabin Nomad, 834 Bedabin Nomad Guard at 3169, 3036)
  console.log('\n=== 7. Shantay Pass -> Kalphite Old Man & Bedabin Camp ===');
  await bot.walkTo(3260, 3280, 3);
  await bot.walkTo(3260, 3328, 3);
  await bot.walkTo(3282, 3330, 3);
  await bot.walkTo(3304, 3124, 2);
  const shantayPass = sdk.findNearbyLoc(/shantay pass/i);
  if (shantayPass) {
    await bot.interactLoc(shantayPass, /go-through/i);
    await sdk.waitForTicks(4);
    if (sdk.getState()?.dialog?.isOpen) {
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }
  if ((sdk.getState()?.player?.worldZ ?? 3124) < 3118) {
    await bot.walkTo(3227, 3106, 3);
    await sweepHere(bot, sdk, 'Kalphite Lair Outside', 4);
    await bot.walkTo(3169, 3036, 3);
    await sweepHere(bot, sdk, 'Bedabin Camp', 6);
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
});

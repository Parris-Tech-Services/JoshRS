import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 12) {
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    console.log(`    [Dialog] "${d.text || ""}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    const noOpt = opts.find((o: any) => /^no\b/i.test(o.text));
    const pick = noOpt ?? opts[0];
    await sdk.sendClickDialog(pick?.index ?? 0);
    await sdk.waitForTicks(2);
  }
}

async function testAllNearbyTalkTo(bot: any, sdk: any, visited: Set<number>, maxCount = 8) {
  let count = 0;
  for (const n of sdk.getNearbyNpcs()) {
    if (visited.has(n.id)) continue;
    if (!n.reachable) continue;
    const hasTalk = n.optionsWithIndex.some((o: any) => /talk-to/i.test(o.text));
    const hasTrade = n.optionsWithIndex.some((o: any) => /trade/i.test(o.text));
    if (!hasTalk && !hasTrade) continue;
    visited.add(n.id);
    console.log(`\n=== Testing NPC id=${n.id} "${n.name}" at (${n.x}, ${n.z}, L${sdk.getState()?.player?.level}) ===`);
    if (hasTalk) {
      const beforeChat = sdk.getChat().length;
      const r = await bot.talkTo(n);
      await sdk.waitForTicks(3);
      const d = sdk.getDialog();
      const newChat = sdk.getChat().slice(beforeChat).map((c: any) => c.text);
      console.log(`  Talk-to: success=${r.success} (${r.message}) dialogOpen=${d?.isOpen} chat=${JSON.stringify(newChat)}`);
      if (d?.isOpen) await clearDialog(sdk, 8);
      if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
    }
    if (hasTrade) {
      const r2 = await bot.interactNpc(n, /trade/i);
      await sdk.waitForTicks(3);
      const iface = sdk.getState()?.interface;
      console.log(`  Trade: success=${r2.success} (${r2.message}) interfaceOpen=${iface?.isOpen} id=${iface?.id}`);
      if (iface?.isOpen) await bot.closeInterface();
      if (sdk.getDialog()?.isOpen) await clearDialog(sdk, 6);
    }
    count++;
    if (count >= maxCount) break;
  }
}

runScript(async ({ bot, sdk }) => {
  const visited = new Set<number>([1595, 380, 379, 568, 532, 533, 183, 1055, 437, 799, 735, 846, 588, 793, 788, 510, 500, 401, 402, 740, 1171, 1]);

  // 1. Step off Brimhaven ship gangplank if on L1
  if (sdk.getState()?.player?.level === 1) {
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, /cross/i);
      await sdk.waitForTicks(4);
    }
  }
  console.log(`Pos at Brimhaven pier: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // Talk to Customs officer (380) at (2772, 3227) to sail to Ardougne
  const customs = sdk.findNearbyNpc(/customs officer/i);
  if (customs) {
    console.log("Talking to Customs officer to sail to Ardougne...");
    await bot.talkTo(customs);
    for (let i = 0; i < 20; i++) {
      await sdk.waitForTicks(2);
      const d = sdk.getDialog();
      if (!d?.isOpen) {
        if ((sdk.getState()?.player?.worldX ?? 2772) < 2700) break;
        continue;
      }
      const opts = d.options || [];
      const match =
        opts.find((o: any) => /can i journey/i.test(o.text)) ||
        opts.find((o: any) => /search away/i.test(o.text)) ||
        opts.find((o: any) => /^ok/i.test(o.text)) ||
        opts[0];
      if (match) await sdk.sendClickDialog(match.index);
    }
  }
  await sdk.waitForTicks(4);
  if (sdk.getState()?.player?.level === 1) {
    const plank2 = sdk.findNearbyLoc(/gangplank/i);
    if (plank2) {
      await bot.interactLoc(plank2, /cross/i);
      await sdk.waitForTicks(4);
    }
  }
  console.log(`Pos after sailing to Ardougne: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  if ((sdk.getState()?.player?.worldX ?? 2772) > 2700) {
    console.log("Did not reach Ardougne, stopping.");
    return;
  }

  // 2. Sweep East Ardougne Market (2661, 3305), North Ardougne (2615, 3332), and Zoo (2612, 3275)
  await bot.walkTo(2661, 3305, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 10);
  await bot.walkTo(2654, 3285, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2615, 3292, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2575, 3320, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 3. Sweep Port Khazard (2662, 3160) & Yanille (2605, 3092)
  await bot.walkTo(2662, 3160, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2605, 3092, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
}, { botName: "jimmy-dev", disconnectAfter: true });

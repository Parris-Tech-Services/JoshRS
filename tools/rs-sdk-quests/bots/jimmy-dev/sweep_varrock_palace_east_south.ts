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
    console.log(`\n=== Testing NPC id=${n.id} "${n.name}" at (${n.x}, ${n.z}) ===`);
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
  const visited = new Set<number>([639, 882, 546, 547, 781, 783, 548, 522]);

  // 1. Varrock South (3208, 3392) - Sword shop, Lowe, Blue Moon Inn, Horvik
  await bot.walkTo(3208, 3392, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3229, 3435, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 2. Varrock Palace (3212, 3475) - Reldo, King Roald, Sir Prysin, Captain Rovin
  await bot.walkTo(3212, 3475, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 3. Varrock East (3253, 3401) - Aubury, Father Lawrence, Apothecary, Charlie the Tramp
  await bot.walkTo(3253, 3401, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3254, 3480, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 4. Digsite / Exam Centre (3362, 3340)
  await bot.walkTo(3310, 3400, 4);
  await bot.walkTo(3362, 3340, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
}, { botName: "jimmy-dev", disconnectAfter: true });

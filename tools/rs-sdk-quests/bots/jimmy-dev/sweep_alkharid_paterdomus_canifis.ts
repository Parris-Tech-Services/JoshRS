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
  const visited = new Set<number>([924, 541, 836]);

  // 1. Border Guard at (3267, 3227)
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 2. Walk around north of the toll gate (3275, 3315) down into Al Kharid (3293, 3180)
  console.log("\nWalking into Al Kharid via northern pass...");
  await bot.walkTo(3260, 3280, 4);
  await bot.walkTo(3280, 3315, 4);
  await bot.walkTo(3300, 3210, 4);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3315, 3175, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3293, 3165, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 3. Walk north to Paterdomus (3405, 3488) and Canifis (3494, 3482)
  console.log("\nWalking to Paterdomus & Canifis...");
  await bot.walkTo(3320, 3320, 4);
  await bot.walkTo(3370, 3450, 4);
  await bot.walkTo(3405, 3488, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(3494, 3482, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 10);
}, { botName: "jimmy-dev", disconnectAfter: true });

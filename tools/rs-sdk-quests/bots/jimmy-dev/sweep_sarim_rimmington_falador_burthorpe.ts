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
  const visited = new Set<number>([0, 1, 3, 4, 278, 376, 377, 378, 494, 495, 917, 918, 922, 970]);

  // 1. Port Sarim shops (3016, 3222) and (3014, 3246)
  console.log("Testing Port Sarim NPCs...");
  await bot.walkTo(3016, 3222, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(3014, 3246, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 2. Rimmington (2956, 3214)
  console.log("\nWalking to Rimmington (2956, 3214)...");
  await bot.walkTo(2956, 3214, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 3. Falador (2965, 3380) and (3013, 3356)
  console.log("\nWalking to Falador (2965, 3380)...");
  await bot.walkTo(2990, 3310, 4);
  await bot.walkTo(2965, 3380, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3013, 3356, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 4. Burthorpe (2906, 3537) - Tostig (1079) and Burthorpe NPCs
  console.log("\nWalking to Burthorpe (2906, 3537)...");
  await bot.walkTo(2945, 3440, 4);
  await bot.walkTo(2915, 3510, 4);
  await bot.walkTo(2906, 3537, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
}, { botName: "jimmy-dev", disconnectAfter: true });

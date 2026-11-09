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
  const visited = new Set<number>([586, 587]);

  // 1. Taverley south & Lady of the Lake (2910, 3418) & Stone Circle (2925, 3482)
  await bot.walkTo(2910, 3418, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2924, 3404, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2925, 3482, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 2. Monastery (3052, 3490) & Barbarian Village (3081, 3421)
  console.log("\nWalking to Monastery & Barbarian Village...");
  await bot.walkTo(3000, 3475, 4);
  await bot.walkTo(3052, 3490, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(3081, 3421, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);

  // 3. Edgeville (3088, 3492) & Varrock West/Square (3212, 3428)
  console.log("\nWalking to Edgeville & Varrock...");
  await bot.walkTo(3088, 3492, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3165, 3435, 4);
  await bot.walkTo(3212, 3428, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 10);
}, { botName: "jimmy-dev", disconnectAfter: true });

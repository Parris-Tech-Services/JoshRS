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
  const visited = new Set<number>([528, 529, 12]);

  // 1. Oziach (747) at (3068, 3516)
  await bot.walkTo(3068, 3516, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 2. Peksa (538) at (3074, 3430)
  await bot.walkTo(3074, 3430, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 3. Dwarven Mine via Falador East stairs (3059, 3376)
  console.log("\nWalking to Dwarven Mine via Falador East stairs (3059, 3376)...");
  await bot.walkTo(3059, 3376, 2);
  const stairsDown = sdk.findNearbyLoc(/staircase/i);
  if (stairsDown) {
    await bot.interactLoc(stairsDown, /climb-down/i);
    await sdk.waitForTicks(4);
    await bot.walkTo(3035, 9806, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(3013, 9816, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(2996, 9828, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(2984, 9812, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(2997, 9846, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

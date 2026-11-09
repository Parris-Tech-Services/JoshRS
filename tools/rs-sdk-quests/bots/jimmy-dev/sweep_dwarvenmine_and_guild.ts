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
  const visited = new Set<number>();

  for (const l of sdk.getNearbyLocs().filter((l: any) => /stair|ladder/i.test(l.name))) {
    console.log(`  Nearby stair/ladder: id=${l.id} "${l.name}" (${l.x},${l.z}) ops=${l.optionsWithIndex.map((o: any) => `${o.opIndex}:${o.text}`).join(",")}`);
  }
  await bot.walkTo(3061, 3377, 1);
  const stDown = sdk.getNearbyLocs().find((l: any) => /staircase/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-down/i.test(o.text)));
  if (stDown) {
    console.log(`Climbing down Staircase id=${stDown.id} at (${stDown.x},${stDown.z})...`);
    await bot.interactLoc(stDown, /climb-down/i);
    await sdk.waitForTicks(5);
  }
  console.log(`Pos after stairs: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
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

    // Climb back up at (3058, 9776)
    await bot.walkTo(3058, 9777, 2);
    const stUp = sdk.findNearbyLoc(/staircase/i);
    if (stUp) {
      await bot.interactLoc(stUp, /climb-up/i);
      await sdk.waitForTicks(5);
    }
  }

  // Crafting Guild (2933, 3285)
  console.log("\nWalking to Crafting Guild (2933, 3285)...");
  await bot.walkTo(2933, 3289, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
}, { botName: "jimmy-dev", disconnectAfter: true });

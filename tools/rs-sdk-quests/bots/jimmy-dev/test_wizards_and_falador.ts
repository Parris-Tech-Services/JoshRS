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

  // 1. Test Sedridor in basement
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // Climb ladder up to L0
  await bot.walkTo(3104, 9576, 1);
  const ladder = sdk.findNearbyLoc(/ladder/i);
  if (ladder) {
    await bot.interactLoc(ladder, /climb-up/i);
    await sdk.waitForTicks(4);
  }
  console.log(`Pos after ladder up: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // Open door from the ladder room to the staircase room (3107, 3162)
  await bot.walkTo(3104, 3160, 2);
  const st0 = sdk.findNearbyLoc(/staircase/i);
  if (st0) {
    await bot.interactLoc(st0, /climb-up/i);
    await sdk.waitForTicks(4);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
  }
  const st1 = sdk.getNearbyLocs().find((l: any) => /staircase/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-up/i.test(o.text)));
  if (st1) {
    await bot.interactLoc(st1, /climb-up/i);
    await sdk.waitForTicks(4);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
  }

  // Climb down to L0
  for (let i = 0; i < 2; i++) {
    const stDown = sdk.getNearbyLocs().find((l: any) => /staircase/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-down/i.test(o.text)));
    if (stDown) {
      await bot.interactLoc(stDown, /climb-down/i);
      await sdk.waitForTicks(4);
    }
  }

  // Walk out of Wizards' Tower to Draynor Manor (3110, 3328) and Falador Castle (2972, 3342)
  console.log("\nWalking to Draynor Manor & Falador Castle...");
  await bot.walkTo(3109, 3168, 2);
  await bot.walkTo(3110, 3260, 4);
  await bot.walkTo(3110, 3328, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(3005, 3380, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2972, 3342, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
}, { botName: "jimmy-dev", disconnectAfter: true });

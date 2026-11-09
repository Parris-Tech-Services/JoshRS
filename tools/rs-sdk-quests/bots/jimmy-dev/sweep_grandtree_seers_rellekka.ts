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
  await clearDialog(sdk, 12);
  const visited = new Set<number>([169, 67, 168, 670, 676]);

  // 1. Climb up ladder from Grand Tree tunnels (2462, 9897)
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    const ladder = sdk.findNearbyLoc(/ladder/i);
    if (ladder) {
      await bot.interactLoc(ladder, /climb-up/i);
      await sdk.waitForTicks(4);
    }
  }
  await clearDialog(sdk, 10);

  // 2. Climb Grand Tree ladder at (2466, 3495) to L1 and L2 to test Hudo, Rometti, Gulluck, Heckel Funch, Blurberry, Gianne
  await bot.walkTo(2466, 3495, 2);
  const treeLadder0 = sdk.findNearbyLoc(/ladder/i);
  if (treeLadder0) {
    await bot.interactLoc(treeLadder0, /climb-up/i);
    await sdk.waitForTicks(4);
    await bot.walkTo(2455, 3492, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 8);
    await bot.walkTo(2478, 3492, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 8);
    await bot.walkTo(2466, 3495, 2);
    const treeLadder1 = sdk.getNearbyLocs().find((l: any) => /ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-up/i.test(o.text)));
    if (treeLadder1) {
      await bot.interactLoc(treeLadder1, /climb-up/i);
      await sdk.waitForTicks(4);
      await bot.walkTo(2450, 3488, 3);
      await testAllNearbyTalkTo(bot, sdk, visited, 8);
      await bot.walkTo(2484, 3488, 3);
      await testAllNearbyTalkTo(bot, sdk, visited, 8);
      await bot.walkTo(2466, 3495, 2);
    }
    // Climb back down to L0
    for (let i = 0; i < 2; i++) {
      await bot.walkTo(2466, 3495, 2);
      const down = sdk.getNearbyLocs().find((l: any) => /ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-down/i.test(o.text)));
      if (down) {
        await bot.interactLoc(down, /climb-down/i);
        await sdk.waitForTicks(4);
      }
    }
  }

  // 3. Gnomeball field (2395, 3488) & Brimstail's cave (2403, 3419)
  await bot.walkTo(2466, 3492, 2);
  await bot.walkTo(2408, 3488, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2403, 3419, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
}, { botName: "jimmy-dev", disconnectAfter: true });

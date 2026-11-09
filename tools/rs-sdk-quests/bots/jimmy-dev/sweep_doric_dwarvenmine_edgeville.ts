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
  const visited = new Set<number>([296, 297, 298, 299, 895]);

  // 1. Doric (2951, 3451) & Ice Mountain Oracle (3013, 3501)
  await bot.walkTo(2951, 3451, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);
  await bot.walkTo(3013, 3501, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 2. Dwarven Mine entrance (3018, 3450) -> climb down ladder to test Nurmof, Drogo, Boot
  await bot.walkTo(3018, 3450, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);
  const ladderDown = sdk.findNearbyLoc(/ladder/i);
  if (ladderDown) {
    await bot.interactLoc(ladderDown, /climb-down/i);
    await sdk.waitForTicks(4);
    await bot.walkTo(3035, 9846, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(2996, 9828, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    await bot.walkTo(2984, 9812, 3);
    await testAllNearbyTalkTo(bot, sdk, visited, 6);
    // Climb back up at (3019, 9850)
    await bot.walkTo(3018, 9850, 2);
    const ladderUp = sdk.findNearbyLoc(/ladder/i);
    if (ladderUp) {
      await bot.interactLoc(ladderUp, /climb-up/i);
      await sdk.waitForTicks(4);
    }
  }

  // 3. Barbarian Village (3075, 3428) & Edgeville (3079, 3505)
  await bot.walkTo(3075, 3428, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3079, 3505, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
}, { botName: "jimmy-dev", disconnectAfter: true });

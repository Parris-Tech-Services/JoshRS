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
  await clearDialog(sdk, 8);
  const visited = new Set<number>([1595, 380, 379, 568, 532, 533, 183, 1055, 437, 799, 735, 846, 588, 793, 788, 510, 500, 401, 402, 1]);

  // 1. Walk north to Tai Bwo Wannai (2790, 3065) and Trufitus (2809, 3085)
  console.log("Walking to Tai Bwo Wannai (2790, 3065)...");
  await bot.walkTo(2830, 3010, 4);
  await bot.walkTo(2790, 3065, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2809, 3085, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 2. Walk to Brimhaven (Jiminua 560, Lubufu 1171, Charlie the cook 794, Captain Barnaby 381)
  console.log("\nWalking to Brimhaven...");
  await bot.walkTo(2766, 3149, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2769, 3171, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2789, 3190, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 3. Sail from Brimhaven (2772, 3227) to Ardougne via Captain Barnaby (381)
  await bot.walkTo(2772, 3227, 2);
  const barnaby = sdk.findNearbyNpc(/captain barnaby/i);
  if (barnaby) {
    console.log("Testing Captain Barnaby (381) and sailing to Ardougne...");
    await bot.talkTo(barnaby);
    for (let i = 0; i < 15; i++) {
      await sdk.waitForTicks(2);
      const d = sdk.getDialog();
      if (!d?.isOpen) {
        if ((sdk.getState()?.player?.worldX ?? 2772) < 2700) break;
        continue;
      }
      const opts = d.options || [];
      const yesOpt = opts.find((o: any) => /yes/i.test(o.text));
      await sdk.sendClickDialog((yesOpt ?? opts[0])?.index ?? 0);
    }
  }
  await sdk.waitForTicks(4);
  const plank = sdk.findNearbyLoc(/gangplank/i);
  if (plank) {
    await bot.interactLoc(plank, /cross/i);
    await sdk.waitForTicks(4);
  }
  console.log(`Pos after sailing to Ardougne: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
}, { botName: "jimmy-dev", disconnectAfter: true });

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
  const visited = new Set<number>([1595]);

  // 1. Open Thurgo's door at (3001, 3142) and test Thurgo (604)
  await bot.walkTo(3001, 3142, 2);
  const door = sdk.findNearbyLoc(/door/i);
  if (door && door.optionsWithIndex.some((o: any) => /open/i.test(o.text))) {
    await bot.interactLoc(door, /open/i);
    await sdk.waitForTicks(3);
  }
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 2. Walk to Port Sarim (3027, 3218), pickpocket Men for 60gp if needed, and sail to Karamja
  await bot.walkTo(3018, 3235, 3);
  while ((sdk.findInventoryItem(/coins/i)?.count ?? 0) < 60) {
    const man = sdk.findNearbyNpc(/^man$|^woman$/i);
    if (!man) break;
    await bot.pickpocketNpc(man);
    await sdk.waitForTicks(2);
  }
  await bot.walkTo(3027, 3218, 2);
  const seaman = sdk.findNearbyNpc(/captain tobias|seaman/i);
  if (seaman) {
    console.log("Sailing to Karamja...");
    await bot.talkTo(seaman);
    for (let i = 0; i < 15; i++) {
      await sdk.waitForTicks(2);
      const d = sdk.getDialog();
      if (!d?.isOpen) {
        if ((sdk.getState()?.player?.worldX ?? 3027) < 2970) break;
        continue;
      }
      const opts = d.options || [];
      const yesOpt = opts.find((o: any) => /yes/i.test(o.text));
      await sdk.sendClickDialog((yesOpt ?? opts[0])?.index ?? 0);
    }
  }
  await sdk.waitForTicks(5);
  console.log(`Pos on Karamja: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  // 3. Sweep Musa Point (Customs Officer 380, Luthas 379, Zambo 568)
  await bot.walkTo(2953, 3147, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2938, 3152, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2926, 3145, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 4. Sweep Brimhaven (Davon 588, Lubufu 1171, Alfonse 793, Charlie 794, Garv 688, Kangai Mau 846, Jiminua 560, Cap'n Izzy 437)
  await bot.walkTo(2802, 3165, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2788, 3180, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2768, 3186, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(2768, 3148, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
}, { botName: "jimmy-dev", disconnectAfter: true });

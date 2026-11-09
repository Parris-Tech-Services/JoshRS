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
  const visited = new Set<number>([376, 377, 378, 558, 556, 583, 559, 734, 375, 744, 530, 531, 585, 970, 917, 922, 0, 1, 2, 3, 4, 5, 6, 278]);

  // 1. Thurgo (604) at (3000, 3144)
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 2. Wydin (557) at (3014, 3204)
  await bot.walkTo(3014, 3204, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);

  // 3. Rimmington (Hetty 307, Chemist 367, Hops/Chancy/Da Vinci)
  await bot.walkTo(2966, 3205, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(2933, 3210, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 4. Draynor Village (Ned 918, Fortunato 369, Olivia 1238, Morgan 755)
  await bot.walkTo(3083, 3251, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 8);
  await bot.walkTo(3098, 3257, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);

  // 5. Lumbridge Swamp (Father Urhney 458) & Lumbridge (Bob 519, Father Aereck 456, Duke Horacio 741)
  await bot.walkTo(3147, 3175, 3);
  await testAllNearbyTalkTo(bot, sdk, visited, 4);
  await bot.walkTo(3230, 3203, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
  await bot.walkTo(3243, 3206, 2);
  await testAllNearbyTalkTo(bot, sdk, visited, 6);
}, { botName: "jimmy-dev", disconnectAfter: true });

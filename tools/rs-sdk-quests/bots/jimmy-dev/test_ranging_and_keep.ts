import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 15) {
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    const text = d.text || "";
    console.log(`    [Dialog] "${text}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    if (opts.length > 0) {
      await sdk.sendClickDialog(opts[0].index);
    } else {
      await sdk.sendClickDialog(0);
    }
    await sdk.waitForTicks(2);
  }
}

async function testNpc(bot: any, sdk: any, npcId: number) {
  const npc = sdk.getNearbyNpcs().find((n: any) => n.id === npcId);
  if (!npc) {
    console.log(`  NPC id=${npcId} not nearby`);
    return;
  }
  console.log(`\n=== Testing NPC id=${npc.id} "${npc.name}" at (${npc.x}, ${npc.z}) ===`);
  const beforeChat = sdk.getChat().length;
  const r = await bot.talkTo(npc);
  await sdk.waitForTicks(3);
  const d = sdk.getDialog();
  const newChat = sdk.getChat().slice(beforeChat).map((c: any) => c.text);
  console.log(`  talkTo=${r.success} (${r.message}) dialogOpen=${d?.isOpen} text="${d?.text || ""}" chat=${JSON.stringify(newChat)}`);
  if (d?.isOpen) {
    await clearDialog(sdk, 8);
  }
  if (sdk.getState()?.interface?.isOpen) {
    console.log(`  Interface opened: id=${sdk.getState()?.interface?.id}`);
    await bot.closeInterface();
  }
}

runScript(async ({ bot, sdk }) => {
  for (const id of [679, 227, 225, 226, 230]) {
    await testNpc(bot, sdk, id);
  }

  // Walk to Keep Le Faye (2768, 3402) to check Renegades & Upstairs (Sir Mordred / Morgan Le Faye)
  console.log("\nWalking to Keep Le Faye (2768, 3402)...");
  await bot.walkTo(2710, 3440, 4);
  await bot.walkTo(2768, 3401, 3);
  console.log(`Pos at Keep Le Faye: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Nearby NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

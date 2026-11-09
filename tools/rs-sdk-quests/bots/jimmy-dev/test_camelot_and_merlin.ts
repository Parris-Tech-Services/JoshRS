import { runScript } from "../../sdk/runner";

async function clearDialogWithChoices(sdk: any, choices: RegExp[] = [], maxSteps = 20) {
  let choiceIdx = 0;
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    console.log(`    [Dialog] "${d.text || ""}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    if (opts.length > 1) {
      let picked = opts[0];
      if (choiceIdx < choices.length) {
        const match = opts.find((o: any) => choices[choiceIdx].test(o.text));
        if (match) picked = match;
        choiceIdx++;
      }
      console.log(`      -> clicking ${picked.index}: "${picked.text}"`);
      await sdk.sendClickDialog(picked.index);
    } else if (opts.length === 1) {
      await sdk.sendClickDialog(opts[0].index);
    } else {
      await sdk.sendClickDialog(0);
    }
    await sdk.waitForTicks(2);
  }
}

async function testNpc(bot: any, sdk: any, npcId: number, choices: RegExp[] = []) {
  const npc = sdk.getNearbyNpcs().find((n: any) => n.id === npcId);
  if (!npc) {
    console.log(`  NPC id=${npcId} not nearby`);
    return;
  }
  console.log(`\n=== Testing NPC id=${npc.id} "${npc.name}" at (${npc.x}, ${npc.z}) ===`);
  const r = await bot.talkTo(npc);
  await sdk.waitForTicks(3);
  const d = sdk.getDialog();
  console.log(`  talkTo=${r.success} (${r.message}) dialogOpen=${d?.isOpen}`);
  if (d?.isOpen) {
    await clearDialogWithChoices(sdk, choices, 18);
  }
}

runScript(async ({ bot, sdk }) => {
  await bot.walkTo(2758, 3510, 3);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Camelot L0 NPC: id=${n.id} "${n.name}" (${n.x},${n.z})`);
  }

  // 1. King Arthur (251) - start Merlin's Crystal
  await testNpc(bot, sdk, 251, [/knight of the round table/i]);

  // 2. Sir Gawain (240) - ask about Morgan Le Faye's stronghold
  await testNpc(bot, sdk, 240, [/how did merlin get trapped/i]);
  await testNpc(bot, sdk, 240, [/any ideas on how to get into morgan/i]);

  // 3. Other Knights on L0
  for (const id of [241, 246, 242, 243, 244, 245]) {
    await testNpc(bot, sdk, id);
  }

  // 4. Climb up to L1 to talk to Sir Lancelot (239)
  console.log("\nClimbing to L1 in Camelot Castle...");
  await bot.walkTo(2760, 3512, 3);
  const stairs = sdk.findNearbyLoc(/staircase|ladder/i);
  if (stairs) {
    console.log(`Climbing ${stairs.name} at (${stairs.x}, ${stairs.z})...`);
    await bot.interactLoc(stairs, /climb/i);
    await sdk.waitForTicks(4);
  }
  console.log(`Pos on L1: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Camelot L1 NPC: id=${n.id} "${n.name}" (${n.x},${n.z})`);
  }
  await testNpc(bot, sdk, 239, [/any ideas on how to get into morgan/i]);
}, { botName: "jimmy-dev", disconnectAfter: true });

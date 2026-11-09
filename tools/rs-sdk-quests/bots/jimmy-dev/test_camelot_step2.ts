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
  // Test L1 knights: Sir Tristram (243), Sir Bedivere (242), Sir Pelleas (244)
  for (const id of [243, 242, 244]) {
    await testNpc(bot, sdk, id);
  }

  // Climb down to L0
  await bot.walkTo(2750, 3512, 2);
  const stairsDown = sdk.findNearbyLoc(/staircase/i);
  if (stairsDown) {
    await bot.interactLoc(stairsDown, /climb-down/i);
    await sdk.waitForTicks(4);
  }

  // Test Sir Palomedes (246) and Sir Gawain (240) option 3 ("Do you know how Merlin got trapped?")
  await bot.walkTo(2758, 3508, 3);
  await testNpc(bot, sdk, 246);
  await testNpc(bot, sdk, 240, [/do you know how merlin got trapped/i]);

  // Climb back up to L1 and talk to Sir Lancelot (239) about Morgan Le Faye's stronghold
  await bot.walkTo(2750, 3511, 2);
  const stairsUp = sdk.findNearbyLoc(/staircase/i);
  if (stairsUp) {
    await bot.interactLoc(stairsUp, /climb-up/i);
    await sdk.waitForTicks(4);
  }
  await bot.walkTo(2760, 3513, 3);
  await testNpc(bot, sdk, 239, [/any ideas on how to get into morgan/i]);

  // Climb down to L0 and walk to Catherby / Arhein's ship crate (2801, 3442)
  await bot.walkTo(2750, 3512, 2);
  const stairsDown2 = sdk.findNearbyLoc(/staircase/i);
  if (stairsDown2) {
    await bot.interactLoc(stairsDown2, /climb-down/i);
    await sdk.waitForTicks(4);
  }
  await bot.walkTo(2801, 3442, 3);
  console.log(`Pos at Catherby docks: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Catherby NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

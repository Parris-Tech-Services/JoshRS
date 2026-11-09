import { runScript } from "../../sdk/runner";

async function clearDialogWithChoices(sdk: any, choices: RegExp[] = [], maxSteps = 35) {
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

runScript(async ({ bot, sdk }) => {
  await clearDialogWithChoices(sdk, [/yes/i], 35);
  console.log(`After crate dialog: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // Climb ladders up to L2 in Keep Le Faye
  for (let step = 0; step < 2; step++) {
    const ladder = sdk.findNearbyLoc(/ladder|staircase/i);
    if (ladder) {
      console.log(`Climbing up ${ladder.name} at (${ladder.x}, ${ladder.z})...`);
      await bot.interactLoc(ladder, /climb-up|climb/i);
      await sdk.waitForTicks(4);
    }
  }

  console.log(`Pos on L2: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Keep L2 NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }

  // Test Talk-to on Sir Mordred (247)
  const mordred = sdk.findNearbyNpc(/sir mordred/i);
  if (mordred) {
    console.log("Testing Talk-to on Sir Mordred (247)...");
    await bot.talkTo(mordred);
    await sdk.waitForTicks(3);
    await clearDialogWithChoices(sdk, [], 10);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

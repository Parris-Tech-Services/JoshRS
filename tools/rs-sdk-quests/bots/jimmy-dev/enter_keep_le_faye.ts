import { runScript } from "../../sdk/runner";

async function clearDialogWithChoices(sdk: any, choices: RegExp[] = [], maxSteps = 25) {
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
  // 1. Test Candle maker (562)
  const candleMaker = sdk.findNearbyNpc(/candle maker/i);
  if (candleMaker) {
    console.log("Testing Candle maker (562)...");
    await bot.talkTo(candleMaker);
    await sdk.waitForTicks(3);
    await clearDialogWithChoices(sdk, [/no thank you/i]);
    if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
  }

  // 2. Test Arhein (563) - ask to hide in crate or just hide in crate (2801, 3442)
  const arhein = sdk.findNearbyNpc(/arhein/i);
  if (arhein) {
    console.log("Testing Arhein (563)...");
    await bot.talkTo(arhein);
    await sdk.waitForTicks(3);
    await clearDialogWithChoices(sdk, [/where do you deliver/i, /do you deliver to the fort/i]);
    if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
  }

  // 3. Hide in Crate (id=63, loc at 2801, 3442)
  await bot.walkTo(2801, 3442, 1);
  const crate = sdk.getNearbyLocs().find((l: any) => /crate/i.test(l.name) && l.optionsWithIndex.some((o: any) => /hide/i.test(o.text)));
  if (crate) {
    console.log(`Hiding in crate id=${crate.id} at (${crate.x}, ${crate.z})...`);
    await bot.interactLoc(crate, /hide/i);
    for (let i = 0; i < 30; i++) {
      await sdk.waitForTicks(2);
      await clearDialogWithChoices(sdk, [/yes/i], 5);
      const p = sdk.getState()?.player;
      if (p && p.worldX < 2780) {
        console.log(`Arrived inside Keep Le Faye at (${p.worldX}, ${p.worldZ}, L${p.level})!`);
        break;
      }
    }
  }

  // Climb ladders up to L2 in Keep Le Faye
  for (let step = 0; step < 2; step++) {
    const ladder = sdk.findNearbyLoc(/ladder|staircase/i);
    if (ladder) {
      console.log(`Climbing up ${ladder.name} at (${ladder.x}, ${ladder.z})...`);
      await bot.interactLoc(ladder, /climb-up|climb/i);
      await sdk.waitForTicks(4);
    }
  }

  console.log(`Pos in Keep Le Faye: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Keep NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

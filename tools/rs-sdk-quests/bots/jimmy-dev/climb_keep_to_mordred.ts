import { runScript } from "../../sdk/runner";

async function clearDialogWithChoices(sdk: any, choices: RegExp[] = [], maxSteps = 15) {
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
  for (const l of sdk.getNearbyLocs().slice(0, 12)) {
    console.log(`  L0 Loc: id=${l.id} "${l.name}" (${l.x},${l.z}) ops=${l.optionsWithIndex.map((o: any) => `${o.opIndex}:${o.text}`).join(",")}`);
  }
  const st0 = sdk.findNearbyLoc(/staircase/i);
  if (st0) {
    console.log(`Clicking opIndex=1 on Staircase id=${st0.id} at (${st0.x},${st0.z})...`);
    await sdk.sendInteractLoc(st0.x, st0.z, st0.id, 1);
    await sdk.waitForTicks(5);
  }
  console.log(`Pos after 1st staircase: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const l of sdk.getNearbyLocs().filter((l: any) => /stair|ladder|door/i.test(l.name))) {
    console.log(`  L1 Loc: id=${l.id} "${l.name}" (${l.x},${l.z}) ops=${l.optionsWithIndex.map((o: any) => `${o.opIndex}:${o.text}`).join(",")}`);
  }
  const st1 = sdk.getNearbyLocs().find((l: any) => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-up/i.test(o.text)));
  if (st1) {
    const upOp = st1.optionsWithIndex.find((o: any) => /climb-up/i.test(o.text));
    console.log(`Clicking opIndex=${upOp?.opIndex} on ${st1.name} id=${st1.id} at (${st1.x},${st1.z})...`);
    await sdk.sendInteractLoc(st1.x, st1.z, st1.id, upOp?.opIndex ?? 1);
    await sdk.waitForTicks(5);
  }
  console.log(`Pos on L2: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  L2 NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }

  const mordred = sdk.findNearbyNpc(/sir mordred/i);
  if (mordred) {
    console.log("Testing Talk-to on Sir Mordred (247)...");
    await bot.talkTo(mordred);
    await sdk.waitForTicks(3);
    await clearDialogWithChoices(sdk, [], 10);
    // Climb back down immediately so Mordred doesn't kill us while level 3!
    const down = sdk.getNearbyLocs().find((l: any) => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /climb-down|climb/i.test(o.text)));
    if (down) {
      const downOp = down.optionsWithIndex.find((o: any) => /climb-down|climb/i.test(o.text));
      await sdk.sendInteractLoc(down.x, down.z, down.id, downOp?.opIndex ?? 1);
      await sdk.waitForTicks(4);
    }
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

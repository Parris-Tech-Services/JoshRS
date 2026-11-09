import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 10) {
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    console.log(`    [Dialog] "${d.text || ""}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    await sdk.sendClickDialog(opts[0]?.index ?? 0);
    await sdk.waitForTicks(2);
  }
}

runScript(async ({ bot, sdk }) => {
  const st1 = sdk.getNearbyLocs().find((l: any) => l.id === 1722);
  if (st1) {
    console.log(`Climbing Staircase id=1722 at (${st1.x}, ${st1.z})...`);
    await bot.interactLoc(st1, /climb-up/i);
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
    await clearDialog(sdk, 8);
    // Climb down immediately after testing Talk-to
    const stDown = sdk.getNearbyLocs().find((l: any) => l.id === 1723);
    if (stDown) {
      await bot.interactLoc(stDown, /climb-down/i);
      await sdk.waitForTicks(3);
    }
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

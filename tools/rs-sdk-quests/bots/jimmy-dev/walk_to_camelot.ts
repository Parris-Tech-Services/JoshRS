import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 15) {
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
  await clearDialog(sdk);
  // Walk north to Camelot Castle (2757, 3477) and inside to test Knights of the Round Table
  console.log("Walking to Camelot Castle (2757, 3477)...");
  await bot.walkTo(2757, 3480, 3);
  await bot.walkTo(2757, 3500, 3);
  console.log(`Pos at Camelot: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level}) HP=${sdk.getState()?.player?.hp}`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Nearby NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

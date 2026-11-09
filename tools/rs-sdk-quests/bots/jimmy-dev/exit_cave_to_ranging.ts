import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 20) {
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    const text = d.text || "";
    console.log(`  [Dialog] "${text}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    if (opts.length > 0) {
      await sdk.sendClickDialog(opts[0].index);
    } else {
      await sdk.sendClickDialog(0);
    }
    await sdk.waitForTicks(2);
  }
}

runScript(async ({ bot, sdk }) => {
  const s0 = sdk.getState();
  console.log(`Start pos: (${s0?.player?.worldX}, ${s0?.player?.worldZ}, L${s0?.player?.level})`);

  // 1. Walk to raft at (2607, 9692) and board it
  if ((s0?.player?.worldZ ?? 0) > 9000) {
    await bot.walkTo(2607, 9692, 2);
    const raft = sdk.findNearbyLoc(/raft/i);
    if (raft) {
      console.log(`Boarding raft at (${raft.x}, ${raft.z})...`);
      await bot.interactLoc(raft, /board/i);
      await sdk.waitForTicks(6);
      await clearDialog(sdk);
    }
    // Now at (2568, 9679), climb stairs at (2569, 9682)
    await bot.walkTo(2570, 9682, 2);
    const stairs = sdk.findNearbyLoc(/stairs/i);
    if (stairs) {
      console.log(`Climbing up stairs at (${stairs.x}, ${stairs.z})...`);
      await bot.interactLoc(stairs, /climb/i);
      await sdk.waitForTicks(5);
    }
  }

  console.log(`Surface pos: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // 2. Walk to West Ardougne entrance or Ardougne NPCs, then up to Ranging Guild (2658, 3439) and Keep Le Faye (2768, 3402)
  console.log("Walking to Ranging Guild (2658, 3439)...");
  await bot.walkTo(2610, 3300, 4);
  await bot.walkTo(2635, 3365, 4);
  await bot.walkTo(2656, 3440, 3);
  console.log(`Arrived at Ranging Guild: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  const npcs = sdk.getNearbyNpcs();
  for (const n of npcs) {
    console.log(`  Nearby NPC: id=${n.id} name="${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

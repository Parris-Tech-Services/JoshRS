import { runScript } from "../../sdk/runner";

runScript(async ({ bot, sdk }) => {
  // Climb down from L1 to L0
  const stDown = sdk.getNearbyLocs().find((l: any) => l.id === 1723);
  if (stDown) {
    await bot.interactLoc(stDown, /climb-down/i);
    await sdk.waitForTicks(4);
  }
  // Open the front door of Keep Le Faye from inside (2764, 3402)
  await bot.walkTo(2764, 3402, 1);
  const door = sdk.getNearbyLocs().find((l: any) => /large door/i.test(l.name));
  if (door) {
    console.log(`Opening Keep Le Faye front door id=${door.id} at (${door.x}, ${door.z})...`);
    await bot.interactLoc(door, /open/i);
    await sdk.waitForTicks(4);
  }
  // Walk north-west to Seers' Village (2725, 3485)
  console.log("Walking to Seers' Village (2725, 3485)...");
  await bot.walkTo(2740, 3440, 4);
  await bot.walkTo(2725, 3485, 3);
  console.log(`Pos at Seers' Village: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}) HP=${sdk.getState()?.player?.hp}`);
  for (const n of sdk.getNearbyNpcs()) {
    console.log(`  Seers NPC: id=${n.id} "${n.name}" (${n.x},${n.z}) ops=${n.optionsWithIndex.map((o: any) => o.text).join(",")}`);
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

import { runScript } from "../../sdk/runner";

async function clearDialog(sdk: any, maxSteps = 12) {
  for (let i = 0; i < maxSteps; i++) {
    const d = sdk.getDialog();
    if (!d?.isOpen) break;
    const opts = d.options || [];
    console.log(`    [Dialog] "${d.text || ""}" opts=${opts.map((o: any) => `${o.index}:${o.text}`).join(" | ")}`);
    const noOpt = opts.find((o: any) => /^no\b/i.test(o.text));
    const pick = noOpt ?? opts[0];
    await sdk.sendClickDialog(pick?.index ?? 0);
    await sdk.waitForTicks(2);
  }
}

runScript(async ({ bot, sdk }) => {
  await bot.walkTo(3061, 3377, 1);
  const stDown = sdk.getNearbyLocs().find((l: any) => l.id === 1733);
  if (stDown) {
    await bot.interactLoc(stDown, /climb-down/i);
    await sdk.waitForTicks(5);
  }
  console.log(`Pos in Dwarven Mine: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  // 1. Drogo (579) at (3035, 9746)
  await bot.walkTo(3035, 9746, 3);
  const drogo = sdk.findNearbyNpc(/drogo/i);
  if (drogo) {
    console.log(`Testing Drogo (579) at (${drogo.x}, ${drogo.z})...`);
    await bot.talkTo(drogo);
    await sdk.waitForTicks(3);
    await clearDialog(sdk, 8);
    const r2 = await bot.interactNpc(drogo, /trade/i);
    await sdk.waitForTicks(3);
    console.log(`Drogo Trade:`, r2.success, `interfaceOpen=`, sdk.getState()?.interface?.isOpen);
    if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
  }

  // 2. Boot (665) at (2984, 9812)
  await bot.walkTo(2984, 9812, 3);
  const boot = sdk.findNearbyNpc(/boot/i);
  if (boot) {
    console.log(`Testing Boot (665) at (${boot.x}, ${boot.z})...`);
    await bot.talkTo(boot);
    await sdk.waitForTicks(3);
    await clearDialog(sdk, 8);
  }

  // 3. Nurmof (594) at (2996, 9846) - test Trade after closing dialog completely
  await bot.walkTo(2996, 9846, 2);
  const nurmof = sdk.findNearbyNpc(/nurmof/i);
  if (nurmof) {
    console.log(`Testing Nurmof (594) Trade at (${nurmof.x}, ${nurmof.z})...`);
    const rTrade = await bot.interactNpc(nurmof, /trade/i);
    await sdk.waitForTicks(3);
    console.log(`Nurmof Trade:`, rTrade.success, rTrade.message, `interfaceOpen=`, sdk.getState()?.interface?.isOpen);
    if (sdk.getState()?.interface?.isOpen) await bot.closeInterface();
  }
}, { botName: "jimmy-dev", disconnectAfter: true });

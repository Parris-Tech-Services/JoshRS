import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  await bot.closeInterface();
  const distentor = sdk.findNearbyNpc(/wizard distentor/i);
  if (distentor) {
    const r = await bot.talkTo(distentor);
    await sdk.waitForTicks(2);
    console.log('Talk-to Wizard Distentor:', r.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await bot.closeInterface();
  }

  // Walk from Yanille (2597, 3089) to Carnillean Mansion (2569, 3275)
  for (const [wx, wz] of [[2595, 3140], [2605, 3210], [2585, 3255], [2569, 3275]]) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 3);
  }
  console.log('Arrived at Carnillean Mansion:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 120_000,
});

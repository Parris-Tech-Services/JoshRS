import { runScript } from '../../sdk/runner';

await runScript(async (ctx) => {
  const { bot, sdk } = ctx;
  console.log('Starting walk from Lumbridge toward Falador / Burthorpe / Catherby...');
  const waypoints: [number, number][] = [
    [3180, 3240],
    [3110, 3250],
    [3070, 3275],
    [3007, 3325],
    [2965, 3380],
    [2945, 3440],
    [2918, 3550],
  ];
  for (const [wx, wz] of waypoints) {
    const st = sdk.getState();
    console.log(`Pos (${st?.player?.worldX}, ${st?.player?.worldZ}) -> walking to (${wx}, ${wz})`);
    await bot.walkTo(wx, wz);
  }
  const st = sdk.getState();
  console.log(`Arrived at Burthorpe: (${st?.player?.worldX}, ${st?.player?.worldZ})`);
  // Test death_man_indoors1 (1086) at (2918, 3558)
  await bot.walkTo(2918, 3558, 3);
  const npc = sdk.findNearbyNpc(n => n.id === 1086 || /man/i.test(n.name));
  console.log('Nearby NPC at (2918, 3558):', npc ? `${npc.name} (id=${npc.id}, options=${npc.optionsWithIndex.map(o => o.text).join(',')})` : 'none');
  if (npc) {
    const r = await bot.talkTo(npc);
    console.log('Talk-to result:', r);
    await sdk.waitForTicks(3);
    console.log('Dialog:', sdk.getDialog());
    await bot.closeInterface();
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 180_000,
});

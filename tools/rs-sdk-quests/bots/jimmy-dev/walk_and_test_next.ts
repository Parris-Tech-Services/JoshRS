import { runScript } from '../../sdk/runner';

await runScript(async (ctx) => {
  const { bot, sdk } = ctx;
  const unferth = sdk.findNearbyNpc(/^Unferth$/i);
  console.log('Unferth:', unferth ? `${unferth.name} (id=${unferth.id}, ops=${unferth.optionsWithIndex.map(o => o.text).join(',')})` : 'not found');
  if (unferth) {
    const r = await bot.talkTo(unferth);
    console.log('Talk-to Unferth:', r);
    await sdk.waitForTicks(3);
    console.log('Unferth dialog:', sdk.getDialog());
    await bot.closeInterface();
  }

  // Also test Ocga, Breoca, Hild, Wistan right here in Burthorpe!
  for (const name of ['Ocga', 'Breoca', 'Hild', 'Wistan']) {
    const npc = sdk.findNearbyNpc(new RegExp(`^${name}$`, 'i'));
    if (npc) {
      const r = await bot.talkTo(npc);
      await sdk.waitForTicks(2);
      console.log(`Talk-to ${name} (id=${npc.id}):`, r.message, '| dialog:', sdk.getDialog()?.text);
      await bot.closeInterface();
    }
  }

  // Now walk across White Wolf Mountain to Witchaven (2719, 3304)
  const waypoints: [number, number][] = [
    [2895, 3430],
    [2845, 3432],
    [2815, 3440],
    [2755, 3425],
    [2719, 3304],
  ];
  for (const [wx, wz] of waypoints) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 4);
  }
  console.log(`Arrived at Witchaven shore: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 180_000,
});

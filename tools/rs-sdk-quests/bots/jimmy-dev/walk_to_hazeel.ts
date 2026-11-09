import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  await bot.dismissBlockingUI();
  for (const name of ['Joe', 'Kelvin', 'Khazard barman']) {
    const npc = sdk.findNearbyNpc(new RegExp(`^${name}$`, 'i'));
    if (npc && npc.reachable) {
      const r = await bot.talkTo(npc);
      await sdk.waitForTicks(2);
      console.log(`Talk-to ${npc.name} (id=${npc.id}):`, r.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
      await bot.dismissBlockingUI();
      await bot.closeInterface();
    }
  }

  for (const [wx, wz] of [[2615, 3145], [2620, 3210], [2585, 3255], [2569, 3275]]) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 3);
  }
  console.log('Arrived at Carnillean Mansion:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  console.log('Carnillean NPCs:', sdk.getNearbyNpcs().map(n => `${n.name}(id=${n.id}, reachable=${n.reachable}) @ (${n.x},${n.z}) ops=${n.options.join('/')}`));
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 120_000,
});

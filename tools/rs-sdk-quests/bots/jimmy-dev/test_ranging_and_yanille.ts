import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  // 1. Walk from Arandar (2387, 3335) to Ranging Guild entrance (2655, 3439)
  for (const [wx, wz] of [[2450, 3340], [2530, 3350], [2600, 3380], [2655, 3439]]) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 4);
  }
  console.log('Near Ranging Guild:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  console.log('Ranging Guild NPCs visible:', sdk.getNearbyNpcs().map(n => `${n.name}(id=${n.id}) @ (${n.x},${n.z}) ops=${n.options.join('/')}`));

  // 2. Walk south through Ardougne to Yanille (2595, 3087)
  for (const [wx, wz] of [[2655, 3365], [2655, 3285], [2615, 3200], [2595, 3105], [2591, 3087]]) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 4);
  }
  console.log('Near Yanille Magic Guild:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  console.log('Yanille NPCs visible:', sdk.getNearbyNpcs().map(n => `${n.name}(id=${n.id}, L=${n.level}) @ (${n.x},${n.z}) ops=${n.options.join('/')}`));
  for (const npc of sdk.getNearbyNpcs().filter(n => n.reachable && n.options.some(o => /talk-to/i.test(o))).slice(0, 4)) {
    const r = await bot.talkTo(npc);
    await sdk.waitForTicks(2);
    console.log(`Talk-to ${npc.name} (id=${npc.id}):`, r.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await bot.closeInterface();
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 180_000,
});

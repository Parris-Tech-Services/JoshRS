import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  // 1. Walk from East Ardougne docks (2683, 3271) to Witchaven (2718, 3304)
  await bot.walkTo(2718, 3304, 3);
  console.log('At Witchaven:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  const caroline = sdk.findNearbyNpc(/caroline/i);
  const holgart = sdk.findNearbyNpc(/holgart/i);
  console.log('Witchaven NPCs:', sdk.getNearbyNpcs().map(n => `${n.name}(id=${n.id}, ops=${n.options.join('/')})`));

  if (caroline) {
    const cr = await bot.talkTo(caroline);
    console.log('Talk-to Caroline:', cr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    for (let i = 0; i < 12; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      if (d.options && d.options.length > 1) {
        await sdk.clickDialogByText(/yes|suppose|sure|help|platform/i);
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(2);
    }
    await bot.closeInterface();
  }

  if (holgart) {
    const hr = await bot.talkTo(holgart);
    console.log('Talk-to Holgart:', hr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    for (let i = 0; i < 15; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      console.log('Holgart page:', d.allComponents?.map(c => c.text).filter(Boolean));
      if (d.options && d.options.length > 1) {
        await sdk.clickDialogByText(/platform|take me|yes|row/i);
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(2);
    }
    await bot.closeInterface();
  }
  console.log('After Holgart pos:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

  // 2. Walk to West Ardougne border (2534, 3273) to test Mourner (719, mournertwb)
  for (const [wx, wz] of [[2660, 3305], [2600, 3295], [2558, 3273]]) {
    await bot.walkTo(wx, wz, 4);
  }
  console.log('Near West Ardougne border:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  const mourner719 = sdk.getNearbyNpcs().find(n => n.id === 719 || /mourner/i.test(n.name));
  console.log('Nearby Mourners:', sdk.getNearbyNpcs().filter(n => /mourner/i.test(n.name)).map(n => `${n.name}(id=${n.id}, reachable=${n.reachable}) @ (${n.x},${n.z}) ops=${n.options.join('/')}`));
  if (mourner719) {
    const mr = await bot.talkTo(mourner719);
    console.log('Talk-to Mourner 719:', mr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean), '| recent msgs:', sdk.getState()?.gameMessages.slice(-4));
    await bot.closeInterface();
  }

  // 3. Walk to Arandar overpass (2382, 3334) to test Elf (1201, elf_overpass_guard)
  for (const [wx, wz] of [[2545, 3330], [2475, 3335], [2420, 3335], [2386, 3334]]) {
    await bot.walkTo(wx, wz, 4);
  }
  console.log('Near Arandar overpass:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  const elves = sdk.getNearbyNpcs().filter(n => n.id === 1201 || /elf/i.test(n.name));
  console.log('Nearby Elves at Arandar:', elves.map(n => `${n.name}(id=${n.id}, reachable=${n.reachable}) @ (${n.x},${n.z}) ops=${n.options.join('/')}`));
  if (elves.length > 0) {
    const er = await bot.talkTo(elves[0]);
    console.log('Talk-to Elf (1201):', er.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean), '| recent msgs:', sdk.getState()?.gameMessages.slice(-5));
    await bot.closeInterface();
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 180_000,
});

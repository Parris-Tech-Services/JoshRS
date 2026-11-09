import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  for (const [wx, wz] of [[2623, 3210], [2585, 3255], [2569, 3275]]) {
    console.log(`Walking to (${wx}, ${wz}) from (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})...`);
    await bot.walkTo(wx, wz, 3);
  }
  console.log('At Carnillean Mansion:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  const ceril = sdk.findNearbyNpc(/ceril/i);
  if (ceril) {
    await bot.talkTo(ceril);
    for (let i = 0; i < 20; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      if (d.options && d.options.length > 1) {
        await sdk.clickDialogByText(/what's wrong|yes, of course/i);
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(2);
    }
    await bot.dismissBlockingUI();
  }

  // Also test Philipe, Butler Jones, Claus, Henryeta while here!
  for (const name of ['Philipe Carnillean', 'Butler Jones', 'Claus the chef', 'Henryeta']) {
    const npc = sdk.findNearbyNpc(new RegExp(name, 'i'));
    if (npc) {
      const r = await bot.talkTo(npc);
      await sdk.waitForTicks(2);
      console.log(`Talk-to ${npc.name} (id=${npc.id}):`, r.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
      await bot.dismissBlockingUI();
    }
  }

  // Walk to Cave entrance (2586, 3235) and talk to Clivet
  await bot.walkTo(2586, 3236, 3);
  const cave = sdk.findNearbyLoc(/cave entrance/i);
  console.log('Cave entrance:', cave);
  if (cave) {
    await bot.interactLoc(cave, 'Enter');
    await sdk.waitForTicks(4);
  }
  console.log('Inside cave:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  const clivet = sdk.findNearbyNpc(/clivet/i);
  if (clivet) {
    await bot.talkTo(clivet);
    for (let i = 0; i < 30; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      if (d.options && d.options.length > 1) {
        await sdk.clickDialogByText(/what do you mean|what would i have to do|ok, count me in/i);
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(2);
    }
    await bot.dismissBlockingUI();
  }
  console.log('Inventory after Clivet:', sdk.getInventory().map(i => i.name));
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 120_000,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  const gate = sdk.findNearbyLoc(/huge gate/i);
  if (gate) {
    const r = await bot.interactLoc(gate, 'Enter');
    console.log('Enter Huge Gate result:', r.message);
    await sdk.waitForTicks(3);
    for (let i = 0; i < 6; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      console.log('Gate Dialog Page:', d.allComponents?.map(c => c.text).filter(Boolean));
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 30_000,
});

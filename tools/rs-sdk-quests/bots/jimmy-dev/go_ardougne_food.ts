import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to Gnome Stronghold gate
    await bot.walkTo(2461, 3385, 2);
    const gate = sdk.findNearbyLoc(/gate/i);
    if (gate) {
        console.log(`Opening gate ${gate.name} at (${gate.x}, ${gate.z}) ops=${gate.options.map(o => o.text)}`);
        await bot.interactLoc(gate, gate.options[0]?.text || 'Open');
        await sdk.waitForTicks(8);
        if (sdk.getDialog()?.isOpen) {
            for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
    }
    console.log(`After gate: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to East Ardougne Baker's stall (2667, 3310)
    await bot.walkTo(2667, 3310, 3);
    console.log(`At Ardougne market: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Steal 10 cakes/bread
    for (let i = 0; i < 12; i++) {
        const stall = sdk.findNearbyLoc(/baker's stall/i);
        if (stall) {
            await bot.interactLoc(stall, 'Steal-from');
            await sdk.waitForTicks(5);
        } else {
            await sdk.waitForTicks(3);
        }
        const inv = sdk.getInventory();
        const foodCount = inv.filter(it => /cake|bread|chocolate/i.test(it.name)).length;
        if (foodCount >= 10) break;
    }
    console.log(`Inventory food count: ${sdk.getInventory().map(i => i.name).join(', ')}`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

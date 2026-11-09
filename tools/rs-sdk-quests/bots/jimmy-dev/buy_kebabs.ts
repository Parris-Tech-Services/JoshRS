import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Pickpocket Man in Lumbridge until >= 25 coins
    for (let i = 0; i < 15; i++) {
        const coins = sdk.findInventoryItem(/coins/i)?.count ?? 0;
        if (coins >= 25) break;
        const man = sdk.findNearbyNpc(/^(man|woman)$/i);
        if (man) {
            await bot.pickpocketNpc(man);
            await sdk.waitForTicks(2);
        } else {
            await bot.walkTo(3222, 3218, 3);
        }
    }
    console.log(`Coins: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // Walk to Al Kharid gate (3267, 3227) and pay 10gp toll (or open gate), then walk to Karim (3273, 3180)
    await bot.walkTo(3267, 3227, 2);
    const gate = sdk.findNearbyLoc(/gate/i);
    if (gate) {
        await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
        await sdk.waitForTicks(4);
        while (sdk.getDialog()?.isOpen) {
            const dlg = sdk.getDialog()!;
            const yesOpt = dlg.options?.find(o => /yes/i.test(o.text));
            if (yesOpt) {
                await sdk.sendClickDialog(yesOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
    }
    await bot.walkTo(3273, 3180, 2);
    console.log(`At Karim: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Buy 12 kebabs from Karim
    for (let i = 0; i < 12; i++) {
        const karim = sdk.findNearbyNpc(/karim/i);
        if (!karim) break;
        await bot.talkTo(karim);
        for (let step = 0; step < 6 && sdk.getDialog()?.isOpen; step++) {
            const dlg = sdk.getDialog()!;
            const buyOpt = dlg.options?.find(o => /yes please/i.test(o.text));
            if (buyOpt) {
                await sdk.sendClickDialog(buyOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
    }
    console.log('Inventory after Karim:', sdk.getInventory().map(i => `${i.name}x${i.count}`).join(', '));
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

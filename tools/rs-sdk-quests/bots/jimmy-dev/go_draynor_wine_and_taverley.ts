import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk out of Paterdomus courtyard to Varrock East -> Varrock Square -> Draynor Village (3085, 3251)
    const waypoints = [
        [3405, 3504],
        [3360, 3480],
        [3300, 3430],
        [3255, 3420],
        [3212, 3424],
        [3160, 3360],
        [3110, 3295],
        [3085, 3251]
    ];
    for (const [wx, wz] of waypoints) {
        await bot.walkTo(wx, wz, 5);
    }
    console.log(`At Draynor market: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Pickpocket Man/Woman/Farmer until we have >= 20 coins
    for (let i = 0; i < 15; i++) {
        const coins = sdk.findInventoryItem(/coins/i)?.count ?? 0;
        if (coins >= 20) break;
        const man = sdk.findNearbyNpc(/^(man|woman)$/i);
        if (man) {
            await bot.pickpocketNpc(man);
            await sdk.waitForTicks(3);
        } else {
            await bot.walkTo(3095, 3260, 4);
        }
    }
    console.log(`Coins: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // Walk back to Fortunato (3085, 3251) and buy 15 Jug of wine
    await bot.walkTo(3085, 3251, 3);
    const fortunato = sdk.findNearbyNpc(/fortunato/i);
    if (fortunato) {
        await bot.openShop(fortunato);
        await sdk.waitForTicks(3);
        await bot.buyFromShop(/jug of wine/i, 10);
        await sdk.waitForTicks(2);
        await bot.buyFromShop(/jug of wine/i, 5);
        await sdk.waitForTicks(2);
        await bot.closeShop();
    }
    console.log('Inventory after Fortunato:', sdk.getInventory().map(i => `${i.name}x${i.count}`).join(', '));

    // Now walk to Taverley Dungeon ladder (2884, 3397)
    const tavWaypoints = [
        [3007, 3325],
        [2935, 3365],
        [2884, 3397]
    ];
    for (const [wx, wz] of tavWaypoints) {
        await bot.walkTo(wx, wz, 4);
    }
    console.log(`At Taverley Dungeon ladder: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

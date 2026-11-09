import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.dismissBlockingUI();
    for (const food of ['Bread', 'Shrimps']) {
        const item = sdk.findInventoryItem(new RegExp(`^${food}$`, 'i'));
        if (item && (sdk.getSkill('Hitpoints')?.current ?? 10) < 10) {
            await bot.eatFood(item);
        }
    }
    // Buy a waterskin from Bedabin Nomad if we have coins
    const nomad = sdk.findNearbyNpc(/^Bedabin Nomad$/i);
    if (nomad) {
        const shopRes = await bot.openShop(nomad);
        if (shopRes.success) {
            await bot.buyFromShop(/waterskin\(4\)/i, 1);
            await bot.closeShop();
        }
    }
    console.log('Walking to Shantay Pass (3304, 3115)...');
    const waypoints = [
        [3200, 3055],
        [3240, 3075],
        [3280, 3095],
        [3304, 3115],
    ];
    for (const [wx, wz] of waypoints) {
        const r = await bot.walkTo(wx, wz, 3);
        console.log(`walkTo(${wx},${wz}):`, r.message, `HP: ${sdk.getSkill('Hitpoints')?.current}`);
    }
    const pass = sdk.findNearbyLoc(/shantay pass/i);
    if (pass) {
        console.log('Going through Shantay pass...');
        await bot.interactLoc(pass, 'Go-through');
        await sdk.waitForTicks(5);
    }
    const p = sdk.getState()?.player;
    console.log(`Now at (${p?.worldX}, ${p?.worldZ})`);
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 90_000,
});

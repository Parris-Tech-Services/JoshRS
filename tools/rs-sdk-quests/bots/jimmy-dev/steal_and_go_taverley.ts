import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    // Stand at (2669, 3310) next to Baker's stall (2667, 3310)
    await bot.walkTo(2669, 3310, 1);
    for (let i = 0; i < 16; i++) {
        const stall = sdk.getNearbyLocs().find(l => /baker's stall/i.test(l.name));
        if (stall) {
            await sdk.sendInteractLoc(stall.x, stall.z, stall.id, 2);
            await sdk.waitForTicks(4);
        } else {
            await sdk.waitForTicks(3);
        }
        const foodCount = sdk.getInventory().filter(it => /cake|bread|chocolate/i.test(it.name)).length;
        if (foodCount >= 10) break;
    }
    console.log('Inventory after stall:', sdk.getInventory().map(i => i.name).join(', '));

    // Walk to Taverley Dungeon ladder (2884, 3397) via waypoints, eating if HP < 7
    const waypoints = [
        [2710, 3350],
        [2755, 3425],
        [2815, 3440],
        [2845, 3432],
        [2884, 3397]
    ];
    for (const [wx, wz] of waypoints) {
        const hp = sdk.getSkill('Hitpoints');
        if (hp && hp.current < 8) {
            const food = sdk.findInventoryItem(/cake|slice|bread|chocolate/i);
            if (food) await bot.eatFood(food);
        }
        await bot.walkTo(wx, wz, 4);
        const hpAfter = sdk.getSkill('Hitpoints');
        if (hpAfter && hpAfter.current < 8) {
            const food = sdk.findInventoryItem(/cake|slice|bread|chocolate/i);
            if (food) await bot.eatFood(food);
        }
    }
    console.log(`Reached Taverley Dungeon surface: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

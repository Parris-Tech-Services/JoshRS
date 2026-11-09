import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk from Lumbridge to Taverley Dungeon ladder (2884, 3397)
    const surfaceWaypoints = [
        [3110, 3250],
        [3007, 3325],
        [2935, 3365],
        [2884, 3397]
    ];
    for (const [wx, wz] of surfaceWaypoints) {
        await bot.walkTo(wx, wz, 4);
    }
    console.log(`At Taverley Dungeon ladder: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    const ladder = sdk.findNearbyLoc(/ladder/i);
    if (!ladder) {
        console.log('No ladder found!');
        return;
    }
    await bot.interactLoc(ladder, 'Climb-down');
    await sdk.waitForTicks(6);
    console.log(`Inside Taverley Dungeon: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to Jailer (2933, 9693) and Lord Daquarius (2892, 9680)
    await bot.walkTo(2931, 9693, 4);
    console.log(`At Jailer area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    const jailer = sdk.getNearbyNpcs().find(n => /jailer/i.test(n.name));
    if (jailer) {
        console.log(`Found Jailer: id=${jailer.id} name=${jailer.name} at (${jailer.x}, ${jailer.z}) ops=${jailer.options.map(o => o.text)}`);
        const res = await bot.talkTo(jailer);
        console.log(`Talk-to Jailer result:`, JSON.stringify(res), `dialog:`, JSON.stringify(sdk.getDialog()));
        await sdk.waitForTicks(3);
        console.log(`Recent messages:`, sdk.getState().recentMessages);
    } else {
        console.log('Jailer not found nearby. Nearby NPCs:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})`));
    }

    // Walk to Lord Daquarius (2892, 9680)
    await bot.walkTo(2892, 9680, 4);
    console.log(`At Lord Daquarius area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    const daquarius = sdk.getNearbyNpcs().find(n => /daquarius/i.test(n.name));
    if (daquarius) {
        console.log(`Found Lord Daquarius: id=${daquarius.id} name=${daquarius.name} at (${daquarius.x}, ${daquarius.z}) ops=${daquarius.options.map(o => o.text)}`);
        const res = await bot.talkTo(daquarius);
        console.log(`Talk-to Lord Daquarius result:`, JSON.stringify(res), `dialog:`, JSON.stringify(sdk.getDialog()));
        await sdk.waitForTicks(3);
        console.log(`Recent messages:`, sdk.getState().recentMessages);
    } else {
        console.log('Lord Daquarius not found nearby. Nearby NPCs:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})`));
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

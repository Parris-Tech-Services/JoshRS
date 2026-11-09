import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const getHp = () => (sdk.getSkill('Hitpoints') || sdk.getSkill('HP'))?.level ?? 10;

    // 1. Walk to Draynor/Falador cabbage patch (3053, 3287)
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);
    await bot.walkTo(3110, 3260, 5);
    await bot.walkTo(3053, 3287, 3);
    console.log(`At cabbage patch: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Pick 22 cabbages
    for (let i = 0; i < 28; i++) {
        if (sdk.getInventory().length >= 25) break;
        const cab = sdk.getNearbyLocs().find(l => /^cabbage$/i.test(l.name) && l.x >= 3045 && l.x <= 3067 && l.z >= 3283 && l.z <= 3297);
        if (cab) {
            await sdk.sendInteractLoc(cab.x, cab.z, cab.id, 1);
            await sdk.waitForTicks(3);
        } else {
            await sdk.waitForTicks(2);
        }
    }
    console.log(`Picked cabbages, inv count=${sdk.getInventory().length}`);

    // Start background eat loop that checks HP every 2 ticks
    let stopEating = false;
    const eatLoop = (async () => {
        while (!stopEating) {
            if (getHp() <= 8) {
                const food = sdk.findInventoryItem(/cabbage|cake|slice|bread/i);
                if (food) {
                    console.log(`[EatLoop] Eating ${food.name} at HP ${getHp()}`);
                    await sdk.sendUseItem(food.slot);
                }
            }
            await sdk.waitForTicks(2);
        }
    })();

    try {
        // 2. Walk to Taverley Dungeon ladder (2884, 3396)
        for (const [wx, wz] of [[3007, 3325], [2935, 3365], [2884, 3396]]) {
            await bot.walkTo(wx, wz, 4);
        }
        const ladder = sdk.findNearbyLoc(/ladder/i);
        if (ladder) {
            await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
            await sdk.waitForTicks(5);
        }
        console.log(`Inside Taverley Dungeon: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);

        // 3. Pass Suit of Armour door at (2889, 9830)
        await bot.walkTo(2887, 9830, 1);
        for (let attempt = 0; attempt < 5; attempt++) {
            const door = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 2889) <= 2 && Math.abs(l.z - 9830) <= 2);
            if (door) {
                await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
                await sdk.waitForTicks(3);
            }
            if ((sdk.getState().player?.worldX ?? 0) >= 2889) break;
        }
        console.log(`Past Suit of Armour door: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);

        // 4. Walk to Jailer (2931, 9693) via the western corridor avoiding Lesser Demons at (2933, 9809):
        // Note: From (2889, 9830), walk via (2894, 9815) -> (2912, 9800) -> (2914, 9772) -> (2924, 9740) -> (2924, 9712) -> (2931, 9693)
        const steps = [
            [2894, 9815],
            [2912, 9800],
            [2914, 9772],
            [2924, 9740],
            [2924, 9712],
            [2931, 9693]
        ];
        for (const [wx, wz] of steps) {
            await bot.walkTo(wx, wz, 3);
            console.log(`Reached (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()} food=${sdk.getInventory().filter(i => /cabbage/i.test(i.name)).length}`);
        }

        console.log('Nearby NPCs at Jailer area:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));
        const jailer = sdk.getNearbyNpcs().find(n => n.id === 201 || /jailer/i.test(n.name));
        if (jailer) {
            console.log(`Testing Talk-to on Jailer (${jailer.id}) at (${jailer.x}, ${jailer.z})...`);
            await sdk.sendInteractNpc(jailer.index, 1);
            await sdk.waitForTicks(6);
            console.log('Jailer dialog:', JSON.stringify(sdk.getDialog()));
            console.log('Jailer recent messages:', sdk.getState().recentMessages);
            while (sdk.getDialog()?.isOpen) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }

        // 5. Walk to Lord Daquarius (2892, 9680)
        for (const [wx, wz] of [[2915, 9685], [2892, 9680]]) {
            await bot.walkTo(wx, wz, 3);
        }
        console.log(`At Lord Daquarius area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);
        console.log('Nearby NPCs at Daquarius area:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));

        const daquarius = sdk.getNearbyNpcs().find(n => n.id === 200 || /daquarius/i.test(n.name));
        if (daquarius) {
            console.log(`Testing Talk-to on Lord Daquarius (${daquarius.id}) at (${daquarius.x}, ${daquarius.z})...`);
            await sdk.sendInteractNpc(daquarius.index, 1);
            await sdk.waitForTicks(6);
            console.log('Lord Daquarius dialog:', JSON.stringify(sdk.getDialog()));
            console.log('Lord Daquarius recent messages:', sdk.getState().recentMessages);
            while (sdk.getDialog()?.isOpen) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
    } finally {
        stopEating = true;
        await eatLoop;
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

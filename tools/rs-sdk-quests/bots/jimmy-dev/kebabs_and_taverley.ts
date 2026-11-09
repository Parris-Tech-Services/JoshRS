import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const getHp = () => (sdk.getSkill('Hitpoints') || sdk.getSkill('HP'))?.level ?? 10;

    // 1. Pickpocket Man/Woman in Lumbridge until >= 22 coins
    for (let i = 0; i < 18; i++) {
        if ((sdk.findInventoryItem(/coins/i)?.count ?? 0) >= 22) break;
        const man = sdk.findNearbyNpc(/^(man|woman)$/i);
        if (man) {
            await bot.pickpocketNpc(man);
            await sdk.waitForTicks(2);
        } else {
            await bot.walkTo(3222, 3218, 3);
        }
    }
    console.log(`Coins: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // 2. Walk north around Al Kharid fence (3260, 3325) -> (3282, 3320) -> (3273, 3180) to buy 22 Kebabs
    for (const [wx, wz] of [[3255, 3280], [3260, 3325], [3282, 3320], [3280, 3250], [3273, 3180]]) {
        await bot.walkTo(wx, wz, 4);
    }
    for (let i = 0; i < 24; i++) {
        if ((sdk.findInventoryItem(/coins/i)?.count ?? 0) < 1) break;
        if (sdk.getInventory().length >= 26) break;
        const seller = sdk.findNearbyNpc(/kebab seller/i);
        if (!seller) break;
        await bot.talkTo(seller);
        for (let step = 0; step < 6 && sdk.getDialog()?.isOpen; step++) {
            const dlg = sdk.getDialog()!;
            const yesOpt = dlg.options?.find(o => /yes please/i.test(o.text));
            if (yesOpt) {
                await sdk.sendClickDialog(yesOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
    }
    console.log(`Kebabs bought: ${sdk.getInventory().filter(i => /kebab/i.test(i.name)).length}`);

    // Start background eat loop every 3 ticks (waits 3 ticks after eating so heal registers)
    let stopEating = false;
    const eatLoop = (async () => {
        while (!stopEating) {
            if (getHp() <= 8) {
                const food = sdk.findInventoryItem(/kebab|cabbage|cake|slice|bread/i);
                if (food) {
                    console.log(`[EatLoop] Eating ${food.name} at HP ${getHp()}`);
                    await sdk.sendUseItem(food.slot);
                    await sdk.waitForTicks(3);
                    continue;
                }
            }
            await sdk.waitForTicks(2);
        }
    })();

    try {
        // 3. Walk north out of Al Kharid via (3282, 3320) -> (3260, 3325) -> Draynor -> Taverley Dungeon (2884, 3396)
        const surfaceSteps = [
            [3282, 3270],
            [3282, 3320],
            [3260, 3325],
            [3180, 3290],
            [3110, 3260],
            [3007, 3325],
            [2935, 3365],
            [2884, 3396]
        ];
        for (const [wx, wz] of surfaceSteps) {
            await bot.walkTo(wx, wz, 4);
        }
        const ladder = sdk.findNearbyLoc(/ladder/i);
        if (ladder) {
            await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
            await sdk.waitForTicks(5);
        }
        console.log(`Inside Taverley Dungeon: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);

        // 4. Pass Suit of Armour door at (2889, 9830)
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

        // 5. Walk via X=2925 (outside Blue Dragon door at 2924,9803, and west of Lesser Demons at 2933,9809!)
        const dungeonSteps = [
            [2896, 9821],
            [2917, 9827],
            [2925, 9802],
            [2924, 9768],
            [2921, 9744],
            [2924, 9712],
            [2931, 9693]
        ];
        for (const [wx, wz] of dungeonSteps) {
            await bot.walkTo(wx, wz, 2);
            console.log(`Reached (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()} kebabs=${sdk.getInventory().filter(i => /kebab/i.test(i.name)).length}`);
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

        // 6. Walk to Lord Daquarius (2892, 9680)
        for (const [wx, wz] of [[2915, 9685], [2902, 9682], [2892, 9680]]) {
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

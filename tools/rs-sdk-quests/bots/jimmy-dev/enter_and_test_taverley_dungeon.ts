import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const checkEat = async () => {
        const hp = sdk.getSkill('Hitpoints');
        if (hp && hp.current < 8) {
            const food = sdk.findInventoryItem(/cake|slice/i);
            if (food) await bot.eatFood(food);
        }
    };

    // Climb down ladder at (2884, 3397)
    if ((sdk.getState().player?.worldZ ?? 0) < 9000) {
        await bot.walkTo(2884, 3396, 2);
        const ladder = sdk.findNearbyLoc(/ladder/i);
        if (ladder) {
            await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
            await sdk.waitForTicks(5);
        }
    }
    console.log(`Inside dungeon: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to Suit of Armour door at (2887, 9830)
    await bot.walkTo(2887, 9830, 1);
    console.log(`At Suit of Armour door: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    const doors = sdk.getNearbyLocs().filter(l => /door/i.test(l.name) && Math.abs(l.x - 2887) <= 3 && Math.abs(l.z - 9831) <= 3);
    console.log('Doors at 2887,9831:', doors.map(d => `${d.name}(${d.id})@(${d.x},${d.z})`));

    // Click door twice: first spawns Suit of Armour, second opens the door
    for (let attempt = 0; attempt < 4; attempt++) {
        await checkEat();
        const door = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 2887) <= 2 && Math.abs(l.z - 9831) <= 2);
        if (door) {
            await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
            await sdk.waitForTicks(3);
        }
        if ((sdk.getState().player?.worldX ?? 0) >= 2888 && (sdk.getState().player?.worldZ ?? 0) >= 9831) break;
    }
    console.log(`After Suit of Armour door: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk around north of the prison cells: (2895, 9846) -> (2914, 9840) -> (2914, 9800) -> (2914, 9740) -> (2924, 9710) -> (2931, 9693)
    const dungeonWaypoints = [
        [2895, 9846],
        [2914, 9840],
        [2914, 9800],
        [2914, 9750],
        [2924, 9710],
        [2931, 9693]
    ];
    for (const [wx, wz] of dungeonWaypoints) {
        await checkEat();
        await bot.walkTo(wx, wz, 4);
        await checkEat();
    }
    console.log(`At Jailer area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
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

    // Now walk to Lord Daquarius (2892, 9680)
    await checkEat();
    await bot.walkTo(2892, 9680, 4);
    await checkEat();
    console.log(`At Lord Daquarius area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
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
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

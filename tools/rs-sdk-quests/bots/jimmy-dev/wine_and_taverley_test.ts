import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const getHp = () => (sdk.getSkill('Hitpoints') || sdk.getSkill('HP'))?.level ?? 10;
    const checkEat = async () => {
        const hp = getHp();
        if (hp <= 8) {
            const wine = sdk.findInventoryItem(/jug of wine/i);
            if (wine) {
                console.log(`Drinking wine at HP ${hp}`);
                await sdk.sendUseItem(wine.slot);
                await sdk.waitForTicks(2);
                return;
            }
            const food = sdk.findInventoryItem(/cake|slice|bread|cheese|banana|kebab/i);
            if (food) {
                console.log(`Eating ${food.name} at HP ${hp}`);
                await bot.eatFood(food);
            }
        }
    };

    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);

    // 1. Pickpocket Man/Woman in Lumbridge until >= 21 coins
    for (let i = 0; i < 15; i++) {
        await checkEat();
        const coins = sdk.findInventoryItem(/coins/i)?.count ?? 0;
        if (coins >= 21) break;
        const man = sdk.findNearbyNpc(/^(man|woman)$/i);
        if (man) {
            await bot.pickpocketNpc(man);
            await sdk.waitForTicks(2);
        } else {
            await bot.walkTo(3222, 3218, 3);
        }
    }
    console.log(`Coins: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // 2. Walk to Fortunato in Draynor (3085, 3251)
    await bot.walkTo(3150, 3235, 5);
    await bot.walkTo(3085, 3251, 3);
    const fortunato = sdk.findNearbyNpc(/fortunato/i);
    if (fortunato) {
        console.log(`Fortunato at (${fortunato.x}, ${fortunato.z}) ops=${fortunato.options.map(o => `${o.index}:${o.text}`)}`);
        const tradeOpt = fortunato.options.find(o => /trade/i.test(o.text));
        if (tradeOpt) {
            await sdk.sendInteractNpc(fortunato.index, tradeOpt.index);
            await sdk.waitForTicks(4);
        } else {
            await bot.talkTo(fortunato);
            await sdk.waitForTicks(3);
            if (sdk.getDialog()?.isOpen) {
                await sdk.clickDialogByText(/yes|sell|buy/i);
                await sdk.waitForTicks(3);
            }
        }
        await bot.buyFromShop(/jug of wine/i, 10);
        await sdk.waitForTicks(2);
        await bot.buyFromShop(/jug of wine/i, 5);
        await sdk.waitForTicks(2);
        await bot.closeInterface();
    }
    console.log('Inventory after Fortunato:', sdk.getInventory().map(i => `${i.name}x${i.count}`).join(', '));

    // 3. Walk to Taverley Dungeon ladder (2884, 3397)
    for (const [wx, wz] of [[3007, 3325], [2935, 3365], [2884, 3396]]) {
        await bot.walkTo(wx, wz, 4);
    }
    const ladder = sdk.findNearbyLoc(/ladder/i);
    if (ladder) {
        await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
        await sdk.waitForTicks(5);
    }
    console.log(`Inside Taverley Dungeon: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // 4. Open Suit of Armour door at (2889, 9830)
    await bot.walkTo(2887, 9830, 1);
    for (let attempt = 0; attempt < 4; attempt++) {
        await checkEat();
        const door = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 2889) <= 2 && Math.abs(l.z - 9830) <= 2);
        if (door) {
            await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
            await sdk.waitForTicks(3);
        }
        if ((sdk.getState().player?.worldX ?? 0) >= 2889) break;
    }
    console.log(`Past Suit of Armour door: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);

    // 5. Walk south-east from (2889, 9830) -> (2931, 9693), healing with checkEat()
    const shortSteps = [
        [2894, 9818],
        [2908, 9802],
        [2914, 9782],
        [2925, 9765],
        [2934, 9752],
        [2924, 9732],
        [2924, 9712],
        [2931, 9693]
    ];
    for (const [wx, wz] of shortSteps) {
        await checkEat();
        await bot.walkTo(wx, wz, 3);
        await checkEat();
    }
    console.log(`At Jailer area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${getHp()}`);
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
    for (const [wx, wz] of [[2915, 9685], [2892, 9680]]) {
        await checkEat();
        await bot.walkTo(wx, wz, 3);
        await checkEat();
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
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Pos: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) HP=${(sdk.getSkill('Hitpoints') || sdk.getSkill('HP'))?.level}`);

    // Test Jailer right here at (2933, 9694)
    const jailer = sdk.getNearbyNpcs().find(n => n.id === 201 || /jailer/i.test(n.name));
    if (jailer) {
        await sdk.sendInteractNpc(jailer.index, 1);
        await sdk.waitForTicks(4);
        console.log('Jailer Talk-to tested.');
    }

    // Walk to Lord Daquarius (2892, 9680)
    await bot.walkTo(2915, 9685, 3);
    await bot.walkTo(2892, 9681, 2);
    const daquarius = sdk.getNearbyNpcs().find(n => n.id === 200 || /daquarius/i.test(n.name));
    if (daquarius) {
        console.log(`Talking to Lord Daquarius at (${daquarius.x}, ${daquarius.z})...`);
        await sdk.sendInteractNpc(daquarius.index, 1);
        await sdk.waitForTicks(5);
        for (let page = 0; page < 5; page++) {
            const dlg = sdk.getDialog();
            if (!dlg?.isOpen) break;
            console.log(`Page ${page}:`, dlg.allComponents.filter(c => c.text).map(c => c.text).join(' | '));
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(3);
        }
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

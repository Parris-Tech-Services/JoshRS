import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk from Lumbridge to Paterdomus trapdoor (3405, 3506)
    const waypoints = [
        [3255, 3280],
        [3285, 3365],
        [3320, 3445],
        [3370, 3480],
        [3405, 3506]
    ];
    for (const [wx, wz] of waypoints) {
        await bot.walkTo(wx, wz, 4);
    }
    console.log(`At Paterdomus trapdoor area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Find trapdoor at (3405, 3507)
    for (let i = 0; i < 3; i++) {
        const trapdoor = sdk.getNearbyLocs().find(l => /trapdoor/i.test(l.name) && Math.abs(l.x - 3405) <= 3 && Math.abs(l.z - 3507) <= 3);
        if (trapdoor) {
            console.log(`Trapdoor: ${trapdoor.name} (${trapdoor.id}) at (${trapdoor.x}, ${trapdoor.z}) ops=${trapdoor.options.map(o => o.text)}`);
            const climbOpt = trapdoor.options.find(o => /climb-down/i.test(o.text));
            const openOpt = trapdoor.options.find(o => /open/i.test(o.text));
            if (climbOpt) {
                await bot.interactLoc(trapdoor, climbOpt.text);
                await sdk.waitForTicks(5);
                break;
            } else if (openOpt) {
                await bot.interactLoc(trapdoor, openOpt.text);
                await sdk.waitForTicks(4);
            }
        }
    }
    console.log(`After trapdoor: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    if ((sdk.getState().player?.worldZ ?? 0) > 9000) {
        await bot.walkTo(3439, 9887, 2);
        console.log(`At barrier area: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
        const barrier = sdk.getNearbyLocs().find(l => /barrier/i.test(l.name));
        if (barrier) {
            console.log(`Found barrier: ${barrier.name} (${barrier.id}) ops=${barrier.options.map(o => o.text)}`);
            await bot.interactLoc(barrier, barrier.options[0]?.text || 'Pass-through');
            await sdk.waitForTicks(6);
            if (sdk.getDialog()?.isOpen) {
                console.log(`Barrier dialog:`, JSON.stringify(sdk.getDialog()));
                for (let j = 0; j < 6 && sdk.getDialog()?.isOpen; j++) {
                    await sdk.sendClickDialog(0);
                    await sdk.waitForTicks(2);
                }
            }
        }
        console.log(`After barrier: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
        console.log(`Recent messages:`, sdk.getState().recentMessages);
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

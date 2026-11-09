import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to Gate at (3405, 9895)
    await bot.walkTo(3405, 9895, 2);
    const gate1 = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.z <= 9896);
    if (gate1) {
        await sdk.sendInteractLoc(gate1.x, gate1.z, gate1.id, 1);
        await sdk.waitForTicks(5);
        if (sdk.getDialog()?.isOpen) {
            console.log('Gate1 dialog:', JSON.stringify(sdk.getDialog()));
            for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
    }
    console.log(`After gate1: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Walk to Gate2 / Barrier at (3431, 9897) -> (3440, 9887)
    await bot.walkTo(3431, 9897, 2);
    const gate2 = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.x >= 3428);
    if (gate2) {
        await sdk.sendInteractLoc(gate2.x, gate2.z, gate2.id, 1);
        await sdk.waitForTicks(5);
        if (sdk.getDialog()?.isOpen) {
            console.log('Gate2 dialog:', JSON.stringify(sdk.getDialog()));
            for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
    }
    await bot.walkTo(3439, 9887, 2);
    console.log(`At barrier: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    const barrier = sdk.getNearbyLocs().find(l => /barrier/i.test(l.name));
    if (barrier) {
        console.log(`Barrier: ${barrier.name}(${barrier.id}) at (${barrier.x},${barrier.z})`);
        await sdk.sendInteractLoc(barrier.x, barrier.z, barrier.id, 1);
        await sdk.waitForTicks(6);
        if (sdk.getDialog()?.isOpen) {
            console.log('Barrier dialog:', JSON.stringify(sdk.getDialog()));
            for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
    }
    console.log(`After barrier: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

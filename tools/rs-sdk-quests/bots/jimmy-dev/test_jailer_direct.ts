import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Pos: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    for (const [wx, wz] of [[2905, 9682], [2920, 9685], [2930, 9694]]) {
        await bot.walkTo(wx, wz, 2);
    }
    const door = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 2931) <= 1 && Math.abs(l.z - 9694) <= 1);
    if (door) {
        console.log(`Opening door at (${door.x},${door.z}) id=${door.id}`);
        await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
        await sdk.waitForTicks(4);
    }
    const jailer = sdk.getNearbyNpcs().find(n => n.id === 201 || /jailer/i.test(n.name));
    if (jailer) {
        console.log(`Jailer at (${jailer.x},${jailer.z}) reachable=${jailer.reachable}`);
        await sdk.sendInteractNpc(jailer.index, 1);
        await sdk.waitForTicks(5);
        console.log('Dialog:', JSON.stringify(sdk.getDialog()));
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

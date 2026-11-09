import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.walkTo(2384, 3488, 1);
    const gate = sdk.findNearbyLoc(/gate/i);
    if (gate) {
        console.log('Opening Gnomeball pitch gate:', gate.name, gate.x, gate.z);
        await bot.interactLoc(gate, 'Open');
        await sdk.waitForTicks(4);
    }
    for (const [wx, wz] of [[2382, 3495], [2395, 3496]]) {
        await sdk.sendWalk(wx, wz, true);
        await sdk.waitForTicks(6);
    }
    const npcs = sdk.getNearbyNpcs();
    const cheer = npcs.find(n => n.id === 636 || /cheerleader/i.test(n.name));
    if (cheer) {
        console.log(`Found ${cheer.name} (id=${cheer.id}) at (${cheer.x}, ${cheer.z}) reachable=${cheer.reachable}`);
        const res = await bot.talkTo(cheer);
        console.log('talkTo(Cheerleader 636):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 35_000,
});

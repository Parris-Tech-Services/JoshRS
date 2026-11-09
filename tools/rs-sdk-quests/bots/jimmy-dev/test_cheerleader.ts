import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    // Walk out of gnomeball pitch gate (2410, 3488) and around to (2396, 3496)
    for (const [wx, wz] of [[2411, 3488], [2405, 3498], [2396, 3496]]) {
        await bot.walkTo(wx, wz, 2);
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
    timeout: 25_000,
});

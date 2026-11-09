import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    // Walk from (2636, 3358) to Council workman (id=1287) at (2655, 3592)
    const toWorkman = [
        [2646, 3400],
        [2665, 3440],
        [2685, 3490],
        [2660, 3545],
        [2658, 3590],
    ];
    for (const [wx, wz] of toWorkman) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const npcsWorkman = sdk.getNearbyNpcs();
    console.log('NPCs at (2658, 3590):', npcsWorkman.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const workman = npcsWorkman.find(n => n.id === 1287 || /council workman/i.test(n.name));
    if (workman) {
        console.log(`Found ${workman.name} (id=${workman.id}) at (${workman.x}, ${workman.z}) reachable=${workman.reachable}`);
        const res = await bot.talkTo(workman);
        console.log('talkTo(Council workman 1287):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 90_000,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    // 1. Walk to Gnormadium Avlafrim (id=1800) at (2544, 2973)
    const toGnormadium = [
        [2635, 3130],
        [2615, 3080],
        [2580, 3030],
        [2544, 2973],
    ];
    for (const [wx, wz] of toGnormadium) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const npcs1 = sdk.getNearbyNpcs();
    console.log('NPCs near (2544, 2973):', npcs1.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const gnorm = npcs1.find(n => n.id === 1800 || /gnormadium/i.test(n.name));
    if (gnorm) {
        const res = await bot.talkTo(gnorm);
        console.log('talkTo(Gnormadium):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }

    // 2. Walk north to Mourner (id=372) at (2559, 3303)
    const toMourner = [
        [2580, 3030],
        [2615, 3080],
        [2615, 3140],
        [2590, 3200],
        [2575, 3260],
        [2559, 3303],
    ];
    for (const [wx, wz] of toMourner) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const npcs2 = sdk.getNearbyNpcs();
    console.log('NPCs near (2559, 3303):', npcs2.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const mourner = npcs2.find(n => n.id === 372);
    if (mourner) {
        console.log(`Found ${mourner.name} (id=${mourner.id}) at (${mourner.x}, ${mourner.z}) reachable=${mourner.reachable}`);
        const res = await bot.talkTo(mourner);
        console.log('talkTo(Mourner 372):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 120_000,
});

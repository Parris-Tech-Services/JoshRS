import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.dismissBlockingUI();

    // 1. Walk east around Fight Arena and north to Mourner (id=372) at (2559, 3303)
    const toMourner = [
        [2625, 3145],
        [2625, 3210],
        [2585, 3265],
        [2559, 3303],
    ];
    for (const [wx, wz] of toMourner) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const npcsMourner = sdk.getNearbyNpcs();
    console.log('NPCs at (2559, 3303):', npcsMourner.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const mourner = npcsMourner.find(n => n.id === 372);
    if (mourner) {
        console.log(`Found ${mourner.name} (id=${mourner.id}) at (${mourner.x}, ${mourner.z}) reachable=${mourner.reachable}`);
        const res = await bot.talkTo(mourner);
        console.log('talkTo(Mourner 372):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }

    // 2. Walk to Council workman (id=1287) at (2655, 3592)
    const toWorkman = [
        [2600, 3305],
        [2650, 3320],
        [2660, 3380],
        [2690, 3440],
        [2690, 3500],
        [2660, 3550],
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
        const res = await bot.talkTo(workman);
        console.log('talkTo(Council workman 1287):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 120_000,
});

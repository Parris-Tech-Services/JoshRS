import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const waypoints = [
        [2900, 3510],
        [2885, 3465],
        [2855, 3485],
        [2835, 3495],
        [2815, 3460],
        [2755, 3480],
        [2700, 3520],
        [2658, 3590],
    ];
    for (const [wx, wz] of waypoints) {
        const hp = sdk.getSkill('Hitpoints')?.current ?? 10;
        if (hp <= 5) {
            const food = sdk.findInventoryItem(/bread|shrimps/i);
            if (food) await bot.eatFood(food);
        }
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}): ${r.message} (HP=${sdk.getSkill('Hitpoints')?.current})`);
    }
    const npcs = sdk.getNearbyNpcs();
    console.log('Nearby NPCs at (2658, 3590):', npcs.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const target = npcs.find(n => n.id === 1287 || /council workman/i.test(n.name));
    if (target) {
        console.log(`Found ${target.name} (id=${target.id}) at (${target.x}, ${target.z})`);
        const res = await bot.talkTo(target);
        console.log('talkTo result:', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 120_000,
});

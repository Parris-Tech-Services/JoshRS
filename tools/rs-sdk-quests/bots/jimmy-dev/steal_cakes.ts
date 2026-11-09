import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const stalls = sdk.getNearbyLocs().filter(l => /baker/i.test(l.name));
    console.log('Baker stalls:', stalls.map(s => `${s.name}(${s.x},${s.z}) ops=${s.options.map(o => `${o.opIndex}:${o.text}`)}`));

    // Walk south of the eastern baker's stall at (2669, 3310) -> stand at (2669, 3309)
    await bot.walkTo(2669, 3309, 1);
    for (let i = 0; i < 15; i++) {
        const stall = sdk.getNearbyLocs().find(l => /baker/i.test(l.name) && l.options.some(o => /steal/i.test(o.text)));
        if (stall) {
            const opt = stall.options.find(o => /steal/i.test(o.text))!;
            await sdk.sendInteractLoc(stall.x, stall.z, stall.id, opt.opIndex);
            await sdk.waitForTicks(4);
        } else {
            await sdk.waitForTicks(2);
        }
        // Eat bread/chocolate if HP < 10
        const hp = sdk.getSkill('Hitpoints');
        if (hp && hp.current < 10) {
            const food = sdk.findInventoryItem(/cake|bread|slice/i);
            if (food) await bot.eatFood(food);
        }
        const foodCount = sdk.getInventory().filter(it => /cake|bread/i.test(it.name)).length;
        if (foodCount >= 8) break;
    }
    console.log('Inventory after baker stall:', sdk.getInventory().map(i => `${i.name}x${i.count}`).join(', '));
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

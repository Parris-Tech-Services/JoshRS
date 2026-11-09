import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const getCoins = () => sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
    console.log('Starting coins:', getCoins());
    while (getCoins() < 60) {
        const hp = sdk.getSkill('Hitpoints')?.current ?? 10;
        if (hp <= 2) {
            const food = sdk.findInventoryItem(/bread/i);
            if (food) await bot.eatFood(food);
            else {
                console.log('Low HP, selling bronze sword/axe at Lumbridge General Store instead!');
                break;
            }
        }
        const man = sdk.findNearbyNpc(/^man|woman$/i, 15);
        if (!man) {
            await sdk.waitForTicks(2);
            continue;
        }
        const r = await bot.pickpocketNpc(man);
        console.log(`Pickpocket: ${r.message} (Coins=${getCoins()}, HP=${sdk.getSkill('Hitpoints')?.current})`);
    }
    if (getCoins() < 60) {
        await bot.walkTo(3212, 3246, 3);
        const shopRes = await bot.openShop(/shop keeper/i);
        if (shopRes.success) {
            await bot.sellToShop(/bronze sword/i, 1);
            await bot.sellToShop(/bronze axe/i, 1);
            await bot.closeShop();
        }
    }
    console.log('Coins after prep:', getCoins());

    // Walk to Port Sarim docks (3027, 3217)
    for (const [wx, wz] of [[3160, 3235], [3100, 3250], [3050, 3245], [3027, 3217]]) {
        await bot.walkTo(wx, wz, 3);
    }
    // Pay fare to Seaman Lorris / Captain Tobias / Seaman Thresnor
    const sailor = sdk.findNearbyNpc(/captain tobias|seaman lorris|seaman thresnor/i);
    if (sailor) {
        console.log('Talking to sailor:', sailor.name);
        await bot.talkTo(sailor);
        await bot.navigateDialog([/yes please/i]);
        for (let i = 0; i < 15; i++) {
            const d = sdk.getDialog();
            if (d?.isOpen) {
                if (d.options && d.options.length > 1) {
                    await sdk.clickDialogByText(/yes/i);
                } else {
                    await sdk.sendClickDialog(0);
                }
            }
            await sdk.waitForTicks(2);
            if ((sdk.getState()?.player?.worldX ?? 3027) < 2970) break;
        }
    }
    // Cross gangplank on Karamja ship if on ship (level 1)
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
        await bot.interactLoc(plank, 'Cross');
        await sdk.waitForTicks(3);
    }
    console.log('Position after sailing:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 120_000,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.closeInterface();
    await sdk.waitForTicks(3);
    console.log('Current pos:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
        console.log('Crossing gangplank...');
        await bot.interactLoc(plank, 'Cross');
        await sdk.waitForTicks(4);
    }
    console.log('Pos after gangplank:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

    // Walk across Karamja to Saniboch (id=1595) at (2745, 3152)
    const waypoints = [
        [2920, 3155],
        [2880, 3170],
        [2830, 3180],
        [2785, 3180],
        [2745, 3152],
    ];
    for (const [wx, wz] of waypoints) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }

    const saniboch = sdk.findNearbyNpc(/saniboch/i);
    if (saniboch) {
        console.log(`Found ${saniboch.name} (id=${saniboch.id}) at (${saniboch.x}, ${saniboch.z})`);
        const res = await bot.talkTo(saniboch);
        console.log('talkTo(Saniboch):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    } else {
        console.log('Saniboch not found! Nearby:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})`));
    }

    // Now walk to Brimhaven dock (2772, 3227) and sail to Ardougne (30gp)
    for (const [wx, wz] of [[2772, 3185], [2772, 3227]]) {
        const r = await bot.walkTo(wx, wz, 3);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const barnaby = sdk.findNearbyNpc(/captain barnaby/i);
    if (barnaby) {
        console.log('Talking to Captain Barnaby...');
        await bot.talkTo(barnaby);
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
            if ((sdk.getState()?.player?.worldZ ?? 3227) > 3260) break;
        }
        await sdk.waitForTicks(6);
        await bot.closeInterface();
        const ardPlank = sdk.findNearbyLoc(/gangplank/i);
        if (ardPlank) {
            await bot.interactLoc(ardPlank, 'Cross');
            await sdk.waitForTicks(4);
        }
    }
    console.log('End pos:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 90_000,
});

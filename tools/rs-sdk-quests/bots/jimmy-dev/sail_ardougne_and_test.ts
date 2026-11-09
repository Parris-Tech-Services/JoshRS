import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const customs = sdk.findNearbyNpc(/customs officer|captain barnaby/i);
    if (customs) {
        console.log('Talking to:', customs.name);
        await bot.talkTo(customs);
        for (let i = 0; i < 20; i++) {
            const d = sdk.getDialog();
            if (d?.isOpen) {
                const texts = d.allComponents?.map(c => c.text).filter(Boolean) ?? [];
                console.log('Customs dialog:', JSON.stringify(texts));
                if (d.options && d.options.length > 1) {
                    const r = await sdk.clickDialogByText(/can i journey|search away|ok/i);
                    console.log('Clicked:', r.message);
                } else {
                    await sdk.sendClickDialog(0);
                }
            }
            await sdk.waitForTicks(2);
            if ((sdk.getState()?.player?.worldZ ?? 3225) > 3260) break;
        }
        await sdk.waitForTicks(6);
        await bot.closeInterface();
        const plank = sdk.findNearbyLoc(/gangplank/i);
        if (plank) {
            await bot.interactLoc(plank, 'Cross');
            await sdk.waitForTicks(4);
        }
    }
    console.log('Pos in Ardougne:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

    // 1. Walk to Port Khazard (2678, 3153) to test Tindel Marchant (id=1799)
    for (const [wx, wz] of [[2655, 3240], [2655, 3190], [2676, 3153]]) {
        const r = await bot.walkTo(wx, wz, 4);
        console.log(`walkTo(${wx},${wz}):`, r.message);
    }
    const tindel = sdk.findNearbyNpc(/tindel marchant/i);
    if (tindel) {
        console.log(`Found ${tindel.name} (id=${tindel.id}) at (${tindel.x}, ${tindel.z}) ops=${tindel.options.join('/')}`);
        const res = await bot.talkTo(tindel);
        console.log('talkTo(Tindel Marchant):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        if (tindel.options.some(o => /trade/i.test(o))) {
            await bot.dismissBlockingUI();
            const tr = await bot.interactNpc(tindel, 'Trade');
            console.log('Trade(Tindel Marchant):', JSON.stringify(tr));
            await bot.closeInterface();
        }
    } else {
        console.log('Tindel Marchant not found! Nearby:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})`));
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 90_000,
});

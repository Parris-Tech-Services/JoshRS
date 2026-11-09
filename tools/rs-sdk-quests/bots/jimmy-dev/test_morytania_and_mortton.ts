import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Talk to Hans -> option 3 -> option 1 (Morytania 3440, 3480)
    const hans = sdk.findNearbyNpc(/hans/i);
    if (hans) {
        await bot.talkTo(hans);
        await sdk.waitForTicks(3);
        await sdk.clickDialogByText(/where am i/i);
        await sdk.waitForTicks(3);
        await sdk.sendClickDialog(0);
        await sdk.waitForTicks(3);
        await sdk. sendClickDialog(0);
        await sdk.waitForTicks(3);
        await sdk.clickDialogByText(/morytania/i);
        await sdk.waitForTicks(5);
    }
    console.log(`After Hans jump: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // 1. Walk to Canifis (3503, 3477) and test Stranger (id=1576, canafis_stranger)
    await bot.walkTo(3475, 3480, 4);
    await bot.walkTo(3503, 3477, 3);
    console.log(`At Canifis: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    console.log('Nearby NPCs in Canifis:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));

    const stranger = sdk.getNearbyNpcs().find(n => n.id === 1576 || /stranger/i.test(n.name));
    if (stranger) {
        console.log(`Testing Talk-to on ${stranger.name} (id=${stranger.id})...`);
        await sdk.sendInteractNpc(stranger.index, 1);
        await sdk.waitForTicks(6);
        console.log('Stranger dialog:', JSON.stringify(sdk.getDialog()));
        while (sdk.getDialog()?.isOpen) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
    }

    // 2. Walk south through Mort Myre Swamp to Mort'ton (3466, 3306) and test Afflicted (1257, 1258, 1261, 1262)
    const mortWaypoints = [
        [3495, 3455],
        [3442, 3456],
        [3440, 3420],
        [3445, 3380],
        [3460, 3340],
        [3466, 3306]
    ];
    for (const [wx, wz] of mortWaypoints) {
        await bot.walkTo(wx, wz, 4);
    }
    console.log(`At Mort'ton: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    console.log('Nearby NPCs in Mort\'ton:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));

    for (const targetId of [1257, 1258, 1261, 1262]) {
        const npc = sdk.getNearbyNpcs().find(n => n.id === targetId);
        if (npc) {
            console.log(`Testing Talk-to on ${npc.name} (id=${npc.id}) at (${npc.x}, ${npc.z})...`);
            await sdk.sendInteractNpc(npc.index, 1);
            await sdk.waitForTicks(6);
            console.log(`Afflicted ${npc.id} dialog:`, JSON.stringify(sdk.getDialog()));
            while (sdk.getDialog()?.isOpen) {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        } else {
            console.log(`Afflicted id=${targetId} not in current view`);
        }
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const jumpViaAxe = async (label: RegExp) => {
        while (sdk.getDialog()?.isOpen) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
        const axe = sdk.findInventoryItem(/bronze axe/i);
        const sword = sdk.findInventoryItem(/bronze sword/i);
        if (!axe || !sword) throw new Error('No bronze axe/sword in inventory!');
        await sdk.sendUseItemOnItem(axe.slot, sword.slot);
        await sdk.waitForTicks(3);
        console.log('Axe dialog:', JSON.stringify(sdk.getDialog()));
        await sdk.clickDialogByText(label);
        await sdk.waitForTicks(5);
        console.log(`Jumped (${label}): pos=(${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    };

    const testNpc = async (npcId: number) => {
        const npc = sdk.getNearbyNpcs().find(n => n.id === npcId);
        if (!npc) {
            console.log(`[MISS] NPC id=${npcId} not found nearby! Nearby:`, sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z})`));
            return;
        }
        console.log(`\n=== Testing NPC id=${npc.id} (${npc.name}) at (${npc.x}, ${npc.z}) ops=${npc.options.map(o => `${o.index}:${o.text}`)} ===`);
        await sdk.sendInteractNpc(npc.index, 1);
        await sdk.waitForTicks(5);
        console.log(`Dialog after op1:`, JSON.stringify(sdk.getDialog()));
        for (let i = 0; i < 4 && sdk.getDialog()?.isOpen; i++) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
        const tradeOpt = npc.options.find(o => /trade/i.test(o.text));
        if (tradeOpt) {
            console.log(`Testing Trade (op=${tradeOpt.index}) on ${npc.name} (${npc.id})...`);
            await sdk.sendInteractNpc(npc.index, tradeOpt.index);
            await sdk.waitForTicks(5);
            console.log(`Shop/interface after Trade:`, JSON.stringify(sdk.getState().shop));
            await bot.closeInterface();
            await sdk.waitForTicks(2);
        }
    };

    // 1. Canifis: 1576 (canafis_stranger)
    await jumpViaAxe(/canifis/i);
    await testNpc(1576);

    // 2. Mort'ton: 1257, 1258, 1261, 1262 (mort_afflicted_*)
    await jumpViaAxe(/mortton/i);
    for (const id of [1257, 1258, 1261, 1262]) {
        await testNpc(id);
    }

    // 3. Etceteria: 1367, 1368, 1369, 1370 (etc_*)
    await jumpViaAxe(/etceteria/i);
    for (const id of [1367, 1368, 1369, 1370]) {
        await testNpc(id);
    }

    // 4. Zanaris: 57 (fairy)
    await jumpViaAxe(/zanaris/i);
    await testNpc(57);

    // 5. Sunken Trawler: 466 (murphy_sunk)
    await jumpViaAxe(/sunken trawler/i);
    await testNpc(466);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

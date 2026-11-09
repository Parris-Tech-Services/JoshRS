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
        console.log(`\n=== Testing NPC id=${npc.id} (${npc.name}) at (${npc.x}, ${npc.z}) reachable=${npc.reachable} ops=${npc.options.map(o => `${o.index}:${o.text}`)} ===`);
        await sdk.sendInteractNpc(npc.index, 1);
        await sdk.waitForTicks(6);
        console.log(`Dialog after op1:`, JSON.stringify(sdk.getDialog()));
        console.log(`Recent chat:`, JSON.stringify(sdk.getChat().slice(-4)));
        for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
        const tradeOpt = npc.options.find(o => /trade/i.test(o.text));
        if (tradeOpt) {
            console.log(`Testing Trade (op=${tradeOpt.index}) on ${npc.name} (${npc.id})...`);
            await sdk.sendInteractNpc(npc.index, tradeOpt.index);
            await sdk.waitForTicks(5);
            console.log(`Shop after Trade:`, JSON.stringify(sdk.getState().shop));
            await bot.closeInterface();
            await sdk.waitForTicks(2);
        }
    };

    // 1. Test Murphy (466) right here at (1948, 4827)
    await testNpc(466);

    // 2. Test Etceteria: 1367, 1368, 1369, 1370
    await jumpViaAxe(/etceteria/i);
    for (const id of [1367, 1368, 1369, 1370]) {
        await testNpc(id);
    }

    // 3. Test Zanaris: 57
    await jumpViaAxe(/zanaris/i);
    await testNpc(57);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

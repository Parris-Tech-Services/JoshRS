import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const jumpViaAxe = async (label: RegExp) => {
        await bot.closeInterface();
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
        console.log(`\n=== Testing NPC id=${npc.id} (${npc.name}) at (${npc.x}, ${npc.z}) reachable=${npc.reachable} ===`);
        await sdk.sendInteractNpc(npc.index, 1);
        await sdk.waitForTicks(6);
        console.log(`Dialog after op1:`, JSON.stringify(sdk.getDialog()));
        for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
            console.log(`  Page ${i}:`, sdk.getDialog()?.allComponents.filter(c => c.text).map(c => c.text).join(' | '));
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
    };

    // 1. Zanaris: walk from shed entrance (2452, 4473) to Fairy (2373, 4447)
    await jumpViaAxe(/zanaris/i);
    await bot.walkTo(2415, 4455, 4);
    await bot.walkTo(2375, 4447, 4);
    await testNpc(57);

    // 2. Sunken Trawler: 466 (murphy_sunk)
    await jumpViaAxe(/sunken trawler/i);
    await testNpc(466);

    // 3. Mort'ton: 1262 (mort_afflicted_woman2) at (3472, 3304)
    await jumpViaAxe(/mortton/i);
    await testNpc(1262);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

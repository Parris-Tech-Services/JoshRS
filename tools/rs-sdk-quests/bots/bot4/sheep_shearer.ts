import { runScript } from '../../sdk/runner';

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;
    const log = (msg: string) => console.log(`[Sheep] ${msg}`);

    await bot.closeInterface();
    await bot.dismissBlockingUI();

    // Ensure on L0
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        const stairsDown = sdk.findNearbyLoc(/staircase|ladder/i, { withOption: /climb-down/i });
        if (stairsDown) {
            await bot.interactLoc(stairsDown, /climb-down/i);
            await sdk.waitForTicks(3);
        } else break;
    }

    // Talk to Fred the Farmer if nearby to start quest
    const fredNear = sdk.findNearbyNpc(/fred the farmer/i);
    if (fredNear) {
        log('Talking to Fred the Farmer to start quest...');
        await bot.talkTo(fredNear);
        for (let i = 0; i < 20; i++) {
            await sdk.waitForTicks(1);
            const d = sdk.getDialog();
            if (!d || !d.isOpen) break;
            if (d.options.length > 0) {
                const opt = d.options.find(o => /looking for a quest|yes okay/i.test(o.text)) || d.options[0];
                await sdk.sendClickDialog(opt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
    }

    // Buy Shears from Lumbridge General Store (3212, 3246) if needed
    if (!sdk.findInventoryItem(/^shears$/i)) {
        log('Walking to Lumbridge General Store to buy Shears...');
        await bot.walkTo(3189, 3277, 1);
        await bot.walkTo(3212, 3246, 2);
        const shopRes = await bot.openShop(/shop keeper|shop assistant/i);
        log(`Open shop: ${shopRes.success} - ${shopRes.message}`);
        await sdk.waitForTicks(2);
        // Sell unused starter items for coins and inventory space
        for (const sellPat of [/^bronze dagger$/i, /^shortbow$/i]) {
            if (sdk.findInventoryItem(sellPat)) {
                await bot.sellToShop(sellPat, 1);
                await sdk.waitForTicks(2);
            }
        }
        const buyRes = await bot.buyFromShop(/^shears$/i, 1);
        log(`Buy Shears: ${buyRes.success} - ${buyRes.message}`);
        await sdk.waitForTicks(2);
        await bot.closeShop();
    }

    if (!sdk.findInventoryItem(/^shears$/i)) {
        throw new Error('Could not obtain Shears');
    }

    // If we didn't talk to Fred yet, talk to him on first delivery
    const craftingXpBefore = sdk.getSkill('Crafting')?.experience ?? 0;

    const doWoolBatch = async (targetCount: number) => {
        if (sdk.countInventoryItems(/^wool$/i) + sdk.countInventoryItems(/ball of wool/i) < targetCount) {
            log(`Shearing ${targetCount} wool...`);
            await bot.walkTo(3201, 3268, 2);
            let guard = 0;
            while (sdk.countInventoryItems(/^wool$/i) + sdk.countInventoryItems(/ball of wool/i) < targetCount && guard < 60) {
                guard++;
                await bot.dismissBlockingUI();
                const shearsItem = sdk.findInventoryItem(/^shears$/i);
                if (!shearsItem) throw new Error('Missing shears');
                const unshorn = sdk.getNearbyNpcs().filter(n => n.id === 43 && n.reachable !== false);
                if (unshorn.length > 0) {
                    const res = await bot.useItemOnNpc(shearsItem, unshorn[0]);
                    log(`Shear sheep (${sdk.countInventoryItems(/^wool$/i) + 1}/${targetCount}): ${res.message}`);
                    await sdk.waitForTicks(3);
                    await bot.dismissBlockingUI();
                } else {
                    await bot.walkTo(3201, 3268, 2);
                    await sdk.waitForTicks(3);
                }
            }
        }

        if (sdk.countInventoryItems(/^wool$/i) > 0) {
            // Go to Lumbridge Castle L1 spinning wheel via south staircase (3206, 3208)
            log('Going to Lumbridge Castle L1...');
            await bot.walkTo(3206, 3208, 1);
            for (let tries = 0; tries < 5 && (sdk.getState()?.player?.level ?? 0) === 0; tries++) {
                const stairs = sdk.findNearbyLoc(/staircase/i, { withOption: /climb-up/i });
                if (stairs) {
                    await bot.interactLoc(stairs, /climb-up/i);
                    await sdk.waitForTicks(3);
                }
            }

            // Bonus while on L1: start Rune Mysteries with Duke Horacio if we don't have Air talisman
            if (!sdk.findInventoryItem(/air talisman/i) && (sdk.getState()?.player?.level ?? 0) === 1) {
                log('Talking to Duke Horacio on L1 to start Rune Mysteries...');
                await bot.walkTo(3210, 3220, 1);
                const duke = sdk.findNearbyNpc(/duke horacio/i);
                if (duke) {
                    await bot.talkTo(duke);
                    for (let i = 0; i < 15; i++) {
                        await sdk.waitForTicks(1);
                        const d = sdk.getDialog();
                        if (!d || !d.isOpen) break;
                        if (d.options.length > 0) {
                            const opt = d.options.find(o => /quests|sure, no problem/i.test(o.text)) || d.options[0];
                            await sdk.sendClickDialog(opt.index);
                        } else {
                            await sdk.sendClickDialog(0);
                        }
                        await sdk.waitForTicks(2);
                    }
                }
            }

            // Spin all wool on L1 spinning wheel at (3209, 3213)
            await bot.walkTo(3209, 3213, 1);
            let spinGuard = 0;
            while (sdk.findInventoryItem(/^wool$/i) && spinGuard < 40) {
                spinGuard++;
                await bot.dismissBlockingUI();
                const wool = sdk.findInventoryItem(/^wool$/i);
                const wheel = sdk.findNearbyLoc(/spinning wheel/i);
                if (wool && wheel) {
                    await bot.useItemOnLoc(wool, wheel);
                    await sdk.waitForTicks(3);
                } else {
                    await sdk.waitForTicks(2);
                }
            }

            // Climb down to L0
            await bot.walkTo(3206, 3208, 1);
            for (let tries = 0; tries < 5 && (sdk.getState()?.player?.level ?? 0) > 0; tries++) {
                const stairs = sdk.findNearbyLoc(/staircase/i, { withOption: /climb-down/i });
                if (stairs) {
                    await bot.interactLoc(stairs, /climb-down/i);
                    await sdk.waitForTicks(3);
                }
            }
        }

        // Deliver balls of wool to Fred
        log(`Delivering ${sdk.countInventoryItems(/ball of wool/i)} balls of wool to Fred...`);
        await bot.walkTo(3189, 3277, 1);
        await bot.walkTo(3190, 3273, 1);
        for (let round = 0; round < 4; round++) {
            if (!sdk.findInventoryItem(/ball of wool/i)) break;
            const fredNpc = sdk.findNearbyNpc(/fred the farmer/i);
            if (fredNpc) {
                await bot.talkTo(fredNpc);
                for (let step = 0; step < 35; step++) {
                    await sdk.waitForTicks(2);
                    const d = sdk.getDialog();
                    if (!d || !d.isOpen) {
                        if (sdk.findInventoryItem(/ball of wool/i)) {
                            await sdk.waitForTicks(3);
                            continue;
                        }
                        break;
                    }
                    if (d.options.length > 0) {
                        const opt = d.options.find(o => /looking for a quest|yes okay|i have some/i.test(o.text)) || d.options[0];
                        await sdk.sendClickDialog(opt.index);
                    } else {
                        await sdk.sendClickDialog(0);
                    }
                }
            }
        }
        await sdk.waitForTicks(4);
        await bot.closeInterface();
    };

    await doWoolBatch(10);
    if ((sdk.getSkill('Crafting')?.experience ?? 0) < craftingXpBefore + 1000) {
        await doWoolBatch(10);
    }

    log(`Final Crafting skill: Lvl ${sdk.getSkill('Crafting')?.level} (${sdk.getSkill('Crafting')?.experience} xp), Coins: ${sdk.countInventoryItems(/^coins$/i)}`);
}, {
    timeout: 300_000,
    disconnectAfter: true,
});

import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    1, 2, 3, 4, 5, 6, 24, 66, 67, 68, 479, 480, 308, 388, 820, 737, 227, 226, 230, 679,
    1281, 1295, 1294, 1300, 1286, 1284, 1285, 1277, 1275, 1274, 1278, 1269, 1289, 1303, 1288, 1316, 1282, 1305,
    1315, 1301, 1302, 1304, 812, 813, 815, 807,
    589, 843, 572, 573, 591, 590, 289, 290, 1216, 738, 273, 718, 555, 463, 593, 739, 877, 264, 281, 279, 676,
    398, 399, 710, 714, 28, 1469, 470, 473, 1526, 223, 574, 571,
    569, 570, 844, 381, 696, 700
]);

async function dismissAllDialogs(bot: any, sdk: any) {
    let safety = 0;
    while (sdk.getDialog()?.isOpen && safety < 14) {
        safety++;
        const d = sdk.getDialog();
        if (d.options && d.options.length > 0) {
            const opt = d.options.find((o: any) => /no|bye|leave|nothing|cancel|farewell|nevermind/i.test(o.text)) || d.options[d.options.length - 1];
            await sdk.sendClickDialog(opt.index);
        } else {
            await sdk.sendClickDialog(0);
        }
        await sdk.waitForTicks(2);
    }
    if (sdk.getState()?.interface?.isOpen || sdk.getState()?.shop?.isOpen) {
        await bot.closeInterface();
        await sdk.waitForTicks(1);
    }
}

async function testNpc(bot: any, sdk: any, npc: any) {
    console.log(`\n--- Testing NPC: ${npc.name} (id=${npc.id}, idx=${npc.index}) at (${npc.x}, ${npc.z}) ---`);
    visitedIds.add(npc.id);
    const hasTalk = npc.optionsWithIndex.some((o: any) => /^talk-to$/i.test(o.text));
    const hasTrade = npc.optionsWithIndex.some((o: any) => /^trade$/i.test(o.text));

    if (hasTalk) {
        const prevChatLen = sdk.getChat().length;
        const prevRejected = sdk.getState()?.opFeedback?.opRejectedCount ?? 0;
        const res = await bot.talkTo(npc);
        await sdk.waitForTicks(3);
        const st = sdk.getState();
        const dlg = sdk.getDialog();
        const newChat = sdk.getChat().slice(prevChatLen);
        const newRejected = st?.opFeedback?.opRejectedCount ?? 0;
        console.log(`Talk-to result: success=${res.success}, msg="${res.message}", dlgOpen=${dlg?.isOpen}, options=${JSON.stringify(dlg?.options?.map((o: any) => o.text))}, newChat=${JSON.stringify(newChat.map((c: any) => c.text))}, rejectedDelta=${newRejected - prevRejected}`);
        await dismissAllDialogs(bot, sdk);
    }

    if (hasTrade) {
        const live = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id && n.reachable);
        if (live) {
            const prevChatLen = sdk.getChat().length;
            const res = await bot.interactNpc(live, /^trade$/i);
            await sdk.waitForTicks(3);
            const st = sdk.getState();
            const dlg = sdk.getDialog();
            const newChat = sdk.getChat().slice(prevChatLen);
            console.log(`Trade result: success=${res.success}, msg="${res.message}", shopOpen=${st?.shop?.isOpen}, dlgOpen=${dlg?.isOpen}, newChat=${JSON.stringify(newChat.map((c: any) => c.text))}`);
            await dismissAllDialogs(bot, sdk);
        }
    }
}

async function sweepCurrentArea(bot: any, sdk: any, label: string) {
    console.log(`\n=== Sweeping ${label} ===`);
    for (let pass = 0; pass < 14; pass++) {
        const npcs = sdk.getNearbyNpcs().filter((n: any) =>
            !visitedIds.has(n.id) &&
            n.reachable &&
            n.optionsWithIndex.some((o: any) => /^(talk-to|trade)$/i.test(o.text))
        );
        if (npcs.length === 0) break;
        const target = npcs[0];
        await testNpc(bot, sdk, target);
    }
}

await runScript(async ({ bot, sdk }) => {
    // 1. Walk to East Ardougne West (2633, 3292) where Men/Women spawn, pickpocket until >= 65 coins
    await bot.walkTo(2633, 3292, 4);
    await sweepCurrentArea(bot, sdk, 'East Ardougne West (Elena, Jerico, Town crier)');
    for (let tries = 0; tries < 25 && (sdk.findInventoryItem(/coins/i)?.count ?? 0) < 65; tries++) {
        const citizen = sdk.getNearbyNpcs().find((n: any) => /^(man|woman)$/i.test(n.name) && n.reachable);
        if (citizen) {
            await bot.pickpocketNpc(citizen);
            await sdk.waitForTicks(3);
        } else {
            await bot.walkTo(2615, 3295, 4);
        }
    }
    console.log(`Coins now: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // 2. Buy Swamp paste at Port Khazard General Store (2660, 3149)
    await bot.walkTo(2660, 3149, 1);
    const khazardShop = sdk.findNearbyNpc(/shop keeper/i);
    if (khazardShop) {
        const openRes = await bot.openShop(khazardShop);
        console.log(`Open shop: ${openRes.success} (${openRes.message})`);
        await sdk.waitForTicks(2);
        const buyRes = await bot.buyFromShop(/swamp paste/i, 1);
        console.log(`Bought Swamp paste: ${buyRes.success} (${buyRes.message})`);
        await sdk.waitForTicks(2);
        await bot.closeInterface();
    }

    // 3. Return to Holgart at Witchaven (2720, 3305), repair boat and board
    await bot.walkTo(2720, 3305, 3);
    const holgart = sdk.findNearbyNpc(/holgart/i);
    if (holgart) {
        await bot.talkTo(holgart);
        for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
            const d = sdk.getDialog();
            const goOpt = d?.options?.find((o: any) => /okay, let/i.test(o.text));
            if (goOpt) {
                await sdk.sendClickDialog(goOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(3);
        }
    }
    await sdk.waitForTicks(6);
    await dismissAllDialogs(bot, sdk);
    console.log(`Pos on Fishing Platform: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 4. Sweep Fishing Platform L0 and L1
    if ((sdk.getState()?.player?.worldX ?? 0) > 2750) {
        await sweepCurrentArea(bot, sdk, 'Fishing Platform South (Holgart, Fishermen)');
        await bot.walkTo(2766, 3285, 3);
        await sweepCurrentArea(bot, sdk, 'Fishing Platform North-West (Bailey, Fishermen)');

        // Climb stairs at (2784, 3281) or ladder to L1
        await bot.walkTo(2783, 3281, 3);
        const stair = sdk.findNearbyLoc(/stair|ladder/i);
        if (stair) {
            console.log(`Climbing ${stair.name} id=${stair.id} at (${stair.x}, ${stair.z})`);
            await sdk.sendInteractLoc(stair.x, stair.z, stair.id, 1);
            await sdk.waitForTicks(5);
            console.log(`Upstairs pos: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

            // Test Kennith directly via opnpc1 and via wall
            const kennith = sdk.findNearbyNpc(/kennith/i);
            if (kennith) {
                console.log(`Found Kennith id=${kennith.id} idx=${kennith.index} at (${kennith.x}, ${kennith.z}) reachable=${kennith.reachable} options=${JSON.stringify(kennith.optionsWithIndex)}`);
                const prevChatLen = sdk.getChat().length;
                await sdk.sendInteractNpc(kennith.index, 1);
                await sdk.waitForTicks(5);
                console.log(`Direct opnpc1 on Kennith: dlgOpen=${sdk.getDialog()?.isOpen}, newChat=${JSON.stringify(sdk.getChat().slice(prevChatLen).map((c: any) => c.text))}`);
                await dismissAllDialogs(bot, sdk);
            }
        }
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

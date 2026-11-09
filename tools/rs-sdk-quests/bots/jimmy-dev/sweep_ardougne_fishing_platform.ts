import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    1, 2, 3, 4, 5, 6, 24, 66, 67, 68, 479, 480, 308, 388, 820, 737, 227, 226, 230, 679,
    1281, 1295, 1294, 1300, 1286, 1284, 1285, 1277, 1275, 1274, 1278, 1269, 1289, 1303, 1288, 1316, 1282, 1305,
    1315, 1301, 1302, 1304, 812, 813, 815, 807,
    589, 843, 572, 573, 591, 590, 289, 290, 1216, 738, 273, 718, 555, 463, 593, 739, 877, 264, 281, 279, 676,
    398, 399, 710, 714, 28, 1469, 470, 473, 1526, 223, 574, 571
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
    await dismissAllDialogs(bot, sdk);

    // 1. Finish East Ardougne Market & Docks
    const ardyWaypoints = [
        { x: 2660, z: 3312, label: 'East Ardougne Market North (Silver merchant, Gem merchant, Town crier)' },
        { x: 2682, z: 3323, label: 'East Ardougne North-East (Wizard Cromperty)' },
        { x: 2673, z: 3275, label: 'East Ardougne Docks (Captain Barnaby)' },
        { x: 2612, z: 3293, label: 'East Ardougne Jerico / Omart' },
    ];
    for (const wp of ardyWaypoints) {
        await bot.walkTo(wp.x, wp.z, 4);
        await sweepCurrentArea(bot, sdk, wp.label);
    }

    // 2. Ensure we have at least 40 coins and buy Swamp paste from Port Khazard General Store
    for (let tries = 0; tries < 10 && (sdk.findInventoryItem(/coins/i)?.count ?? 0) < 45; tries++) {
        const citizen = sdk.getNearbyNpcs().find((n: any) => /^(man|woman)$/i.test(n.name) && n.reachable);
        if (citizen) {
            await bot.pickpocketNpc(citizen);
            await sdk.waitForTicks(2);
        } else {
            break;
        }
    }
    await bot.walkTo(2660, 3150, 4);
    const khazardShop = sdk.findNearbyNpc(/shop keeper/i);
    if (khazardShop) {
        await bot.openShop(khazardShop);
        await sdk.waitForTicks(2);
        await bot.buyFromShop(/swamp paste/i, 1);
        await sdk.waitForTicks(2);
        await bot.closeInterface();
    }

    // 3. Walk to Witchaven (Caroline & Holgart)
    await bot.walkTo(2718, 3304, 3);
    const caroline = sdk.findNearbyNpc(/caroline/i);
    if (caroline) {
        console.log(`\n--- Testing Caroline (id=${caroline.id}) at (${caroline.x}, ${caroline.z}) ---`);
        await bot.talkTo(caroline);
        for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
            const d = sdk.getDialog();
            const opt1 = d?.options?.find((o: any) => /suppose so/i.test(o.text));
            if (opt1) {
                await sdk.sendClickDialog(opt1.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
    }

    const holgart = sdk.findNearbyNpc(/holgart/i);
    if (holgart) {
        console.log(`\n--- Testing Holgart (id=${holgart.id}) at (${holgart.x}, ${holgart.z}) ---`);
        // First talk: ask for boat
        await bot.talkTo(holgart);
        for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
        // Second talk: give swamp paste and board
        const holgart2 = sdk.findNearbyNpc(/holgart/i);
        if (holgart2 && sdk.findInventoryItem(/swamp paste/i)) {
            await bot.talkTo(holgart2);
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
    }

    await sdk.waitForTicks(5);
    await dismissAllDialogs(bot, sdk);
    console.log(`Pos after Holgart boat: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 4. Sweep Fishing Platform L0 and L1
    if ((sdk.getState()?.player?.worldX ?? 0) > 2750) {
        await sweepCurrentArea(bot, sdk, 'Fishing Platform Ground Floor (Holgart, Bailey, Fishermen)');
        // Walk to Kennith upstairs or talk through wall
        const stair = sdk.findNearbyLoc(/ ladder|stair/i) || sdk.findNearbyLoc(/ladder/i);
        if (stair) {
            await sdk.sendInteractLoc(stair.x, stair.z, stair.id, 1);
            await sdk.waitForTicks(5);
            console.log(`Pos upstairs on Fishing Platform: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
            const kennith = sdk.findNearbyNpc(/kennith/i);
            if (kennith) {
                console.log(`Found Kennith id=${kennith.id} at (${kennith.x}, ${kennith.z}) reachable=${kennith.reachable} options=${JSON.stringify(kennith.optionsWithIndex)}`);
                await sdk.sendInteractNpc(kennith.index, 1);
                await sdk.waitForTicks(5);
                console.log(`Direct Talk-to on Kennith: dlgOpen=${sdk.getDialog()?.isOpen}, chat=${JSON.stringify(sdk.getChat().slice(-5).map((c: any) => c.text))}`);
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

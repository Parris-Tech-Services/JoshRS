import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    1, 2, 3, 4, 5, 6, 24, 66, 67, 68, 479, 480, 308, 388, 820, 737, 227, 226, 230, 679,
    1281, 1295, 1294, 1300, 1286, 1284, 1285, 1277, 1275, 1274, 1278, 1269, 1289, 1303, 1288, 1316, 1282, 1305,
    1315, 1301, 1302, 1304, 812, 813, 815, 807,
    589, 843, 572, 573, 591, 590, 289, 290, 1216, 738, 273, 718, 555, 463, 593, 739, 877, 264, 281, 279, 676,
    398, 399, 710, 714, 28, 1469, 470, 473, 1526, 223, 574, 571,
    569, 570, 844, 381, 696, 700, 699, 698, 695, 697, 701, 702, 703, 704
]);

async function dismissAllDialogs(bot: any, sdk: any) {
    let safety = 0;
    while (sdk.getDialog()?.isOpen && safety < 15) {
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
    // 1. Witchaven Village (Ezekial Lovecraft, Villagers)
    await bot.walkTo(2730, 3375, 4);
    await sweepCurrentArea(bot, sdk, 'Witchaven Village (Ezekial Lovecraft)');

    // 2. East Ardougne Castle & Zoo & West Gate (King Lathas guards, Jerico, Omart, Kilron, Elena, Chuck, Larry)
    const waypoints = [
        { x: 2594, z: 3266, label: 'Ardougne Zoo South (Larry, Chuck, Penguin, Zoo keeper)' },
        { x: 2614, z: 3293, label: 'East Ardougne Jerico House (Jerico)' },
        { x: 2559, z: 3266, label: 'West Ardougne Wall South (Omart, Kilron)' },
        { x: 2515, z: 3162, label: 'Tree Gnome Village Loose Railing Outside' },
    ];
    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 3);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);
    }

    // 3. Squeeze through Loose Railing into Tree Gnome Village (2515, 3161)
    const railing = sdk.findNearbyLoc(/loose railing/i);
    if (railing) {
        console.log(`Squeezing through Loose Railing id=${railing.id} at (${railing.x}, ${railing.z})`);
        await sdk.sendInteractLoc(railing.x, railing.z, railing.id, 1);
        await sdk.waitForTicks(6);
        console.log(`Pos inside Tree Gnome Village: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await bot.walkTo(2541, 3169, 3);
        await sweepCurrentArea(bot, sdk, 'Tree Gnome Village Center (King Bolren, Remsai, Bolkoy, Local gnome, Elkoy, Kalron)');
        // Climb ladder to Bolkoy's shop on L1 if present
        const ladder = sdk.findNearbyLoc(/ladder/i);
        if (ladder) {
            await bot.interactLoc(ladder, /climb/i);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, 'Tree Gnome Village L1 (Bolkoy)');
            const ladderDown = sdk.findNearbyLoc(/ladder/i);
            if (ladderDown) {
                await bot.interactLoc(ladderDown, /climb/i);
                await sdk.waitForTicks(4);
            }
        }
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

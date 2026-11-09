import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    1, 2, 3, 4, 5, 6, 24, 66, 67, 68, 479, 480, 308, 388, 820, 737, 227, 226, 230, 679,
    1281, 1295, 1294, 1300, 1286, 1284, 1285, 1277, 1275, 1274, 1278, 1269, 1289, 1303, 1288, 1316, 1282, 1305,
    1315, 1301, 1302, 1304, 812, 813, 815, 807,
    589, 843, 572, 573, 591, 590, 289, 290, 1216, 738, 273, 718, 555, 463, 593, 739, 877, 264, 281, 279, 676,
    398, 399, 710, 714, 28, 1469, 470, 473, 1526, 223, 574, 571,
    569, 570, 844, 381, 696, 700, 699, 698, 695, 697, 701, 702, 703, 704,
    350, 887, 474, 485, 469, 472, 471
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
            n.optionsWithIndex.some((o: any) => /^(talk-to|trade)$/i.test(o.text)) &&
            n.level === (sdk.getState()?.player?.level ?? 0)
        );
        if (npcs.length === 0) break;
        const target = npcs[0];
        await testNpc(bot, sdk, target);
    }
}

await runScript(async ({ bot, sdk }) => {
    // 1. Test Kalron on L0 inside Tree Gnome Village
    await bot.walkTo(2528, 3168, 3);
    await sweepCurrentArea(bot, sdk, 'Tree Gnome Village Ground (Kalron)');

    // 2. Talk to King Bolren (469) to start Tree Gnome Village and get escorted out by Elkoy
    await bot.walkTo(2541, 3169, 2);
    const bolren = sdk.findNearbyNpc(/king bolren/i);
    if (bolren) {
        await bot.talkTo(bolren);
        for (let i = 0; i < 25 && sdk.getDialog()?.isOpen; i++) {
            const d = sdk.getDialog();
            const helpOpt = d?.options?.find((o: any) => /can i help|glad to help/i.test(o.text));
            if (helpOpt) {
                await sdk.sendClickDialog(helpOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(3);
        }
        await sdk.waitForTicks(4);
        await dismissAllDialogs(bot, sdk);
    }
    console.log(`Pos after King Bolren escort: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

    // 3. Sweep Tracker Gnomes, Observatory, Watchtower, Yanille, Feldip Hills
    const waypoints = [
        { x: 2501, z: 3261, label: 'Tracker Gnome 1 (2501, 3261)' },
        { x: 2524, z: 3256, label: 'Tracker Gnome 2 (2524, 3256)' },
        { x: 2497, z: 3234, label: 'Tracker Gnome 3 (2497, 3234)' },
        { x: 2439, z: 3159, label: 'Observatory Reception (Professor, Assistant)' },
        { x: 2545, z: 3114, label: 'Watchtower Ground Floor (Watchtower Guard)' },
        { x: 2590, z: 3088, label: 'Yanille Magic Guild Outside (Wizard Distentor, Zavistic Rarve)' },
        { x: 2576, z: 3095, label: 'Yanille Bert / Aleck / Sidney' },
        { x: 2630, z: 2982, label: 'Feldip Hills East (Rantz)' },
    ];

    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 3);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);

        if (wp.label.includes('Watchtower')) {
            // Climb ladders to L2 for Watchtower Wizard
            for (let lvl = 0; lvl < 2; lvl++) {
                const l = sdk.findNearbyLoc(/ladder/i);
                if (l) {
                    await sdk.sendInteractLoc(l.x, l.z, l.id, 1);
                    await sdk.waitForTicks(4);
                    await sweepCurrentArea(bot, sdk, `Watchtower L${lvl + 1}`);
                }
            }
            while ((sdk.getState()?.player?.level ?? 0) > 0) {
                const l = sdk.findNearbyLoc(/ladder/i);
                if (l) {
                    await sdk.sendInteractLoc(l.x, l.z, l.id, 1);
                    await sdk.waitForTicks(4);
                } else break;
            }
        }
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

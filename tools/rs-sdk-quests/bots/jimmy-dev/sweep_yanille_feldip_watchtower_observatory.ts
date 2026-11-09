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
    await dismissAllDialogs(bot, sdk);
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
    await dismissAllDialogs(bot, sdk);

    // 1. Hazelmere's Island (2677, 3088)
    await bot.walkTo(2677, 3088, 2);
    const hazelLadder = sdk.findNearbyLoc(/ladder/i);
    if (hazelLadder) {
        await sdk.sendInteractLoc(hazelLadder.x, hazelLadder.z, hazelLadder.id, 1);
        await sdk.waitForTicks(4);
        await sweepCurrentArea(bot, sdk, 'Hazelmere House L1 (Hazelmere)');
        const lDown = sdk.findNearbyLoc(/ladder/i);
        if (lDown) {
            await sdk.sendInteractLoc(lDown.x, lDown.z, lDown.id, 1);
            await sdk.waitForTicks(4);
        }
    }

    // 2. Feldip Hills (Rantz at 2630, 2981, and Rantz's cave at 2630, 2997 for Bugs & Fycie)
    await bot.walkTo(2630, 2981, 4);
    await sweepCurrentArea(bot, sdk, 'Feldip Hills (Rantz)');
    await bot.walkTo(2630, 2996, 3);
    const rantzCave = sdk.findNearbyLoc(/cave entrance/i);
    if (rantzCave) {
        await sdk.sendInteractLoc(rantzCave.x, rantzCave.z, rantzCave.id, 1);
        await sdk.waitForTicks(5);
        await sweepCurrentArea(bot, sdk, 'Rantz Cave (Bugs, Fycie)');
        const rantzExit = sdk.findNearbyLoc(/cave exit/i);
        if (rantzExit) {
            await sdk.sendInteractLoc(rantzExit.x, rantzExit.z, rantzExit.id, 1);
            await sdk.waitForTicks(5);
        }
    }

    // 3. Gu'Tanoth Gate (2526, 3063) & Watchtower (2546, 3114)
    await bot.walkTo(2526, 3063, 4);
    await sweepCurrentArea(bot, sdk, 'GuTanoth North Gate (Ogre guard, City guard)');

    await bot.walkTo(2547, 3113, 3);
    await sweepCurrentArea(bot, sdk, 'Watchtower Ground Floor (Watchtower Guard)');
    for (let lvl = 0; lvl < 2; lvl++) {
        const l = sdk.findNearbyLoc(/ladder/i);
        if (l) {
            await sdk.sendInteractLoc(l.x, l.z, l.id, 1);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Watchtower L${lvl + 1} (Watchtower Wizard)`);
        }
    }
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        const l = sdk.findNearbyLoc(/ladder/i);
        if (l) {
            await sdk.sendInteractLoc(l.x, l.z, l.id, 1);
            await sdk.waitForTicks(4);
        } else break;
    }

    // 4. Observatory Reception (2439, 3159) & Tracker Gnomes
    await bot.walkTo(2440, 3158, 2);
    await sweepCurrentArea(bot, sdk, 'Observatory Reception (Professor, Assistant)');
    await bot.walkTo(2501, 3261, 3);
    await sweepCurrentArea(bot, sdk, 'Tracker Gnome 1 (2501, 3261)');
    await bot.walkTo(2524, 3256, 3);
    await sweepCurrentArea(bot, sdk, 'Tracker Gnome 2 (2524, 3256)');
    await bot.walkTo(2497, 3234, 3);
    await sweepCurrentArea(bot, sdk, 'Tracker Gnome 3 (2497, 3234)');
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

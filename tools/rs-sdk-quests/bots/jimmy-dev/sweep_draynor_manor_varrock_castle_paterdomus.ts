import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647
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
            n.optionsWithIndex.some((o: any) => /^(talk-to|trade)$/i.test(o.text))
        );
        if (npcs.length === 0) break;
        const target = npcs[0];
        await testNpc(bot, sdk, target);
    }
}

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 1. Lumbridge Castle Upstairs (Duke Horacio on L1 at 3210, 3220)
    await bot.walkTo(3206, 3209, 2);
    const lumStairs = sdk.findNearbyLoc(/staircase/i);
    if (lumStairs) {
        await bot.interactLoc(lumStairs, /climb-up/i);
        await sdk.waitForTicks(4);
        await bot.walkTo(3210, 3220, 2);
        await sweepCurrentArea(bot, sdk, 'Lumbridge Castle L1 (Duke Horacio, Hans)');
        await bot.walkTo(3206, 3209, 2);
        const lumStairsDown = sdk.findNearbyLoc(/staircase/i);
        if (lumStairsDown) {
            await bot.interactLoc(lumStairsDown, /climb-down/i);
            await sdk.waitForTicks(4);
        }
    }

    // 2. Draynor Manor -> Professor Oddenstein on L2
    await bot.walkTo(3108, 3353, 2);
    const manorDoor = sdk.findNearbyLoc(/large door/i);
    if (manorDoor) {
        await sdk.sendInteractLoc(manorDoor.x, manorDoor.z, manorDoor.id, 1);
        await sdk.waitForTicks(4);
    }
    await bot.walkTo(3108, 3360, 2);
    const s1 = sdk.findNearbyLoc(/staircase/i);
    if (s1) {
        await bot.interactLoc(s1, /climb-up/i);
        await sdk.waitForTicks(4);
        await bot.walkTo(3105, 3363, 2);
        const s2 = sdk.findNearbyLoc(/ladder|staircase/i);
        if (s2) {
            await bot.interactLoc(s2, /climb-up/i);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, 'Draynor Manor L2 (Professor Oddenstein)');
            const s2d = sdk.findNearbyLoc(/ladder|staircase/i);
            if (s2d) {
                await bot.interactLoc(s2d, /climb-down/i);
                await sdk.waitForTicks(4);
            }
        }
        await bot.walkTo(3108, 3362, 2);
        const s1d = sdk.findNearbyLoc(/staircase/i);
        if (s1d) {
            await bot.interactLoc(s1d, /climb-down/i);
            await sdk.waitForTicks(4);
        }
    }
    // Exit Draynor Manor via back door (3123, 3360)
    await bot.walkTo(3123, 3360, 3);
    const backDoor = sdk.findNearbyLoc(/door/i);
    if (backDoor && backDoor.optionsWithIndex.some((o: any) => /open/i.test(o.text))) {
        await bot.interactLoc(backDoor, /open/i);
        await sdk.waitForTicks(3);
    }

    // 3. Gertrude's House, Champions Guild, Varrock Castle, Varrock Museum, Jolly Boar Inn, Paterdomus
    const waypoints = [
        { x: 3151, z: 3413, label: 'Gertrudes House (Gertrude, Fluffs)' },
        { x: 3191, z: 3362, label: 'Champions Guild Outside / Door' },
        { x: 3212, z: 3475, label: 'Varrock Palace Ground Floor (King Roald, Sir Prysin, Reldo)' },
        { x: 3256, z: 3448, label: 'Varrock Museum (Curator)' },
        { x: 3279, z: 3495, label: 'Jolly Boar Inn (Bartender, Cook)' },
        { x: 3405, z: 3489, label: 'Paterdomus Temple (Drezel / Monk of Zamorak)' },
    ];

    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 3);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

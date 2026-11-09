import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 12, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647, 780,
    648, 638, 342, 337, 339, 341, 732, 554, 664, 646, 883,
    538, 801, 803, 526, 527, 577, 580, 736, 606, 581, 584, 36, 599, 582, 594, 382, 895,
    579, 657, 376, 377, 378, 558, 556, 583, 559, 734, 375, 744, 557, 604
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
    // 1. We are on the Entrana ship at (2836, 3332, L2). Climb down to L1 and cross Gangplank!
    if ((sdk.getState()?.player?.level ?? 0) === 2) {
        const shipLadder = sdk.findNearbyLoc(/ladder/i);
        if (shipLadder) {
            const downOpt = shipLadder.optionsWithIndex.find((o: any) => /down/i.test(o.text)) || shipLadder.optionsWithIndex[0];
            await sdk.sendInteractLoc(shipLadder.x, shipLadder.z, shipLadder.id, downOpt.opIndex);
            await sdk.waitForTicks(4);
        }
    }
    if ((sdk.getState()?.player?.level ?? 0) === 1) {
        const plank = sdk.findNearbyLoc(/gangplank/i);
        if (plank) {
            await sdk.sendInteractLoc(plank.x, plank.z, plank.id, 1);
            await sdk.waitForTicks(4);
        }
    }
    console.log(`Pos on Entrana: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    if ((sdk.getState()?.player?.worldX ?? 3000) < 2900) {
        await bot.walkTo(2845, 3336, 3);
        await sweepCurrentArea(bot, sdk, 'Entrana South (Frincos)');
        await bot.walkTo(2851, 3349, 2);
        await sweepCurrentArea(bot, sdk, 'Entrana Church (High Priest, Monk)');
        await bot.walkTo(2822, 3374, 3);
        await sweepCurrentArea(bot, sdk, 'Entrana North Cave (Cave monk)');

        // Sail back to Port Sarim
        await bot.walkTo(2834, 3335, 3);
        const monkBack = sdk.findNearbyNpc(/monk of entrana/i);
        if (monkBack) {
            await testNpc(bot, sdk, monkBack);
            await bot.interactNpc(monkBack, /take-boat/i);
            await sdk.waitForTicks(14);
            await dismissAllDialogs(bot, sdk);
            if ((sdk.getState()?.player?.level ?? 0) === 1) {
                const plank = sdk.findNearbyLoc(/gangplank/i);
                if (plank) {
                    await sdk.sendInteractLoc(plank.x, plank.z, plank.id, 1);
                    await sdk.waitForTicks(4);
                }
            }
        }
    }
    console.log(`Pos back at Port Sarim: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 2. Sweep Draynor Jail (Joe, Lady Keli, Prince Ali) & Falador Castle
    const waypoints = [
        { x: 3085, z: 3250, label: 'Draynor Market' },
        { x: 3124, z: 3244, label: 'Draynor Jail (Joe, Lady Keli, Prince Ali)' },
        { x: 2957, z: 3338, label: 'Falador Castle West Ground Floor' },
        { x: 2982, z: 3338, label: 'Falador Castle East Ground Floor' },
    ];
    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 3);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);

        if (wp.label.includes('Falador Castle') && w.success) {
            for (let lvl = 0; lvl < 2; lvl++) {
                const s = sdk.findNearbyLoc(/staircase|ladder/i);
                if (s) {
                    await sdk.sendInteractLoc(s.x, s.z, s.id, 1);
                    await sdk.waitForTicks(4);
                    await sweepCurrentArea(bot, sdk, `${wp.label} L${lvl + 1}`);
                }
            }
            while ((sdk.getState()?.player?.level ?? 0) > 0) {
                const s = sdk.findNearbyLoc(/staircase|ladder/i);
                if (s) {
                    const downOpt = s.optionsWithIndex.find((o: any) => /down/i.test(o.text)) || s.optionsWithIndex[0];
                    await sdk.sendInteractLoc(s.x, s.z, s.id, downOpt.opIndex);
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

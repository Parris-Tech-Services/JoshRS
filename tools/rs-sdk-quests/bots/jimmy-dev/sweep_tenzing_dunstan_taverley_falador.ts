import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 12, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647, 780,
    648, 638, 342, 337, 339, 341, 732, 554, 664, 646, 883,
    538, 801, 803, 526, 527, 577, 580, 736, 606, 581, 584, 36, 599, 582, 594, 382, 895,
    579, 657, 658, 222, 216, 656, 919,
    1079, 1087, 1060, 1061, 1062, 1063, 1064, 1065, 1066, 1067, 1068, 1073, 1074, 1076, 1077, 1081, 1085, 1089, 1092, 1086,
    1088, 1083, 1084, 1070,
    796, 586, 587, 1213, 250, 455
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
    // 1. Tenzing inside his hut (2820, 3555)
    await bot.walkTo(2820, 3555, 1);
    await sweepCurrentArea(bot, sdk, 'Tenzing Hut (Tenzing)');

    // 2. Dunstan (2919, 3574)
    await bot.walkTo(2919, 3574, 2);
    await sweepCurrentArea(bot, sdk, 'Burthorpe Anvil (Dunstan)');

    // 3. Burthorpe Castle L1 (Eohric at 2898, 3562, L1)
    await bot.walkTo(2898, 3565, 2);
    const castleStair = sdk.findNearbyLoc(/staircase|stairs/i);
    if (castleStair) {
        await bot.interactLoc(castleStair, /climb-up|climb/i);
        await sdk.waitForTicks(4);
        await sweepCurrentArea(bot, sdk, 'Burthorpe Castle L1 (Eohric)');
        const downStair = sdk.findNearbyLoc(/staircase|stairs/i);
        if (downStair) {
            await bot.interactLoc(downStair, /climb-down|climb/i);
            await sdk.waitForTicks(4);
        }
    }

    // 4. Taverley Upstairs (Sanfew on L1 at 2899, 3428)
    await bot.walkTo(2899, 3428, 2);
    const sanfewLadder = sdk.findNearbyLoc(/ladder|staircase/i);
    if (sanfewLadder) {
        await bot.interactLoc(sanfewLadder, /climb-up|climb/i);
        await sdk.waitForTicks(4);
        await sweepCurrentArea(bot, sdk, 'Taverley Herblore L1 (Sanfew)');
        const sanfewDown = sdk.findNearbyLoc(/ladder|staircase/i);
        if (sanfewDown) {
            await bot.interactLoc(sanfewDown, /climb-down|climb/i);
            await sdk.waitForTicks(4);
        }
    }

    // 5. Falador Castle L2 (Sir Amik Varze at 2961, 3338, L2; Sir Vyvin at 2982, 3338, L2)
    await bot.walkTo(2957, 3338, 2);
    for (let lvl = 0; lvl < 2; lvl++) {
        const s = sdk.findNearbyLoc(/staircase|ladder/i);
        if (s) {
            await bot.interactLoc(s, /climb-up|climb/i);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Falador Castle West L${lvl + 1} (Sir Amik Varze)`);
        }
    }
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        const s = sdk.findNearbyLoc(/staircase|ladder/i);
        if (s) {
            await bot.interactLoc(s, /climb-down|climb/i);
            await sdk.waitForTicks(4);
        } else break;
    }

    await bot.walkTo(2984, 3338, 2);
    for (let lvl = 0; lvl < 2; lvl++) {
        const s = sdk.findNearbyLoc(/staircase|ladder/i);
        if (s) {
            await bot.interactLoc(s, /climb-up|climb/i);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Falador Castle East L${lvl + 1} (Sir Vyvin)`);
        }
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

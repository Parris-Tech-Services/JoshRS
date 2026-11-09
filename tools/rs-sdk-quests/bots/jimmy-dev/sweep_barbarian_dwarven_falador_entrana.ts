import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 12, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647, 780,
    648, 638, 342, 337, 339, 341, 732, 554, 664, 646, 883,
    538, 801, 803, 526, 527, 577, 580, 736, 606, 581, 584, 36, 599, 582, 594, 382, 895
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
    // 1. Barbarian Village (3080, 3421)
    await bot.walkTo(3080, 3421, 3);
    await sweepCurrentArea(bot, sdk, 'Barbarian Village (Gunthor, Barbarian woman)');

    // 2. Dwarven Mine (ladder at 3019, 3450 -> 3019, 9850 -> Drogo at 3031, 9846, Boot at 2984, 9810)
    await bot.walkTo(3019, 3450, 2);
    const mineLadder = sdk.findNearbyLoc(/ladder|trapdoor/i);
    if (mineLadder) {
        await sdk.sendInteractLoc(mineLadder.x, mineLadder.z, mineLadder.id, 1);
        await sdk.waitForTicks(5);
        console.log(`In Dwarven Mine: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await bot.walkTo(3031, 9846, 3);
        await sweepCurrentArea(bot, sdk, 'Dwarven Mine Drogo (Drogo)');
        await bot.walkTo(2984, 9810, 4);
        await sweepCurrentArea(bot, sdk, 'Dwarven Mine South-West (Boot)');
        await bot.walkTo(3019, 9850, 2);
        const upLadder = sdk.findNearbyLoc(/ladder/i);
        if (upLadder) {
            await sdk.sendInteractLoc(upLadder.x, upLadder.z, upLadder.id, 1);
            await sdk.waitForTicks(5);
        }
    }

    // 3. Falador Castle Upstairs (Sir Amik Varze at 2961, 3338, L2; Sir Vyvin at 2982, 3338, L2)
    await bot.walkTo(2958, 3338, 2);
    for (let lvl = 0; lvl < 2; lvl++) {
        const s = sdk.findNearbyLoc(/staircase/i);
        if (s) {
            await sdk.sendInteractLoc(s.x, s.z, s.id, 1);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Falador Castle West L${lvl + 1} (Sir Amik Varze)`);
        }
    }
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        const s = sdk.findNearbyLoc(/staircase/i);
        if (s) {
            const downOpt = s.optionsWithIndex.find((o: any) => /down/i.test(o.text)) || s.optionsWithIndex[0];
            await sdk.sendInteractLoc(s.x, s.z, s.id, downOpt.opIndex);
            await sdk.waitForTicks(4);
        } else break;
    }

    // 4. Port Sarim -> Monk of Entrana (3047, 3236) -> Entrana (Frincos, High Priest, Cave monk)
    await bot.walkTo(3047, 3236, 3);
    const monk = sdk.findNearbyNpc(/monk of entrana/i);
    if (monk) {
        console.log(`\n--- Testing Monk of Entrana (id=${monk.id}) at (${monk.x}, ${monk.z}) ---`);
        await bot.talkTo(monk);
        for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
            const d = sdk.getDialog();
            const yesOpt = d?.options?.find((o: any) => /yes|okay|ready/i.test(o.text));
            if (yesOpt) {
                await sdk.sendClickDialog(yesOpt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(3);
        }
        await sdk.waitForTicks(10);
        await dismissAllDialogs(bot, sdk);
        console.log(`Pos after Entrana ship: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
        if ((sdk.getState()?.player?.level ?? 0) === 1) {
            const plank = sdk.findNearbyLoc(/gangplank/i);
            if (plank) {
                await sdk.sendInteractLoc(plank.x, plank.z, plank.id, 1);
                await sdk.waitForTicks(4);
            }
        }
        if ((sdk.getState()?.player?.worldX ?? 3000) < 2900) {
            await bot.walkTo(2845, 3336, 3);
            await sweepCurrentArea(bot, sdk, 'Entrana South (Frincos)');
            await bot.walkTo(2851, 3349, 3);
            await sweepCurrentArea(bot, sdk, 'Entrana Church (High Priest, Monk)');
            await bot.walkTo(2822, 3374, 3);
            await sweepCurrentArea(bot, sdk, 'Entrana North Cave (Cave monk)');
        }
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

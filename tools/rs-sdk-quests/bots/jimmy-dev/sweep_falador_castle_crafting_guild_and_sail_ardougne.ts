import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 12, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647, 780,
    648, 638, 342, 337, 339, 341, 732, 554, 664, 646, 883,
    538, 801, 803, 526, 527, 577, 580, 736, 606, 581, 584, 36, 599, 582, 594, 382, 895,
    579, 657, 658, 222, 216, 656, 919,
    1079, 1087, 1060, 1061, 1062, 1063, 1064, 1065, 1066, 1067, 1068, 1073, 1074, 1076, 1077, 1081, 1085, 1089, 1092, 1086,
    1088, 1083, 1084, 1070, 1082, 1080, 454, 608,
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
    // 1. We are on L1 of Falador Castle at (2960, 3349). Climb down to L0 first!
    for (let tries = 0; tries < 5 && (sdk.getState()?.player?.level ?? 0) > 0; tries++) {
        const stairs = sdk.getNearbyLocs().filter((l: any) => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /down/i.test(o.text)));
        if (stairs.length > 0) {
            await bot.interactLoc(stairs[0], /climb-down|down/i);
            await sdk.waitForTicks(4);
        } else {
            await bot.walkTo(2956, 3338, 2);
        }
    }
    console.log(`On L0: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 2. Climb East Falador Castle to Sir Vyvin on L2 (staircase at 2984, 3337)
    await bot.walkTo(2984, 3338, 2);
    for (let lvl = 0; lvl < 2; lvl++) {
        const s = sdk.getNearbyLocs().find((l: any) => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /up/i.test(o.text)));
        if (s) {
            await bot.interactLoc(s, /climb-up|up/i);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Falador Castle East L${lvl + 1} (Sir Vyvin)`);
        }
    }
    for (let tries = 0; tries < 5 && (sdk.getState()?.player?.level ?? 0) > 0; tries++) {
        const s = sdk.getNearbyLocs().find((l: any) => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some((o: any) => /down/i.test(o.text)));
        if (s) {
            await bot.interactLoc(s, /climb-down|down/i);
            await sdk.waitForTicks(4);
        }
    }

    // 3. Pickpocket Men/Women in Port Sarim / Rimmington / Falador up to 66 coins
    await bot.walkTo(3012, 3235, 4);
    for (let tries = 0; tries < 30 && (sdk.findInventoryItem(/coins/i)?.count ?? 0) < 66; tries++) {
        const citizen = sdk.getNearbyNpcs().find((n: any) => /^(man|woman)$/i.test(n.name) && n.reachable);
        if (citizen) {
            await bot.pickpocketNpc(citizen);
            await sdk.waitForTicks(3);
        } else {
            await bot.walkTo(3095, 3260, 4);
        }
    }
    console.log(`Coins now: ${sdk.findInventoryItem(/coins/i)?.count ?? 0}`);

    // 4. Sail Port Sarim (3027, 3218) -> Musa Point (2956, 3146) -> Brimhaven (2772, 3229) -> Ardougne (2683, 3271)
    await bot.walkTo(3027, 3218, 3);
    const seaman = sdk.findNearbyNpc(/captain tobias|seaman/i);
    if (seaman) {
        await bot.talkTo(seaman);
        for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
            const d = sdk.getDialog();
            const yesOpt = d?.options?.find((o: any) => /yes/i.test(o.text));
            if (yesOpt) await sdk.sendClickDialog(yesOpt.index);
            else await sdk.sendClickDialog(0);
            await sdk.waitForTicks(3);
        }
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

    // Walk across Karamja to Brimhaven Captain Barnaby (2772, 3229)
    if ((sdk.getState()?.player?.worldX ?? 3000) < 2970) {
        await bot.walkTo(2772, 3229, 3);
        const barnaby = sdk.findNearbyNpc(/captain barnaby/i);
        if (barnaby) {
            await bot.talkTo(barnaby);
            for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
                const d = sdk.getDialog();
                const yesOpt = d?.options?.find((o: any) => /yes/i.test(o.text));
                if (yesOpt) await sdk.sendClickDialog(yesOpt.index);
                else await sdk.sendClickDialog(0);
                await sdk.waitForTicks(3);
            }
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
    console.log(`Pos in Ardougne: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

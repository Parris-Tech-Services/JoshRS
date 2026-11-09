import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    0, 1, 2, 3, 4, 5, 6, 278, 519, 456, 758, 970, 917, 922, 918, 755, 915, 285,
    639, 882, 546, 547, 781, 783, 548, 522, 641, 551, 552, 645, 550, 549, 553, 368, 640, 731, 756, 647, 780,
    648, 638, 342, 337, 339, 341, 732, 554, 664
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
    // 1. Paterdomus Temple (3405, 3489)
    await bot.walkTo(3405, 3489, 2);
    const templeDoor = sdk.findNearbyLoc(/large door/i);
    if (templeDoor) {
        console.log('Paterdomus door opts:', JSON.stringify(templeDoor.optionsWithIndex));
        const knockOpt = templeDoor.optionsWithIndex.find((o: any) => /knock/i.test(o.text));
        if (knockOpt) {
            await sdk.sendInteractLoc(templeDoor.x, templeDoor.z, templeDoor.id, knockOpt.opIndex);
            await sdk.waitForTicks(4);
            console.log(`Knock-at Paterdomus door: dlgOpen=${sdk.getDialog()?.isOpen}`);
            await dismissAllDialogs(bot, sdk);
        }
        const openOpt = templeDoor.optionsWithIndex.find((o: any) => /open/i.test(o.text));
        if (openOpt) {
            await sdk.sendInteractLoc(templeDoor.x, templeDoor.z, templeDoor.id, openOpt.opIndex);
            await sdk.waitForTicks(4);
        }
    }
    await bot.walkTo(3415, 3489, 2);
    await sweepCurrentArea(bot, sdk, 'Paterdomus Temple Ground Floor (Monk of Zamorak)');
    for (let lvl = 0; lvl < 2; lvl++) {
        const l = sdk.findNearbyLoc(/ladder|stair/i);
        if (l) {
            await sdk.sendInteractLoc(l.x, l.z, l.id, 1);
            await sdk.waitForTicks(4);
            await sweepCurrentArea(bot, sdk, `Paterdomus Temple L${lvl + 1} (Drezel)`);
            const cellDoor = sdk.findNearbyLoc(/cell door/i);
            if (cellDoor) {
                const talkOpt = cellDoor.optionsWithIndex.find((o: any) => /talk/i.test(o.text)) || cellDoor.optionsWithIndex[0];
                if (talkOpt) {
                    await sdk.sendInteractLoc(cellDoor.x, cellDoor.z, cellDoor.id, talkOpt.opIndex);
                    await sdk.waitForTicks(4);
                    console.log(`Cell door Talk-through: dlgOpen=${sdk.getDialog()?.isOpen}`);
                    await dismissAllDialogs(bot, sdk);
                }
            }
        }
    }
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        const l = sdk.findNearbyLoc(/ladder|stair/i);
        if (l) {
            const downOpt = l.optionsWithIndex.find((o: any) => /down/i.test(o.text)) || l.optionsWithIndex[0];
            await sdk.sendInteractLoc(l.x, l.z, l.id, downOpt.opIndex);
            await sdk.waitForTicks(4);
        } else break;
    }

    // 2. Jolly Boar Inn Inside (3277, 3490), Lumber Yard, Varrock Museum Inside (3256, 3445), Champions Guild (3191, 3360), Barbarian Village (3081, 3421)
    const waypoints = [
        { x: 3277, z: 3490, label: 'Jolly Boar Inn Inside (Bartender, Cook)' },
        { x: 3256, z: 3445, label: 'Varrock Museum Inside (Curator)' },
        { x: 3205, z: 3472, label: 'Varrock Palace Sir Prysin (3205, 3472)' },
        { x: 3190, z: 3360, label: 'Champions Guild Inside (Guildmaster, Scavvo, Valaine)' },
        { x: 3080, z: 3421, label: 'Barbarian Village (Gunthor, Litara)' },
        { x: 3047, z: 3236, label: 'Port Sarim Entrana Monks (Monk of Entrana)' },
    ];

    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 2);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 240_000,
});

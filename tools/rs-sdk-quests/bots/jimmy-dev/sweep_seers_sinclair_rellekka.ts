import { runScript } from '../../sdk/runner';

const visitedIds = new Set<number>([
    168, 169, 67, 68, 66, 670, 851, 850, 600, 849, 848, 1407, 160, 159, 603, 480, 602, 676,
    227, 226, 230, 679
]);

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
        console.log(`Talk-to result: success=${res.success}, msg="${res.message}", dlgOpen=${dlg?.isOpen}, dlgText=${JSON.stringify(dlg?.text)}, options=${JSON.stringify(dlg?.options?.map((o: any) => o.text))}, newChat=${JSON.stringify(newChat.map((c: any) => c.text))}, rejectedDelta=${newRejected - prevRejected}`);

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
        if (sdk.getState()?.interface?.isOpen) {
            await bot.closeInterface();
            await sdk.waitForTicks(1);
        }
    }

    if (hasTrade) {
        const live = sdk.getNearbyNpcs().find((n: any) => n.id === npc.id && n.reachable);
        if (live) {
            const res = await bot.openShop(live);
            await sdk.waitForTicks(2);
            const st = sdk.getState();
            console.log(`Trade result: success=${res.success}, msg="${res.message}", shopOpen=${st?.shop?.isOpen}, title="${st?.shop?.title}", items=${st?.shop?.shopItems?.length}`);
            if (st?.shop?.isOpen || st?.interface?.isOpen) {
                await bot.closeInterface();
                await sdk.waitForTicks(1);
            }
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
    // Sweep Gnomeball and Brimstail inside Tree Gnome Stronghold before exiting
    await bot.walkTo(2408, 3448, 4);
    await sweepCurrentArea(bot, sdk, 'Gnomeball Field (Referee, Coach, Cheerleader)');
    await bot.walkTo(2395, 3448, 4);
    await sweepCurrentArea(bot, sdk, 'Gnomeball Pitch West (Gnome ball referee, Gnome coach)');
    await bot.walkTo(2403, 3419, 4);
    const cave = sdk.findNearbyLoc(/cave entrance/i);
    if (cave) {
        await sdk.sendInteractLoc(cave.x, cave.z, cave.id, 1);
        await sdk.waitForTicks(6);
        await sweepCurrentArea(bot, sdk, 'Brimstail Cave');
        const exitCave = sdk.findNearbyLoc(/cave exit|tunnel/i);
        if (exitCave) {
            await sdk.sendInteractLoc(exitCave.x, exitCave.z, exitCave.id, 1);
            await sdk.waitForTicks(6);
        }
    }

    // Exit Tree Gnome Stronghold through Gate at (2461, 3385)
    const p0 = sdk.getState()?.player;
    if (p0 && p0.worldX < 2490 && p0.worldZ > 3383) {
        await bot.walkTo(2461, 3385, 2);
        const gate = sdk.findNearbyLoc(/^gate$/i);
        if (gate) {
            console.log(`Opening Stronghold Gate id=${gate.id} at (${gate.x}, ${gate.z})`);
            await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
            await sdk.waitForTicks(8);
            console.log(`After gate pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        }
    }

    const waypoints = [
        { x: 2604, z: 3401, label: 'Fishing Guild Entrance (Master fisher)' },
        { x: 2638, z: 3441, label: 'Hemenster (Austri, Vestri, Grandpa Jack)' },
        { x: 2700, z: 3428, label: 'Witchaven / Ardougne East Road (Ezekial Lovecraft, Brother Cedric, Caroline, Holgart)' },
        { x: 2716, z: 3472, label: 'Seers Village South (Phantuwti, Stankers, Seer)' },
        { x: 2725, z: 3491, label: 'Seers Village Pub (Bartender, Poison salesman, Forester)' },
        { x: 2701, z: 3505, label: 'Seers Village Geoffrey Flax / Thormac' },
        { x: 2742, z: 3556, label: 'Sinclair Mansion Courtyard (Stanford, Pierre)' },
        { x: 2742, z: 3574, label: 'Sinclair Mansion Ground Floor (Louisa, Mary, Hobbes, Donovan)' },
        { x: 2659, z: 3658, label: 'Rellekka Center (Brundt, Pontak, Sigli, Yrsa, Skulgrimen, Fur trader)' },
        { x: 2678, z: 3668, label: 'Rellekka East (Olaf the Bard, Swensen, Blanin)' },
        { x: 2633, z: 3665, label: 'Rellekka West (Peer the Seer, Thorvald, Sasha)' },
        { x: 2658, z: 3674, label: 'Rellekka Longhall (Manni, Thora, Sigmund, Agnar, Freidir, Borrokar, Lanzig)' },
        { x: 2642, z: 3695, label: 'Rellekka Docks (Sailor, Fisherman, Jarvald, Maria Gunnars)' },
    ];

    for (const wp of waypoints) {
        console.log(`\n>>> Walking to ${wp.label} (${wp.x}, ${wp.z})...`);
        const w = await bot.walkTo(wp.x, wp.z, 5);
        console.log(`Walk: ${w.success} (${w.message}) pos=(${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
        await sweepCurrentArea(bot, sdk, wp.label);
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 300_000,
});

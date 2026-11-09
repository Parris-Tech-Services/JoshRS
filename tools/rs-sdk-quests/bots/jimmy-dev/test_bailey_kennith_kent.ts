import { runScript } from '../../sdk/runner';

async function dismissAllDialogs(bot: any, sdk: any) {
    let safety = 0;
    while (sdk.getDialog()?.isOpen && safety < 20) {
        safety++;
        const d = sdk.getDialog();
        if (d.options && d.options.length > 0) {
            const opt = d.options[0];
            await sdk.sendClickDialog(opt.index);
        } else {
            await sdk.sendClickDialog(0);
        }
        await sdk.waitForTicks(2);
    }
}

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 1. We are on L1 (2785, 3279). Walk west on L1 to (2765, 3286) where Kennith is
    await bot.walkTo(2765, 3286, 2);
    const kennith = sdk.findNearbyNpc(/kennith/i);
    if (kennith) {
        console.log(`\n--- Testing Kennith (id=${kennith.id}, idx=${kennith.index}) at (${kennith.x}, ${kennith.z}) reachable=${kennith.reachable} ---`);
        const wall = sdk.getNearbyLocs().find((l: any) => l.x === 2765 && l.z === 3287) || sdk.findNearbyLoc(/wall/i);
        console.log('Nearby locs near Kennith:', sdk.getNearbyLocs().slice(0, 10).map((l: any) => `${l.name}(id=${l.id})@(${l.x},${l.z}) opts=${JSON.stringify(l.optionsWithIndex)}`));
        if (wall) {
            await sdk.sendInteractLoc(wall.x, wall.z, wall.id, 1);
            await sdk.waitForTicks(4);
            console.log(`After clicking wall (${wall.id}): dlgOpen=${sdk.getDialog()?.isOpen}`);
            await dismissAllDialogs(bot, sdk);
        }
    }

    // 2. Climb down ladder on L1 at (2784, 3287)
    await bot.walkTo(2784, 3286, 2);
    const ladderDown = sdk.findNearbyLoc(/ladder/i);
    if (ladderDown) {
        await bot.interactLoc(ladderDown, /climb-down|climb/i);
        await sdk.waitForTicks(4);
    }
    console.log(`Pos on L0: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 3. Test Bailey (id=697) in north-west room (2764, 3285)
    await bot.walkTo(2768, 3285, 2);
    const door = sdk.getNearbyLocs().find((l: any) => /door/i.test(l.name) && Math.abs(l.x - 2767) <= 2 && Math.abs(l.z - 3285) <= 2);
    if (door && door.optionsWithIndex.some((o: any) => /open/i.test(o.text))) {
        await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
        await sdk.waitForTicks(3);
    }
    await bot.walkTo(2764, 3285, 2);
    const bailey = sdk.findNearbyNpc(/bailey/i);
    if (bailey) {
        console.log(`\n--- Testing Bailey (id=${bailey.id}, idx=${bailey.index}) at (${bailey.x}, ${bailey.z}) ---`);
        const res = await bot.talkTo(bailey);
        await sdk.waitForTicks(3);
        console.log(`Bailey Talk-to: success=${res.success}, msg="${res.message}", dlgOpen=${sdk.getDialog()?.isOpen}`);
        await dismissAllDialogs(bot, sdk);
    }

    // 4. Talk to Holgart on L0 (2782, 3277) to sail to Kent's island
    await bot.walkTo(2782, 3276, 2);
    const holgartPlat = sdk.findNearbyNpc(/holgart/i);
    if (holgartPlat) {
        await bot.talkTo(holgartPlat);
        await dismissAllDialogs(bot, sdk);
        await sdk.waitForTicks(6);
        await dismissAllDialogs(bot, sdk);
    }
    console.log(`Pos after Holgart platform chat: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 5. Test Kent and Holgart on the island
    for (const npc of sdk.getNearbyNpcs().filter((n: any) => n.optionsWithIndex.some((o: any) => /talk-to/i.test(o.text)))) {
        console.log(`\n--- Testing Island NPC: ${npc.name} (id=${npc.id}, idx=${npc.index}) at (${npc.x}, ${npc.z}) ---`);
        const res = await bot.talkTo(npc);
        await sdk.waitForTicks(3);
        console.log(`Talk-to ${npc.name}: success=${res.success}, msg="${res.message}", dlgOpen=${sdk.getDialog()?.isOpen}`);
        await dismissAllDialogs(bot, sdk);
        await sdk.waitForTicks(4);
    }
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 180_000,
});

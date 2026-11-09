import { runScript } from '../../sdk/runner';

async function dismissAllDialogs(bot: any, sdk: any) {
    let safety = 0;
    while (sdk.getDialog()?.isOpen && safety < 25) {
        safety++;
        const d = sdk.getDialog();
        if (d.options && d.options.length > 0) {
            const opt = d.options.find((o: any) => /shore|land|back|yes|okay/i.test(o.text)) || d.options[0];
            await sdk.sendClickDialog(opt.index);
        } else {
            await sdk.sendClickDialog(0);
        }
        await sdk.waitForTicks(2);
    }
}

await runScript(async ({ bot, sdk }) => {
    await dismissAllDialogs(bot, sdk);

    // 1. Climb ladder at (2784, 3286) to L1
    await bot.walkTo(2784, 3285, 1);
    const ladderUp = sdk.findNearbyLoc(/ladder/i);
    if (ladderUp) {
        await sdk.sendInteractLoc(ladderUp.x, ladderUp.z, ladderUp.id, 1);
        await sdk.waitForTicks(5);
    }
    console.log(`On L1: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 2. Walk to (2764, 3286) and Shout-across Crates (id=2519) at (2764, 3287) to talk to Kennith (id=697)
    await bot.walkTo(2764, 3286, 1);
    const crates = sdk.getNearbyLocs().find((l: any) => l.id === 2519);
    if (crates) {
        console.log(`Clicking Shout-across on Crates (id=${crates.id}) at (${crates.x}, ${crates.z})`);
        await sdk.sendInteractLoc(crates.x, crates.z, crates.id, 1);
        await sdk.waitForTicks(4);
        console.log(`Kennith dialog open: ${sdk.getDialog()?.isOpen}`);
        await dismissAllDialogs(bot, sdk);
    }

    // 3. Climb down ladder at (2784, 3286) to L0
    await bot.walkTo(2784, 3286, 1);
    const ladderDown = sdk.findNearbyLoc(/ladder/i);
    if (ladderDown) {
        await sdk.sendInteractLoc(ladderDown.x, ladderDown.z, ladderDown.id, 1);
        await sdk.waitForTicks(5);
    }
    console.log(`Back on L0: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 4. Talk to Holgart (id=699) on platform to sail to Kent's island
    await bot.walkTo(2782, 3276, 2);
    const holgartPlat = sdk.findNearbyNpc(/holgart/i);
    if (holgartPlat) {
        await bot.talkTo(holgartPlat);
        await dismissAllDialogs(bot, sdk);
        await sdk.waitForTicks(6);
        await dismissAllDialogs(bot, sdk);
    }
    console.log(`Pos on Kent's island: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // 5. Talk to Kent and Holgart on the island
    const kent = sdk.findNearbyNpc(/kent/i);
    if (kent) {
        console.log(`\n--- Testing Kent (id=${kent.id}, idx=${kent.index}) at (${kent.x}, ${kent.z}) ---`);
        const res = await bot.talkTo(kent);
        await sdk.waitForTicks(3);
        console.log(`Kent Talk-to: success=${res.success}, dlgOpen=${sdk.getDialog()?.isOpen}`);
        await dismissAllDialogs(bot, sdk);
    }

    const holgartIsl = sdk.findNearbyNpc(/holgart/i);
    if (holgartIsl) {
        console.log(`\n--- Testing Holgart on Island (id=${holgartIsl.id}, idx=${holgartIsl.index}) at (${holgartIsl.x}, ${holgartIsl.z}) ---`);
        const res = await bot.talkTo(holgartIsl);
        await sdk.waitForTicks(3);
        console.log(`Holgart Island Talk-to: success=${res.success}, dlgOpen=${sdk.getDialog()?.isOpen}`);
        await dismissAllDialogs(bot, sdk);
        await sdk.waitForTicks(6);
        await dismissAllDialogs(bot, sdk);
    }
    console.log(`Pos after Holgart island return: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

    // If back on Fishing Platform, talk to Holgart and choose "Will you take me back to shore?" (option 1)
    if ((sdk.getState()?.player?.worldX ?? 0) > 2750) {
        const holgartBack = sdk.findNearbyNpc(/holgart/i);
        if (holgartBack) {
            await bot.talkTo(holgartBack);
            for (let i = 0; i < 15 && sdk.getDialog()?.isOpen; i++) {
                const d = sdk.getDialog();
                const shoreOpt = d?.options?.find((o: any) => /shore|land|back/i.test(o.text));
                if (shoreOpt) {
                    await sdk.sendClickDialog(shoreOpt.index);
                } else {
                    await sdk.sendClickDialog(0);
                }
                await sdk.waitForTicks(3);
            }
            await sdk.waitForTicks(6);
            await dismissAllDialogs(bot, sdk);
        }
    }
    console.log(`Pos back on mainland: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);
}, {
    bot: 'jimmy-dev',
    gatewayUrl: 'ws://localhost:7781',
    disconnectAfter: true,
    timeout: 180_000,
});

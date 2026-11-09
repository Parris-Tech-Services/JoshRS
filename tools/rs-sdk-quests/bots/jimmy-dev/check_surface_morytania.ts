import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.walkTo(3405, 9905, 2);
    const ladder = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name));
    if (ladder) {
        await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
        await sdk.waitForTicks(5);
    }
    console.log(`Surface pos: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // Try walking east toward Canifis (3503, 3477)
    await bot.walkTo(3440, 3485, 4);
    console.log(`Pos after walk east: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    console.log('Nearby locs:', sdk.getNearbyLocs().slice(0, 12).map(l => `${l.name}(${l.id})@(${l.x},${l.z})`));
    console.log('Nearby npcs:', sdk.getNearbyNpcs().slice(0, 12).map(n => `${n.name}(${n.id})@(${n.x},${n.z})`));
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Pos: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    const locs = sdk.getNearbyLocs();
    console.log('Nearby locs:', locs.slice(0, 15).map(l => `${l.name}(${l.id})@(${l.x},${l.z}) ops=${l.options.map(o => `${o.index}:${o.text}`)}`));

    // Try oploc1 on trapdoor (1568) at (3405, 3507)
    const td = locs.find(l => l.id === 1568 || /trapdoor/i.test(l.name));
    if (td) {
        await sdk.sendInteractLoc(td.x, td.z, td.id, 1);
        await sdk.waitForTicks(5);
        console.log('After oploc1 on trapdoor:', sdk.getState().recentMessages);
        const td2 = sdk.getNearbyLocs().find(l => /trapdoor/i.test(l.name));
        console.log('Trapdoor now:', td2 ? `${td2.name}(${td2.id}) ops=${td2.options.map(o => `${o.index}:${o.text}`)}` : 'none');
        if (td2) {
            await sdk.sendInteractLoc(td2.x, td2.z, td2.id, 1);
            await sdk.waitForTicks(5);
        }
    }
    console.log(`Pos now: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

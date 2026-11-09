import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const locs = await sdk.scanNearbyLocs(25);
    const doors = locs.filter(l => /door|gate|barrier|holy|fence/i.test(l.name));
    console.log('Doors/gates nearby:', doors.map(d => `${d.name}(${d.id})@(${d.x},${d.z})`));

    // Walk to the eastern side of Paterdomus (3422, 3484)
    await bot.walkTo(3422, 3484, 2);
    console.log(`Pos: (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

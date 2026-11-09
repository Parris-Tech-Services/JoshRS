import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    console.log(`Starting in Morytania at (${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);

    // 1. Walk to Canifis (3503, 3477) for Stranger (id=1576, canafis_stranger)
    await bot.walkTo(3465, 3480, 4);
    await bot.walkTo(3503, 3477, 3);
    console.log(`At Canifis (3503, 3477): pos=(${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    console.log('Nearby NPCs in Canifis:', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));

    const stranger = sdk.getNearbyNpcs().find(n => n.id === 1576 || /stranger/i.test(n.name));
    if (stranger) {
        console.log(`Testing Talk-to on ${stranger.name} (id=${stranger.id})...`);
        const res = await bot.talkTo(stranger);
        console.log('Stranger Talk-to result:', JSON.stringify(res), 'dialog:', JSON.stringify(sdk.getDialog()));
        await sdk.waitForTicks(3);
        console.log('Recent messages after Stranger:', sdk.getState().recentMessages);
        while (sdk.getDialog()?.isOpen) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
    }

    // 2. Walk to (3544, 3462) for Werewolf (id=1665, waa_werewolf_guard)
    await bot.walkTo(3543, 3462, 3);
    console.log(`At Werewolf Agility entrance (3543, 3462): pos=(${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ})`);
    console.log('Nearby NPCs at (3543, 3462):', sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})@(${n.x},${n.z}) ops=${n.options.map(o => o.text)}`));
    console.log('Nearby Locs at (3543, 3462):', sdk.getNearbyLocs().slice(0, 10).map(l => `${l.name}(${l.id})@(${l.x},${l.z}) ops=${l.options.map(o => o.text)}`));

    const wwGuard = sdk.getNearbyNpcs().find(n => n.id === 1665 || /werewolf/i.test(n.name));
    if (wwGuard) {
        console.log(`Testing Talk-to on ${wwGuard.name} (id=${wwGuard.id})...`);
        const res = await bot.talkTo(wwGuard);
        console.log('Werewolf Guard Talk-to result:', JSON.stringify(res), 'dialog:', JSON.stringify(sdk.getDialog()));
        await sdk.waitForTicks(3);
        console.log('Recent messages after Werewolf Guard:', sdk.getState().recentMessages);
        while (sdk.getDialog()?.isOpen) {
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
    }

    // 3. Try climbing down ladder at (3543, 3463) (id=5132) to test 1660, 1661, 1662
    const ladder = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name));
    if (ladder) {
        console.log(`Climbing down ladder ${ladder.name}(${ladder.id}) at (${ladder.x},${ladder.z})...`);
        await sdk.sendInteractLoc(ladder.x, ladder.z, ladder.id, 1);
        await sdk.waitForTicks(5);
        console.log(`After ladder: pos=(${sdk.getState().player?.worldX}, ${sdk.getState().player?.worldZ}) dialog=${JSON.stringify(sdk.getDialog())} msgs=${JSON.stringify(sdk.getState().recentMessages)}`);
    }
}, {
    bot: 'jimmy-dev',
    server: 'localhost:7781',
    disconnectAfter: true,
});

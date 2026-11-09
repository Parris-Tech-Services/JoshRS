import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    await bot.walkTo(2461, 3382, 1);
    const gates = sdk.getNearbyLocs().filter(l => /gate/i.test(l.name));
    console.log('Gates near (2461,3382):', gates.map(g => `${g.name}(id=${g.id}, @${g.x},${g.z}, ops=${g.options.join('/')})`));
    const strongGate = gates.find(g => g.x >= 2460 && g.x <= 2462 && g.z >= 3382 && g.z <= 3384) ?? gates[0];
    if (strongGate) {
        await bot.interactLoc(strongGate, 'Open');
        for (let i = 0; i < 15; i++) {
            const d = sdk.getDialog();
            if (d?.isOpen) {
                console.log('Gate dialog:', d.allComponents?.map(c => c.text).filter(Boolean));
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
            if ((sdk.getState()?.player?.worldZ ?? 3382) >= 3385) break;
        }
    }
    console.log('Pos inside gate:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);

    const stepWalk = async (tx: number, tz: number) => {
        for (let i = 0; i < 20; i++) {
            const p = sdk.getState()?.player;
            if (!p) break;
            if (Math.hypot(p.worldX - tx, p.worldZ - tz) <= 3) break;
            await sdk.sendWalk(tx, tz, true);
            await sdk.waitForTicks(3);
        }
        console.log(`Now at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);
    };

    for (const [wx, wz] of [
        [2461, 3405],
        [2455, 3425],
        [2445, 3445],
        [2430, 3465],
        [2415, 3485],
        [2398, 3494],
    ]) {
        await stepWalk(wx, wz);
    }

    const npcs = sdk.getNearbyNpcs();
    console.log('NPCs at (2398, 3494):', npcs.map(n => `${n.name} (id=${n.id}, @${n.x},${n.z}, ops=${n.options.join('/')})`));
    const cheer = npcs.find(n => n.id === 636 || /cheerleader/i.test(n.name));
    if (cheer) {
        console.log(`Found ${cheer.name} (id=${cheer.id}) at (${cheer.x}, ${cheer.z}) reachable=${cheer.reachable}`);
        const res = await bot.talkTo(cheer);
        console.log('talkTo(Cheerleader 636):', JSON.stringify(res));
        console.log('Recent messages:', sdk.getState()?.gameMessages.slice(-5));
        await bot.dismissBlockingUI();
    }
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 60_000,
});

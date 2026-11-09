import { runScript } from '../../sdk/runner';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

await runScript(async ({ bot, sdk }) => {
    if (sdk.getState()?.dialog?.isOpen) {
        const yesOpt = sdk.getState()?.dialog?.options?.find((o: any) => /yeah|yes|continue/i.test(o.text));
        await sdk.sendClickDialog(yesOpt ? yesOpt.index : 1);
        await sleep(2500);
    }
    const pass = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 4031 || /shantay pass/i.test(l.name));
    if (pass && (sdk.getState()?.player?.worldZ ?? 3120) >= 3116) {
        await bot.interactLoc(pass, /go-through/i);
        for (let i = 0; i < 15 && (sdk.getState()?.player?.worldZ ?? 3120) >= 3116; i++) {
            await sleep(700);
            const d = sdk.getState()?.dialog;
            if (d?.isOpen) {
                const yesOpt = d.options?.find((o: any) => /yeah|yes|go|continue/i.test(o.text));
                await sdk.sendClickDialog(yesOpt ? yesOpt.index : 1);
            }
        }
    }
    console.log('Pos after Shantay pass:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
    if ((sdk.getState()?.player?.worldZ ?? 3120) >= 3116) {
        console.log('Still north of Shantay pass!');
        return;
    }

    await bot.walkTo(3240, 3080, 4);
    await bot.walkTo(3182, 3043, 3);
    await sleep(1000);
    console.log('NPCs near (3182,3043):', (sdk.getState()?.nearbyNpcs ?? []).map((n: any) => `${n.name} (id=${n.id}, idx=${n.index}) @ (${n.x},${n.z}) opts=${JSON.stringify(n.options)}`));

    await bot.walkTo(3165, 3033, 3);
    await sleep(1000);
    const npcs2 = sdk.getState()?.nearbyNpcs ?? [];
    console.log('NPCs near (3160,3031):', npcs2.map((n: any) => `${n.name} (id=${n.id}, idx=${n.index}) @ (${n.x},${n.z}) opts=${JSON.stringify(n.options)}`));

    const fighter = npcs2.find((n: any) => n.id === 1239 || /bedabin nomad fighter/i.test(n.name));
    if (fighter) {
        const beforeMsgs = (sdk.getState()?.gameMessages ?? []).length;
        const rt = await bot.talkTo(fighter);
        console.log('talkTo Bedabin Nomad Fighter (id=1239):', rt);
        await sleep(2500);
        console.log('Dialog after talkTo 1239:', JSON.stringify(sdk.getState()?.dialog, null, 2));
        console.log('Recent dialogs:', JSON.stringify(sdk.getState()?.recentDialogs?.slice(-3), null, 2));
        console.log('New messages:', (sdk.getState()?.gameMessages ?? []).slice(beforeMsgs));
    }
}, { timeout: 90_000, disconnectAfter: true });
process.exit(0);

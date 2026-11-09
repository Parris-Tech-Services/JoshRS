import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const pickOption = async (choiceRegex: RegExp) => {
        for (let i = 0; i < 20; i++) {
            const d = sdk.getDialog();
            if (!d || !d.isOpen) {
                await sdk.waitForTicks(1);
                continue;
            }
            const texts = d.allComponents?.map(c => c.text).filter(Boolean) ?? [];
            console.log(`Dialog step: ${JSON.stringify(texts)} | options: ${JSON.stringify(d.options?.map(o => o.text))}`);
            if (d.options && d.options.length > 1) {
                const res = await sdk.clickDialogByText(choiceRegex);
                console.log(`Clicked option ${choiceRegex}:`, res.message);
                await sdk.waitForTicks(2);
                return true;
            } else {
                await sdk.sendClickDialog(0);
                await sdk.waitForTicks(2);
            }
        }
        return false;
    };

    const fighter = sdk.findNearbyNpc(/^Bedabin Nomad Fighter$/i);
    if (!fighter) throw new Error('No Bedabin Nomad Fighter found');
    const talkRes = await bot.talkTo(fighter);
    console.log('talkTo:', talkRes.message);

    await pickOption(/What is this place/i);
    await pickOption(/Where is the Shantay Pass/i);
    await pickOption(/Okay, thanks/i);

    for (let i = 0; i < 6; i++) {
        const d = sdk.getDialog();
        if (d?.isOpen) {
            const texts = d.allComponents?.map(c => c.text).filter(Boolean) ?? [];
            console.log(`Closing dialog: ${JSON.stringify(texts)}`);
            await sdk.sendClickDialog(0);
            await sdk.waitForTicks(2);
        }
    }
    console.log('All branches verified! Dialog open now:', sdk.getDialog()?.isOpen);
}, {
    botName: 'jimmy-dev',
    disconnectAfter: true,
    timeout: 45_000,
});

import { runScript } from '../../sdk/runner';

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;

    const log = (msg: string) => console.log(`[Cook] ${msg}`);

    await bot.closeInterface();
    await bot.dismissBlockingUI();

    const cookingXpBefore = sdk.getSkill('Cooking')?.experience ?? 0;
    log(`Starting Cook's Assistant. Position: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}) L${sdk.getState()?.player?.level}, Cooking XP: ${cookingXpBefore}`);

    // Helper to get down to level 0 if upstairs
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
        log(`Climbing down from level ${sdk.getState()?.player?.level}...`);
        const ladder = sdk.findNearbyLoc(/ladder|staircase/i, { withOption: /climb-down/i });
        if (ladder) {
            await bot.interactLoc(ladder, /climb-down/i);
            await sdk.waitForTicks(3);
        } else {
            break;
        }
    }

    // Step 1: Talk to Cook first if we are near Lumbridge Castle to start quest (or we can talk at end too)
    // Step 2: Bucket of milk
    if (!sdk.findInventoryItem(/bucket of milk/i)) {
        log('Getting Bucket of milk...');
        await bot.walkTo(3254, 3272, 3);
        for (let attempt = 0; attempt < 5; attempt++) {
            if (sdk.findInventoryItem(/bucket of milk/i)) break;
            const cow = sdk.findNearbyNpc(/^cow$/i, { reachable: true });
            const bucket = sdk.findInventoryItem(/^bucket$/i);
            if (cow && bucket) {
                const res = await bot.useItemOnNpc(bucket, cow);
                log(`Milk cow attempt ${attempt + 1}: ${res.success} - ${res.message}`);
                await sdk.waitForTicks(4);
            } else {
                await bot.walkTo(3256, 3275, 2);
            }
        }
    }

    // Step 3: Egg
    if (!sdk.findInventoryItem(/^egg$/i)) {
        log('Getting Egg...');
        await bot.walkTo(3231, 3297, 3);
        for (let attempt = 0; attempt < 15; attempt++) {
            if (sdk.findInventoryItem(/^egg$/i)) break;
            await sdk.scanGroundItems(15);
            const egg = sdk.findGroundItem(/^egg$/i, { reachable: true });
            if (egg) {
                const res = await bot.pickupItem(egg);
                log(`Pickup egg: ${res.success} - ${res.message}`);
                await sdk.waitForTicks(2);
            } else {
                log('Waiting for egg spawn...');
                await sdk.waitForTicks(5);
            }
        }
    }

    // Step 4: Pot of flour
    if (!sdk.findInventoryItem(/pot of flour/i)) {
        if (!sdk.findInventoryItem(/^grain$/i)) {
            log('Picking wheat...');
            await bot.walkTo(3162, 3299, 2);
            for (let attempt = 0; attempt < 5; attempt++) {
                if (sdk.findInventoryItem(/^grain$/i)) break;
                const wheat = sdk.findNearbyLoc(/^wheat$/i, { reachable: true });
                if (wheat) {
                    const res = await bot.interactLoc(wheat, /pick/i);
                    log(`Pick wheat: ${res.success} - ${res.message}`);
                    await sdk.waitForTicks(4);
                }
            }
        }

        log('Going to windmill...');
        await bot.walkTo(3166, 3306, 2);

        // Climb to L1
        while ((sdk.getState()?.player?.level ?? 0) === 0) {
            const ladder = sdk.findNearbyLoc(/^ladder$/i, { withOption: /climb-up/i });
            if (ladder) {
                await bot.interactLoc(ladder, /climb-up/i);
                await sdk.waitForTicks(3);
            }
        }
        // Climb to L2
        while ((sdk.getState()?.player?.level ?? 0) === 1) {
            const ladder = sdk.findNearbyLoc(/^ladder$/i, { withOption: /climb-up/i });
            if (ladder) {
                await bot.interactLoc(ladder, /climb-up/i);
                await sdk.waitForTicks(3);
            }
        }

        // Put grain in hopper and operate controls
        const grain = sdk.findInventoryItem(/^grain$/i);
        const hopper = sdk.findNearbyLoc(/^hopper$/i);
        if (grain && hopper) {
            const res = await bot.useItemOnLoc(grain, hopper);
            log(`Hopper fill: ${res.success} - ${res.message}`);
            await sdk.waitForTicks(3);
        }
        const controls = sdk.findNearbyLoc(/hopper controls/i);
        if (controls) {
            const res = await bot.interactLoc(controls, /operate/i);
            log(`Hopper controls: ${res.success} - ${res.message}`);
            await sdk.waitForTicks(4);
        }

        // Climb down to L1
        while ((sdk.getState()?.player?.level ?? 0) === 2) {
            const ladder = sdk.findNearbyLoc(/^ladder$/i, { withOption: /climb-down/i });
            if (ladder) {
                await bot.interactLoc(ladder, /climb-down/i);
                await sdk.waitForTicks(3);
            }
        }
        // Climb down to L0
        while ((sdk.getState()?.player?.level ?? 0) === 1) {
            const ladder = sdk.findNearbyLoc(/^ladder$/i, { withOption: /climb-down/i });
            if (ladder) {
                await bot.interactLoc(ladder, /climb-down/i);
                await sdk.waitForTicks(3);
            }
        }

        // Empty flour bin
        for (let attempt = 0; attempt < 5; attempt++) {
            if (sdk.findInventoryItem(/pot of flour/i)) break;
            const bin = sdk.findNearbyLoc(/flour bin/i);
            const pot = sdk.findInventoryItem(/^pot$/i);
            if (bin && pot) {
                const res = await bot.useItemOnLoc(pot, bin);
                log(`Use pot on flour bin: ${res.success} - ${res.message}`);
                await sdk.waitForTicks(3);
                if (!sdk.findInventoryItem(/pot of flour/i)) {
                    await bot.interactLoc(bin, 1);
                    await sdk.waitForTicks(3);
                }
            }
        }
    }

    // Step 5: Talk to Cook to start and complete quest
    log('Walking to Cook in Lumbridge Castle kitchen...');
    await bot.walkTo(3208, 3214, 2);

    for (let round = 0; round < 3; round++) {
        const cook = sdk.findNearbyNpc(/^cook$/i);
        if (!cook) {
            await bot.walkTo(3208, 3214, 1);
            continue;
        }
        log(`Talking to Cook (round ${round + 1})...`);
        await bot.talkTo(cook);
        for (let step = 0; step < 25; step++) {
            await sdk.waitForTicks(1);
            const d = sdk.getDialog();
            if (!d || !d.isOpen) break;
            log(`Dialog: "${d.text}" | options: ${d.options.map(o => o.text).join(' / ')}`);
            if (d.options.length > 0) {
                const opt = d.options.find(o => /what's wrong|yes, i'll help/i.test(o.text)) || d.options[0];
                await sdk.sendClickDialog(opt.index);
            } else {
                await sdk.sendClickDialog(0);
            }
            await sdk.waitForTicks(2);
        }
        await sdk.waitForTicks(3);
        await bot.closeInterface();
        if ((sdk.getSkill('Cooking')?.experience ?? 0) > cookingXpBefore) {
            log(`Cook's Assistant COMPLETE! Cooking XP: ${sdk.getSkill('Cooking')?.experience}`);
            break;
        }
    }

    log(`Final Cooking skill: Lvl ${sdk.getSkill('Cooking')?.level} (${sdk.getSkill('Cooking')?.experience} xp)`);
}, {
    timeout: 180_000,
    disconnectAfter: true,
});

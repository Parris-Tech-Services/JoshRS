import { runScript } from '../../sdk/runner';

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;
    const log = (msg: string) => console.log(`[Ghost] ${msg}`);

    await bot.closeInterface();
    await bot.dismissBlockingUI();

    const openNearbyDoorAt = async (x: number, z: number, radius = 3) => {
        const door = sdk.getNearbyLocs().find(l =>
            Math.hypot(l.x - x, l.z - z) <= radius &&
            /door|gate/i.test(l.name) &&
            l.optionsWithIndex.some(o => /^open$/i.test(o.text))
        );
        if (door) {
            const opt = door.optionsWithIndex.find(o => /^open$/i.test(o.text));
            if (opt) {
                await sdk.sendInteractLoc(door.x, door.z, door.id, opt.opIndex);
                await sdk.waitForTicks(3);
            }
        }
    };

    // If inside Wizards' Tower foyer (around 3108, 3163), step out to (3109, 3169) first
    const pStart = sdk.getState()?.player;
    if (pStart && Math.hypot(pStart.worldX - 3108, pStart.worldZ - 3163) <= 5) {
        await openNearbyDoorAt(3109, 3166, 3);
        await sdk.sendWalk(3109, 3169, true);
        await sdk.waitForTicks(4);
    }

    // Step 1: Ensure we have Ghostspeak amulet equipped (Father Urhney is at 3235, 3153 in 2004 RS2!)
    if (!sdk.findInventoryItem(/ghostspeak amulet/i) && !sdk.findEquipmentItem(/ghostspeak amulet/i)) {
        log('Walking to Father Urhney in eastern Lumbridge Swamp (3235, 3153)...');
        await bot.walkTo(3235, 3153, 3);
        const urhneyDoor = sdk.findNearbyLoc(/door/i, { withOption: /^open$/i, maxDistance: 5 });
        if (urhneyDoor) {
            await bot.interactLoc(urhneyDoor, /^open$/i);
            await sdk.waitForTicks(3);
        }
        await bot.walkTo(3235, 3153, 2);

        const urhney = sdk.findNearbyNpc(/father urhney/i);
        if (urhney) {
            log('Talking to Father Urhney...');
            await bot.talkTo(urhney);
            for (let i = 0; i < 30; i++) {
                await sdk.waitForTicks(1);
                const d = sdk.getDialog();
                if (!d || !d.isOpen) break;
                if (d.options.length > 0) {
                    const opt = d.options.find(o => /father aereck sent me|ghost haunting|lost the amulet/i.test(o.text)) || d.options[0];
                    await sdk.sendClickDialog(opt.index);
                } else {
                    await sdk.sendClickDialog(0);
                }
                await sdk.waitForTicks(2);
            }
        }
    }

    const amulet = sdk.findInventoryItem(/ghostspeak amulet/i);
    if (amulet) {
        log('Equipping Ghostspeak amulet...');
        await bot.equipItem(amulet);
        await sdk.waitForTicks(2);
    }
    log(`Ghostspeak amulet equipped: ${Boolean(sdk.findEquipmentItem(/ghostspeak amulet/i))}`);

    // Step 2: Talk to Restless Ghost at (3249, 3192) wearing Ghostspeak amulet
    if (!sdk.findInventoryItem(/skull/i)) {
        log('Walking to Lumbridge graveyard coffin (3249, 3192)...');
        await bot.walkTo(3248, 3193, 2);
        await openNearbyDoorAt(3247, 3193, 4);
        await bot.walkTo(3249, 3192, 1);

        for (let attempt = 0; attempt < 4; attempt++) {
            const ghost = sdk.findNearbyNpc(/ghost/i);
            if (ghost) break;
            const coffinOpen = sdk.findNearbyLoc(/coffin/i, { withOption: /^open$/i });
            if (coffinOpen) {
                await bot.interactLoc(coffinOpen, /^open$/i);
                await sdk.waitForTicks(4);
            } else {
                const coffinSearch = sdk.findNearbyLoc(/coffin/i, { withOption: /search/i });
                if (coffinSearch) {
                    await bot.interactLoc(coffinSearch, /search/i);
                    await sdk.waitForTicks(4);
                    await bot.dismissBlockingUI();
                }
            }
        }

        const ghost = sdk.findNearbyNpc(/ghost/i);
        if (ghost) {
            log('Talking to Restless Ghost with Ghostspeak amulet...');
            await bot.talkTo(ghost);
            for (let i = 0; i < 30; i++) {
                await sdk.waitForTicks(1);
                const d = sdk.getDialog();
                if (!d || !d.isOpen) break;
                if (d.options.length > 0) {
                    const opt = d.options.find(o => /tell me what the problem is|why you're a ghost/i.test(o.text)) || d.options[0];
                    await sdk.sendClickDialog(opt.index);
                } else {
                    await sdk.sendClickDialog(0);
                }
                await sdk.waitForTicks(2);
            }
        }

        // Step 3: Enter Wizards' Tower basement and take Ghost's Skull at (3119, 9566)
        log('Walking to Wizards Tower basement for Skull...');
        await bot.walkTo(3109, 3168, 2);
        await openNearbyDoorAt(3109, 3166, 3);
        await sdk.sendWalk(3108, 3163, true);
        await sdk.waitForTicks(4);
        await openNearbyDoorAt(3107, 3162, 3);
        await sdk.sendWalk(3105, 3162, true);
        await sdk.waitForTicks(4);
        const ladderDown = sdk.findNearbyLoc(/ladder/i, { withOption: /climb-down/i });
        if (ladderDown) {
            await bot.interactLoc(ladderDown, /climb-down/i);
            await sdk.waitForTicks(4);
        }

        await openNearbyDoorAt(3108, 9570, 4);
        await bot.walkTo(3115, 9566, 2);
        await openNearbyDoorAt(3116, 9566, 4);
        await bot.walkTo(3119, 9566, 1);
        for (let attempt = 0; attempt < 5; attempt++) {
            if (sdk.findInventoryItem(/skull/i)) break;
            await sdk.scanGroundItems(10);
            const skull = sdk.findGroundItem(/skull/i);
            if (skull) {
                const res = await bot.pickupItem(skull);
                log(`Pickup Skull: ${res.success} - ${res.message}`);
                await sdk.waitForTicks(3);
            } else {
                await sdk.waitForTicks(4);
            }
        }

        log('Leaving Wizards Tower basement...');
        await openNearbyDoorAt(3116, 9566, 4);
        await bot.walkTo(3108, 9570, 2);
        await openNearbyDoorAt(3108, 9570, 4);
        await bot.walkTo(3104, 9576, 1);
        const ladderUp = sdk.findNearbyLoc(/ladder/i, { withOption: /climb-up/i });
        if (ladderUp) {
            await bot.interactLoc(ladderUp, /climb-up/i);
            await sdk.waitForTicks(4);
        }
        await openNearbyDoorAt(3107, 3162, 3);
        await sdk.sendWalk(3108, 3163, true);
        await sdk.waitForTicks(4);
        await openNearbyDoorAt(3109, 3166, 3);
        await sdk.sendWalk(3109, 3169, true);
        await sdk.waitForTicks(4);
    }

    // Step 4: Return Skull to Coffin at (3249, 3192)
    if (sdk.findInventoryItem(/skull/i)) {
        log('Returning Skull to Coffin in Lumbridge graveyard...');
        await bot.walkTo(3249, 3192, 1);
        const coffinOpen = sdk.findNearbyLoc(/coffin/i, { withOption: /^open$/i });
        if (coffinOpen) {
            await bot.interactLoc(coffinOpen, /^open$/i);
            await sdk.waitForTicks(3);
        }
        const skullItem = sdk.findInventoryItem(/skull/i);
        const coffin = sdk.findNearbyLoc(/coffin/i);
        if (skullItem && coffin) {
            const res = await bot.useItemOnLoc(skullItem, coffin);
            log(`Use Skull on Coffin: ${res.success} - ${res.message}`);
            for (let i = 0; i < 15; i++) {
                await sdk.waitForTicks(1);
                const d = sdk.getDialog();
                if (d && d.isOpen) {
                    await sdk.sendClickDialog(0);
                    await sdk.waitForTicks(2);
                }
            }
            await sdk.waitForTicks(6);
            await bot.closeInterface();
        }
    }

    log(`Final Prayer skill: Lvl ${sdk.getSkill('Prayer')?.level} (${sdk.getSkill('Prayer')?.experience} xp)`);
}, {
    timeout: 240_000,
    disconnectAfter: true,
});

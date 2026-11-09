import {
    type QuestModule,
    type QuestContext,
    ensureEquipped,
    ensureInInventory,
    ensureCoins,
    count,
    findInv,
    hasInv,
    interactLocNear,
    interactNpcNear,
    advanceDialogs,
    walkTo,
    eatIfLow,
    rechargePrayer,
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const KEEP_RE = [
    /rune scimitar/i,
    /excalibur/i,
    /tinderbox/i,
    /insect repellent/i,
    /bucket/i,
    /wax/i,
    /candle/i,
    /bat bones/i,
    /bread/i,
    /coins/i,
    /lobster|trout|salmon|meat|bread/i,
];

let stage = 4; // 0=unstarted, 1=arthur, 2=gawain, 3=lancelot, 4=mordred/morgan, 5=thrantax, 6=freed, 7=complete
let spokenLady = true;
let inspectedAltar = false;

async function exitKeepLeFaye(c: QuestContext): Promise<void> {
    for (let i = 0; i < 4 && (c.sdk.getState().player?.level ?? 0) === 2; i++) {
        const p = c.sdk.getState().player;
        if (!p || p.worldX < 2760 || p.worldX > 2782 || p.worldZ < 3394 || p.worldZ > 3410) break;
        await c.sdk.sendWalk(2769, 3401, true);
        await c.sleep(1000);
        const s2 = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1723);
        if (s2) await c.sdk.sendInteractLoc(s2.x, s2.z, s2.id, 1);
        await c.sleep(1800);
    }
    for (let i = 0; i < 4 && (c.sdk.getState().player?.level ?? 0) === 1; i++) {
        const p = c.sdk.getState().player;
        if (!p || p.worldX < 2760 || p.worldX > 2782 || p.worldZ < 3394 || p.worldZ > 3410) break;
        await c.sdk.sendWalk(2769, 3407, true);
        await c.sleep(1500);
        const s1 = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1723);
        if (s1) await c.sdk.sendInteractLoc(s1.x, s1.z, s1.id, 1);
        await c.sleep(1800);
    }
    for (let i = 0; i < 4; i++) {
        const p0 = c.sdk.getState().player;
        if (!p0 || p0.level !== 0 || p0.worldX < 2764 || p0.worldX > 2782 || p0.worldZ < 3395 || p0.worldZ > 3410) break;
        await c.sdk.sendWalk(2764, 3402, true);
        await c.sleep(1500);
        const door = c.sdk.getState().nearbyLocs.find(
            (l: any) => (l.id === 71 || l.id === 72) || (l.x === 2763 && (l.z === 3401 || l.z === 3402))
        );
        if (door) {
            await c.sdk.sendInteractLoc(door.x, door.z, door.id, 1);
            await c.sleep(1500);
        }
    }
}

async function prepSupplies(c: QuestContext): Promise<boolean> {
    if (stage >= 7) return true;
    await c.bot.deactivateAllPrayers();
    if (hasInv(c, /rune scimitar|silverlight|longsword|sword/i)) {
        await c.bot.equipItem(/rune scimitar|silverlight|longsword|sword/i);
        await c.sleep(400);
    }
    if (hasInv(c, /tinderbox/i) && (hasInv(c, /^bread$/i) || hasInv(c, /^excalibur$/i))) {
        return true;
    }
    await ensureInInventory(c, [{ pattern: /tinderbox/i, count: 1 }], KEEP_RE);
    await ensureInInventory(c, [{ pattern: /^bread$/i, count: 1 }], KEEP_RE);

    if (!hasInv(c, /tinderbox/i) || (!hasInv(c, /^bread$/i) && !hasInv(c, /^excalibur$/i))) {
        await ensureInInventory(c, [{ pattern: /^coins$/i, count: 100 }], KEEP_RE);
        if (count(c.sdk, /^coins$/i) < 20) {
            await walkTo(c, 3095, 3245);
            await ensureCoins(c, 30);
        }
    }

    if (!hasInv(c, /tinderbox/i)) {
        await walkTo(c, 3212, 3246);
        const shop = await c.bot.openShop(/shopkeeper|shop assistant/i);
        if (shop?.success) {
            await c.bot.buyFromShop(/tinderbox/i, 1);
            await c.bot.closeShop();
        }
    }

    if (!hasInv(c, /^bread$/i) && !hasInv(c, /^excalibur$/i)) {
        await walkTo(c, 3014, 3204);
        const wydin = c.sdk.getState().nearbyNpcs.find((n: any) => /wydin/i.test(n.name));
        if (wydin) {
            await c.sdk.sendInteractNpc(wydin.index, 3); // Trade
            for (let i = 0; i < 15; i++) {
                await c.sleep(300);
                if (c.sdk.getState().shop.isOpen) break;
            }
            if (c.sdk.getState().shop.isOpen) {
                await c.bot.buyFromShop(/bread/i, 1);
                await c.bot.closeShop();
            }
        }
    }
    return true;
}

async function startCamelot(c: QuestContext): Promise<boolean> {
    if (stage >= 3) return true;

    await walkToKandarin(c, 2763, 3513);

    // 1. Talk to King Arthur
    if (stage < 1) {
        const ok = await interactNpcNear(c, /king arthur/i, /talk/i, 2763, 3513, 12);
        if (!ok) return false;
        await advanceDialogs(c, [
            /i want to become a knight of the round table/i,
        ]);
        stage = 1;
    }

    // 2. Talk to Sir Gawain
    if (stage < 2) {
        const ok = await interactNpcNear(c, /sir gawain/i, /talk/i, 2758, 3504, 15);
        if (!ok) return false;
        await advanceDialogs(c, [
            /do you know how merlin got trapped/i,
            /any ideas? (on )?how to get into morgan le faye's stronghold/i,
        ]);
        stage = 2;
    }

    // 3. Climb up staircase 1725 at (2750, 3510) to L1 and talk to Sir Lancelot
    if (stage < 3) {
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await interactLocNear(c, 1725, /climb-up/i, 2750, 3510, 8);
            await c.sleep(1500);
        }
        if ((c.sdk.getState().player?.level ?? 0) !== 1) return false;
        const ok = await interactNpcNear(c, /sir lancelot/i, /talk/i, 2760, 3511, 12);
        if (!ok) return false;
        await advanceDialogs(c, [
            /any ideas? (on )?how to get into morgan le faye's stronghold/i,
        ]);
        stage = 3;
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1726, /climb-down/i, 2750, 3511, 10);
        await c.sleep(1200);
    }
    return stage >= 3;
}

async function keepLeFayeMordred(c: QuestContext): Promise<boolean> {
    if (stage >= 4) return true;

    const pStart = c.sdk.getState().player;
    if (!pStart || pStart.worldX > 2785 || pStart.worldZ > 3415) {
        await walkToKandarin(c, 2798, 3440);
        await rechargePrayer(c, 25);
        await walkToKandarin(c, 2798, 3440);
        await c.bot.walkTo(2801, 3441, 0);

        // Hide in shipping crate (id: 63 at 2801, 3442; op2=Hide-in)
        for (let attempt = 0; attempt < 3; attempt++) {
            const p = c.sdk.getState().player;
            if (p && p.worldX <= 2785 && p.worldZ <= 3415 && !c.sdk.getState().dialog.isOpen) break;
            if (!c.sdk.getState().dialog.isOpen) {
                await c.bot.walkTo(2801, 3441, 0);
                const crate = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 63);
                if (crate) {
                    await c.sdk.sendInteractLoc(crate.x, crate.z, crate.id, 2);
                }
                for (let w = 0; w < 15 && !c.sdk.getState().dialog.isOpen; w++) {
                    await c.sleep(300);
                }
            }
            for (let step = 0; step < 80; step++) {
                const s = c.sdk.getState();
                if (s.player && s.player.worldX <= 2785 && s.player.worldZ <= 3415 && !s.dialog.isOpen) {
                    break;
                }
                if (s.dialog.isOpen) {
                    const yesOpt = s.dialog.options.find((o: any) => /yes/i.test(o.text));
                    await c.sdk.sendClickDialog(yesOpt ? yesOpt.index : 0);
                }
                await c.sleep(350);
            }
        }
        await c.sleep(1000);
    }

    // Verify we are inside Keep Le Faye around (2778, 3401)
    const pos = c.sdk.getState().player;
    if (!pos || pos.worldX > 2785 || pos.worldZ > 3415) {
        return false;
    }

    // Climb staircase 1722 at L0 (2769, 3404; forceapproach=south -> 2769, 3403) -> L1
    for (let i = 0; i < 4 && (c.sdk.getState().player?.level ?? 0) === 0; i++) {
        if ((c.sdk.getState().player?.worldX ?? 0) >= 2776) {
            const jettyDoor = c.sdk.getState().nearbyLocs.find(
                (l: any) => (l.id === 1516 || l.id === 1519) && l.x === 2776 && (l.z === 3400 || l.z === 3401)
            );
            if (jettyDoor) {
                await c.sdk.sendInteractLoc(jettyDoor.x, jettyDoor.z, jettyDoor.id, 1);
                await c.sleep(1000);
            }
        }
        await walkTo(c, 2769, 3403, 1);
        await c.sdk.sendWalk(2769, 3403, true);
        await c.sleep(1200);
        const s0 = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1722);
        if (s0) await c.sdk.sendInteractLoc(s0.x, s0.z, s0.id, 1);
        await c.sleep(1800);
    }
    // Climb staircase 1722 at L1 (2769, 3398; forceapproach=south -> 2769, 3397) -> L2
    for (let i = 0; i < 4 && (c.sdk.getState().player?.level ?? 0) === 1; i++) {
        await c.sdk.sendWalk(2769, 3397, true);
        await c.sleep(1800);
        const s1 = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1722);
        if (s1) await c.sdk.sendInteractLoc(s1.x, s1.z, s1.id, 1);
        await c.sleep(1800);
    }
    if ((c.sdk.getState().player?.level ?? 0) !== 2) {
        return false;
    }

    // Attack Sir Mordred on L2 with Protect from Melee until Morgan Le Faye spawns and opens dialog
    if ((c.sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await c.bot.activatePrayer('protect_from_melee');
    }
    let morganSpoke = false;
    for (let tick = 0; tick < 80; tick++) {
        const s = c.sdk.getState();
        if ((s.player?.level ?? 0) !== 2) break;
        const hasMorgan = s.nearbyNpcs.some((n: any) => /morgan le faye/i.test(n.name));
        const dialogText = (s.dialog.allComponents ?? []).map((comp: any) => comp.text ?? '').join(' ');
        if (s.dialog.isOpen && (hasMorgan || /spare my son|untrap merlin|magic symbol|excalibur/i.test(dialogText))) {
            await advanceDialogs(c, [
                /tell me how to untrap merlin/i,
                /ok,? i will go do all that/i,
            ], 35);
            morganSpoke = true;
            break;
        } else if (s.dialog.isOpen) {
            await c.sdk.sendClickDialog(0);
            await c.sleep(400);
            continue;
        }
        const mordred = s.nearbyNpcs.find((n: any) => /sir mordred/i.test(n.name));
        if (mordred && !s.player?.combat?.inCombat && !mordred.inCombat) {
            await c.sdk.sendInteractNpc(mordred.index, 2); // Attack
        }
        await c.sleep(800);
    }
    await c.bot.deactivateAllPrayers();

    // Climb down L2 -> L1 -> L0 and exit Keep Le Faye via front Large door (id 71/72 at 2763, 3401..3402)
    await exitKeepLeFaye(c);

    if (morganSpoke) stage = 4;
    return stage >= 4;
}

async function gatherBatBonesAndBlackCandle(c: QuestContext): Promise<boolean> {
    if (stage >= 5) return true;

    await exitKeepLeFaye(c);

    // 1. Bat bones from Giant bat outside Keep Le Faye (2756, 3400)
    if (!hasInv(c, /^bat bones$/i)) {
        await rechargePrayer(c, 30);
        await walkToKandarin(c, 2756, 3400);
        if ((c.sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await c.bot.activatePrayer('protect_from_melee');
        }
        for (let attempt = 0; attempt < 8 && !hasInv(c, /^bat bones$/i); attempt++) {
            const g = c.sdk.getState().groundItems.find((i: any) => /^bat bones$/i.test(i.name));
            if (g) {
                await c.sdk.sendPickup(g.x, g.z, g.id);
                await c.sleep(1000);
                if (hasInv(c, /^bat bones$/i)) break;
            }
            const bat = c.sdk.getState().nearbyNpcs.find((n: any) => /giant bat/i.test(n.name));
            if (bat) {
                await c.bot.attackNpc(bat, 25000);
                await c.sleep(800);
                const drop = c.sdk.getState().groundItems.find((i: any) => /^bat bones$/i.test(i.name));
                if (drop) {
                    await c.sdk.sendPickup(drop.x, drop.z, drop.id);
                    await c.sleep(1000);
                }
            } else {
                await c.sleep(1500);
            }
        }
        await c.bot.deactivateAllPrayers();
    }
    if (!hasInv(c, /^bat bones$/i)) return false;

    // 2. Black candle / Lit black candle
    if (!hasInv(c, /black candle/i)) {
        // Get Insect repellent at (2807, 3450) on table in Catherby house (walkable tile 2808, 3450)
        if (!hasInv(c, /insect repellent/i) && !hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2808, 3450);
            for (let w = 0; w < 10 && !hasInv(c, /insect repellent/i); w++) {
                const rep = c.sdk.getState().groundItems.find((i: any) => /insect repellent/i.test(i.name));
                if (rep) {
                    await c.sdk.sendPickup(rep.x, rep.z, rep.id);
                    await c.sleep(900);
                } else {
                    await c.sleep(1000);
                }
            }
        }

        // Get Bucket from static ground spawn at (2766, 3441) right outside the Beehive gate
        if (!hasInv(c, /^bucket$/i) && !hasInv(c, /bucket of wax/i)) {
            if (hasInv(c, /^bucket of water$/i)) {
                const bw = findInv(c, /^bucket of water$/i);
                if (bw) {
                    await c.bot.interactInventoryItem(bw, /empty/i);
                    await c.sleep(600);
                }
            }
            if (!hasInv(c, /^bucket$/i)) {
                await walkToKandarin(c, 2766, 3441);
                for (let w = 0; w < 12 && !hasInv(c, /^bucket$/i); w++) {
                    const b = c.sdk.getState().groundItems.find((i: any) => /^bucket$/i.test(i.name));
                    if (b) {
                        await c.sdk.sendPickup(b.x, b.z, b.id);
                        await c.sleep(900);
                    } else {
                        await c.sleep(1000);
                    }
                }
            }
        }

        // Get Bucket of wax from Beehive (id: 68 at 2762, 3443; walkable tile 2763, 3443)
        if (!hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2763, 3443);
            const rep = findInv(c, /insect repellent/i);
            const hive = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 68);
            if (rep && hive) {
                await c.bot.useItemOnLoc(rep, hive);
                await advanceDialogs(c);
                await c.bot.dismissBlockingUI();
                await c.sleep(600);
                await c.bot.interactLoc(hive, /take-from/i);
                await advanceDialogs(c);
                await c.bot.dismissBlockingUI();
                await c.sleep(600);
            }
        }

        // Talk to Candle maker in Catherby (2799, 3439) to get Black candle
        if (hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2799, 3439);
            await interactNpcNear(c, /candle[- ]?maker/i, /talk/i, 2799, 3439, 10);
            await advanceDialogs(c, [/have you got any black candles/i]);
            if (!hasInv(c, /black candle/i)) {
                await interactNpcNear(c, /candle[- ]?maker/i, /talk/i, 2799, 3439, 10);
                await advanceDialogs(c, [/have you got any black candles/i]);
            }
        }
    }

    // Light Black candle with Tinderbox if unlit
    if (!hasInv(c, /^lit black candle$/i) && hasInv(c, /^black candle$/i)) {
        if (!hasInv(c, /tinderbox/i)) {
            if (count(c.sdk, /^coins$/i) < 5) {
                await ensureCoins(c, 10);
            }
            await walkToKandarin(c, 2803, 3430);
            const arhein = c.sdk.getState().nearbyNpcs.find((n: any) => /arhein/i.test(n.name));
            if (arhein) {
                const tradeOp = arhein.optionsWithIndex?.find((o: any) => /trade/i.test(o.text))?.opIndex ?? 3;
                await c.sdk.sendInteractNpc(arhein.index, tradeOp);
                for (let i = 0; i < 15; i++) {
                    await c.sleep(300);
                    if (c.sdk.getState().shop.isOpen) break;
                }
                if (c.sdk.getState().shop.isOpen) {
                    await c.bot.buyFromShop(/tinderbox/i, 1);
                    await c.bot.closeShop();
                }
            }
        }
        const tinderbox = findInv(c, /tinderbox/i);
        const candle = findInv(c, /^black candle$/i);
        if (tinderbox && candle) {
            await c.sdk.sendUseItemOnItem(tinderbox.slot, candle.slot);
            await c.sleep(900);
        }
    }

    return hasInv(c, /^bat bones$/i) && hasInv(c, /^lit black candle$/i);
}

async function obtainExcaliburAndInspectAltar(c: QuestContext): Promise<boolean> {
    if (stage >= 5) return true;

    // 1. Obtain Excalibur if we don't have it
    if (!hasInv(c, /^excalibur$/i)) {
        if (!spokenLady) {
            await walkTo(c, 2924, 3404);
            const ok = await interactNpcNear(c, /lady of the lake/i, /talk/i, 2924, 3404, 12);
            if (!ok) return false;
            await advanceDialogs(c, [
                /i seek the sword excalibur/i,
            ]);
            spokenLady = true;
        }

        if (!hasInv(c, /^bread$/i)) {
            await walkTo(c, 3014, 3204);
            const wydin = c.sdk.getState().nearbyNpcs.find((n: any) => /wydin/i.test(n.name));
            if (wydin) {
                await c.sdk.sendInteractNpc(wydin.index, 3);
                for (let i = 0; i < 15; i++) {
                    await c.sleep(300);
                    if (c.sdk.getState().shop.isOpen) break;
                }
                if (c.sdk.getState().shop.isOpen) {
                    await c.bot.buyFromShop(/bread/i, 1);
                    await c.bot.closeShop();
                }
            }
        }

        // Open Port Sarim Jeweller's door (id: 59 at 3016, 3246) to trigger Beggar
        await walkTo(c, 3016, 3246);
        await interactLocNear(c, 59, /open/i, 3016, 3246, 6);
        await advanceDialogs(c, [
            /yes,? certainly/i,
        ]);
        if (!hasInv(c, /^excalibur$/i)) {
            const beggar = c.sdk.getState().nearbyNpcs.find((n: any) => /beggar/i.test(n.name));
            if (beggar) {
                await c.sdk.sendInteractNpc(beggar.index, 1);
                await advanceDialogs(c, [/yes,? certainly/i]);
            }
        }
    }
    if (!hasInv(c, /^excalibur$/i)) return false;

    // 2. Inspect Wilderness Chaos Temple Altar (thrantaxaltar id: 61 at 3239, 3608) to learn magic words
    if (!inspectedAltar) {
        await walkTo(c, 3240, 3520);
        if ((c.sdk.getSkill('Prayer')?.level ?? 0) > 0) {
            await c.bot.activatePrayer('protect_from_melee');
        }
        await walkTo(c, 3239, 3616, 2);
        await c.bot.walkTo(3239, 3611, 1);
        await c.bot.walkTo(3239, 3609, 1);
        const ok = await interactLocNear(c, 61, /inspect|check|search/i, 3239, 3608, 8);
        if (!ok) {
            await c.bot.deactivateAllPrayers();
            return false;
        }
        await advanceDialogs(c, [], 15);
        inspectedAltar = true;
        await c.bot.walkTo(3239, 3615, 2);
        await walkTo(c, 3240, 3520, 3);
        await c.bot.deactivateAllPrayers();
    }

    return hasInv(c, /^excalibur$/i) && inspectedAltar;
}

async function summonThrantaxAndFreeMerlin(c: QuestContext): Promise<boolean> {
    if (stage >= 7) return true;

    // 1. Summon Thrantax at Camelot magic symbol (2780, 3515)
    if (stage === 4) {
        await walkToKandarin(c, 2780, 3515);
        for (let i = 0; i < 4; i++) {
            const p = c.sdk.getState().player;
            if (p && Math.abs(p.worldX - 2780) <= 1 && Math.abs(p.worldZ - 3515) <= 1) break;
            await c.sdk.sendWalk(2780, 3515, false);
            await c.sleep(1000);
        }
        const bones = findInv(c, /^bat bones$/i);
        if (!bones) return false;
        await c.sdk.sendDropItem(bones.slot);
        for (let w = 0; w < 12; w++) {
            await c.sleep(500);
            if (c.sdk.getState().dialog.isOpen) break;
        }
        await advanceDialogs(c, [
            /snarthon candtrick termanto/i,
        ], 35);
        stage = 5;
    }
    if (stage < 5) return false;

    // 2. Climb Camelot SE tower ladders and smash Giant crystal with Excalibur (5 -> 6)
    if (stage === 5) {
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await walkTo(c, 2758, 3486, 2);
            await walkTo(c, 2758, 3504, 2);
            await c.bot.walkTo(2765, 3504, 1);
            const dNorth = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1533 && l.x === 2766 && l.z === 3504);
            if (dNorth) {
                await c.sdk.sendInteractLoc(dNorth.x, dNorth.z, dNorth.id, 1);
                await c.sleep(1000);
            }
            await c.bot.walkTo(2766, 3496, 1);
            const dSouth = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1533 && l.x === 2766 && l.z === 3495);
            if (dSouth) {
                await c.sdk.sendInteractLoc(dSouth.x, dSouth.z, dSouth.id, 1);
                await c.sleep(1000);
            }
            await c.bot.walkTo(2768, 3493, 1);
            await interactLocNear(c, 1747, /climb-up/i, 2769, 3493, 6);
            await c.sleep(1500);
        }
        if ((c.sdk.getState().player?.level ?? 0) === 1) {
            await interactLocNear(c, 1747, /climb-up/i, 2767, 3491, 8);
            await c.sleep(1500);
        }
        if (!findInv(c, /^excalibur$/i)) {
            const eq = c.sdk.getState().equipment.find((e: any) => /excalibur/i.test(e.name));
            if (eq) {
                await c.sdk.sendUnequip(eq.slot);
                await c.sleep(600);
            }
        }
        const excalibur = findInv(c, /^excalibur$/i);
        const crystal = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 62 || /giant crystal/i.test(l.name));
        if (excalibur && crystal) {
            await c.sdk.sendUseItemOnLoc(excalibur.slot, crystal.x, crystal.z, crystal.id);
            await advanceDialogs(c, [], 30);
            stage = 6;
        }
    }

    // Climb back down L2 -> L1 -> L0
    if ((c.sdk.getState().player?.level ?? 0) === 2) {
        await interactLocNear(c, 1746, /climb-down/i, 2767, 3491, 8);
        await c.sleep(1500);
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1746, /climb-down/i, 2769, 3493, 8);
        await c.sleep(1500);
    }
    if (stage < 6) return false;

    // 3. Report to King Arthur (6 -> 7)
    const p0 = c.sdk.getState().player;
    if (p0 && p0.worldX >= 2764 && p0.worldZ <= 3496) {
        const dSouth = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1533 && l.x === 2766 && l.z === 3495);
        if (dSouth) {
            await c.sdk.sendInteractLoc(dSouth.x, dSouth.z, dSouth.id, 1);
            await c.sleep(1000);
        }
        await c.bot.walkTo(2766, 3503, 1);
    }
    if (c.sdk.getState().player && c.sdk.getState().player!.worldX >= 2764 && c.sdk.getState().player!.worldZ <= 3505) {
        const dNorth = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 1533 && l.x === 2766 && l.z === 3504);
        if (dNorth) {
            await c.sdk.sendInteractLoc(dNorth.x, dNorth.z, dNorth.id, 1);
            await c.sleep(1000);
        }
        await c.bot.walkTo(2763, 3506, 2);
    }
    await walkTo(c, 2763, 3513);
    const ok = await interactNpcNear(c, /king arthur/i, /talk/i, 2763, 3513, 12);
    if (!ok) return false;
    await advanceDialogs(c, [], 25);
    await c.sleep(1200);
    stage = 7;
    return true;
}

export const merlinsCrystal: QuestModule = {
    id: 'arthur',
    name: "Merlin's Crystal",
    isComplete: () => stage >= 7,
    steps: [
        { name: 'prep-supplies', isDone: (c) => stage >= 3 && (hasInv(c, /^bread$/i) || hasInv(c, /^excalibur$/i)), run: prepSupplies },
        { name: 'start-camelot', isDone: () => stage >= 3, run: startCamelot },
        { name: 'keep-lefaye-mordred', isDone: () => stage >= 4, run: keepLeFayeMordred },
        {
            name: 'gather-bat-bones-and-black-candle',
            isDone: (c) => stage >= 5 || (hasInv(c, /^bat bones$/i) && hasInv(c, /^lit black candle$/i)),
            run: gatherBatBonesAndBlackCandle,
        },
        {
            name: 'obtain-excalibur-and-inspect-altar',
            isDone: (c) => stage >= 5 || (hasInv(c, /^excalibur$/i) && inspectedAltar),
            run: obtainExcaliburAndInspectAltar,
        },
        { name: 'summon-thrantax-and-free-merlin', isDone: () => stage >= 7, run: summonThrantaxAndFreeMerlin },
    ],
};
export const arthur = merlinsCrystal;

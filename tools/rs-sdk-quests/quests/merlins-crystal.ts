import {
    type QuestModule,
    type QuestContext,
    ensureEquipped,
    ensureInInventory,
    findInv,
    hasInv,
    interactLocNear,
    interactNpcNear,
    advanceDialogs,
    walkTo,
    eatIfLow,
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

let stage = 0; // 0=unstarted, 1=arthur, 2=gawain, 3=lancelot, 4=mordred/morgan, 5=thrantax, 6=freed, 7=complete
let spokenLady = false;
let inspectedAltar = false;

async function prepSupplies(c: QuestContext): Promise<boolean> {
    if (stage >= 7) return true;
    await ensureEquipped(c, /rune scimitar/i, 'wield');
    await ensureInInventory(c, [{ pattern: /tinderbox/i, count: 1 }], KEEP_RE);
    await ensureInInventory(c, [{ pattern: /^coins$/i, count: 100 }], KEEP_RE);
    await ensureInInventory(c, [{ pattern: /^bread$/i, count: 1 }], KEEP_RE);

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
            /any ideas on how to get into morgan le faye's stronghold/i,
        ]);
        stage = 2;
    }

    // 3. Climb up staircase 1722 at (2757, 3512) to L1 and talk to Sir Lancelot
    if (stage < 3) {
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await interactLocNear(c, 1722, /climb-up/i, 2757, 3512, 8);
            await c.sleep(1200);
        }
        const ok = await interactNpcNear(c, /sir lancelot/i, /talk/i, 2760, 3511, 12);
        if (!ok) return false;
        await advanceDialogs(c, [
            /any ideas on how to get into morgan le faye's stronghold/i,
        ]);
        stage = 3;
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1723, /climb-down/i, 2757, 3512, 10);
        await c.sleep(1000);
    }
    return stage >= 3;
}

async function keepLeFayeMordred(c: QuestContext): Promise<boolean> {
    if (stage >= 4) return true;

    await walkToKandarin(c, 2801, 3443);

    // Search shipping crate (id: 63 at 2801, 3442)
    await interactLocNear(c, 63, /search/i, 2801, 3442, 8);
    await advanceDialogs(c, [
        /yes/i,
        /yes/i,
    ], 55);
    await c.sleep(1200);

    // Verify we are inside Keep Le Faye around (2778, 3401)
    const pos = c.sdk.getState().player;
    if (!pos || pos.worldX > 2785 || pos.worldZ > 3415) {
        return false;
    }

    // Climb staircase 1722 at L0 (2769, 3404) -> L1
    if ((c.sdk.getState().player?.level ?? 0) === 0) {
        await interactLocNear(c, 1722, /climb-up/i, 2769, 3404, 12);
        await c.sleep(1200);
    }
    // Climb ladder 1747 at L1 (2764, 3402) -> L2
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1747, /climb-up/i, 2764, 3402, 12);
        await c.sleep(1200);
    }

    // Attack Sir Mordred on L2 until Morgan Le Faye spawns and opens dialog
    let morganSpoke = false;
    for (let tick = 0; tick < 80; tick++) {
        await eatIfLow(c);
        const s = c.sdk.getState();
        if (s.dialog.isOpen) {
            await advanceDialogs(c, [
                /tell me how to untrap merlin/i,
                /ok,? i will go do all that/i,
            ], 35);
            morganSpoke = true;
            break;
        }
        const mordred = s.nearbyNpcs.find((n: any) => /sir mordred/i.test(n.name));
        if (mordred) {
            await c.sdk.sendInteractNpc(mordred.index, 2); // Attack
        }
        await c.sleep(1000);
    }

    if (c.sdk.getState().dialog.isOpen) {
        await advanceDialogs(c, [
            /tell me how to untrap merlin/i,
            /ok,? i will go do all that/i,
        ], 30);
        morganSpoke = true;
    }

    // Climb down L2 -> L1 -> L0 and exit Keep Le Faye
    if ((c.sdk.getState().player?.level ?? 0) === 2) {
        await interactLocNear(c, 1746, /climb-down/i, 2764, 3402, 12);
        await c.sleep(1200);
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1723, /climb-down/i, 2769, 3405, 12);
        await c.sleep(1200);
    }
    // Open front door of Keep Le Faye from inside (2769, 3402)
    const p0 = c.sdk.getState().player;
    if (p0 && p0.worldX >= 2768 && p0.worldX <= 2782 && p0.worldZ >= 3395 && p0.worldZ <= 3410) {
        await walkTo(c, 2769, 3402);
        const door = c.sdk.getState().nearbyLocs.find(
            (l: any) => (l.x === 2768 || l.x === 2769) && (l.z === 3401 || l.z === 3402) && /open/i.test(l.optionsWithIndex.map((o: any) => o.text).join(' '))
        );
        if (door) {
            const op = door.optionsWithIndex.find((o: any) => /open/i.test(o.text))?.opIndex ?? 1;
            await c.sdk.sendInteractLoc(door.x, door.z, door.id, op);
            await c.sleep(1200);
        }
    }

    if (morganSpoke) stage = 4;
    return stage >= 4;
}

async function gatherBatBonesAndBlackCandle(c: QuestContext): Promise<boolean> {
    if (stage >= 5) return true;

    // 1. Bat bones from Giant bat outside Keep Le Faye (2756, 3400)
    if (!hasInv(c, /^bat bones$/i)) {
        await walkToKandarin(c, 2756, 3400);
        for (let attempt = 0; attempt < 8 && !hasInv(c, /^bat bones$/i); attempt++) {
            const g = c.sdk.getState().groundItems.find((i: any) => /^bat bones$/i.test(i.name));
            if (g) {
                await c.sdk.sendTakeGroundItem(g.x, g.z, g.id);
                await c.sleep(1000);
                if (hasInv(c, /^bat bones$/i)) break;
            }
            const bat = c.sdk.getState().nearbyNpcs.find((n: any) => /giant bat/i.test(n.name));
            if (bat) {
                await c.bot.attackNpc(bat, 25000);
                await c.sleep(800);
                const drop = c.sdk.getState().groundItems.find((i: any) => /^bat bones$/i.test(i.name));
                if (drop) {
                    await c.sdk.sendTakeGroundItem(drop.x, drop.z, drop.id);
                    await c.sleep(1000);
                }
            } else {
                await c.sleep(1500);
            }
        }
    }
    if (!hasInv(c, /^bat bones$/i)) return false;

    // 2. Black candle / Lit black candle
    if (!hasInv(c, /black candle/i)) {
        // Get Bucket from Catherby crate (id: 67 at 2798, 3439)
        if (!hasInv(c, /^bucket$/i) && !hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2798, 3440);
            await interactLocNear(c, 67, /search/i, 2798, 3439, 8);
            await advanceDialogs(c, [/yes/i]);
            await c.sleep(600);
        }

        // Get Insect repellent at (2807, 3450) in Catherby
        if (!hasInv(c, /insect repellent/i) && !hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2807, 3450);
            for (let w = 0; w < 10 && !hasInv(c, /insect repellent/i); w++) {
                const rep = c.sdk.getState().groundItems.find((i: any) => /insect repellent/i.test(i.name));
                if (rep) {
                    await c.sdk.sendTakeGroundItem(rep.x, rep.z, rep.id);
                    await c.sleep(900);
                } else {
                    await c.sleep(1000);
                }
            }
        }

        // Get Bucket of wax from Beehive (id: 68 at 2762, 3443)
        if (!hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2762, 3443);
            const rep = findInv(c, /insect repellent/i);
            const bucket = findInv(c, /^bucket$/i);
            const hive = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 68);
            if (rep && bucket && hive) {
                await c.sdk.sendUseItemOnLoc(rep.slot, hive.x, hive.z, hive.id);
                await advanceDialogs(c);
                await c.sleep(800);
                await c.sdk.sendUseItemOnLoc(bucket.slot, hive.x, hive.z, hive.id);
                await advanceDialogs(c);
                await c.sleep(800);
            }
        }

        // Talk to Candle-maker in Catherby (2797, 3440) to get Black candle
        if (hasInv(c, /bucket of wax/i)) {
            await walkToKandarin(c, 2797, 3440);
            await interactNpcNear(c, /candle-maker/i, /talk/i, 2797, 3440, 10);
            await advanceDialogs(c, [/have you got any black candles/i]);
            if (!hasInv(c, /black candle/i)) {
                await interactNpcNear(c, /candle-maker/i, /talk/i, 2797, 3440, 10);
                await advanceDialogs(c, [/have you got any black candles/i]);
            }
        }
    }

    // Light Black candle with Tinderbox if unlit
    if (!hasInv(c, /^lit black candle$/i) && hasInv(c, /^black candle$/i)) {
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

    // 2. Inspect SE Varrock Chaos Altar (id: 61 at 3259, 3381) to learn magic words
    if (!inspectedAltar) {
        await walkTo(c, 3259, 3382);
        const ok = await interactLocNear(c, 61, /inspect|check|search/i, 3259, 3381, 8);
        if (!ok) return false;
        await advanceDialogs(c);
        inspectedAltar = true;
    }

    return hasInv(c, /^excalibur$/i) && inspectedAltar;
}

async function summonThrantaxAndFreeMerlin(c: QuestContext): Promise<boolean> {
    if (stage >= 7) return true;

    // 1. Summon Thrantax at Camelot magic symbol (2780, 3515)
    if (stage === 4) {
        await walkToKandarin(c, 2780, 3515);
        await c.sdk.sendWalk(2780, 3515, false);
        await c.sleep(1200);
        const bones = findInv(c, /^bat bones$/i);
        if (!bones) return false;
        await c.sdk.sendDropItem(bones.slot);
        await c.sleep(1500);
        await advanceDialogs(c, [
            /snarthon candtrick termanto/i,
        ], 30);
        stage = 5;
    }
    if (stage < 5) return false;

    // 2. Climb Camelot SE tower ladders and smash Giant crystal with Excalibur (5 -> 6)
    if (stage === 5) {
        await walkTo(c, 2769, 3493);
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await interactLocNear(c, 1747, /climb-up/i, 2769, 3493, 8);
            await c.sleep(1200);
        }
        if ((c.sdk.getState().player?.level ?? 0) === 1) {
            await interactLocNear(c, 1747, /climb-up/i, 2767, 3491, 8);
            await c.sleep(1200);
        }
        const excalibur = findInv(c, /^excalibur$/i);
        const crystal = c.sdk.getState().nearbyLocs.find((l: any) => l.id === 62 || /giant crystal/i.test(l.name));
        if (excalibur && crystal) {
            await c.sdk.sendUseItemOnLoc(excalibur.slot, crystal.x, crystal.z, crystal.id);
            await advanceDialogs(c, [], 25);
            stage = 6;
        }
    }

    // Climb back down L2 -> L1 -> L0
    if ((c.sdk.getState().player?.level ?? 0) === 2) {
        await interactLocNear(c, 1746, /climb-down/i, 2767, 3491, 8);
        await c.sleep(1200);
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1746, /climb-down/i, 2769, 3493, 8);
        await c.sleep(1200);
    }
    if (stage < 6) return false;

    // 3. Report to King Arthur (6 -> 7)
    await walkTo(c, 2763, 3513);
    const ok = await interactNpcNear(c, /king arthur/i, /talk/i, 2763, 3513, 12);
    if (!ok) return false;
    await advanceDialogs(c);
    await c.sleep(1200);
    stage = 7;
    return true;
}

export const merlinsCrystal: QuestModule = {
    id: 'arthur',
    name: "Merlin's Crystal",
    isComplete: () => stage >= 7,
    steps: [
        { name: 'prep-supplies', isDone: () => stage >= 4, run: prepSupplies },
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

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
    count,
    xp,
    exitWizardsTowerGround,
} from '../quest-kit';
import { walkToKandarin } from './monks-friend';

const KEEP_RE = [
    /rune scimitar/i,
    /excalibur/i,
    /holy table napkin/i,
    /magic whistle/i,
    /grail bell/i,
    /holy grail/i,
    /coins/i,
    /lobster|trout|salmon|meat|bread/i,
];

let stage = 0; // 0=unstarted, 2=started, 3=merlin, 4=crone, 8=fisher_king, 9=percival, 10=complete

async function startCamelotAndMerlin(c: QuestContext): Promise<boolean> {
    if (stage >= 3) return true;

    await walkToKandarin(c, 2763, 3513);

    // 1. Start Holy Grail with King Arthur
    if (stage < 2) {
        const ok = await interactNpcNear(c, /king arthur/i, /talk/i, 2763, 3513, 12);
        if (!ok) return false;
        await advanceDialogs(c, [
            /tell me of this quest/i,
            /i'd enjoy trying that/i,
        ]);
        stage = 2;
    }

    // 2. Climb Camelot stairs 1722 at (2757, 3512) -> L1, open merlinworkshop door (id: 24 at 2764, 3503), talk to Merlin
    if (stage < 3) {
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await interactLocNear(c, 1722, /climb-up/i, 2757, 3512, 8);
            await c.sleep(1200);
        }
        await walkTo(c, 2764, 3504);
        await interactLocNear(c, 24, /open/i, 2764, 3503, 6);
        await c.sleep(1000);
        const ok = await interactNpcNear(c, /^merlin$/i, /talk/i, 2766, 3501, 10);
        if (!ok) return false;
        await advanceDialogs(c, [
            /thank you for the advice/i,
        ]);
        stage = 3;
    }

    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 1723, /climb-down/i, 2757, 3512, 12);
        await c.sleep(1000);
    }
    return stage >= 3;
}

async function entranaHighPriestAndCrone(c: QuestContext): Promise<boolean> {
    if (stage >= 4) return true;

    // Bank all weapons/armour at Draynor Bank (3092, 3243) before sailing to Entrana
    await walkTo(c, 3092, 3243);
    for (const eq of [...(c.sdk.getState().equipment ?? [])]) {
        await c.sdk.sendUnequipItem(eq.slot);
        await c.sleep(400);
    }
    if (!c.sdk.isBankOpen()) {
        await c.bot.openBank();
        await c.sleep(600);
    }
    for (const it of [...(c.sdk.getState().inventory ?? [])]) {
        if (!/^coins$/i.test(it.name)) {
            await c.sdk.sendBankDeposit(it.slot, it.count ?? 1);
            await c.sleep(400);
        }
    }
    if (c.sdk.isBankOpen()) await c.bot.closeBank();

    // Sail to Entrana from Port Sarim (3047, 3236)
    await walkTo(c, 3047, 3236);
    const okMonk = await interactNpcNear(c, /monk of entrana/i, /talk|take-boat/i, 3047, 3236, 10);
    if (!okMonk) return false;
    await advanceDialogs(c, [/yes, okay, i'm ready to go/i, /yes/i]);
    await c.sleep(2500);

    // Cross gangplank on Entrana ship (L1 2834, 3333 -> L0 2834, 3335)
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 2415, /cross/i, 2834, 3333, 8);
        await c.sleep(1200);
    }

    // Walk to Entrana church (2851, 3349) and talk to High Priest (triggers Crone)
    await walkTo(c, 2851, 3349);
    const okPriest = await interactNpcNear(c, /high priest/i, /talk/i, 2851, 3349, 10);
    if (!okPriest) return false;
    await advanceDialogs(c, [
        /ok, i will go searching/i,
    ], 35);
    stage = 4;

    // Sail back from Entrana (2834, 3335) to Port Sarim
    await walkTo(c, 2834, 3335);
    await interactNpcNear(c, /monk of entrana/i, /talk|take-boat/i, 2834, 3335, 10);
    await advanceDialogs(c, [/yes/i]);
    await c.sleep(2500);
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 2413, /cross/i, 3048, 3232, 8);
        await c.sleep(1200);
    }

    return stage >= 4;
}

async function galahadAndDraynorWhistles(c: QuestContext): Promise<boolean> {
    if (count(c.sdk, /^magic whistle$/i) >= 2 || stage >= 8) return true;

    // Re-withdraw Excalibur & Rune scimitar from Draynor Bank
    await ensureInInventory(c, [{ pattern: /^excalibur$/i, count: 1 }], KEEP_RE);
    await ensureEquipped(c, /rune scimitar/i, 'wield');

    // 1. Get Holy table napkin from Brother Galahad at (2612, 3474)
    if (!hasInv(c, /holy table napkin/i)) {
        await walkToKandarin(c, 2612, 3474);
        const ok = await interactNpcNear(c, /brother galahad/i, /talk/i, 2612, 3474, 10);
        if (!ok) return false;
        await advanceDialogs(c, [
            /i seek an item from the realm of the fisher king/i,
        ], 30);
    }
    if (!hasInv(c, /holy table napkin/i)) return false;

    // 2. Go to Draynor Manor top floor (L2 3106, 3361) and pick up 2 Magic whistles
    await walkTo(c, 3108, 3353);
    if ((c.sdk.getState().player?.worldZ ?? 0) <= 3353) {
        await interactLocNear(c, /large door/i, /open/i, 3108, 3353, 6);
        await c.sleep(1200);
    }
    if ((c.sdk.getState().player?.level ?? 0) === 0) {
        await interactLocNear(c, 11498, /climb-up/i, 3108, 3362, 10);
        await c.sleep(1200);
    }
    if ((c.sdk.getState().player?.level ?? 0) === 1) {
        await interactLocNear(c, 11511, /climb-up/i, 3104, 3362, 10);
        await c.sleep(1200);
    }

    // Open whistledoor (id: 22 at L2 3106, 3361) to spawn 2 Magic whistles at (3107, 3359)
    await walkTo(c, 3106, 3362);
    await interactLocNear(c, 22, /open/i, 3106, 3361, 8);
    await c.sleep(1000);

    for (let i = 0; i < 6 && count(c.sdk, /^magic whistle$/i) < 2; i++) {
        const w = c.sdk.getState().groundItems.find((g: any) => /magic whistle/i.test(g.name));
        if (w) {
            await c.sdk.sendPickup(w.x, w.z, w.id);
            await c.sleep(900);
        } else {
            await interactLocNear(c, 22, /open/i, 3106, 3361, 8);
            await c.sleep(900);
        }
    }

    // Exit Draynor Manor via exitWizardsTowerGround
    await exitWizardsTowerGround(c);
    return count(c.sdk, /^magic whistle$/i) >= 2;
}

async function fisherKingRealmFirstVisit(c: QuestContext): Promise<boolean> {
    if (stage >= 8) return true;

    // Walk to Brimhaven peninsula (2741, 3235)
    if ((c.sdk.getState().player?.worldZ ?? 0) < 4600) {
        await walkToKandarin(c, 2741, 3235);
        await c.sdk.sendWalk(2741, 3235, false);
        await c.sleep(1200);
        const whistle = findInv(c, /^magic whistle$/i);
        if (!whistle) return false;
        await c.sdk.sendUseItem(whistle.slot, 1); // Blow
        await c.sleep(2000);
    }

    if ((c.sdk.getState().player?.worldZ ?? 0) < 4600) return false;

    // Equip Excalibur so the Black Knight Titan can be killed
    await ensureEquipped(c, /^excalibur$/i, 'wield');
    if ((c.sdk.getSkill('Prayer')?.baseLevel ?? 1) >= 43 && (c.sdk.getSkill('Prayer')?.level ?? 0) > 0) {
        await c.bot.activatePrayer('protect_from_melee');
    }

    // Fight Black Knight Titan at (2791, 4722) until teleported west of him (x <= 2790)
    if ((c.sdk.getState().player?.worldX ?? 2806) > 2791) {
        await walkTo(c, 2792, 4722);
        for (let t = 0; t < 90 && (c.sdk.getState().player?.worldX ?? 2806) > 2791; t++) {
            await eatIfLow(c);
            if (c.sdk.getState().dialog.isOpen) {
                await advanceDialogs(c, [/ok, have at ye oh evil knight/i]);
            }
            const titan = c.sdk.getState().nearbyNpcs.find((n: any) => /black knight titan/i.test(n.name));
            if (titan) {
                await c.sdk.sendInteractNpc(titan.index, 2); // Attack
            }
            await c.sleep(1000);
        }
    }
    await c.bot.deactivateAllPrayers();
    if ((c.sdk.getState().player?.worldX ?? 2806) > 2791) return false;

    // Talk to Fisherman at (2798, 4706) to spawn Grail bell at (2762, 4694)
    if (!hasInv(c, /^grail bell$/i)) {
        await walkTo(c, 2798, 4706);
        await interactNpcNear(c, /fisherman/i, /talk/i, 2798, 4706, 12);
        await advanceDialogs(c, [/any idea how to get into the castle/i]);
        await walkTo(c, 2762, 4694);
        for (let i = 0; i < 6 && !hasInv(c, /^grail bell$/i); i++) {
            const bell = c.sdk.getState().groundItems.find((g: any) => /grail bell/i.test(g.name));
            if (bell) {
                await c.sdk.sendPickup(bell.x, bell.z, bell.id);
                await c.sleep(900);
            } else {
                await c.sleep(800);
            }
        }
    }

    // Ring Grail bell outside Grail Castle at (2762, 4691) to enter (teleports to 2761, 4692)
    await walkTo(c, 2762, 4691);
    const bellItem = findInv(c, /^grail bell$/i);
    if (bellItem) {
        await c.sdk.sendUseItem(bellItem.slot, 1); // Ring
        await advanceDialogs(c);
        await c.sleep(1000);
    }

    // Climb staircase 1738 at L0 (2761, 4680) -> L1 and talk to The Fisher King (id: 220 at L1 2762, 4688)
    if ((c.sdk.getState().player?.level ?? 0) === 0) {
        await interactLocNear(c, 1738, /climb-up/i, 2761, 4680, 10);
        await c.sleep(1200);
    }
    const okKing = await interactNpcNear(c, /fisher king/i, /talk/i, 2762, 4688, 10);
    if (!okKing) return false;
    await advanceDialogs(c, [
        /you don't look too well/i,
    ], 30);
    stage = 8;

    // Blow Magic whistle to return to Karamja (2741, 3235)
    const whistle = findInv(c, /^magic whistle$/i);
    if (whistle) {
        await c.sdk.sendUseItem(whistle.slot, 1);
        await c.sleep(1500);
    }
    return stage >= 8;
}

async function rescuePercivalAndClaimGrail(c: QuestContext): Promise<boolean> {
    if (stage >= 10) return true;

    // 1. Prod Sacks (id: 23 at 2962, 3506) in Goblin Village to give Sir Percival a Magic whistle
    if (stage === 8) {
        await walkTo(c, 2961, 3505);
        await interactLocNear(c, 23, /prod/i, 2962, 3506, 6);
        await advanceDialogs(c, [
            /your father wishes to speak to you/i,
        ], 30);
        stage = 9;
    }

    // 2. Return to (2741, 3235), blow Magic whistle to enter restored Grail realm (m41_73)
    if (!hasInv(c, /^holy grail$/i)) {
        if ((c.sdk.getState().player?.worldZ ?? 0) < 4600) {
            await walkToKandarin(c, 2741, 3235);
            await c.sdk.sendWalk(2741, 3235, false);
            await c.sleep(1200);
            const whistle = findInv(c, /^magic whistle$/i);
            if (!whistle) return false;
            await c.sdk.sendUseItem(whistle.slot, 1);
            await c.sleep(2000);
        }
        // Walk to restored Grail Castle (2635, 4693), climb L0->L1 (1738 at 2648, 4683) -> L2 (1747 at 2651, 4684)
        await walkTo(c, 2647, 4684);
        if ((c.sdk.getState().player?.level ?? 0) === 0) {
            await interactLocNear(c, 1738, /climb-up/i, 2648, 4683, 8);
            await c.sleep(1200);
        }
        if ((c.sdk.getState().player?.level ?? 0) === 1) {
            await interactLocNear(c, 1747, /climb-up/i, 2651, 4684, 8);
            await c.sleep(1200);
        }
        // Take Holy grail (id: 19 at L2 2649, 4684)
        await walkTo(c, 2649, 4684);
        for (let i = 0; i < 6 && !hasInv(c, /^holy grail$/i); i++) {
            const g = c.sdk.getState().groundItems.find((it: any) => /holy grail/i.test(it.name) || it.id === 19);
            if (g) {
                await c.sdk.sendPickup(g.x, g.z, g.id);
                await c.sleep(1000);
            } else {
                await c.sleep(800);
            }
        }
        // Blow Magic whistle to return to Karamja
        const whistle = findInv(c, /^magic whistle$/i);
        if (whistle) {
            await c.sdk.sendUseItem(whistle.slot, 1);
            await c.sleep(1500);
        }
    }
    if (!hasInv(c, /^holy grail$/i)) return false;

    // 3. Hand Holy grail to King Arthur at Camelot (2763, 3513)
    await walkToKandarin(c, 2763, 3513);
    const prayBefore = xp(c.sdk, 'Prayer');
    const okArthur = await interactNpcNear(c, /king arthur/i, /talk/i, 2763, 3513, 12);
    if (!okArthur) return false;
    await advanceDialogs(c, [], 25);
    await c.sleep(1500);
    if (xp(c.sdk, 'Prayer') > prayBefore || !hasInv(c, /^holy grail$/i)) {
        stage = 10;
        return true;
    }
    return false;
}

export const holyGrail: QuestModule = {
    id: 'grail',
    name: 'Holy Grail',
    isComplete: () => stage >= 10,
    steps: [
        { name: 'start-camelot-and-merlin', isDone: () => stage >= 3, run: startCamelotAndMerlin },
        { name: 'entrana-high-priest-and-crone', isDone: () => stage >= 4, run: entranaHighPriestAndCrone },
        {
            name: 'galahad-and-draynor-whistles',
            isDone: (c) => stage >= 8 || count(c.sdk, /^magic whistle$/i) >= 2,
            run: galahadAndDraynorWhistles,
        },
        { name: 'fisher-king-realm-first-visit', isDone: () => stage >= 8, run: fisherKingRealmFirstVisit },
        { name: 'rescue-percival-and-claim-grail', isDone: () => stage >= 10, run: rescuePercivalAndClaimGrail },
    ],
};
export const grail = holyGrail;

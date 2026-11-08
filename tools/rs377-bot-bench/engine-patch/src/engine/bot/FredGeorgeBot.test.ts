import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import World from '#/engine/World.js';
import BotPlayer from '#/engine/entity/BotPlayer.js';
import Player, { getBotPlayerClass, isBotPlayer } from '#/engine/entity/Player.js';
import { PlayerLoading } from '#/engine/entity/PlayerLoading.js';
import { PlayerStat } from '#/engine/entity/PlayerStat.js';
import InvType from '#/cache/config/InvType.js';
import ObjType from '#/cache/config/ObjType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import Packet from '#/io/Packet.js';
import ClientCheatHandler from '#/network/game/client/handler/ClientCheatHandler.js';
import ClientCheat from '#/network/game/client/model/ClientCheat.js';
import { toBase37 } from '#/util/JString.js';
import {
    buildTenMinuteSnapshot,
    computeStartingSignature,
    formatBotWhereabouts,
    fredGeorgeLogoutAccountKey,
    handleBotPrivateMessage,
    getFredGeorgeBotStates,
    spawnFredAndGeorgeBots,
    tickFredAndGeorgeBots
} from '#/engine/bot/FredGeorgeBot.js';

let worldInitialized = false;
const testTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fg-test-saves-'));
process.env.JOSHRS_FG_SAVE_DIR = testTmpDir;
process.env.JOSHRS_FG_STATE_FILE = path.join(testTmpDir, 'live-bot-state.json');
process.env.JOSHRS_FG_REPORTS_ROOT = path.join(testTmpDir, 'reports');

async function ensureWorld(): Promise<void> {
    if (!worldInitialized) {
        process.env.JOSHRS_FRED_GEORGE = '1';
        process.env.DEV_LUNA_BOT = 'false';
        await World.start(false, false);
        worldInitialized = true;
    }
}

test('0. Relog acknowledgement tracks the actual lower-case login identity', () => {
    // Actual native PlayerLoading (not a mocked display name) lowercases account keys.
    const fred = PlayerLoading.load('Fred', new Packet(new Uint8Array(0)), null);
    const george = PlayerLoading.load('George', new Packet(new Uint8Array(0)), null);
    assert.equal(fred.username, 'fred');
    assert.equal(george.username, 'george');
    assert.equal(fredGeorgeLogoutAccountKey('Fred', fred), 'fred');
    assert.equal(fredGeorgeLogoutAccountKey('George', george), 'george');
    assert.equal(fredGeorgeLogoutAccountKey('Fred', null), 'fred');
    const awaiting = new Map<string, { save: Uint8Array; lastAttempt: number }>([['fred', { save: new Uint8Array(0), lastAttempt: 0 }]]);
    assert.equal(awaiting.has('Fred'), false, 'Old capitalised key falsely signalled save complete');
    assert.equal(awaiting.has(fredGeorgeLogoutAccountKey('Fred', fred)), true, 'Must wait for real login thread acknowledgement');
});

test('1. BotPlayer/Player circular import regression: Player and BotPlayer initialize without TDZ ReferenceError', async () => {
    await ensureWorld();
    assert.equal(typeof Player, 'function');
    assert.equal(typeof BotPlayer, 'function');
    assert.equal(getBotPlayerClass(), BotPlayer);

    const bot = new BotPlayer('testbot', toBase37('testbot'), 12345n);
    assert.equal(isBotPlayer(bot), true);
    assert.equal(bot instanceof Player, true);
});

test('2. Fresh Fred & George accounts reach mainland with identical starting_signature and persist across .sav reload', async () => {
    await ensureWorld();

    // Run ticks so Fred & George log in, complete Tutorial Island, and verify relog persistence
    for (let i = 0; i < 65; i++) {
        World.cycle(false);
        if (World.logoutRequests.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 15));
        }
    }

    const fred = World.getPlayerByUsername('Fred');
    const george = World.getPlayerByUsername('George');
    assert.ok(fred, 'Fred should be active in World');
    assert.ok(george, 'George should be active in World');
    // The first .sav existence check is not enough: admission must actually finish.
    const states = getFredGeorgeBotStates();
    for (const [name, player] of [['Fred', fred], ['George', george]] as const) {
        assert.equal(states[name].relogVerified, true, name + ' must prove game-world admission');
        assert.equal(states[name].relogTick, -1, name + ' must finish pending admission');
        assert.equal(states[name].player, player, name + ' state must reference real world player');
        assert.equal(player.isActive, true, name + ' must be active');
        assert.ok(player.slot >= 0, name + ' must be assigned a world slot');
    }

    const fredSig = computeStartingSignature(fred);
    const georgeSig = computeStartingSignature(george);
    assert.equal(fredSig.length, 32);
    assert.equal(fredSig, georgeSig, 'Fred and George must have identical starting_signature');

    // Verify .sav files exist and pass PlayerLoading.verify
    const fredSav = path.join(testTmpDir, 'Fred.sav');
    const georgeSav = path.join(testTmpDir, 'George.sav');
    assert.equal(fs.existsSync(fredSav), true, 'Fred.sav should be persisted');
    assert.equal(fs.existsSync(georgeSav), true, 'George.sav should be persisted');
    assert.equal(PlayerLoading.verify(new Packet(fs.readFileSync(fredSav))), true);
    assert.equal(PlayerLoading.verify(new Packet(fs.readFileSync(georgeSav))), true);
});

test("3. George (quest_first) opens Lumbridge Castle doors, starts Cook's Assistant, and completes hand-in for 3000 tenths Cooking XP", async () => {
    await ensureWorld();
    const george = World.getPlayerByUsername('George');
    assert.ok(george, 'George should be online');

    const cookVarp = VarPlayerType.getId('cookquest');
    assert.notEqual(cookVarp, -1);

    // Run ticks until George navigates the 3 Lumbridge Castle doors and starts Cook's Assistant (%cookquest = 1)
    for (let i = 0; i < 220 && (george.getVar(cookVarp) as number) === 0; i++) {
        World.cycle(false);
    }
    assert.equal(george.getVar(cookVarp), 1, "George should start Cook's Assistant (%cookquest = 1)");

    // Place the 3 quest ingredients (bucket_milk, egg, pot_flour) and verify George hands them in to complete %cookquest = 2
    george.invAdd(InvType.INV, ObjType.getId('bucket_milk'), 1);
    george.invAdd(InvType.INV, ObjType.getId('egg'), 1);
    george.invAdd(InvType.INV, ObjType.getId('pot_flour'), 1);

    for (let i = 0; i < 120 && (george.getVar(cookVarp) as number) < 2; i++) {
        World.cycle(false);
    }
    assert.equal(george.getVar(cookVarp), 2, "George should complete Cook's Assistant (%cookquest = 2)");
    assert.ok(george.stats[PlayerStat.COOKING] >= 3000, 'George should earn 300.0 Cooking XP (3000 tenths)');

    // Ensure relog verification after quest completion finishes so George is back online for test 4
    for (let i = 0; i < 20; i++) {
        World.cycle(false);
        if (World.logoutRequests.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 15));
        }
    }
});

test('4. Elrothiro social locator commands (::wherefred, ::wheregeorge, ::wherebots) and Private Message reply', async () => {
    await ensureWorld();
    const linesAll = formatBotWhereabouts(World);
    assert.equal(linesAll.length, 2);
    assert.match(linesAll[0], /Fred.*gather_first.*ONLINE/);
    assert.match(linesAll[1], /George.*quest_first.*ONLINE/);
    assert.doesNotMatch(linesAll.join('\n'), /@(?:dre|bla|blu|gre|yel|red)@/, 'Game chat must not contain literal colour-code tags');

    const elrothiro = PlayerLoading.load('elrothiro', new Packet(new Uint8Array(0)), null);
    const messages: string[] = [];
    elrothiro.messageGame = (msg: string) => {
        messages.push(msg);
    };

    const cheatHandler = new ClientCheatHandler();
    cheatHandler.handle(new ClientCheat('wherebots'), elrothiro as any);
    assert.equal(messages.length, 2);
    assert.match(messages[0], /Fred/);
    assert.match(messages[1], /George/);

    const pmPackets: any[] = [];
    elrothiro.write = (msg: any) => {
        pmPackets.push(msg);
    };
    const replied = handleBotPrivateMessage(World, elrothiro, 'Fred', 'Where are you Fred?');
    assert.equal(replied, true);
    assert.equal(pmPackets.length, 1);
    assert.match(pmPackets[0].msg, /Hi elrothiro! I'm in Lumbridge/i);

    // Verify 10-minute snapshot schema
    const now = new Date();
    const start = new Date(now.getTime() - 10 * 60 * 1000);
    const snap = buildTenMinuteSnapshot('Fred', start, now, World);
    assert.equal(snap.schema, 'joshrs-ab-ten-minute-v1');
    assert.equal(snap.fresh_account, true);
    assert.equal(snap.items_seeded, false);
    assert.equal(snap.cheats_enabled, false);
    assert.equal(snap.accelerated_time, false);
    assert.equal(snap.xp_multiplier, 1);
    assert.equal(snap.tick_ms, 600);
    assert.equal(typeof snap.starting_signature, 'string');
    assert.equal(snap.starting_signature.length, 32);
});

test.after(() => {
    setTimeout(() => process.exit(0), 100);
});

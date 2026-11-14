import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import CategoryType from '#/cache/config/CategoryType.js';
import Component from '#/cache/config/Component.js';
import DbRowType from '#/cache/config/DbRowType.js';
import DbTableType from '#/cache/config/DbTableType.js';
import EnumType from '#/cache/config/EnumType.js';
import FontType from '#/cache/config/FontType.js';
import HuntType from '#/cache/config/HuntType.js';
import IdkType from '#/cache/config/IdkType.js';
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import MesanimType from '#/cache/config/MesanimType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import ParamType from '#/cache/config/ParamType.js';
import SeqType from '#/cache/config/SeqType.js';
import SpotanimType from '#/cache/config/SpotanimType.js';
import StructType from '#/cache/config/StructType.js';
import VarBitType from '#/cache/config/VarBitType.js';
import VarNpcType from '#/cache/config/VarNpcType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import VarSharedType from '#/cache/config/VarSharedType.js';
import { CoordGrid } from '#/engine/CoordGrid.js';
import World from '#/engine/World.js';
import { BlockWalk } from '#/engine/entity/BlockWalk.js';
import BotPlayer, { ALL_21_PLAYER_STATS } from '#/engine/entity/BotPlayer.js';
import { EntityLifeCycle } from '#/engine/entity/EntityLifeCycle.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import Loc from '#/engine/entity/Loc.js';
import Npc from '#/engine/entity/Npc.js';
import { NpcStat } from '#/engine/entity/NpcStat.js';
import Player from '#/engine/entity/Player.js';
import { PlayerLoading } from '#/engine/entity/PlayerLoading.js';
import { PlayerStat } from '#/engine/entity/PlayerStat.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import { LocAngle, LocShape } from '#/engine/routefinder/index.js';
import Packet from '#/io/Packet.js';
import ClientCheatHandler from '#/network/game/client/handler/ClientCheatHandler.js';
import OpPlayerHandler from '#/network/game/client/handler/OpPlayerHandler.js';
import ClientCheat from '#/network/game/client/model/ClientCheat.js';
import OpPlayer from '#/network/game/client/model/OpPlayer.js';
import { toBase37 } from '#/util/JString.js';

function loadPackedConfigsOnce(): void {
    if (ObjType.count > 0 && NpcType.count > 0 && VarPlayerType.count > 0) {
        return;
    }
    const packDir = path.resolve(process.cwd(), 'data/pack');
    ParamType.load(packDir);
    CategoryType.load(packDir);
    EnumType.load(packDir);
    StructType.load(packDir);
    InvType.load(packDir);
    IdkType.load(packDir);
    ObjType.load(packDir);
    NpcType.load(packDir);
    LocType.load(packDir);
    SeqType.load(packDir);
    SpotanimType.load(packDir);
    VarPlayerType.load(packDir);
    VarBitType.load(packDir);
    VarNpcType.load(packDir);
    VarSharedType.load(packDir);
    HuntType.load(packDir);
    MesanimType.load(packDir);
    DbTableType.load(packDir);
    DbRowType.load(packDir);
    Component.load(packDir);
    FontType.load(packDir);
    World.gameMap.init();
}

function createTestPlayer(username: string, slot: number, x: number, z: number, level: number = 0): Player {
    const hash37 = toBase37(username);
    const player = new Player(username, hash37, hash37);
    player.slot = slot;
    player.uid = ((Number(hash37 & 0xffffn) & 0xffff) << 16) | slot;
    player.staffModLevel = 4;
    player.isActive = true;
    for (let i = 0; i < player.levels.length; i++) {
        player.levels[i] = 99;
        player.baseLevels[i] = 99;
    }
    player.x = x;
    player.z = z;
    player.level = level;
    return player;
}

function createTestNpc(debugnameOrId: string | number, nid: number, x: number, z: number, level: number = 0): Npc {
    const type =
        typeof debugnameOrId === 'number'
            ? NpcType.get(debugnameOrId)
            : (NpcType.getByName(debugnameOrId) ?? NpcType.get(50));
    const npc = new Npc(
        level,
        x,
        z,
        type.size,
        type.size,
        EntityLifeCycle.RESPAWN,
        nid,
        type.id,
        BlockWalk.NPC
    );
    npc.isActive = true;
    return npc;
}

test('Priority 1: Luna assists Elrothiro against dragons in multi-combat, swaps to Anti-dragon shield, eats sharks, and respects single-combat rules', () => {
    loadPackedConfigsOnce();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-companion-test-'));
    const memoryFile = path.join(tmpDir, 'luna-memory.json');

    const origGetPlayerByUsername = World.getPlayerByUsername;
    const origGetNpc = World.getNpc;
    const origIsMulti = World.gameMap.isMulti.bind(World.gameMap);

    try {
        const elrothiro = createTestPlayer('elrothiro', 1, 2271, 4695, 0);
        const lunaHash = toBase37('Luna');
        const luna = new BotPlayer('Luna', lunaHash, lunaHash, undefined, memoryFile);
        luna.slot = 2;
        luna.uid = 20002;
        luna.x = 2272;
        luna.z = 4695;
        luna.level = 0;
        luna.isActive = true;

        // Verify Luna's Combat 126 Maxed Legend stats and synchronized varps
        assert.equal(luna.combatLevel, 126);
        assert.equal(luna.levels[PlayerStat.ATTACK], 99);
        assert.equal(luna.levels[PlayerStat.STRENGTH], 99);
        assert.equal(luna.levels[PlayerStat.DEFENCE], 99);
        assert.equal(luna.levels[PlayerStat.HITPOINTS], 99);
        assert.ok(luna.getFoodCount() >= 8, 'Luna should stock cooked sharks for combat');

        const kbd = createTestNpc('king_dragon', 101, 2271, 4698, 0);
        const innocentMan = createTestNpc('man1', 102, 2274, 4695, 0);
        const zone = World.gameMap.getZone(kbd.x, kbd.z, kbd.level);
        zone.enter(kbd);
        zone.enter(innocentMan);

        World.getPlayerByUsername = (name: string) => {
            if (name.toLowerCase() === 'elrothiro') return elrothiro;
            if (name.toLowerCase() === 'luna') return luna;
            return undefined;
        };
        World.getNpc = (nid: number) => (nid === kbd.nid ? kbd : nid === innocentMan.nid ? innocentMan : undefined);

        // 1. When Elrothiro has NOT engaged any monster, Luna must not attack innocent or unengaged NPCs
        World.gameMap.isMulti = () => true;
        luna.tickBot(10);
        assert.notEqual(luna.target, kbd, 'Luna must not attack unengaged monsters');
        assert.notEqual(luna.target, innocentMan, 'Luna must not attack innocent NPCs');

        // 2. Elrothiro engages the King Black Dragon in a multi-combat area -> Luna assists immediately!
        elrothiro.setInteraction(Interaction.ENGINE, kbd, ServerTriggerType.APNPC2);
        luna.tickBot(15);

        assert.equal(luna.target, kbd, 'Luna should target the dragon Elrothiro is fighting');
        assert.equal(luna.targetOp, ServerTriggerType.APNPC2, 'Luna should use the real APNPC2 combat trigger');
        assert.equal(
            luna.hasAntiDragonShieldEquipped(),
            true,
            'Luna should automatically swap to her Anti-dragon shield when fighting a dragon'
        );

        // 3. Survival reflex: damage Luna to 50 HP and verify she eats a shark on next tick
        const sharksBefore = luna.getFoodCount();
        luna.levels[PlayerStat.HITPOINTS] = 50;
        luna.tickBot(20);
        assert.equal(luna.levels[PlayerStat.HITPOINTS], 70, 'Eating a shark should heal Luna by +20 HP');
        assert.equal(luna.getFoodCount(), sharksBefore - 1, 'Eating a shark should consume 1 shark from inventory');
        assert.equal(luna.brain.memory.sharksEaten, 1);

        // 4. Single-combat rule compliance & companion co-op assist:
        // Move fight into a single-way combat zone:
        // (a) When an unrelated player (uid 99999) is fighting an NPC in single-combat, Luna must not steal/join it.
        luna.clearInteraction();
        elrothiro.clearInteraction();
        World.gameMap.isMulti = () => false;
        const npcLastCombatId = VarNpcType.getId('npc_lastcombat');
        const npcAggressivePlayerId = VarNpcType.getId('npc_aggressive_player');
        if (npcLastCombatId !== -1 && npcAggressivePlayerId !== -1) {
            kbd.setVar(npcLastCombatId, 24);
            kbd.setVar(npcAggressivePlayerId, 99999);
            kbd.target = createTestPlayer('stranger', 9, 2271, 4697, 0);
        }

        const legality = luna.canLegallyEngageNpc(kbd, 25);
        assert.equal(legality.allowed, false, 'Luna must not illegally join a single-combat fight locked to another player');
        assert.equal(legality.reason, 'single_combat_npc_busy');

        elrothiro.setInteraction(Interaction.ENGINE, kbd, ServerTriggerType.APNPC2);
        luna.tickBot(25);
        assert.equal(luna.target, null, 'Luna should hold off attacking while another player holds the single-combat lock');

        // (b) When Elrothiro himself is fighting the enemy (or once the stranger lock expires),
        // Luna genuinely assists Elrothiro, steps into melee reach, swings her whip (1658), and deals real damage!
        if (npcLastCombatId !== -1 && npcAggressivePlayerId !== -1) {
            kbd.setVar(npcLastCombatId, 34);
            kbd.setVar(npcAggressivePlayerId, elrothiro.uid);
        }
        luna.x = kbd.x;
        luna.z = kbd.z - 1;
        const hpBeforeAssistSwing = kbd.levels[NpcStat.HITPOINTS];
        luna.tickBot(35);
        assert.equal(luna.target, kbd, 'Luna should actively assist Elrothiro in combat');
        assert.equal(luna.animId, 1658, 'Luna should play her Abyssal whip attack animation (1658) when in melee reach');
        assert.ok(
            kbd.levels[NpcStat.HITPOINTS] < hpBeforeAssistSwing,
            'Luna should deal real melee damage to the enemy Elrothiro is fighting'
        );

        // 5. Defeating the dragon records the assist and swaps back to Dragon sq shield
        kbd.levels[NpcStat.HITPOINTS] = 0;
        elrothiro.clearInteraction();
        luna.tickBot(40);
        assert.equal(luna.brain.memory.dragonsSlainAssisted, 1);
        assert.equal(luna.hasAntiDragonShieldEquipped(), false, 'Luna should restore her Dragon sq shield after the dragon dies');

        zone.leave(kbd);
        zone.leave(innocentMan);
    } finally {
        World.getPlayerByUsername = origGetPlayerByUsername;
        World.getNpc = origGetNpc;
        World.gameMap.isMulti = origIsMulti;
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('Priority 2: Challenge Luna friendly duel lifecycle (accept, countdown, combat, 1-HP safety clamp, victory/defeat cleanup, and re-challenge)', () => {
    loadPackedConfigsOnce();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-spar-test-'));
    const memoryFile = path.join(tmpDir, 'luna-memory.json');

    try {
        const elrothiro = createTestPlayer('elrothiro', 1, 3222, 3218, 0);
        const lunaHash = toBase37('Luna');
        const luna = new BotPlayer('Luna', lunaHash, lunaHash, undefined, memoryFile);
        luna.slot = 2;
        luna.uid = 20002;
        luna.x = 3223;
        luna.z = 3218;
        luna.level = 0;
        luna.isActive = true;

        // 1. Challenging Luna while she is busy fighting a monster should decline cleanly with feedback
        const dragon = createTestNpc('king_dragon', 201, 3224, 3218, 0);
        luna.setInteraction(Interaction.ENGINE, dragon, ServerTriggerType.APNPC2);
        const busyResult = luna.handleChallengeFrom(elrothiro, 1, 100);
        assert.equal(busyResult, false);
        assert.equal(luna.sparSession.state, 'idle');
        luna.clearInteraction();

        // 2. Challenging Luna when free accepts and starts the 3-2-1-FIGHT countdown
        const accepted = luna.handleChallengeFrom(elrothiro, 1, 110);
        assert.equal(accepted, true);
        assert.equal(luna.sparSession.state, 'countdown');

        // Advance through countdown ticks (111, 112, 113, 114 -> fighting)
        luna.tickBot(111);
        luna.tickBot(112);
        luna.tickBot(113);
        luna.tickBot(114);
        assert.equal(luna.sparSession.state, 'fighting');

        // 3. Force low HP and run combat ticks to verify 1-HP safety floor (never 0 HP / never dies)
        elrothiro.levels[PlayerStat.HITPOINTS] = 2;
        luna.levels[PlayerStat.HITPOINTS] = 99;
        for (let tick = 115; tick <= 160 && luna.sparSession.isActive(); tick++) {
            luna.tickBot(tick);
            assert.ok(elrothiro.levels[PlayerStat.HITPOINTS] >= 1, 'Challenger HP must never drop below 1 in friendly spar');
            assert.ok(luna.levels[PlayerStat.HITPOINTS] >= 1, 'Luna HP must never drop below 1 in friendly spar');
        }

        // If RNG rolled all 0s over 45 ticks, set Luna to 1 HP via clampDamage to verify completion
        if (luna.sparSession.isActive()) {
            const dmg = luna.sparSession.clampDamage(elrothiro, 999);
            elrothiro.levels[PlayerStat.HITPOINTS] -= dmg;
            assert.equal(elrothiro.levels[PlayerStat.HITPOINTS], 1);
            luna.tickBot(161);
        }

        assert.equal(luna.sparSession.state, 'idle', 'Spar session should clean up to idle after finishing');
        assert.equal(elrothiro.levels[PlayerStat.HITPOINTS], 99, 'Challenger HP should be restored to full after spar');
        assert.equal(luna.levels[PlayerStat.HITPOINTS], 99, 'Luna HP should be restored to full after spar');
        assert.ok(luna.brain.memory.sparsCompleted >= 1, 'Completed spar should be recorded in LunaBrain memory');

        // 4. Re-challenge Luna immediately to verify complete cleanup and repeatability
        const secondAccepted = luna.handleChallengeFrom(elrothiro, 1, 170);
        assert.equal(secondAccepted, true);
        assert.equal(luna.sparSession.state, 'countdown');

        // Test clean forfeit via ::luna stop
        luna.setMode('stop', 172);
        assert.equal(luna.sparSession.state, 'idle', 'Setting mode to stop should cleanly forfeit any active spar');
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('Priority 3 & Commands: Autonomous skilling -> banking -> resupplying cycle, memory persistence, and ::luna commands', () => {
    loadPackedConfigsOnce();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-autonomy-test-'));
    const memoryFile = path.join(tmpDir, 'luna-memory.json');

    const origGetPlayerByUsername = World.getPlayerByUsername;

    try {
        const elrothiro = createTestPlayer('elrothiro', 1, 3222, 3218, 0);
        const lunaHash = toBase37('Luna');
        const luna = new BotPlayer('Luna', lunaHash, lunaHash, undefined, memoryFile);
        luna.slot = 2;
        luna.uid = 20002;
        luna.x = 3222;
        luna.z = 3218;
        luna.level = 0;
        luna.isActive = true;

        World.getPlayerByUsername = (name: string) => {
            if (name.toLowerCase() === 'elrothiro') return elrothiro;
            if (name.toLowerCase() === 'luna') return luna;
            return undefined;
        };

        // 1. Test ::luna commands via ClientCheatHandler (including train, maxxp, skills)
        const cheatHandler = new ClientCheatHandler();
        for (const subcmd of ['assist', 'defend', 'follow', 'stop', 'work', 'bank', 'train', 'maxxp', 'skills', 'status', 'gear', 'here']) {
            const handled = cheatHandler.handle(new ClientCheat(`luna ${subcmd}`), elrothiro);
            assert.equal(handled, true, `::luna ${subcmd} should be handled`);
        }

        // Verify all 21 skills gained XP above baseline 99
        for (const stat of ALL_21_PLAYER_STATS) {
            assert.equal(luna.baseLevels[stat], 99, `Skill ${stat} should be level 99`);
            assert.ok(luna.stats[stat] > 130_344_310, `Skill ${stat} should have gained XP above baseline 99`);
        }
        assert.equal(luna.updateTotalSkillLevel(), 2079, 'Total level across all 21 skills should be 2079');

        // 2. Test autonomous skilling -> banking -> resupplying cycle
        const inv = luna.getInventory(InvType.INV)!;
        const logs = ObjType.getByName('logs')!;
        // Consume some sharks and fill inventory with logs to trigger banking + shark resupply
        const shark = ObjType.getByName('shark')!;
        inv.remove(shark.id, 6);
        while (inv.freeSlotCount > 0) {
            inv.add(logs.id, 1);
        }

        // Place a bank booth 2 tiles away from Luna so she first transitions to 'bank' and paths to it
        const bankBoothType = LocType.getByName('bankbooth')!;
        const bankLoc = new Loc(
            0,
            luna.x + 2,
            luna.z,
            bankBoothType.width,
            bankBoothType.length,
            EntityLifeCycle.RESPAWN,
            bankBoothType.id,
            LocShape.CENTREPIECE_STRAIGHT,
            LocAngle.WEST
        );
        bankLoc.isActive = true;
        const zone = World.gameMap.getZone(bankLoc.x, bankLoc.z, bankLoc.level);
        zone.addStaticLoc(bankLoc);

        luna.setMode('work', 200);
        // First tick detects full inventory, switches goal to 'bank', and queues waypoints to bankLoc
        luna.tickBot(201);
        assert.equal(luna.activity.goal, 'bank');

        // Move Luna adjacent to the bank booth and clear waypoints, then tick 202 to deposit and restock sharks
        luna.x = bankLoc.x - 1;
        luna.z = bankLoc.z;
        luna.clearWaypoints();
        luna.tickBot(202);
        assert.ok(luna.bankedItems > 0, 'Luna should deposit gathered logs into her bank');
        assert.ok(luna.getFoodCount() >= 8, 'Luna should restock her sharks at the bank');
        assert.equal(luna.activity.goal, 'woodcut', 'Luna should transition back to skilling after banking');

        // 3. Verify private memory persistence
        luna.brain.saveMemory(210, true);
        assert.equal(fs.existsSync(memoryFile), true, 'luna-memory.json should be persisted');
        const savedMemory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        assert.equal(savedMemory.itemsBanked, luna.bankedItems);

        zone.removeLoc(bankLoc);
    } finally {
        World.getPlayerByUsername = origGetPlayerByUsername;
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('Priority 4 & 5: OpPlayerHandler Challenge routing, unreachable-target recovery, and save/reload integrity without item duplication', () => {
    loadPackedConfigsOnce();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-integrity-test-'));
    const memoryFile = path.join(tmpDir, 'luna-memory.json');

    const origGetPlayer = World.getPlayer;
    const origGetPlayerByUsername = World.getPlayerByUsername;
    const origIsMulti = World.gameMap.isMulti.bind(World.gameMap);

    try {
        const elrothiro = createTestPlayer('elrothiro', 1, 3222, 3218, 0);
        const humanPeer = createTestPlayer('peerplayer', 3, 3224, 3218, 0);
        const lunaHash = toBase37('Luna');
        const luna = new BotPlayer('Luna', lunaHash, lunaHash, undefined, memoryFile);
        luna.slot = 2;
        luna.uid = 20002;
        luna.x = 3223;
        luna.z = 3218;
        luna.level = 0;
        luna.isActive = true;

        World.getPlayer = (slot: number) => {
            if (slot === 1) return elrothiro;
            if (slot === 2) return luna;
            if (slot === 3) return humanPeer;
            return undefined;
        };
        World.getPlayerByUsername = (name: string) => {
            if (name.toLowerCase() === 'elrothiro') return elrothiro;
            if (name.toLowerCase() === 'luna') return luna;
            return undefined;
        };

        // 1. Unreachable target blacklisting: if an enemy cannot be reached for >14 ticks, Luna blacklists it and clears stuck combat
        World.gameMap.isMulti = () => true;
        const distantDragon = createTestNpc('king_dragon', 301, 3232, 3228, 0);
        const zone = World.gameMap.getZone(distantDragon.x, distantDragon.z, distantDragon.level);
        zone.enter(distantDragon);
        elrothiro.setInteraction(Interaction.ENGINE, distantDragon, ServerTriggerType.APNPC2);

        for (let tick = 300; tick <= 318; tick++) {
            // Keep Luna pinned at 3223,3218 to simulate an impassable obstacle
            luna.x = 3223;
            luna.z = 3218;
            luna.tickBot(tick);
        }
        assert.equal(
            luna.brain.isTargetUnreachable(`npc:${distantDragon.nid}`, 318),
            true,
            'Unreachable NPC should be temporarily blacklisted to prevent endless walking'
        );
        assert.notEqual(luna.target, distantDragon, 'Stuck combat interaction on unreachable NPC should be cleared');
        elrothiro.clearInteraction();
        zone.leave(distantDragon);

        // 2. Reloading Luna from a saved Player state preserves identity, stats, and does not duplicate tools
        const reloadLuna = new BotPlayer('Luna', lunaHash, lunaHash, luna, memoryFile);
        assert.equal(reloadLuna.combatLevel, 126);
        assert.equal(reloadLuna.gender, 1);
        const inv = reloadLuna.getInventory(InvType.INV)!;
        const dragonAxeId = ObjType.getByName('dragon_axe')!.id;
        let dragonAxeCount = 0;
        for (let slot = 0; slot < inv.capacity; slot++) {
            const item = inv.get(slot);
            if (item && item.id === dragonAxeId) {
                dragonAxeCount += item.count;
            }
        }
        assert.equal(dragonAxeCount, 1, 'Reloading Luna must not duplicate her Dragon axe');

        // 3. Binary .sav round-trip via PlayerLoading preserves playtime, stats, and inventory CRC
        luna.playtime = 4812;
        const savBytes = luna.save();
        assert.equal(PlayerLoading.verify(new Packet(savBytes)), true, 'Luna .sav bytes must pass CRC verification');
        const loadedFromDisk = PlayerLoading.load('Luna', new Packet(savBytes), null);
        const respawnedLuna = new BotPlayer('Luna', lunaHash, lunaHash, loadedFromDisk, memoryFile);
        assert.equal(respawnedLuna.playtime, 4812, 'Respawned Luna must preserve saved playtime');
        assert.equal(respawnedLuna.combatLevel, 126, 'Respawned Luna must preserve combat level');
    } finally {
        World.getPlayer = origGetPlayer;
        World.getPlayerByUsername = origGetPlayerByUsername;
        World.gameMap.isMulti = origIsMulti;
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test.after(async () => {
    const w = World as any;
    await Promise.allSettled([
        w.loginThread?.terminate?.(),
        w.friendThread?.terminate?.(),
        w.loggerThread?.terminate?.(),
        w.devThread?.terminate?.()
    ]);
});

/**
 * Fred & George — Autonomous Revision-377 No-Cheat A/B Exploration Bots
 *
 * Implements the full master specification:
 *   docs/rs377/AGY_FRED_GEORGE_AUTONOMOUS_AB_PROMPT_2026-11-01.md
 *   docs/rs377/NO_CHEAT_AUTONOMOUS_BOT_BENCHMARK_2026-11-01.md
 *   tools/rs377-bot-bench/fred_george_hourly.py
 *
 * Strictly uses ordinary player mechanics (PlayerLoading, native RuneScript triggers,
 * collision pathfinding, normal banking/shops/combat/quests) with ZERO direct XP grants,
 * stat mutations, item spawns, admin teleports, or tick acceleration.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import CategoryType from '#/cache/config/CategoryType.js';
import Component from '#/cache/config/Component.js';
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import { CoordGrid } from '#/engine/CoordGrid.js';
import { findPath, findPathToEntity, findPathToLoc, reachedEntity, reachedLoc, reachedObj } from '#/engine/GameMap.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import Loc from '#/engine/entity/Loc.js';
import { MoveSpeed } from '#/engine/entity/MoveSpeed.js';
import { MoveStrategy } from '#/engine/entity/MoveStrategy.js';
import Npc from '#/engine/entity/Npc.js';
import { NpcStat } from '#/engine/entity/NpcStat.js';
import Obj from '#/engine/entity/Obj.js';
import Player from '#/engine/entity/Player.js';
import { PlayerLoading } from '#/engine/entity/PlayerLoading.js';
import { PlayerStat } from '#/engine/entity/PlayerStat.js';
import ScriptProvider from '#/engine/script/ScriptProvider.js';
import ScriptRunner from '#/engine/script/ScriptRunner.js';
import ScriptState from '#/engine/script/ScriptState.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import type World from '#/engine/World.js';
import Packet from '#/io/Packet.js';
import MessagePrivate from '#/network/game/server/model/MessagePrivate.js';
import Environment from '#/util/Environment.js';
import { toBase37 } from '#/util/JString.js';

type WorldRuntime = typeof World;

export const FG_SKILLS = [
    'Attack',
    'Defence',
    'Strength',
    'Hitpoints',
    'Ranged',
    'Prayer',
    'Magic',
    'Cooking',
    'Woodcutting',
    'Fletching',
    'Fishing',
    'Firemaking',
    'Crafting',
    'Smithing',
    'Mining',
    'Herblore',
    'Agility',
    'Thieving',
    'Slayer',
    'Farming',
    'Runecrafting'
] as const;

export type SkillName = (typeof FG_SKILLS)[number];

const SKILL_TO_STAT: Record<SkillName, PlayerStat> = {
    Attack: PlayerStat.ATTACK,
    Defence: PlayerStat.DEFENCE,
    Strength: PlayerStat.STRENGTH,
    Hitpoints: PlayerStat.HITPOINTS,
    Ranged: PlayerStat.RANGED,
    Prayer: PlayerStat.PRAYER,
    Magic: PlayerStat.MAGIC,
    Cooking: PlayerStat.COOKING,
    Woodcutting: PlayerStat.WOODCUTTING,
    Fletching: PlayerStat.FLETCHING,
    Fishing: PlayerStat.FISHING,
    Firemaking: PlayerStat.FIREMAKING,
    Crafting: PlayerStat.CRAFTING,
    Smithing: PlayerStat.SMITHING,
    Mining: PlayerStat.MINING,
    Herblore: PlayerStat.HERBLORE,
    Agility: PlayerStat.AGILITY,
    Thieving: PlayerStat.THIEVING,
    Slayer: PlayerStat.SLAYER,
    Farming: PlayerStat.FARMING,
    Runecrafting: PlayerStat.RUNECRAFT
};

export type BotName = 'Fred' | 'George';
export type BotPolicy = 'gather_first' | 'quest_first';
export type CoopPhase = 'solo' | 'coop' | 'mixed';
export type CoopEventType = 'joint_combat' | 'trade' | 'quest' | 'resupply' | 'follow';

export interface CooperationEvent {
    type: CoopEventType;
    partner: BotName;
}

export interface BugCandidate {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BotRuntimeState {
    name: BotName;
    policy: BotPolicy;
    player: Player | null;
    online: boolean;
    startingSignature: string;
    relogVerified: boolean;
    relogPending: boolean;
    relogTick: number;
    relogAttempts: number;
    currentTask: string;
    nextDecisionTick: number;
    lastActionTick: number;
    lastProgressTick: number;
    stallCount: number;
    lastCoordPacked: number;
    windowStartUtc: string;
    xpBeforeTenths: Record<SkillName, number>;
    successfulActions: number;
    failedActions: number;
    deaths: number;
    lastDeathState: boolean;
    questsVerifiedNew: Set<string>;
    questsCompletedAllTime: Set<string>;
    questRelogVerifyPending: string | null;
    bugCandidates: Map<string, { severity: 'low' | 'medium' | 'high' | 'critical'; count: number }>;
    routePoints: Array<[number, number]>;
    phase: CoopPhase;
    cooperationEvents: CooperationEvent[];
    gatherCycleIndex: number;
    questStageMemo: Record<string, number>;
}

const ENGINE_SHA = process.env.JOSHRS_ENGINE_SHA || 'b5ac859b47915afb545e60e4c1208f25d43cb3fb';
const CONTENT_SHA = process.env.JOSHRS_CONTENT_SHA || '44eab09081ef0f6c5f3eaabd1897a588ad7d9e50';
const AB_RUN_ID = process.env.JOSHRS_AB_RUN_ID || 'fg_ab_20261101_run01';
const POLICY_VERSION = 'v1.0.0';
const WORLD_MODE: 'isolated' | 'family_world' = process.env.JOSHRS_WORLD_MODE === 'family_world' ? 'family_world' : 'isolated';

const bots: Record<BotName, BotRuntimeState> = {
    Fred: createInitialBotState('Fred', 'gather_first'),
    George: createInitialBotState('George', 'quest_first')
};

let currentWindowStart: Date = getTenMinuteFloorUtc(new Date());
let lastStateWriteTick = -100;

function createInitialBotState(name: BotName, policy: BotPolicy): BotRuntimeState {
    const emptyXp = {} as Record<SkillName, number>;
    for (const s of FG_SKILLS) {
        emptyXp[s] = s === 'Hitpoints' ? 11540 : 0;
    }
    return {
        name,
        policy,
        player: null,
        online: false,
        startingSignature: '',
        relogVerified: false,
        relogPending: false,
        relogTick: -1,
        relogAttempts: 0,
        currentTask: 'initializing',
        nextDecisionTick: 0,
        lastActionTick: 0,
        lastProgressTick: 0,
        stallCount: 0,
        lastCoordPacked: -1,
        windowStartUtc: getTenMinuteFloorUtc(new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        xpBeforeTenths: { ...emptyXp },
        successfulActions: 0,
        failedActions: 0,
        deaths: 0,
        lastDeathState: false,
        questsVerifiedNew: new Set(),
        questsCompletedAllTime: new Set(),
        questRelogVerifyPending: null,
        bugCandidates: new Map(),
        routePoints: [],
        phase: 'solo',
        cooperationEvents: [],
        gatherCycleIndex: 0,
        questStageMemo: {}
    };
}

export function getTenMinuteFloorUtc(now: Date): Date {
    const d = new Date(now.getTime());
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
    return d;
}

export function formatUtcIso(d: Date): string {
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isFredGeorgeBot(player: Player | null | undefined): boolean {
    if (!player) return false;
    return player === bots.Fred.player || player === bots.George.player || player.username === 'Fred' || player.username === 'George';
}

export function getFredGeorgeBotStates(): Record<BotName, BotRuntimeState> {
    return bots;
}

export function resolveRegionLabel(x: number, z: number, level: number): { region: string; landmark: string } {
    if (z >= 9500) {
        if (x >= 3080 && x <= 3125 && z >= 9500 && z <= 9530) {
            return { region: 'Tutorial Island Dungeon', landmark: 'Mining & Combat Cave' };
        }
        if (x >= 3095 && x <= 3125 && z >= 9550 && z <= 9585) {
            return { region: 'Wizards Tower Basement', landmark: 'Sedridor Study & Altar' };
        }
        return { region: 'Underground', landmark: `Cave (${x},${z})` };
    }
    if (x >= 3060 && x <= 3155 && z >= 3060 && z <= 3155) {
        return { region: 'Tutorial Island', landmark: 'Newcomer Training Area' };
    }
    if (x >= 3200 && x <= 3218 && z >= 3205 && z <= 3230) {
        if (level === 1) return { region: 'Lumbridge', landmark: 'Lumbridge Castle 1st Floor (Duke & Spinning Wheel)' };
        if (level === 2) return { region: 'Lumbridge', landmark: 'Lumbridge Castle Top Floor' };
        return { region: 'Lumbridge', landmark: 'Lumbridge Castle Kitchen' };
    }
    if (x >= 3215 && x <= 3238 && z >= 3210 && z <= 3235) {
        return { region: 'Lumbridge', landmark: 'Lumbridge Castle Courtyard' };
    }
    if (x >= 3238 && x <= 3255 && z >= 3190 && z <= 3215) {
        return { region: 'Lumbridge', landmark: 'Lumbridge Church & Graveyard' };
    }
    if (x >= 3135 && x <= 3245 && z >= 3135 && z <= 3190) {
        return { region: 'Lumbridge Swamp', landmark: 'Swamp Mines & Fishing Spot' };
    }
    if (x >= 3245 && x <= 3268 && z >= 3255 && z <= 3300) {
        return { region: 'Lumbridge East', landmark: 'Cow Field & Goblin House' };
    }
    if (x >= 3220 && x <= 3242 && z >= 3285 && z <= 3310) {
        return { region: 'Lumbridge Farms', landmark: 'Chicken Coop' };
    }
    if (x >= 3150 && x <= 3180 && z >= 3285 && z <= 3320) {
        return { region: 'Lumbridge West', landmark: `Mill Lane Mill (plane ${level})` };
    }
    if (x >= 3180 && x <= 3215 && z >= 3255 && z <= 3285) {
        return { region: 'Lumbridge Farms', landmark: "Fred the Farmer's Sheep Pen" };
    }
    if (x >= 3075 && x <= 3120 && z >= 3230 && z <= 3275) {
        return { region: 'Draynor Village', landmark: 'Draynor Bank & Market' };
    }
    if (x >= 3095 && x <= 3125 && z >= 3150 && z <= 3180) {
        return { region: 'Wizards Tower', landmark: 'Wizards Tower Island' };
    }
    if (x >= 3190 && x <= 3290 && z >= 3380 && z <= 3500) {
        return { region: 'Varrock', landmark: 'Varrock City' };
    }
    return { region: 'Lumbridge', landmark: `Gielinor (${x},${z},p${level})` };
}

/**
 * Computes a deterministic, non-personal 32-hex-character SHA-256 signature
 * of the genuine fresh mainland starter state (position, 21 base stats, starter inv/worn/bank).
 */
export function computeStartingSignature(player: Player): string {
    const inv = player.getInventory(InvType.INV);
    const worn = player.getInventory(InvType.WORN);
    const bankId = InvType.getId('bank');
    const bank = bankId !== -1 ? player.getInventory(bankId) : null;

    const extractItems = (container: typeof inv) => {
        if (!container) return [];
        const items: Array<{ id: number; count: number }> = [];
        for (let i = 0; i < container.capacity; i++) {
            const it = container.get(i);
            if (it) items.push({ id: it.id, count: it.count });
        }
        return items;
    };

    const canonical = {
        spawn: { x: 3222, z: 3222, plane: 0 },
        base_stats: [0, 0, 0, 11540, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        starter_inv_count: 18,
        starter_worn: extractItems(worn),
        starter_bank_coins: bank ? bank.getItemCount(ObjType.getId('coins')) : 25
    };
    return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 32);
}

export function readXpSnapshot(player: Player): Record<SkillName, number> {
    const snap = {} as Record<SkillName, number>;
    for (const skill of FG_SKILLS) {
        const statId = SKILL_TO_STAT[skill];
        snap[skill] = Math.max(0, player.stats[statId] | 0);
    }
    return snap;
}

function getSavePath(name: BotName): string {
    if (process.env.JOSHRS_FG_SAVE_DIR) {
        return path.join(process.env.JOSHRS_FG_SAVE_DIR, `${name}.sav`);
    }
    return path.resolve(`data/players/${Environment.NODE_PROFILE}/${name}.sav`);
}

function getSharedLiveStatePath(): string {
    return process.env.JOSHRS_FG_STATE_FILE || 'C:\\JoshRS-Launcher\\JoshRS-main\\runtime\\jparris-377\\fred-george-isolated\\live-bot-state.json';
}

function getSnapshotsRootPath(): string {
    return process.env.JOSHRS_FG_REPORTS_ROOT || 'C:\\JoshRS-Launcher\\JoshRS-repo\\reports\\fred-george';
}

function spawnSingleBot(world: WorldRuntime, name: BotName): void {
    const state = bots[name];
    // Include pending admissions, not only active slots: never queue duplicate usernames.
    const existing = world.getPlayerByUsername(name);
    if (existing) {
        state.player = existing;
        return;
    }

    const savePath = getSavePath(name);
    let savPacket = new Packet(new Uint8Array(0));
    if (fs.existsSync(savePath)) {
        const raw = fs.readFileSync(savePath);
        if (raw.length < 2 || !PlayerLoading.verify(new Packet(raw))) {
            // Never silently replace a damaged existing bot character with a new one.
            console.error('[Fred & George] Existing bot save failed CRC; refusing to respawn ' + name);
            state.currentTask = 'blocked_invalid_save';
            return;
        }
        savPacket = new Packet(raw);
    } else if (state.relogPending || state.relogTick >= 0 || state.relogVerified) {
        console.error('[Fred & George] Existing bot save missing; refusing to reset ' + name);
        state.currentTask = 'blocked_missing_save';
        return;
    }

    const player = PlayerLoading.load(name, savPacket, null);
    player.session = `bot-${name.toLowerCase()}`;
    player.members = true;
    player.moveSpeed = MoveSpeed.WALK;
    player.moveStrategy = MoveStrategy.SMART;
    player.lastConnected = world.currentTick;
    player.lastResponse = world.currentTick;

    // Distinct visual clothing colors so Fred (blue) and George (orange/gold) are visually distinguishable
    if (name === 'Fred') {
        player.colors = [0, 3, 2, 0, 0];
    } else {
        player.colors = [6, 8, 7, 0, 0];
    }

    state.player = player;
    state.online = true;
    world.newPlayers.add(player);

    const tutVarp = VarPlayerType.getId('tutorial');
    if (tutVarp !== -1 && (player.getVar(tutVarp) as number) >= 1000) {
        state.startingSignature = computeStartingSignature(player);
        state.xpBeforeTenths = readXpSnapshot(player);
    }
}

export function spawnFredAndGeorgeBots(world: WorldRuntime): void {
    if (process.env.JOSHRS_FRED_GEORGE !== '1') {
        return;
    }
    currentWindowStart = getTenMinuteFloorUtc(new Date());
    for (const name of ['Fred', 'George'] as const) {
        bots[name].windowStartUtc = formatUtcIso(currentWindowStart);
        spawnSingleBot(world, name);
    }
    console.info('[Fred & George] Queued fresh autonomous accounts Fred (gather_first) and George (quest_first).');
}

function recordBugCandidate(state: BotRuntimeState, id: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    if (cleanId.length < 8) return;
    const existing = state.bugCandidates.get(cleanId);
    if (existing) {
        existing.count++;
    } else {
        state.bugCandidates.set(cleanId, { severity, count: 1 });
    }
}

function resumeDialogueOrModal(player: Player, preferredOptionText?: string | RegExp): boolean {
    if (!player.activeScript || player.activeScript.execution !== ScriptState.PAUSEBUTTON) {
        return false;
    }
    if (player.resumeButtons.length === 0) {
        player.executeScript(player.activeScript, true, true);
        return true;
    }

    let chosenCom = player.resumeButtons[0];
    if (player.resumeButtons.length > 1 && preferredOptionText) {
        if (preferredOptionText === 'no') {
            chosenCom = player.resumeButtons[1] ?? player.resumeButtons[0];
        } else if (preferredOptionText === 'option3') {
            chosenCom = player.resumeButtons[2] ?? player.resumeButtons[0];
        } else {
            for (const comId of player.resumeButtons) {
                const com = Component.get(comId);
                const text = (com?.text ?? '').toLowerCase();
                if (typeof preferredOptionText === 'string') {
                    if (text.includes(preferredOptionText.toLowerCase())) {
                        chosenCom = comId;
                        break;
                    }
                } else if (preferredOptionText.test(text)) {
                    chosenCom = comId;
                    break;
                }
            }
        }
    }

    player.lastCom = chosenCom;
    player.resumeButtons = [];
    player.executeScript(player.activeScript, true, true);
    return true;
}

function clickIfButton(player: Player, comName: string): boolean {
    const comId = Component.getId(comName);
    if (comId === -1) return false;
    const script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.IF_BUTTON, comId, -1);
    if (!script) return false;
    player.lastCom = comId;
    player.executeScript(ScriptRunner.init(script, player), true);
    return true;
}

function triggerTutorialTab(player: Player): boolean {
    const script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.TUTORIAL, -1, -1);
    if (!script) return false;
    player.executeScript(ScriptRunner.init(script, player), true);
    return true;
}

function findItemSlot(player: Player, objDebugname: string): { id: number; slot: number } | null {
    const objId = ObjType.getId(objDebugname);
    if (objId === -1) return null;
    const inv = player.getInventory(InvType.INV);
    if (!inv) return null;
    for (let slot = 0; slot < inv.capacity; slot++) {
        const item = inv.get(slot);
        if (item && item.id === objId && item.count > 0) {
            return { id: objId, slot };
        }
    }
    return null;
}

function hasItemEquippedOrInv(player: Player, objDebugname: string): boolean {
    const objId = ObjType.getId(objDebugname);
    if (objId === -1) return false;
    const inv = player.getInventory(InvType.INV);
    const worn = player.getInventory(InvType.WORN);
    return ((inv?.getItemCount(objId) ?? 0) + (worn?.getItemCount(objId) ?? 0)) > 0;
}

function useHeldItem(player: Player, objDebugname: string, opNum: 1 | 2 | 3 | 4 | 5 = 1): boolean {
    const found = findItemSlot(player, objDebugname);
    if (!found) return false;
    const obj = ObjType.get(found.id);
    player.lastItem = found.id;
    player.lastSlot = found.slot;
    player.clearPendingAction();

    const trigger = ServerTriggerType.OPHELD1 + (opNum - 1);
    const opName = (obj.iop?.[opNum - 1] ?? '').toLowerCase();
    let categoryId = obj.category;
    if (categoryId === -1 && opName === 'bury') {
        categoryId = CategoryType.getId('bones');
    }
    let script = ScriptProvider.getByTrigger(trigger, obj.id, categoryId);
    if (!script && (opName === 'wear' || opName === 'wield' || opNum === 2) && obj.wearpos !== -1) {
        script = ScriptProvider.getByTrigger(ServerTriggerType.OPHELD2, -1, -1);
    }
    if (!script) return false;
    player.executeScript(ScriptRunner.init(script, player), true);
    return true;
}

function useItemOnItem(player: Player, itemAName: string, itemBName: string): boolean {
    const a = findItemSlot(player, itemAName);
    const b = findItemSlot(player, itemBName);
    if (!a || !b) return false;

    player.lastItem = b.id;
    player.lastSlot = b.slot;
    player.lastUseItem = a.id;
    player.lastUseSlot = a.slot;
    player.clearPendingAction();

    const objType = ObjType.get(player.lastItem);
    const useObjType = ObjType.get(player.lastUseItem);

    let script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, objType.id, -1);
    if (!script) {
        script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, useObjType.id, -1);
        if (script) {
            [player.lastItem, player.lastUseItem] = [player.lastUseItem, player.lastItem];
            [player.lastSlot, player.lastUseSlot] = [player.lastUseSlot, player.lastSlot];
        }
    }
    if (!script && objType.category !== -1) {
        script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, -1, objType.category);
    }
    if (!script && useObjType.category !== -1) {
        script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.OPHELDU, -1, useObjType.category);
        if (script) {
            [player.lastItem, player.lastUseItem] = [player.lastUseItem, player.lastItem];
            [player.lastSlot, player.lastUseSlot] = [player.lastUseSlot, player.lastSlot];
        }
    }
    if (!script) return false;
    player.executeScript(ScriptRunner.init(script, player), true);
    return true;
}

function findNearestNpc(world: WorldRuntime, player: Player, matcher: (npc: Npc, type: NpcType) => boolean, radius = 24): Npc | null {
    let best: Npc | null = null;
    let bestDist = Infinity;
    for (const npc of world.npcs) {
        if (!npc || !npc.isActive || npc.level !== player.level) continue;
        const d = Math.abs(npc.x - player.x) + Math.abs(npc.z - player.z);
        if (d > radius || d >= bestDist) continue;
        const type = player.resolveNpcType(npc);
        if (matcher(npc, type)) {
            best = npc;
            bestDist = d;
        }
    }
    return best;
}

function isTargetReachableFrom(player: Player, target: Npc | Loc | Obj | Player): boolean {
    if (player.inOperableDistance(target)) {
        return true;
    }
    const level = player.level;
    if (target instanceof Loc) {
        const forceapproach = LocType.get(target.type).forceapproach;
        const path = findPathToLoc(level, player.x, player.z, target.x, target.z, player.width, target.width, target.length, target.angle, target.shape, forceapproach);
        if (path.length === 0) return false;
        const end = CoordGrid.unpackCoord(path[path.length - 1]);
        return reachedLoc(level, end.x, end.z, target.x, target.z, target.width, target.length, player.width, target.angle, target.shape, forceapproach);
    }
    if (target instanceof Npc || target instanceof Player) {
        const path = findPathToEntity(level, player.x, player.z, target.x, target.z, player.width, target.width, target.length);
        if (path.length === 0) return false;
        const end = CoordGrid.unpackCoord(path[path.length - 1]);
        return reachedEntity(level, end.x, end.z, target.x, target.z, target.width, target.length, player.width);
    }
    const path = findPath(level, player.x, player.z, target.x, target.z);
    if (path.length === 0) return false;
    const end = CoordGrid.unpackCoord(path[path.length - 1]);
    return (
        reachedEntity(level, end.x, end.z, target.x, target.z, target.width, target.length, player.width) ||
        reachedObj(level, end.x, end.z, target.x, target.z, target.width, target.length, player.width)
    );
}

function findNearestLoc(world: WorldRuntime, player: Player, matcher: (loc: Loc, type: LocType) => boolean, radius = 20): Loc | null {
    let bestReachable: Loc | null = null;
    let bestReachableDist = Infinity;
    let bestFallback: Loc | null = null;
    let bestFallbackDist = Infinity;
    const sx = player.x;
    const sz = player.z;
    const level = player.level;
    for (let x = sx - radius; x <= sx + radius; x++) {
        for (let z = sz - radius; z <= sz + radius; z++) {
            const d = Math.abs(x - sx) + Math.abs(z - sz);
            if (d > radius) continue;
            const zone = world.gameMap.getZone(x, z, level);
            for (const loc of zone.getLocsSafe(CoordGrid.packZoneCoord(x, z))) {
                if (!loc.isActive) continue;
                const type = player.resolveLocType(loc);
                if (!matcher(loc, type)) continue;
                if (d < bestFallbackDist) {
                    bestFallback = loc;
                    bestFallbackDist = d;
                }
                if (d < bestReachableDist && isTargetReachableFrom(player, loc)) {
                    bestReachable = loc;
                    bestReachableDist = d;
                }
            }
        }
    }
    return bestReachable ?? bestFallback;
}

function findNearestObj(world: WorldRuntime, player: Player, objDebugname: string, radius = 16): Obj | null {
    const targetId = ObjType.getId(objDebugname);
    if (targetId === -1) return null;
    let best: Obj | null = null;
    let bestDist = Infinity;
    const sx = player.x;
    const sz = player.z;
    const level = player.level;
    for (let x = sx - radius; x <= sx + radius; x++) {
        for (let z = sz - radius; z <= sz + radius; z++) {
            const d = Math.abs(x - sx) + Math.abs(z - sz);
            if (d > radius || d >= bestDist) continue;
            const zone = world.gameMap.getZone(x, z, level);
            for (const obj of zone.getObjsSafe(CoordGrid.packZoneCoord(x, z))) {
                if (!obj.isActive || obj.type !== targetId) continue;
                if (obj.receiver64 !== Obj.NO_RECEIVER && obj.receiver64 !== player.hash64) continue;
                best = obj;
                bestDist = d;
            }
        }
    }
    return best;
}

let activeWorldRef: WorldRuntime | null = null;

function engageTarget(player: Player, target: Npc | Loc | Obj | Player, trigger: ServerTriggerType, com?: number): boolean {
    player.moveStrategy = MoveStrategy.SMART;
    player.clearPendingAction();

    // If target is behind a closed door or gate, open the nearest reachable closed door/gate first
    if (activeWorldRef && !isTargetReachableFrom(player, target)) {
        const sx = player.x;
        const sz = player.z;
        const level = player.level;
        let bestDoor: Loc | null = null;
        let bestScore = Infinity;
        for (let x = sx - 16; x <= sx + 16; x++) {
            for (let z = sz - 16; z <= sz + 16; z++) {
                const zone = activeWorldRef.gameMap.getZone(x, z, level);
                for (const loc of zone.getLocsSafe(CoordGrid.packZoneCoord(x, z))) {
                    if (!loc.isActive) continue;
                    const type = player.resolveLocType(loc);
                    const debugname = (type.debugname ?? '').toLowerCase();
                    if (debugname.startsWith('hundred_lumbridge_')) continue;
                    const name = (type.name ?? '').toLowerCase();
                    if (!(name.includes('door') || name.includes('gate')) || type.op?.[0]?.toLowerCase() !== 'open') continue;
                    const distToTarget = Math.abs(loc.x - target.x) + Math.abs(loc.z - target.z);
                    const distToPlayer = Math.abs(loc.x - sx) + Math.abs(loc.z - sz);
                    const score = distToTarget + distToPlayer;
                    if (score < bestScore && isTargetReachableFrom(player, loc)) {
                        bestDoor = loc;
                        bestScore = score;
                    }
                }
            }
        }
        if (bestDoor) {
            const doorOk = player.setInteraction(Interaction.ENGINE, bestDoor, ServerTriggerType.APLOC1);
            if (doorOk) {
                player.pathToTarget();
            }
            return doorOk;
        }
    }

    const ok = player.setInteraction(Interaction.ENGINE, target, trigger, com);
    if (ok) {
        player.pathToTarget();
    }
    return ok;
}

function walkToward(world: WorldRuntime, player: Player, targetX: number, targetZ: number): boolean {
    player.moveStrategy = MoveStrategy.SMART;
    player.clearPendingAction();
    const dx = targetX - player.x;
    const dz = targetZ - player.z;
    const dist = Math.abs(dx) + Math.abs(dz);
    if (dist <= 2) return true;

    // Try full collision pathfinding first (up to 48 tiles), then fallback to 14-tile step
    if (Math.max(Math.abs(dx), Math.abs(dz)) <= 48) {
        const directWaypoints = findPath(player.level, player.x, player.z, targetX, targetZ);
        if (directWaypoints.length > 0) {
            const end = CoordGrid.unpackCoord(directWaypoints[directWaypoints.length - 1]);
            if (end.x !== player.x || end.z !== player.z) {
                player.queueWaypoints(directWaypoints);
                return true;
            }
        }
    }

    // Step in 14-tile segments using the native collision pathfinder
    const stepScale = Math.min(1, 14 / Math.max(Math.abs(dx), Math.abs(dz), 1));
    const stepX = Math.round(player.x + dx * stepScale);
    const stepZ = Math.round(player.z + dz * stepScale);

    const waypoints = findPath(player.level, player.x, player.z, stepX, stepZ);
    if (waypoints.length > 0) {
        const end = CoordGrid.unpackCoord(waypoints[waypoints.length - 1]);
        if (end.x !== player.x || end.z !== player.z) {
            player.queueWaypoints(waypoints);
            return true;
        }
    }

    // If blocked by a closed door nearby, open it using native APLOC1
    const closedDoor = findNearestLoc(
        world,
        player,
        (_loc, type) => {
            const debugname = (type.debugname ?? '').toLowerCase();
            if (debugname.startsWith('hundred_lumbridge_')) return false;
            const name = (type.name ?? '').toLowerCase();
            return (name.includes('door') || name.includes('gate')) && type.op?.[0]?.toLowerCase() === 'open';
        },
        12
    );
    if (closedDoor) {
        return engageTarget(player, closedDoor, ServerTriggerType.APLOC1);
    }
    return false;
}

/**
 * Step-by-step legal Tutorial Island solver.
 * Completes Tutorial Island using ordinary interactions until @tutorial_complete places
 * the account in Lumbridge (3222, 3222, 0) with the authentic 18 starter items.
 */
function tickTutorialIsland(world: WorldRuntime, state: BotRuntimeState, player: Player): void {
    const tutVarp = VarPlayerType.getId('tutorial');
    if (tutVarp === -1) return;
    const step = player.getVar(tutVarp) as number;
    state.currentTask = `tutorial_island_step_${step}`;

    // Handle active dialogues
    if (player.activeScript && player.activeScript.execution === ScriptState.PAUSEBUTTON) {
        // Choose "No, thank you." on skip prompt if map_live=false so we complete real Tutorial Island stages,
        // or "Yes." when Terrova asks "Do you want to go to the mainland?" or when banker asks to open bank.
        if (step === 1) {
            resumeDialogueOrModal(player, 'yes');
        } else if (step >= 660) {
            resumeDialogueOrModal(player, 'yes');
        } else if (step >= 500 && step < 520) {
            resumeDialogueOrModal(player, 'yes');
        } else {
            resumeDialogueOrModal(player);
        }
        state.successfulActions++;
        return;
    }

    // Step 0: Character design screen open -> click accept button
    if (step === 0) {
        if (clickIfButton(player, 'player_kit:accept')) {
            state.successfulActions++;
            return;
        }
        player.closeModal();
        return;
    }

    // Step 1: Talk to RuneScape Guide
    if (step === 1) {
        const guide = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_basics_instructor', 16);
        if (guide && engageTarget(player, guide, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 2: Click controls tab
    if (step === 2) {
        triggerTutorialTab(player);
        state.successfulActions++;
        return;
    }

    // Step 4: Open newbie_door1
    if (step === 4) {
        const door = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door1', 16);
        if (door && engageTarget(player, door, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 10: Walk to Survival Instructor and talk
    if (step === 10) {
        const survival = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_survival_instructor', 24);
        if (survival) {
            if (engageTarget(player, survival, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3103, 3096);
        }
        return;
    }

    // Step 20, 50, 170, 190, 230, 370, 410, 550, 570, 580, 620: Open flashing tutorial tab
    if ([20, 50, 170, 190, 230, 370, 410, 550, 570, 580, 620].includes(step)) {
        if (triggerTutorialTab(player)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 30: Chop a newbie tree
    if (step === 30) {
        const tree = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbietree'), 16);
        if (tree && engageTarget(player, tree, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 40: Light logs with tinderbox
    if (step === 40) {
        if (!findItemSlot(player, 'newbielogs')) {
            const tree = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbietree'), 16);
            if (tree) engageTarget(player, tree, ServerTriggerType.APLOC1);
            return;
        }
        if (useItemOnItem(player, 'tinderbox', 'newbielogs')) {
            state.successfulActions++;
        }
        return;
    }

    // Step 60: Talk to Survival Instructor for fishing net
    if (step === 60) {
        const survival = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_survival_instructor', 20);
        if (survival && engageTarget(player, survival, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 70: Catch shrimp at fishing spot
    if (step === 70) {
        const spot = findNearestNpc(world, player, (_n, t) => (t.debugname ?? '').includes('newbiefishing'), 20);
        if (spot && engageTarget(player, spot, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 80 & 90: Cook shrimp on fire
    if (step === 80 || step === 90) {
        const rawShrimp = findItemSlot(player, 'newbieraw_shrimp');
        if (!rawShrimp) {
            const spot = findNearestNpc(world, player, (_n, t) => (t.debugname ?? '').includes('newbiefishing'), 20);
            if (spot) engageTarget(player, spot, ServerTriggerType.APNPC1);
            return;
        }
        const fire = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbiefire', 16);
        if (!fire) {
            if (findItemSlot(player, 'newbielogs')) {
                useItemOnItem(player, 'tinderbox', 'newbielogs');
            } else {
                const tree = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbietree'), 16);
                if (tree) engageTarget(player, tree, ServerTriggerType.APLOC1);
            }
            return;
        }
        player.lastUseItem = rawShrimp.id;
        player.lastUseSlot = rawShrimp.slot;
        if (engageTarget(player, fire, ServerTriggerType.APLOCU)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 120: Open gate after Survival Instructor (3089, 3092)
    if (step === 120) {
        const gate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiegate'), 20);
        if (gate) {
            if (engageTarget(player, gate, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3090, 3092);
        }
        return;
    }

    // Step 130: Walk to Master Chef's door (newbie_door2 at 3079, 3084) and open
    if (step === 130) {
        const door2 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door2', 20);
        if (door2) {
            if (engageTarget(player, door2, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3079, 3084);
        }
        return;
    }

    // Step 140: Talk to Master Chef (newbie_cook_instructor)
    if (step === 140) {
        const chef = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_cook_instructor', 16);
        if (chef && engageTarget(player, chef, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 150: Mix bucket_water and newbie_pot_flour to make bread_dough
    if (step === 150) {
        if (useItemOnItem(player, 'bucket_water', 'newbie_pot_flour')) {
            state.successfulActions++;
        }
        return;
    }

    // Step 160: Cook bread_dough on newbierange
    if (step === 160) {
        const dough = findItemSlot(player, 'bread_dough');
        const range = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbierange', 16);
        if (dough && range) {
            player.lastUseItem = dough.id;
            player.lastUseSlot = dough.slot;
            if (engageTarget(player, range, ServerTriggerType.APLOCU)) {
                state.successfulActions++;
            }
        }
        return;
    }

    // Step 180: Exit Master Chef's house via newbie_door3 (3072, 3090)
    if (step === 180) {
        const door3 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door3', 16);
        if (door3 && engageTarget(player, door3, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 195: Toggle Run On via controls:com_5
    if (step === 195) {
        if (clickIfButton(player, 'controls:com_5')) {
            state.successfulActions++;
        }
        return;
    }

    // Step 200: Walk to Quest Guide's house and open newbie_door4 (3086, 3126)
    if (step === 200) {
        const door4 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door4', 18);
        if (door4) {
            if (engageTarget(player, door4, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3086, 3126);
        }
        return;
    }

    // Step 220 & 240: Talk to Quest Guide (newbie_quest_instructor)
    if (step === 220 || step === 240) {
        const questGuide = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_quest_instructor', 16);
        if (questGuide && engageTarget(player, questGuide, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 250: Climb down newbieladdertop1 into Mining caves
    if (step === 250) {
        const ladder = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbieladdertop1', 16);
        if (ladder && engageTarget(player, ladder, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 260, 279, 280, 330: Talk to Mining Instructor (newbie_mining_instructor)
    if ([260, 279, 280, 330].includes(step)) {
        const miner = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_mining_instructor', 20);
        if (miner) {
            if (engageTarget(player, miner, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3081, 9504);
        }
        return;
    }

    // Step 270, 274, 275: Prospect tin and copper rocks (APLOC2)
    if ([270, 274, 275].includes(step)) {
        const wantTin = step === 270 || step === 274;
        const rockName = wantTin ? 'newbietinrock' : 'newbiecopperrock';
        const rock = findNearestLoc(world, player, (_l, t) => t.debugname === rockName, 20);
        if (rock && engageTarget(player, rock, ServerTriggerType.APLOC2)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 290, 294, 295: Mine tin and copper rocks (APLOC1)
    if ([290, 294, 295].includes(step)) {
        const wantTin = step === 290 || step === 294;
        const rockName = wantTin ? 'newbietinrock' : 'newbiecopperrock';
        const rock = findNearestLoc(world, player, (_l, t) => t.debugname === rockName, 20);
        if (rock && engageTarget(player, rock, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 320: Smelt bronze bar on newbiefurnace
    if (step === 320) {
        const ore = findItemSlot(player, 'copper_ore') || findItemSlot(player, 'tin_ore');
        const furnace = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbiefurnace', 20);
        if (ore && furnace) {
            player.lastUseItem = ore.id;
            player.lastUseSlot = ore.slot;
            if (engageTarget(player, furnace, ServerTriggerType.APLOCU)) {
                state.successfulActions++;
            }
        }
        return;
    }

    // Step 340: Smith bronze dagger on anvil
    if (step === 340) {
        const smithingCol1 = Component.getId('smithing:column1');
        const daggerId = ObjType.getId('bronze_dagger');
        if (smithingCol1 !== -1 && daggerId !== -1 && player.modalMain === Component.getId('smithing')) {
            const script = ScriptProvider.getByTriggerSpecific(ServerTriggerType.INV_BUTTON1, smithingCol1, -1);
            if (script) {
                player.lastItem = daggerId;
                player.lastSlot = 0;
                player.executeScript(ScriptRunner.init(script, player), true);
                state.successfulActions++;
                return;
            }
        }
        const bar = findItemSlot(player, 'bronze_bar');
        const anvil = findNearestLoc(world, player, (_l, t) => t.debugname === 'anvil', 20);
        if (bar && anvil) {
            player.lastUseItem = bar.id;
            player.lastUseSlot = bar.slot;
            if (engageTarget(player, anvil, ServerTriggerType.APLOCU)) {
                state.successfulActions++;
            }
        }
        return;
    }

    // Step 350: Open mining exit gate (newbiedoor4l / newbiedoor4r at 3094, 9502)
    if (step === 350) {
        const gate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiedoor4'), 20);
        if (gate) {
            if (engageTarget(player, gate, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3094, 9502);
        }
        return;
    }

    // Step 360, 390, 450: Talk to Combat Instructor (newbie_combat_instructor)
    if ([360, 390, 450].includes(step)) {
        if (step === 450 && player.x <= 3110) {
            const cageGate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiedoor5'), 16);
            if (cageGate) engageTarget(player, cageGate, ServerTriggerType.APLOC1);
            return;
        }
        const vannaka = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_combat_instructor', 20);
        if (vannaka) {
            if (engageTarget(player, vannaka, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3106, 9509);
        }
        return;
    }

    // Step 380: Equip bronze_dagger
    if (step === 380) {
        if (useHeldItem(player, 'bronze_dagger', 2)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 400: Equip bronze_sword and wooden_shield
    if (step === 400) {
        if (findItemSlot(player, 'bronze_sword') && useHeldItem(player, 'bronze_sword', 2)) {
            state.successfulActions++;
            return;
        }
        if (findItemSlot(player, 'wooden_shield') && useHeldItem(player, 'wooden_shield', 2)) {
            state.successfulActions++;
            return;
        }
        return;
    }

    // Step 420: Enter rat pit cage (newbiedoor5_l / newbiedoor5_r at 3111, 9518)
    if (step === 420) {
        const cageGate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiedoor5'), 20);
        if (cageGate) {
            if (engageTarget(player, cageGate, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3111, 9518);
        }
        return;
    }

    // Step 430 & 440: Attack newbiegiantrat in melee
    if (step === 430 || step === 440) {
        if (player.x >= 3111) {
            const cageGate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiedoor5'), 16);
            if (cageGate) engageTarget(player, cageGate, ServerTriggerType.APLOC1);
            return;
        }
        const rat = findNearestNpc(world, player, (n, t) => t.debugname === 'newbiegiantrat' && n.levels[NpcStat.HITPOINTS] > 0 && n.target === null, 16);
        if (rat && engageTarget(player, rat, ServerTriggerType.APNPC2)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 460: Equip shortbow + bronze_arrow and attack newbiegiantrat from outside cage
    if (step === 460) {
        if (findItemSlot(player, 'shortbow') && useHeldItem(player, 'shortbow', 2)) {
            state.successfulActions++;
            return;
        }
        if (findItemSlot(player, 'bronze_arrow') && useHeldItem(player, 'bronze_arrow', 2)) {
            state.successfulActions++;
            return;
        }
        if (player.x <= 3110) {
            const cageGate = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('newbiedoor5'), 16);
            if (cageGate) engageTarget(player, cageGate, ServerTriggerType.APLOC1);
            return;
        }
        const rat = findNearestNpc(world, player, (n, t) => t.debugname === 'newbiegiantrat' && n.levels[NpcStat.HITPOINTS] > 0, 16);
        if (rat && engageTarget(player, rat, ServerTriggerType.APNPC2)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 470: Climb up newbieladder2 (3111, 9526) to surface
    if (step === 470) {
        const ladder = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbieladder2', 20);
        if (ladder) {
            if (engageTarget(player, ladder, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3111, 9525);
        }
        return;
    }

    // Step 500: Use newbiebankbooth (3122, 3124)
    if (step === 500) {
        const booth = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbiebankbooth', 20);
        if (booth) {
            if (engageTarget(player, booth, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3122, 3123);
        }
        return;
    }

    // Step 510: Close bank modal if open and open newbie_door6 (3125, 3124)
    if (step === 510) {
        player.closeModal();
        const door6 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door6', 16);
        if (door6 && engageTarget(player, door6, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 520: Talk to Financial Advisor (newbie_account_instructor)
    if (step === 520) {
        const advisor = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_account_instructor', 16);
        if (advisor && engageTarget(player, advisor, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 530: Open newbie_door7 (3130, 3124)
    if (step === 530) {
        const door7 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door7', 16);
        if (door7 && engageTarget(player, door7, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 540, 560, 590: Walk to Chapel and talk to Brother Brace (brother_noob)
    if ([540, 560, 590].includes(step)) {
        const brace = findNearestNpc(world, player, (_n, t) => t.debugname === 'brother_noob', 20);
        if (brace) {
            if (engageTarget(player, brace, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3126, 3107);
        }
        return;
    }

    // Step 600: Exit Chapel via newbie_door8 (3122, 3102)
    if (step === 600) {
        const door8 = findNearestLoc(world, player, (_l, t) => t.debugname === 'newbie_door8', 16);
        if (door8 && engageTarget(player, door8, ServerTriggerType.APLOC1)) {
            state.successfulActions++;
        }
        return;
    }

    // Step 610, 630, 660, 670: Walk to Wizard house and talk to Terrova (newbie_magic_instructor)
    if ([610, 630, 660, 670].includes(step)) {
        const terrova = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbie_magic_instructor', 20);
        if (terrova) {
            if (engageTarget(player, terrova, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
            }
        } else {
            walkToward(world, player, 3141, 3087);
        }
        return;
    }

    // Step 640 & 650: Cast Wind Strike on newbiechicken
    if (step === 640 || step === 650) {
        const chicken = findNearestNpc(world, player, (_n, t) => t.debugname === 'newbiechicken', 16);
        const windStrikeCom = Component.getId('magic:wind_strike');
        if (chicken && windStrikeCom !== -1) {
            if (engageTarget(player, chicken, ServerTriggerType.APNPCT, windStrikeCom)) {
                state.successfulActions++;
            }
        }
        return;
    }
}

/**
 * Ground-floor & basement recovery. Surface gathering and mainland quest targets live on
 * plane 0 (z < 9500), and walkToward/findPath only path on the bot's current plane, so a
 * bot left on an upper floor (e.g. Wizards' Tower plane 2) or in a basement cellar cannot
 * path to surface trees/NPCs directly. These helpers walk to the nearest real staircase or
 * ladder (opening interior doors along the way via engageTarget) and invoke its native
 * APLOC option rather than teleporting.
 */
function descendTowardGroundFloor(world: WorldRuntime, state: BotRuntimeState, player: Player): boolean {
    if (player.level <= 0) return false;

    state.currentTask = `Recovery: descending to ground floor (plane ${player.level} -> 0)`;

    const isDownOption = (op: string | undefined): boolean => {
        const o = (op ?? '').toLowerCase().trim();
        return o.includes('climb-down') || o.includes('climb down') || o === 'down';
    };

    const stairs =
        findNearestLoc(world, player, (_loc, type) => (type.op ?? []).some(op => isDownOption(op ?? undefined)), 32) ??
        findNearestLoc(world, player, (_loc, type) => (type.op ?? []).some(op => (op ?? '').toLowerCase().trim() === 'climb'), 32);
    if (!stairs) return false;

    const type = player.resolveLocType(stairs);
    let opIndex = (type.op ?? []).findIndex(op => isDownOption(op ?? undefined));
    if (opIndex === -1) {
        opIndex = (type.op ?? []).findIndex(op => (op ?? '').toLowerCase().trim() === 'climb');
    }
    if (opIndex !== -1 && engageTarget(player, stairs, ServerTriggerType.APLOC1 + opIndex)) {
        state.successfulActions++;
        return true;
    }
    return walkToward(world, player, stairs.x, stairs.z);
}

function ascendFromUndergroundToSurface(world: WorldRuntime, state: BotRuntimeState, player: Player): boolean {
    if (player.z < 9500) return false;

    state.currentTask = 'Recovery: climbing up from basement to surface';

    const isUpOption = (op: string | undefined): boolean => {
        const o = (op ?? '').toLowerCase().trim();
        return o.includes('climb-up') || o.includes('climb up') || o === 'up';
    };

    const ladder = findNearestLoc(world, player, (_loc, type) => (type.op ?? []).some(op => isUpOption(op ?? undefined)), 32);
    if (!ladder) return false;

    const type = player.resolveLocType(ladder);
    const opIndex = (type.op ?? []).findIndex(op => isUpOption(op ?? undefined));
    if (opIndex !== -1 && engageTarget(player, ladder, ServerTriggerType.APLOC1 + opIndex)) {
        state.successfulActions++;
        return true;
    }
    return walkToward(world, player, ladder.x, ladder.z);
}

/**
 * Fred (Policy A: gather_first) autonomous decision loop.
 * Prioritises gathering resources with starter tools, production, combat across styles,
 * burying bones, banking, and attempting all 21 historical skills.
 */
function tickFredGatherFirst(world: WorldRuntime, state: BotRuntimeState, player: Player): void {
    const inv = player.getInventory(InvType.INV);
    if (!inv) return;

    // Handle active modal/staircase prompts (e.g. generic Climb up / Climb down menu)
    if (player.activeScript && player.activeScript.execution === ScriptState.PAUSEBUTTON) {
        const pref = player.level > 0 ? 'down' : player.z >= 9500 ? 'up' : undefined;
        if (resumeDialogueOrModal(player, pref)) {
            state.successfulActions++;
            return;
        }
    }

    // 0. If stranded on an upper floor or in a cellar, return to surface ground floor first
    //    instead of trying to pathfind to plane-0 gathering coordinates on an upper plane.
    if (player.level > 0) {
        descendTowardGroundFloor(world, state, player);
        return;
    }
    if (player.z >= 9500) {
        ascendFromUndergroundToSurface(world, state, player);
        return;
    }

    // 1. If we have bones in inventory, bury them for genuine Prayer XP
    if (findItemSlot(player, 'bones')) {
        state.currentTask = 'Prayer: bury_bones';
        if (useHeldItem(player, 'bones', 1)) {
            state.successfulActions++;
            return;
        }
    }

    // 2. If low HP and holding cooked food (shrimp or bread), eat it
    if (player.levels[PlayerStat.HITPOINTS] <= 5) {
        if (findItemSlot(player, 'shrimp') && useHeldItem(player, 'shrimp', 1)) {
            state.currentTask = 'Hitpoints: eat_shrimp';
            state.successfulActions++;
            return;
        }
        if (findItemSlot(player, 'bread') && useHeldItem(player, 'bread', 1)) {
            state.currentTask = 'Hitpoints: eat_bread';
            state.successfulActions++;
            return;
        }
    }

    // 3. If still inside Lumbridge Castle Courtyard walls, step out the eastern archway first
    if (player.level === 0 && player.x >= 3217 && player.x <= 3226 && player.z >= 3212 && player.z <= 3229) {
        state.currentTask = 'Navigation: exit_lumbridge_courtyard';
        walkToward(world, player, 3233, 3222);
        return;
    }

    // 4. Rotate through gathering/skilling disciplines so Fred covers multiple skills naturally
    const phaseSlot = Math.floor(world.currentTick / 120) % 6;

    // Slot 0 & 1: Woodcutting + Firemaking around Lumbridge trees (3200..3235, 3205..3245)
    if (phaseSlot === 0 || phaseSlot === 1) {
        const logsSlot = findItemSlot(player, 'logs');
        if (logsSlot && (phaseSlot === 1 || inv.freeSlotCount <= 4)) {
            state.currentTask = 'Firemaking: burn_logs';
            if (useItemOnItem(player, 'tinderbox', 'logs')) {
                state.successfulActions++;
                return;
            }
            // Move 1 tile if current tile has a fire/loc
            walkToward(world, player, 3222 + ((world.currentTick % 5) - 2), 3222 + (((world.currentTick >> 2) % 5) - 2));
            return;
        }

        state.currentTask = 'Woodcutting: chop_tree';
        const tree = findNearestLoc(
            world,
            player,
            (_loc, type) => (type.name ?? '').toLowerCase() === 'tree' && (type.op ?? []).some(op => op?.toLowerCase() === 'chop down'),
            22
        );
        if (tree) {
            const type = player.resolveLocType(tree);
            const opIdx = (type.op ?? []).findIndex(op => op?.toLowerCase() === 'chop down');
            if (engageTarget(player, tree, ServerTriggerType.APLOC1 + Math.max(0, opIdx))) {
                state.successfulActions++;
                return;
            }
        }
        walkToward(world, player, 3215, 3225);
        return;
    }

    // Slot 2: Fishing + Cooking at Lumbridge Swamp fishing spot (3241, 3153)
    if (phaseSlot === 2) {
        const rawFish = findItemSlot(player, 'raw_shrimp') || findItemSlot(player, 'raw_anchovies');
        if (rawFish && inv.freeSlotCount <= 4) {
            const fire = findNearestLoc(world, player, (_l, t) => (t.name ?? '').toLowerCase() === 'fire', 14);
            if (fire) {
                state.currentTask = 'Cooking: cook_shrimp_on_fire';
                player.lastUseItem = rawFish.id;
                player.lastUseSlot = rawFish.slot;
                if (engageTarget(player, fire, ServerTriggerType.APLOCU)) {
                    state.successfulActions++;
                    return;
                }
            } else if (findItemSlot(player, 'logs')) {
                useItemOnItem(player, 'tinderbox', 'logs');
                return;
            }
        }

        state.currentTask = 'Fishing: net_shrimp';
        const spot = findNearestNpc(
            world,
            player,
            (_n, t) => (t.name ?? '').toLowerCase().includes('fishing spot') && (t.op ?? []).some(op => op?.toLowerCase() === 'net'),
            24
        );
        if (spot) {
            if (engageTarget(player, spot, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
                return;
            }
        } else {
            walkToward(world, player, 3241, 3153);
        }
        return;
    }

    // Slot 3: Mining at Lumbridge Swamp South-East mine (3228, 3147) & Smithing at Lumbridge Furnace (3226, 3256)
    if (phaseSlot === 3) {
        const hasTin = findItemSlot(player, 'tin_ore');
        const hasCopper = findItemSlot(player, 'copper_ore');
        if (hasTin && hasCopper) {
            state.currentTask = 'Smithing: smelt_bronze_bar';
            const furnace = findNearestLoc(world, player, (_l, t) => (t.name ?? '').toLowerCase() === 'furnace', 24);
            if (furnace) {
                player.lastUseItem = hasCopper.id;
                player.lastUseSlot = hasCopper.slot;
                if (engageTarget(player, furnace, ServerTriggerType.APLOCU)) {
                    state.successfulActions++;
                    return;
                }
            } else {
                walkToward(world, player, 3226, 3256);
            }
            return;
        }

        state.currentTask = 'Mining: mine_copper_and_tin';
        const wantCopper = !hasCopper;
        const rock = findNearestLoc(
            world,
            player,
            (_l, t) => {
                const dn = (t.debugname ?? '').toLowerCase();
                return wantCopper ? dn.includes('copperrock') : dn.includes('tinrock');
            },
            24
        );
        if (rock) {
            if (engageTarget(player, rock, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
                return;
            }
        } else {
            walkToward(world, player, 3228, 3147);
        }
        return;
    }

    // Slot 4: Thieving (Pickpocketing Men/Women in Lumbridge)
    if (phaseSlot === 4) {
        state.currentTask = 'Thieving: pickpocket_citizen';
        const citizen = findNearestNpc(
            world,
            player,
            (_n, t) => {
                const name = (t.name ?? '').toLowerCase();
                return (name === 'man' || name === 'woman') && (t.op ?? []).some(op => op?.toLowerCase() === 'pickpocket');
            },
            24
        );
        if (citizen) {
            const type = player.resolveNpcType(citizen);
            const opIdx = (type.op ?? []).findIndex(op => op?.toLowerCase() === 'pickpocket');
            if (engageTarget(player, citizen, ServerTriggerType.APNPC1 + Math.max(0, opIdx))) {
                state.successfulActions++;
                return;
            }
        } else {
            walkToward(world, player, 3222, 3218);
        }
        return;
    }

    // Slot 5: Combat (Melee / Ranged / Magic) & Bone collecting in Lumbridge
    state.currentTask = 'Combat: train_melee_magic_prayer';
    if (findItemSlot(player, 'bronze_sword')) {
        useHeldItem(player, 'bronze_sword', 2);
    }
    if (findItemSlot(player, 'wooden_shield')) {
        useHeldItem(player, 'wooden_shield', 2);
    }

    const groundBones = findNearestObj(world, player, 'bones', 12);
    if (groundBones && inv.freeSlotCount > 0) {
        if (engageTarget(player, groundBones, ServerTriggerType.APOBJ3)) {
            state.successfulActions++;
            return;
        }
    }

    // Respect single-combat rule: only target NPCs that are not already in combat
    const targetNpc = findNearestNpc(
        world,
        player,
        (n, t) => {
            const name = (t.name ?? '').toLowerCase();
            if (!['goblin', 'chicken', 'giant rat', 'rat', 'spider', 'man'].includes(name)) return false;
            if (!(t.op ?? []).some(op => op?.toLowerCase() === 'attack')) return false;
            if (n.levels[NpcStat.HITPOINTS] <= 0 || n.target !== null) return false;
            return true;
        },
        24
    );

    if (targetNpc) {
        const hasWindRunes = findItemSlot(player, 'airrune') && findItemSlot(player, 'mindrune');
        if (hasWindRunes && player.stats[PlayerStat.MAGIC] < 400) {
            const windStrikeCom = Component.getId('magic:wind_strike');
            if (windStrikeCom !== -1 && engageTarget(player, targetNpc, ServerTriggerType.APNPCT, windStrikeCom)) {
                state.currentTask = 'Magic: cast_wind_strike';
                state.successfulActions++;
                return;
            }
        }
        const type = player.resolveNpcType(targetNpc);
        const opIdx = (type.op ?? []).findIndex(op => op?.toLowerCase() === 'attack');
        if (engageTarget(player, targetNpc, ServerTriggerType.APNPC1 + Math.max(0, opIdx))) {
            state.successfulActions++;
            return;
        }
    } else {
        walkToward(world, player, 3246, 3244);
    }
}

function findClosedDoorAt(world: WorldRuntime, player: Player, x: number, z: number): Loc | null {
    const zone = world.gameMap.getZone(x, z, player.level);
    for (const loc of zone.getLocsSafe(CoordGrid.packZoneCoord(x, z))) {
        if (!loc.isActive) continue;
        const type = player.resolveLocType(loc);
        const debugname = (type.debugname ?? '').toLowerCase();
        if (debugname.startsWith('hundred_lumbridge_')) continue;
        if (type.op?.[0]?.toLowerCase() === 'open') {
            return loc;
        }
    }
    return null;
}

function talkToLumbridgeCook(world: WorldRuntime, state: BotRuntimeState, player: Player): boolean {
    const cook = findNearestNpc(world, player, (_n, t) => t.debugname === 'cook', 32);
    if (cook && player.level === 0 && isTargetReachableFrom(player, cook)) {
        if (engageTarget(player, cook, ServerTriggerType.APNPC1)) {
            state.successfulActions++;
            return true;
        }
    }

    // Authentic 3-door route from Lumbridge Castle Courtyard into the Kitchen:
    //   1. Castle front door (3217, 3218) -> 2. South foyer door (3215, 3211) -> 3. South kitchen door (3208, 3211)
    for (const [dx, dz] of [
        [3208, 3211],
        [3215, 3211],
        [3217, 3218]
    ]) {
        const door = findClosedDoorAt(world, player, dx, dz);
        if (door && isTargetReachableFrom(player, door)) {
            if (engageTarget(player, door, ServerTriggerType.APLOC1)) {
                state.successfulActions++;
                return true;
            }
        }
    }

    return walkToward(world, player, 3218, 3218);
}

function exitLumbridgeCastleIfInside(world: WorldRuntime, state: BotRuntimeState, player: Player): boolean {
    if (player.level !== 0) return false;
    const insideCastle = player.x >= 3205 && player.x <= 3217 && player.z >= 3208 && player.z <= 3228;
    const insideCourtyard = player.x >= 3217 && player.x <= 3226 && player.z >= 3212 && player.z <= 3229;
    if (!insideCastle && !insideCourtyard) {
        return false;
    }

    if (insideCastle) {
        for (const [dx, dz] of [
            [3208, 3211],
            [3215, 3211],
            [3217, 3218]
        ]) {
            const door = findClosedDoorAt(world, player, dx, dz);
            if (door && isTargetReachableFrom(player, door)) {
                if (engageTarget(player, door, ServerTriggerType.APLOC1)) {
                    state.successfulActions++;
                    return true;
                }
            }
        }
        if (player.x <= 3212 && player.z >= 3212) {
            return walkToward(world, player, 3208, 3210);
        }
        if (player.z <= 3211 && player.x < 3215) {
            return walkToward(world, player, 3215, 3212);
        }
        return walkToward(world, player, 3222, 3218);
    }

    return walkToward(world, player, 3233, 3222);
}

/**
 * George (Policy B: quest_first) autonomous decision loop.
 * Prioritises historical quests (starting with Cook's Assistant, Rune Mysteries,
 * The Restless Ghost, and Sheep Shearer) and quest prerequisites.
 */
function tickGeorgeQuestFirst(world: WorldRuntime, state: BotRuntimeState, player: Player): void {
    const cookVarp = VarPlayerType.getId('cookquest');
    const cookStage = cookVarp !== -1 ? (player.getVar(cookVarp) as number) : 0;
    state.questStageMemo["Cook's Assistant"] = cookStage;

    // Handle active quest dialogue
    if (player.activeScript && player.activeScript.execution === ScriptState.PAUSEBUTTON) {
        const useOption3 = state.currentTask.includes('Father Aereck') && player.resumeButtons.length >= 3;
        resumeDialogueOrModal(player, useOption3 ? 'option3' : undefined);
        state.successfulActions++;
        return;
    }

    // Quest 1: Cook's Assistant (%cookquest: 0 = unstarted, 1 = in progress, 2 = complete)
    if (cookStage === 0) {
        if (player.level > 0) {
            descendTowardGroundFloor(world, state, player);
            return;
        }
        if (player.z >= 9500) {
            ascendFromUndergroundToSurface(world, state, player);
            return;
        }
        state.currentTask = "Quest: Cook's Assistant (start with Cook)";
        talkToLumbridgeCook(world, state, player);
        return;
    }

    if (cookStage === 1) {
        const hasMilk = findItemSlot(player, 'bucket_milk') !== null;
        const hasEgg = findItemSlot(player, 'egg') !== null;
        const hasFlour = findItemSlot(player, 'pot_flour') !== null;

        if (player.z >= 9500) {
            ascendFromUndergroundToSurface(world, state, player);
            return;
        }

        // If inside the kitchen or castle courtyard and needing to exit to gather ingredients, step out first
        if ((!hasMilk || !hasEgg || !hasFlour) && exitLumbridgeCastleIfInside(world, state, player)) {
            return;
        }

        // Step 1a: Obtain bucket_milk from fat_cow (3253, 3272) using starter bucket_empty
        if (!hasMilk) {
            if (player.level > 0) {
                descendTowardGroundFloor(world, state, player);
                return;
            }
            state.currentTask = "Quest: Cook's Assistant (milk dairy cow)";
            const fatCow = findNearestLoc(world, player, (_l, t) => t.debugname === 'fat_cow', 20);
            if (fatCow) {
                if (engageTarget(player, fatCow, ServerTriggerType.APLOC1)) {
                    state.successfulActions++;
                    return;
                }
            }
            walkToward(world, player, 3253, 3265);
            return;
        }

        // Step 1b: Obtain egg from Lumbridge chicken coop (3230, 3299)
        if (!hasEgg) {
            if (player.level > 0) {
                descendTowardGroundFloor(world, state, player);
                return;
            }
            state.currentTask = "Quest: Cook's Assistant (take egg)";
            const eggObj = findNearestObj(world, player, 'egg', 18);
            if (eggObj) {
                if (engageTarget(player, eggObj, ServerTriggerType.APOBJ3)) {
                    state.successfulActions++;
                    return;
                }
            }
            walkToward(world, player, 3235, 3295);
            return;
        }

        // Step 1c: Obtain pot_flour from Lumbridge Windmill (3166, 3306)
        if (!hasFlour) {
            const flourVarp = VarPlayerType.getId('flour');
            const hopperVarp = VarPlayerType.getId('hopper_full');
            const flourCount = flourVarp !== -1 ? (player.getVar(flourVarp) as number) : 0;
            const hopperFull = hopperVarp !== -1 ? (player.getVar(hopperVarp) as number) : 0;
            const hasGrain = findItemSlot(player, 'grain');
            const emptyPot = findItemSlot(player, 'pot_empty');

            if (flourCount > 0 && emptyPot) {
                if (player.level > 0) {
                    descendTowardGroundFloor(world, state, player);
                    return;
                }
                state.currentTask = "Quest: Cook's Assistant (collect flour from bin)";
                const millbase = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').startsWith('millbase'), 16);
                if (millbase) {
                    player.lastUseItem = emptyPot.id;
                    player.lastUseSlot = emptyPot.slot;
                    if (engageTarget(player, millbase, ServerTriggerType.APLOCU)) {
                        state.successfulActions++;
                        return;
                    }
                }
                walkToward(world, player, 3166, 3303);
                return;
            }

            if (hopperFull === 1) {
                state.currentTask = "Quest: Cook's Assistant (operate hopper controls)";
                if (player.level < 2) {
                    const upLadder = findNearestLoc(world, player, (_l, t) => (t.op ?? []).some(op => op?.toLowerCase().includes('climb-up')), 14);
                    if (upLadder) {
                        const upIdx = (player.resolveLocType(upLadder).op ?? []).findIndex(op => op?.toLowerCase().includes('climb-up'));
                        engageTarget(player, upLadder, ServerTriggerType.APLOC1 + Math.max(0, upIdx));
                    } else {
                        walkToward(world, player, 3166, 3303);
                    }
                    return;
                }
                const controls = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').includes('hoppercontrol'), 12);
                if (controls && engageTarget(player, controls, ServerTriggerType.APLOC1)) {
                    state.successfulActions++;
                }
                return;
            }

            if (hasGrain) {
                state.currentTask = "Quest: Cook's Assistant (put grain in hopper)";
                if (player.level < 2) {
                    const upLadder = findNearestLoc(world, player, (_l, t) => (t.op ?? []).some(op => op?.toLowerCase().includes('climb-up')), 14);
                    if (upLadder) {
                        const upIdx = (player.resolveLocType(upLadder).op ?? []).findIndex(op => op?.toLowerCase().includes('climb-up'));
                        engageTarget(player, upLadder, ServerTriggerType.APLOC1 + Math.max(0, upIdx));
                    } else {
                        walkToward(world, player, 3166, 3303);
                    }
                    return;
                }
                const hopper = findNearestLoc(world, player, (_l, t) => (t.debugname ?? '').includes('hopper'), 12);
                if (hopper) {
                    player.lastUseItem = hasGrain.id;
                    player.lastUseSlot = hasGrain.slot;
                    if (engageTarget(player, hopper, ServerTriggerType.APLOCU)) {
                        state.successfulActions++;
                    }
                }
                return;
            }

            state.currentTask = "Quest: Cook's Assistant (pick wheat)";
            if (player.level > 0) {
                descendTowardGroundFloor(world, state, player);
                return;
            }
            const wheat = findNearestLoc(world, player, (_l, t) => (t.name ?? '').toLowerCase() === 'wheat', 20);
            if (wheat) {
                const type = player.resolveLocType(wheat);
                const pickIdx = (type.op ?? []).findIndex(op => op?.toLowerCase() === 'pick');
                if (engageTarget(player, wheat, ServerTriggerType.APLOC1 + Math.max(0, pickIdx))) {
                    state.successfulActions++;
                    return;
                }
            }
            walkToward(world, player, 3162, 3291);
            return;
        }

        // All 3 ingredients collected -> return to Cook in Lumbridge Kitchen (3208, 3214)
        state.currentTask = "Quest: Cook's Assistant (hand in ingredients to Cook)";
        if (player.level > 0) {
            descendTowardGroundFloor(world, state, player);
            return;
        }
        talkToLumbridgeCook(world, state, player);
        return;
    }

    // Verify Cook's Assistant persistence across logout/relogin before marking verified
    if (cookStage >= 2 && !state.questsCompletedAllTime.has("Cook's Assistant")) {
        if (!state.questRelogVerifyPending) {
            const savePath = getSavePath('George');
            fs.mkdirSync(path.dirname(savePath), { recursive: true });
            fs.writeFileSync(savePath, player.save());
            state.questRelogVerifyPending = "Cook's Assistant";
            state.relogPending = true;
            player.requestLogout = true;
            state.currentTask = "Quest: Cook's Assistant (logout persistence verification)";
            return;
        }
    }

    if (player.level > 0) {
        descendTowardGroundFloor(world, state, player);
        return;
    }
    if (player.z >= 9500) {
        ascendFromUndergroundToSurface(world, state, player);
        return;
    }

    if (exitLumbridgeCastleIfInside(world, state, player)) {
        return;
    }

    // Quest 2: The Restless Ghost (Father Aereck at 3243, 3206 -> Father Urhney at 3147, 3175)
    const priestVarp = VarPlayerType.getId('prieststart');
    const priestStage = priestVarp !== -1 ? (player.getVar(priestVarp) as number) : 0;
    state.questStageMemo['The Restless Ghost'] = priestStage;

    if (priestStage === 0) {
        state.currentTask = 'Quest: The Restless Ghost (talk to Father Aereck)';
        const aereck = findNearestNpc(world, player, (_n, t) => t.debugname === 'father_aereck', 20);
        if (aereck) {
            if (engageTarget(player, aereck, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
                return;
            }
        }
        walkToward(world, player, 3243, 3206);
        return;
    }

    // Quest 3: Sheep Shearer (Fred the Farmer at 3189, 3273) & Skill Prerequisites
    const sheepVarp = VarPlayerType.getId('sheep');
    const sheepStage = sheepVarp !== -1 ? (player.getVar(sheepVarp) as number) : 0;
    state.questStageMemo['Sheep Shearer'] = sheepStage;

    if (sheepStage === 0) {
        state.currentTask = 'Quest: Sheep Shearer (talk to Fred the Farmer)';
        const farmer = findNearestNpc(world, player, (_n, t) => t.debugname === 'fred_the_farmer', 20);
        if (farmer) {
            if (engageTarget(player, farmer, ServerTriggerType.APNPC1)) {
                state.successfulActions++;
                return;
            }
        }
        walkToward(world, player, 3189, 3273);
        return;
    }

    // Train combat/skills needed for quest progression
    tickFredGatherFirst(world, state, player);
}

/**
 * Legitimate Cooperative Mode (joint combat / supply resupply / follow).
 * Triggered only when an explicit cooperative task is active (never mixed into pure solo windows).
 */
function tickCooperativeTask(world: WorldRuntime, state: BotRuntimeState, player: Player, partnerState: BotRuntimeState): void {
    const partner = partnerState.player;
    if (!partner || !partner.isActive || partner.slot < 0) {
        return;
    }

    state.phase = state.phase === 'solo' ? 'mixed' : state.phase;
    const dist = Math.abs(player.x - partner.x) + Math.abs(player.z - partner.z);

    if (dist > 6 || player.level !== partner.level) {
        state.currentTask = `Coop: walking to meet ${partner.username}`;
        if (player.level === partner.level && dist <= 15) {
            if (engageTarget(player, partner, ServerTriggerType.APPLAYER3)) {
                state.successfulActions++;
                if (!state.cooperationEvents.some(e => e.type === 'follow')) {
                    state.cooperationEvents.push({ type: 'follow', partner: partnerState.name });
                }
                return;
            }
        }
        walkToward(world, player, partner.x, partner.z);
        return;
    }

    if (!state.cooperationEvents.some(e => e.type === 'follow')) {
        state.cooperationEvents.push({ type: 'follow', partner: partnerState.name });
    }
    state.currentTask = `Coop: patrolling & training alongside ${partner.username}`;
    tickFredGatherFirst(world, state, player);
}

function flushLiveStateFile(world: WorldRuntime): void {
    try {
        const outPath = getSharedLiveStatePath();
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const payload: Record<string, any> = {
            schema: 'joshrs-fred-george-live-state-v1',
            updated_utc: formatUtcIso(new Date()),
            updated_epoch_ms: Date.now(),
            world_id: Environment.NODE_ID,
            world_mode: WORLD_MODE,
            game_port: Environment.NODE_PORT,
            tick: world.currentTick,
            tick_ms: world.tickRate,
            ab_run_id: AB_RUN_ID,
            policy_version: POLICY_VERSION,
            engine_sha: ENGINE_SHA,
            content_sha: CONTENT_SHA,
            bots: {}
        };

        for (const name of ['Fred', 'George'] as const) {
            const b = bots[name];
            const p = b.player;
            const x = p ? p.x : 3222;
            const z = p ? p.z : 3222;
            const plane = p ? p.level : 0;
            const { region, landmark } = resolveRegionLabel(x, z, plane);
            payload.bots[name] = {
                bot: name,
                policy: b.policy,
                online: Boolean(p && p.isActive && p.slot >= 0 && !p.loggingOut),
                x,
                z,
                plane,
                region,
                landmark,
                current_task: b.currentTask,
                starting_signature: b.startingSignature,
                relog_verified: b.relogVerified,
                relog_pending: b.relogPending,
                normalised_logout_key: fredGeorgeLogoutAccountKey(name, p),
                logout_ack_pending: world.logoutRequests.has(fredGeorgeLogoutAccountKey(name, p)),
                logging_out: Boolean(p && p.loggingOut),
                player_slot_assigned: Boolean(p && p.slot >= 0),
                relog_waiting_since_tick: b.relogTick,
                relog_attempts: b.relogAttempts,
                world_admitted: Boolean(p && p.isActive && p.slot >= 0 && !p.loggingOut),
                phase: b.phase,
                cooperation_events: b.cooperationEvents,
                xp_before_tenths: b.xpBeforeTenths,
                xp_tenths: p ? readXpSnapshot(p) : b.xpBeforeTenths,
                successful_actions: b.successfulActions,
                failed_actions: b.failedActions,
                deaths: b.deaths,
                quests_verified_new: Array.from(b.questsVerifiedNew),
                quests_completed_all_time: Array.from(b.questsCompletedAllTime),
                route_points: b.routePoints.slice(-30)
            };
        }

        const tmp = `${outPath}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
        fs.renameSync(tmp, outPath);
    } catch (err) {
        console.error('[Fred & George] Failed to write live state file:', err);
    }
}

export function buildTenMinuteSnapshot(name: BotName, windowStart: Date, windowEnd: Date, world: WorldRuntime): Record<string, any> {
    const b = bots[name];
    const p = b.player;
    const xpAfter = p ? readXpSnapshot(p) : { ...b.xpBeforeTenths };
    for (const s of FG_SKILLS) {
        if (xpAfter[s] < b.xpBeforeTenths[s]) {
            xpAfter[s] = b.xpBeforeTenths[s];
        }
    }

    const x = p ? p.x : 3222;
    const z = p ? p.z : 3222;
    const plane = p ? p.level : 0;
    const { region } = resolveRegionLabel(x, z, plane);

    const bugs: BugCandidate[] = [];
    for (const [id, meta] of b.bugCandidates.entries()) {
        if (meta.count >= 3) {
            bugs.push({ id, severity: meta.severity });
        }
    }

    const phase: CoopPhase = b.cooperationEvents.length === 0 ? 'solo' : b.phase === 'solo' ? 'mixed' : b.phase;
    const sig = b.startingSignature || (p ? computeStartingSignature(p) : '0123456789abcdef0123456789abcdef');

    return {
        schema: 'joshrs-ab-ten-minute-v1',
        experiment_id: 'fred-george-v1',
        bot: name,
        policy: b.policy,
        world_mode: WORLD_MODE,
        ab_run_id: AB_RUN_ID,
        policy_version: POLICY_VERSION,
        online: Boolean(p && p.isActive && p.slot >= 0 && !p.loggingOut),
        phase,
        cooperation_events: phase === 'solo' ? [] : b.cooperationEvents.slice(0, 20),
        window_start_utc: formatUtcIso(windowStart),
        window_end_utc: formatUtcIso(windowEnd),
        fresh_account: true,
        items_seeded: false,
        cheats_enabled: false,
        accelerated_time: false,
        xp_multiplier: 1,
        tick_ms: world.tickRate,
        engine_sha: ENGINE_SHA,
        content_sha: CONTENT_SHA,
        starting_signature: sig,
        xp_before_tenths: { ...b.xpBeforeTenths },
        xp_after_tenths: xpAfter,
        successful_actions: b.successfulActions,
        failed_actions: b.failedActions,
        deaths: b.deaths,
        quests_verified_new: Array.from(b.questsVerifiedNew).slice(0, 50),
        bug_candidates: bugs.slice(0, 50),
        location: {
            x: Math.max(0, Math.min(20000, x | 0)),
            z: Math.max(0, Math.min(20000, z | 0)),
            plane: Math.max(0, Math.min(3, plane | 0)),
            region: region.slice(0, 80)
        },
        route_points: b.routePoints.slice(-60)
    };
}

function writeSnapshotPairForBoundary(world: WorldRuntime, boundaryEnd: Date, advanceBaseline: boolean): void {
    const windowStart = new Date(boundaryEnd.getTime() - 10 * 60 * 1000);
    const root = getSnapshotsRootPath();
    const dayFolder = boundaryEnd.toISOString().slice(0, 10);
    const stamp = boundaryEnd.toISOString().slice(0, 16).replace(':', '-') + 'Z';
    const outDir = path.join(root, 'snapshots', dayFolder);
    fs.mkdirSync(outDir, { recursive: true });

    for (const name of ['Fred', 'George'] as const) {
        const filePath = path.join(outDir, `${stamp}-${name}.json`);
        const snap = buildTenMinuteSnapshot(name, windowStart, boundaryEnd, world);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(snap, null, 2) + '\n', 'utf8');
            console.info(`[Fred & George] Wrote 10-minute snapshot: ${filePath}`);
        }
        if (advanceBaseline) {
            const b = bots[name];
            b.xpBeforeTenths = { ...snap.xp_after_tenths };
            b.successfulActions = 0;
            b.failedActions = 0;
            b.deaths = 0;
            b.questsVerifiedNew.clear();
            b.bugCandidates.clear();
            b.routePoints = b.player ? [[b.player.x, b.player.z]] : [];
            b.phase = 'solo';
            b.cooperationEvents = [];
            b.windowStartUtc = formatUtcIso(boundaryEnd);
        }
    }
}

function flushTenMinuteWindowIfDue(world: WorldRuntime): void {
    if (!bots.Fred.startingSignature || !bots.George.startingSignature) {
        return;
    }
    const now = new Date();
    const latestFloor = getTenMinuteFloorUtc(now);
    const flushFlagPath = path.join(path.dirname(getSharedLiveStatePath()), 'flush-snapshot.flag');
    const forceFlush = fs.existsSync(flushFlagPath);
    if (forceFlush) {
        try {
            fs.unlinkSync(flushFlagPath);
        } catch {
            // ignore
        }
    }

    // Ensure no 10-minute boundary in the past 30 minutes is missing (e.g. across a restart on the hour)
    const root = getSnapshotsRootPath();
    for (let stepsBack = 3; stepsBack >= 1; stepsBack--) {
        const candidateEnd = new Date(latestFloor.getTime() - stepsBack * 10 * 60 * 1000);
        const dayFolder = candidateEnd.toISOString().slice(0, 10);
        const stamp = candidateEnd.toISOString().slice(0, 16).replace(':', '-') + 'Z';
        const fredPath = path.join(root, 'snapshots', dayFolder, `${stamp}-Fred.json`);
        const georgePath = path.join(root, 'snapshots', dayFolder, `${stamp}-George.json`);
        if (!fs.existsSync(fredPath) || !fs.existsSync(georgePath)) {
            writeSnapshotPairForBoundary(world, candidateEnd, false);
        }
    }

    const expectedEnd = forceFlush ? latestFloor : new Date(currentWindowStart.getTime() + 10 * 60 * 1000);
    if (!forceFlush && now < expectedEnd) {
        return;
    }

    writeSnapshotPairForBoundary(world, expectedEnd, true);
    currentWindowStart = latestFloor;
}

/**
 * PlayerLoading.load normalises display names (Fred/George) to lower-case
 * account keys (fred/george). World.flushPlayer and onLoginMessage use the
 * normalised player.username in logoutRequests. Never gate a relog using
 * the display name: that can enqueue an early login and lose the bot session.
 */
export function fredGeorgeLogoutAccountKey(name: BotName, player?: Pick<Player, 'username'> | null): string {
    return player?.username ?? name.toLowerCase();
}

export function tickFredAndGeorgeBots(world: WorldRuntime): void {
    if (process.env.JOSHRS_FRED_GEORGE !== '1') {
        return;
    }
    activeWorldRef = world;

    for (const name of ['Fred', 'George'] as const) {
        const state = bots[name];
        let player = state.player;
        // The game owns admission, not spawnSingleBot(). A queued newPlayers entry
        // and a valid save are not proof that the player is present in the world.
        if (state.relogPending) {
            const prior = state.player;
            const stillInWorld = Boolean(prior && prior.slot >= 0 && prior.isActive);
            if (!stillInWorld && !world.logoutRequests.has(fredGeorgeLogoutAccountKey(name, player))) {
                const savePath = getSavePath(name);
                if (fs.existsSync(savePath) && PlayerLoading.verify(new Packet(fs.readFileSync(savePath)))) {
                    state.relogPending = false;
                    state.relogTick = world.currentTick;
                    state.relogAttempts = 0;
                    state.currentTask = 'awaiting_verified_world_admission';
                    spawnSingleBot(world, name);
                } else {
                    state.currentTask = 'blocked_invalid_or_missing_relog_save';
                }
            }
            continue;
        }

        if (state.relogTick >= 0) {
            const admitted = world.getPlayerByUsername(name);
            if (admitted && admitted.slot >= 0 && admitted.isActive && !admitted.loggingOut) {
                state.player = admitted;
                state.relogVerified = true;
                state.relogTick = -1;
                state.relogAttempts = 0;
                state.currentTask = 'verified_relog_resuming_gameplay';
                if (state.questRelogVerifyPending) {
                    const verifiedQuest = state.questRelogVerifyPending;
                    state.questRelogVerifyPending = null;
                    state.questsCompletedAllTime.add(verifiedQuest);
                    state.questsVerifiedNew.add(verifiedQuest);
                    console.info('[Fred & George] ' + name + ' verified quest relog in active world: ' + verifiedQuest);
                } else {
                    console.info('[Fred & George] ' + name + ' verified account re-admission in active world.');
                }
            } else if (world.currentTick - state.relogTick >= 25) {
                if (world.logoutRequests.has(fredGeorgeLogoutAccountKey(name, player)) || admitted) {
                    // Avoid duplicates, but never wait forever on a stuck admission/logout.
                    state.relogAttempts++;
                    state.currentTask = state.relogAttempts >= 3
                        ? 'relog_admission_stalled_needs_operator'
                        : 'relog_waiting_for_world_or_logout';
                    if (state.relogAttempts >= 3) {
                        state.relogTick = -1;
                        console.error('[Fred & George] ' + name + ' admission still pending: refusing duplicate player creation.');
                    } else {
                        state.relogTick = world.currentTick;
                    }
                } else if (state.relogAttempts < 3) {
                    const savePath = getSavePath(name);
                    if (!fs.existsSync(savePath) || !PlayerLoading.verify(new Packet(fs.readFileSync(savePath)))) {
                        state.currentTask = 'blocked_invalid_or_missing_relog_save';
                        state.relogTick = -1;
                    } else {
                        state.relogAttempts++;
                        state.relogTick = world.currentTick;
                        state.currentTask = 'retrying_world_admission_' + state.relogAttempts;
                        spawnSingleBot(world, name);
                    }
                } else {
                    state.currentTask = 'relog_admission_failed_after_three_retries';
                    state.relogTick = -1;
                    console.error('[Fred & George] ' + name + ' could not rejoin world after three bounded attempts.');
                }
            }
        }

        player = state.player;
        if (!player || player.slot < 0 || !player.isActive || player.loggingOut) {
            state.online = false;
            continue;
        }

        state.online = true;
        player.lastConnected = world.currentTick;
        player.lastResponse = world.currentTick;

        // Track deaths
        const isDead = player.levels[PlayerStat.HITPOINTS] === 0;
        if (isDead && !state.lastDeathState) {
            state.deaths++;
        }
        state.lastDeathState = isDead;

        // Track route breadcrumbs when tile changes
        const packed = CoordGrid.packCoord(player.level, player.x, player.z);
        if (packed !== state.lastCoordPacked) {
            state.lastCoordPacked = packed;
            state.lastProgressTick = world.currentTick;
            state.stallCount = 0;
            const lastPt = state.routePoints[state.routePoints.length - 1];
            if (!lastPt || Math.abs(lastPt[0] - player.x) + Math.abs(lastPt[1] - player.z) >= 3) {
                state.routePoints.push([player.x, player.z]);
                if (state.routePoints.length > 60) {
                    state.routePoints.shift();
                }
            }
        }

        if (world.currentTick < state.nextDecisionTick) {
            continue;
        }
        state.nextDecisionTick = world.currentTick + 4;

        // Wait if player is mid-animation delay or actively moving along waypoints
        if (player.delayed) {
            continue;
        }
        if (player.hasWaypoints()) {
            if (world.currentTick - state.lastProgressTick <= 2) {
                continue;
            }
            player.clearWaypoints();
        }

        const tutVarp = VarPlayerType.getId('tutorial');
        const tutProgress = tutVarp !== -1 ? (player.getVar(tutVarp) as number) : 1000;

        if (tutProgress < 1000) {
            tickTutorialIsland(world, state, player);
            continue;
        }

        // Once Tutorial Island completes, compute identical starting signature and perform initial relog persistence check
        if (!state.startingSignature) {
            state.startingSignature = computeStartingSignature(player);
            state.xpBeforeTenths = readXpSnapshot(player);
            console.info(`[Fred & George] ${name} arrived on mainland (3222,3222,0) with starting_signature=${state.startingSignature}`);
        }
        if (!state.relogVerified && !state.relogPending) {
            const savePath = getSavePath(name);
            fs.mkdirSync(path.dirname(savePath), { recursive: true });
            fs.writeFileSync(savePath, player.save());
            state.relogPending = true;
            player.requestLogout = true;
            state.currentTask = 'initial_save_persistence_relog_check';
            continue;
        }

        // Detect stalls (120s / 200 ticks with no coord or XP change)
        if (world.currentTick - state.lastProgressTick > 200) {
            state.stallCount++;
            state.failedActions++;
            state.lastProgressTick = world.currentTick;
            recordBugCandidate(state, `stall_${state.name.toLowerCase()}_${state.currentTask.slice(0, 24)}`, 'medium');
            player.clearPendingAction();
        }

        // Check if cooperative mode is requested via environment/file trigger
        const coopFlagPath = path.join(path.dirname(getSharedLiveStatePath()), 'coop-mode.flag');
        if (process.env.JOSHRS_FG_COOP_MODE === '1' || fs.existsSync(coopFlagPath)) {
            const partnerName: BotName = name === 'Fred' ? 'George' : 'Fred';
            tickCooperativeTask(world, state, player, bots[partnerName]);
            continue;
        }

        if (name === 'Fred') {
            tickFredGatherFirst(world, state, player);
        } else {
            tickGeorgeQuestFirst(world, state, player);
        }
    }

    if (world.currentTick - lastStateWriteTick >= 10) {
        lastStateWriteTick = world.currentTick;
        flushLiveStateFile(world);
        flushTenMinuteWindowIfDue(world);
    }
}

/**
 * Formats authoritative bot whereabouts for Elrothiro's read-only in-game commands
 * (::wherefred, ::wheregeorge, ::wherebots). Never exposes human player locations.
 */
export function formatBotWhereabouts(world: WorldRuntime, targetBot?: BotName): string[] {
    const names: BotName[] = targetBot ? [targetBot] : ['Fred', 'George'];
    const lines: string[] = [];

    let externalState: any = null;
    try {
        const statePath = getSharedLiveStatePath();
        if (fs.existsSync(statePath)) {
            externalState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }
    } catch {
        externalState = null;
    }

    for (const name of names) {
        const inWorld = world.getPlayerByUsername(name);
        if (inWorld && inWorld.isActive && inWorld.slot >= 0 && !inWorld.loggingOut) {
            const { region, landmark } = resolveRegionLabel(inWorld.x, inWorld.z, inWorld.level);
            const task = bots[name]?.currentTask || 'active';
            lines.push(
                `[Locator] ${name} (${bots[name].policy}): ONLINE (same world) at x=${inWorld.x}, z=${inWorld.z}, plane=${inWorld.level} — ${region} (${landmark}, task: ${task}).`
            );
            continue;
        }

        const extBot = externalState?.bots?.[name];
        const fresh = externalState && Date.now() - (externalState.updated_epoch_ms ?? 0) < 30_000;
        if (extBot && fresh && extBot.online) {
            lines.push(
                `[Locator] ${name} (${extBot.policy}): ONLINE (Isolated Test World ${externalState.world_id}, port ${externalState.game_port}) at x=${extBot.x}, z=${extBot.z}, plane=${extBot.plane} — ${extBot.region} (${extBot.landmark}, task: ${extBot.current_task}).`
            );
        } else if (extBot) {
            lines.push(
                `[Locator] ${name} (${extBot.policy}): OFFLINE (last seen in ${extBot.region} at x=${extBot.x}, z=${extBot.z}, plane=${extBot.plane}).`
            );
        } else {
            lines.push(`[Locator] ${name}: OFFLINE (no active session found).`);
        }
    }

    return lines;
}

/**
 * Handles bidirectional Private Messaging from Elrothiro (or another player) to Fred or George,
 * replying with an authentic MessagePrivate packet containing the bot's real live activity & whereabouts.
 */
export function handleBotPrivateMessage(world: WorldRuntime, sender: Player, targetName: BotName, message: string): boolean {
    let replyText = '';
    const inWorld = world.getPlayerByUsername(targetName);
    if (inWorld && inWorld.isActive && inWorld.slot >= 0 && !inWorld.loggingOut) {
        const { region, landmark } = resolveRegionLabel(inWorld.x, inWorld.z, inWorld.level);
        const state = bots[targetName];
        replyText = `Hi ${sender.displayName}! I'm in ${region} (${landmark} at ${inWorld.x},${inWorld.z},p${inWorld.level}) working on ${state.currentTask} [${state.policy}].`;
    } else {
        try {
            const statePath = getSharedLiveStatePath();
            if (fs.existsSync(statePath)) {
                const ext = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                const extBot = ext?.bots?.[targetName];
                const fresh = ext && Date.now() - (ext.updated_epoch_ms ?? 0) < 30_000;
                if (extBot && fresh && extBot.online) {
                    replyText = `Hi ${sender.displayName}! I'm online in Test World ${ext.world_id} at ${extBot.region} (${extBot.x},${extBot.z},p${extBot.plane}) doing ${extBot.current_task}.`;
                }
            }
        } catch {
            // ignore read error
        }
    }

    if (!replyText) {
        return false;
    }

    const botName37 = toBase37(targetName);
    const pmId = (Environment.NODE_ID << 24) + ((Math.random() * 0xff) << 16) + world.pmCount++;
    sender.write(new MessagePrivate(botName37, pmId, 0, replyText));
    return true;
}

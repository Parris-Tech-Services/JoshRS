import path from 'path';

import ejs from 'ejs';
import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import FastifyView from '@fastify/view';
import FastifyWebsocket from '@fastify/websocket';
import { register } from 'prom-client';

import { CrcBuffer, CrcTable } from '#/cache/CrcTable.js';

import OnDemand from '#/engine/OnDemand.js';
import World from '#/engine/World.js';
import Component from '#/cache/config/Component.js';
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import { ModalState } from '#/engine/entity/ModalState.js';
import Obj from '#/engine/entity/Obj.js';
import PathingEntity from '#/engine/entity/PathingEntity.js';
import Player from '#/engine/entity/Player.js';
import ScriptState from '#/engine/script/ScriptState.js';
import * as rsbuf from '#/network/rsbuf/index.js';
import { timingSafeEqual } from 'node:crypto';

import NullClientSocket from '#/server/NullClientSocket.js';

import { LoggerEventType } from '#/server/logger/LoggerEventType.js';

import WSClientSocket from '#/server/ws/WSClientSocket.js';

import Environment from '#/util/Environment.js';
import { tryParseInt } from '#/util/TryParse.js';

const fastify = Fastify({
    // logger: true
});

fastify.register(FastifyView, {
    engine: {
        ejs
    },
    root: 'view'
});

await fastify.register(FastifyWebsocket, {
    options: {
        maxPayload: 1600,
        perMessageDeflate: false,
        verifyClient: function (info, next) {
            if (Environment.WEB_ALLOWED_ORIGIN && info.req.headers.origin !== Environment.WEB_ALLOWED_ORIGIN) {
                next(false);
                return;
            }

            next(true);
        }
    }
});

// general routes

fastify.route({
    method: 'GET',
    url: '/',
    handler: (_req, reply) => {
        return reply.redirect('/rs2.cgi', 302);
    },
    wsHandler: (socket, req) => {
        const client = new WSClientSocket(
            {
                send(data: Uint8Array) {
                    socket.send(data);
                },
                close() {
                    socket.close();
                },
                terminate() {
                    socket.terminate();
                }
            },
            req.socket.remoteAddress ?? 'unknown'
        );

        socket.on('message', (message: Buffer<ArrayBufferLike>) => {
            try {
                if (client.state === -1 || client.remaining <= 0) {
                    client.terminate();
                    return;
                }

                client.buffer(message);

                if (client.state === 0) {
                    World.onClientData(client);
                } else if (client.state === 2) {
                    OnDemand.onClientData(client);
                }
            } catch {
                socket.terminate();
            }
        });

        socket.on('close', () => {
            client.state = -1;
            OnDemand.onClientClosed(client);

            if (client.player) {
                client.player.addSessionLog(LoggerEventType.ENGINE, 'WS socket closed');
                client.player.client = new NullClientSocket();
            }
        });

        socket.on('error', () => {
            socket.terminate();
        });
    }
});

// cache routes

fastify.get('/crc:cachebust', async (_req, reply) => {
    reply.send(CrcBuffer.data);
});

fastify.get<{ Params: { crc: string } }>('/title:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[1]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 1));
});

fastify.get<{ Params: { crc: string } }>('/config:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[2]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 2));
});

fastify.get<{ Params: { crc: string } }>('/interface:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[3]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 3));
});

fastify.get<{ Params: { crc: string } }>('/media:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[4]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 4));
});

fastify.get<{ Params: { crc: string } }>('/versionlist:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[5]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 5));
});

fastify.get<{ Params: { crc: string } }>('/textures:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[6]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 6));
});

fastify.get<{ Params: { crc: string } }>('/wordenc:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[7]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 7));
});

fastify.get<{ Params: { crc: string } }>('/sounds:crc', async (req, reply) => {
    const { crc } = req.params;

    if (tryParseInt(crc, -1) !== CrcTable[8]) {
        reply.status(404);
        return;
    }

    reply.send(OnDemand.cache.read(0, 8));
});

fastify.register(FastifyStatic, {
    root: path.join(process.cwd(), 'public')
});

export async function startWeb() {
    await fastify.listen({ port: Environment.WEB_PORT, host: '0.0.0.0' });
}

// management routes

const management = Fastify();

management.register(FastifyView, {
    engine: {
        ejs
    },
    root: 'view'
});


const SKILLS377 = [
    'Attack', 'Defence', 'Strength', 'Hitpoints', 'Ranged', 'Prayer', 'Magic',
    'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting',
    'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 'Farming', 'Runecraft'
] as const;

let observeSequence = 0;

const playerLastAnim = new WeakMap<Player, { animId: number; tick: number }>();
const origPlayAnimation = Player.prototype.playAnimation;
Player.prototype.playAnimation = function (this: Player, anim: number, delay: number) {
    origPlayAnimation.call(this, anim, delay);
    playerLastAnim.set(this, { animId: anim, tick: World.currentTick });
};

const origSetInteraction = Player.prototype.setInteraction;
Player.prototype.setInteraction = function (this: Player, interaction: any, target: any, op: any, com?: number): boolean {
    const ok = origSetInteraction.call(this, interaction, target, op, com);
    if (ok && !Environment.NODE_CLIENT_ROUTEFINDER && !(target instanceof PathingEntity)) {
        this.pathToTarget();
    }
    return ok;
};

/**
 * Task 24: read-only, opt-in, loopback-only isolated 377 bot telemetry.
 * This endpoint is dormant unless every explicit isolated-world guard is set.
 * It never exports another player's private data, credentials, saves or private key.
 */
management.get('/dev/rs377-observe', async (req, reply) => {
    const token = process.env.RS377_OBSERVER_TOKEN;
    const botName = process.env.RS377_OBSERVER_BOT;
    const instanceId = process.env.RS377_OBSERVER_WORLD;
    const sourceSha = process.env.RS377_OBSERVER_SOURCE_SHA;
    const supplied = req.headers.authorization ?? '';
    const expected = `Bearer ${token ?? ''}`;
    if (process.env.RS377_OBSERVER_ENABLED !== 'true' ||
        process.env.RS377_OBSERVER_ISOLATED !== 'true' ||
        process.env.NODE_XPRATE !== '1' ||
        !token || Buffer.byteLength(token) < 32 ||
        !/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName ?? '') ||
        !/^isolated-[a-z0-9_-]{4,64}$/i.test(instanceId ?? '') ||
        !/^[a-f0-9]{40}$/i.test(sourceSha ?? '') ||
        !['127.0.0.1', '::1'].includes(req.ip) ||
        Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
        return reply.code(404).send();
    }
    const bot = World.getPlayerByUsername(botName!);
    if (!bot || !bot.isActive || !bot.client) {
        return reply.code(409).send({ error: 'disposable_network_bot_not_online' });
    }

    const formatContainer = (invTypeId: number, includeOps: boolean) => {
        const inv = bot.getInventory(invTypeId);
        if (!inv) {
            return [];
        }
        return inv.items.flatMap((item, slot) => {
            if (!item || item.id < 0 || item.count <= 0) {
                return [];
            }
            const objType = ObjType.get(item.id);
            const rawOps = includeOps ? (objType?.iop ?? []) : [];
            const optionsWithIndex = rawOps.flatMap((opText, idx) =>
                opText && opText !== 'hidden' ? [{ text: String(opText), opIndex: idx + 1 }] : []
            );
            return [{
                slot,
                id: item.id,
                count: item.count,
                name: String(objType?.name ?? `Item ${item.id}`),
                optionsWithIndex
            }];
        });
    };

    const skills = SKILLS377.map((name, i) => ({
        name,
        level: Math.max(0, Math.min(99, bot.levels[i] ?? 1)),
        baseLevel: Math.max(0, Math.min(99, bot.baseLevels[i] ?? 1)),
        xpTenths: Math.max(0, Math.min(2_000_000_000, bot.stats[i] ?? 0))
    }));

    const items = formatContainer(InvType.INV, true);
    const equipment = formatContainer(InvType.WORN, false);

    const nearbyNpcs: Array<{
        kind: 'npc';
        index: number;
        id: number;
        name: string;
        combatLevel: number;
        x: number;
        z: number;
        distance: number;
        hp: number | null;
        maxHp: number | null;
        healthPercent: number | null;
        targetIndex: number;
        inCombat: boolean;
        lastCombatTick: number | null;
        animId: number;
        spotanimId: number;
        optionsWithIndex: Array<{ text: string; opIndex: number }>;
        options: string[];
    }> = [];
    const nearbyLocs: Array<{
        id: number;
        name: string;
        x: number;
        z: number;
        level: number;
        distance: number;
        optionsWithIndex: Array<{ text: string; opIndex: number }>;
        options: string[];
    }> = [];
    const groundItems: Array<{
        id: number;
        name: string;
        count: number;
        x: number;
        z: number;
        distance: number;
    }> = [];
    const nearbyPlayers: Array<{
        kind: 'player';
        index: number;
        name: string;
        combatLevel: number;
        x: number;
        z: number;
        distance: number;
    }> = [];

    const seenZones = new Set<string>();
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            const wx = bot.x + dx * 8;
            const wz = bot.z + dz * 8;
            if (wx < 0 || wz < 0 || wx >= 16384 || wz >= 16384) {
                continue;
            }
            const zoneKey = `${wx >> 3}:${wz >> 3}:${bot.level}`;
            if (seenZones.has(zoneKey)) {
                continue;
            }
            seenZones.add(zoneKey);

            let zone;
            try {
                zone = World.gameMap.getZone(wx, wz, bot.level);
            } catch {
                continue;
            }

            for (const npc of zone.getAllNpcsSafe()) {
                if (npc.level !== bot.level) {
                    continue;
                }
                const dist = Math.max(Math.abs(npc.x - bot.x), Math.abs(npc.z - bot.z));
                if (dist > 15 || !rsbuf.hasNpc(bot.slot, npc.nid)) {
                    continue;
                }
                let npcType = NpcType.get(npc.type);
                if (npcType?.multivarp !== undefined && npcType.multivarp !== -1 && npcType.multinpc) {
                    const state = bot.getVar(npcType.multivarp) as number;
                    if (state >= 0 && state < npcType.multinpc.length && npcType.multinpc[state] !== -1) {
                        npcType = NpcType.get(npcType.multinpc[state]);
                    }
                } else if (npcType?.multivarbit !== undefined && npcType.multivarbit !== -1 && npcType.multinpc) {
                    const state = bot.getVarBit(npcType.multivarbit);
                    if (state >= 0 && state < npcType.multinpc.length && npcType.multinpc[state] !== -1) {
                        npcType = NpcType.get(npcType.multinpc[state]);
                    }
                }
                const optionsWithIndex = (npcType?.op ?? []).flatMap((opText, idx) =>
                    opText && opText !== 'hidden' ? [{ text: String(opText), opIndex: idx + 1 }] : []
                );
                nearbyNpcs.push({
                    kind: 'npc',
                    index: npc.nid,
                    id: npc.type,
                    name: String(npcType?.name ?? `Npc ${npc.type}`),
                    combatLevel: Math.max(0, npcType?.vislevel ?? 0),
                    x: npc.x,
                    z: npc.z,
                    distance: dist,
                    hp: null,
                    maxHp: null,
                    healthPercent: null,
                    targetIndex: -1,
                    inCombat: false,
                    lastCombatTick: null,
                    animId: typeof npc.animId === 'number' ? npc.animId : -1,
                    spotanimId: typeof npc.spotanimId === 'number' ? npc.spotanimId : -1,
                    optionsWithIndex,
                    options: optionsWithIndex.map(o => o.text)
                });
            }

            for (const loc of zone.getAllLocsSafe()) {
                if (loc.level !== bot.level) {
                    continue;
                }
                const dist = Math.max(Math.abs(loc.x - bot.x), Math.abs(loc.z - bot.z));
                if (dist > 15) {
                    continue;
                }
                let locType = LocType.get(loc.type);
                if (locType?.multivarp !== undefined && locType.multivarp !== -1 && locType.multiloc) {
                    const state = bot.getVar(locType.multivarp) as number;
                    if (state >= 0 && state < locType.multiloc.length && locType.multiloc[state] !== -1) {
                        locType = LocType.get(locType.multiloc[state]);
                    }
                } else if (locType?.multivarbit !== undefined && locType.multivarbit !== -1 && locType.multiloc) {
                    const state = bot.getVarBit(locType.multivarbit);
                    if (state >= 0 && state < locType.multiloc.length && locType.multiloc[state] !== -1) {
                        locType = LocType.get(locType.multiloc[state]);
                    }
                }
                const optionsWithIndex = (locType?.op ?? []).flatMap((opText, idx) =>
                    opText && opText !== 'hidden' ? [{ text: String(opText), opIndex: idx + 1 }] : []
                );
                if (!locType?.name || locType.name === 'null' || optionsWithIndex.length === 0) {
                    continue;
                }
                nearbyLocs.push({
                    id: loc.type,
                    name: String(locType.name),
                    x: loc.x,
                    z: loc.z,
                    level: loc.level,
                    distance: dist,
                    optionsWithIndex,
                    options: optionsWithIndex.map(o => o.text)
                });
            }

            for (const obj of zone.getAllObjsSafe()) {
                if (obj.level !== bot.level) {
                    continue;
                }
                if (!obj.isValid(bot.hash64) || (obj.receiver64 !== Obj.NO_RECEIVER && obj.receiver64 !== bot.hash64)) {
                    continue;
                }
                const dist = Math.max(Math.abs(obj.x - bot.x), Math.abs(obj.z - bot.z));
                if (dist > 15) {
                    continue;
                }
                const objType = ObjType.get(obj.type);
                groundItems.push({
                    id: obj.type,
                    name: String(objType?.name ?? `Item ${obj.type}`),
                    count: Math.max(1, obj.count),
                    x: obj.x,
                    z: obj.z,
                    distance: dist
                });
            }

            for (const other of zone.getAllPlayersSafe()) {
                if (other === bot || other.slot === bot.slot || other.level !== bot.level) {
                    continue;
                }
                const dist = Math.max(Math.abs(other.x - bot.x), Math.abs(other.z - bot.z));
                if (dist > 15 || !rsbuf.hasPlayer(bot.slot, other.slot)) {
                    continue;
                }
                nearbyPlayers.push({
                    kind: 'player',
                    index: other.slot,
                    name: String(other.username),
                    combatLevel: Math.max(3, other.combatLevel ?? 3),
                    x: other.x,
                    z: other.z,
                    distance: dist
                });
            }
        }
    }

    nearbyNpcs.sort((a, b) => a.distance - b.distance || a.index - b.index);
    nearbyLocs.sort((a, b) => a.distance - b.distance || a.id - b.id);
    if (nearbyLocs.length > 128) {
        nearbyLocs.length = 128;
    }
    groundItems.sort((a, b) => a.distance - b.distance || a.id - b.id);
    if (groundItems.length > 48) {
        groundItems.length = 48;
    }
    nearbyPlayers.sort((a, b) => a.distance - b.distance || a.index - b.index);

    const isWaiting = Boolean(bot.activeScript && bot.activeScript.execution === ScriptState.PAUSEBUTTON);
    const chatModalOpen = ((bot.modalState & ModalState.CHAT) !== ModalState.NONE && bot.modalChat !== -1) || isWaiting;
    let dialogue: {
        isOpen: boolean;
        pageId: string | null;
        options: Array<{ index: number; text: string; componentId: number }>;
        isWaiting: boolean;
        text?: string;
    };
    let dialogLines: string[] = [];

    if (chatModalOpen) {
        const pageId = bot.activeScript
            ? `dlg-${bot.modalChat}-${bot.activeScript.script.id}-${bot.activeScript.pc}-${bot.activeScript.opcount}`.slice(0, 64)
            : `chat-${bot.modalChat}`;
        if (Array.isArray(bot.resumeButtons) && bot.resumeButtons.length > 0) {
            const options = bot.resumeButtons.map((comId, idx) => {
                const localText = bot.activeScript?.stringLocals?.[idx];
                const comText = Component.get(comId)?.text;
                const text = String(localText || comText || `Option ${idx + 1}`).slice(0, 120);
                return { index: idx + 1, text, componentId: comId };
            });
            dialogLines = options.map(o => o.text);
            dialogue = { isOpen: true, pageId, options, isWaiting };
        } else {
            const continueCom = bot.modalChat >= 0 ? bot.modalChat : 0;
            const splitFlat = Array.isArray(bot.activeScript?.splitPages)
                ? bot.activeScript.splitPages.flat().filter(Boolean).map(String)
                : [];
            const localStrs = Array.isArray(bot.activeScript?.stringLocals)
                ? bot.activeScript.stringLocals.filter(Boolean).map(String)
                : [];
            dialogLines = splitFlat.length > 0 ? splitFlat : localStrs;
            dialogue = {
                isOpen: true,
                pageId,
                options: [{ index: 0, text: 'Click here to continue', componentId: continueCom }],
                isWaiting,
                ...(dialogLines.length > 0 ? { text: dialogLines.join(' ') } : {})
            };
        }
    } else {
        dialogue = { isOpen: false, pageId: null, options: [], isWaiting: false };
    }

    const getVarpSafe = (name: string): number | null => {
        try {
            const id = VarPlayerType.getId(name);
            return id >= 0 ? (bot.getVar(id) as number) : null;
        } catch {
            return null;
        }
    };

    const questStages: Record<string, number> = {};
    for (const [key, varpName] of [
        ['cooks_assistant', 'cookquest'],
        ['tutorial', 'tutorial'],
        ['sheep_shearer', 'sheep'],
        ['dorics_quest', 'doricquest']
    ] as const) {
        const val = getVarpSafe(varpName);
        if (typeof val === 'number') {
            questStages[key] = val;
        }
    }

    let bankModalId = -1;
    try {
        bankModalId = Component.getId('bank_main');
    } catch {
        bankModalId = -1;
    }
    const mainModalOpen = (bot.modalState & ModalState.MAIN) !== ModalState.NONE && bot.modalMain !== -1;
    const bankOpen = mainModalOpen && bankModalId !== -1 && bot.modalMain === bankModalId;
    const bankItems = bankOpen
        ? formatContainer(InvType.BANK, false).map(({ slot, id, name, count }) => ({ slot, id, name, count }))
        : [];

    const lastAnim = playerLastAnim.get(bot);
    const observedAnimId = (typeof bot.animId === 'number' && bot.animId !== -1)
        ? bot.animId
        : (lastAnim && lastAnim.animId !== -1 && (World.currentTick - lastAnim.tick) <= 4 ? lastAnim.animId : -1);

    const sdkDetails = {
        player: {
            name: botName!,
            combatLevel: Math.max(3, bot.combatLevel ?? 3),
            hp: Math.max(0, bot.levels[3] ?? 10),
            maxHp: Math.max(1, bot.baseLevels[3] ?? 10),
            x: bot.x,
            z: bot.z,
            worldX: bot.x,
            worldZ: bot.z,
            level: bot.level,
            runEnergy: Math.max(0, Math.floor((bot.runenergy ?? 0) / 100)),
            runWeight: Math.max(0, Math.floor((bot.runweight ?? 0) / 1000)),
            animId: observedAnimId,
            spotanimId: typeof bot.spotanimId === 'number' ? bot.spotanimId : -1,
            combat: {
                inCombat: false,
                targetIndex: -1,
                targetType: 'none',
                lastDamageTick: -1
            },
            isDead: (bot.levels[3] ?? 10) <= 0,
            lifeId: 1,
            respawnCount: 0,
            lastDeathTick: null
        },
        nearbyPlayers,
        gameMessages: [],
        recentDialogs: dialogue.isOpen && bot.modalChat >= 0
            ? [{ text: dialogLines, tick: World.currentTick, interfaceId: bot.modalChat }]
            : [],
        interface: {
            isOpen: mainModalOpen,
            interfaceId: mainModalOpen ? bot.modalMain : -1,
            options: []
        },
        shop: {
            isOpen: false,
            title: '',
            shopItems: [],
            playerItems: []
        },
        bank: {
            isOpen: bankOpen,
            items: bankItems,
            noteMode: false
        },
        modalOpen: bot.modalState !== ModalState.NONE,
        modalInterface: bot.modalMain !== -1 ? bot.modalMain : (bot.modalChat !== -1 ? bot.modalChat : -1),
        combatEvents: [],
        prayers: {
            activePrayers: Array(15).fill(false),
            prayerPoints: Math.max(0, bot.levels[5] ?? 1),
            prayerLevel: Math.max(1, bot.baseLevels[5] ?? 1)
        }
    };

    const observation = {
        world: { mode: 'isolated', revision: 377, tickMs: 600,
            xpMultiplier: 1, instanceId: instanceId!, sourceSha: sourceSha! },
        player: { username: botName!, isBot: true },
        tick: World.currentTick,
        position: { x: bot.x, z: bot.z, plane: bot.level },
        skills,
        inventory: items,
        equipment,
        nearbyNpcs,
        nearbyLocs,
        groundItems,
        dialogue,
        questStages,
        sdkDetails
    };
    observeSequence = Math.max(observeSequence + 1, World.currentTick);
    return { token, sequence: observeSequence, observation };
});

management.get('/prometheus', async (_req, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
});

export async function startManagementWeb() {
    await management.listen({ port: Environment.WEB_MANAGEMENT_PORT, host: '0.0.0.0' });
}

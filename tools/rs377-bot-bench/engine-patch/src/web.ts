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
import Obj from '#/engine/entity/Obj.js';
import { PlayerStatNameMap } from '#/engine/entity/PlayerStat.js';
import { isClientConnected } from '#/engine/entity/NetworkPlayer.js';
import ScriptState from '#/engine/script/ScriptState.js';
import IfSetText from '#/network/game/server/model/IfSetText.js';
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


const botComponentText = new WeakMap<object, Map<number, string>>();

/**
 * Task 24: read-only, opt-in, loopback-only isolated 377 bot telemetry.
 * This endpoint is dormant unless every explicit isolated-world guard is set.
 * It never exports another player, credentials, saves or private key.
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
    // This must be an authentic connected normal-network player. A
    // server-created BotPlayer/NPC with the same display name does not qualify.
    const bot = World.getPlayerByUsername(botName!);
    // Engine-TS canonicalises usernames to lowercase base37; compare that
    // real identity before preserving the configured Harness display casing.
    if (!bot || bot.username.toLowerCase() !== botName!.toLowerCase() ||
        !bot.isActive || !isClientConnected(bot) || bot.client.player !== bot ||
        World.tickRate !== 600) {
        return reply.code(409).send({ error: 'disposable_network_bot_not_online' });
    }

    // Attach a per-bot instance listener for IfSetText messages sent to this
    // disposable bot only. Never modify Player.prototype or NetworkPlayer.prototype.
    let textMap = botComponentText.get(bot);
    if (!textMap) {
        textMap = new Map<number, string>();
        botComponentText.set(bot, textMap);
        const origWriteInner = bot.writeInner.bind(bot);
        bot.writeInner = (message: any) => {
            if (message instanceof IfSetText) {
                textMap!.set(message.component, message.text);
            }
            origWriteInner(message);
        };
    }

    // Read the actual in-memory 377 player stat arrays. PlayerStatNameMap
    // supplies the PINNED stat order, not a hand-written OSRS skill order.
    const skills = Array.from({ length: 21 }, (_, stat) => ({
        name: (PlayerStatNameMap.get(stat) ?? '').toLowerCase()
            .replace(/(^|_)([a-z])/g, (_match, _prefix, letter: string) => letter.toUpperCase()),
        level: bot.levels[stat],
        baseLevel: bot.baseLevels[stat],
        xpTenths: bot.stats[stat]
    }));
    if (skills.some(skill => !skill.name || skill.level === undefined ||
        skill.baseLevel === undefined || skill.xpTenths === undefined)) {
        return reply.code(409).send({ error: 'bot_skills_not_loaded' });
    }

    // IMPORTANT: bot.getInventory() can allocate an empty container, which
    // would mutate game state during a read. Access ONLY existing bot.invs.
    const inventory = bot.invs.get(InvType.INV);
    const worn = bot.invs.get(InvType.WORN);
    // No allocated container means there are no items in this player's
    // private inventory map; return the actual empty logical inventory.
    // This never allocates a container or touches any other player's map.
    const projectItems = (inv: typeof inventory, includeOps: boolean) => inv ?
        inv.items.flatMap((item, slot) => {
            if (!item || item.id < 0 || item.count <= 0) return [];
            const objType = ObjType.get(item.id);
            const rawOps = includeOps ? (objType?.iop ?? []) : [];
            const optionsWithIndex = rawOps.flatMap((label, idx) =>
                label && label !== 'hidden' ? [{ text: String(label), opIndex: idx + 1 }] : []);
            return [{
                slot,
                id: item.id,
                count: item.count,
                name: objType?.name ?? null,
                optionsWithIndex
            }];
        }) : [];

    // Same visibility predicate as OpNpcHandler. Never list distant or
    // invisible NPCs or any other human player's state.
    const nearbyNpcs = [];
    for (const npc of World.npcs) {
        if (nearbyNpcs.length >= 64) break;
        if (!npc.isActive || npc.level !== bot.level ||
            Math.max(Math.abs(npc.x - bot.x), Math.abs(npc.z - bot.z)) > 16 ||
            !rsbuf.hasNpc(bot.slot, npc.nid)) continue;
        let type = NpcType.get(npc.type);
        if (type?.multivarp !== undefined && type.multivarp !== -1 && type.multinpc) {
            const state = bot.getVar(type.multivarp) as number;
            if (state >= 0 && state < type.multinpc.length && type.multinpc[state] !== -1) {
                type = NpcType.get(type.multinpc[state]);
            }
        } else if (type?.multivarbit !== undefined && type.multivarbit !== -1 && type.multinpc) {
            const state = bot.getVarBit(type.multivarbit);
            if (state >= 0 && state < type.multinpc.length && type.multinpc[state] !== -1) {
                type = NpcType.get(type.multinpc[state]);
            }
        }
        const optionsWithIndex = (type?.op ?? [])
            .flatMap((label, index) =>
                label && label !== 'hidden' ? [{ text: String(label), opIndex: index + 1 }] : []);
        const distance = Math.max(Math.abs(npc.x - bot.x), Math.abs(npc.z - bot.z));
        nearbyNpcs.push({
            index: npc.nid,
            id: type?.id ?? npc.type,
            x: npc.x,
            z: npc.z,
            distance,
            combatLevel: Math.max(0, type?.vislevel ?? 0),
            name: type?.name ?? null,
            optionsWithIndex,
            options: optionsWithIndex.map(o => o.text)
        });
    }

    const nearbyLocs = [];
    const groundItems = [];
    const seenZones = new Set<string>();
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            const wx = bot.x + dx * 8;
            const wz = bot.z + dz * 8;
            if (wx < 0 || wz < 0 || wx >= 16384 || wz >= 16384) continue;
            const zoneKey = `${wx >> 3}:${wz >> 3}:${bot.level}`;
            if (seenZones.has(zoneKey)) continue;
            seenZones.add(zoneKey);
            let zone;
            try {
                zone = World.gameMap.getZone(wx, wz, bot.level);
            } catch {
                continue;
            }
            for (const loc of zone.getAllLocsSafe()) {
                if (loc.level !== bot.level) continue;
                const distance = Math.max(Math.abs(loc.x - bot.x), Math.abs(loc.z - bot.z));
                if (distance > 16) continue;
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
                const optionsWithIndex = (locType?.op ?? [])
                    .flatMap((label, index) =>
                        label && label !== 'hidden' ? [{ text: String(label), opIndex: index + 1 }] : []);
                if (!locType?.name || locType.name === 'null' || optionsWithIndex.length === 0) continue;
                nearbyLocs.push({
                    id: locType.id ?? loc.type,
                    name: String(locType.name),
                    x: loc.x,
                    z: loc.z,
                    level: loc.level,
                    distance,
                    optionsWithIndex,
                    options: optionsWithIndex.map(o => o.text)
                });
            }
            for (const obj of zone.getAllObjsSafe()) {
                if (obj.level !== bot.level) continue;
                if (!obj.isValid(bot.hash64) ||
                    (obj.receiver64 !== Obj.NO_RECEIVER && obj.receiver64 !== bot.hash64)) continue;
                const distance = Math.max(Math.abs(obj.x - bot.x), Math.abs(obj.z - bot.z));
                if (distance > 16) continue;
                const objType = ObjType.get(obj.type);
                const optionsWithIndex = (objType?.op ?? [])
                    .flatMap((label, index) =>
                        label && label !== 'hidden' ? [{ text: String(label), opIndex: index + 1 }] : []);
                groundItems.push({
                    id: obj.type,
                    name: objType?.name ?? null,
                    count: Math.max(1, obj.count),
                    x: obj.x,
                    z: obj.z,
                    distance,
                    optionsWithIndex
                });
            }
        }
    }
    nearbyLocs.sort((a, b) => a.distance - b.distance || a.id - b.id);
    if (nearbyLocs.length > 64) nearbyLocs.length = 64;
    groundItems.sort((a, b) => a.distance - b.distance || a.id - b.id);
    if (groundItems.length > 64) groundItems.length = 64;

    // Derive dialogue state only from verified component IDs, static cache
    // PAUSE_BUTTON labels, and actual server-sent IfSetText messages for this
    // bot. Never read activeScript.stringLocals or guess unverified labels.
    const waitingForButton = bot.activeScript?.execution === ScriptState.PAUSEBUTTON;
    const waitingForCount = bot.activeScript?.execution === ScriptState.COUNTDIALOG;
    const isOpen = bot.modalChat !== -1 || waitingForButton || waitingForCount;
    const isWaiting = waitingForButton || waitingForCount;
    let pageId: string | null = null;
    let pendingComponentIds: number[] = [];
    let options: Array<{ index: number; text: string; componentId: number }> = [];
    let optionTextAvailable = false;

    if (waitingForButton && bot.modalChat !== -1) {
        pageId = bot.activeScript
            ? `dlg-${bot.modalChat}-${bot.activeScript.script.id}-${bot.activeScript.pc}-${bot.activeScript.opcount}`.slice(0, 64)
            : `chat-${bot.modalChat}`;
        if (bot.resumeButtons.length > 0) {
            pendingComponentIds = [...bot.resumeButtons];
            const verifiedOptions: Array<{ index: number; text: string; componentId: number }> = [];
            for (let idx = 0; idx < bot.resumeButtons.length; idx++) {
                const comId = bot.resumeButtons[idx];
                const label = textMap.get(comId) ?? Component.get(comId)?.text ?? '';
                if (!label) break;
                verifiedOptions.push({ index: idx + 1, text: String(label), componentId: comId });
            }
            if (verifiedOptions.length === bot.resumeButtons.length) {
                options = verifiedOptions;
                optionTextAvailable = true;
            }
        } else {
            const rootCom = Component.get(bot.modalChat);
            const pauseChild = (rootCom?.childId ?? [])
                .map(cid => Component.get(cid))
                .find(c => c && c.buttonType === Component.PAUSE_BUTTON);
            const pauseCom = pauseChild ?? rootCom;
            const pauseText = pauseCom ? (textMap.get(pauseCom.id) ?? pauseCom.text ?? '') : '';
            if (pauseCom && pauseText) {
                pendingComponentIds = [pauseCom.id];
                options = [{ index: 0, text: String(pauseText), componentId: pauseCom.id }];
                optionTextAvailable = true;
            }
        }
    }

    const dialogue = {
        isOpen,
        isWaiting,
        pageId,
        options,
        pendingComponentIds,
        optionTextAvailable
    };

    // Strictly expose only the selected bot's live fields. Quest stages and
    // full RS-SDK UI state (combat history, unseen interfaces, bank note mode,
    // prayer states) are NOT known at this source boundary: use null, never
    // zero/default guesses.
    const observation = {
        world: { mode: 'isolated', revision: 377, tickMs: 600,
            xpMultiplier: 1, instanceId: instanceId!, sourceSha: sourceSha! },
        player: { username: botName!, isBot: true },
        tick: World.currentTick,
        position: { x: bot.x, z: bot.z, plane: bot.level },
        skills,
        inventory: projectItems(inventory, true),
        equipment: projectItems(worn, false),
        nearbyNpcs,
        nearbyLocs,
        groundItems,
        dialogue,
        questStages: null,
        sdkDetails: null
    };
    reply.header('Cache-Control', 'no-store');
    return { token, sequence: World.currentTick, observation };
});

management.get('/prometheus', async (_req, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
});

export async function startManagementWeb() {
    await management.listen({ port: Environment.WEB_MANAGEMENT_PORT, host: process.env.RS377_OBSERVER_ENABLED === 'true' ? '127.0.0.1' : '0.0.0.0' });
}

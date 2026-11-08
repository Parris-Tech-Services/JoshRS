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
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import Obj from '#/engine/entity/Obj.js';
import { PlayerStatNameMap } from '#/engine/entity/PlayerStat.js';
import { isClientConnected } from '#/engine/entity/NetworkPlayer.js';
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


/**
 * Task 24: read-only, opt-in, loopback-only isolated 377 bot telemetry.
 * This endpoint is dormant unless every explicit isolated-world guard is set.
 * It never exports another player, credentials, saves or private key.
 */
management.get('/dev/rs377-observe', async (req, reply) => {
    const token = process.env.RS377_OBSERVER_TOKEN;
    // Every query names one disposable, explicitly allowlisted game client.
    // The original single-bot environment remains a compatible default.
    const defaultBot = process.env.RS377_OBSERVER_BOT;
    const allowedBots = (process.env.RS377_OBSERVER_BOTS ?? defaultBot ?? '')
        .split(',').map(name => name.trim()).filter(Boolean);
    const requestedBot = (req.query as { bot?: unknown }).bot;
    const botName = requestedBot === undefined ? defaultBot : requestedBot;
    const instanceId = process.env.RS377_OBSERVER_WORLD;
    const sourceSha = process.env.RS377_OBSERVER_SOURCE_SHA;
    const supplied = req.headers.authorization ?? '';
    const expected = `Bearer ${token ?? ''}`;
    if (process.env.RS377_OBSERVER_ENABLED !== 'true' ||
        process.env.RS377_OBSERVER_ISOLATED !== 'true' ||
        process.env.NODE_XPRATE !== '1' ||
        !token || Buffer.byteLength(token) < 32 ||
        typeof botName !== 'string' || !/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName) ||
        allowedBots.length < 1 || allowedBots.length > 4 ||
        allowedBots.some(name => !/^Harness[A-Za-z0-9_-]{1,10}$/.test(name)) ||
        new Set(allowedBots.map(name => name.toLowerCase())).size !== allowedBots.length ||
        !allowedBots.includes(botName) ||
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
    const projectItems = (inv: typeof inventory) => inv ?
        inv.items.flatMap((item, slot) =>
            item ? [{ slot, id: item.id, count: item.count }] : []) : [];

    // Same visibility predicate as OpNpcHandler. Never list distant or
    // invisible NPCs or any other human player's state.
    const nearbyNpcs = [];
    for (const npc of World.npcs) {
        if (nearbyNpcs.length >= 64) break;
        if (!npc.isActive || npc.level !== bot.level ||
            Math.max(Math.abs(npc.x - bot.x), Math.abs(npc.z - bot.z)) > 16 ||
            !rsbuf.hasNpc(bot.slot, npc.nid)) continue;
        const type = NpcType.get(npc.type);
        const optionsWithIndex = (type?.op ?? [])
            .flatMap((label, index) =>
                label && label !== 'hidden' ? [{ text: label, opIndex: index + 1 }] : []);
        nearbyNpcs.push({
            index: npc.nid, id: npc.type, x: npc.x, z: npc.z,
            name: type?.name ?? null, optionsWithIndex
        });
    }

    // Task 27: native 377 *observed* locs and ground items. We use the
    // existing pinned ZoneMap.zones Map, rather than gameMap.getZone() which
    // silently allocates missing zones during an otherwise read-only request.
    // This source gate runs ONLY in the isolated disposable observer above.
    // Never include another player's private drops or pretend an unavailable
    // client-only object is known.
    type ExistingZone = ReturnType<typeof World.gameMap.getZone>;
    const mapData = World.gameMap as unknown as {
        zonemap?: { zones?: Map<number, ExistingZone> }
    };
    const existingZones = mapData.zonemap?.zones;
    let nearbyLocs: Array<Record<string, unknown>> | null = null;
    let groundItems: Array<Record<string, unknown>> | null = null;
    if (existingZones instanceof Map) {
        nearbyLocs = [];
        groundItems = [];
        const zoneX = bot.x >> 3;
        const zoneZ = bot.z >> 3;
        for (let zx = zoneX - 2; zx <= zoneX + 2; zx++) {
            for (let zz = zoneZ - 2; zz <= zoneZ + 2; zz++) {
                const zoneIndex = (zx & 0x7ff) | ((zz & 0x7ff) << 11) | ((bot.level & 0x3) << 22);
                const zone = existingZones.get(zoneIndex);
                if (!zone) continue;
                if (nearbyLocs.length < 48) {
                    for (const loc of zone.getAllLocsSafe()) {
                        if (nearbyLocs.length >= 48) break;
                        const distance = Math.max(Math.abs(loc.x - bot.x), Math.abs(loc.z - bot.z));
                        if (loc.level !== bot.level || distance > 16) continue;
                        const type = LocType.get(loc.type);
                        const optionsWithIndex = (type?.op ?? []).flatMap((text, index) =>
                            text && text !== 'hidden' ? [{ text, opIndex: index + 1 }] : []);
                        nearbyLocs.push({
                            id: loc.type, name: type?.name ?? null,
                            x: loc.x, z: loc.z, level: loc.level, distance,
                            optionsWithIndex, options: optionsWithIndex.map(o => o.text)
                        });
                    }
                }
                if (groundItems.length < 48) {
                    for (const obj of zone.getAllObjsSafe()) {
                        if (groundItems.length >= 48) break;
                        const distance = Math.max(Math.abs(obj.x - bot.x), Math.abs(obj.z - bot.z));
                        if (obj.level !== bot.level || distance > 16 ||
                            !obj.isValid(bot.hash64) ||
                            (obj.receiver64 !== Obj.NO_RECEIVER && obj.receiver64 !== bot.hash64)) continue;
                        groundItems.push({
                            id: obj.type, name: ObjType.get(obj.type)?.name ?? null,
                            count: obj.count, x: obj.x, z: obj.z, distance
                        });
                    }
                }
            }
        }
    }

    // Observe only OTHER REAL players who are visible to this disposable
    // network client, using the same rsbuf bitmap as the normal 377 renderer.
    // Never include another player's inventory, account ID, saves or bank.
    const nearbyPlayers: Array<{
        index: number; name: string; combatLevel: number; x: number; z: number
    }> = [];
    for (const other of World.players) {
        if (nearbyPlayers.length >= 64) break;
        if (!other || other.slot === bot.slot || other.level !== bot.level ||
            !other.isActive || !other.isValid() ||
            Math.max(Math.abs(other.x - bot.x), Math.abs(other.z - bot.z)) > 16 ||
            !rsbuf.hasPlayer(bot.slot, other.slot)) continue;
        nearbyPlayers.push({ index: other.slot, name: other.displayName,
            combatLevel: other.combatLevel, x: other.x, z: other.z });
    }

    // Dialogue is genuinely observable at the SERVER script layer, but
    // display text and option labels are client-side UI data. Do NOT invent
    // those labels; expose only actual pending component IDs and wait state.
    const waitingForButton = bot.activeScript?.execution === ScriptState.PAUSEBUTTON;
    const waitingForCount = bot.activeScript?.execution === ScriptState.COUNTDIALOG;
    const dialogue = {
        isOpen: bot.modalChat !== -1 || waitingForButton || waitingForCount,
        isWaiting: waitingForButton || waitingForCount,
        options: [],
        pendingComponentIds: waitingForButton ? [...bot.resumeButtons] : [],
        optionTextAvailable: false
    };

    // Strictly expose only the selected bot's live fields. Quest stages
    // and full client-side RS-SDK UI remain unknown (null), never guessed.
    // Nearby objects/drops are grounded in the exact pinned native ZoneMap.
    const observation = {
        world: { mode: 'isolated', revision: 377, tickMs: 600,
            xpMultiplier: 1, instanceId: instanceId!, sourceSha: sourceSha! },
        player: { username: botName!, isBot: true },
        tick: World.currentTick,
        position: { x: bot.x, z: bot.z, plane: bot.level },
        skills,
        inventory: projectItems(inventory),
        equipment: projectItems(worn),
        nearbyNpcs,
        nearbyLocs, groundItems, nearbyPlayers,
        dialogue, questStages: null, sdkDetails: null
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

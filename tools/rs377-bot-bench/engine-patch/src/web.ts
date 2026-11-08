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
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import Obj from '#/engine/entity/Obj.js';
import { PlayerStat, PlayerStatNameMap } from '#/engine/entity/PlayerStat.js';
import { readSdkTrace } from '#/engine/observer/Native377Trace.js';
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

    // The SDK's display names and item actions are part of the actual packed
    // item config, not guessed from IDs. Fail closed if a config is unavailable.
    const projectNamedItems = (inv: typeof inventory) => inv ?
        inv.items.flatMap((item, slot) => {
            if (!item) return [];
            const config = ObjType.get(item.id);
            if (!config || !config.name) return [];
            const optionsWithIndex = (config.iop ?? []).flatMap((text, index) =>
                text && text !== 'hidden' ? [{ text, opIndex: index + 1 }] : []);
            return [{ slot, id: item.id, name: config.name,
                count: item.count, optionsWithIndex }];
        }) : [];
    const namesKnown = (inv: typeof inventory) =>
        !inv || inv.items.every(item => !item || !!ObjType.get(item.id)?.name);


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
        const distance = Math.max(Math.abs(npc.x - bot.x), Math.abs(npc.z - bot.z));
        // Rev377 NPC faceEntity is an actual public network update. The server
        // does not reveal HP until a damage mask: null is the honest SDK state
        // rather than cheating with private NPC health arrays.
        const face = npc.faceEntity;
        const targetIndex = face >= 32768 && face < 34816 ?
            face - 32768 : face >= 0 && face < 16383 ? face : -1;
        const inCombat = npc.target === null ? false : null;
        nearbyNpcs.push({
            kind: 'npc', index: npc.nid, id: npc.type, x: npc.x, z: npc.z,
            name: type?.name ?? null, combatLevel: type?.vislevel === -1 ? 0 :
                type?.vislevel ?? null, distance, hp: null, maxHp: null,
            healthPercent: null, targetIndex, inCombat,
            lastCombatTick: null, animId: npc.animId, spotanimId: npc.spotanimId,
            optionsWithIndex, options: optionsWithIndex.map(o => o.text)
        });
    }

    // Task 28: nearby human players are visible only when the same native
    // rsbuf player-build predicate says this authenticated bot can see them.
    // No bank, inventory, save data or hidden players leave the observer.
    const nearbyPlayers: Array<Record<string, unknown>> = [];
    for (const person of World.playerLoop.all()) {
        if (nearbyPlayers.length >= 64) break;
        if (person === bot || !person.isActive || person.level !== bot.level ||
            !person.isValid() || !rsbuf.hasPlayer(bot.slot, person.slot)) continue;
        const distance = Math.max(Math.abs(person.x - bot.x), Math.abs(person.z - bot.z));
        if (distance > 16) continue;
        nearbyPlayers.push({
            kind: 'player', index: person.slot, name: person.username,
            combatLevel: person.combatLevel, x: person.x, z: person.z, distance
        });
    }

    // Prayer flags are 15 real native server varps, whose names and order
    // match pinned Content scripts/skill_prayer/scripts/prayer.rs2 and
    // upstream SDK sdk/types.ts PRAYER_NAMES. Missing config => unknown.
    const prayerIds = Array.from({ length: 15 }, (_, index) =>
        VarPlayerType.getId('prayer' + index));
    const prayers = prayerIds.every(id => id >= 0) ? {
        activePrayers: prayerIds.map(id => bot.vars[id] !== 0),
        prayerPoints: bot.levels[PlayerStat.PRAYER],
        prayerLevel: bot.baseLevels[PlayerStat.PRAYER]
    } : null;

    const trace = readSdkTrace(bot, World.currentTick);
    const displayText = (id: number) =>
        trace?.textOverrides.find(entry => entry.component === id)?.text ??
        Component.get(id)?.text ?? null;
    // Native modal components come from the actually packed client/interface
    // data. Do not publish a button with a dynamic client-only condition.
    const buttonsForRoot = (rootId: number) => {
        if (rootId < 0) return null;
        const root = Component.get(rootId);
        if (!root || !root.childId) return null;
        const options: Array<{index:number;text:string;componentId:number}> = [];
        for (const id of root.childId) {
            const component = Component.get(id);
            if (!component) return null;
            const potentiallyInteractive = component.buttonType > Component.NO_BUTTON &&
                component.buttonType <= Component.PAUSE_BUTTON;
            if (!potentiallyInteractive) continue;
            if (component.scriptComparator?.length || component.scripts?.length || component.hide)
                return null;
            const label = component.option ?? displayText(id);
            if (typeof label !== 'string' || !label.trim()) return null;
            options.push({index: options.length + 1,text:label,componentId:id});
            if (options.length >= 64) break;
        }
        return options;
    };

    // The native server owns the modal identity and per-player bank items.
    // Bank/shop are never read from another player's inventories. When an
    // interface is open but pricing/text is not known, return NULL: never
    // fabricate a trade price, client title or clickable dialogue option.
    const bankRoot = Component.getId('bank_main');
    const shopRoot = Component.getId('shop_template');
    const mainModal = bot.modalMain;
    const bankOpen = bankRoot >= 0 && mainModal === bankRoot;
    const shopOpen = shopRoot >= 0 && mainModal === shopRoot;
    const bankType = InvType.getId('bank');
    const certVar = VarPlayerType.getId('bankcert');
    const bankInventory = bankType < 0 ? undefined : bot.invs.get(bankType);
    const bank = !bankOpen ? { isOpen: false, items: [], noteMode: false } :
        bankType >= 0 && certVar >= 0 && bankInventory && namesKnown(bankInventory) ?
        { isOpen: true, items: projectNamedItems(bankInventory)
            .map(({ slot, id, name, count }) => ({ slot, id, name, count })),
            noteMode: bot.vars[certVar] !== 0 } : null;
    // The live shop has a real shared Inventory and varps from pinned Content
    // ~openshop: shop, shop_buy, shop_sell, shop_haggle. Pricing mirrors
    // ~adjusted_item_cost_buying/selling and ~calc_shop_value, not guessed
    // prices; unknown title, stock, multipliers or names => null.
    const shopVar = VarPlayerType.getId('shop');
    const shopBuyVar = VarPlayerType.getId('shop_buy');
    const shopSellVar = VarPlayerType.getId('shop_sell');
    const shopHaggleVar = VarPlayerType.getId('shop_haggle');
    const shopId = shopVar >= 0 ? bot.vars[shopVar] : -1;
    const sharedShop = shopId >= 0 ? Array.from(World.invs)
        .find(inv => inv.type === shopId) : undefined;
    const titleId = Component.getId('shop_template:com_76');
    const shopTitle = titleId >= 0 ?
        trace?.textOverrides.find(entry => entry.component === titleId)?.text : null;
    const haveShop = shopId >= 0 && shopBuyVar >= 0 && shopSellVar >= 0 &&
        shopHaggleVar >= 0 && sharedShop && namesKnown(sharedShop) &&
        namesKnown(inventory) && typeof shopTitle === 'string';
    const shopPrice = (id: number, current: number, multiplier: number) => {
        const type = ObjType.get(id);
        const config = InvType.get(shopId);
        if (!type || !config || !Number.isSafeInteger(type.cost)) return null;
        const baseIndex = config.stockobj?.indexOf(id) ?? -1;
        const baseCount = baseIndex >= 0 ?
            config.stockcount?.[baseIndex] ?? 0 : 0;
        const diff = baseIndex >= 0 ? current - baseCount : current;
        const haggled = Math.min(1000,Math.max(-5000,diff * bot.vars[shopHaggleVar]));
        const factor = Math.max(100,multiplier - haggled);
        return Math.trunc((factor * type.cost) / 1000);
    };
    const stock = haveShop ? projectNamedItems(sharedShop).map(item => {
        const total = sharedShop!.items.reduce((count, entry) =>
            count + (entry?.id === item.id ? entry.count : 0),0);
        const buyPrice = shopPrice(item.id,total,bot.vars[shopSellVar]);
        const sellPrice = shopPrice(item.id,total,bot.vars[shopBuyVar]);
        return buyPrice === null || sellPrice === null ? null : {
            slot:item.slot,id:item.id,name:item.name,count:item.count,
            baseCost:ObjType.get(item.id).cost,
            buyPrice:Math.max(1,buyPrice),sellPrice
        };
    }) : null;
    const mySaleItems = haveShop ? projectNamedItems(inventory).map(item => {
        const current = sharedShop!.items.reduce((count,entry) =>
            count + (entry?.id === item.id ? entry.count : 0),0);
        const buyPrice = shopPrice(item.id,current,bot.vars[shopSellVar]);
        const sellPrice = shopPrice(item.id,current,bot.vars[shopBuyVar]);
        return buyPrice === null || sellPrice === null ? null : {
            slot:item.slot,id:item.id,name:item.name,count:item.count,
            baseCost:ObjType.get(item.id).cost,
            buyPrice:Math.max(1,buyPrice),sellPrice
        };
    }) : null;
    const shop = !shopOpen ? { isOpen:false,title:'',shopItems:[],playerItems:[] } :
        haveShop && stock?.every(item => item !== null) &&
        mySaleItems?.every(item => item !== null) ? {
            isOpen:true,title:shopTitle!,shopItems:stock,playerItems:mySaleItems
        } : null;
    const interfaceOptions = mainModal >= 0 ? buttonsForRoot(mainModal) : [];
    const interfaceState = interfaceOptions === null ? null : {
        isOpen:mainModal !== -1, interfaceId: mainModal, options:interfaceOptions
    };

    // Native PlayerState values we DO know, kept separate from still-unknown
    // client-observed death lifecycle and combat target events. We deliberately
    // do not populate SDK PlayerState until those required signals are proven.
    const playerBase = {
        name: botName!, combatLevel: bot.combatLevel,
        hp: bot.levels[PlayerStat.HITPOINTS],
        maxHp: bot.baseLevels[PlayerStat.HITPOINTS],
        x: bot.x, z: bot.z, worldX: bot.x, worldZ: bot.z,
        level: bot.level, runEnergy: bot.runenergy / 100,
        runWeight: bot.runweight / 1000, animId: bot.animId,
        spotanimId: bot.spotanimId,
        isDead: bot.levels[PlayerStat.HITPOINTS] === 0
    };
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

    // The authoritative PAUSEBUTTON script really contains these component
    // IDs (populated by IF_ADDRESUMEBUTTON). Text comes from the packed client
    // Component definition or exact server IfSetText updates. Unknown labels
    // remain unavailable, rather than fabricated dialogue choices.
    const waitingForButton = bot.activeScript?.execution === ScriptState.PAUSEBUTTON;
    const waitingForCount = bot.activeScript?.execution === ScriptState.COUNTDIALOG;
    const pending = waitingForButton ? [...bot.resumeButtons] : [];
    const knownOptions = pending.map((id,index) => {
        const component = Component.get(id);
        const label = component?.option ?? displayText(id);
        return component && typeof label === 'string' && label.trim() ?
            {index:index + 1, text:label, componentId:id} : null;
    });
    const optionTextAvailable = pending.length > 0 &&
        knownOptions.every(option => option !== null);
    const dialogueText = bot.modalChat >= 0 ? displayText(bot.modalChat) : null;
    const dialogue = {
        isOpen: bot.modalChat !== -1 || waitingForButton || waitingForCount,
        isWaiting: waitingForButton || waitingForCount,
        options: optionTextAvailable ? knownOptions : [],
        pendingComponentIds: pending,
        optionTextAvailable,
        pageId: trace && waitingForButton && optionTextAvailable ?
            `${bot.modalChat}:${trace.dialogPageRevision}:${pending.join(',')}` : undefined,
        text: dialogueText ?? undefined
    };

    // Strictly expose only the selected bot's live fields. Quest stages
    // and full client-side RS-SDK UI remain unknown (null), never guessed.
    // Nearby objects/drops are grounded in the exact pinned native ZoneMap.
    // Task 29: recover real tick-by-tick, bot-scoped life and game-message
    // evidence from the passive native Player/World observer hooks.
    // Incomplete combat provenance, unknown attack mode or unseen dialogue
    // history remain NULL, never invented.
    const lastCombatId = VarPlayerType.getId('lastcombat');
    const lastCombatValue = lastCombatId >= 0 ? bot.vars[lastCombatId] : null;
    const inCombat = lastCombatValue === null ? null :
        lastCombatValue > 0 && lastCombatValue + 8 >= World.currentTick;
    const targetIsNpc = bot.target !== null &&
        typeof (bot.target as { nid?: unknown }).nid === 'number';
    const targetIsPlayer = bot.target !== null &&
        typeof (bot.target as { slot?: unknown }).slot === 'number';
    const combat = inCombat === null ? null : {
        inCombat,
        targetType: !inCombat ? 'none' : targetIsNpc ? 'npc' :
            targetIsPlayer ? 'player' : 'none',
        targetIndex: !inCombat ? -1 : targetIsNpc ?
            (bot.target as { nid: number }).nid : targetIsPlayer ?
            (bot.target as { slot: number }).slot : -1,
        lastDamageTick: trace?.lastDamageTick ?? -1
    };
    const playerState = trace && combat ? {
        ...playerBase, combat,
        lifeId: trace.lifeId, respawnCount: trace.respawnCount,
        lastDeathTick: trace.lastDeathTick
    } : null;
    const recentDialogs = trace && Array.isArray(trace.recentDialogs) &&
        (bot.modalChat===-1 || trace.sawDialogPage) ?
        trace.recentDialogs : null;
    const gameMessages = trace && nearbyPlayers.length === 0 ?
        trace.gameMessages : null;
    const combatEvents = trace?.combatEvents ?? null;

    // Native appearance state belongs to this already authenticated disposable
    // bot. These are the REAL persistent values changed by the ordinary
    // Client-Java 377 IDK_SAVEDESIGN (opcode 163) handler; never infer them
    // from an unverified WebSocket action acknowledgement.
    const appearance = {
        gender: bot.gender,
        body: Array.from(bot.body),
        colours: Array.from(bot.colors),
        designModalOpen: Component.getId('player_kit') >= 0 &&
            bot.modalMain === Component.getId('player_kit')
    };
    if (!(appearance.gender === 0 || appearance.gender === 1) ||
        appearance.body.length !== 7 || appearance.colours.length !== 5 ||
        !appearance.body.every(n => Number.isSafeInteger(n)) ||
        !appearance.colours.every(n => Number.isSafeInteger(n))) {
        throw new Error('actual_native_377_player_appearance_invalid');
    }

    const sdkDetails = {
        // Native values are always projected only from the authenticated bot.
        // An incomplete required client-side signal is explicitly null.
        player: playerState, playerBase, nearbyPlayers,
        gameMessages, recentDialogs,
        interface: interfaceState, shop, bank,
        modalOpen: bot.modalMain !== -1 || bot.modalChat !== -1 || bot.modalSide !== -1,
        modalInterface: mainModal !== -1 ? mainModal :
            bot.modalChat !== -1 ? bot.modalChat : bot.modalSide,
        combatEvents, prayers, appearance
    };

    const observation = {
        world: { mode: 'isolated', revision: 377, tickMs: 600,
            xpMultiplier: 1, instanceId: instanceId!, sourceSha: sourceSha! },
        player: { username: botName!, isBot: true },
        tick: World.currentTick,
        position: { x: bot.x, z: bot.z, plane: bot.level },
        skills,
        // A complete SDK InventoryItem must include the *actual* cached name
        // and 377 item options; never silently omit unknown named items.
        inventory: namesKnown(inventory) ? projectNamedItems(inventory) : null,
        equipment: namesKnown(worn) ? projectNamedItems(worn) : null,
        nearbyNpcs,
        nearbyLocs, groundItems,
        dialogue,
        // Read the native player's own persistent Barcrawl varp, only on the
        // authenticated disposable world/observer route. Do not read or
        // modify any other player's quest data. Null means not observable.
        questStages: (() => {
            const barcrawlId = VarPlayerType.getId('barcrawl');
            if (barcrawlId < 0) return null;
            const raw = bot.getVar(barcrawlId);
            return Number.isSafeInteger(raw) && raw >= 0 ? { barcrawl: raw } : null;
        })(),
        sdkDetails
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

import v8 from 'node:v8';

import { Visibility } from '#/network/rsbuf/index.js';
import { LocAngle, LocShape } from '#/engine/routefinder/index.js';

import Component from '#/cache/config/Component.js';
import IdkType from '#/cache/config/IdkType.js';
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import ScriptVarType from '#/cache/config/ScriptVarType.js';
import SeqType from '#/cache/config/SeqType.js';
import SpotanimType from '#/cache/config/SpotanimType.js';
import VarBitType from '#/cache/config/VarBitType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';

import { CoordGrid } from '#/engine/CoordGrid.js';
import World from '#/engine/World.js';
import { executeTeleportRequest, getLastDestinationId, returnToPreviousLocation, searchTeleportDestinations, TELEPORT_DESTINATIONS } from '#/engine/TeleportNetwork.js';
import { EntityLifeCycle } from '#/engine/entity/EntityLifeCycle.js';
import Loc from '#/engine/entity/Loc.js';
import { MoveStrategy } from '#/engine/entity/MoveStrategy.js';
import { isClientConnected } from '#/engine/entity/NetworkPlayer.js';
import Npc from '#/engine/entity/Npc.js';
import Player, { getExpByLevel, isBotPlayer } from '#/engine/entity/Player.js';
import { formatBotWhereabouts } from '#/engine/bot/FredGeorgeBot.js';
import { PlayerQueueType } from '#/engine/entity/PlayerQueueRequest.js';
import { PlayerStat, PlayerStatEnabled, PlayerStatMap } from '#/engine/entity/PlayerStat.js';
import ScriptProvider from '#/engine/script/ScriptProvider.js';
import ScriptRunner from '#/engine/script/ScriptRunner.js';

import ClientGameMessageHandler from '#/network/game/client/ClientGameMessageHandler.js';
import ClientCheat from '#/network/game/client/model/ClientCheat.js';

import { LoggerEventType } from '#/server/logger/LoggerEventType.js';

import Environment from '#/util/Environment.js';
import { printDebug } from '#/util/Logger.js';
import { tryParseInt } from '#/util/TryParse.js';

export default class ClientCheatHandler extends ClientGameMessageHandler<ClientCheat> {
    handle(message: ClientCheat, player: Player): boolean {
        if (message.input.length > 80) {
            return false;
        }

        const { input: cheat } = message;

        const args: string[] = cheat.toLowerCase().split(' ');
        const cmd: string | undefined = args.shift();
        if (cmd === 'luna' && player.staffModLevel >= 2) {
            let bot = World.getPlayerByUsername('Luna');
            if (!isBotPlayer(bot)) {
                bot = World.spawnDevelopmentBots(true);
            }
            if (!isBotPlayer(bot)) {
                player.messageGame('Luna could not be spawned in this world.');
                return true;
            }
            const mode = args[0];
            if (
                mode === 'assist' ||
                mode === 'defend' ||
                mode === 'follow' ||
                mode === 'stop' ||
                mode === 'work' ||
                mode === 'bank'
            ) {
                bot.setMode(mode, World.currentTick);
                player.messageGame(`Luna: ${mode} at ${bot.x},${bot.z},${bot.level}.`);
            } else if (mode === 'train' || mode === 'skilling' || mode === 'levelup') {
                bot.setMode('work', World.currentTick);
                const burst = bot.trainAllSkillsBurst(5, World.currentTick);
                player.messageGame(
                    `Luna all-21-skills training active (+${Math.floor(burst.totalXpAdded / 10).toLocaleString('en-US')} XP across ${burst.skillsTrained} skills)!`
                );
            } else if (mode === 'maxxp' || mode === 'boost') {
                const rounds = Math.max(1, Math.min(parseInt(args[1] ?? '10', 10) || 10, 50));
                const burst = bot.trainAllSkillsBurst(rounds, World.currentTick);
                player.messageGame(
                    `Luna trained ${burst.skillsTrained}/21 skills (+${Math.floor(burst.totalXpAdded / 10).toLocaleString('en-US')} XP). ${bot.getSkillsSummaryReport()}`
                );
            } else if (mode === 'skills' || mode === 'xp') {
                player.messageGame(bot.getSkillsSummaryReport());
            } else if (mode === 'quiet' || mode === 'mute' || mode === 'shh') {
                bot.brain.quietMode = true;
                player.messageGame('Luna is now in quiet mode (no ambient overhead chat).');
            } else if (mode === 'talk' || mode === 'unmute') {
                bot.brain.quietMode = false;
                player.messageGame('Luna overhead callouts re-enabled.');
            } else if (mode === 'status') {
                player.messageGame(bot.getStatusReport());
            } else if (mode === 'duel' || mode === 'spar' || mode === 'challenge') {
                bot.handleChallengeFrom(player, 1, World.currentTick);
            } else if (mode === 'here' || mode === 'summon') {
                bot.teleport(player.x + 1, player.z, player.level);
                player.messageGame(`Luna summoned to ${bot.x},${bot.z},${bot.level}.`);
            } else if (mode === 'max' || mode === 'gear') {
                bot.applyMaxedLegendLoadout();
                player.messageGame(`Luna upgraded to Combat ${bot.combatLevel} Maxed Legend loadout.`);
            } else {
                player.messageGame(
                    `${bot.getStatusReport()} | Commands: ::luna train, ::luna skills, ::luna maxxp, ::luna assist, ::luna follow, ::luna defend, ::luna stop, ::luna status, ::luna duel, ::luna work, ::luna bank, ::luna here, ::luna gear.`
                );
            }
            return true;
        }
        if (cmd === undefined || cmd.length <= 0) {
            return false;
        }

        if (player.staffModLevel >= 2) {
            player.addSessionLog(LoggerEventType.MODERATOR, 'Ran cheat', cheat);
        }

        // Gielinor Fast Travel Network commands (validated server-side with permission & rune checks)
        if (cmd === 'tele_dest' || cmd === 'ft') {
            if (args.length < 1) {
                player.messageGame('Usage: ::tele_dest <destination_id> [confirm]');
                return true;
            }
            const confirmed = args[args.length - 1] === 'confirm' || args[args.length - 1] === 'yes';
            const destId = confirmed && args.length > 1 ? args.slice(0, -1).join('_') : args.join('_');
            executeTeleportRequest(player, destId, { confirmed });
            return true;
        } else if (cmd === 'hub') {
            executeTeleportRequest(player, 'varrock_portal_hub', { confirmed: true });
            return true;
        } else if (cmd === 'back') {
            returnToPreviousLocation(player);
            return true;
        } else if (cmd === 'lasttele') {
            const lastId = getLastDestinationId(player.username);
            if (!lastId) {
                player.messageGame('No previous teleport destination found.');
                return true;
            }
            executeTeleportRequest(player, lastId, { confirmed: true });
            return true;
        } else if (cmd === 'destinations') {
            const filter = args[0]?.toLowerCase();
            const matches = searchTeleportDestinations(filter ?? '');
            player.messageGame(`Gielinor Fast Travel Network (${matches.length}/${TELEPORT_DESTINATIONS.length} destinations):`);
            const preview = matches
                .slice(0, 8)
                .map(d => `${d.name} (${d.id})`)
                .join(', ');
            if (preview) {
                player.messageGame(preview + (matches.length > 8 ? '...' : ''));
            }
            return true;
        }

        if ((player.username.toLowerCase() === 'elrothiro' || player.staffModLevel >= 2) && (cmd === 'wherefred' || cmd === 'wheregeorge' || cmd === 'wherebots')) {
            const target = cmd === 'wherefred' ? 'Fred' : cmd === 'wheregeorge' ? 'George' : undefined;
            for (const line of formatBotWhereabouts(World, target)) {
                player.messageGame(line);
            }
            return true;
        }

        if (!Environment.NODE_PRODUCTION && player.staffModLevel >= 2 && (cmd === 'candle' || cmd === 'candlerestore')) {
            const scriptName = cmd === 'candle' ? '[debugproc,candle_test]' : '[debugproc,candle_recover]';
            const script = ScriptProvider.getByName(scriptName);
            if (!script) {
                player.messageGame('Candlelight diagnostic script is unavailable.');
                return true;
            }
            player.executeScript(ScriptRunner.init(script, player), false);
            return true;
        }

        if (!Environment.NODE_PRODUCTION && player.staffModLevel >= 4) {
            // developer commands

            if (cmd[0] === Environment.NODE_DEBUGPROC_CHAR) {
                // debugprocs are NOT allowed on live ;)
                const script = ScriptProvider.getByName(`[debugproc,${cmd.slice(1)}]`);
                if (!script) {
                    return false;
                }

                const params = new Array(script.info.parameterTypes.length).fill(-1);
                for (let i = 0; i < script.info.parameterTypes.length; i++) {
                    const type = script.info.parameterTypes[i];

                    try {
                        switch (type) {
                            case ScriptVarType.STRING: {
                                const value = args.shift();
                                params[i] = value ?? '';
                                break;
                            }
                            case ScriptVarType.INT: {
                                const value = args.shift();
                                params[i] = parseInt(value ?? '0', 10) | 0;
                                break;
                            }
                            case ScriptVarType.OBJ:
                            case ScriptVarType.NAMEDOBJ: {
                                const name = args.shift();
                                params[i] = ObjType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.NPC: {
                                const name = args.shift();
                                params[i] = NpcType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.LOC: {
                                const name = args.shift();
                                params[i] = LocType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.SEQ: {
                                const name = args.shift();
                                params[i] = SeqType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.STAT: {
                                const name = args.shift() ?? '';
                                params[i] = PlayerStatMap.get(name.toUpperCase());
                                break;
                            }
                            case ScriptVarType.INV: {
                                const name = args.shift();
                                params[i] = InvType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.COORD: {
                                const args2 = cheat.split('_');

                                const level = parseInt(args2[0].slice(6));
                                const mx = parseInt(args2[1]);
                                const mz = parseInt(args2[2]);
                                const lx = parseInt(args2[3]);
                                const lz = parseInt(args2[4]);

                                params[i] = CoordGrid.packCoord(level, (mx << 6) + lx, (mz << 6) + lz);
                                break;
                            }
                            case ScriptVarType.INTERFACE: {
                                const name = args.shift();
                                params[i] = Component.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.SPOTANIM: {
                                const name = args.shift();
                                params[i] = SpotanimType.getId(name ?? '');
                                break;
                            }
                            case ScriptVarType.IDKIT: {
                                const name = args.shift();
                                params[i] = IdkType.getId(name ?? '');
                                break;
                            }
                        }
                    } catch (_) {
                        // invalid arguments
                        return false;
                    }
                }

                player.executeScript(ScriptRunner.init(script, player, null, params), false);
            } else if (cmd === 'reload') {
                World.reload();
            } else if (cmd === 'rebuild') {
                player.messageGame('Rebuilding scripts...');
                World.rebuild();
            } else if (cmd === 'speed') {
                if (args.length < 1) {
                    player.messageGame('Usage: ::speed <ms>');
                    return false;
                }

                const speed: number = tryParseInt(args.shift(), 20);
                if (speed < 20) {
                    player.messageGame('::speed input was too low.');
                    return false;
                }

                player.messageGame(`World speed was changed to ${speed}ms`);
                World.tickRate = speed;
            } else if (cmd === 'fly') {
                if (player.moveStrategy === MoveStrategy.FLY) {
                    player.moveStrategy = MoveStrategy.SMART;
                } else {
                    player.moveStrategy = MoveStrategy.FLY;
                }

                player.messageGame(`Changed move strategy: ${player.moveStrategy === MoveStrategy.FLY ? 'fly' : 'smart'}`);
            } else if (cmd === 'naive') {
                if (player.moveStrategy === MoveStrategy.NAIVE) {
                    player.moveStrategy = MoveStrategy.SMART;
                } else {
                    player.moveStrategy = MoveStrategy.NAIVE;
                }

                player.messageGame(`Naive move strategy: ${player.moveStrategy === MoveStrategy.NAIVE ? 'naive' : 'smart'}`);
            } else if (cmd === 'random') {
                player.afkEventReady = true;
            }
        }

        if (player.staffModLevel >= 3) {
            // admin commands (potentially destructive for a live economy)

            if (cmd === 'setvar') {
                // authentic
                if (args.length < 2) {
                    // ::setvar <variable> <value>
                    // Sets variable to specified value
                    return false;
                }

                const debugname = args[0];
                const value = Math.max(-0x80000000, Math.min(tryParseInt(args[1], 0), 0x7fffffff));

                let varp: VarPlayerType | null = null;
                const varbit = VarBitType.getByName(debugname);
                if (varbit) {
                    varp = VarPlayerType.get(varbit.basevar);

                    if (varp.protect) {
                        player.closeModal();

                        if (!player.canAccess()) {
                            player.messageGame('Please finish what you are doing first.');
                            return false;
                        }

                        player.clearInteraction();
                        player.unsetMapFlag();
                    }
                } else {
                    varp = VarPlayerType.getByName(debugname);
                }

                if (!varp) {
                    return false;
                }

                if (varp.protect) {
                    player.closeModal();

                    if (!player.canAccess()) {
                        player.messageGame('Please finish what you are doing first.');
                        return false;
                    }

                    player.clearInteraction();
                    player.unsetMapFlag();
                }

                if (varbit) {
                    player.setVarBit(varbit.id, value);
                    player.messageGame('set ' + varbit.debugname + ': to ' + value);
                } else {
                    player.setVar(varp.id, value);
                    player.messageGame('set ' + varp.debugname + ': to ' + value);
                }
            } else if (cmd === 'setvarother' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 3) {
                    // ::setvarother <username> <name> <value>
                    return false;
                }

                const other = World.getPlayerByUsername(args[0]);
                if (!other) {
                    player.messageGame(`${args[0]} is not logged in.`);
                    return false;
                }

                const varp = VarPlayerType.getByName(args[1]);
                if (!varp) {
                    return false;
                }

                if (varp.protect) {
                    other.closeModal();

                    if (!other.canAccess()) {
                        player.messageGame(`${args[0]} is busy right now.`);
                        return false;
                    }

                    other.clearInteraction();
                    other.unsetMapFlag();
                }

                const value = Math.max(-0x80000000, Math.min(tryParseInt(args[2], 0), 0x7fffffff));
                other.setVar(varp.id, value);
                player.messageGame('set ' + args[1] + ': to ' + value + ' on ' + other.username);
            } else if (cmd === 'getvar') {
                // authentic
                if (args.length < 1) {
                    // ::getvar <variable>
                    // Displays value of specified variable
                    return false;
                }

                const debugname = args[0];

                let varp: VarPlayerType | null = null;
                const varbit = VarBitType.getByName(debugname);
                if (varbit) {
                    varp = VarPlayerType.get(varbit.basevar);

                    if (varp.protect) {
                        player.closeModal();

                        if (!player.canAccess()) {
                            player.messageGame('Please finish what you are doing first.');
                            return false;
                        }

                        player.clearInteraction();
                        player.unsetMapFlag();
                    }
                } else {
                    varp = VarPlayerType.getByName(debugname);
                }

                if (!varp) {
                    return false;
                }

                if (varbit) {
                    const value = player.getVarBit(varbit.id);
                    player.messageGame('get ' + varbit.debugname + ': ' + value);
                } else {
                    const value = player.getVar(varp.id);
                    player.messageGame('get ' + varp.debugname + ': ' + value);
                }
            } else if (cmd === 'getvarother' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 2) {
                    // ::getvarother <username> <variable>
                    return false;
                }

                const other = World.getPlayerByUsername(args[0]);
                if (!other) {
                    player.messageGame(`${args[0]} is not logged in.`);
                    return false;
                }

                const varp = VarPlayerType.getByName(args[1]);
                if (!varp) {
                    return false;
                }

                const value = other.getVar(varp.id);
                player.messageGame('get ' + varp.debugname + ': ' + value + ' on ' + other.username);
            } else if (cmd === 'give') {
                // authentic
                if (args.length < 1) {
                    // ::give <item> (amount)
                    // Adds the items(s) to your inventory
                    return false;
                }

                const lookupName = args[0] === 'amulet_of_fury' || args[0] === 'fury' ? 'enchanted_onyx_amulet' : args[0];
                let obj = ObjType.getId(lookupName);
                if (obj === -1) {
                    const query = args[0].replace(/_/g, ' ').toLowerCase();
                    for (let id = 0; id < ObjType.count; id++) {
                        const t = ObjType.get(id);
                        if (t && t.dummyitem === 0 && t.certtemplate === -1 && t.name?.toLowerCase() === query) {
                            obj = id;
                            break;
                        }
                    }
                }
                if (obj === -1) {
                    return false;
                }

                const count = Math.max(1, Math.min(tryParseInt(args[1], 1), 0x7fffffff));
                player.invAdd(InvType.INV, obj, count);
            } else if (cmd === 'equip') {
                if (args.length < 1) {
                    player.messageGame('Usage: ::equip <item_debugname_or_name>');
                    return false;
                }

                const rawQuery = args.join(' ');
                const lookupName = rawQuery === 'amulet_of_fury' || rawQuery === 'amulet of fury' || rawQuery === 'fury' ? 'enchanted_onyx_amulet' : args[0];
                let objId = ObjType.getId(lookupName);
                if (objId === -1) {
                    const query = rawQuery.replace(/_/g, ' ').toLowerCase();
                    for (let id = 0; id < ObjType.count; id++) {
                        const t = ObjType.get(id);
                        if (t && t.dummyitem === 0 && t.certtemplate === -1 && t.name?.toLowerCase() === query) {
                            objId = id;
                            break;
                        }
                    }
                }
                if (objId === -1) {
                    player.messageGame(`Unknown item: ${rawQuery}`);
                    return false;
                }

                const objType = ObjType.get(objId);
                if (!objType || objType.wearpos === -1) {
                    player.messageGame(`${objType?.name ?? rawQuery} is not wearable.`);
                    return false;
                }

                const worn = player.getInventory(InvType.WORN);
                if (!worn) {
                    return false;
                }

                const prev = worn.get(objType.wearpos);
                if (prev) {
                    worn.delete(objType.wearpos);
                    player.invAdd(InvType.INV, prev.id, prev.count);
                }
                worn.set(objType.wearpos, { id: objId, count: 1 });
                player.buildAppearance(InvType.WORN);
                const updateAll = ScriptProvider.getByName('[queue,update_all]');
                if (updateAll) {
                    player.enqueueScript(updateAll, PlayerQueueType.ENGINE);
                }
                player.messageGame(`Equipped ${objType.name} (${objType.debugname}, id=${objId}) in slot ${objType.wearpos}.`);
            } else if (cmd === 'giveother' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 2) {
                    // ::giveother <username> <item> (amount)
                    return false;
                }

                const other = World.getPlayerByUsername(args[0]);
                if (!other) {
                    player.messageGame(`${args[0]} is not logged in.`);
                    return false;
                }

                const obj = ObjType.getId(args[1]);
                if (obj === -1) {
                    return false;
                }

                const count = Math.max(1, Math.min(tryParseInt(args[2], 1), 0x7fffffff));
                other.invAdd(InvType.INV, obj, count);
            } else if (cmd === 'givecrap') {
                // authentic (we don't know the exact specifics of this...)

                // Fills your inventory with random items
                for (let i = 0; i < 28; i++) {
                    let random = -1;
                    while (random === -1) {
                        random = Math.trunc(Math.random() * ObjType.count);
                        const obj = ObjType.get(random);
                        if ((!Environment.NODE_MEMBERS && obj.members) || obj.dummyitem !== 0 || obj.certtemplate !== -1) {
                            random = -1;
                        }
                    }

                    player.invAdd(InvType.INV, random, 1);
                }
            } else if (cmd === 'givemany') {
                // authentic
                if (args.length < 1) {
                    // ::givemany <item>
                    // Adds up to 1000 of the item to your inventory
                    return false;
                }

                const obj = ObjType.getId(args[0]);
                if (obj === -1) {
                    return false;
                }

                player.invAdd(InvType.INV, obj, 1000);
            } else if (cmd === 'broadcast' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 0) {
                    return false;
                }

                World.broadcastMes(cheat.substring(cmd.length + 1));
            } else if (cmd === 'reboot' && Environment.NODE_PRODUCTION) {
                // semi-authentic - we actually just shut down for maintenance

                // Reboots the game world, applying packed changes
                World.rebootTimer(0);
            } else if (cmd === 'slowreboot' && Environment.NODE_PRODUCTION) {
                // semi-authentic - we actually just shut down for maintenance
                if (args.length < 1) {
                    // ::slowreboot <seconds>
                    // Reboots the game world, with a timer
                    return false;
                }

                World.rebootTimer(Math.ceil((tryParseInt(args[0], 30) * 1000) / 600));
            } else if (cmd === 'serverdrop') {
                // testing reconnection behavior
                player.terminate();
            } else if (cmd === 'teleother' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 1) {
                    // ::teleother <username>
                    return false;
                }

                const other = World.getPlayerByUsername(args[0]);
                if (!other) {
                    player.messageGame(`${args[0]} is not logged in.`);
                    return false;
                }

                other.closeModal();

                if (!other.canAccess()) {
                    player.messageGame(`${args[0]} is busy right now.`);
                    return false;
                }

                other.clearInteraction();
                other.unsetMapFlag();

                other.teleJump(player.x, player.z, player.level);
            } else if (cmd === 'setstat') {
                // authentic
                if (args.length < 2) {
                    // ::setstat <skill> <level>
                    // Sets the skill to specified level
                    return false;
                }

                const stat = PlayerStatMap.get(args[0].toUpperCase());
                if (typeof stat === 'undefined') {
                    return false;
                }

                player.setLevel(stat, parseInt(args[1]));
            } else if (cmd === 'advancestat') {
                // authentic
                if (args.length < 1) {
                    // ::advancestat <skill> <level>
                    // Advances skill to specified level, generates level up message etc.
                    return false;
                }

                const stat = PlayerStatMap.get(args[0].toUpperCase());
                if (typeof stat === 'undefined') {
                    return false;
                }

                player.stats[stat] = 0;
                player.baseLevels[stat] = 1;
                player.levels[stat] = 1;
                player.addXp(stat, getExpByLevel(parseInt(args[1])), false);
            } else if (cmd === 'minme') {
                // like maxme debugproc, but in engine because xp goes down
                for (let i = 0; i < PlayerStatEnabled.length; i++) {
                    if (i === PlayerStat.HITPOINTS) {
                        player.setLevel(i, 10);
                    } else {
                        player.setLevel(i, 1);
                    }
                }
            } else if (cmd === 'locadd') {
                // authentic - https://youtu.be/E6tQ3b3vzro?t=3194
                if (args.length < 1) {
                    return false;
                }
                const name: string = args[0];
                const type: LocType | null = LocType.getByName(name);
                if (!type) {
                    return false;
                }
                World.addLoc(new Loc(player.level, player.x, player.z, type.width, type.length, EntityLifeCycle.DESPAWN, type.id, LocShape.CENTREPIECE_STRAIGHT, LocAngle.WEST), 500);
                player.messageGame(`Loc Added: ${name} (ID: ${type.id})`);
            } else if (cmd === 'npcadd') {
                // authentic - https://youtu.be/E6tQ3b3vzro?t=3412
                if (args.length < 1) {
                    return false;
                }
                const name: string = args[0];
                const type: NpcType | null = NpcType.getByName(name);
                if (!type) {
                    return false;
                }
                World.addNpc(new Npc(player.level, player.x, player.z, type.size, type.size, EntityLifeCycle.DESPAWN, World.getNextNid(), type.id, type.blockwalk), 500);
            } else if (cmd === 'openmain') {
                if (args.length < 1) {
                    return false;
                }

                const name: string = args[0];
                const type: Component | null = Component.getByName(name);

                if (!type || type.rootLayer !== type.id) {
                    return false;
                }

                player.openMainModal(type.id);
            } else if (cmd === 'openoverlay') {
                if (args.length < 1) {
                    return false;
                }

                const name: string = args[0];
                const type: Component | null = Component.getByName(name);

                if (!type || type.rootLayer !== type.id) {
                    return false;
                }

                player.openMainOverlay(type.id);
            } else if (cmd === 'closeoverlay') {
                player.openMainOverlay(-1);
            } else if (cmd === 'snapshot') {
                const heap = v8.writeHeapSnapshot();
                printDebug(`Heap snapshot written to: ${heap}`);
            }
        }

        if (player.staffModLevel >= 2) {
            // "super-moderator" commands (similar to a jmod but we don't know their command capabilities on live)

            if (cmd === 'getcoord') {
                // authentic

                // Displays current coordinate
                player.messageGame(CoordGrid.formatString(player.level, player.x, player.z, ','));
            } else if (cmd === 'tele') {
                // authentic - https://youtu.be/60Y3y375VYA?t=980
                if (args.length < 1) {
                    // ::tele x,xx,xx[,xx,xx]
                    // Teleports you to the coordinate. In order, the parts are level, horizontal map square, vertical map square, horizontal tile, vertical tile.
                    return false;
                }

                const coord = args[0].split(',');
                if (coord.length < 3) {
                    return false;
                }

                player.closeModal();

                if (!player.canAccess()) {
                    player.messageGame('Please finish what you are doing first.');
                    return false;
                }

                player.clearInteraction();
                player.unsetMapFlag();

                const level = tryParseInt(coord[0], 0);
                const mx = tryParseInt(coord[1], 50);
                const mz = tryParseInt(coord[2], 50);
                const lx = tryParseInt(coord[3], 32);
                const lz = tryParseInt(coord[4], 32);

                if (level < 0 || level > 3 || mx < 0 || mx > 255 || mz < 0 || mz > 255 || lx < 0 || lx > 63 || lz < 0 || lz > 63) {
                    return false;
                }

                player.teleJump((mx << 6) + lx, (mz << 6) + lz, level);
            } else if (cmd === 'teleto' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 1) {
                    return false;
                }

                // ::teleto <username>
                const other = World.getPlayerByUsername(args[0]);
                if (!other) {
                    player.messageGame(`${args[0]} is not logged in.`);
                    return false;
                }

                player.closeModal();

                if (!player.canAccess()) {
                    player.messageGame('Please finish what you are doing first.');
                    return false;
                }

                player.clearInteraction();
                player.unsetMapFlag();

                player.teleJump(other.x, other.z, other.level);
            } else if (cmd === 'setvis' && Environment.NODE_PRODUCTION) {
                // authentic
                if (args.length < 1) {
                    // ::setvis <level>
                    return false;
                }

                switch (args[0]) {
                    case '0':
                        player.setVisibility(Visibility.DEFAULT);
                        break;
                    case '1':
                        player.setVisibility(Visibility.SOFT);
                        break;
                    case '2':
                        player.setVisibility(Visibility.HARD);
                        break;
                    default:
                        return false;
                }
            } else if (cmd === 'ban' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 2) {
                    // ::ban <username> <minutes>
                    player.messageGame('Usage: ::ban <username> <minutes>');
                    return false;
                }

                const username = args[0];
                const minutes = Math.max(0, tryParseInt(args[1], 60));

                World.notifyPlayerBan(player.username, username, Date.now() + minutes * 60 * 1000);
                player.messageGame(`Player '${args[0]}' has been banned for ${minutes} minutes.`);
            } else if (cmd === 'mute' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 2) {
                    // ::mute <username> <minutes>
                    player.messageGame('Usage: ::mute <username> <minutes>');
                    return false;
                }

                const username = args[0];
                const minutes = Math.max(0, tryParseInt(args[1], 60));

                World.notifyPlayerMute(player.username, username, Date.now() + minutes * 60 * 1000);
                player.messageGame(`Player '${args[0]}' has been muted for ${minutes} minutes.`);
            } else if (cmd === 'kick' && Environment.NODE_PRODUCTION) {
                // custom
                if (args.length < 1) {
                    // ::kick <username>
                    player.messageGame('Usage: ::kick <username>');
                    return false;
                }

                const username = args[0];

                const other = World.getPlayerByUsername(username);
                if (other) {
                    other.loggingOut = true;
                    if (isClientConnected(other)) {
                        other.logout();
                        other.client.close();
                    }
                    player.messageGame(`Player '${args[0]}' has been kicked from the game.`);
                } else {
                    player.messageGame(`Player '${args[0]}' does not exist or is not logged in.`);
                }
            }
        }

        return true;
    }
}

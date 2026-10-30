/**
 * Opt-in revision-377 test bot: ONE virtual player; no external client or LLM.
 *
 * An ordinary Player participates in the server's player list, so nearby real
 * clients see it move. Woodcutting goes through the same APLOC interaction
 * and RuneScript trigger as a human's tree click. No direct XP/log granting.
 *
 * This first slice stops when the inventory fills. Its character is deliberately
 * ephemeral and is excluded from account autosave; no player save is modified.
 */
import LocType from '#/cache/config/LocType.js';
import ObjType from '#/cache/config/ObjType.js';
import InvType from '#/cache/config/InvType.js';
import { CoordGrid } from '#/engine/CoordGrid.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import Player from '#/engine/entity/Player.js';
import { PlayerLoading } from '#/engine/entity/PlayerLoading.js';
import { MoveSpeed } from '#/engine/entity/MoveSpeed.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import Packet from '#/io/Packet.js';
import type World from '#/engine/World.js';

type WorldRuntime = typeof World;
const USERNAME = 'oakwalker';
// Draynor is chosen for its ordinary low-level tree locations; we do not
// hard-code individual loc IDs (map variants / respawns can change them).
const START = { x: 3098, z: 3242, level: 0 };
const SEARCH_RADIUS = 16;
const DECISION_INTERVAL_TICKS = 15;

let bot: Player | null = null;
let nextDecisionTick = 0;
let fullReported = false;
let noTreeReported = false;

export function isWoodcutterBot(player: Player): boolean {
    return bot === player;
}

/**
 * Call after World.start(), never during cache packing or login initialization.
 * No bot is spawned unless JOSHRS_WOODCUTTER=1 is explicitly set.
 */
export function spawnWoodcutterBot(world: WorldRuntime): void {
    if (process.env.JOSHRS_WOODCUTTER !== '1' || bot !== null) {
        return;
    }

    const axeId = ObjType.getId('bronze_axe');
    if (axeId < 0) {
        console.error('[JoshRS bot] Missing bronze_axe in revision-377 object config; bot not started.');
        return;
    }

    const player = PlayerLoading.load(USERNAME, new Packet(new Uint8Array(0)), null);
    player.x = START.x;
    player.z = START.z;
    player.level = START.level;
    player.moveSpeed = MoveSpeed.WALK;
    player.lastResponse = world.currentTick;
    player.lastConnected = world.currentTick;

    if (player.invAdd(InvType.INV, axeId, 1) !== 1) {
        console.error('[JoshRS bot] Could not equip starter inventory with a bronze axe; bot not started.');
        return;
    }
    // The normal world login pipeline gives the bot a player slot, creates its
    // appearance and makes it visible to other players.
    bot = player;
    world.newPlayers.add(player);
    nextDecisionTick = world.currentTick + 5;
    console.info('[JoshRS bot] One woodcutter queued: oakwalker near Draynor.');
}

/**
 * Called ON the main world tick before the ordinary player-processing loop.
 * Never runs a second interval, socket, browser, background thread or AI call.
 */
export function tickWoodcutterBot(world: WorldRuntime): void {
    const player = bot;
    if (!player || player.slot < 0 || !player.isActive || player.loggingOut) {
        return;
    }

    // Artificial players have no network client to refresh these counters.
    // Otherwise World.processLogouts treats them as disconnected after 30-60s.
    player.lastConnected = world.currentTick;
    player.lastResponse = world.currentTick;

    if (world.currentTick < nextDecisionTick) return;
    nextDecisionTick = world.currentTick + DECISION_INTERVAL_TICKS;

    // Wait for ongoing RuneScript, animation delay, walk or queued operation.
    // This deliberately prevents spamming the woodcut action.
    if (player.delayed || !player.canAccess() || player.hasInteraction() ||
        player.hasWaypoints() || player.activeScript !== null ||
        player.engineQueue.head() !== null || player.queue.head() !== null) {
        return;
    }

    const inventory = player.getInventory(InvType.INV);
    if (!inventory || inventory.freeSlotCount === 0) {
        if (!fullReported) {
            console.info('[JoshRS bot] oakwalker inventory full; stopped safely (banking not implemented).');
            fullReported = true;
        }
        return;
    }
    fullReported = false;

    // The server's actual live loc list is authoritative: no fabricated trees
    // and no XP, wood or coins awarded directly by this bot.
    let choice: { loc: NonNullable<ReturnType<typeof findChoppableTree>>['loc']; option: number } | null = null;
    let distance = Infinity;
    const sourceX = player.x, sourceZ = player.z, level = player.level;
    for (let x = sourceX - SEARCH_RADIUS; x <= sourceX + SEARCH_RADIUS; x++) {
        for (let z = sourceZ - SEARCH_RADIUS; z <= sourceZ + SEARCH_RADIUS; z++) {
            const d = Math.abs(x - sourceX) + Math.abs(z - sourceZ);
            if (d >= distance || d > SEARCH_RADIUS) continue;
            const found = findChoppableTree(world, x, z, level);
            if (!found) continue;
            choice = found;
            distance = d;
        }
    }

    if (!choice) {
        if (!noTreeReported) {
            console.info('[JoshRS bot] No currently visible level-one trees within 16 tiles of oakwalker.');
            noTreeReported = true;
        }
        return;
    }
    noTreeReported = false;
    player.clearPendingAction();
    player.moveSpeed = MoveSpeed.WALK;
    player.setInteraction(Interaction.ENGINE, choice.loc, ServerTriggerType.APLOC1 + choice.option);
}

function findChoppableTree(world: WorldRuntime, x: number, z: number, level: number) {
    const zone = world.gameMap.getZone(x, z, level);
    for (const loc of zone.getLocsSafe(CoordGrid.packZoneCoord(x, z))) {
        const type = LocType.get(loc.type);
        // Only ordinary level-one trees. Oaks/willows require higher skills and
        // would make an unlevelled bot stop on an unobtainable action.
        if (type.name?.toLowerCase() !== 'tree' || !type.op) continue;
        const option = type.op.findIndex(op => op?.toLowerCase() === 'chop down');
        if (option >= 0) return { loc, option };
    }
    return null;
}

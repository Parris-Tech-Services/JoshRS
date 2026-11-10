// JoshRS private family fast-travel adapter for Lost City revision 274.
// This is an OPTIONAL original convenience feature, not canonical RuneScape content.
// Server-authoritative: never accept arbitrary player-supplied coordinates.
// 274 already performs map-zone allocation checks inside Player.teleJump.
// The destination tiles below are CANDIDATES: prove actual clear landing tiles in a
// disposable 274 client before any promotion to the owner's live phone world.

export const PORTAL_DESTINATIONS_274 = Object.freeze([
    { id: 'lumbridge', name: 'Lumbridge', x: 3222, z: 3218, level: 0 },
    { id: 'varrock_portal_hub', name: 'Varrock portal hub', x: 3212, z: 3424, level: 0 },
    { id: 'falador', name: 'Falador', x: 2965, z: 3379, level: 0 },
    { id: 'draynor', name: 'Draynor Village', x: 3093, z: 3244, level: 0 },
    { id: 'al_kharid', name: 'Al Kharid', x: 3293, z: 3174, level: 0 },
    { id: 'edgeville', name: 'Edgeville', x: 3093, z: 3493, level: 0 },
    { id: 'port_sarim', name: 'Port Sarim', x: 3025, z: 3217, level: 0 },
    { id: 'seers_village', name: "Seers' Village", x: 2725, z: 3485, level: 0 },
    { id: 'ardougne', name: 'Ardougne', x: 2662, z: 3305, level: 0 },
    { id: 'catherby', name: 'Catherby', x: 2807, z: 3434, level: 0 }
]);

const destinationById = new Map(PORTAL_DESTINATIONS_274.map((destination) => [destination.id, destination]));
const playerSessionState = new WeakMap();
const COMMANDS = new Set(['portal', 'destinations', 'ft', 'tele_dest', 'hub', 'back', 'lasttele']);
const COOLDOWN_MS = 1500;

export function portalDestinations274(query = '') {
    const needle = String(query).trim().toLowerCase().replaceAll(' ', '_');
    return PORTAL_DESTINATIONS_274.filter((destination) =>
        destination.id.includes(needle) || destination.name.toLowerCase().replaceAll(' ', '_').includes(needle)
    );
}

function send(player, message) {
    player.messageGame(message);
}

function position(player) {
    return { x: player.x, z: player.z, level: player.level };
}

function samePosition(a, b) {
    return a.x === b.x && a.z === b.z && a.level === b.level;
}

function allowed(player, options) {
    const username = String(player.username ?? '').trim().toLowerCase();
    const users = Array.isArray(options.users) ? options.users : String(options.users ?? '').split(',');
    return options.enabled === true && users.some((value) => String(value).trim().toLowerCase() === username);
}

/**
 * Handles only private-family travel commands. Returns false for unrelated commands.
 * 'options' should be sourced from explicit, private host configuration; default
 * behaviour denies access. No client HTTP endpoint or unauthenticated action exists.
 */
export function handlePortalCommand274(player, command, args = [], options = {}) {
    const cmd = String(command ?? '').toLowerCase();
    if (!COMMANDS.has(cmd)) return false;
    if (!allowed(player, options)) {
        send(player, 'Family portals are not enabled for this character.');
        return true;
    }

    const query = args.join('_').trim().toLowerCase();
    if (cmd === 'destinations' || (cmd === 'portal' && !query)) {
        const matches = portalDestinations274(query && cmd === 'destinations' ? query : '');
        if (!matches.length) {
            send(player, 'No destinations match that search.');
            return true;
        }
        send(player, 'Family portal destinations (' + matches.length + '):');
        for (let i = 0; i < matches.length; i += 3) {
            send(player, matches.slice(i, i + 3).map((item) => item.id).join(', '));
        }
        send(player, 'Use ::ft destination, ::hub, ::back or ::lasttele.');
        return true;
    }

    const state = playerSessionState.get(player) ?? { previous: null, lastDestinationId: null, lastAt: -Infinity };
    const now = typeof options.now === 'number' ? options.now : Date.now();
    if (now - state.lastAt < COOLDOWN_MS) {
        send(player, 'Wait a moment before using another portal.');
        return true;
    }

    let target;
    let destinationId = null;
    if (cmd === 'back') {
        target = state.previous;
        if (!target) {
            send(player, 'No previous portal position in this login session.');
            return true;
        }
    } else {
        destinationId = cmd === 'hub' ? 'varrock_portal_hub'
            : cmd === 'lasttele' ? state.lastDestinationId
            : (cmd === 'portal' || cmd === 'ft' || cmd === 'tele_dest') ? query : null;
        target = destinationById.get(destinationId ?? '');
        if (!target) {
            send(player, 'Unknown portal. Use ::destinations for the available locations.');
            return true;
        }
    }

    if (player.loggingOut) {
        send(player, 'Cannot teleport while logging out.');
        return true;
    }
    if (samePosition(position(player), target)) {
        send(player, 'You are already at that portal destination.');
        return true;
    }
    player.closeModal();
    if (!player.canAccess()) {
        send(player, 'Finish what you are doing before using a portal.');
        return true;
    }

    const before = position(player);
    player.clearInteraction();
    player.unsetMapFlag();
    // Uses native revision-274 movement/region-update code; it checks that
    // the destination zone exists. Do not use a debug-only warp.
    player.teleJump(target.x, target.z, target.level);
    if (!samePosition(position(player), target)) {
        send(player, 'Portal failed: destination not available in this world.');
        return true;
    }

    state.previous = before;
    if (destinationId) state.lastDestinationId = destinationId;
    state.lastAt = now;
    playerSessionState.set(player, state);
    send(player, cmd === 'back' ? 'Returned to the previous portal position.'
        : 'Travelled to ' + target.name + '. Use ::back to return.');
    return true;
}

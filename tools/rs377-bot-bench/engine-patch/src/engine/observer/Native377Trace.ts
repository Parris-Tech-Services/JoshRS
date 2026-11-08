/**
 * Genuine isolated-377 bot-only output/tick evidence.
 *
 * Installed only in the disposable pinned-engine CI overlay. Recording a
 * normal outbound packet must not modify or suppress the original packet.
 * Never publish any other player, plaintext login credentials or full saves.
 */
import type Player from '#/engine/entity/Player.js';
import type ServerGameMessage from '#/network/game/server/ServerGameMessage.js';
import MessageGame from '#/network/game/server/model/MessageGame.js';
import IfSetText from '#/network/game/server/model/IfSetText.js';
import IfOpenChat from '#/network/game/server/model/IfOpenChat.js';

type GameMessage = {type: number; text: string; sender: string; tick: number; fromSelf: boolean};
type Trace = {
    lastObservedTick: number;
    hp: number;
    lastDamageTick: number;
    lastDeathTick: number | null;
    lifeId: number;
    respawnCount: number;
    unknownDamageSource: boolean;
    gameMessages: GameMessage[];
    textOverrides: Map<number, string>;
    sawDialogPage: boolean;
    dialogPageRevision: number;
};
const traceByPlayer = new WeakMap<Player, Trace>();
const allowed = (player: Player): boolean =>
    process.env.RS377_OBSERVER_ENABLED === 'true' &&
    process.env.RS377_OBSERVER_ISOLATED === 'true' &&
    process.env.NODE_PROFILE === 'joshrs_ci_377' &&
    /^Harness[A-Za-z0-9_-]{1,10}$/.test(process.env.RS377_OBSERVER_BOT ?? '') &&
    player.username.toLowerCase() === process.env.RS377_OBSERVER_BOT!.toLowerCase();

function forBot(player: Player): Trace | null {
    if (!allowed(player) || !player.isActive) return null;
    let trace = traceByPlayer.get(player);
    if (!trace) {
        trace = {
            lastObservedTick: -1,
            hp: -1,
            lastDamageTick: -1,
            lastDeathTick: null,
            lifeId: 0,
            respawnCount: 0,
            unknownDamageSource: false,
            gameMessages: [],
            textOverrides: new Map(),
            sawDialogPage: false,
            dialogPageRevision: 0
        };
        traceByPlayer.set(player, trace);
    }
    return trace;
}

/** Called from the actual engine tick loop once for the selected player. */
export function observeSdkTick(player: Player, tick: number): void {
    const t = forBot(player);
    if (!t || !Number.isSafeInteger(tick) || tick <= t.lastObservedTick) return;
    const hp = Number(player.levels[3]); // pinned PlayerStat.HITPOINTS
    if (!Number.isInteger(hp) || hp < 0) return;
    if (t.hp >= 0 && hp < t.hp) {
        t.lastDamageTick = tick;
        // The 377 server's HP change does not identify which entity caused
        // the hit. Never invent SDK CombatEvent.sourceType/sourceIndex.
        t.unknownDamageSource = true;
    }
    if (t.hp > 0 && hp === 0) {
        t.lastDeathTick = tick;
        t.lifeId++;
    } else if (t.hp === 0 && hp > 0) {
        t.lifeId++;
        t.respawnCount++;
    }
    t.hp = hp;
    t.lastObservedTick = tick;
}

/** Called only after Player.write has confirmed the bot's real client exists. */
export function captureSdkOutgoing(player: Player, packet: ServerGameMessage, tick: number): void {
    const t = forBot(player);
    if (!t) return;
    if (packet instanceof MessageGame) {
        // Only real server -> this bot text. Not other players' chats/saves.
        t.gameMessages.push({
            type: 0, text: packet.msg.slice(0, 450), sender: '',
            tick, fromSelf: false
        });
        if (t.gameMessages.length > 32) t.gameMessages.shift();
    } else if (packet instanceof IfOpenChat) {
        t.sawDialogPage = true;
        t.dialogPageRevision++;
    } else if (packet instanceof IfSetText) {
        // Exact server-set text, not a guessed client-visible label.
        t.textOverrides.set(packet.component, packet.text.slice(0, 1024));
        if (player.modalChat !== -1) t.dialogPageRevision++;
        if (t.textOverrides.size > 512) t.textOverrides.clear();
    }
}

/** Detached snapshot. Never hand a mutable trace or client object to HTTP. */
export function readSdkTrace(player: Player, currentTick: number) {
    if (!allowed(player)) return null;
    const t = traceByPlayer.get(player);
    if (!t || t.lastObservedTick < currentTick - 2) return null;
    return {
        lastObservedTick: t.lastObservedTick,
        lastDamageTick: t.lastDamageTick,
        lastDeathTick: t.lastDeathTick,
        lifeId: t.lifeId,
        respawnCount: t.respawnCount,
        combatEvents: t.unknownDamageSource ? null : [],
        gameMessages: t.gameMessages.map(message => ({ ...message })),
        sawDialogPage: t.sawDialogPage,
        dialogPageRevision: t.dialogPageRevision,
        textOverrides: Array.from(t.textOverrides, ([component, text]) => ({component,text}))
    };
}

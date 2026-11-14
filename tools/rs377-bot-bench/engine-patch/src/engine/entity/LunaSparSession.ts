import InvType from '#/cache/config/InvType.js';
import ObjType from '#/cache/config/ObjType.js';
import ParamType from '#/cache/config/ParamType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import { findPath, reachedEntity } from '#/engine/GameMap.js';
import World from '#/engine/World.js';
import type BotPlayer from '#/engine/entity/BotPlayer.js';
import Player from '#/engine/entity/Player.js';
import { PlayerStat } from '#/engine/entity/PlayerStat.js';
import SynthSound from '#/network/game/server/model/SynthSound.js';

export type SparPhase =
    | 'idle'
    | 'requested'
    | 'accepted'
    | 'declined'
    | 'timed_out'
    | 'countdown'
    | 'fighting'
    | 'finished'
    | 'forfeited'
    | 'disconnected';

export interface SparSummary {
    phase: SparPhase;
    challengerName: string | null;
    challengerUid: number;
    startedTick: number;
    challengerDamageDealt: number;
    botDamageDealt: number;
    totalSparsCompleted: number;
    challengerWins: number;
    botWins: number;
    lastOutcome: string | null;
}

/**
 * Server-owned state machine for safe, no-stakes friendly sparring with Luna
 * outside the Duel Arena.
 *
 * State transitions:
 * idle -> requested -> accepted | declined | timed_out -> countdown -> fighting -> finished | forfeited | disconnected -> idle
 *
 * Guarantees:
 * - Never modifies inventories, worn items, or persistent save files directly.
 * - Enforces a strict 1-HP safety floor on every hit so neither participant can die or lose items.
 * - Uses genuine combat stats, equipment attack speeds, animations, and defence rolls.
 * - Cleans up all combat state and restores Hitpoints upon completion, forfeit, or disconnect.
 */
export class LunaSparSession {
    phase: SparPhase = 'idle';
    challengerUid: number = -1;
    challengerSlot: number = -1;
    challengerName: string | null = null;
    private challengerRef: Player | null = null;
    startedTick: number = 0;
    phaseEnteredTick: number = 0;
    countdownRemaining: number = 0;

    challengerNextAttackTick: number = 0;
    botNextAttackTick: number = 0;
    challengerAutoAttack: boolean = false;
    botFoodsRemaining: number = 2;

    challengerDamageDealt: number = 0;
    botDamageDealt: number = 0;
    totalSparsCompleted: number = 0;
    challengerWins: number = 0;
    botWins: number = 0;
    lastOutcome: string | null = null;

    static isInRealDuelArena(playerOrX: Player | number, maybeZ?: number): boolean {
        const x = typeof playerOrX === 'number' ? playerOrX : playerOrX.x;
        const z = typeof playerOrX === 'number' ? (maybeZ ?? 0) : playerOrX.z;
        // Real Al Kharid Duel Arena region bounds (3310..3395, 3200..3285)
        return x >= 3310 && x <= 3395 && z >= 3200 && z <= 3285;
    }

    static isInWilderness(playerOrX: Player | number, maybeZ?: number): boolean {
        const x = typeof playerOrX === 'number' ? playerOrX : playerOrX.x;
        const z = typeof playerOrX === 'number' ? (maybeZ ?? 0) : playerOrX.z;
        return x >= 2944 && x <= 3391 && z >= 3520 && z <= 3967;
    }

    get state(): SparPhase {
        return this.phase;
    }

    isActive(): boolean {
        return (
            this.phase === 'requested' ||
            this.phase === 'accepted' ||
            this.phase === 'countdown' ||
            this.phase === 'fighting'
        );
    }

    clampDamage(target: Player, rawDamage: number): number {
        const currentHp = target.levels[PlayerStat.HITPOINTS];
        return Math.max(0, Math.min(rawDamage, currentHp - 1));
    }

    getSummary(): SparSummary {
        return {
            phase: this.phase,
            challengerName: this.challengerName,
            challengerUid: this.challengerUid,
            startedTick: this.startedTick,
            challengerDamageDealt: this.challengerDamageDealt,
            botDamageDealt: this.botDamageDealt,
            totalSparsCompleted: this.totalSparsCompleted,
            challengerWins: this.challengerWins,
            botWins: this.botWins,
            lastOutcome: this.lastOutcome
        };
    }

    handleChallenge(bot: BotPlayer, challenger: Player, op: number, currentTick: number): boolean {
        return this.handlePlayerClick(challenger, bot, op, currentTick).accepted;
    }

    /**
     * Handle a Challenge (op 1) or friendly Spar attack (op 2) click from a human player.
     */
    handlePlayerClick(
        challenger: Player,
        bot: BotPlayer,
        _op: number,
        currentTick: number
    ): { accepted: boolean; reason: string } {
        if (challenger.uid === bot.uid || challenger.loggingOut || bot.loggingOut) {
            return { accepted: false, reason: 'Invalid spar participant.' };
        }

        if (challenger.level !== bot.level) {
            challenger.messageGame('Luna is on a different floor right now.');
            return { accepted: false, reason: 'Different plane.' };
        }

        if (
            LunaSparSession.isInRealDuelArena(challenger.x, challenger.z) ||
            LunaSparSession.isInRealDuelArena(bot.x, bot.z)
        ) {
            challenger.messageGame('Use the standard Duel Arena challenge inside the Duel Arena.');
            return { accepted: false, reason: 'Inside real Duel Arena.' };
        }

        // If already in an active spar with this challenger, treat op1/op2 as engaging/continuing combat
        if (this.isActive() && this.challengerUid === challenger.uid) {
            if (this.phase === 'fighting') {
                this.challengerAutoAttack = true;
                challenger.faceSquare(bot.x, bot.z);
                if (
                    !reachedEntity(
                        challenger.level,
                        challenger.x,
                        challenger.z,
                        bot.x,
                        bot.z,
                        bot.width,
                        bot.length,
                        challenger.width
                    )
                ) {
                    const path = findPath(challenger.level, challenger.x, challenger.z, bot.x, bot.z);
                    if (path.length > 0) {
                        challenger.queueWaypoints(path);
                    }
                }
                return { accepted: true, reason: 'Spar attack engaged.' };
            }
            challenger.messageGame('The friendly spar with Luna is about to begin!');
            return { accepted: true, reason: 'Spar countdown in progress.' };
        }

        // Reject if Luna is already sparring someone else
        if (this.isActive() && this.challengerUid !== challenger.uid) {
            challenger.messageGame('Luna is already in a friendly spar right now.');
            bot.say('I am already in the middle of a spar!');
            return { accepted: false, reason: 'Already sparring another player.' };
        }

        // Check if Luna or the challenger is currently fighting a monster
        if (bot.isEngagedInMonsterCombat(currentTick)) {
            this.transition('declined', currentTick);
            this.lastOutcome = 'declined_in_monster_combat';
            challenger.messageGame('Luna cannot spar while helping fight a monster.');
            bot.say(`Let's finish off this monster first, ${challenger.displayName}!`);
            this.transition('idle', currentTick);
            return { accepted: false, reason: 'Luna is in monster combat.' };
        }

        const lastCombatVarp = VarPlayerType.getId('lastcombat');
        const aggressiveNpcVarp = VarPlayerType.getId('aggressive_npc');
        if (lastCombatVarp !== -1 && aggressiveNpcVarp !== -1) {
            const lastCombat = Number(challenger.getVar(lastCombatVarp) ?? 0);
            const aggNpc = Number(challenger.getVar(aggressiveNpcVarp) ?? -1);
            if (aggNpc !== -1 && aggNpc !== 0 && lastCombat > 0 && lastCombat + 8 > currentTick) {
                this.transition('declined', currentTick);
                this.lastOutcome = 'declined_challenger_under_attack';
                challenger.messageGame('Finish your current monster fight before starting a friendly spar with Luna.');
                bot.say(`Watch out, ${challenger.displayName}! You are under attack right now!`);
                this.transition('idle', currentTick);
                return { accepted: false, reason: 'Challenger is under NPC attack.' };
            }
        }

        const distance = Math.max(Math.abs(challenger.x - bot.x), Math.abs(challenger.z - bot.z));
        if (distance > 15) {
            this.transition('declined', currentTick);
            this.lastOutcome = 'declined_too_far';
            challenger.messageGame('You are too far away to challenge Luna.');
            this.transition('idle', currentTick);
            return { accepted: false, reason: 'Too far away.' };
        }

        if (bot.levels[PlayerStat.HITPOINTS] < 35) {
            bot.restoreFullCombatHealth();
        }

        const alreadyAdjacent = reachedEntity(
            challenger.level,
            challenger.x,
            challenger.z,
            bot.x,
            bot.z,
            bot.width,
            bot.length,
            challenger.width
        );
        if (!alreadyAdjacent) {
            const path = findPath(challenger.level, challenger.x, challenger.z, bot.x, bot.z);
            if (path.length > 0) {
                challenger.queueWaypoints(path);
            }
        }

        // Start request / countdown phase
        this.challengerUid = challenger.uid;
        this.challengerSlot = challenger.slot;
        this.challengerName = challenger.displayName;
        this.challengerRef = challenger;
        this.startedTick = currentTick;
        this.challengerDamageDealt = 0;
        this.botDamageDealt = 0;
        this.challengerAutoAttack = true;
        this.botFoodsRemaining = 2;

        bot.clearInteraction();
        bot.clearWaypoints();
        bot.faceSquare(challenger.x, challenger.z);
        challenger.faceSquare(bot.x, bot.z);

        if (alreadyAdjacent) {
            this.transition('accepted', currentTick);
            this.countdownRemaining = 3;
            this.transition('countdown', currentTick);
            challenger.messageGame('Luna accepted your friendly spar! (No stakes, safe stop at 1 HP)');
            bot.say(`Challenge accepted, ${challenger.displayName}! 3...`);
            return { accepted: true, reason: 'Challenge accepted and countdown started.' };
        }

        this.transition('requested', currentTick);
        challenger.messageGame(`Sending friendly spar challenge to ${bot.displayName}...`);
        return { accepted: true, reason: 'Challenge requested.' };
    }

    /**
     * Advance the spar state machine each world tick. Returns true if the spar session
     * is currently active and controlling Luna's actions.
     */
    tick(bot: BotPlayer, currentTick: number): boolean {
        if (!this.isActive()) {
            return false;
        }

        const challenger = this.resolveChallenger();
        if (!challenger) {
            this.finishDisconnect(bot, currentTick);
            return false;
        }

        // Check plane and distance bounds
        const distance = Math.max(Math.abs(challenger.x - bot.x), Math.abs(challenger.z - bot.z));
        if (challenger.level !== bot.level || distance > 16) {
            this.forfeit(bot, 'moved out of sparring range', currentTick);
            return false;
        }

        // Timeout guard (max 200 ticks = 2 minutes)
        if (currentTick - this.startedTick > 200) {
            this.transition('timed_out', currentTick);
            this.lastOutcome = 'timed_out';
            challenger.messageGame('Your friendly spar with Luna timed out in a draw!');
            bot.say('Good endurance, Elrothiro! Let us call that a draw.');
            this.cleanupAndRestore(bot, challenger);
            this.transition('idle', currentTick);
            return false;
        }

        if (this.phase === 'requested') {
            if (
                !reachedEntity(
                    bot.level,
                    bot.x,
                    bot.z,
                    challenger.x,
                    challenger.z,
                    challenger.width,
                    challenger.length,
                    bot.width
                )
            ) {
                const path = findPath(bot.level, bot.x, bot.z, challenger.x, challenger.z);
                if (path.length === 0 && currentTick - this.phaseEnteredTick >= 5) {
                    this.transition('declined', currentTick);
                    this.lastOutcome = 'declined_unreachable';
                    challenger.messageGame("Luna couldn't reach you to start the spar.");
                    bot.say("I can't reach you from here, Elrothiro!");
                    this.transition('idle', currentTick);
                    return false;
                }
                if (path.length > 0 && !bot.hasWaypoints()) {
                    bot.queueWaypoints(path);
                }
                return true;
            }

            bot.clearWaypoints();
            challenger.clearWaypoints();
            bot.faceSquare(challenger.x, challenger.z);
            challenger.faceSquare(bot.x, bot.z);

            this.transition('accepted', currentTick);
            this.countdownRemaining = 3;
            this.transition('countdown', currentTick);
            challenger.messageGame('Luna accepted your friendly spar! (No stakes, safe stop at 1 HP)');
            bot.say(`Challenge accepted, ${challenger.displayName}! 3...`);
            return true;
        }

        if (this.phase === 'countdown') {
            bot.faceSquare(challenger.x, challenger.z);
            challenger.faceSquare(bot.x, bot.z);
            const elapsed = currentTick - this.phaseEnteredTick;
            if (elapsed === 1 && this.countdownRemaining === 3) {
                this.countdownRemaining = 2;
                bot.say('2...');
                challenger.messageGame('Friendly spar starting in 2...');
            } else if (elapsed === 2 && this.countdownRemaining === 2) {
                this.countdownRemaining = 1;
                bot.say('1...');
                challenger.messageGame('Friendly spar starting in 1...');
            } else if (elapsed >= 3) {
                this.countdownRemaining = 0;
                this.transition('fighting', currentTick);
                this.challengerNextAttackTick = currentTick;
                this.botNextAttackTick = currentTick + 1;
                bot.say('FIGHT!');
                challenger.messageGame('FIGHT! Click Luna or stay close to trade blows (stops safely at 1 HP).');
            }
            return true;
        }

        if (this.phase === 'fighting') {
            this.processFightingTick(bot, challenger, currentTick);
            return this.isActive();
        }

        return false;
    }

    private processFightingTick(bot: BotPlayer, challenger: Player, currentTick: number): void {
        if (bot.levels[PlayerStat.HITPOINTS] <= 1) {
            this.completeSpar(bot, challenger, challenger.displayName, currentTick);
            return;
        }
        if (challenger.levels[PlayerStat.HITPOINTS] <= 1) {
            this.completeSpar(bot, challenger, bot.displayName, currentTick);
            return;
        }

        const inReach = reachedEntity(
            bot.level,
            bot.x,
            bot.z,
            challenger.x,
            challenger.z,
            challenger.width,
            challenger.length,
            bot.width
        );
        if (!inReach) {
            if (!bot.hasWaypoints()) {
                const path = findPath(bot.level, bot.x, bot.z, challenger.x, challenger.z);
                if (path.length > 0) {
                    bot.queueWaypoints(path);
                }
            }
            return;
        }

        bot.faceSquare(challenger.x, challenger.z);

        // Luna survival reflex during spar: eat a shark up to twice per spar if HP < 40 and > 15
        const botHp = bot.levels[PlayerStat.HITPOINTS];
        if (botHp > 1 && botHp < 40 && this.botFoodsRemaining > 0 && currentTick >= this.botNextAttackTick) {
            this.botFoodsRemaining--;
            const healed = Math.min(20, bot.baseLevels[PlayerStat.HITPOINTS] - botHp);
            bot.levels[PlayerStat.HITPOINTS] = botHp + healed;
            bot.playAnimation(829, 0);
            bot.say('Eating a shark to stay in the spar!');
            this.botNextAttackTick = currentTick + 3;
        }

        // Process challenger's attack on Luna if ready and auto-attacking
        if (this.challengerAutoAttack && currentTick >= this.challengerNextAttackTick) {
            challenger.faceSquare(bot.x, bot.z);
            const speed = this.getWeaponSpeed(challenger);
            const maxHit = this.getEffectiveMaxHit(challenger);
            const accuracy = this.rollHit(challenger, bot);
            const rawDamage = accuracy ? Math.floor(Math.random() * (maxHit + 1)) : 0;
            const safeDamage = this.clampDamage(bot, rawDamage);

            const attackAnim = this.getAttackAnim(challenger);
            const defendAnim = this.getDefendAnim(bot);
            const attackSound = this.getAttackSound(challenger);

            challenger.playAnimation(attackAnim, 0);
            if (attackSound !== -1) {
                challenger.write(new SynthSound(attackSound, 1, 0));
            }
            bot.playAnimation(defendAnim, 20);
            bot.applyDamage(safeDamage, safeDamage > 0 ? 1 : 0);

            this.challengerDamageDealt += safeDamage;
            this.challengerNextAttackTick = currentTick + speed;

            if (bot.levels[PlayerStat.HITPOINTS] <= 1) {
                this.completeSpar(bot, challenger, challenger.displayName, currentTick);
                return;
            }
        }

        // Process Luna's attack on challenger if ready
        if (currentTick >= this.botNextAttackTick && this.phase === 'fighting') {
            const speed = this.getWeaponSpeed(bot);
            const maxHit = this.getEffectiveMaxHit(bot);
            const accuracy = this.rollHit(bot, challenger);
            const rawDamage = accuracy ? Math.floor(Math.random() * (maxHit + 1)) : 0;
            const safeDamage = this.clampDamage(challenger, rawDamage);

            const attackAnim = this.getAttackAnim(bot);
            const defendAnim = this.getDefendAnim(challenger);
            const attackSound = this.getAttackSound(bot);

            bot.playAnimation(attackAnim, 0);
            if (attackSound !== -1) {
                challenger.write(new SynthSound(attackSound, 1, 0));
            }
            challenger.playAnimation(defendAnim, 20);
            challenger.applyDamage(safeDamage, safeDamage > 0 ? 1 : 0);

            this.botDamageDealt += safeDamage;
            this.botNextAttackTick = currentTick + speed;

            if (challenger.levels[PlayerStat.HITPOINTS] <= 1) {
                this.completeSpar(bot, challenger, bot.displayName, currentTick);
                return;
            }
        }
    }

    forfeit(bot: BotPlayer, reason: string, currentTick: number = World.currentTick): void {
        if (!this.isActive()) {
            return;
        }
        const challenger = this.resolveChallenger();
        this.transition('forfeited', currentTick);
        this.lastOutcome = `forfeited: ${reason}`;
        if (challenger) {
            challenger.messageGame(`Friendly spar with Luna ended (${reason}). Hitpoints restored.`);
        }
        bot.say('Spar ended! Restoring our health.');
        this.cleanupAndRestore(bot, challenger);
        this.transition('idle', currentTick);
    }

    private finishDisconnect(bot: BotPlayer, currentTick: number): void {
        this.transition('disconnected', currentTick);
        this.lastOutcome = 'disconnected';
        this.cleanupAndRestore(bot, null);
        this.transition('idle', currentTick);
    }

    private completeSpar(bot: BotPlayer, challenger: Player, winnerName: string, currentTick: number): void {
        this.transition('finished', currentTick);
        this.totalSparsCompleted++;
        const challengerWon = winnerName.toLowerCase() === challenger.displayName.toLowerCase();
        if (challengerWon) {
            this.challengerWins++;
            this.lastOutcome = `victory_${challenger.username}`;
            bot.playAnimation(858, 0); // Bow emote
            challenger.playAnimation(862, 0); // Cheer emote
            bot.say(
                `Well fought, ${challenger.displayName}! You won that spar (${this.challengerDamageDealt} to ${this.botDamageDealt} damage)!`
            );
            challenger.messageGame(
                `You won the friendly spar against Luna! (${this.challengerDamageDealt} vs ${this.botDamageDealt} dmg). Health restored.`
            );
        } else {
            this.botWins++;
            this.lastOutcome = 'victory_luna';
            bot.playAnimation(862, 0); // Cheer emote
            challenger.playAnimation(858, 0); // Bow emote
            bot.say(
                `Good fight, ${challenger.displayName}! I took that round (${this.botDamageDealt} to ${this.challengerDamageDealt} damage). Let me heal us up!`
            );
            challenger.messageGame(
                `Luna won the friendly spar! (${this.botDamageDealt} vs ${this.challengerDamageDealt} dmg). Health restored.`
            );
        }

        this.cleanupAndRestore(bot, challenger);
        bot.recordSparOutcome(!challengerWon, currentTick);
        this.transition('idle', currentTick);
    }

    private cleanupAndRestore(bot: BotPlayer, challenger: Player | null): void {
        bot.clearInteraction();
        bot.clearWaypoints();
        bot.restoreFullCombatHealth();

        if (challenger) {
            challenger.clearInteraction();
            challenger.clearWaypoints();
            challenger.levels[PlayerStat.HITPOINTS] = challenger.baseLevels[PlayerStat.HITPOINTS];
        }

        this.challengerUid = -1;
        this.challengerSlot = -1;
        this.challengerRef = null;
        this.challengerAutoAttack = false;
    }

    private resolveChallenger(): Player | null {
        if (this.challengerUid === -1) {
            return null;
        }
        const fromWorld = World.getPlayerByUid(this.challengerUid);
        const player = fromWorld ?? this.challengerRef;
        if (!player || !player.isActive || player.loggingOut || player.slot !== this.challengerSlot) {
            return null;
        }
        return player;
    }

    private transition(next: SparPhase, currentTick: number): void {
        this.phase = next;
        this.phaseEnteredTick = currentTick;
    }

    private getWeaponSpeed(player: Player): number {
        const worn = player.getInventory(InvType.WORN);
        const weapon = worn?.get(3);
        if (!weapon) {
            return 4;
        }
        const obj = ObjType.get(weapon.id);
        const attackRateParam = ParamType.getId('attackrate');
        if (obj && attackRateParam !== -1 && obj.params?.has(attackRateParam)) {
            const rate = Number(obj.params.get(attackRateParam));
            if (rate >= 2 && rate <= 10) {
                return rate;
            }
        }
        return 4;
    }

    private getEffectiveMaxHit(player: Player): number {
        const maxHitVarp = VarPlayerType.getId('com_maxhit');
        if (maxHitVarp !== -1) {
            const val = Number(player.getVar(maxHitVarp) ?? 0);
            if (val > 1) {
                return val;
            }
        }
        const strLevel = player.levels[PlayerStat.STRENGTH] || 99;
        return Math.max(10, Math.floor(strLevel * 0.35));
    }

    private rollHit(attacker: Player, defender: Player): boolean {
        const slashAtkVarp = VarPlayerType.getId('com_slashattack');
        const slashDefVarp = VarPlayerType.getId('com_slashdef');
        const atkRoll = Math.max(
            1000,
            slashAtkVarp !== -1 && Number(attacker.getVar(slashAtkVarp)) > 0
                ? Number(attacker.getVar(slashAtkVarp))
                : (attacker.levels[PlayerStat.ATTACK] + 8) * (82 + 64)
        );
        const defRoll = Math.max(
            1000,
            slashDefVarp !== -1 && Number(defender.getVar(slashDefVarp)) > 0
                ? Number(defender.getVar(slashDefVarp))
                : (defender.levels[PlayerStat.DEFENCE] + 8) * (90 + 64)
        );
        return Math.floor(Math.random() * (atkRoll + 1)) > Math.floor(Math.random() * (defRoll + 1));
    }

    private getAttackAnim(player: Player): number {
        const animVarp = VarPlayerType.getId('com_attackanim');
        if (animVarp !== -1) {
            const anim = Number(player.getVar(animVarp) ?? -1);
            if (anim > 0) {
                return anim;
            }
        }
        const worn = player.getInventory(InvType.WORN);
        const weapon = worn?.get(3);
        const whipId = ObjType.getByName('abyssal_whip')?.id ?? -1;
        if (weapon && weapon.id === whipId) {
            return 1658;
        }
        return 422;
    }

    private getDefendAnim(player: Player): number {
        const animVarp = VarPlayerType.getId('com_defendanim');
        if (animVarp !== -1) {
            const anim = Number(player.getVar(animVarp) ?? -1);
            if (anim > 0) {
                return anim;
            }
        }
        return 404;
    }

    private getAttackSound(player: Player): number {
        const soundVarp = VarPlayerType.getId('com_attacksound');
        if (soundVarp !== -1) {
            const sound = Number(player.getVar(soundVarp) ?? -1);
            if (sound > 0) {
                return sound;
            }
        }
        return -1;
    }
}

export default LunaSparSession;

import World from '#/engine/World.js';
import InvType from '#/cache/config/InvType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import VarNpcType from '#/cache/config/VarNpcType.js';
import VarPlayerType from '#/cache/config/VarPlayerType.js';
import { CoordGrid } from '#/engine/CoordGrid.js';
import { findPath, findPathToEntity, findPathToLoc, reachedEntity, reachedLoc } from '#/engine/GameMap.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import Loc from '#/engine/entity/Loc.js';
import { LunaBrain, LunaJob, LunaMode, LunaPerception } from '#/engine/entity/LunaBrain.js';
import { LunaSparSession } from '#/engine/entity/LunaSparSession.js';
import { MoveStrategy } from '#/engine/entity/MoveStrategy.js';
import { NetworkPlayer } from '#/engine/entity/NetworkPlayer.js';
import Npc from '#/engine/entity/Npc.js';
import { NpcStat } from '#/engine/entity/NpcStat.js';
import Player, { getExpByLevel, registerBotPlayerClass } from '#/engine/entity/Player.js';
import { PlayerQueueType } from '#/engine/entity/PlayerQueueRequest.js';
import { PlayerStat, PlayerStatNameMap } from '#/engine/entity/PlayerStat.js';
import ScriptProvider from '#/engine/script/ScriptProvider.js';
import ScriptRunner from '#/engine/script/ScriptRunner.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import SetPlayerOp from '#/network/game/server/model/SetPlayerOp.js';
import SynthSound from '#/network/game/server/model/SynthSound.js';

export interface CombatLegalityCheck {
    allowed: boolean;
    reason: 'ok' | 'dead_or_invalid' | 'not_attackable' | 'single_combat_self_busy' | 'single_combat_npc_busy';
}

export const ALL_21_PLAYER_STATS: PlayerStat[] = [
    PlayerStat.ATTACK,
    PlayerStat.DEFENCE,
    PlayerStat.STRENGTH,
    PlayerStat.HITPOINTS,
    PlayerStat.RANGED,
    PlayerStat.PRAYER,
    PlayerStat.MAGIC,
    PlayerStat.COOKING,
    PlayerStat.WOODCUTTING,
    PlayerStat.FLETCHING,
    PlayerStat.FISHING,
    PlayerStat.FIREMAKING,
    PlayerStat.CRAFTING,
    PlayerStat.SMITHING,
    PlayerStat.MINING,
    PlayerStat.HERBLORE,
    PlayerStat.AGILITY,
    PlayerStat.THIEVING,
    PlayerStat.SLAYER,
    PlayerStat.FARMING,
    PlayerStat.RUNECRAFT
];

const MAX_STAT_XP = 2_000_000_000; // 200,000,000.0 XP in tenths

/**
 * A server-owned adventure companion and autonomous bot player.
 * Uses the normal Player entity, collision map, movement validation,
 * RuneScript combat/skilling pipeline, and player-update pipeline, without a network socket.
 */
export default class BotPlayer extends Player {
    readonly isBot = true;

    private readonly route: Array<{ x: number; z: number; message: string }> = [
        { x: 3222, z: 3218, message: 'Checking Lumbridge courtyard for adventure.' },
        { x: 3230, z: 3225, message: 'The River Lum is calm today.' },
        { x: 3215, z: 3230, message: 'Scouting nearby trees and supplies.' },
        { x: 3208, z: 3218, message: 'Heading back toward the castle bank.' }
    ];

    private routeIndex = 0;
    private nextDecisionTick = 0;
    private hasAxe = false;
    private goal: LunaJob = 'woodcut';
    mode: LunaMode = 'assist';
    bankedItems = 0;
    spokenMessages = 0;
    private hasAnnouncedElrothiro = false;
    private readonly fallbackTarget = { x: 2666, z: 3304 };

    readonly sparSession: LunaSparSession = new LunaSparSession();
    readonly brain: LunaBrain;

    private activeCombatNpcNid: number = -1;
    private activeCombatNpcWasDragon: boolean = false;
    private combatApproachTicks: number = 0;
    private lastCombatDistance: number = 999;
    private lastEatTick: number = -10;
    private lastAssistAttackTick: number = -10;
    private lastSingleCombatNoticeTick: number = -50;
    private skillingTicksInJob: number = 0;
    private challengeOpSentToSlot: Map<number, number> = new Map();

    constructor(username: string, username37: bigint, hash64: bigint, saved?: Player, customMemoryPath?: string) {
        super(username, username37, hash64);
        this.brain = new LunaBrain(customMemoryPath);
        this.moveStrategy = MoveStrategy.SMART;
        this.levels.fill(1);
        this.baseLevels.fill(1);
        if (saved) {
            // Keep the real saved tick count: LoginServer rejects autosaves with
            // lower playtime to prevent character rollback. Dropping this value
            // on a Luna respawn used to print "Luna Invalid save file" even
            // when the saved CRC itself was sound.
            this.playtime = saved.playtime;
            this.stats.set(saved.stats);
            this.levels.set(saved.levels);
            this.baseLevels.set(saved.baseLevels);
            this.invs = saved.invs;
            this.vars.set(saved.vars);
            this.body = saved.body.slice();
            this.colors = saved.colors.slice();
            this.gender = saved.gender;
        }
        for (let i = 0; i < this.levels.length; i++) {
            this.levels[i] = 99;
            this.baseLevels[i] = 99;
            this.stats[i] = Math.max(this.stats[i], getExpByLevel(99));
        }
        // Luna uses the revision-377 female identity kits, including a torso.
        this.gender = 1;
        this.body = [48, -1, 56, 61, 67, 70, 79];
        this.applyMaxedLegendLoadout();
        if (saved && (saved.x > 0 || saved.z > 0)) {
            this.teleport(saved.x, saved.z, saved.level);
        } else {
            this.teleport(this.route[0].x, this.route[0].z, 0);
        }
        this.preventLogoutUntil = Number.MAX_SAFE_INTEGER;

        this.ensureCompanionSupplies();
    }

    /**
     * Ensures Luna carries her skilling tools, an Anti-dragon shield for dragon fights,
     * and cooked Sharks for combat survival.
     */
    ensureCompanionSupplies(): void {
        const inventory = this.getInventory(InvType.INV);
        if (!inventory) {
            return;
        }

        const essentialTools = [
            'dragon_axe',
            'rune_axe',
            'bronze_axe',
            'antidragonbreathshield',
            'rune_pickaxe',
            'harpoon',
            'lobster_pot',
            'tinderbox',
            'hammer',
            'chisel',
            'knife'
        ];
        for (const itemName of essentialTools) {
            const obj = ObjType.getByName(itemName);
            if (obj && inventory.getItemIndex(obj.id) === -1 && inventory.freeSlotCount > 6) {
                inventory.add(obj.id, 1);
            }
        }
        this.hasAxe = true;

        this.restockSharks(8);
    }

    restockSharks(targetCount: number = 8): number {
        const inventory = this.getInventory(InvType.INV);
        const shark = ObjType.getByName('shark');
        if (!inventory || !shark) {
            return 0;
        }
        const currentSharks = this.getFoodCount();
        const needed = Math.max(0, Math.min(targetCount - currentSharks, inventory.freeSlotCount));
        if (needed > 0) {
            inventory.add(shark.id, needed);
        }
        return needed;
    }

    getFoodCount(): number {
        const inventory = this.getInventory(InvType.INV);
        const shark = ObjType.getByName('shark');
        if (!inventory || !shark) {
            return 0;
        }
        let count = 0;
        for (let slot = 0; slot < inventory.capacity; slot++) {
            const item = inventory.get(slot);
            if (item && item.id === shark.id) {
                count += item.count;
            }
        }
        return count;
    }

    updateTotalSkillLevel(): number {
        let total = 0;
        for (let i = 0; i < this.baseLevels.length; i++) {
            total += this.baseLevels[i];
        }
        this.skillLevel = total;
        return total;
    }

    applyMaxedLegendLoadout(): void {
        for (let i = 0; i < this.levels.length; i++) {
            this.levels[i] = 99;
            this.baseLevels[i] = 99;
            this.stats[i] = Math.max(this.stats[i], getExpByLevel(99));
        }
        this.updateTotalSkillLevel();

        const worn = this.getInventory(InvType.WORN);
        if (worn) {
            const loadout: Array<[number, string]> = [
                [0, 'dragon_med_helm'],
                [1, 'cape_of_legends'],
                [2, 'enchanted_onyx_amulet'],
                [3, 'abyssal_whip'],
                [4, 'dragon_chainbody'],
                [5, 'dragon_sq_shield'],
                [7, 'dragon_plateskirt'],
                [9, 'hundred_gauntlets_level_10'],
                [10, 'death_climbingboots'],
                [12, 'berzerker_ring']
            ];
            for (const [slot, debugname] of loadout) {
                const item = ObjType.getByName(debugname);
                if (item) {
                    worn.set(slot, { id: item.id, count: 1 });
                }
            }
        }

        // Abyssal whip ready/walk/run animations in Revision #377
        this.readyanim = 808;
        this.turnanim = 823;
        this.walkanim = 1660;
        this.walkanim_b = 820;
        this.walkanim_l = 821;
        this.walkanim_r = 822;
        this.runanim = 1661;

        this.combatLevel = this.getCombatLevel();
        this.syncEquipmentBonuses();
        this.buildAppearance(InvType.WORN);
        this.generateAppearance();
    }

    /**
     * Synchronizes Luna's combat varps (%com_maxhit, %com_slashattack, %com_attackanim,
     * %com_defendanim, and defence bonuses) using the real [queue,update_all] script,
     * with deterministic fallback values if scripts are not yet loaded.
     */
    syncEquipmentBonuses(): void {
        const updateAll = ScriptProvider.getByName('[queue,update_all]');
        if (updateAll) {
            try {
                this.executeScript(ScriptRunner.init(updateAll, this), true);
            } catch {
                this.enqueueScript(updateAll, PlayerQueueType.ENGINE);
            }
        }

        const setVarpSafe = (name: string, value: number) => {
            const id = VarPlayerType.getId(name);
            if (id !== -1) {
                this.setVar(id, value);
            }
        };

        // Apply Abyssal whip + Maxed Legend combat varps and animations AFTER [queue,update_all]
        // so #225->#377 whip category fallback does not overwrite them with unarmed values.
        setVarpSafe('attackstyle', 1);
        setVarpSafe('com_mode', 1);
        setVarpSafe('damagetype', 1); // ^slash_style
        setVarpSafe('damagestyle', 1); // ^style_melee_aggressive
        setVarpSafe('com_attackanim', 1658);
        setVarpSafe('com_defendanim', 1156);
        setVarpSafe('com_maxhit', 27);
        setVarpSafe('com_stabattack', 9460);
        setVarpSafe('com_slashattack', 18260);
        setVarpSafe('com_crushattack', 8140);
        setVarpSafe('com_stabdef', 36190);
        setVarpSafe('com_slashdef', 38280);
        setVarpSafe('com_crushdef', 34760);
        setVarpSafe('com_magicdef', 9020);
        setVarpSafe('com_rangedef', 36740);

        this.readyanim = 808;
        this.turnanim = 823;
        this.walkanim = 1660;
        this.walkanim_b = 820;
        this.walkanim_l = 821;
        this.walkanim_r = 822;
        this.runanim = 1661;
    }

    /**
     * Trains a specific skill, raising its level to 99 if ever below 99, and advancing XP
     * toward the 200M XP cap (2,000,000,000 tenths) with level-up fireworks on milestones.
     */
    trainSkill(stat: PlayerStat, xpUnits: number, currentTick: number = World.currentTick): number {
        const beforeXp = this.stats[stat];
        const beforeBase = this.baseLevels[stat];
        if (beforeBase < 99) {
            const targetLevel = Math.min(99, beforeBase + 1);
            const needed = Math.max(xpUnits, getExpByLevel(targetLevel) - beforeXp);
            this.addXp(stat, needed, false);
        } else if (beforeXp < MAX_STAT_XP) {
            this.addXp(stat, xpUnits, false);
        }

        const gained = Math.max(0, this.stats[stat] - beforeXp);
        this.updateTotalSkillLevel();
        const skillName = PlayerStatNameMap.get(stat) ?? `SKILL_${stat}`;
        this.brain.recordSkillXpGained(skillName, gained, currentTick);

        if (this.baseLevels[stat] > beforeBase) {
            this.spotanim(199, 124, 0);
        }
        return gained;
    }

    /**
     * Picks the skill with the lowest current XP across all 21 skills.
     */
    pickLowestXpSkill(): PlayerStat {
        let lowestStat = ALL_21_PLAYER_STATS[0];
        let lowestXp = this.stats[lowestStat];
        for (const stat of ALL_21_PLAYER_STATS) {
            if (this.baseLevels[stat] < 99) {
                return stat;
            }
            if (this.stats[stat] < lowestXp) {
                lowestXp = this.stats[stat];
                lowestStat = stat;
            }
        }
        return lowestStat;
    }

    /**
     * Trains all 21 skills in an explicit command burst (used by ::luna maxxp / ::luna train).
     */
    trainAllSkillsBurst(rounds: number = 1, currentTick: number = World.currentTick): {
        skillsTrained: number;
        totalXpAdded: number;
    } {
        const safeRounds = Math.max(1, Math.min(rounds, 50));
        let totalXpAdded = 0;
        const trainedSet = new Set<number>();

        for (let r = 0; r < safeRounds; r++) {
            for (const stat of ALL_21_PLAYER_STATS) {
                if (this.baseLevels[stat] < 99) {
                    const to99 = Math.max(10_000, getExpByLevel(99) - this.stats[stat]);
                    totalXpAdded += this.trainSkill(stat, to99, currentTick);
                }
                const gained = this.trainSkill(stat, 25_000, currentTick);
                totalXpAdded += gained;
                trainedSet.add(stat);
            }
        }

        this.spotanim(199, 124, 0);
        this.playAnimation(862, 0);
        this.brain.saveMemory(currentTick, true);
        return {
            skillsTrained: trainedSet.size,
            totalXpAdded
        };
    }

    getTotalXp(): number {
        let sum = 0;
        for (let i = 0; i < this.stats.length; i++) {
            sum += this.stats[i];
        }
        return sum;
    }

    getSkillsSummaryReport(): string {
        const totalLevel = this.updateTotalSkillLevel();
        const totalXpDisplay = Math.floor(this.getTotalXp() / 10).toLocaleString('en-US');
        const lowestStat = this.pickLowestXpSkill();
        const lowestName = PlayerStatNameMap.get(lowestStat) ?? 'SKILL';
        const lowestXpDisplay = Math.floor(this.stats[lowestStat] / 10).toLocaleString('en-US');
        const trainedCount = Object.keys(this.brain.memory.skillXpGained).length;
        return (
            `Luna Skills | Total Level: ${totalLevel}/2079 (All 21 skills Lv 99) | ` +
            `Total XP: ${totalXpDisplay} | Next Focus: ${lowestName} (${lowestXpDisplay} XP) | ` +
            `Skills trained: ${trainedCount}/21`
        );
    }

    /**
     * Equips either 'antidragonbreathshield' (when fighting dragons) or 'dragon_sq_shield'
     * in WORN slot 5 so dragon.rs2 recognizes worn dragonfire protection.
     */
    ensureAppropriateShield(fightingDragon: boolean): boolean {
        const worn = this.getInventory(InvType.WORN);
        const inv = this.getInventory(InvType.INV);
        if (!worn) {
            return false;
        }
        const antiShield = ObjType.getByName('antidragonbreathshield');
        const dragonSq = ObjType.getByName('dragon_sq_shield');
        const desired = fightingDragon ? antiShield : dragonSq;
        if (!desired) {
            return false;
        }

        const currentShield = worn.get(5);
        if (currentShield?.id === desired.id) {
            return true;
        }

        worn.set(5, { id: desired.id, count: 1 });
        if (inv && currentShield && inv.getItemIndex(currentShield.id) === -1 && inv.freeSlotCount > 0) {
            inv.add(currentShield.id, 1);
        }
        this.syncEquipmentBonuses();
        this.buildAppearance(InvType.WORN);
        this.generateAppearance();
        return true;
    }

    hasAntiDragonShieldEquipped(): boolean {
        const worn = this.getInventory(InvType.WORN);
        const antiShield = ObjType.getByName('antidragonbreathshield');
        if (!worn || !antiShield) {
            return false;
        }
        return worn.get(5)?.id === antiShield.id;
    }

    setMode(mode: LunaMode, currentTick: number = World.currentTick): void {
        if (this.sparSession.isActive()) {
            this.sparSession.forfeit(this, 'Luna switched companion mode.');
        }
        this.mode = mode;
        if (mode === 'bank') {
            this.goal = 'bank';
        } else if (mode === 'work') {
            this.goal = 'woodcut';
        } else if (mode === 'assist' || mode === 'defend') {
            this.goal = 'combat_assist';
        } else {
            this.goal = 'idle';
        }
        this.skillingTicksInJob = 0;
        this.combatApproachTicks = 0;
        this.clearInteraction();
        this.clearWaypoints();
        this.activeScript = null;
        this.queue.clear();
        this.engineQueue.clear();
        this.playAnimation(-1, 0);
        this.nextDecisionTick = 0;
        this.brain.recordOwnerCommand(mode, mode, currentTick);

        if (mode === 'assist') {
            this.say('Combat assist active. I will follow you and help in combat.');
        } else if (mode === 'defend') {
            this.say('Guard stance active.');
        } else if (mode === 'follow') {
            this.say('Following you, Elrothiro.');
        } else if (mode === 'stop') {
            this.say('Holding position here.');
        } else if (mode === 'bank') {
            this.say('Heading to the bank.');
        } else {
            this.say('Heading out to train on nearby resources.');
        }
    }

    override say(message: string): void {
        this.spokenMessages++;
        super.say(message);
    }

    get activity() {
        let targetSnap = null;
        if (this.target instanceof Loc) {
            targetSnap = {
                x: this.target.x,
                z: this.target.z,
                type: this.target.type,
                name: LocType.get(this.target.type).name,
                inReach: this.inOperableDistance(this.target),
                active: this.target.isActive
            };
        } else if (this.target instanceof Npc) {
            targetSnap = {
                nid: this.target.nid,
                x: this.target.x,
                z: this.target.z,
                type: this.target.type,
                name: NpcType.get(this.target.type)?.name ?? 'Npc',
                hp: this.target.levels[NpcStat.HITPOINTS],
                inReach: this.inOperableDistance(this.target),
                active: this.target.isActive
            };
        }
        return {
            mode: this.mode,
            goal: this.goal,
            bankedItems: this.bankedItems,
            spokenMessages: this.spokenMessages,
            woodcuttingXp: this.stats[PlayerStat.WOODCUTTING],
            totalLevel: this.updateTotalSkillLevel(),
            totalXp: this.getTotalXp(),
            sparState: this.sparSession.state,
            hp: `${this.levels[PlayerStat.HITPOINTS]}/${this.baseLevels[PlayerStat.HITPOINTS]}`,
            sharks: this.getFoodCount(),
            dragonsAssisted: this.brain.memory.dragonsSlainAssisted,
            target: targetSnap
        };
    }

    getStatusReport(): string {
        let targetDesc = 'none';
        if (this.target instanceof Npc) {
            targetDesc = `${NpcType.get(this.target.type)?.name ?? 'NPC'} (HP ${this.target.levels[NpcStat.HITPOINTS]})`;
        } else if (this.target instanceof Loc) {
            targetDesc = `${LocType.get(this.target.type)?.name ?? 'Loc'}`;
        }
        const totalXpM = (this.getTotalXp() / 10_000_000).toFixed(2);
        return (
            `Luna (Combat ${this.combatLevel}, Total Lv ${this.updateTotalSkillLevel()}, ${totalXpM}M XP) | ` +
            `Mode: ${this.mode} (${this.goal}) | HP: ${this.levels[PlayerStat.HITPOINTS]}/${this.baseLevels[PlayerStat.HITPOINTS]} | ` +
            `Sharks: ${this.getFoodCount()} | Shield: ${this.hasAntiDragonShieldEquipped() ? 'Anti-dragon' : 'Dragon sq'} | ` +
            `Target: ${targetDesc} | Spar: ${this.sparSession.state} | Pos: ${this.x},${this.z},${this.level}`
        );
    }

    handleChallengeFrom(challenger: Player, op: number, currentTick: number): boolean {
        this.brain.recordActionAttempt('duel_spar', currentTick);
        return this.sparSession.handleChallenge(this, challenger, op, currentTick);
    }

    recordSparOutcome(lunaWon: boolean, currentTick: number): void {
        this.brain.recordSparFinished(lunaWon, currentTick);
    }

    restoreFullCombatHealth(): void {
        this.levels[PlayerStat.HITPOINTS] = this.baseLevels[PlayerStat.HITPOINTS];
        this.restockSharks(8);
    }

    isEngagedInMonsterCombat(currentTick: number): boolean {
        if (this.target instanceof Npc && this.target.isValid() && this.target.levels[NpcStat.HITPOINTS] > 0) {
            if (this.targetOp === ServerTriggerType.APNPC2 || this.targetOp === ServerTriggerType.OPNPC2) {
                return true;
            }
        }
        const lastCombatId = VarPlayerType.getId('lastcombat');
        const aggressiveNpcId = VarPlayerType.getId('aggressive_npc');
        if (lastCombatId !== -1 && aggressiveNpcId !== -1) {
            const lastCombat = this.getVar(lastCombatId) as number;
            const aggNpc = this.getVar(aggressiveNpcId) as number;
            if (aggNpc !== -1 && lastCombat + 8 > currentTick) {
                return true;
            }
        }
        return false;
    }

    isDragonNpc(npc: Npc): boolean {
        const npcType = NpcType.get(npc.type);
        const name = (npcType?.name ?? '').toLowerCase();
        const debugname = (npcType?.debugname ?? '').toLowerCase();
        return (
            name.includes('dragon') ||
            debugname.includes('dragon') ||
            name.includes('elvarg') ||
            debugname.includes('elvarg')
        );
    }

    isAttackableNpc(npc: Npc): boolean {
        if (!npc || !npc.isActive || !npc.isValid()) {
            return false;
        }
        if (npc.levels[NpcStat.HITPOINTS] <= 0 || npc.baseLevels[NpcStat.HITPOINTS] <= 0) {
            return false;
        }
        const npcType = NpcType.get(npc.type);
        if (!npcType) {
            return false;
        }
        const op2 = npcType.op?.[1]?.toLowerCase() ?? '';
        return op2 === 'attack' || npcType.vislevel > 0;
    }

    /**
     * Checks single-combat and multi-combat rules matching player_combat.rs2 so Luna
     * never illegally joins a single-combat fight or spams blocked attack attempts.
     */
    canLegallyEngageNpc(npc: Npc, currentTick: number, owner: Player | null = null): CombatLegalityCheck {
        if (!npc || !npc.isActive || !npc.isValid() || npc.levels[NpcStat.HITPOINTS] <= 0) {
            return { allowed: false, reason: 'dead_or_invalid' };
        }
        if (!this.isAttackableNpc(npc)) {
            return { allowed: false, reason: 'not_attackable' };
        }

        const npcInMulti = World.gameMap.isMulti(CoordGrid.packCoord(npc.level, npc.x, npc.z));
        const botInMulti = World.gameMap.isMulti(CoordGrid.packCoord(this.level, this.x, this.z));
        if (npcInMulti && botInMulti) {
            return { allowed: true, reason: 'ok' };
        }

        // Single-way combat checks matching ~player_combat_start in player_combat.rs2
        const lastCombatId = VarPlayerType.getId('lastcombat');
        const aggressiveNpcId = VarPlayerType.getId('aggressive_npc');
        if (lastCombatId !== -1 && aggressiveNpcId !== -1) {
            const lastCombat = Number(this.getVar(lastCombatId) ?? 0);
            const aggressiveNpc = Number(this.getVar(aggressiveNpcId) ?? -1);
            if (lastCombat > 0 && lastCombat + 8 > currentTick && aggressiveNpc !== -1 && aggressiveNpc !== npc.nid) {
                return { allowed: false, reason: 'single_combat_self_busy' };
            }
        }

        const npcLastCombatId = VarNpcType.getId('npc_lastcombat');
        const npcAggressivePlayerId = VarNpcType.getId('npc_aggressive_player');
        if (npcLastCombatId !== -1 && npcAggressivePlayerId !== -1) {
            const npcLastCombat = Number(npc.getVar(npcLastCombatId) ?? 0);
            const npcAggressivePlayer = Number(npc.getVar(npcAggressivePlayerId) ?? -1);
            const isOwnerCoop =
                owner !== null &&
                (this.mode === 'assist' || this.mode === 'defend') &&
                npcAggressivePlayer === owner.uid;
            if (
                !isOwnerCoop &&
                npcLastCombat > 0 &&
                npcLastCombat + 8 > currentTick &&
                npcAggressivePlayer !== -1 &&
                npcAggressivePlayer !== 0 &&
                npcAggressivePlayer !== this.uid
            ) {
                return { allowed: false, reason: 'single_combat_npc_busy' };
            }
        }

        return { allowed: true, reason: 'ok' };
    }

    /**
     * Selects the best legitimate combat target for Luna when assisting or defending Elrothiro.
     * Never selects innocent NPCs or unengaged monsters.
     */
    selectCombatTarget(owner: Player | null, currentTick: number): { npc: Npc | null; blockedBySingleCombat: Npc | null } {
        const candidates: Array<{ npc: Npc; priority: number }> = [];
        const seen = new Set<number>();

        const considerNpc = (npc: Npc | null | undefined, priority: number) => {
            if (!npc || seen.has(npc.nid)) {
                return;
            }
            if (npc.level !== this.level || !this.isAttackableNpc(npc)) {
                return;
            }
            const dist = CoordGrid.distanceToSW(this, npc);
            if (dist > 16) {
                return;
            }
            if (this.brain.isTargetUnreachable(`npc:${npc.nid}`, currentTick)) {
                return;
            }
            seen.add(npc.nid);
            candidates.push({ npc, priority });
        };

        // 1. Elrothiro's explicit combat target (highest priority in 'assist' mode)
        if (owner && owner.level === this.level && this.mode === 'assist') {
            if (
                owner.target instanceof Npc &&
                (owner.targetOp === ServerTriggerType.APNPC2 || owner.targetOp === ServerTriggerType.OPNPC2)
            ) {
                considerNpc(owner.target, 100);
            }
        }

        // 2. Keep Luna's current combat target if she's already fighting it
        if (
            this.target instanceof Npc &&
            (this.targetOp === ServerTriggerType.APNPC2 || this.targetOp === ServerTriggerType.OPNPC2)
        ) {
            considerNpc(this.target, 90);
        }

        // 3. Scan nearby zones for NPCs actively attacking Elrothiro or Luna
        const npcAttackingUidId = VarNpcType.getId('npc_attacking_uid');
        const npcAggressivePlayerId = VarNpcType.getId('npc_aggressive_player');
        const npcLastCombatId = VarNpcType.getId('npc_lastcombat');
        const ownerAggressiveNpcId = VarPlayerType.getId('aggressive_npc');
        const ownerLastCombatId = VarPlayerType.getId('lastcombat');

        const ownerAggNpcNid =
            owner && ownerAggressiveNpcId !== -1 && ownerLastCombatId !== -1 && Number(owner.getVar(ownerLastCombatId) ?? 0) + 10 > currentTick
                ? Number(owner.getVar(ownerAggressiveNpcId) ?? -1)
                : -1;
        const botAggNpcNid =
            ownerAggressiveNpcId !== -1 && ownerLastCombatId !== -1 && Number(this.getVar(ownerLastCombatId) ?? 0) + 10 > currentTick
                ? Number(this.getVar(ownerAggressiveNpcId) ?? -1)
                : -1;

        const centerX = this.x >> 3;
        const centerZ = this.z >> 3;
        for (let zoneX = centerX - 2; zoneX <= centerX + 2; zoneX++) {
            for (let zoneZ = centerZ - 2; zoneZ <= centerZ + 2; zoneZ++) {
                const zone = World.gameMap.getZone(zoneX << 3, zoneZ << 3, this.level);
                for (const npc of zone.getAllNpcsUnsafe()) {
                    if (!npc.isActive || npc.level !== this.level) {
                        continue;
                    }
                    const attackingUid = npcAttackingUidId !== -1 ? Number(npc.getVar(npcAttackingUidId) ?? -1) : -1;
                    const aggressiveUid = npcAggressivePlayerId !== -1 ? Number(npc.getVar(npcAggressivePlayerId) ?? -1) : -1;
                    const lastCombat = npcLastCombatId !== -1 ? Number(npc.getVar(npcLastCombatId) ?? 0) : 0;
                    const recentlyActive = lastCombat === 0 || lastCombat + 12 > currentTick;

                    const attackingOwner =
                        owner !== null &&
                        owner.level === this.level &&
                        (npc.target === owner ||
                            npc.nid === ownerAggNpcNid ||
                            (recentlyActive && (attackingUid === owner.uid || aggressiveUid === owner.uid)));

                    const attackingLuna =
                        npc.target === this ||
                        npc.nid === botAggNpcNid ||
                        (recentlyActive && (attackingUid === this.uid || aggressiveUid === this.uid));

                    if (attackingOwner && (this.mode === 'assist' || this.mode === 'defend')) {
                        considerNpc(npc, 85);
                    } else if (attackingLuna) {
                        considerNpc(npc, 80);
                    }
                }
            }
        }

        candidates.sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            const distA = CoordGrid.distanceToSW(this, a.npc);
            const distB = CoordGrid.distanceToSW(this, b.npc);
            return distA - distB;
        });

        let blockedBySingleCombat: Npc | null = null;
        for (const candidate of candidates) {
            const legality = this.canLegallyEngageNpc(candidate.npc, currentTick, owner);
            if (legality.allowed) {
                return { npc: candidate.npc, blockedBySingleCombat: null };
            }
            if (legality.reason === 'single_combat_npc_busy' && !blockedBySingleCombat) {
                blockedBySingleCombat = candidate.npc;
            }
        }

        return { npc: null, blockedBySingleCombat };
    }

    /**
     * Eats a cooked shark when HP drops below threshold, and triggers a tactical
     * retreat if critically low on HP with no food remaining.
     */
    private checkSurvivalAndEat(currentTick: number, fightingDragonOrBoss: boolean): boolean {
        const hp = this.levels[PlayerStat.HITPOINTS];
        const maxHp = this.baseLevels[PlayerStat.HITPOINTS];
        const eatThreshold = fightingDragonOrBoss ? 70 : 55;

        if (hp <= eatThreshold && currentTick - this.lastEatTick >= 3) {
            const inventory = this.getInventory(InvType.INV);
            const shark = ObjType.getByName('shark');
            if (inventory && shark) {
                const slot = inventory.getItemIndex(shark.id);
                if (slot !== -1) {
                    inventory.remove(shark.id, 1, slot);
                    this.levels[PlayerStat.HITPOINTS] = Math.min(maxHp, hp + 20);
                    this.playAnimation(829, 0);
                    this.write(new SynthSound(2393, 1, 0));
                    this.lastEatTick = currentTick;
                    this.brain.recordSharkEaten(currentTick);
                    // Continue normal combat target engagement on the same tick after eating
                    return false;
                }
            }
        }

        // Critical low-HP retreat when out of food
        if (hp <= 22 && this.getFoodCount() === 0) {
            const line = this.brain.pickContextualLine('retreat_low_hp', currentTick, 120, { owner: 'Elrothiro' });
            if (line) {
                this.say(line);
            }
            this.clearInteraction();
            this.clearWaypoints();
            this.restockSharks(8);
            this.levels[PlayerStat.HITPOINTS] = Math.min(maxHp, hp + 35);
            this.nextDecisionTick = currentTick + 3;
            return true;
        }

        return false;
    }

    /**
     * Broadcasts the 'Challenge' player option (Challenge Luna / set_player_op("Challenge", 1, false))
     * to nearby connected players when outside the Wilderness/Duel Arena so clicking Challenge Luna works everywhere.
     */
    private ensureChallengeOptionForNearbyPlayers(currentTick: number): void {
        if (currentTick % 5 !== 0) {
            return;
        }
        const centerX = this.x >> 3;
        const centerZ = this.z >> 3;
        for (let zoneX = centerX - 2; zoneX <= centerX + 2; zoneX++) {
            for (let zoneZ = centerZ - 2; zoneZ <= centerZ + 2; zoneZ++) {
                const zone = World.gameMap.getZone(zoneX << 3, zoneZ << 3, this.level);
                for (const p of zone.getAllPlayersUnsafe()) {
                    if (p === this || !(p instanceof NetworkPlayer) || !p.isValid()) {
                        continue;
                    }
                    if (LunaSparSession.isInRealDuelArena(p) || LunaSparSession.isInWilderness(p)) {
                        continue;
                    }
                    const prevTick = this.challengeOpSentToSlot.get(p.slot) ?? -999;
                    if (currentTick - prevTick >= 25) {
                        p.write(new SetPlayerOp(1, 'Challenge', 0));
                        this.challengeOpSentToSlot.set(p.slot, currentTick);
                    }
                }
            }
        }
    }

    private buildPerception(currentTick: number, owner: Player | null, targetNpc: Npc | null): LunaPerception {
        const inventory = this.getInventory(InvType.INV);
        const ownerDist = owner && owner.level === this.level ? CoordGrid.distanceToSW(this, owner) : 999;
        const ownerInCombat = Boolean(
            owner &&
                ((owner.target instanceof Npc &&
                    (owner.targetOp === ServerTriggerType.APNPC2 || owner.targetOp === ServerTriggerType.OPNPC2)) ||
                    (VarPlayerType.getId('lastcombat') !== -1 &&
                        Number(owner.getVar(VarPlayerType.getId('lastcombat')) ?? 0) + 8 > currentTick))
        );

        let resourceCount = 0;
        if (inventory) {
            for (let slot = 0; slot < inventory.capacity; slot++) {
                const item = inventory.get(slot);
                if (item) {
                    resourceCount += item.count;
                }
            }
        }

        return {
            tick: currentTick,
            hpCurrent: this.levels[PlayerStat.HITPOINTS],
            hpMax: this.baseLevels[PlayerStat.HITPOINTS],
            foodCount: this.getFoodCount(),
            resourceCount,
            freeInvSlots: inventory?.freeSlotCount ?? 0,
            hasAntiDragonShieldEquipped: this.hasAntiDragonShieldEquipped(),
            hasAntiDragonShieldAvailable: true,
            inMultiCombat: World.gameMap.isMulti(CoordGrid.packCoord(this.level, this.x, this.z)),
            ownerPresent: Boolean(owner && owner.level === this.level && ownerDist <= 20),
            ownerName: owner?.displayName || 'Elrothiro',
            ownerDistance: ownerDist,
            ownerHpCurrent: owner ? owner.levels[PlayerStat.HITPOINTS] : 99,
            ownerHpMax: owner ? owner.baseLevels[PlayerStat.HITPOINTS] : 99,
            ownerInCombat,
            targetNpcName: targetNpc ? NpcType.get(targetNpc.type)?.name ?? 'Npc' : null,
            targetNpcIsDragon: targetNpc ? this.isDragonNpc(targetNpc) : false,
            inSpar: this.sparSession.isActive()
        };
    }

    tickBot(currentTick: number): void {
        if (this.loggingOut) {
            return;
        }

        this.ensureChallengeOptionForNearbyPlayers(currentTick);

        // Priority 2: Friendly Duel / Spar Session takes precedence when active
        if (this.sparSession.isActive()) {
            this.sparSession.tick(this, currentTick);
            return;
        }

        // Check if a previous combat target was just defeated
        if (this.activeCombatNpcNid !== -1) {
            const prevNpc = World.getNpc(this.activeCombatNpcNid);
            if (!prevNpc || !prevNpc.isActive || prevNpc.levels[NpcStat.HITPOINTS] <= 0) {
                this.brain.recordCombatAssist(this.activeCombatNpcWasDragon, currentTick);
                this.trainSkill(PlayerStat.SLAYER, 2500, currentTick);
                this.activeCombatNpcNid = -1;
                if (this.activeCombatNpcWasDragon) {
                    this.ensureAppropriateShield(false);
                    this.activeCombatNpcWasDragon = false;
                }
            }
        }

        if (currentTick < this.nextDecisionTick) {
            return;
        }

        const owner = World.getPlayerByUsername('elrothiro');
        const { npc: combatTarget, blockedBySingleCombat } =
            this.mode === 'assist' || this.mode === 'defend' || this.mode === 'follow'
                ? this.selectCombatTarget(owner ?? null, currentTick)
                : { npc: null, blockedBySingleCombat: null };

        const perception = this.buildPerception(currentTick, owner ?? null, combatTarget);
        this.brain.updatePerception(perception);

        // Survival check (eat shark or emergency resupply)
        if (this.checkSurvivalAndEat(currentTick, perception.targetNpcIsDragon)) {
            return;
        }

        // Stop mode: hold position unless ordered otherwise
        if (this.mode === 'stop') {
            this.clearInteraction();
            this.clearWaypoints();
            this.nextDecisionTick = currentTick + 2;
            return;
        }

        // Priority 1: Combat Assistance (assist / defend, or self-defence while following)
        if (this.mode === 'assist' || this.mode === 'defend' || (this.mode === 'follow' && combatTarget?.target === this)) {
            if (combatTarget) {
                this.engageNpcTarget(combatTarget, owner ?? null, currentTick);
                return;
            }

            if (blockedBySingleCombat && owner && this.level === owner.level) {
                const npcName = NpcType.get(blockedBySingleCombat.type)?.name ?? 'that enemy';
                const line = this.brain.pickContextualLine('single_combat_wait', currentTick, 120, {
                    owner: owner.displayName || 'Elrothiro',
                    target: npcName
                });
                if (line && currentTick - this.lastSingleCombatNoticeTick >= 120) {
                    this.say(line);
                    this.lastSingleCombatNoticeTick = currentTick;
                }
                this.followOwnerClose(owner, currentTick);
                return;
            }
        }

        // Follow owner when in assist, defend, or follow mode with no active combat target
        if (this.mode === 'assist' || this.mode === 'defend' || this.mode === 'follow') {
            if (!this.activeCombatNpcWasDragon && this.hasAntiDragonShieldEquipped()) {
                this.ensureAppropriateShield(false);
            }
            // In 'assist' mode, when near Elrothiro (<= 10 tiles) or when Elrothiro is offline,
            // only perform context-appropriate skilling using REAL nearby world objects (e.g., fishing
            // at an actual Fishing spot on the Catherby shore, or chopping an actual nearby Tree).
            if (this.mode === 'assist') {
                if (!owner) {
                    this.tickContextualEnvironmentSkilling(currentTick, null);
                    return;
                }
                if (this.level === owner.level) {
                    const distToOwner = Math.max(Math.abs(this.x - owner.x), Math.abs(this.z - owner.z));
                    if (distToOwner <= 10) {
                        this.hasAnnouncedElrothiro = true;
                        this.tickContextualEnvironmentSkilling(currentTick, owner);
                        return;
                    }
                }
            }
            this.followOwnerClose(owner ?? null, currentTick);
            return;
        }

        // Priority 3: Dedicated Skilling & Banking ('work' / 'bank') using real world objects
        this.tickAutonomousSkilling(currentTick, perception);
    }

    /**
     * Engages an NPC target using the real server combat trigger (APNPC2), swaps to
     * Anti-dragon shield when fighting dragons, and navigates into melee range.
     */
    private engageNpcTarget(npc: Npc, owner: Player | null, currentTick: number): void {
        this.goal = 'combat_assist';
        const isDragon = this.isDragonNpc(npc);
        this.ensureAppropriateShield(isDragon);

        // Award combat & Slayer XP and perform companion melee swings when in melee reach of the real enemy
        const inReach = reachedEntity(this.level, this.x, this.z, npc.x, npc.z, npc.width, npc.length, this.width);
        if (inReach) {
            this.trainSkill(PlayerStat.ATTACK, 800, currentTick);
            this.trainSkill(PlayerStat.STRENGTH, 800, currentTick);
            this.trainSkill(PlayerStat.DEFENCE, 800, currentTick);
            this.trainSkill(PlayerStat.HITPOINTS, 600, currentTick);
            this.trainSkill(PlayerStat.SLAYER, 600, currentTick);

            if (npc.isActive && npc.levels[NpcStat.HITPOINTS] > 0 && currentTick - this.lastAssistAttackTick >= 4) {
                this.lastAssistAttackTick = currentTick;
                const actionDelayId = VarPlayerType.getId('action_delay');
                if (actionDelayId !== -1) {
                    this.setVar(actionDelayId, currentTick + 4);
                }
                this.faceSquare(npc.x, npc.z);
                this.playAnimation(1658, 0);
                this.write(new SynthSound(2720, 1, 0));

                const currentHp = npc.levels[NpcStat.HITPOINTS];
                const rawHit = 6 + ((currentTick * 7 + npc.nid * 3) % 22);
                const damage = Math.min(currentHp, rawHit);
                if (owner && damage > 0) {
                    npc.heroPoints.addHero(owner.hash64, damage);
                } else if (damage > 0) {
                    npc.heroPoints.addHero(this.hash64, damage);
                }

                const npcType = NpcType.get(npc.type);
                const queue2Script = ScriptProvider.getByTrigger(
                    ServerTriggerType.AI_QUEUE2,
                    npc.type,
                    npcType?.category ?? -1
                );
                if (queue2Script) {
                    npc.enqueueScript(ServerTriggerType.AI_QUEUE2, 0, damage);
                } else {
                    npc.applyDamage(damage, damage > 0 ? 1 : 0);
                }
            }
        }

        const npcName = NpcType.get(npc.type)?.name ?? 'the enemy';
        if (this.activeCombatNpcNid !== npc.nid) {
            this.activeCombatNpcNid = npc.nid;
            this.activeCombatNpcWasDragon = isDragon;
            this.combatApproachTicks = 0;
            this.lastCombatDistance = CoordGrid.distanceToSW(this, npc);
            this.brain.recordActionAttempt('combat_assist', currentTick);

            const line = this.brain.pickContextualLine(
                isDragon ? 'assist_dragon' : 'assist_monster',
                currentTick,
                45,
                {
                    owner: owner?.displayName || 'Elrothiro',
                    target: npcName
                }
            );
            if (line) {
                this.say(line);
            }
        }

        const currentDist = CoordGrid.distanceToSW(this, npc);

        if (this.target !== npc || (this.targetOp !== ServerTriggerType.APNPC2 && this.targetOp !== ServerTriggerType.OPNPC2)) {
            this.setInteraction(Interaction.ENGINE, npc, ServerTriggerType.APNPC2);
            this.pathToTarget();
        } else if (!inReach && !this.hasWaypoints()) {
            const path = findPathToEntity(this.level, this.x, this.z, npc.x, npc.z, this.width, npc.width, npc.length);
            if (path.length > 0) {
                this.queueWaypoints(path);
            } else {
                this.walkTo(npc.x, npc.z, currentTick);
            }
        }

        if (!inReach) {
            if (currentDist >= this.lastCombatDistance) {
                this.combatApproachTicks++;
            } else {
                this.combatApproachTicks = 0;
            }
            this.lastCombatDistance = currentDist;

            // Avoid endless walking if an obstacle blocks the NPC
            if (this.combatApproachTicks > 14) {
                this.brain.markTargetUnreachable(`npc:${npc.nid}`, currentTick, 25);
                this.brain.recordActionOutcome('combat_assist', false, currentTick);
                this.clearInteraction();
                this.clearWaypoints();
                this.activeCombatNpcNid = -1;
                this.combatApproachTicks = 0;
            }
        } else {
            this.combatApproachTicks = 0;
            this.brain.clearTargetUnreachable(`npc:${npc.nid}`);
        }

        this.nextDecisionTick = currentTick + 1;
    }

    private followOwnerClose(target: Player | null, currentTick: number): void {
        const targetX = target?.x ?? this.fallbackTarget.x;
        const targetZ = target?.z ?? this.fallbackTarget.z;
        const distance = Math.max(Math.abs(this.x - targetX), Math.abs(this.z - targetZ));

        if (target && this.level === target.level && distance > 1 && distance <= 14) {
            this.clearInteraction();
            this.walkTo(target.x, target.z, currentTick);
            return;
        }

        if (this.level === (target?.level ?? 0) && distance <= 1) {
            this.clearInteraction();
            this.clearWaypoints();
            if (target && this.x === target.x && this.z === target.z) {
                // Step 1 tile aside so Luna never overlaps invisibly under Elrothiro
                this.walkTo(target.x + 1, target.z, currentTick);
                return;
            }
            this.hasAnnouncedElrothiro = true;
            this.nextDecisionTick = currentTick + 1;
            return;
        }

        if (target) {
            this.clearInteraction();
            this.clearWaypoints();
            this.teleJump(target.x + 1, target.z, target.level);
            console.info(
                `Luna joined ${target.username}: bot=${this.x},${this.z},${this.level}; player=${target.x},${target.z},${target.level}`
            );
            this.hasAnnouncedElrothiro = true;
            this.nextDecisionTick = currentTick + 1;
            return;
        }

        this.clearInteraction();
        this.walkTo(targetX, targetZ, currentTick);
    }

    /**
     * Context-aware companion skilling when near Elrothiro in 'assist' mode:
     * inspects what REAL RuneScape objects actually exist in the immediate area
     * (e.g. a Fishing spot on the Catherby wharf/beach, or a nearby Tree, or a Rock in a mine)
     * and interacts with that real object. Never performs fake air-mining or out-of-context animations!
     */
    private tickContextualEnvironmentSkilling(currentTick: number, owner: Player | null): void {
        if (this.hasWaypoints() || this.target) {
            return;
        }

        const withinOwnerLeash = (entity: { x: number; z: number }) => {
            if (!owner || owner.level !== this.level) {
                return true;
            }
            return Math.max(Math.abs(entity.x - owner.x), Math.abs(entity.z - owner.z)) <= 10;
        };

        // 1. If we are at a fishing dock/beach (like Catherby wharf), fish at an actual Fishing spot NPC!
        const fishSpot = this.findNearbyNpc(/fishing spot/i, 3);
        if (fishSpot && withinOwnerLeash(fishSpot)) {
            this.goal = 'fish_cook';
            this.brain.recordActionAttempt('fish_cook', currentTick);
            if (this.inOperableDistance(fishSpot)) {
                this.faceSquare(fishSpot.x, fishSpot.z);
                this.playAnimation(618, 0); // Harpoon fishing at the real Fishing spot
                this.trainSkill(PlayerStat.FISHING, 4500, currentTick);
                this.brain.recordActionOutcome('fish_cook', true, currentTick);
                this.nextDecisionTick = currentTick + 4;
                return;
            }
            this.setInteraction(Interaction.ENGINE, fishSpot, ServerTriggerType.APNPC1);
            this.pathToTarget();
            this.nextDecisionTick = currentTick + 2;
            return;
        }

        // 2. If there is a real Tree within leash range, walk to the tree and chop it with the real APLOC1 script!
        const tree = this.findNearbyLoc(/^(tree|oak|willow|maple|yew|magic tree|evergreen)$/i, 3);
        if (tree && this.hasAxe && withinOwnerLeash(tree)) {
            this.goal = 'woodcut';
            this.brain.recordActionAttempt('woodcut', currentTick);
            this.setInteraction(Interaction.SCRIPT, tree, ServerTriggerType.APLOC1);
            this.pathToTarget();
            this.trainSkill(PlayerStat.WOODCUTTING, 4500, currentTick);
            this.brain.recordActionOutcome('woodcut', true, currentTick);
            this.nextDecisionTick = currentTick + 3;
            return;
        }

        // 3. If there is a real Rock in a mine within leash range, walk to the rock and mine it!
        const rock = this.findNearbyLoc(/rocks/i, 2);
        if (rock && withinOwnerLeash(rock)) {
            this.goal = 'mine_smith';
            this.brain.recordActionAttempt('mine_smith', currentTick);
            if (this.inOperableDistance(rock)) {
                this.faceSquare(rock.x, rock.z);
                this.playAnimation(624, 0); // Mining at the real rock
                this.trainSkill(PlayerStat.MINING, 4500, currentTick);
                this.brain.recordActionOutcome('mine_smith', true, currentTick);
                this.nextDecisionTick = currentTick + 4;
                return;
            }
            this.setInteraction(Interaction.SCRIPT, rock, ServerTriggerType.APLOC1);
            this.pathToTarget();
            this.nextDecisionTick = currentTick + 2;
            return;
        }

        // 4. Otherwise, if no skilling object is right here, simply follow Elrothiro calmly as a companion
        if (owner) {
            this.followOwnerClose(owner, currentTick);
        } else {
            this.nextDecisionTick = currentTick + 3;
        }
    }

    /**
     * Dedicated autonomous skilling ('work' / 'bank' mode):
     * Finds real world objects in the current region (Fishing spots, Ranges, Trees, Rocks, Anvils, Bank booths),
     * walks to them, and only performs the skilling action when physically at the real object.
     */
    private tickAutonomousSkilling(currentTick: number, _perception: LunaPerception): void {
        const inventory = this.getInventory(InvType.INV);
        if (!inventory) {
            this.nextDecisionTick = currentTick + 5;
            return;
        }

        this.skillingTicksInJob++;
        if (this.mode === 'bank') {
            this.goal = 'bank';
        } else if (this.goal !== 'bank' && inventory.freeSlotCount <= 1) {
            this.goal = 'bank';
            this.skillingTicksInJob = 0;
            this.clearInteraction();
        }

        if (this.hasWaypoints() || this.target) {
            return;
        }

        // 1. Banking at a real Bank booth or Bank chest
        if (this.goal === 'bank') {
            const bank = this.findNearbyLoc(/bank (booth|chest)/i, 10);
            if (!bank) {
                this.depositInventory(currentTick);
                this.restockSharks(8);
                this.goal = 'woodcut';
                if (this.mode === 'bank') {
                    this.mode = 'work';
                }
                this.nextDecisionTick = currentTick + 4;
                return;
            }
            if (this.inOperableDistance(bank)) {
                this.faceSquare(bank.x, bank.z);
                this.depositInventory(currentTick);
                this.restockSharks(8);
                this.goal = 'woodcut';
                if (this.mode === 'bank') {
                    this.mode = 'work';
                }
                this.nextDecisionTick = currentTick + 4;
                return;
            }

            this.queueWaypoints(this.pathToLoc(bank));
            this.nextDecisionTick = currentTick + 1;
            return;
        }

        // 2. Look for real nearby skilling objects in the current region and interact with them authentically:
        // Prefer Trees -> Fishing spots -> Rocks based on what actually exists in the current region
        const tree = this.findNearbyLoc(/^(tree|oak|willow|maple|yew|magic tree|evergreen)$/i, 6);
        const fishSpot = this.findNearbyNpc(/fishing spot/i, 6);
        const rock = this.findNearbyLoc(/rocks/i, 6);

        if (fishSpot && (this.skillingTicksInJob % 2 === 0 || !tree)) {
            this.goal = 'fish_cook';
            this.brain.recordActionAttempt('fish_cook', currentTick);
            if (this.inOperableDistance(fishSpot)) {
                this.faceSquare(fishSpot.x, fishSpot.z);
                this.performAutonomousFishAndCook(currentTick);
                return;
            }
            this.setInteraction(Interaction.ENGINE, fishSpot, ServerTriggerType.APNPC1);
            this.pathToTarget();
            this.nextDecisionTick = currentTick + 2;
            return;
        }

        if (tree && this.hasAxe) {
            this.goal = 'woodcut';
            this.brain.recordActionAttempt('woodcut', currentTick);
            this.setInteraction(Interaction.SCRIPT, tree, ServerTriggerType.APLOC1);
            this.pathToTarget();
            this.playAnimation(-1, 0);
            this.trainSkill(PlayerStat.WOODCUTTING, 4500, currentTick);
            this.brain.recordActionOutcome('woodcut', true, currentTick);
            this.nextDecisionTick = currentTick + 3;
            return;
        }

        if (rock) {
            this.goal = 'mine_smith';
            this.brain.recordActionAttempt('mine_smith', currentTick);
            if (this.inOperableDistance(rock)) {
                this.faceSquare(rock.x, rock.z);
                this.playAnimation(624, 0);
                this.trainSkill(PlayerStat.MINING, 4500, currentTick);
                this.brain.recordActionOutcome('mine_smith', true, currentTick);
                this.nextDecisionTick = currentTick + 4;
                return;
            }
            this.setInteraction(Interaction.SCRIPT, rock, ServerTriggerType.APLOC1);
            this.pathToTarget();
            this.nextDecisionTick = currentTick + 2;
            return;
        }

        // If no skilling object is in range, walk along patrol route
        const destination = this.route[this.routeIndex];
        if (this.x === destination.x && this.z === destination.z) {
            this.routeIndex = (this.routeIndex + 1) % this.route.length;
            this.nextDecisionTick = currentTick + 8;
            return;
        }

        this.walkTo(destination.x, destination.z, currentTick);
    }

    private performAutonomousFishAndCook(currentTick: number): void {
        const inventory = this.getInventory(InvType.INV);
        const shark = ObjType.getByName('shark');
        if (inventory && shark && inventory.freeSlotCount > 1) {
            inventory.add(shark.id, 1);
        }
        this.trainSkill(PlayerStat.FISHING, 4500, currentTick);
        this.playAnimation(618, 0);
        this.brain.recordActionOutcome('fish_cook', true, currentTick);
        this.nextDecisionTick = currentTick + 4;
    }

    private walkTo(x: number, z: number, currentTick: number): void {
        const path = findPath(this.level, this.x, this.z, x, z);

        if (path.length === 0) {
            this.nextDecisionTick = currentTick + 6;
            return;
        }

        this.queueWaypoints(path);
        this.nextDecisionTick = currentTick + 1;
    }

    depositInventory(currentTick: number = World.currentTick): number {
        const inventory = this.getInventory(InvType.INV);
        const bankType = InvType.getId('bank');
        const bank = bankType === -1 ? null : this.getInventory(bankType);
        if (!inventory || !bank) {
            return 0;
        }

        const keptToolIds = new Set(
            [
                'dragon_axe',
                'rune_axe',
                'bronze_axe',
                'antidragonbreathshield',
                'dragon_sq_shield',
                'rune_pickaxe',
                'harpoon',
                'lobster_pot',
                'tinderbox',
                'hammer',
                'chisel',
                'knife',
                'shark'
            ]
                .map(name => ObjType.getByName(name)?.id ?? -1)
                .filter(id => id !== -1)
        );

        let movedTotal = 0;
        for (let slot = 0; slot < inventory.capacity; slot++) {
            const item = inventory.get(slot);
            if (!item || keptToolIds.has(item.id)) {
                continue;
            }

            const moved = bank.add(item.id, item.count);
            if (moved > 0) {
                this.bankedItems += moved;
                movedTotal += moved;
                inventory.set(slot, moved === item.count ? null : { id: item.id, count: item.count - moved });
            }
        }

        if (movedTotal > 0) {
            this.brain.recordItemsBanked(movedTotal, currentTick);
        }
        return movedTotal;
    }

    private pathToLoc(loc: Loc): Uint32Array {
        return findPathToLoc(
            this.level,
            this.x,
            this.z,
            loc.x,
            loc.z,
            this.width,
            loc.width,
            loc.length,
            loc.angle,
            loc.shape,
            LocType.get(loc.type).forceapproach
        );
    }

    private findNearbyNpc(name: RegExp, radius: number): Npc | null {
        const candidates: Npc[] = [];
        const centerX = this.x >> 3;
        const centerZ = this.z >> 3;

        for (let zoneX = centerX - radius; zoneX <= centerX + radius; zoneX++) {
            for (let zoneZ = centerZ - radius; zoneZ <= centerZ + radius; zoneZ++) {
                const zone = World.gameMap.getZone(zoneX << 3, zoneZ << 3, this.level);
                for (const npc of zone.getAllNpcsUnsafe()) {
                    if (!npc.isActive || !npc.isValid() || npc.level !== this.level) {
                        continue;
                    }
                    const type = NpcType.get(npc.type);
                    if (type?.name && name.test(type.name)) {
                        candidates.push(npc);
                    }
                }
            }
        }

        candidates.sort((a, b) => {
            const aDist = Math.abs(a.x - this.x) + Math.abs(a.z - this.z);
            const bDist = Math.abs(b.x - this.x) + Math.abs(b.z - this.z);
            return aDist - bDist;
        });

        return candidates[0] ?? null;
    }

    private findNearbyLoc(name: RegExp, radius: number): Loc | null {
        const locCandidates: Loc[] = [];
        const centerX = this.x >> 3;
        const centerZ = this.z >> 3;

        for (let zoneX = centerX - radius; zoneX <= centerX + radius; zoneX++) {
            for (let zoneZ = centerZ - radius; zoneZ <= centerZ + radius; zoneZ++) {
                const zone = World.gameMap.getZone(zoneX << 3, zoneZ << 3, this.level);
                for (const loc of zone.getAllLocsUnsafe()) {
                    if (!loc.isActive || !loc.isValid(this.hash64) || loc.level !== this.level) {
                        continue;
                    }

                    const type = LocType.get(loc.type);
                    if (type?.name && name.test(type.name)) {
                        locCandidates.push(loc);
                    }
                }
            }
        }

        locCandidates.sort((a, b) => {
            const aDistance = Math.abs(a.x - this.x) + Math.abs(a.z - this.z);
            const bDistance = Math.abs(b.x - this.x) + Math.abs(b.z - this.z);
            return aDistance - bDistance;
        });

        for (const loc of locCandidates) {
            if (this.inOperableDistance(loc)) {
                return loc;
            }
            const path = this.pathToLoc(loc);
            if (path.length === 0) {
                continue;
            }
            const end = CoordGrid.unpackCoord(path[path.length - 1]);
            if (
                reachedLoc(
                    this.level,
                    end.x,
                    end.z,
                    loc.x,
                    loc.z,
                    loc.width,
                    loc.length,
                    this.width,
                    loc.angle,
                    loc.shape,
                    LocType.get(loc.type).forceapproach
                )
            ) {
                return loc;
            }
        }
        return null;
    }
}

registerBotPlayerClass(BotPlayer);

import fs from 'fs';
import path from 'path';

import Environment from '#/util/Environment.js';

export type LunaMode = 'assist' | 'defend' | 'follow' | 'stop' | 'work' | 'bank';

export type LunaJob =
    | 'idle'
    | 'combat_assist'
    | 'duel_spar'
    | 'woodcut'
    | 'fish_cook'
    | 'mine_smith'
    | 'fletch_firemake'
    | 'herblore_farming'
    | 'agility_thieving'
    | 'magic_runecraft_prayer'
    | 'combat_slayer_ranged'
    | 'bank';

export interface UnreachableEntry {
    key: string;
    untilTick: number;
    failures: number;
}

export interface ActionStats {
    attempts: number;
    successes: number;
    failures: number;
    lastTick: number;
}

export interface LunaMemoryData {
    version: number;
    preferredMode: LunaMode;
    lastGoal: LunaJob;
    unreachableTargets: Record<string, UnreachableEntry>;
    actionStats: Record<string, ActionStats>;
    skillXpGained: Record<string, number>;
    dragonsSlainAssisted: number;
    monstersAssisted: number;
    sparsCompleted: number;
    sparsWon: number;
    itemsBanked: number;
    sharksEaten: number;
    totalTrainingActions: number;
    lastOwnerRequest: string;
    updatedAt: string;
}

export interface LunaPerception {
    tick: number;
    hpCurrent: number;
    hpMax: number;
    foodCount: number;
    resourceCount: number;
    freeInvSlots: number;
    hasAntiDragonShieldEquipped: boolean;
    hasAntiDragonShieldAvailable: boolean;
    inMultiCombat: boolean;
    ownerPresent: boolean;
    ownerName: string;
    ownerDistance: number;
    ownerHpCurrent: number;
    ownerHpMax: number;
    ownerInCombat: boolean;
    targetNpcName: string | null;
    targetNpcIsDragon: boolean;
    inSpar: boolean;
}

export const ALL_SKILLING_JOBS: LunaJob[] = [
    'woodcut',
    'fletch_firemake',
    'fish_cook',
    'mine_smith',
    'herblore_farming',
    'agility_thieving',
    'magic_runecraft_prayer',
    'combat_slayer_ranged'
];

const DEFAULT_MEMORY: LunaMemoryData = {
    version: 2,
    preferredMode: 'assist',
    lastGoal: 'idle',
    unreachableTargets: {},
    actionStats: {},
    skillXpGained: {},
    dragonsSlainAssisted: 0,
    monstersAssisted: 0,
    sparsCompleted: 0,
    sparsWon: 0,
    itemsBanked: 0,
    sharksEaten: 0,
    totalTrainingActions: 0,
    lastOwnerRequest: 'assist',
    updatedAt: new Date(0).toISOString()
};

const PERSONALITY_POOLS: Record<string, string[]> = {
    assist_dragon: [
        'Anti-dragon shield locked in! Let us take this dragon down, {owner}!',
        'Watch the dragonfire, {owner}! I have your flank!',
        'Blades up! Focusing fire on {target} with you, {owner}!',
        'Dragon ahead! Shield swapped and engaging {target}!'
    ],
    assist_monster: [
        'Engaging {target}! Right beside you, {owner}!',
        'Focusing on {target} with you, {owner}!',
        'I have your back, {owner}! Striking {target}!',
        'Target acquired: {target}. Let us finish this!'
    ],
    single_combat_wait: [
        '{target} is in single-way combat with you, {owner} - I am holding flank and ready to jump in!',
        'Single-combat rules active on {target}! Standing guard right beside you, {owner}.',
        'I cannot tag {target} while you are trading blows in single-way combat, {owner}, but I am right here!'
    ],
    eat_food: [
        'Grabbing a bite of shark to stay in the fight!',
        'Patching up with a shark - still with you, {owner}!',
        'Eating up so I can keep the pressure on!'
    ],
    retreat_low_hp: [
        'Out of sharks and critically low HP! Stepping back to resupply!',
        'Health critical and no food left - regrouping at the bank briefly, {owner}!'
    ],
    follow_mode: [
        'Right behind you, {owner}! Lead the way.',
        'On your six, {owner} - ready for whatever we run into!',
        'Following close, {owner}!'
    ],
    defend_mode: [
        'Guard stance active! I will strike anything that attacks us, {owner}.',
        'Watching your back, {owner}. Anything that swings at you answers to me!'
    ],
    stop_mode: [
        'Holding position here, {owner}. Call when you need me!',
        'Standing down and keeping watch right here.'
    ],
    work_woodcut: [
        'Chopping logs with my Dragon axe to push Woodcutting XP higher!',
        'Gathering timber and training Woodcutting!'
    ],
    work_fletch_firemake: [
        'Fletching bows and lighting fires to train Fletching and Firemaking!',
        'Carving logs and stoking campfire flames for Fletching and Firemaking XP!'
    ],
    work_fish: [
        'Catching and cooking fresh fish to push Fishing and Cooking XP!',
        'Working the fishing spot and cooking up sharks for our next boss trip!'
    ],
    work_mine: [
        'Mining ore, smelting bars, and cutting gems for Mining, Smithing, and Crafting XP!',
        'Swinging the pickaxe and hammer to train Mining, Smithing, and Crafting!'
    ],
    work_herblore_farming: [
        'Cleaning herbs, mixing potions, and tending crops for Herblore and Farming XP!',
        'Training Herblore and Farming to keep our potion and crop supplies thriving!'
    ],
    work_agility_thieving: [
        'Running footwork drills and lockpick practice for Agility and Thieving XP!',
        'Sharpening my reflexes with Agility and Thieving training!'
    ],
    work_magic_rc_prayer: [
        'Binding runes, casting High Alchemy, and offering bones for Magic, Runecraft, and Prayer XP!',
        'Training Magic, Runecraft, and Prayer to keep all 21 skills climbing!'
    ],
    work_combat_slayer_ranged: [
        'Drilling Attack, Strength, Defence, Hitpoints, Ranged, and Slayer XP!',
        'Training combat stances, Ranged accuracy, and Slayer techniques!'
    ],
    bank_resupply: [
        'Banking resources and restocking fresh sharks for combat!',
        'Deposited our skilling haul and restocked combat food at the bank!'
    ]
};

export class LunaBrain {
    readonly memoryPath: string;
    memory: LunaMemoryData;
    lastPerception: LunaPerception | null = null;
    quietMode: boolean = false;
    private lastGlobalSpokenTick: number = -9999;
    private lastSpokenByCategory: Map<string, number> = new Map();
    private lastLineIndexByCategory: Map<string, number> = new Map();
    private dirty: boolean = false;
    private lastSavedTick: number = -100;

    constructor(customMemoryPath?: string) {
        this.memoryPath =
            customMemoryPath ??
            path.join('data', 'players', Environment.NODE_PROFILE || 'main', 'luna-memory.json');
        this.memory = this.loadMemory();
    }

    private loadMemory(): LunaMemoryData {
        try {
            if (fs.existsSync(this.memoryPath)) {
                const raw = fs.readFileSync(this.memoryPath, 'utf8');
                const parsed = JSON.parse(raw);
                return {
                    ...DEFAULT_MEMORY,
                    ...parsed,
                    unreachableTargets: parsed?.unreachableTargets ?? {},
                    actionStats: parsed?.actionStats ?? {},
                    skillXpGained: parsed?.skillXpGained ?? {}
                };
            }
        } catch {
            // Fall back to clean memory in memory if corrupted or unreadable
        }
        return {
            ...DEFAULT_MEMORY,
            unreachableTargets: {},
            actionStats: {},
            skillXpGained: {}
        };
    }

    saveMemory(currentTick: number, force: boolean = false): void {
        if (!force && (!this.dirty || currentTick - this.lastSavedTick < 25)) {
            return;
        }
        try {
            const dir = path.dirname(this.memoryPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.memory.updatedAt = new Date().toISOString();
            fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2), 'utf8');
            this.dirty = false;
            this.lastSavedTick = currentTick;
        } catch {
            // Ignore transient disk errors during tick loop
        }
    }

    updatePerception(perception: LunaPerception): void {
        this.lastPerception = perception;
        this.pruneExpiredUnreachable(perception.tick);
    }

    recordOwnerCommand(command: string, mode: LunaMode, currentTick: number): void {
        this.memory.lastOwnerRequest = command;
        this.memory.preferredMode = mode;
        this.dirty = true;
        this.saveMemory(currentTick, true);
    }

    recordActionAttempt(actionKey: string, currentTick: number): void {
        const stats = this.memory.actionStats[actionKey] ?? {
            attempts: 0,
            successes: 0,
            failures: 0,
            lastTick: currentTick
        };
        stats.attempts += 1;
        stats.lastTick = currentTick;
        this.memory.actionStats[actionKey] = stats;
        this.dirty = true;
    }

    recordActionOutcome(actionKey: string, succeeded: boolean, currentTick: number): void {
        const stats = this.memory.actionStats[actionKey] ?? {
            attempts: 1,
            successes: 0,
            failures: 0,
            lastTick: currentTick
        };
        if (succeeded) {
            stats.successes += 1;
        } else {
            stats.failures += 1;
        }
        stats.lastTick = currentTick;
        this.memory.actionStats[actionKey] = stats;
        this.dirty = true;
        this.saveMemory(currentTick);
    }

    recordSkillXpGained(skillName: string, xpAdded: number, currentTick: number): void {
        if (xpAdded <= 0) {
            return;
        }
        this.memory.skillXpGained[skillName] = (this.memory.skillXpGained[skillName] ?? 0) + xpAdded;
        this.memory.totalTrainingActions += 1;
        this.dirty = true;
        this.saveMemory(currentTick);
    }

    recordCombatAssist(isDragon: boolean, currentTick: number): void {
        this.memory.monstersAssisted += 1;
        if (isDragon) {
            this.memory.dragonsSlainAssisted += 1;
        }
        this.recordActionOutcome('combat_assist', true, currentTick);
    }

    recordSparFinished(lunaWon: boolean, currentTick: number): void {
        this.memory.sparsCompleted += 1;
        if (lunaWon) {
            this.memory.sparsWon += 1;
        }
        this.recordActionOutcome('duel_spar', true, currentTick);
        this.saveMemory(currentTick, true);
    }

    recordItemsBanked(count: number, currentTick: number): void {
        if (count > 0) {
            this.memory.itemsBanked += count;
            this.recordActionOutcome('bank', true, currentTick);
        }
    }

    recordSharkEaten(currentTick: number): void {
        this.memory.sharksEaten += 1;
        this.dirty = true;
        this.saveMemory(currentTick);
    }

    markTargetUnreachable(key: string, currentTick: number, cooldownTicks: number = 30): void {
        const existing = this.memory.unreachableTargets[key];
        const failures = (existing?.failures ?? 0) + 1;
        this.memory.unreachableTargets[key] = {
            key,
            untilTick: currentTick + cooldownTicks * Math.min(3, failures),
            failures
        };
        this.dirty = true;
    }

    clearTargetUnreachable(key: string): void {
        if (this.memory.unreachableTargets[key]) {
            delete this.memory.unreachableTargets[key];
            this.dirty = true;
        }
    }

    isTargetUnreachable(key: string, currentTick: number): boolean {
        const entry = this.memory.unreachableTargets[key];
        if (!entry) {
            return false;
        }
        if (currentTick >= entry.untilTick) {
            delete this.memory.unreachableTargets[key];
            this.dirty = true;
            return false;
        }
        return true;
    }

    private pruneExpiredUnreachable(currentTick: number): void {
        for (const [key, entry] of Object.entries(this.memory.unreachableTargets)) {
            if (currentTick >= entry.untilTick) {
                delete this.memory.unreachableTargets[key];
                this.dirty = true;
            }
        }
    }

    /**
     * Rotates through all 8 skilling disciplines covering all 21 RuneScape skills,
     * banking whenever inventory is full or combat sharks are low.
     */
    chooseAutonomousSkillingJob(currentJob: LunaJob, ticksInCurrentJob: number, perception: LunaPerception): LunaJob {
        if (perception.freeInvSlots <= 1 || perception.foodCount < 2) {
            return 'bank';
        }

        if (!ALL_SKILLING_JOBS.includes(currentJob)) {
            return 'woodcut';
        }
        // Spend ~12 ticks per skilling discipline so Luna visibly cycles across all 21 skills
        if (ticksInCurrentJob < 12) {
            return currentJob;
        }
        const idx = ALL_SKILLING_JOBS.indexOf(currentJob);
        const nextJob = ALL_SKILLING_JOBS[(idx + 1) % ALL_SKILLING_JOBS.length];
        this.memory.lastGoal = nextJob;
        this.dirty = true;
        return nextJob;
    }

    pickContextualLine(
        category: string,
        currentTick: number,
        cooldownTicks: number = 120,
        context: { owner?: string; target?: string } = {}
    ): string | null {
        if (this.quietMode) {
            return null;
        }
        // Global anti-spam throttle: never speak ambient/skilling lines more than once every 100 ticks (~60 seconds),
        // or combat callouts more than once every 45 ticks (~27 seconds).
        const isCombatCallout = category.startsWith('assist_') || category === 'retreat_low_hp';
        const minGlobalGap = isCombatCallout ? 45 : 120;
        if (currentTick - this.lastGlobalSpokenTick < minGlobalGap) {
            return null;
        }
        const effectiveCooldown = Math.max(cooldownTicks, minGlobalGap);
        const lastTick = this.lastSpokenByCategory.get(category) ?? -9999;
        if (currentTick - lastTick < effectiveCooldown) {
            return null;
        }
        const pool = PERSONALITY_POOLS[category];
        if (!pool || pool.length === 0) {
            return null;
        }
        const prevIdx = this.lastLineIndexByCategory.get(category) ?? -1;
        const nextIdx = (prevIdx + 1) % pool.length;
        this.lastLineIndexByCategory.set(category, nextIdx);
        this.lastSpokenByCategory.set(category, currentTick);
        this.lastGlobalSpokenTick = currentTick;

        const owner = context.owner || 'Elrothiro';
        const target = context.target || 'the enemy';
        return pool[nextIdx]
            .replace(/\{owner\}/g, owner)
            .replace(/\{target\}/g, target);
    }
}

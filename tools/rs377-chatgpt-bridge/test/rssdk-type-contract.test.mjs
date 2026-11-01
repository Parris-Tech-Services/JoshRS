import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { SKILLS377 } from '../src/observation.mjs';
import { toBotWorldState } from '../src/sdk-bridge.mjs';

const PINNED_COMMIT = 'db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const CANDIDATE_SDK_DIRS = [
  process.env.RS_SDK_CHECKOUT_DIR,
  '/home/josh/dev/JoshRS-rssdk-harness/research-checkouts/rs-sdk'
].filter(Boolean);

const CANDIDATE_TSC_BINS = [
  process.env.TSC_BIN,
  '/home/josh/dev/JoshRS/lostcity377/engine/node_modules/.bin/tsc'
].filter(Boolean);

test('toBotWorldState output satisfies pinned MaxBittker/rs-sdk TypeScript contract', () => {
  const sourceSha = 'b5ac859b47915afb545e60e4c1208f25d43cb3fb';
  const raw = {
    world: { mode: 'isolated', revision: 377, tickMs: 600, xpMultiplier: 1, instanceId: 'isolated-test-world', sourceSha },
    player: { username: 'HarnessBot', isBot: true },
    tick: 100,
    position: { x: 3222, z: 3218, plane: 0 },
    skills: SKILLS377.map(name => ({
      name,
      level: name === 'Hitpoints' ? 10 : 1,
      baseLevel: name === 'Hitpoints' ? 10 : 1,
      xpTenths: name === 'Hitpoints' ? 11540 : 0
    })),
    inventory: [{ slot: 0, id: 1925, count: 1, name: 'Bucket', optionsWithIndex: [{ text: 'Use', opIndex: 1 }] }],
    equipment: [],
    nearbyNpcs: [{
      kind: 'npc', index: 12, id: 7, x: 3223, z: 3218, name: 'Cook',
      combatLevel: 1, distance: 1, hp: null, maxHp: null, healthPercent: null,
      targetIndex: -1, inCombat: false, lastCombatTick: null, animId: -1, spotanimId: -1,
      optionsWithIndex: [{ text: 'Talk-to', opIndex: 1 }], options: ['Talk-to']
    }],
    nearbyLocs: [{
      id: 10, x: 3221, z: 3217, level: 0, name: 'Tree', distance: 1,
      optionsWithIndex: [{ text: 'Chop', opIndex: 1 }], options: ['Chop']
    }],
    groundItems: [{ id: 1925, x: 3220, z: 3218, name: 'Bucket', count: 1, distance: 2 }],
    dialogue: {
      isOpen: true,
      pageId: 'dlg-4882-1-1-1',
      isWaiting: true,
      options: [{ index: 0, text: 'Click here to continue', componentId: 4882 }]
    },
    questStages: { cooks_assistant: 0 },
    sdkDetails: {
      player: {
        name: 'HarnessBot', combatLevel: 3, hp: 10, maxHp: 10, x: 3222, z: 3218,
        worldX: 3222, worldZ: 3218, level: 0, runEnergy: 100, runWeight: 0, animId: -1,
        spotanimId: -1, combat: { inCombat: false, targetIndex: -1, targetType: 'none', lastDamageTick: -1 },
        isDead: false, lifeId: 1, respawnCount: 0, lastDeathTick: null
      },
      nearbyPlayers: [{ kind: 'player', index: 2, name: 'HarnessPeer', combatLevel: 3, x: 3223, z: 3219, distance: 1 }],
      gameMessages: [{ type: 0, text: 'Welcome to RuneScape.', sender: '', tick: 100, fromSelf: false }],
      recentDialogs: [{ text: ['Greetings!'], tick: 100, interfaceId: 4882 }],
      interface: { isOpen: false, interfaceId: -1, options: [] },
      shop: { isOpen: false, title: '', shopItems: [], playerItems: [] },
      bank: { isOpen: false, items: [], noteMode: false },
      modalOpen: true,
      modalInterface: 4882,
      combatEvents: [],
      prayers: { activePrayers: Array(15).fill(false), prayerPoints: 1, prayerLevel: 1 }
    }
  };

  const converted = toBotWorldState(raw, { botName: 'HarnessBot', expectedWorld: 'isolated-test-world' });
  assert.equal(converted.source.contract, `MaxBittker/rs-sdk@${PINNED_COMMIT}`);

  const sdkDir = CANDIDATE_SDK_DIRS.find(d => fs.existsSync(path.join(d, 'sdk/types.ts')));
  const tscBin = CANDIDATE_TSC_BINS.find(b => fs.existsSync(b));
  if (!sdkDir || !tscBin) {
    return;
  }

  const headSha = execFileSync('git', ['-C', sdkDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(headSha, PINNED_COMMIT, 'Pinned rs-sdk checkout commit mismatch');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-rssdk-typecheck-'));
  try {
    const checkFile = path.join(tmpDir, 'verify-contract.ts');
    const typesImport = path.join(sdkDir, 'sdk/types.ts');
    const gwTypesImport = path.join(sdkDir, 'server/gateway/types.ts');
    const tsSource = [
      `import type { BotWorldState, BotAction, ActionResult } from ${JSON.stringify(typesImport)};`,
      `import type { SDKMessage, SyncToSDKMessage } from ${JSON.stringify(gwTypesImport)};`,
      `export const verifiedState: BotWorldState = ${JSON.stringify(converted.state, null, 2)};`,
      `export const verifiedActions: BotAction[] = [`,
      `  { type: 'none', reason: 'noop' },`,
      `  { type: 'wait', ticks: 2, reason: 'wait' },`,
      `  { type: 'walkTo', x: 3222, z: 3218, running: false, reason: 'walk' },`,
      `  { type: 'talkToNpc', npcIndex: 12, reason: 'talk' },`,
      `  { type: 'interactNpc', npcIndex: 12, optionIndex: 1, reason: 'interact' },`,
      `  { type: 'interactLoc', x: 3221, z: 3217, locId: 10, optionIndex: 1, reason: 'chop' },`,
      `  { type: 'pickupItem', x: 3220, z: 3218, itemId: 1925, reason: 'pickup' },`,
      `  { type: 'interactGroundItem', x: 3220, z: 3218, itemId: 1925, optionIndex: 1, reason: 'take' },`,
      `  { type: 'useInventoryItem', slot: 0, optionIndex: 1, interfaceId: 3214, reason: 'use' },`,
      `  { type: 'dropItem', slot: 0, reason: 'drop' },`,
      `  { type: 'useItemOnLoc', itemSlot: 0, x: 3221, z: 3217, locId: 10, reason: 'use on loc' },`,
      `  { type: 'clickDialogOption', optionIndex: 0, guard: { pageId: 'dlg-4882-1-1-1', componentId: 4882 }, reason: 'continue' }`,
      `];`,
      `export const verifiedResult: ActionResult = { success: true, message: 'ok', phase: 'completion' };`,
      `export const verifiedSdkMsg: SDKMessage = { type: 'sdk_action', username: 'HarnessBot', actionId: 'a-1', action: verifiedActions[2] };`,
      `export const verifiedGwMsg: SyncToSDKMessage = { type: 'sdk_action_result', actionId: 'a-1', result: verifiedResult };`
    ].join('\n');
    fs.writeFileSync(checkFile, tsSource, 'utf8');
    execFileSync(tscBin, ['--noEmit', '--strict', '--allowImportingTsExtensions', '--target', 'ES2022', '--moduleResolution', 'bundler', '--module', 'ESNext', checkFile], {
      stdio: 'pipe'
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

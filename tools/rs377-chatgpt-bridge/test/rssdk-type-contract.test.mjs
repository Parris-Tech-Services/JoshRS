import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {SKILLS377,validateObservation} from '../src/observation.mjs';
import {toBotWorldState,mapSdkAction} from '../src/sdk-bridge.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bridgeRoot = path.resolve(__dirname, '..');
const sdkTypesPath = path.join(bridgeRoot, 'vendor', 'rs-sdk', 'sdk', 'types.ts');
const geTypesPath = path.join(bridgeRoot, 'vendor', 'rs-sdk', 'sdk', 'ge-types.d.ts');
const gatewayTypesPath = path.join(bridgeRoot, 'vendor', 'rs-sdk', 'server', 'gateway', 'types.ts');
const tscBin = path.join(bridgeRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const PINNED_SDK_TYPES_BLOB_SHA = 'ec59cef4f878c908481f68bd42cf698b68cdf579';
const PINNED_GE_TYPES_BLOB_SHA = '9c34ef56f77f743a7af17f19a860d9c993a11c07';
const PINNED_GATEWAY_TYPES_BLOB_SHA = 'fa14a509e8962db573857152e5e2a60795002145';

function gitBlobSha1(filePath) {
  const buf = fs.readFileSync(filePath);
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(buf).digest('hex');
}

function buildCompleteObservation() {
  return validateObservation({
    world: {
      mode: 'isolated',
      revision: 377,
      tickMs: 600,
      xpMultiplier: 1,
      instanceId: 'isolated-tsc-contract',
      sourceSha: 'b5ac859b47915afb545e60e4c1208f25d43cb3fb'
    },
    player: { username: 'HarnessBot', isBot: true },
    tick: 42,
    position: { x: 3222, z: 3218, plane: 0 },
    skills: SKILLS377.map(name => ({
      name,
      level: name === 'Hitpoints' ? 10 : 1,
      baseLevel: name === 'Hitpoints' ? 10 : 1,
      xpTenths: name === 'Hitpoints' ? 11540 : 0
    })),
    inventory: [{ slot: 0, id: 1925, name: 'Bucket', count: 1, optionsWithIndex: [{ text: 'Use', opIndex: 1 }] }],
    equipment: [],
    nearbyNpcs: [{
      kind: 'npc',
      id: 0,
      index: 1,
      name: 'Hans',
      combatLevel: 0,
      x: 3221,
      z: 3218,
      distance: 1,
      hp: null,
      maxHp: null,
      healthPercent: null,
      targetIndex: -1,
      inCombat: false,
      lastCombatTick: null,
      animId: -1,
      spotanimId: -1,
      optionsWithIndex: [{ text: 'Talk-to', opIndex: 1 }],
      options: ['Talk-to']
    }],
    nearbyLocs: [{
      id: 1276,
      name: 'Tree',
      x: 3220,
      z: 3218,
      level: 0,
      distance: 2,
      optionsWithIndex: [{ text: 'Chop down', opIndex: 1 }],
      options: ['Chop down']
    }],
    groundItems: [{
      id: 1925,
      name: 'Bucket',
      count: 1,
      x: 3222,
      z: 3219,
      distance: 1,
      optionsWithIndex: [{ text: 'Take', opIndex: 3 }]
    }],
    dialogue: {
      isOpen: true,
      pageId: 'dlg-4882-1-10-100',
      options: [{ index: 0, text: 'Click here to continue', componentId: 4886 }],
      pendingComponentIds: [4886],
      optionTextAvailable: true,
      isWaiting: true
    },
    questStages: { cooks_assistant: 0 },
    sdkDetails: {
      player: {
        name: 'HarnessBot',
        combatLevel: 3,
        hp: 10,
        maxHp: 10,
        x: 3222,
        z: 3218,
        worldX: 3222,
        worldZ: 3218,
        level: 0,
        runEnergy: 100,
        runWeight: 0,
        animId: -1,
        spotanimId: -1,
        combat: { inCombat: false, targetIndex: -1, targetType: 'none', lastDamageTick: -1 },
        isDead: false,
        lifeId: 1,
        respawnCount: 0,
        lastDeathTick: null
      },
      nearbyPlayers: [],
      gameMessages: [],
      recentDialogs: [],
      interface: { isOpen: false, interfaceId: -1, options: [] },
      shop: { isOpen: false, title: '', shopItems: [], playerItems: [] },
      bank: { isOpen: false, items: [], noteMode: false },
      modalOpen: true,
      modalInterface: 4882,
      combatEvents: [],
      prayers: { activePrayers: Array(15).fill(false), prayerPoints: 1, prayerLevel: 1 }
    }
  }, { botName: 'HarnessBot', expectedWorld: 'isolated-tsc-contract' });
}

test('mandatory pinned MaxBittker/rs-sdk@db0cc51e Git blob SHA and tsc --noEmit contract check', () => {
  assert.equal(fs.existsSync(sdkTypesPath), true, 'Missing vendored sdk/types.ts');
  assert.equal(fs.existsSync(geTypesPath), true, 'Missing vendored sdk/ge-types.d.ts');
  assert.equal(fs.existsSync(gatewayTypesPath), true, 'Missing vendored server/gateway/types.ts');
  assert.equal(fs.existsSync(tscBin), true, 'Missing local TypeScript compiler binary');

  assert.equal(
    gitBlobSha1(sdkTypesPath),
    PINNED_SDK_TYPES_BLOB_SHA,
    'sdk/types.ts does not match pinned MaxBittker/rs-sdk@db0cc51e blob SHA'
  );
  assert.equal(
    gitBlobSha1(geTypesPath),
    PINNED_GE_TYPES_BLOB_SHA,
    'sdk/ge-types.d.ts does not match pinned MaxBittker/rs-sdk@db0cc51e blob SHA'
  );
  assert.equal(
    gitBlobSha1(gatewayTypesPath),
    PINNED_GATEWAY_TYPES_BLOB_SHA,
    'server/gateway/types.ts does not match pinned MaxBittker/rs-sdk@db0cc51e blob SHA'
  );

  const obs = buildCompleteObservation();
  const converted = toBotWorldState(obs, { botName: 'HarnessBot', expectedWorld: 'isolated-tsc-contract' });

  const actions = [
    { type: 'none', reason: 'Idle' },
    { type: 'wait', ticks: 2, reason: 'Wait two ticks' },
    { type: 'walkTo', x: 3223, z: 3218, running: false, reason: 'Walk east' },
    { type: 'talkToNpc', npcIndex: 1, reason: 'Talk to Hans' },
    { type: 'interactNpc', npcIndex: 1, optionIndex: 1, reason: 'Interact Hans' },
    { type: 'interactLoc', x: 3220, z: 3218, locId: 1276, optionIndex: 1, reason: 'Chop tree' },
    { type: 'pickupItem', x: 3222, z: 3219, itemId: 1925, reason: 'Take bucket' },
    { type: 'interactGroundItem', x: 3222, z: 3219, itemId: 1925, optionIndex: 3, reason: 'Take bucket' },
    { type: 'useInventoryItem', slot: 0, optionIndex: 1, interfaceId: 3214, reason: 'Use bucket' },
    { type: 'dropItem', slot: 0, reason: 'Drop bucket' },
    { type: 'useItemOnLoc', itemSlot: 0, x: 3220, z: 3218, locId: 1276, reason: 'Use bucket on tree' },
    {
      type: 'clickDialogOption',
      optionIndex: 0,
      guard: { pageId: 'dlg-4882-1-10-100', componentId: 4886 },
      reason: 'Continue dialogue'
    }
  ];

  for (const act of actions) {
    const mapped = mapSdkAction(act, obs);
    assert.ok(mapped.kind === 'packet' || mapped.kind === 'no_action' || mapped.kind === 'wait');
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-rssdk-tsc-'));
  try {
    const checkTsPath = path.join(tmpDir, 'contract-check.ts');
    const code = `
import type { BotWorldState, BotAction, ActionResult } from ${JSON.stringify(sdkTypesPath)};
import type { SDKMessage, SyncToSDKMessage } from ${JSON.stringify(gatewayTypesPath)};

export const verifiedWorldState: BotWorldState = ${JSON.stringify(converted.state, null, 2)};
export const verifiedActions: BotAction[] = ${JSON.stringify(actions, null, 2)};
export const verifiedActionResult: ActionResult = {
  success: true,
  message: 'Verified destination reached',
  phase: 'completion',
  data: { startTick: 42, endTick: 45, verifiedEffect: true }
};
export const connectMsg: SDKMessage = {
  type: 'sdk_action',
  username: 'HarnessBot',
  actionId: 'act-1',
  action: verifiedActions[2]
};
export const resultMsg: SyncToSDKMessage = {
  type: 'sdk_action_result',
  actionId: 'act-1',
  result: verifiedActionResult
};
`;
    fs.writeFileSync(checkTsPath, code, 'utf8');
    execFileSync(
      process.execPath,
      [tscBin, '--noEmit', '--strict', '--allowImportingTsExtensions', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', checkTsPath],
      { stdio: 'pipe' }
    );

    // Negative test: verify tsc rejects an invalid BotWorldState or BotAction
    const negativeTsPath = path.join(tmpDir, 'negative-check.ts');
    fs.writeFileSync(
      negativeTsPath,
      `
import type { BotWorldState, BotAction } from ${JSON.stringify(sdkTypesPath)};
export const brokenAction: BotAction = { type: 'teleport', x: 3200, z: 3200, reason: 'invalid' };
export const brokenState: BotWorldState = { tick: 'not-a-number' };
`,
      'utf8'
    );
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [tscBin, '--noEmit', '--strict', '--allowImportingTsExtensions', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', negativeTsPath],
          { stdio: 'pipe' }
        ),
      'Expected tsc --noEmit to fail on invalid BotWorldState / BotAction'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

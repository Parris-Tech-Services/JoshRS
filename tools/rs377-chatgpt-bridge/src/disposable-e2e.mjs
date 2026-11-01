#!/usr/bin/env node
/**
 * Reproducible End-to-End Disposable Revision-377 Acceptance & Security Harness
 * (Tasks 24 & 25).
 *
 * - Prepares or uses an isolated disposable 377 server in /tmp (or CI runner temp),
 *   NEVER touching /home/josh/dev/JoshRS/lostcity377 or any family world/saves.
 * - Boots the real compiled Lost City revision-377 engine on isolated ports.
 * - Authenticates disposable HarnessBot over native 377 TCP (RSA + CRC + ISAAC).
 * - Verifies Task 24 server-backed read-only observations (all 21 skills + XP,
 *   position/plane, inventory, equipment, nearby NPCs/locs/groundItems/players,
 *   dialogue, interfaces, questStages, and cross-player isolation).
 * - Verifies Task 25 RS-SDK mapping adapter, runtime effect verification, and
 *   authenticated WebSocket/HTTP gateway end-to-end (walkTo, talkToNpc,
 *   clickDialogOption, useInventoryItem, interactLoc, dropItem,pickupItem,
 *   plus negative security & replay tests).
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Session377 } from './session.mjs';
import { createEngine377Observer } from './engine-observer.mjs';
import { createNative377Observer } from './native-observer.mjs';
import { SKILLS377, validateObservation } from './observation.mjs';
import { mapSdkAction, toBotWorldState } from './sdk-bridge.mjs';
import { createSdk377Runtime } from './sdk-runtime.mjs';
import { createSdk377Gateway } from './sdk-gateway.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

const PINNED_ENGINE_SHA = 'b5ac859b47915afb545e60e4c1208f25d43cb3fb';
const PINNED_CONTENT_SHA = '44eab09081ef0f6c5f3eaabd1897a588ad7d9e50';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isPortListening(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const sock = net.createConnection({ port, host });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, 600);
    sock.once('connect', () => {
      clearTimeout(timer);
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function extractArchive(gitDir, commitSha, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync(
    'bash',
    ['-c', `git -C "$1" archive "$2" | tar -x -C "$3"`, '--', gitDir, commitSha, destDir],
    { stdio: 'pipe' }
  );
}

export function prepareDisposableWorkspace({
  workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-377-disposable-')),
  localEngineGit = '/home/josh/dev/JoshRS/lostcity377/engine',
  localContentGit = '/home/josh/dev/JoshRS/lostcity377/content'
} = {}) {
  const engineDir = path.join(workRoot, 'engine');
  const contentDir = path.join(workRoot, 'content');

  extractArchive(localEngineGit, PINNED_ENGINE_SHA, engineDir);
  extractArchive(localContentGit, PINNED_CONTENT_SHA, contentDir);

  // Symlink read-only node_modules from local engine checkout if available
  const existingNodeModules = path.join(localEngineGit, 'node_modules');
  const targetNodeModules = path.join(engineDir, 'node_modules');
  if (fs.existsSync(existingNodeModules) && !fs.existsSync(targetNodeModules)) {
    fs.symlinkSync(existingNodeModules, targetNodeModules, 'dir');
  }

  // Apply Haunted Manor cross-zone bookcase fix and overlay web.ts
  execFileSync('python3', [path.join(REPO_ROOT, 'content-factory/patch_377_haunted.py'), '--content', contentDir, '--apply'], {
    stdio: 'pipe'
  });
  fs.copyFileSync(
    path.join(REPO_ROOT, 'tools/rs377-bot-bench/engine-patch/src/web.ts'),
    path.join(engineDir, 'src/web.ts')
  );

  // Generate fresh disposable RSA keypair for the isolated world
  const rsaDir = path.join(engineDir, 'data/config');
  fs.mkdirSync(rsaDir, { recursive: true });
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });
  fs.writeFileSync(path.join(rsaDir, 'public.pem'), publicKey, 'utf8');
  fs.writeFileSync(path.join(rsaDir, 'private.pem'), privateKey, 'utf8');

  // Compile RuneScript pack and migrate fresh disposable SQLite database
  const buildEnv = {
    ...process.env,
    BUILD_SRC_DIR: '../content',
    BUILD_VERIFY: 'true',
    BUILD_VERIFY_PACK: 'true'
  };
  execFileSync('npm', ['run', 'build'], { cwd: engineDir, env: buildEnv, stdio: 'pipe' });
  execFileSync('npm', ['run', 'sqlite:migrate'], { cwd: engineDir, env: buildEnv, stdio: 'pipe' });

  return { workRoot, engineDir, contentDir };
}

export function ensureDisposableRsaKeys(engineDir) {
  const rsaDir = path.join(engineDir, 'data/config');
  const pubPath = path.join(rsaDir, 'public.pem');
  const privPath = path.join(rsaDir, 'private.pem');
  if (!fs.existsSync(pubPath) || !fs.existsSync(privPath)) {
    fs.mkdirSync(rsaDir, { recursive: true });
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });
    fs.writeFileSync(pubPath, publicKey, 'utf8');
    fs.writeFileSync(privPath, privateKey, 'utf8');
  }
  return {
    publicKeyPem: fs.readFileSync(pubPath, 'utf8')
  };
}

export async function runDisposableE2E({
  engineDir: suppliedEngineDir = process.env.RS377_DISPOSABLE_ENGINE_DIR || null,
  gamePort = 15402,
  webPort = 18880,
  mgmtPort = 18881,
  gatewayPort = 19380,
  loginPort = 14350,
  friendPort = 14509,
  loggerPort = 14351,
  keepWorkspace = false
} = {}) {
  const forbiddenPorts = [52402, 8888, 8898, 45099, 43500, 43501];
  for (const p of [gamePort, webPort, mgmtPort, gatewayPort, loginPort, friendPort, loggerPort]) {
    if (forbiddenPorts.includes(p)) {
      throw new Error(`Refusing to use protected family port ${p}`);
    }
    if (await isPortListening(p)) {
      throw new Error(`Disposable test port ${p} is already in use; refusing ambiguous run`);
    }
  }

  // Record family save checksum before test if present
  const familySavePath = '/home/josh/dev/JoshRS/lostcity377/engine/data/players/main/elrothiro.sav';
  const familySaveBefore = fs.existsSync(familySavePath)
    ? fs.statSync(familySavePath).mtimeMs
    : null;

  let createdWorkspace = null;
  const engineDir = suppliedEngineDir
    ? path.resolve(suppliedEngineDir)
    : (() => {
        createdWorkspace = prepareDisposableWorkspace();
        return createdWorkspace.engineDir;
      })();

  // Always ensure the latest engine-patch/src/web.ts is applied to the disposable engine
  fs.copyFileSync(
    path.join(REPO_ROOT, 'tools/rs377-bot-bench/engine-patch/src/web.ts'),
    path.join(engineDir, 'src/web.ts')
  );
  const { publicKeyPem } = ensureDisposableRsaKeys(engineDir);

  const observerToken = randomBytes(32).toString('hex');
  const gatewayToken = randomBytes(32).toString('hex');
  const botPassword = 'disp' + randomBytes(6).toString('hex');
  const botName = 'HarnessBot';
  const peerName = 'HarnessPeer';
  const peerPassword = 'peer' + randomBytes(6).toString('hex');
  const worldInstanceId = 'isolated-disposable-377';

  const logPath = path.join(engineDir, 'disposable-e2e-boot.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'w' });

  const serverEnv = {
    ...process.env,
    EASY_STARTUP: 'true',
    NODE_PROFILE: 'joshrs_disposable_e2e',
    DB_BACKEND: 'sqlite',
    NODE_PORT: String(gamePort),
    WEB_PORT: String(webPort),
    WEB_MANAGEMENT_PORT: String(mgmtPort),
    LOGIN_PORT: String(loginPort),
    FRIEND_PORT: String(friendPort),
    LOGGER_PORT: String(loggerPort),
    LOGIN_SERVER: 'true',
    FRIEND_SERVER: 'true',
    LOGGER_SERVER: 'true',
    WEBSITE_REGISTRATION: 'false',
    NODE_PRODUCTION: 'false',
    NODE_XPRATE: '1',
    NODE_CLIENT_ROUTEFINDER: 'false',
    BUILD_SRC_DIR: '../content',
    NODE_DEBUG_SOCKET: 'false',
    RS377_OBSERVER_ENABLED: 'true',
    RS377_OBSERVER_ISOLATED: 'true',
    RS377_OBSERVER_TOKEN: observerToken,
    RS377_OBSERVER_BOT: botName,
    RS377_OBSERVER_WORLD: worldInstanceId,
    RS377_OBSERVER_SOURCE_SHA: PINNED_ENGINE_SHA
  };

  const serverProc = spawn('npm', ['run', 'quickstart'], {
    cwd: engineDir,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });
  serverProc.stdout.pipe(logStream);
  serverProc.stderr.pipe(logStream);

  let session = null;
  let peerSession = null;
  let gateway = null;
  let keepaliveInterval = null;

  try {
    // 1. Wait for game, web, and management ports to listen
    const bootDeadline = Date.now() + 90_000;
    let booted = false;
    while (Date.now() < bootDeadline) {
      if (serverProc.exitCode !== null) {
        throw new Error(`Disposable 377 server exited early with code ${serverProc.exitCode}`);
      }
      const [gUp, wUp, mUp, lUp] = await Promise.all([
        isPortListening(gamePort),
        isPortListening(webPort),
        isPortListening(mgmtPort),
        isPortListening(loginPort)
      ]);
      if (gUp && wUp && mUp && lUp) {
        booted = true;
        break;
      }
      await sleep(500);
    }
    assert.equal(booted, true, 'Disposable 377 server failed to boot within timeout');
    // Allow login worker thread 2.5s startup delay in World.ts to settle
    await sleep(2500);

    // 2. Negative observer checks before bot login
    const unauthObs = await fetch(`http://127.0.0.1:${mgmtPort}/dev/rs377-observe`);
    assert.equal(unauthObs.status, 404, 'Unauthenticated observer request must return 404');

    const badTokenObs = await fetch(`http://127.0.0.1:${mgmtPort}/dev/rs377-observe`, {
      headers: { authorization: 'Bearer wrong-token-value-0000000000000000000000' }
    });
    assert.equal(badTokenObs.status, 404, 'Wrong observer token must return 404');

    const offlineObs = await fetch(`http://127.0.0.1:${mgmtPort}/dev/rs377-observe`, {
      headers: { authorization: `Bearer ${observerToken}` }
    });
    assert.equal(offlineObs.status, 409, 'Observer must return 409 before HarnessBot logs in');

    // 3. Fetch live 36-byte cache CRCs from disposable web port
    const crcRes = await fetch(`http://127.0.0.1:${webPort}/crc`);
    assert.equal(crcRes.status, 200, 'Failed to fetch /crc from disposable web server');
    const crcBuf = Buffer.from(await crcRes.arrayBuffer()).subarray(0, 36);
    assert.equal(crcBuf.length, 36, 'Expected 36-byte CRC table');

    // 4. Negative protocol login tests against real server (wrong RSA key & wrong CRC)
    const wrongRsaPem = generateKeyPairSync('rsa', {
      modulusLength: 1024
    }).publicKey.export({ type: 'spki', format: 'pem' });
    const badRsaSession = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: 'HarnessBadK',
      password: botPassword,
      publicKeyPem: wrongRsaPem,
      crcs: crcBuf,
      timeoutMs: 4000
    });
    await assert.rejects(() => badRsaSession.connect(), /rejected|closed|timeout/i);

    const badCrcBuf = Buffer.from(crcBuf);
    badCrcBuf[0] ^= 0xff;
    const badCrcSession = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: 'HarnessBadC',
      password: botPassword,
      publicKeyPem,
      crcs: badCrcBuf,
      timeoutMs: 4000
    });
    await assert.rejects(() => badCrcSession.connect(), /rejected|closed|timeout/i);

    // 5. Authenticate HarnessBot over real revision-377 TCP protocol
    session = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: botName,
      password: botPassword,
      publicKeyPem,
      crcs: crcBuf,
      timeoutMs: 8000
    });
    const loginResult = await session.connect();
    assert.equal(loginResult.authenticated, true);
    assert.equal(loginResult.response, 2);

    keepaliveInterval = setInterval(() => {
      try {
        if (session?.status().authenticated) {
          session.send({ type: 'keepalive' });
        }
      } catch {}
    }, 3000);

    // Wait 1-2 ticks for World.processLogins() and World.processInfo() to register player
    const observer = createEngine377Observer({
      port: mgmtPort,
      token: observerToken,
      botName,
      expectedWorld: worldInstanceId
    });
    let initialSnapshot = null;
    let lastObsErr = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        initialSnapshot = await observer.observe();
        break;
      } catch (err) {
        lastObsErr = err;
        await sleep(300);
      }
    }
    assert.ok(initialSnapshot, `Failed to retrieve initial server-backed observation: ${lastObsErr?.message ?? 'unknown'}`);
    assert.equal(initialSnapshot.player.username, botName);
    assert.equal(initialSnapshot.world.instanceId, worldInstanceId);
    assert.equal(initialSnapshot.world.revision, 377);
    assert.equal(initialSnapshot.world.tickMs, 600);
    assert.equal(initialSnapshot.world.xpMultiplier, 1);
    assert.equal(initialSnapshot.unsupported.length, 0, 'All observation categories must be populated');
    assert.equal(initialSnapshot.skills.length, 21, 'All 21 skills must be observed');
    const hpSkill = initialSnapshot.skills.find(s => s.name === 'Hitpoints');
    assert.deepEqual(hpSkill, { name: 'Hitpoints', level: 10, baseLevel: 10, xpTenths: 11540 });

    // Convert to pinned RS-SDK BotWorldState
    const initialSdkState = toBotWorldState(initialSnapshot, {
      botName,
      expectedWorld: worldInstanceId
    });
    assert.equal(initialSdkState.state.inGame, true);
    assert.equal(initialSdkState.state.player.name, botName);
    assert.equal(initialSdkState.state.skills.length, 21);

    const startCoord = { ...initialSnapshot.position };
    const startTick = initialSnapshot.tick;

    // 6. Start RS-SDK Runtime and Authenticated Loopback Gateway
    const runtime = createSdk377Runtime({
      session,
      observer,
      botName,
      expectedWorld: worldInstanceId
    });
    gateway = createSdk377Gateway({
      runtime,
      token: gatewayToken,
      botName,
      expectedWorld: worldInstanceId,
      actionTimeoutMs: 6000,
      actionPollMs: 150
    });
    await gateway.listen(gatewayPort);

    // Connect WebSocket controller client to gateway
    const ws = new WebSocket(`ws://127.0.0.1:${gatewayPort}`);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Gateway WS open timeout')), 3000);
      ws.addEventListener('open', () => { clearTimeout(t); resolve(); }, { once: true });
    });

    let latestWsState = null;
    const pendingActions = new Map();
    let connectReply = null;
    let connectResolve = null;
    const connectPromise = new Promise(resolve => { connectResolve = resolve; });

    ws.addEventListener('message', ev => {
      const msg = JSON.parse(String(ev.data));
      if (msg.type === 'sdk_connected') {
        connectReply = msg;
        if (connectResolve) connectResolve(msg);
      } else if (msg.type === 'sdk_state') {
        latestWsState = msg.state;
      } else if (msg.type === 'sdk_action_result' && msg.actionId) {
        const resolver = pendingActions.get(msg.actionId);
        if (resolver) {
          pendingActions.delete(msg.actionId);
          resolver(msg);
        }
      }
    });

    ws.send(JSON.stringify({
      type: 'sdk_connect',
      username: botName,
      password: gatewayToken,
      mode: 'control'
    }));
    await connectPromise;
    assert.equal(connectReply?.success, true);
    assert.equal(connectReply?.mode, 'control');

    let actionCounter = 0;
    const sendGatewayAction = (action, customId = null) => {
      const actionId = customId ?? `e2e-act-${++actionCounter}`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingActions.delete(actionId);
          reject(new Error(`Gateway action timeout for ${actionId}`));
        }, 12000);
        pendingActions.set(actionId, msg => {
          clearTimeout(timer);
          resolve(msg);
        });
        ws.send(JSON.stringify({
          type: 'sdk_action',
          username: botName,
          actionId,
          action
        }));
      });
    };

    // 7. Real Gameplay Acceptance Step 6-10: Issue walkTo on Tutorial Island & verify coordinate change
    const walkTarget1 = { x: startCoord.x, z: startCoord.z + 1 };
    const walkOutcome1 = await sendGatewayAction({
      type: 'walkTo',
      x: walkTarget1.x,
      z: walkTarget1.z,
      running: false,
      reason: 'Walk 1 tile north from spawn to verify real movement'
    });
    assert.equal(walkOutcome1.status, 'verified_success');
    assert.equal(walkOutcome1.verifiedEffect, true);
    assert.equal(walkOutcome1.result.success, true);
    assert.ok(walkOutcome1.observedTick > walkOutcome1.tick);

    const postWalk1 = await runtime.observe();
    assert.equal(postWalk1.position.x, walkTarget1.x);
    assert.equal(postWalk1.position.z, walkTarget1.z);
    assert.ok(postWalk1.tick > startTick);

    // 8. Real NPC Interaction & Guarded Dialogue Selection (RuneScape Guide -> Lumbridge)
    const guideNpc = postWalk1.nearbyNpcs.find(n => /guide/i.test(n.name)) ?? postWalk1.nearbyNpcs[0];
    assert.ok(guideNpc, 'Expected RuneScape Guide NPC in nearbyNpcs');

    const talkOutcome = await sendGatewayAction({
      type: 'talkToNpc',
      npcIndex: guideNpc.index,
      reason: 'Talk to RuneScape Guide'
    });
    assert.equal(talkOutcome.status, 'verified_success');
    assert.equal(talkOutcome.verifiedEffect, true);

    const dlgSnap1 = await runtime.observe();
    assert.equal(dlgSnap1.dialogue.isOpen, true, 'Dialogue must be open after talking to RuneScape Guide');
    assert.ok(dlgSnap1.dialogue.pageId, 'Dialogue pageId must be non-null');
    const continueOpt = dlgSnap1.dialogue.options.find(o => o.index === 0);
    assert.ok(continueOpt, 'Expected continue option (index 0) on initial NPC chat page');

    // Click continue (RESUME_PAUSEBUTTON opcode 226)
    const dlgContinueOutcome = await sendGatewayAction({
      type: 'clickDialogOption',
      optionIndex: 0,
      guard: { pageId: dlgSnap1.dialogue.pageId, componentId: continueOpt.componentId },
      reason: 'Continue to skip-tutorial choice'
    });
    assert.equal(dlgContinueOutcome.status, 'verified_success');
    assert.equal(dlgContinueOutcome.verifiedEffect, true);

    const dlgSnap2 = await runtime.observe();
    assert.equal(dlgSnap2.dialogue.isOpen, true);
    assert.notEqual(dlgSnap2.dialogue.pageId, dlgSnap1.dialogue.pageId, 'Dialogue pageId must advance');
    const yesOpt = dlgSnap2.dialogue.options.find(o => o.index === 1);
    assert.ok(yesOpt, 'Expected option 1 ("Yes please.") on choice dialogue');

    // Verify stale dialogue guard is rejected before selecting the valid option
    const staleDlgOutcome = await sendGatewayAction({
      type: 'clickDialogOption',
      optionIndex: 1,
      guard: { pageId: dlgSnap1.dialogue.pageId, componentId: yesOpt.componentId },
      reason: 'Attempt stale dialogue guard'
    });
    assert.equal(staleDlgOutcome.status, 'rejected');
    assert.equal(staleDlgOutcome.verifiedEffect, false);

    // Select option 1 ("Yes please." -> IF_BUTTON opcode 79 -> completes tutorial to Lumbridge)
    const dlgChoiceOutcome = await sendGatewayAction({
      type: 'clickDialogOption',
      optionIndex: 1,
      guard: { pageId: dlgSnap2.dialogue.pageId, componentId: yesOpt.componentId },
      reason: 'Select Yes please to arrive in Lumbridge with starter kit'
    });
    assert.equal(dlgChoiceOutcome.status, 'verified_success');
    assert.equal(dlgChoiceOutcome.verifiedEffect, true);

    const lumbridgeSnap = await runtime.observe();
    assert.equal(lumbridgeSnap.position.x, 3222);
    assert.equal(lumbridgeSnap.position.z, 3222);
    assert.equal(lumbridgeSnap.position.plane, 0);
    assert.ok(lumbridgeSnap.inventory.length >= 10, 'Expected starter inventory in Lumbridge');

    // 9. Real Walk in Lumbridge Courtyard & out to East Gate Trees
    const lumbridgeWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: 3222,
      z: 3218,
      running: false,
      reason: 'Walk south to central courtyard path'
    });
    assert.equal(lumbridgeWalkOutcome.status, 'verified_success');
    assert.equal(lumbridgeWalkOutcome.verifiedEffect, true);

    const gateWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: 3233,
      z: 3218,
      running: true,
      reason: 'Run east out Lumbridge Castle courtyard gate'
    });
    assert.equal(gateWalkOutcome.status, 'verified_success');
    assert.equal(gateWalkOutcome.verifiedEffect, true);
    const afterLumbridgeWalk = await runtime.observe();
    assert.equal(afterLumbridgeWalk.position.x, 3233);
    assert.equal(afterLumbridgeWalk.position.z, 3218);

    // 10. Real Inventory Interaction (Equip Bronze sword via OPHELD2 opcode 24, keeping Bronze axe in inventory)
    const wieldableItem = afterLumbridgeWalk.inventory.find(
      i => /sword|dagger/i.test(i.name) && i.optionsWithIndex.some(o => o.opIndex === 2 && /wield|wear/i.test(o.text))
    ) ?? afterLumbridgeWalk.inventory.find(
      i => i.optionsWithIndex.some(o => o.opIndex === 2 && /wield|wear/i.test(o.text))
    );
    assert.ok(wieldableItem, 'Expected wieldable starter item in inventory');
    const equipOutcome = await sendGatewayAction({
      type: 'useInventoryItem',
      slot: wieldableItem.slot,
      optionIndex: 2,
      interfaceId: 3214,
      reason: `Equip ${wieldableItem.name}`
    });
    assert.equal(equipOutcome.status, 'verified_success');
    assert.equal(equipOutcome.verifiedEffect, true);
    const afterEquipSnap = await runtime.observe();
    assert.ok(
      afterEquipSnap.equipment.some(e => e.id === wieldableItem.id),
      `Expected ${wieldableItem.name} to be observed in equipment`
    );

    // 11. Real Object Interaction (interactLoc OPLOC1 on Tree outside Lumbridge courtyard)
    const treeWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: 3233,
      z: 3225,
      running: true,
      reason: 'Walk to trees north-east of Lumbridge Castle'
    });
    assert.equal(treeWalkOutcome.status, 'verified_success');
    const treeAreaSnap = await runtime.observe();
    const chopLoc = treeAreaSnap.nearbyLocs.find(
      l => l.optionsWithIndex.some(o => o.opIndex === 1 && /chop/i.test(o.text)) && l.x >= 3230
    ) ?? treeAreaSnap.nearbyLocs.find(
      l => l.optionsWithIndex.some(o => o.opIndex === 1 && /chop/i.test(o.text))
    );
    assert.ok(chopLoc, 'Expected choppable Tree in nearbyLocs');

    const chopOutcome = await sendGatewayAction({
      type: 'interactLoc',
      x: chopLoc.x,
      z: chopLoc.z,
      locId: chopLoc.id,
      optionIndex: 1,
      reason: `Chop ${chopLoc.name} at (${chopLoc.x}, ${chopLoc.z})`
    });
    assert.equal(chopOutcome.status, 'verified_success');
    assert.equal(chopOutcome.verifiedEffect, true);

    // Wait 2 ticks explicitly via RS-SDK wait action and no-action via none
    const waitOutcome = await sendGatewayAction({
      type: 'wait',
      ticks: 2,
      reason: 'Wait 2 ticks while chopping'
    });
    assert.equal(waitOutcome.status, 'verified_success');
    assert.equal(waitOutcome.verifiedEffect, true);

    const noneOutcome = await sendGatewayAction({
      type: 'none',
      reason: 'Verify no-op action handling'
    });
    assert.equal(noneOutcome.status, 'verified_success');
    assert.equal(noneOutcome.verifiedEffect, true);

    // 12. Real Ground Item Drop & Pickup Verification (also resets player animation to -1 via anim(null, 0))
    const droppableItem = (await runtime.observe()).inventory.find(i => i.name === 'Pot' || i.name === 'Bucket') ??
      (await runtime.observe()).inventory[0];
    assert.ok(droppableItem, 'Expected droppable item in inventory');
    const dropOutcome = await sendGatewayAction({
      type: 'dropItem',
      slot: droppableItem.slot,
      reason: `Drop ${droppableItem.name} on tile`
    });
    assert.equal(dropOutcome.status, 'verified_success');
    const afterDropSnap = await runtime.observe();
    const droppedGround = afterDropSnap.groundItems.find(g => g.id === droppableItem.id);
    assert.ok(droppedGround, 'Dropped item must appear in observed groundItems for HarnessBot');

    const pickupOutcome = await sendGatewayAction({
      type: 'pickupItem',
      x: droppedGround.x,
      z: droppedGround.z,
      itemId: droppedGround.id,
      reason: `Pick up ${droppedGround.name}`
    });
    assert.equal(pickupOutcome.status, 'verified_success');
    assert.equal(pickupOutcome.verifiedEffect, true);

    // 12b. Real Item-on-Object Interaction (useItemOnLoc opcode 152 OPLOCU: Bronze axe on Tree)
    const postPickupSnap = await runtime.observe();
    const axeItem = postPickupSnap.inventory.find(i => /axe/i.test(i.name));
    const targetTree2 = postPickupSnap.nearbyLocs.find(
      l => l.optionsWithIndex.some(o => o.opIndex === 1 && /chop/i.test(o.text)) && l.x >= 3230
    ) ?? chopLoc;
    let itemOnLocEvidence = null;
    if (axeItem && targetTree2) {
      const useOnLocOutcome = await sendGatewayAction({
        type: 'useItemOnLoc',
        itemSlot: axeItem.slot,
        x: targetTree2.x,
        z: targetTree2.z,
        locId: targetTree2.id,
        reason: `Use ${axeItem.name} on ${targetTree2.name}`
      });
      assert.equal(useOnLocOutcome.status, 'verified_success');
      assert.equal(useOnLocOutcome.verifiedEffect, true);
      itemOnLocEvidence = {
        item: axeItem.name,
        locId: targetTree2.id,
        status: useOnLocOutcome.status,
        observedTick: useOnLocOutcome.observedTick
      };
    }

    const locInteractionEvidence = {
      locId: chopLoc.id,
      name: chopLoc.name,
      x: chopLoc.x,
      z: chopLoc.z,
      status: chopOutcome.status,
      observedTick: chopOutcome.observedTick,
      data: chopOutcome.result?.data ?? null,
      itemOnLoc: itemOnLocEvidence,
      waitStatus: waitOutcome.status,
      noneStatus: noneOutcome.status
    };

    // 13. Second Player Login, Wrong-Password Check & Cross-Player Private Data Isolation
    peerSession = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: peerName,
      password: peerPassword,
      publicKeyPem,
      crcs: crcBuf,
      timeoutMs: 8000
    });
    const peerLogin = await peerSession.connect();
    assert.equal(peerLogin.authenticated, true);
    await sleep(1400);

    // Verify HarnessBot's observation never leaks HarnessPeer's private data
    const isolationSnap = await runtime.observe();
    const rawIsoJson = JSON.stringify(isolationSnap);
    assert.equal(rawIsoJson.includes(peerPassword), false, 'Peer password must never appear in observation');
    assert.equal(rawIsoJson.includes(botPassword), false, 'Bot password must never appear in observation');
    peerSession.close();
    await sleep(1400);

    // Verify wrong password for registered HarnessPeer is rejected with code 3
    const wrongPwPeer = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: peerName,
      password: 'wrongPassword999',
      publicKeyPem,
      crcs: crcBuf,
      timeoutMs: 5000
    });
    await assert.rejects(() => wrongPwPeer.connect(), /rejected with code 3/);

    // 14. Negative Gateway & Observer Security Checks (Replay, Privileged Action, Wrong World)
    const replayOutcome = await sendGatewayAction(
      { type: 'none', reason: 'Replay check' },
      'e2e-act-1'
    );
    assert.equal(replayOutcome.status, 'rejected');
    assert.equal(replayOutcome.result.reason, 'replay_detected');

    const privOutcome = await sendGatewayAction({
      type: 'teleport',
      x: 3200,
      z: 3200,
      reason: 'Privileged teleport attempt'
    });
    assert.equal(privOutcome.status, 'rejected');
    assert.equal(privOutcome.verifiedEffect, false);

    const wrongWorldObs = createEngine377Observer({
      port: mgmtPort,
      token: observerToken,
      botName,
      expectedWorld: 'isolated-wrong-world'
    });
    await assert.rejects(() => wrongWorldObs.observe(), /wrong world/);

    ws.close();

    // Verify family save was untouched
    if (familySaveBefore !== null) {
      assert.equal(
        fs.statSync(familySavePath).mtimeMs,
        familySaveBefore,
        'Family save elrothiro.sav mtime must remain untouched'
      );
    }

    const finalSdkState = await runtime.getSdkState();
    return {
      ok: true,
      world: initialSnapshot.world,
      login: loginResult,
      initialObservation: {
        tick: startTick,
        position: startCoord,
        skillsCount: initialSnapshot.skills.length,
        hitpoints: hpSkill,
        nearbyNpcsCount: initialSnapshot.nearbyNpcs.length,
        nearbyLocsCount: initialSnapshot.nearbyLocs.length
      },
      tutorialWalk: {
        from: startCoord,
        to: postWalk1.position,
        tickBefore: walkOutcome1.tick,
        tickAfter: walkOutcome1.observedTick,
        status: walkOutcome1.status
      },
      dialogueAndTutorialCompletion: {
        guideNpc: { index: guideNpc.index, id: guideNpc.id, name: guideNpc.name },
        firstPageId: dlgSnap1.dialogue.pageId,
        secondPageId: dlgSnap2.dialogue.pageId,
        staleGuardRejected: staleDlgOutcome.status === 'rejected',
        arrivedPosition: lumbridgeSnap.position,
        starterInventoryCount: lumbridgeSnap.inventory.length
      },
      lumbridgeWalk: {
        from: lumbridgeSnap.position,
        to: afterLumbridgeWalk.position,
        tickBefore: lumbridgeWalkOutcome.tick,
        tickAfter: lumbridgeWalkOutcome.observedTick,
        status: lumbridgeWalkOutcome.status
      },
      equipmentAction: {
        equippedItem: wieldableItem.name,
        status: equipOutcome.status,
        observedEquipment: afterEquipSnap.equipment.map(e => ({ slot: e.slot, id: e.id, name: e.name }))
      },
      locInteraction: locInteractionEvidence,
      dropAndPickup: {
        item: droppableItem.name,
        dropStatus: dropOutcome.status,
        pickupStatus: pickupOutcome.status
      },
      securityChecks: {
        unauthObserverStatus: unauthObs.status,
        badTokenObserverStatus: badTokenObs.status,
        offlineObserverStatus: offlineObs.status,
        wrongRsaRejected: true,
        wrongCrcRejected: true,
        wrongPasswordRejectedCode3: true,
        replayActionRejected: replayOutcome.result.reason === 'replay_detected',
        privilegedActionRejected: privOutcome.status === 'rejected',
        wrongWorldObserverRejected: true,
        crossPlayerSecretLeakage: false,
        familySaveUntouched: true
      },
      finalStateSummary: {
        tick: finalSdkState.state.tick,
        position: {
          x: finalSdkState.state.player.worldX,
          z: finalSdkState.state.player.worldZ,
          level: finalSdkState.state.player.level
        },
        inventoryCount: finalSdkState.state.inventory.length,
        equipmentCount: finalSdkState.state.equipment.length
      }
    };
  } finally {
    if (keepaliveInterval) clearInterval(keepaliveInterval);
    try { peerSession?.close(); } catch {}
    try { session?.close(); } catch {}
    try { await gateway?.close(); } catch {}
    try {
      process.kill(-serverProc.pid, 'SIGTERM');
    } catch {}
    await sleep(800);
    try {
      if (serverProc.exitCode === null) {
        process.kill(-serverProc.pid, 'SIGKILL');
      }
    } catch {}
    logStream.end();
    if (createdWorkspace && !keepWorkspace) {
      try {
        fs.rmSync(createdWorkspace.workRoot, { recursive: true, force: true });
      } catch {}
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let engineDir = process.env.RS377_DISPOSABLE_ENGINE_DIR || null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--engine' && args[i + 1]) {
      engineDir = args[++i];
    }
  }
  runDisposableE2E({ engineDir })
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch(err => {
      console.error('Disposable 377 E2E acceptance test FAILED:', err);
      process.exit(1);
    });
}

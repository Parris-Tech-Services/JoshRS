#!/usr/bin/env node
/**
 * Reproducible End-to-End Disposable Revision-377 Acceptance & Security Harness
 * (Tasks 24 & 25).
 *
 * - Prepares or validates a strictly isolated disposable 377 server in /tmp,
 *   canonicalising every path, rejecting symlinks and protected directories,
 *   and NEVER touching /home/josh/dev/JoshRS/lostcity377 or any family saves.
 * - Boots the real compiled Lost City revision-377 engine on isolated ports.
 * - Authenticates disposable HarnessBot over native 377 TCP (RSA + CRC + ISAAC).
 * - Verifies Task 24 server-backed read-only observations (all 21 skills + XP,
 *   position/plane, non-mutating inventory/equipment, nearby NPCs/locs/groundItems,
 *   honest dialogue state, explicit null for unobserved sdkDetails/questStages,
 *   and cross-player isolation).
 * - Verifies Task 25 RS-SDK mapping adapter, runtime effect verification, and
 *   authenticated WebSocket/HTTP gateways end-to-end (walkTo arrival vs blocked
 *   partial movement, talkToNpc, clickDialogOption with guard, useInventoryItem,
 *   interactLoc, useItemOnLoc, dropItem, pickupItem, wait, none, save/relogin
 *   persistence, and negative security & replay tests).
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createPublicKey, generateKeyPairSync, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Session377 } from './session.mjs';
import { createEngine377Observer } from './engine-observer.mjs';
import { mapSdkAction, toBotWorldState } from './sdk-bridge.mjs';
import { createSdk377Runtime } from './sdk-runtime.mjs';
import { createSdk377Gateway } from './sdk-gateway.mjs';
import { createSdk377WebSocket } from './sdk-websocket.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

const PINNED_ENGINE_SHA = 'b5ac859b47915afb545e60e4c1208f25d43cb3fb';
const PINNED_CONTENT_SHA = '44eab09081ef0f6c5f3eaabd1897a588ad7d9e50';
export const DISPOSABLE_SENTINEL_FILENAME = '.joshrs-disposable-sentinel.json';
export const DISPOSABLE_SENTINEL_PURPOSE = 'joshrs-377-disposable-e2e';

const PROTECTED_SUBSTRINGS = [
  '/home/josh/dev/joshrs',
  '/home/josh/lostcity377',
  '/home/josh/server',
  'lostcity377',
  'elrothiro',
  'sylvie',
  'luna'
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isProtectedPathString(p) {
  const lower = String(p).replace(/\\/g, '/').toLowerCase();
  return PROTECTED_SUBSTRINGS.some(sub => lower.includes(sub));
}

function assertNoSymlinkChain(targetPath, stopAtDir) {
  const abs = path.resolve(targetPath);
  const stop = path.resolve(stopAtDir);
  const rel = path.relative(stop, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Unsafe disposable engine path: ${abs} is outside approved temp root ${stop}`);
  }
  const parts = rel.split(path.sep).filter(Boolean);
  let cur = stop;
  for (const part of parts) {
    cur = path.join(cur, part);
    if (fs.existsSync(cur) || fs.lstatSync(cur, { throwIfNoEntry: false })) {
      const st = fs.lstatSync(cur);
      if (st.isSymbolicLink()) {
        throw new Error(`Unsafe disposable engine path: symbolic link forbidden at ${cur}`);
      }
    }
  }
}

function hasValidSentinel(dir) {
  for (const candidate of [dir, path.dirname(dir)]) {
    const sentinelPath = path.join(candidate, DISPOSABLE_SENTINEL_FILENAME);
    try {
      const st = fs.lstatSync(sentinelPath);
      if (st.isSymbolicLink() || !st.isFile()) continue;
      const parsed = JSON.parse(fs.readFileSync(sentinelPath, 'utf8'));
      if (parsed && parsed.disposable === true && parsed.purpose === DISPOSABLE_SENTINEL_PURPOSE) {
        return true;
      }
    } catch {
      // continue checking
    }
  }
  return false;
}

function assertNoProtectedSaves(engineDir) {
  const playersDir = path.join(engineDir, 'data', 'players');
  if (!fs.existsSync(playersDir)) return;
  const stack = [playersDir];
  while (stack.length > 0) {
    const cur = stack.pop();
    const st = fs.lstatSync(cur);
    if (st.isSymbolicLink()) {
      throw new Error(`Unsafe disposable engine path: symlink inside data/players at ${cur}`);
    }
    if (st.isDirectory()) {
      for (const entry of fs.readdirSync(cur)) {
        stack.push(path.join(cur, entry));
      }
    } else if (cur.endsWith('.sav')) {
      const base = path.basename(cur).toLowerCase();
      if (!base.startsWith('harness')) {
        throw new Error(`Unsafe disposable engine path: protected or non-Harness save file found (${base})`);
      }
    }
  }
}

/**
 * Issue 1 Fix: Canonicalise and validate any disposable engine directory
 * before any file write, RSA generation, web.ts copy, or process startup.
 */
export function validateDisposableEngineDir(candidateDir) {
  if (typeof candidateDir !== 'string' || candidateDir.trim().length === 0) {
    throw new Error('Unsafe disposable engine path: non-empty directory path required');
  }
  if (isProtectedPathString(candidateDir)) {
    throw new Error(`Unsafe disposable engine path: protected path rejected (${candidateDir})`);
  }
  const resolvedInput = path.resolve(candidateDir);
  if (isProtectedPathString(resolvedInput)) {
    throw new Error(`Unsafe disposable engine path: protected path rejected (${resolvedInput})`);
  }
  const inputStat = fs.lstatSync(resolvedInput, { throwIfNoEntry: false });
  if (!inputStat) {
    throw new Error(`Unsafe disposable engine path: directory does not exist (${resolvedInput})`);
  }
  if (inputStat.isSymbolicLink() || !inputStat.isDirectory()) {
    throw new Error(`Unsafe disposable engine path: symbolic link or non-directory rejected (${resolvedInput})`);
  }

  const realTmp = fs.realpathSync(os.tmpdir());
  assertNoSymlinkChain(resolvedInput, realTmp);

  const realCandidate = fs.realpathSync(resolvedInput);
  if (isProtectedPathString(realCandidate)) {
    throw new Error(`Unsafe disposable engine path: canonical path resolves to protected location (${realCandidate})`);
  }
  if (!realCandidate.startsWith(realTmp + path.sep)) {
    throw new Error(`Unsafe disposable engine path: must reside inside ${realTmp} (${realCandidate})`);
  }

  const relToTmp = path.relative(realTmp, realCandidate);
  const topFolder = relToTmp.split(path.sep)[0] ?? '';
  if (!topFolder.startsWith('joshrs-377-disposable-')) {
    throw new Error(
      `Unsafe disposable engine path: top-level temp directory must start with joshrs-377-disposable- (got ${topFolder})`
    );
  }

  if (!hasValidSentinel(realCandidate)) {
    throw new Error(
      `Unsafe disposable engine path: missing verified ${DISPOSABLE_SENTINEL_FILENAME} sentinel in ${realCandidate}`
    );
  }

  // Verify sub-targets (src, src/web.ts, data, data/config) are not symlinks
  for (const sub of ['src', 'src/web.ts', 'data', 'data/config', 'data/players']) {
    const subPath = path.join(realCandidate, sub);
    const st = fs.lstatSync(subPath, { throwIfNoEntry: false });
    if (st && st.isSymbolicLink()) {
      throw new Error(`Unsafe disposable engine path: symlink forbidden at ${subPath}`);
    }
  }

  assertNoProtectedSaves(realCandidate);
  return realCandidate;
}

export function writeDisposableSentinel(dir) {
  const payload = {
    disposable: true,
    purpose: DISPOSABLE_SENTINEL_PURPOSE,
    createdAt: new Date().toISOString(),
    pid: process.pid
  };
  fs.writeFileSync(path.join(dir, DISPOSABLE_SENTINEL_FILENAME), JSON.stringify(payload, null, 2), 'utf8');
}

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
    ['-c', 'git -C "$1" archive "$2" | tar -x -C "$3"', '--', gitDir, commitSha, destDir],
    { stdio: 'pipe' }
  );
}

export function prepareDisposableWorkspace({
  localEngineGit = '/home/josh/dev/JoshRS/lostcity377/engine',
  localContentGit = '/home/josh/dev/JoshRS/lostcity377/content'
} = {}) {
  const realTmp = fs.realpathSync(os.tmpdir());
  const workRoot = fs.mkdtempSync(path.join(realTmp, 'joshrs-377-disposable-'));
  const engineDir = path.join(workRoot, 'engine');
  const contentDir = path.join(workRoot, 'content');

  extractArchive(localEngineGit, PINNED_ENGINE_SHA, engineDir);
  extractArchive(localContentGit, PINNED_CONTENT_SHA, contentDir);

  writeDisposableSentinel(workRoot);
  writeDisposableSentinel(engineDir);

  const validatedEngineDir = validateDisposableEngineDir(engineDir);

  const existingNodeModules = path.join(localEngineGit, 'node_modules');
  const targetNodeModules = path.join(validatedEngineDir, 'node_modules');
  if (fs.existsSync(existingNodeModules) && !fs.existsSync(targetNodeModules)) {
    fs.symlinkSync(existingNodeModules, targetNodeModules, 'dir');
  }

  execFileSync(
    'python3',
    [path.join(REPO_ROOT, 'content-factory/patch_377_haunted.py'), '--content', contentDir, '--apply'],
    { stdio: 'pipe' }
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, 'tools/rs377-bot-bench/engine-patch/src/web.ts'),
    path.join(validatedEngineDir, 'src/web.ts')
  );

  ensureDisposableRsaKeys(validatedEngineDir, { forceRegenerate: true });

  const buildEnv = {
    ...process.env,
    BUILD_SRC_DIR: '../content',
    BUILD_VERIFY: 'true',
    BUILD_VERIFY_PACK: 'true'
  };
  execFileSync('npm', ['run', 'build'], { cwd: validatedEngineDir, env: buildEnv, stdio: 'pipe' });
  execFileSync('npm', ['run', 'sqlite:migrate'], { cwd: validatedEngineDir, env: buildEnv, stdio: 'pipe' });

  return { workRoot, engineDir: validatedEngineDir, contentDir };
}

export function ensureDisposableRsaKeys(engineDir, { forceRegenerate = false } = {}) {
  const validatedDir = validateDisposableEngineDir(engineDir);
  const rsaDir = path.join(validatedDir, 'data', 'config');
  const pubPath = path.join(rsaDir, 'public.pem');
  const privPath = path.join(rsaDir, 'private.pem');
  let needsGen = forceRegenerate || !fs.existsSync(pubPath) || !fs.existsSync(privPath);
  if (!needsGen) {
    try {
      const jwk = createPublicKey(fs.readFileSync(pubPath, 'utf8')).export({ format: 'jwk' });
      const modBytes = Buffer.from(jwk.n ?? '', 'base64url').length;
      if (modBytes < 128) needsGen = true;
    } catch {
      needsGen = true;
    }
  }
  if (needsGen) {
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
  engineDir: suppliedEngineDir = null,
  gamePort = 44394,
  webPort = 48888,
  mgmtPort = 48889,
  loginPort = 44395,
  gatewayPort = 49377,
  httpGatewayPort = 49378,
  keepTemp = false
} = {}) {
  for (const p of [gamePort, webPort, mgmtPort, loginPort, gatewayPort, httpGatewayPort]) {
    assert.equal(
      [43594, 52402, 8888, 45099, 43500].includes(p),
      false,
      `Forbidden production/family port ${p}`
    );
    assert.equal(await isPortListening(p), false, `Isolated test port ${p} is already in use`);
  }

  const familySavePath = '/home/josh/dev/JoshRS/lostcity377/engine/data/players/main/elrothiro.sav';
  const familySaveBefore = fs.existsSync(familySavePath) ? fs.statSync(familySavePath).mtimeMs : null;

  let ownedWorkRoot = null;
  let activeEngineDir;

  if (suppliedEngineDir) {
    activeEngineDir = validateDisposableEngineDir(suppliedEngineDir);
    fs.copyFileSync(
      path.join(REPO_ROOT, 'tools/rs377-bot-bench/engine-patch/src/web.ts'),
      path.join(activeEngineDir, 'src/web.ts')
    );
  } else {
    const prepared = prepareDisposableWorkspace();
    ownedWorkRoot = prepared.workRoot;
    activeEngineDir = prepared.engineDir;
  }

  const { publicKeyPem } = ensureDisposableRsaKeys(activeEngineDir);
  const observerToken = randomBytes(24).toString('hex');
  const gatewayToken = randomBytes(24).toString('hex');
  const botName = 'HarnessBot';
  const botPassword = 'disposablePass377';
  const peerName = 'HarnessPeer';
  const peerPassword = 'peerPass377';
  const worldInstanceId = 'isolated-e2e-377';

  // Ensure clean disposable player saves inside the validated disposable workspace
  const mainSavesDir = path.join(activeEngineDir, 'data', 'players', 'main');
  fs.mkdirSync(mainSavesDir, { recursive: true });
  for (const f of ['harnessbot.sav', 'harnesspeer.sav']) {
    const p = path.join(mainSavesDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const serverEnv = {
    ...process.env,
    NODE_PORT: String(gamePort),
    WEB_PORT: String(webPort),
    WEB_MANAGEMENT_PORT: String(mgmtPort),
    LOGIN_PORT: String(loginPort),
    LOGIN_HOST: '127.0.0.1',
    NODE_WORLD: '99',
    NODE_MEMBERS: 'true',
    NODE_XPRATE: '1',
    NODE_PRODUCTION: 'false',
    DB_BACKEND: 'sqlite',
    SQLITE_DB_PATH: path.join(activeEngineDir, 'db.sqlite'),
    RS377_OBSERVER_ENABLED: 'true',
    RS377_OBSERVER_ISOLATED: 'true',
    RS377_OBSERVER_TOKEN: observerToken,
    RS377_OBSERVER_BOT: botName,
    RS377_OBSERVER_WORLD: worldInstanceId,
    RS377_OBSERVER_SOURCE_SHA: PINNED_ENGINE_SHA
  };

  let serverProc = null;
  let session = null;
  let peerSession = null;
  let wsGateway = null;
  let httpGateway = null;
  let keepaliveInterval = null;
  const serverLogs = [];

  try {
    serverProc = spawn('npx', ['tsx', 'src/app.ts'], {
      cwd: activeEngineDir,
      env: serverEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    serverProc.stdout.on('data', chunk => serverLogs.push(chunk.toString('utf8')));
    serverProc.stderr.on('data', chunk => serverLogs.push(chunk.toString('utf8')));

    let booted = false;
    for (let i = 0; i < 60; i++) {
      const [gUp, wUp, mUp] = await Promise.all([
        isPortListening(gamePort),
        isPortListening(webPort),
        isPortListening(mgmtPort)
      ]);
      if (gUp && wUp && mUp) {
        booted = true;
        break;
      }
      await sleep(500);
    }
    assert.equal(booted, true, `Disposable 377 server failed to boot:\n${serverLogs.join('').slice(-1200)}`);
    await sleep(1500);

    // 1. Negative observer checks before bot login
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

    // 2. Fetch live 36-byte cache CRCs from disposable web port
    const crcRes = await fetch(`http://127.0.0.1:${webPort}/crc`);
    assert.equal(crcRes.status, 200, 'Failed to fetch /crc from disposable web server');
    const crcBuf = Buffer.from(await crcRes.arrayBuffer()).subarray(0, 36);
    assert.equal(crcBuf.length, 36, 'Expected 36-byte CRC table');

    // 3. Negative protocol login tests against real server (wrong RSA key & wrong CRC)
    const { publicKey: wrongRsaPem } = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });
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

    // 4. Authenticate HarnessBot over real revision-377 TCP protocol
    const startConnectSession = async () => {
      const s = new Session377({
        target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
        username: botName,
        password: botPassword,
        publicKeyPem,
        crcs: crcBuf,
        timeoutMs: 8000
      });
      const res = await s.connect();
      assert.equal(res.authenticated, true);
      assert.equal(res.response, 2);
      return { s, res };
    };

    const firstConn = await startConnectSession();
    session = firstConn.s;
    const loginResult = firstConn.res;

    keepaliveInterval = setInterval(() => {
      try {
        if (session?.status().authenticated) {
          session.send({ type: 'keepalive' });
        }
      } catch {}
    }, 3000);

    const observer = createEngine377Observer({
      port: mgmtPort,
      token: observerToken,
      botName,
      expectedWorld: worldInstanceId
    });

    const observeNextTick = async () => {
      for (let attempt = 0; attempt < 15; attempt++) {
        try {
          return await observer.observe();
        } catch (err) {
          if (!String(err.message).includes('replayed_native_observation') || attempt === 14) {
            throw err;
          }
          await sleep(160);
        }
      }
      return observer.observe();
    };

    let initialSnapshot = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        initialSnapshot = await observer.observe();
        break;
      } catch {
        await sleep(300);
      }
    }
    assert.ok(initialSnapshot, 'Failed to retrieve initial server-backed observation');
    assert.equal(initialSnapshot.player.username, botName);
    assert.equal(initialSnapshot.world.instanceId, worldInstanceId);
    assert.equal(initialSnapshot.world.revision, 377);
    assert.equal(initialSnapshot.world.tickMs, 600);
    assert.equal(initialSnapshot.world.xpMultiplier, 1);
    assert.equal(initialSnapshot.skills.length, 21, 'All 21 skills must be observed');
    const hpSkill = initialSnapshot.skills.find(s => s.name === 'Hitpoints');
    assert.deepEqual(hpSkill, { name: 'Hitpoints', level: 10, baseLevel: 10, xpTenths: 11540 });

    // Issue 3 verification: unobserved sdkDetails and questStages are explicit null,
    // and toBotWorldState refuses to publish a fabricated BotWorldState.
    assert.equal(initialSnapshot.sdkDetails, null, 'sdkDetails must be explicit null when not genuinely observed');
    assert.equal(initialSnapshot.questStages, null, 'questStages must be explicit null');
    assert.deepEqual(initialSnapshot.unsupported, ['questStages', 'sdkDetails']);
    assert.throws(
      () => toBotWorldState(initialSnapshot, { botName, expectedWorld: worldInstanceId }),
      /incomplete|sdkDetails/
    );

    // Issue 8 verification: repeated observations do not allocate or mutate inventory/state
    await sleep(680);
    const secondSnapshot = await observer.observe();
    assert.ok(secondSnapshot.tick > initialSnapshot.tick);
    assert.deepEqual(secondSnapshot.inventory, initialSnapshot.inventory);
    assert.deepEqual(secondSnapshot.equipment, initialSnapshot.equipment);
    assert.equal(secondSnapshot.dialogue.optionTextAvailable, false);

    const startCoord = { ...initialSnapshot.position };
    const startTick = initialSnapshot.tick;

    // 5. Start RS-SDK Runtime, HTTP Gateway, and WebSocket Gateway
    let runtime = createSdk377Runtime({
      session,
      observer,
      botName,
      expectedWorld: worldInstanceId
    });

    httpGateway = createSdk377Gateway({
      runtime,
      token: gatewayToken
    });
    await httpGateway.listen(httpGatewayPort);

    // Verify HTTP gateway refuses incomplete sdk_state with 409
    const httpStateRes = await fetch(`http://127.0.0.1:${httpGatewayPort}/sdk_state`, {
      headers: { authorization: `Bearer ${gatewayToken}` }
    });
    assert.equal(httpStateRes.status, 409, 'HTTP gateway must return 409 when BotWorldState is incomplete');

    wsGateway = createSdk377WebSocket({
      runtime,
      botName,
      token: gatewayToken,
      actionTimeoutMs: 12000,
      pollIntervalMs: 650
    });
    await wsGateway.listen(gatewayPort);

    const ws = new WebSocket(`ws://127.0.0.1:${gatewayPort}/gateway`);
    const wsMessages = [];
    const pendingActions = new Map();
    let connectReply = null;
    let connectResolve = null;
    const connectPromise = new Promise(resolve => { connectResolve = resolve; });

    ws.addEventListener('message', ev => {
      const msg = JSON.parse(String(ev.data));
      wsMessages.push(msg);
      if (msg.type === 'sdk_connected') {
        connectReply = msg;
        if (connectResolve) connectResolve(msg);
      } else if (msg.type === 'sdk_action_result' && msg.actionId) {
        const resolver = pendingActions.get(msg.actionId);
        if (resolver) {
          pendingActions.delete(msg.actionId);
          resolver(msg);
        }
      }
    });

    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Gateway WS open timeout')), 3000);
      ws.addEventListener('open', () => { clearTimeout(t); resolve(); }, { once: true });
    });

    ws.send(JSON.stringify({
      type: 'sdk_connect',
      username: botName,
      password: gatewayToken,
      clientId: 'disposable-e2e-controller',
      mode: 'control'
    }));
    await connectPromise;
    assert.equal(connectReply?.success, true);
    await sleep(200);
    assert.equal(
      wsMessages.some(m => m.type === 'sdk_error' && m.error === 'authoritative_sdk_state_incomplete'),
      true,
      'WebSocket gateway must emit authoritative_sdk_state_incomplete rather than fake sdk_state'
    );
    assert.equal(wsMessages.some(m => m.type === 'sdk_state'), false, 'WebSocket gateway must not emit fake sdk_state');

    let actionCounter = 0;
    const sendGatewayAction = (action, customId = null) => {
      const actionId = customId ?? `e2e-act-${++actionCounter}`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingActions.delete(actionId);
          reject(new Error(`Gateway action timeout for ${actionId}`));
        }, 15000);
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

    // 6. Issue 4 Live Server Verification: Partial movement blocked by wall must NOT report success
    const blockedWalkTarget = { x: startCoord.x, z: startCoord.z + 8 };
    const blockedWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: blockedWalkTarget.x,
      z: blockedWalkTarget.z,
      running: false,
      reason: 'Walk toward tile outside closed Tutorial Island starting house wall'
    });
    assert.equal(blockedWalkOutcome.result.success, false, 'Blocked/partial walk must not report success');
    assert.ok(
      ['partial_movement_blocked', 'unreachable_or_blocked'].includes(blockedWalkOutcome.result.reason),
      `Expected partial_movement_blocked or unreachable_or_blocked, got ${blockedWalkOutcome.result.reason}`
    );

    // 7. Real Gameplay Acceptance: Walk to exact reachable tile next to RuneScape Guide & verify arrival
    const guideSnapBefore = await observeNextTick();
    const guideNpc = guideSnapBefore.nearbyNpcs.find(n => /guide/i.test(n.name ?? '')) ?? guideSnapBefore.nearbyNpcs[0];
    assert.ok(guideNpc, 'Expected RuneScape Guide NPC in nearbyNpcs');

    const walkTarget1 = { x: startCoord.x, z: startCoord.z + 1 };
    const walkOutcome1 = await sendGatewayAction({
      type: 'walkTo',
      x: walkTarget1.x,
      z: walkTarget1.z,
      running: false,
      reason: 'Walk to exact reachable tile (3094, 3108)'
    });
    assert.equal(walkOutcome1.result.success, true);
    assert.equal(walkOutcome1.result.phase, 'completion');
    assert.equal(walkOutcome1.result.data.verifiedEffect, true);
    assert.ok(walkOutcome1.result.data.endTick > walkOutcome1.result.data.startTick);

    const postWalk1 = await observeNextTick();
    assert.equal(postWalk1.position.x, walkTarget1.x);
    assert.equal(postWalk1.position.z, walkTarget1.z);
    assert.ok(postWalk1.tick > startTick);

    // 8. Real NPC Interaction & Guarded Dialogue Selection (RuneScape Guide -> Lumbridge)
    // Note: In unpatched Engine-TS, Npc is a PathingEntity so OPNPC1 natively paths
    // to adjacent operable distance without any prototype modification.
    const talkOutcome = await sendGatewayAction({
      type: 'talkToNpc',
      npcIndex: guideNpc.index,
      reason: 'Talk to RuneScape Guide'
    });
    assert.equal(talkOutcome.result.success, true, `Real NPC interaction did not complete: ${JSON.stringify(talkOutcome.result)}`);
    assert.equal(talkOutcome.result.data?.verifiedEffect, true, `NPC effect not observed: ${JSON.stringify(talkOutcome.result)}`);

    const dlgSnap1 = await observeNextTick();
    assert.equal(dlgSnap1.dialogue.isOpen, true, 'Dialogue must be open after talking to RuneScape Guide');
    assert.equal(dlgSnap1.dialogue.optionTextAvailable, true, 'PAUSE_BUTTON static text must be verified');
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
    assert.equal(dlgContinueOutcome.result.success, true);
    assert.equal(dlgContinueOutcome.result.data.verifiedEffect, true);

    const dlgSnap2 = await observeNextTick();
    assert.equal(dlgSnap2.dialogue.isOpen, true);
    assert.equal(dlgSnap2.dialogue.optionTextAvailable, true, 'IfSetText multi-choice labels must be verified');
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
    assert.equal(staleDlgOutcome.result.success, false);
    assert.equal(staleDlgOutcome.result.reason, 'refused');

    // Select option 1 ("Yes please." -> IF_BUTTON opcode 79 -> completes tutorial to Lumbridge)
    const dlgChoiceOutcome = await sendGatewayAction({
      type: 'clickDialogOption',
      optionIndex: 1,
      guard: { pageId: dlgSnap2.dialogue.pageId, componentId: yesOpt.componentId },
      reason: 'Select Yes please to arrive in Lumbridge with starter kit'
    });
    assert.equal(dlgChoiceOutcome.result.success, true);
    assert.equal(dlgChoiceOutcome.result.data.verifiedEffect, true);

    const lumbridgeSnap = await observeNextTick();
    assert.equal(lumbridgeSnap.position.x, 3222);
    assert.equal(lumbridgeSnap.position.z, 3222);
    assert.equal(lumbridgeSnap.position.plane, 0);
    assert.ok(lumbridgeSnap.inventory.length >= 10, 'Expected starter inventory in Lumbridge');

    // 9. Real Walk in Lumbridge Courtyard & out East Gate
    const lumbridgeWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: 3222,
      z: 3218,
      running: false,
      reason: 'Walk south to central courtyard path'
    });
    assert.equal(lumbridgeWalkOutcome.result.success, true);

    const gateWalkOutcome = await sendGatewayAction({
      type: 'walkTo',
      x: 3233,
      z: 3218,
      running: true,
      reason: 'Run east out Lumbridge Castle courtyard gate'
    });
    assert.equal(gateWalkOutcome.result.success, true);

    const afterLumbridgeWalk = await observeNextTick();
    assert.equal(afterLumbridgeWalk.position.x, 3233);
    assert.equal(afterLumbridgeWalk.position.z, 3218);

    // 10. Real Inventory Interaction (Equip Bronze dagger/sword via OPHELD2 opcode 24)
    const wieldableItem = afterLumbridgeWalk.inventory.find(
      i => /sword|dagger/i.test(i.name ?? '') && i.optionsWithIndex.some(o => o.opIndex === 2 && /wield|wear/i.test(o.text))
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
    assert.equal(equipOutcome.result.success, true);
    assert.equal(equipOutcome.result.data.verifiedEffect, true);

    const afterEquipSnap = await observeNextTick();
    assert.ok(
      afterEquipSnap.equipment.some(e => e.id === wieldableItem.id),
      `Expected ${wieldableItem.name} to be observed in equipment`
    );

    // 11. Real Object Interaction (interactLoc OPLOC1 on Tree at (3234, 3231) without global prototype hooks)
    // Walk to (3234, 3225) and then directly adjacent at (3234, 3230) so inOperableDistance(loc) is true!
    const treeApproach1 = await sendGatewayAction({
      type: 'walkTo',
      x: 3234,
      z: 3225,
      running: true,
      reason: 'Walk north toward trees outside Lumbridge Castle'
    });
    assert.equal(treeApproach1.result.success, true);

    const treeApproach2 = await sendGatewayAction({
      type: 'walkTo',
      x: 3234,
      z: 3230,
      running: true,
      reason: 'Walk adjacent to Tree at (3234, 3231)'
    });
    assert.equal(treeApproach2.result.success, true);

    const treeAreaSnap = await observeNextTick();
    const wcBefore = treeAreaSnap.skills.find(s => s.name === 'Woodcutting')?.xpTenths ?? 0;
    const chopLoc = treeAreaSnap.nearbyLocs.find(
      l => l.x === 3234 && l.z === 3231 && l.optionsWithIndex.some(o => o.opIndex === 1 && /chop/i.test(o.text))
    ) ?? treeAreaSnap.nearbyLocs.find(
      l => l.distance <= 2 && l.optionsWithIndex.some(o => o.opIndex === 1 && /chop/i.test(o.text))
    );
    assert.ok(chopLoc, 'Expected adjacent choppable Tree in nearbyLocs');

    const chopOutcome = await sendGatewayAction({
      type: 'interactLoc',
      x: chopLoc.x,
      z: chopLoc.z,
      locId: chopLoc.id,
      optionIndex: 1,
      reason: `Chop ${chopLoc.name} at (${chopLoc.x}, ${chopLoc.z})`
    });
    assert.equal(chopOutcome.result.success, true, 'Chopping adjacent tree must succeed with real game effect');
    assert.equal(chopOutcome.result.data.verifiedEffect, true);

    const afterChopSnap = await observeNextTick();
    const wcAfter = afterChopSnap.skills.find(s => s.name === 'Woodcutting')?.xpTenths ?? 0;
    const hasLogs = afterChopSnap.inventory.some(i => i.id === 1511 || /logs/i.test(i.name ?? ''));
    assert.ok(wcAfter > wcBefore || hasLogs, 'Expected real Woodcutting XP gain and Logs in inventory after chopping tree');

    // Verify wait and none actions
    const waitOutcome = await sendGatewayAction({
      type: 'wait',
      ticks: 2,
      reason: 'Wait 2 ticks'
    });
    assert.equal(waitOutcome.result.success, true);

    const noneOutcome = await sendGatewayAction({
      type: 'none',
      reason: 'Verify no-op action handling'
    });
    assert.equal(noneOutcome.result.success, true);

    // 12. Real Ground Item Drop & Pickup Verification
    const preDropSnap = await observeNextTick();
    const droppableItem = preDropSnap.inventory.find(i => i.name === 'Pot' || i.name === 'Bucket') ??
      preDropSnap.inventory[0];
    assert.ok(droppableItem, 'Expected droppable item in inventory');
    const dropOutcome = await sendGatewayAction({
      type: 'dropItem',
      slot: droppableItem.slot,
      reason: `Drop ${droppableItem.name} on tile`
    });
    assert.equal(dropOutcome.result.success, true);

    const afterDropSnap = await observeNextTick();
    const droppedGround = afterDropSnap.groundItems.find(g => g.id === droppableItem.id);
    assert.ok(droppedGround, 'Dropped item must appear in observed groundItems for HarnessBot');

    const pickupOutcome = await sendGatewayAction({
      type: 'pickupItem',
      x: droppedGround.x,
      z: droppedGround.z,
      itemId: droppedGround.id,
      reason: `Pick up ${droppedGround.name}`
    });
    assert.equal(pickupOutcome.result.success, true);
    assert.equal(pickupOutcome.result.data.verifiedEffect, true);

    // 13. Negative Gateway & Observer Security Checks (Replay, Privileged Action, Wrong World)
    const replayOutcome = await sendGatewayAction(
      { type: 'none', reason: 'Replay check' },
      'e2e-act-1'
    );
    assert.equal(replayOutcome.result.success, false);
    assert.equal(replayOutcome.result.reason, 'replay');

    const privOutcome = await sendGatewayAction({
      type: 'teleport',
      x: 3200,
      z: 3200,
      reason: 'Privileged teleport attempt'
    });
    assert.equal(privOutcome.result.success, false);
    assert.equal(privOutcome.result.reason, 'refused');

    const wrongWorldObs = createEngine377Observer({
      port: mgmtPort,
      token: observerToken,
      botName,
      expectedWorld: 'isolated-wrong-world'
    });
    await assert.rejects(() => wrongWorldObs.observe(), /wrong world/);

    // 14. Second Player Login, Wrong-Password Check & Cross-Player Private Data Isolation
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

    const isolationSnap = await observeNextTick();
    const rawIsoJson = JSON.stringify(isolationSnap);
    assert.equal(rawIsoJson.includes(peerPassword), false, 'Peer password must never appear in observation');
    assert.equal(rawIsoJson.includes(botPassword), false, 'Bot password must never appear in observation');
    peerSession.close();
    await sleep(2200);

    const wrongPwPeer = new Session377({
      target: { host: '127.0.0.1', port: gamePort, mode: 'isolated' },
      username: peerName,
      password: 'wrongPassword999',
      publicKeyPem,
      crcs: crcBuf,
      timeoutMs: 5000
    });
    await assert.rejects(() => wrongPwPeer.connect(), /rejected with code 3/);

    // 15. Save & Relogin Persistence Verification for HarnessBot
    ws.close();
    session.close();
    await sleep(2500);

    const botSaveFile = path.join(mainSavesDir, 'harnessbot.sav');
    assert.equal(fs.existsSync(botSaveFile), true, 'Expected harnessbot.sav to be persisted in disposable workspace');

    const relogConn = await startConnectSession();
    session = relogConn.s;
    await sleep(1400);
    const relogSnap = await observer.observe();
    assert.equal(relogSnap.position.x, 3234);
    assert.equal(relogSnap.position.z, 3230);
    assert.ok(
      (relogSnap.skills.find(s => s.name === 'Woodcutting')?.xpTenths ?? 0) >= wcAfter,
      'Woodcutting XP must persist across logout/relogin'
    );
    assert.ok(
      relogSnap.equipment.some(e => e.id === wieldableItem.id),
      'Equipped item must persist across logout/relogin'
    );

    if (familySaveBefore !== null) {
      assert.equal(
        fs.statSync(familySavePath).mtimeMs,
        familySaveBefore,
        'Family save elrothiro.sav mtime must remain untouched'
      );
    }

    return {
      ok: true,
      world: initialSnapshot.world,
      login: loginResult,
      initialObservation: {
        tick: startTick,
        position: startCoord,
        skillsCount: initialSnapshot.skills.length,
        hitpoints: hpSkill,
        unsupported: initialSnapshot.unsupported
      },
      blockedWalkVerification: {
        target: blockedWalkTarget,
        success: blockedWalkOutcome.result.success,
        reason: blockedWalkOutcome.result.reason
      },
      tutorialWalk: {
        from: startCoord,
        to: postWalk1.position,
        startTick,
        endTick: postWalk1.tick
      },
      dialogueAndTutorialCompletion: {
        guideNpc: { index: guideNpc.index, id: guideNpc.id, name: guideNpc.name },
        lumbridgeArrival: lumbridgeSnap.position,
        starterItemsCount: lumbridgeSnap.inventory.length
      },
      lumbridgeWalk: {
        from: lumbridgeSnap.position,
        to: afterLumbridgeWalk.position
      },
      inventoryEquip: {
        item: { id: wieldableItem.id, name: wieldableItem.name },
        verifiedInEquipment: true
      },
      treeChopInteraction: {
        loc: { id: chopLoc.id, name: chopLoc.name, x: chopLoc.x, z: chopLoc.z },
        woodcuttingXpBefore: wcBefore,
        woodcuttingXpAfter: wcAfter,
        logsInInventory: hasLogs
      },
      dropAndPickup: {
        item: { id: droppableItem.id, name: droppableItem.name },
        verified: true
      },
      saveAndRelogin: {
        persistedSaveFile: botSaveFile,
        reloginPosition: relogSnap.position,
        reloginWoodcuttingXpTenths: relogSnap.skills.find(s => s.name === 'Woodcutting')?.xpTenths ?? 0
      },
      securityChecks: {
        unauthenticatedObserverHttp: 404,
        wrongTokenObserverHttp: 404,
        incompleteSdkStateHttp: 409,
        wrongRsaRejected: true,
        wrongCrcRejected: true,
        wrongPasswordRejectedCode3: true,
        staleDialogueGuardRejected: true,
        replayActionIdRejected: true,
        privilegedActionRejected: true,
        wrongWorldRejected: true,
        familySaveUntouched: true
      }
    };
  } finally {
    if (keepaliveInterval) clearInterval(keepaliveInterval);
    try { peerSession?.close(); } catch {}
    try { session?.close(); } catch {}
    try { await wsGateway?.close(); } catch {}
    try { await httpGateway?.close(); } catch {}
    if (serverProc && !serverProc.killed) {
      serverProc.kill('SIGTERM');
      await sleep(800);
      if (!serverProc.killed) {
        try { serverProc.kill('SIGKILL'); } catch {}
      }
    }
    if (ownedWorkRoot && !keepTemp) {
      try {
        const validatedOwned = fs.realpathSync(ownedWorkRoot);
        const realTmp = fs.realpathSync(os.tmpdir());
        if (validatedOwned.startsWith(realTmp + path.sep) &&
            path.basename(validatedOwned).startsWith('joshrs-377-disposable-')) {
          fs.rmSync(validatedOwned, { recursive: true, force: true });
        }
      } catch {}
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let suppliedEngineDir = process.env.RS377_DISPOSABLE_ENGINE_DIR ?? null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--engine' && args[i + 1]) {
      suppliedEngineDir = args[++i];
    }
  }
  runDisposableE2E({ engineDir: suppliedEngineDir })
    .then(summary => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Disposable E2E failed:', err);
      process.exit(1);
    });
}

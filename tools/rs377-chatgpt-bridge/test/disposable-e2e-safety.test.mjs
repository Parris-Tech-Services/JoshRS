import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateDisposableEngineDir,
  writeDisposableSentinel,
  ensureDisposableRsaKeys
} from '../src/disposable-e2e.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

test('Issue 1: validateDisposableEngineDir rejects protected family paths, symlinks, missing sentinel, and non-Harness saves before any write', () => {
  for (const forbidden of [
    '',
    '/home/josh/dev/JoshRS',
    '/home/josh/dev/JoshRS/lostcity377/engine',
    '/home/josh/lostcity377/engine',
    '/home/josh/Server',
    os.tmpdir(),
    '/var/tmp'
  ]) {
    assert.throws(
      () => validateDisposableEngineDir(forbidden),
      /Unsafe disposable engine path/,
      `Expected ${forbidden} to be rejected`
    );
  }

  const realTmp = fs.realpathSync(os.tmpdir());

  // 1. Directory in /tmp without joshrs-377-disposable- prefix must be rejected
  const wrongPrefixDir = fs.mkdtempSync(path.join(realTmp, 'other-temp-dir-'));
  try {
    writeDisposableSentinel(wrongPrefixDir);
    assert.throws(
      () => validateDisposableEngineDir(wrongPrefixDir),
      /must start with joshrs-377-disposable-/
    );
  } finally {
    fs.rmSync(wrongPrefixDir, { recursive: true, force: true });
  }

  // 2. Directory with joshrs-377-disposable- prefix but WITHOUT sentinel must be rejected
  const noSentinelRoot = fs.mkdtempSync(path.join(realTmp, 'joshrs-377-disposable-test-'));
  try {
    const engineDir = path.join(noSentinelRoot, 'engine');
    fs.mkdirSync(engineDir, { recursive: true });
    assert.throws(
      () => validateDisposableEngineDir(engineDir),
      /missing verified \.joshrs-disposable-sentinel\.json/
    );
    assert.throws(
      () => ensureDisposableRsaKeys(engineDir),
      /missing verified \.joshrs-disposable-sentinel\.json/
    );
    assert.equal(fs.existsSync(path.join(engineDir, 'data', 'config', 'private.pem')), false);
  } finally {
    fs.rmSync(noSentinelRoot, { recursive: true, force: true });
  }

  // 3. Symlinked engine directory or symlinked src/web.ts must be rejected before any write
  const validRoot = fs.mkdtempSync(path.join(realTmp, 'joshrs-377-disposable-test-'));
  const targetOutside = fs.mkdtempSync(path.join(realTmp, 'outside-target-'));
  try {
    writeDisposableSentinel(validRoot);
    const symlinkEngine = path.join(validRoot, 'symlink-engine');
    fs.symlinkSync(targetOutside, symlinkEngine, 'dir');
    assert.throws(
      () => validateDisposableEngineDir(symlinkEngine),
      /symbolic link/i
    );

    const realEngine = path.join(validRoot, 'engine');
    fs.mkdirSync(path.join(realEngine, 'src'), { recursive: true });
    writeDisposableSentinel(realEngine);

    // Valid disposable engine directory passes
    assert.equal(validateDisposableEngineDir(realEngine), realEngine);

    // Symlinked src/web.ts is rejected
    const victimFile = path.join(targetOutside, 'victim-web.ts');
    fs.writeFileSync(victimFile, 'ORIGINAL_CONTENT', 'utf8');
    fs.symlinkSync(victimFile, path.join(realEngine, 'src', 'web.ts'));
    assert.throws(
      () => validateDisposableEngineDir(realEngine),
      /symlink forbidden/i
    );
    assert.equal(fs.readFileSync(victimFile, 'utf8'), 'ORIGINAL_CONTENT');
    fs.unlinkSync(path.join(realEngine, 'src', 'web.ts'));

    // Non-Harness player save (e.g. elrothiro.sav) inside data/players is rejected
    const mainSaves = path.join(realEngine, 'data', 'players', 'main');
    fs.mkdirSync(mainSaves, { recursive: true });
    fs.writeFileSync(path.join(mainSaves, 'elrothiro.sav'), 'protected', 'utf8');
    assert.throws(
      () => validateDisposableEngineDir(realEngine),
      /protected or non-Harness save file/i
    );
    fs.unlinkSync(path.join(mainSaves, 'elrothiro.sav'));

    // HarnessBot save is permitted
    fs.writeFileSync(path.join(mainSaves, 'harnessbot.sav'), 'disposable', 'utf8');
    assert.equal(validateDisposableEngineDir(realEngine), realEngine);
  } finally {
    fs.rmSync(validRoot, { recursive: true, force: true });
    fs.rmSync(targetOutside, { recursive: true, force: true });
  }
});

test('Issues 2, 3 & 8: engine-patch/src/web.ts has zero global prototype patches, non-mutating invs reads, no stringLocals, and no invented sdkDetails', () => {
  const webTsPath = path.join(repoRoot, 'tools/rs377-bot-bench/engine-patch/src/web.ts');
  const rawSource = fs.readFileSync(webTsPath, 'utf8');
  const codeOnly = rawSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  assert.equal(/Player\.prototype/.test(codeOnly), false, 'web.ts must never modify Player.prototype');
  assert.equal(/NetworkPlayer\.prototype/.test(codeOnly), false, 'web.ts must never modify NetworkPlayer.prototype');
  assert.equal(/\.getInventory\s*\(/.test(codeOnly), false, 'web.ts must not call mutating bot.getInventory()');
  assert.equal(/stringLocals/.test(codeOnly), false, 'web.ts must never infer dialogue options from stringLocals');
  assert.equal(/bot\.invs\.get\(InvType\.INV\)/.test(codeOnly), true, 'web.ts must read bot.invs.get(InvType.INV)');
  assert.equal(/bot\.invs\.get\(InvType\.WORN\)/.test(codeOnly), true, 'web.ts must read bot.invs.get(InvType.WORN)');
  assert.equal(/questStages:\s*null/.test(codeOnly), true, 'web.ts must report questStages: null when unobserved');
  assert.equal(/sdkDetails:\s*null/.test(codeOnly), true, 'web.ts must report sdkDetails: null rather than inventing SDK fields');
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { classifySaveAge, inspectSaves } from './check-autosave.mjs';

const MIN = 60_000;
test('15 minute interval with 5 minute grace', () => {
  assert.equal(classifySaveAge(15 * MIN), 'WITHIN_AUTOSAVE_WINDOW');
  assert.equal(classifySaveAge(20 * MIN), 'WITHIN_AUTOSAVE_WINDOW');
  assert.equal(classifySaveAge(20 * MIN + 1), 'OLDER_THAN_AUTOSAVE_WINDOW');
  assert.equal(classifySaveAge(-1), 'CLOCK_OR_FILE_TIME_ANOMALY');
});

test('inspects a disposable save without mutating it', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-save-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const engine = path.join(root, 'engine');
  const players = path.join(engine, 'data', 'players', 'main');
  fs.mkdirSync(path.join(root, 'runtime', 'jparris-377'), { recursive: true });
  fs.mkdirSync(players, { recursive: true });
  fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), '\ufeff'+JSON.stringify({engine}));
  const save = path.join(players, 'testplayer.sav');
  fs.writeFileSync(save, 'NOT-A-REAL-SAVE');
  const now = new Date('2026-11-10T03:00:00Z');
  const when = new Date(now.getTime() - 21 * MIN);
  fs.utimesSync(save, when, when);
  const before = fs.readFileSync(save);
  const results = inspectSaves(root, ['testplayer', 'missing'], now.getTime());
  assert.equal(results[0].status, 'OLDER_THAN_AUTOSAVE_WINDOW');
  assert.equal(results[0].ageMinutes, 21);
  assert.equal(results[1].status, 'SAVE_FILE_MISSING');
  assert.deepEqual(fs.readFileSync(save), before);
  assert.throws(() => inspectSaves(root, ['../private'], now.getTime()), /Invalid account/);
});

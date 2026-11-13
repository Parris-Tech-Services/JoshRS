import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchMap, patchScript, inspectTarget } from './apply-level0-crossing.mjs';

const mapFixture = '==== MAP ====\n0 1 1: h1\n==== LOC ====\n0 1 1: 4334 22\n==== NPC ====\n';
const scriptFixture = '[oploc1,loc_2296]\nif(stat(agility) < 20) return;\n';

test('adds two reachable plane-0 log ends and a 48-Agility two-way script', () => {
    const map = patchMap(mapFixture);
    assert.match(map, /==== LOC ====\n0 34 7: 9324 22\n0 34 14: 9322 22\n/);
    const script = patchScript(scriptFixture);
    assert.match(script, /\[oploc1,loc_9322\] @sinclair_log_balance;/);
    assert.match(script, /\[oploc1,loc_9323\] @sinclair_log_balance;/);
    assert.match(script, /\[oploc1,loc_9324\] @sinclair_log_balance;/);
    assert.match(script, /stat\(agility\) < 48/);
    assert.match(script, /p_teleport\(1_42_56_34_9\)/);
    assert.match(script, /p_teleport\(0_42_56_34_14\)/);
    assert.match(script, /p_teleport\(0_42_56_34_6\)/);
    assert.throws(() => patchMap(map), /already present/);
    assert.throws(() => patchScript(script), /already present/);
});

test('fails closed on map/script source drift', () => {
    assert.throws(() => patchMap(mapFixture.replace('==== LOC ====', '==== NOLOC ====')), /Map source drift/);
    assert.throws(() => patchScript('[oploc1,other]\n'), /Script source drift/);
});

test('dry run is read-only and active runtime paths are refused', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-sinclair-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const clone = path.join(root, 'clone');
    const live = path.join(root, 'runtime', 'jparris-377', 'content');
    const mapFile = path.join(clone, 'maps', 'm42_56.jm2');
    const scriptFile = path.join(clone, 'scripts', 'skill_agility', 'scripts', 'shortcuts.rs2');
    fs.mkdirSync(path.dirname(mapFile), { recursive: true });
    fs.mkdirSync(path.dirname(scriptFile), { recursive: true });
    fs.mkdirSync(live, { recursive: true });
    fs.writeFileSync(mapFile, mapFixture);
    fs.writeFileSync(scriptFile, scriptFixture);
    fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ content: live }));

    assert.equal(inspectTarget(root, clone).dryRun, true);
    assert.equal(fs.readFileSync(mapFile, 'utf8'), mapFixture);
    assert.equal(fs.readFileSync(scriptFile, 'utf8'), scriptFixture);
    assert.throws(() => inspectTarget(root, live, true), /REFUSED/);

    assert.equal(inspectTarget(root, clone, true).dryRun, false);
    assert.match(fs.readFileSync(mapFile, 'utf8'), /0 34 7: 9324 22/);
    assert.match(fs.readFileSync(scriptFile, 'utf8'), /sinclair_log_balance/);
    assert.throws(() => inspectTarget(root, clone, true), /already present/);
});

// Regression tests for the quest-port parsers. Each case is a silent false-pass found in review.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parsePack, defNames, parseMapRefs, handlerRefs, parseManifest } from '../tools/questops/lib/rs-refs.mjs';

test('definition names may contain +', () => {
    assert.deepEqual(defNames('[mmsnailpoint_red+black]\nmodel=1\n[plain]\n'), ['mmsnailpoint_red+black', 'plain']);
});

test('map records keep id 0 and handle CRLF and loc type/rotation', () => {
    const r = parseMapRefs('==== NPC ====\r\n0 1 2: 0\r\n1 9 19: 2079\r\n==== LOC ====\r\n0 3 4: 1234 10 2\r\n==== OBJ ====\r\n0 5 5: 995 100\r\n');
    assert.deepEqual([...r.npc], [0, 2079]);
    assert.deepEqual([...r.loc], [1234]);
    assert.deepEqual([...r.obj], [995]);
});

test('handlers: op and ap, numbered, u and t forms, ground objects, + in names', () => {
    const r = handlerRefs('[opnpc1,sigmund]\n[apnpc1,ur_tag]\n[opnpcu,mistag]\n[opnpct,magic_target]\n[oplocu,mmsnailpoint_red+black]\n[aploc2,gate]\n[opheld1,lamp]\n[opobj3,golem_statuette]\n');
    assert.deepEqual(r.npc.sort(), ['magic_target', 'mistag', 'sigmund', 'ur_tag']);
    assert.deepEqual(r.loc.sort(), ['gate', 'mmsnailpoint_red+black']);
    assert.deepEqual(r.obj.sort(), ['golem_statuette', 'lamp']);
});

test('pack parsing tolerates CRLF', () => {
    assert.equal(parsePack('0=hans\r\n2079=lost_tribe_sigmund\r\n').get(2079), 'lost_tribe_sigmund');
});

function fixture({ targetPack, sourcePack, defs = '[hans]\n', manifest = 'm50_50.jm2 x\n' }) {
    const dir = mkdtempSync(join(tmpdir(), 'mapint-'));
    for (const [side, pack] of [['t', targetPack], ['s', sourcePack]]) {
        mkdirSync(join(dir, side, 'pack'), { recursive: true });
        mkdirSync(join(dir, side, 'maps'), { recursive: true });
        mkdirSync(join(dir, side, 'scripts'), { recursive: true });
        writeFileSync(join(dir, side, 'pack/npc.pack'), pack);
        writeFileSync(join(dir, side, 'maps/m50_50.jm2'), '==== NPC ====\n0 1 1: 0\n');
    }
    writeFileSync(join(dir, 't', 'scripts/all.npc'), defs);
    if (manifest !== null) writeFileSync(join(dir, 't', 'imported-maps.txt'), manifest);
    return dir;
}
const run = (dir, ...extra) => spawnSync(process.execPath, ['tools/questops/check-map-integrity.mjs', join(dir, 't'), join(dir, 's'), ...extra], { encoding: 'utf8' });

test('integrity check sees id 0 mismatches and fails in --json mode too', () => {
    const dir = fixture({ targetPack: '0=hans\n', sourcePack: '0=someone_else\n' });
    const r = run(dir, '--json');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /0:someone_else->hans/);
});

test('integrity check passes a clean map', () => {
    assert.equal(run(fixture({ targetPack: '0=hans\n', sourcePack: '0=hans\n' })).status, 0);
});

test('native maps sharing a name with the source are not checked', () => {
    // m50_50 differs in meaning between revisions but was never imported, so it is not a mismatch.
    assert.equal(run(fixture({ targetPack: '0=hans\n', sourcePack: '0=someone_else\n', manifest: '# none\n' })).status, 0);
});

test('integrity check refuses to run without a manifest instead of guessing', () => {
    const dir = fixture({ targetPack: '0=hans\n', sourcePack: '0=hans\n', manifest: null });
    assert.equal(run(dir).status, 2);
    assert.equal(run(dir, '--all-shared-names').status, 0);
});

test('record-imported-maps lists only maps absent from the pristine baseline', () => {
    const dir = fixture({ targetPack: '0=hans\n', sourcePack: '0=hans\n', manifest: null });
    writeFileSync(join(dir, 't/maps/m54_48.jm2'), '==== NPC ====\n');
    writeFileSync(join(dir, 's/maps/m54_48.jm2'), '==== NPC ====\n');
    mkdirSync(join(dir, 'base'));
    writeFileSync(join(dir, 'base/m50_50.jm2'), '');
    const r = spawnSync(process.execPath, ['tools/questops/record-imported-maps.mjs', join(dir, 't'), join(dir, 's'), '--baseline', join(dir, 'base')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const m = parseManifest(readFileSync(join(dir, 't/imported-maps.txt'), 'utf8'));
    assert.deepEqual([...m.keys()], ['m54_48.jm2']);
    assert.match(m.get('m54_48.jm2'), /^[0-9a-f]{64}$/);
});

test('port-map-definitions refuses a symbol already registered under another id', (t) => {
    if (spawnSync('python3', ['--version']).status !== 0) return t.skip('python3 not available');
    const dir = fixture({ targetPack: '5=sigmund\n', sourcePack: '2079=sigmund\n2080=new_npc\n', manifest: 'm54_48.jm2 x\n' });
    writeFileSync(join(dir, 't/maps/m54_48.jm2'), '==== NPC ====\n0 1 1: 2079\n0 2 2: 2080\n');
    mkdirSync(join(dir, 's/scripts/_unpack/377'), { recursive: true });
    writeFileSync(join(dir, 's/scripts/_unpack/377/all.npc'), '[sigmund]\nname=Sigmund\n[new_npc]\nname=New\n');
    writeFileSync(join(dir, 't/pack/npc.pack'), '5=sigmund'); // no trailing newline on purpose
    const r = spawnSync('python3', ['tools/questops/port-map-definitions.py', join(dir, 't'), join(dir, 's'), '--kinds', 'npc'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /refused .*2079, 'sigmund', 5/);
    assert.equal(readFileSync(join(dir, 't/pack/npc.pack'), 'utf8'), '5=sigmund\n2080=new_npc\n');
});

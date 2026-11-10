import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tool = (name) => join(repo, 'tools', 'questops', name);

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'questops-regression-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    return { source: join(root, 'source'), target: join(root, 'target') };
}
function put(root, relative, contents) {
    const path = join(root, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
    return path;
}
function run(executable, script, ...args) {
    const p = spawnSync(executable, [tool(script), ...args], { encoding: 'utf8', timeout: 10000 });
    assert.equal(p.error, undefined, String(p.error));
    return p;
}
const npcMap = (lines) => ['==== MAP ====', '==== NPC ====', ...lines, '==== OBJ ====', '==== LOC ====', ''].join('\n');

test('map audit checks ID zero and rejects wrong-identity translated IDs even in JSON mode', (t) => {
    const { source, target } = fixture(t);
    put(source, 'pack/npc.pack', '0=hans\n1=golem\n');
    put(target, 'pack/npc.pack', '0=wrong\n1=wrong_1\n100=other\n');
    for (const root of [target, source]) {
        put(root, 'pack/loc.pack', '');
        put(root, 'pack/obj.pack', '');
    }
    put(target, 'scripts/_unpack/274/all.npc', '[wrong]\n[wrong_1]\n[other]\n');
    put(source, 'maps/m1_1.jm2', npcMap(['0 0 0: 0', '0 0 1: 1']));
    put(target, 'maps/m1_1.jm2', npcMap(['0 0 0: 0', '0 0 1: 100']));
    const p = run('node', 'check-map-integrity.mjs', target, source, '--json');
    assert.equal(p.status, 1, p.stdout + p.stderr);
    const rows = JSON.parse(p.stdout);
    assert.deepEqual(rows[0].mismatch.npc.length, 2, p.stdout);
    assert.match(rows[0].mismatch.npc.join(' '), /0:hans->wrong/);
    assert.match(rows[0].mismatch.npc.join(' '), /100:golem->other/);
});

test('map audit accepts a correctly translated ID after looking up the source spawn position', (t) => {
    const { source, target } = fixture(t);
    put(source, 'pack/npc.pack', '0=hans\n1=golem\n');
    put(target, 'pack/npc.pack', '0=hans\n1=wrong_1\n100=golem\n');
    for (const root of [source, target]) {
        put(root, 'pack/loc.pack', '');
        put(root, 'pack/obj.pack', '');
    }
    put(target, 'scripts/_unpack/274/all.npc', '[hans]\n[wrong_1]\n[golem]\n');
    put(source, 'maps/m1_1.jm2', npcMap(['0 0 0: 0', '0 0 1: 1']));
    put(target, 'maps/m1_1.jm2', npcMap(['0 0 0: 0', '0 0 1: 100']));
    const p = run('node', 'check-map-integrity.mjs', target, source, '--json');
    assert.equal(p.status, 0, p.stdout + p.stderr);
    assert.deepEqual(JSON.parse(p.stdout), []);
});

test('map checker refuses a false clean result when map records are malformed or absent', (t) => {
    const { source, target } = fixture(t);
    for (const root of [source, target]) {
        put(root, 'pack/npc.pack', '1=npc\n');
        put(root, 'pack/loc.pack', '');
        put(root, 'pack/obj.pack', '');
        put(root, 'scripts/_unpack/274/all.npc', '[npc]\n');
    }
    put(source, 'maps/m2_2.jm2', npcMap(['0 0 0: 1']));
    put(target, 'maps/m2_2.jm2', npcMap(['0,0,0:1']));
    let p = run('node', 'check-map-integrity.mjs', target, source, '--json');
    assert.notEqual(p.status, 0, p.stdout);
    put(target, 'maps/m2_2.jm2', npcMap([]));
    p = run('node', 'check-map-integrity.mjs', target, source, '--json');
    assert.notEqual(p.status, 0, p.stdout);
});

test('map translator reuses an existing symbol ID, and running it twice is idempotent', (t) => {
    const { source, target } = fixture(t);
    put(source, 'pack/npc.pack', '1=golem\n');
    put(target, 'pack/npc.pack', '1=someone_else\n100=golem\n');
    put(source, 'scripts/_unpack/377/all.npc', '[golem]\nname=Golem\n');
    put(target, 'scripts/_unpack/274/all.npc', '[someone_else]\n[golem]\n');
    put(source, 'maps/m1_1.jm2', npcMap(['0 0 1: 1']));
    put(target, 'maps/m1_1.jm2', npcMap(['0 0 1: 1']));
    for (let i = 0; i < 2; i++) {
        const p = run('python3', 'translate-map-ids.py', target, source);
        assert.equal(p.status, 0, p.stdout + p.stderr);
    }
    assert.equal((readFileSync(join(target, 'pack/npc.pack'), 'utf8').match(/=golem/g) ?? []).length, 1);
    assert.match(readFileSync(join(target, 'maps/m1_1.jm2'), 'utf8'), /0 0 1: 100/);
});

test('NPC importer finds quest-local definitions and does not duplicate target definitions', (t) => {
    const { source, target } = fixture(t);
    put(source, 'pack/npc.pack', '1907=golem_golem\n');
    put(target, 'pack/npc.pack', '1=old_npc\n');
    put(source, 'scripts/quests/quest_golem/configs/golem.npc', '[golem_golem]\nname=Golem\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.npc', '[golem_golem]\nname=Golem\n');
    put(target, 'scripts/quests/quest_golem/scripts/start.rs2', '[opnpcu,golem_golem]\n');
    put(target, 'scripts/_unpack/274/all.npc', '[old_npc]\n');
    const p = run('python3', 'port-quest-npcs.py', target, source);
    assert.equal(p.status, 0, p.stdout + p.stderr);
    assert.match(readFileSync(join(target, 'pack/npc.pack'), 'utf8'), /1907=golem_golem/);
    assert.doesNotMatch(readFileSync(join(target, 'scripts/_unpack/274/all.npc'), 'utf8'), /golem_golem/);
});

test('quest audit counts quest-local NPC/LOC/OBJ definitions and treats missing entities as blockers', (t) => {
    const { target } = fixture(t);
    put(target, 'pack/npc.pack', '1907=golem_golem\n');
    put(target, 'pack/loc.pack', '6300=golem_gate\n');
    put(target, 'pack/obj.pack', '4600=golem_note\n');
    for (const k of ['varp', 'varbit', 'varn', 'vars']) put(target, 'pack/' + k + '.pack', '');
    put(target, 'scripts/quests/quest_golem/configs/golem.npc', '[golem_golem]\nname=Golem\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.loc', '[golem_gate]\nname=Gate\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.obj', '[golem_note]\nname=Note\n');
    put(target, 'scripts/quests/quest_golem/scripts/start.rs2',
        '[opnpcu,golem_golem]\n[oplocu,golem_gate]\n[opheldu,golem_note]\nquestlist:\nsend_quest_complete\ninv_add\n');
    let p = run('node', 'audit-quest-assets.mjs', target, '--json');
    assert.equal(p.status, 0, p.stderr);
    let row = JSON.parse(p.stdout)[0];
    assert.equal(row.status, 'STRUCTURALLY COMPLETE', p.stdout);
    put(target, 'pack/loc.pack', '');
    p = run('node', 'audit-quest-assets.mjs', target, '--json');
    row = JSON.parse(p.stdout)[0];
    assert.equal(row.status, 'BLOCKED', p.stdout);
    assert.deepEqual(row.missingLoc, ['golem_gate']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = (name) => fileURLToPath(new URL('../tools/questops/' + name, import.meta.url));
function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'joshrs-questops-fix-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    return { source: join(root, 'source'), target: join(root, 'target') };
}
function put(root, path, value) {
    const dest = join(root, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, value);
    return dest;
}
function run(cmd, name, ...args) {
    const result = spawnSync(cmd, [script(name), ...args], { encoding: 'utf8', timeout: 12000 });
    assert.equal(result.error, undefined, String(result.error));
    return result;
}
const map = (npcId) => ['==== MAP ====', '==== NPC ====', '0 0 1: ' + npcId, '==== OBJ ====', '==== LOC ====', ''].join('\n');

test('restoration creates ONLY the text manifest of copied maps, even on dry run', (t) => {
    const { source, target } = fixture(t);
    put(source, 'maps/m1_1.jm2', map(1));
    put(source, 'maps/m2_2.jm2', map(1907));
    put(target, 'maps/m1_1.jm2', map(1));
    let r = run('bash', 'restore-maps.sh', source, target, '--dry-run');
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(existsSync(join(target, 'imported-maps.txt')), false);
    assert.equal(existsSync(join(target, 'maps/imported-from-377.json')), false);
    r = run('bash', 'restore-maps.sh', source, target);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(readFileSync(join(target, 'imported-maps.txt'), 'utf8').split('\n').filter(Boolean).map(s => s.split(' ')[0]), ['m2_2.jm2']);
    assert.equal(existsSync(join(target, 'maps/imported-from-377.json')), false);
    assert.equal(readFileSync(join(target, 'maps/m1_1.jm2'), 'utf8'), map(1));
});

test('map translator reuses an existing correct target entity ID without duplicating its name', (t) => {
    const { source, target } = fixture(t);
    put(source, 'maps/m1_1.jm2', map(1));
    put(target, 'maps/m1_1.jm2', map(1));
    put(target, 'imported-maps.txt', 'm1_1.jm2 fixture\n');
    put(source, 'pack/npc.pack', '1=golem\n');
    put(target, 'pack/npc.pack', '1=sheep\n100=golem\n');
    put(source, 'scripts/_unpack/377/all.npc', '[golem]\nname=Golem\n');
    put(target, 'scripts/_unpack/274/all.npc', '[sheep]\n[golem]\n');
    for (let n = 0; n < 2; n++) {
        const r = run('python3', 'translate-map-ids.py', target, source);
        assert.equal(r.status, 0, r.stdout + r.stderr);
    }
    assert.equal((readFileSync(join(target, 'pack/npc.pack'), 'utf8').match(/=golem/g) ?? []).length, 1);
    assert.match(readFileSync(join(target, 'maps/m1_1.jm2'), 'utf8'), /0 0 1: 100/);
});

test('NPC importer accepts quest-local definitions without adding a duplicate block', (t) => {
    const { source, target } = fixture(t);
    put(source, 'pack/npc.pack', '1907=golem\n');
    put(target, 'pack/npc.pack', '1=old_npc\n');
    put(source, 'scripts/quests/quest_golem/configs/golem.npc', '[golem]\nname=Golem\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.npc', '[golem]\nname=Golem\n');
    put(target, 'scripts/quests/quest_golem/scripts/start.rs2', '[opnpcu,golem]\n');
    put(target, 'scripts/_unpack/274/all.npc', '[old_npc]\n');
    const r = run('python3', 'port-quest-npcs.py', target, source);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(readFileSync(join(target, 'pack/npc.pack'), 'utf8'), /1907=golem/);
    assert.doesNotMatch(readFileSync(join(target, 'scripts/_unpack/274/all.npc'), 'utf8'), /\[golem\]/);
});

test('asset audit detects missing location/item dependencies even if only one is absent', (t) => {
    const { target } = fixture(t);
    put(target, 'pack/npc.pack', '1907=golem\n');
    put(target, 'pack/loc.pack', '6400=gate\n');
    put(target, 'pack/obj.pack', '4600=note\n');
    for (const kind of ['varp', 'varbit', 'varn', 'vars']) put(target, 'pack/' + kind + '.pack', '');
    put(target, 'scripts/quests/quest_golem/configs/golem.npc', '[golem]\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.loc', '[gate]\n');
    put(target, 'scripts/quests/quest_golem/configs/golem.obj', '[note]\n');
    put(target, 'scripts/quests/quest_golem/scripts/start.rs2',
        '[opnpcu,golem]\n[oplocu,gate]\n[opheldu,note]\nquestlist:\nsend_quest_complete\ninv_add\n');
    let r = run('node', 'audit-quest-assets.mjs', target, '--json');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout)[0].status, 'STRUCTURALLY COMPLETE');
    put(target, 'pack/loc.pack', '');
    r = run('node', 'audit-quest-assets.mjs', target, '--json');
    assert.equal(JSON.parse(r.stdout)[0].status, 'BLOCKED');
});

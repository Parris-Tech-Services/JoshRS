// prepack-check predicts packer reference errors statically. Rules come from Engine-TS tools/pack at 274;
// each test is a failure mode seen while porting 377 quests into the 274 dev world.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadContent, check, applyPlan, dedupe } from '../tools/questops/prepack-check.mjs';

function tree(files) {
    const root = mkdtempSync(join(tmpdir(), 'prepack-'));
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(root, 'pack'), { recursive: true });
    for (const [p, body] of Object.entries(files)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), body); }
    return root;
}
const read = (root, p) => readFileSync(join(root, p), 'utf8');

// A minimal 274: one npc with a model and an animation whose frame exists.
const BASE = {
    'pack/model.pack': '10=man_body\n378=woman_head_bun\n',
    'pack/anim.pack': '0=anim_0\n',
    'pack/seq.pack': '0=human_ready\n',
    'pack/npc.pack': '0=hans\n',
    'pack/obj.pack': '0=bread',                          // no trailing newline on purpose
    'pack/loc.pack': '',
    'scripts/_unpack/225/all.seq': '[human_ready]\nframe1=anim_0\n',
    'scripts/_unpack/225/all.npc': '[hans]\nname=Hans\nmodel1=man_body\nreadyanim=human_ready\n',
    'scripts/_unpack/225/all.obj': '[bread]\nname=Bread\n',
    'scripts/_unpack/225/all.varp': '[qp]\ntransmit=yes\n',
    'pack/varp.pack': '0=qp\n',
};
// A 377 that adds a quest: an npc using a renamed model, a new model, and a new animation.
const SOURCE = {
    ...BASE,
    'pack/model.pack': '10=man_body\n378=idk_woman_hair_bun\n900=npc_golem\n',
    'pack/anim.pack': '0=anim_0\n14030=anim_14030\n',
    'pack/seq.pack': '0=human_ready\n50=golem_ready\n51=wave\n',
    'pack/obj.pack': '0=bread\n7=golem_key\n',
    'models/npc/npc_golem.ob2': '',
    'scripts/_unpack/377/all.seq': '[golem_ready]\nframe1=anim_14030\n\n[wave]\nframe1=anim_0\n',
    'scripts/_unpack/377/all.obj': '[golem_key]\nname=Key\n',
    'scripts/general/configs/q.constant': '^golem_complete = 10\n',
    'scripts/shared/scripts/music.rs2': '[label,music_play]\nmes("x");\n',
};
const QUEST = {
    'scripts/quests/quest_golem/configs/golem.npc': '[golem]\nname=Golem\nmodel1=idk_woman_hair_bun\nmodel2=npc_golem\nreadyanim=golem_ready\n',
    'scripts/quests/quest_golem/configs/golem.dbtable': '[golem_table]\ncolumn=key,namedobj\n',
    'scripts/quests/quest_golem/configs/golem.dbrow': '[golem_row]\ntable=golem_table\ndata=key,golem_key\n',
    'scripts/quests/quest_golem/scripts/golem.rs2': '[opnpc1,golem]\nif (%qp = ^golem_complete) {\n    anim(golem_ready, 0);\n    anim(wave, 0);\n    @music_play;\n}\n',
};

test('a clean tree has no findings', () => {
    const r = check(loadContent(tree(BASE)));
    assert.deepEqual([r.duplicates.length, r.broken.length, r.scripts.length, r.packIssues.length], [0, 0, 0, 0]);
});

test('every _unpack revision is live: a name re-added in 274 is a duplicate', () => {
    const root = tree({ ...BASE, 'scripts/_unpack/274/all.varp': '[qp]\nscope=perm\n' });
    const t = loadContent(root);
    assert.equal(t.duplicates.length, 1);
    assert.match(t.duplicates[0].first + t.duplicates[0].second, /225.*274/);
    const log = dedupe(t, loadContent(tree(BASE)));
    assert.match(log[0], /DEDUPED varp \[qp\]: removed scripts\/_unpack\/274\/all\.varp/);
    assert.equal(loadContent(root).duplicates.length, 0);
    assert.match(read(root, 'scripts/_unpack/225/all.varp'), /^\[qp\]/);
});

test('each failure gets its fix class', () => {
    const r = check(loadContent(tree({ ...BASE, ...QUEST })), loadContent(tree(SOURCE)));
    const fix = (name) => r.broken.find((b) => b.name === name);
    assert.equal(fix('idk_woman_hair_bun').fix, 'alias');           // renamed: same id, 274 name differs
    assert.equal(fix('npc_golem').fix, 'copy-model');               // source has the .ob2
    assert.equal(fix('npc_golem').fixable, false);                  // ...but only with --copy-models
    assert.equal(fix('golem_ready').fix, 'drop-property');          // frames missing in 274
    assert.equal(fix('golem_key').fix, 'import-text');              // dbrow data typed namedobj
    assert.equal(fix('wave').fix, 'import-text');                   // seq whose frames exist
    assert.deepEqual(r.scripts.map((x) => `${x.type}:${x.name}:${x.fix}`).sort(), ['constant:golem_complete:import-constant', 'label:music_play:port-script']);
});

test('--apply fixes what it can, logs it, and is idempotent', () => {
    const root = tree({ ...BASE, ...QUEST }), source = loadContent(tree(SOURCE));
    let t = loadContent(root);
    const log = applyPlan(t, source, check(t, source, { copyModels: true }).plan);
    assert.ok(log.some((l) => /^ALIASED .*idk_woman_hair_bun -> woman_head_bun/.test(l)));
    assert.ok(log.some((l) => /^DROPPED .*readyanim=golem_ready/.test(l)));
    assert.ok(log.some((l) => /^NULLED .*animation golem_ready -> null/.test(l)));
    assert.match(read(root, 'scripts/quests/quest_golem/configs/golem.npc'), /model1=woman_head_bun\nmodel2=npc_golem\n\/\/ dropped \(no 274 animation\): readyanim=golem_ready/);
    assert.match(read(root, 'scripts/quests/quest_golem/scripts/golem.rs2'), /anim\(null, 0\);\n    anim\(wave, 0\);/);
    // Source ids are kept when free, and an unterminated pack file is not glued onto.
    assert.equal(read(root, 'pack/obj.pack'), '0=bread\n7=golem_key\n');
    assert.match(read(root, 'pack/seq.pack'), /^51=wave$/m);
    assert.match(read(root, 'pack/npc.pack'), /=golem$/m);
    assert.match(read(root, 'scripts/_ported/configs/ported.constant'), /\^golem_complete = 10/);
    assert.ok(existsSync(join(root, 'models/_ported/npc_golem.ob2')));
    assert.match(read(root, 'pack/model.pack'), /^900=npc_golem$/m);

    t = loadContent(root);
    const again = check(t, source, { copyModels: true });
    assert.equal(again.broken.length, 0);
    assert.equal(again.packIssues.length, 0);
    assert.deepEqual(again.scripts.map((x) => x.name), ['music_play']);           // a script still to port
    assert.deepEqual(applyPlan(t, source, again.plan), []);
});

test('without --copy-models the model is left, and the quest is named for parking', () => {
    const root = tree({ ...BASE, ...QUEST }), src = tree(SOURCE);
    const r = spawnSync(process.execPath, ['tools/questops/prepack-check.mjs', root, '--source', src, '--apply'], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /NEEDS MODEL FILES[\s\S]*npc_golem/);
    assert.match(r.stdout, /park these\): quest_golem/);
    assert.equal(existsSync(join(root, 'models/_ported/npc_golem.ob2')), false);
});

test('the CLI refuses to modify the live world', () => {
    const r = spawnSync(process.execPath, ['tools/questops/prepack-check.mjs', '/home/x/lc274/content', '--source', '/tmp', '--apply'], { encoding: 'utf8' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /refusing --apply on the live world/);
});

// ---- scenario generator
import { npcSpawns, buildScenario } from '../tools/questops/playtest/gen-scenarios.mjs';
import { validateScenario } from '../tools/questops/playtest/scenario.mjs';

test('gen-scenarios: start NPC, its spawn tile and the stage var come from content', () => {
    const root = tree({
        'pack/npc.pack': '7=duke\n8=sigmund\n',
        'pack/varp.pack': '1=lost\n',
        'scripts/_unpack/225/all.varp': '[lost]\nscope=perm\n',
        'maps/m50_50.jm2': '==== MAP ====\n0 0 0: u48\n==== NPC ====\n1 9 19: 8\n1 10 20: 7\n==== OBJ ====\n',
        'scripts/general/scripts/quests.rs2': '[proc,count_questpoints]()(int)\nif (%lost = ^lost_complete) {}\n',
        'scripts/quests/quest_lost/scripts/lost.rs2': '[opnpc1,sigmund]\nif (%lost = 0) { mes("hi"); }\n[opnpc1,duke]\nmes("x");\nif (%lost = ^lost_complete) {}\n',
    });
    const spawns = npcSpawns(root);
    assert.deepEqual(spawns.get('sigmund'), [{ x: 50 * 64 + 9, z: 50 * 64 + 19, level: 1 }]);
    const r = buildScenario(root, 'quest_lost', spawns);
    assert.equal(r.start, 'sigmund');
    assert.equal(r.stageVar, 'lost');
    assert.deepEqual(validateScenario(r.scenario), []);
    assert.deepEqual(r.scenario.steps.slice(0, 2).map((s) => s.do), ['teleport', 'expectNpcNear']);
    assert.equal(r.checkpoints.length, 2);
});

test('selfcheck: refuses the live world, passes a clean tree, fails and names a broken one', () => {
    const run = (...a) => spawnSync(process.execPath, ['tools/questops/selfcheck.mjs', ...a], { encoding: 'utf8' });
    assert.equal(run('/home/x/lc274/content').status, 2);
    const clean = tree({ ...BASE, 'scripts/general/scripts/quests.rs2': '[proc,count_questpoints]()(int)\nreturn(0);\n' });
    const ok = run(clean);
    assert.equal(ok.status, 0, ok.stdout);
    assert.match(ok.stdout, /SKIPPED imported maps\s+no --source/);
    const broken = tree({ ...BASE, 'scripts/general/scripts/quests.rs2': '[proc,count_questpoints]()(int)\nreturn(0);\n', 'scripts/_unpack/225/all.npc': '[hans]\nmodel1=nonexistent\n' });
    const bad = run(broken);
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /FAIL\s+prepack/);
});

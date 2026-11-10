// Every ported quest's stage var must be scope=perm, or progress silently resets at logout.
//
// The audit finds the stage var by searching (compared against a *_complete constant, else what the
// journal reads) rather than by playing. This test pins both the detection and the failure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const script = new URL('../tools/questops/audit-quest-assets.mjs', import.meta.url).pathname;

function world({ perm = true } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'stagevar-'));
    const content = join(root, 'content');
    mkdirSync(join(content, 'scripts/_unpack/274'), { recursive: true });
    mkdirSync(join(content, 'pack'), { recursive: true });
    mkdirSync(join(content, 'scripts/quests/quest_feud/scripts'), { recursive: true });
    writeFileSync(join(content, 'scripts/_unpack/274/all.varp'),
        perm ? '[main_feud_var]\nscope=perm\n' : '[main_feud_var]\ntransmit=yes\n');
    writeFileSync(join(content, 'pack/npc.pack'), '');
    writeFileSync(join(content, 'pack/loc.pack'), '');
    writeFileSync(join(content, 'pack/obj.pack'), '');
    writeFileSync(join(content, 'scripts/quests/quest_feud/scripts/quest_feud.rs2'),
        'if (%main_feud_var = ^feud_complete) {\n~send_quest_complete;\n}\n~stat_advance($stat, 100);\n[if_button,questlist:feud]\n');
    return content;
}

function run(content) {
    return execFileSync('node', [script, content, '--json'], { encoding: 'utf8' });
}

test('a quest whose stage var is permanent is not blocked for persistence', () => {
    const rows = JSON.parse(run(world({ perm: true })));
    const feud = rows.find((r) => r.name === 'quest_feud');
    assert.equal(feud.stageVar, 'main_feud_var');
    assert.equal(feud.stageVarPermanent, true);
    assert.ok(!feud.blockers.some((b) => b.includes('scope=perm')), feud.blockers.join('; '));
});

test('a quest whose stage var is not permanent is reported as blocked', () => {
    const rows = JSON.parse(run(world({ perm: false })));
    const feud = rows.find((r) => r.name === 'quest_feud');
    assert.equal(feud.stageVarPermanent, false);
    assert.ok(feud.blockers.some((b) => b.includes('scope=perm')), feud.blockers.join('; '));
});
